/**
 * 显示宽度计算 —— 整个系统的地基。
 *
 * 为什么绝对不能用 `str.length`：
 *   1. 中文 / 假名 / 全角符号占 2 列，而 `length` 只算 1
 *   2. 组合用记号 (Mn / Me) 占 0 列，`length` 却算 1，例如 `(˘̩̩̩ε˘̩ƪ)` 里的 `̩`
 *   3. VS16 (U+FE0F) 会把「文本呈现」的符号升级成 emoji 呈现，宽度从 1 变 2
 *
 * 没有这个模块，后面所有排版都会歪，而且歪得毫无规律。
 */

/** 零宽字符：组合用记号 + 部分格式控制符 */
const ZERO_WIDTH = /[\p{Mn}\p{Me}\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/u

/** East Asian Width = W / F 的区间表（覆盖颜文字常用字符，按 code point 升序） */
const WIDE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x1100, 0x115f], // Hangul Jamo
  [0x2e80, 0x303e], // CJK 部首 / 康熙部首 / CJK 符号
  [0x3041, 0x33ff], // 假名 / CJK 兼容
  [0x3400, 0x4dbf], // CJK 扩展 A
  [0x4e00, 0x9fff], // CJK 基本区
  [0xa000, 0xa4cf], // 彝文
  [0xa960, 0xa97f], // Hangul Jamo 扩展 A
  [0xac00, 0xd7a3], // 韩文音节
  [0xf900, 0xfaff], // CJK 兼容汉字
  [0xfe10, 0xfe19], // 竖排标点
  [0xfe30, 0xfe6f], // CJK 兼容形式
  [0xff00, 0xff60], // 全角 ASCII
  [0xffe0, 0xffe6], // 全角符号
  [0x1f300, 0x1f64f], // 各类 emoji
  [0x1f680, 0x1f6ff],
  [0x1f900, 0x1f9ff],
  [0x1fa70, 0x1faff],
  [0x20000, 0x2fffd], // CJK 扩展 B 起
  [0x30000, 0x3fffd],
]

function inRanges(cp: number, ranges: ReadonlyArray<readonly [number, number]>): boolean {
  let lo = 0
  let hi = ranges.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const [a, b] = ranges[mid]
    if (cp < a) hi = mid - 1
    else if (cp > b) lo = mid + 1
    else return true
  }
  return false
}

function isZeroWidth(cp: number): boolean {
  return ZERO_WIDTH.test(String.fromCodePoint(cp))
}

/** 单个可见字符的列宽（不含 VS16 升级逻辑，由 displayWidth 统一处理） */
export function codePointWidth(cp: number): number {
  if (isZeroWidth(cp)) return 0
  return inRanges(cp, WIDE_RANGES) ? 2 : 1
}

/** 字符串在等宽环境下的显示列数 */
export function displayWidth(text: string): number {
  const cps: number[] = []
  for (const ch of text) cps.push(ch.codePointAt(0) as number)

  let w = 0
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i]

    // 变体选择符：FE0F 会把前一个窄字符升级为宽字符（emoji 呈现）
    if (cp >= 0xfe00 && cp <= 0xfe0f) {
      if (cp === 0xfe0f && i > 0) {
        const prev = cps[i - 1]
        if (!isZeroWidth(prev) && !inRanges(prev, WIDE_RANGES)) w += 1
      }
      continue
    }

    w += codePointWidth(cp)
  }
  return w
}

export function lineWidths(text: string): number[] {
  return text.split('\n').map(displayWidth)
}

export function lineCount(text: string): number {
  return text.split('\n').length
}

export function maxLineWidth(text: string): number {
  const ws = lineWidths(text)
  let m = 0
  for (const w of ws) if (w > m) m = w
  return m
}

/**
 * 多行是否等宽。
 * 注意：这是「严格等宽」判定，很多经典图案（比如那只兔子）天然不等宽但视觉上没问题，
 * 所以调用方应把它当成 warn 而不是 error。
 */
export function isWidthAligned(text: string): boolean {
  const ws = lineWidths(text)
  if (ws.length <= 1) return true
  const first = ws[0]
  return ws.every((w) => w === first)
}

/**
 * 每行「可见内容」的水平中心（按列宽算）。
 *
 * 为什么要单独算这个：多行图案有两种正确排版方式 ——
 *   1. 严格等宽（比如方框里的一行行字）
 *   2. 视觉居中（比如那只经典兔子，长度不同但中心对齐，看起来完全没问题）
 * 只检查等宽会把第 2 种误判成「排版歪了」。
 */
export function lineCenters(text: string): number[] {
  return text.split('\n').map((line) => {
    const noTrail = line.replace(/\s+$/, '')
    if (!noTrail) return 0
    const leading = noTrail.length - noTrail.replace(/^\s+/, '').length
    return leading + displayWidth(noTrail) / 2
  })
}

/** 多行是否视觉居中（容差按列宽算） */
export function isVisuallyBalanced(text: string, tolerance = 1): boolean {
  const centers = lineCenters(text)
  if (centers.length <= 1) return true
  const first = centers[0]
  return centers.every((c) => Math.abs(c - first) <= tolerance)
}

/** 用列宽做左填充对齐（多行图案排版用） */
export function padToWidth(text: string, target: number, fill = ' '): string {
  return text + fill.repeat(Math.max(0, target - displayWidth(text)))
}
