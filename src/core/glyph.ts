/**
 * 字形栅格化 —— 把文字渲染成点阵，再映射成符号画。
 *
 * ── 为什么不能用「均值 + 灰度阶梯」 ──
 * 最初的实现是「每个字符格取平均亮度，再查灰度阶梯」。结果「喜」糊成一团：
 * 平均会把细笔画稀释掉，一格里有 30% 是笔画，均值就掉到接近空白那一档。
 *
 * ── 现在怎么做 ──
 * 用「覆盖率」代替「均值」：统计格子里亮度超过 low 的像素占比。
 * 一条细笔画只覆盖格子 30% 的面积，均值是 0.3 会被判成很浅，
 * 但覆盖率也是 0.3 —— 关键是后续用 gamma 把中低覆盖度整体抬起来，
 * 让「有笔画」和「没笔画」彻底分开，而不是挤在阶梯底部。
 *
 * ── 两种风格 ──
 * · symbol：只用窄字符（. : - = + * # % @），全平台宽度一致，绝对不会被拉伸。
 * · block ：用半格块 ▀▄█，每个字符格编码上下两个像素，纵向分辨率翻倍，最清楚。
 *           代价是 ▀▄█ 属于 East Asian Width = Ambiguous，
 *           在部分中文环境下会被渲染成 2 列宽，作品会横向拉伸。
 */

export type GlyphStyle = 'symbol' | 'block'

export interface GlyphOptions {
  /** 输出列数。行数约为列数的一半（补偿字符 1:2 的宽高比） */
  cols?: number
  style?: GlyphStyle
  /** 渲染外边距，越小字越满，越容易糊边 */
  margin?: number
}

/** 窄字符灰度阶梯：从最浅到最深 */
const SYMBOL_RAMP = ' .:-=+*#%@'

/** 半格块映射 */
const BLOCK_CHARS = { both: '█', top: '▀', bottom: '▄', none: ' ' } as const

/** 判定「这个像素算不算墨」的亮度门槛 */
const INK_LEVEL = 0.12

/** 覆盖率 → 阶梯等级的对比度增益。没有它，细笔画会被压在阶梯最底部 */
const GAMMA = 0.6

/** 半格块的覆盖率门槛：超过这个比例才认为该半格有墨 */
const BLOCK_INK_NEED = 0.34

/**
 * 全图最低墨量门槛。
 *
 * 设备缺少对应字形时（尤其是没有 CJK 字体的环境），Canvas 会把字符画成空白 ——
 * 此时整幅覆盖率恒为 0，硬拼出来只会是一堆空格。
 * 低于此比例即判定渲染失败，返回空串，让上层走兜底而不是输出空白画。
 */
const MIN_INK = 0.0005

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/**
 * 把 text 渲染成符号画。必须在浏览器环境调用（依赖 document + Canvas 2D）。
 * 返回空字符串表示栅格化失败。
 */
export function textToArt(text: string, options: GlyphOptions = {}): string {
  const cols = clamp(Math.round(options.cols ?? 40), 12, 120)
  const style: GlyphStyle = options.style ?? 'symbol'
  const margin = options.margin ?? 0.75

  const chars = Array.from(text.slice(0, 4))
  if (chars.length === 0) return ''

  // 超采样：画布边长固定约 512px，列数越多单个采样格越小但样本量稳定，
  // 这样不同列数的耗时和精度都大致一致。
  const ss = Math.max(4, Math.round(512 / cols))
  const size = cols * ss

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  // 多字时缩小字号，避免字与字挤在一起。
  // 字体链按「各平台常见 CJK 字体」排序，最后兜到 system-ui / 通用 sans-serif，
  // 尽量保证汉字有字形可渲染（缺失时由下面的墨量检测兜底）。
  ctx.font = `${size * margin * (chars.length > 1 ? 0.85 : 1)}px "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "Noto Sans CJK SC", "Noto Sans SC", "Source Han Sans SC", "WenQuanYi Micro Hei", system-ui, sans-serif`

  const slot = size / chars.length
  chars.forEach((ch, i) => {
    let baselineY = size / 2
    try {
      // 用实测墨迹范围居中。直接用 textBaseline='middle' 会整体偏下一到两行，
      // 顶部留白、底部被切。
      const m = ctx.measureText(ch)
      const asc = m.actualBoundingBoxAscent
      const desc = m.actualBoundingBoxDescent
      if (typeof asc === 'number' && typeof desc === 'number' && asc + desc > 0) {
        baselineY = size / 2 + (asc - desc) / 2
      }
    } catch {
      /* 拿不到度量信息就用画布中线当基线 */
    }
    ctx.fillText(ch, slot * (i + 0.5), baselineY)
  })

  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, size, size).data
  } catch {
    // 跨域画布等异常情况下安全退出
    return ''
  }

  /*
   * 采样网格。
   * block 模式纵向按 cols 采样（每两行合并成一个输出行）→ 纵向分辨率翻倍。
   * symbol 模式纵向按 cols/2 采样 → 输出行数就是 cols/2，视觉上接近正方形。
   */
  const sampleRows = style === 'block' ? cols : Math.max(1, Math.round(cols / 2))
  const cellW = size / cols
  const cellH = size / sampleRows
  const coverage = new Float32Array(cols * sampleRows)

  for (let r = 0; r < sampleRows; r++) {
    const y0 = Math.floor(r * cellH)
    const y1 = Math.max(y0 + 1, Math.floor((r + 1) * cellH))
    for (let c = 0; c < cols; c++) {
      const x0 = Math.floor(c * cellW)
      const x1 = Math.max(x0 + 1, Math.floor((c + 1) * cellW))
      let hit = 0
      let n = 0
      for (let y = y0; y < y1; y++) {
        const base = y * size
        for (let x = x0; x < x1; x++) {
          if (data[(base + x) * 4] / 255 > INK_LEVEL) hit++
          n++
        }
      }
      coverage[r * cols + c] = n > 0 ? hit / n : 0
    }
  }

  // 墨量检测：字体缺失导致整幅空白时，直接判定失败
  let inkTotal = 0
  for (let i = 0; i < coverage.length; i++) inkTotal += coverage[i]
  if (inkTotal / coverage.length < MIN_INK) return ''

  const lines: string[] = []

  if (style === 'block') {
    for (let r = 0; r < sampleRows; r += 2) {
      let line = ''
      for (let c = 0; c < cols; c++) {
        const top = coverage[r * cols + c] >= BLOCK_INK_NEED
        const bottom = r + 1 < sampleRows && coverage[(r + 1) * cols + c] >= BLOCK_INK_NEED
        line += top && bottom
          ? BLOCK_CHARS.both
          : top
            ? BLOCK_CHARS.top
            : bottom
              ? BLOCK_CHARS.bottom
              : BLOCK_CHARS.none
      }
      lines.push(line.replace(/\s+$/, ''))
    }
  } else {
    const top = SYMBOL_RAMP.length - 1
    for (let r = 0; r < sampleRows; r++) {
      let line = ''
      for (let c = 0; c < cols; c++) {
        const level = Math.round(Math.pow(coverage[r * cols + c], GAMMA) * top)
        line += SYMBOL_RAMP[clamp(level, 0, top)]
      }
      lines.push(line.replace(/\s+$/, ''))
    }
  }

  // 裁掉首尾空行：复制出去的作品不该以空行开头
  let start = 0
  let end = lines.length
  while (start < end && lines[start].trim() === '') start++
  while (end > start && lines[end - 1].trim() === '') end--

  return lines.slice(start, end).join('\n')
}

/** 当前环境是否支持字形栅格化 */
export function supportsGlyphRaster(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('2d')
  } catch {
    return false
  }
}
