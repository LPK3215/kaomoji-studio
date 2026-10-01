/**
 * 校验器 —— 质量闸门，也是「工具化」能成立的前提。
 *
 * 有了它，我们才能保证「同样的输入进来，出去的一定是能直接复制粘贴的」。
 * 也是它把 AI 的自由输出关进了确定性的笼子里。
 */
import type { ValidationIssue } from './types'
import { displayWidth, isVisuallyBalanced, isWidthAligned, lineCount, maxLineWidth } from './width'

export interface ValidationOptions {
  /** 允许的最大行数 */
  maxLines?: number
  /** 允许的最大列宽 */
  maxWidth?: number
  /** 多行是否必须等宽（图案类建议 true） */
  requireAligned?: boolean
  /** 括号是否必须配对（组合生成类建议 true） */
  requireBalancedBrackets?: boolean
}

const DEFAULTS: Required<ValidationOptions> = {
  maxLines: 20,
  maxWidth: 80,
  requireAligned: false,
  requireBalancedBrackets: false,
}

/** 控制字符：会破坏显示甚至被聊天软件吞掉 */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/

/** 私有使用区：99% 的设备上没有字形，会显示成豆腐块 */
const PRIVATE_USE = /[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u

/** 已知在部分设备上会渲染异常、需谨慎的字符 */
const RISKY_CHARS = /[\u2FF0-\u2FFF\u{1D100}-\u{1D1FF}]/u

/**
 * 半格块字符（▀▄█ 及 ░▒▓ 之类）。
 *
 * 它们的 East Asian Width 是 Ambiguous：在纯西文环境算 1 列，
 * 在中文环境下很多输入框会按 2 列渲染 —— 那样整幅画会被横向拉伸一倍。
 * 这不是缺陷，是平台行为差异，只能如实提示。
 */
const AMBIGUOUS_BLOCKS = /[\u2580-\u259F]/

/** 括号配对表：左 → 右 */
const BRACKET_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['(', ')'],
  ['（', '）'],
  ['[', ']'],
  ['【', '】'],
  ['{', '}'],
  ['〈', '〉'],
  ['《', '》'],
  ['༺', '༻'],
  ['༼', '༽'],
  ['⟦', '⟧'],
  ['❨', '❩'],
]

const OPENERS = new Set(BRACKET_PAIRS.map((p) => p[0]))
const CLOSER_TO_OPENER = new Map(BRACKET_PAIRS.map(([o, c]) => [c, o]))

/** 用栈检查括号是否闭合正确（能处理嵌套） */
export function checkBrackets(text: string): ValidationIssue[] {
  const stack: string[] = []
  for (const ch of text) {
    if (OPENERS.has(ch)) {
      stack.push(ch)
    } else {
      const opener = CLOSER_TO_OPENER.get(ch)
      if (!opener) continue
      if (stack.length === 0) {
        return [{ level: 'warn', code: 'bracket.unmatched-close', message: `多余的右括号「${ch}」` }]
      }
      const top = stack.pop() as string
      if (top !== opener) {
        return [
          {
            level: 'warn',
            code: 'bracket.mismatch',
            message: `括号不匹配：「${top}」与「${ch}」`,
          },
        ]
      }
    }
  }
  if (stack.length > 0) {
    return [{ level: 'warn', code: 'bracket.unclosed', message: `未闭合的括号「${stack[stack.length - 1]}」` }]
  }
  return []
}

export function validate(art: string, opts: ValidationOptions = {}): ValidationIssue[] {
  const o = { ...DEFAULTS, ...opts }
  const issues: ValidationIssue[] = []

  if (!art.trim()) {
    issues.push({ level: 'error', code: 'empty', message: '输出为空' })
    return issues
  }

  if (CONTROL_CHARS.test(art)) {
    issues.push({ level: 'error', code: 'char.control', message: '含控制字符，可能导致显示异常' })
  }

  if (PRIVATE_USE.test(art)) {
    issues.push({ level: 'error', code: 'char.private-use', message: '含私有区字符，多数设备显示为方块' })
  }

  if (RISKY_CHARS.test(art)) {
    issues.push({ level: 'warn', code: 'char.risky', message: '含部分设备不支持的特殊字符' })
  }

  if (AMBIGUOUS_BLOCKS.test(art)) {
    issues.push({
      level: 'warn',
      code: 'char.ambiguous-width',
      message: '含半格块字符，部分中文环境下会按 2 列渲染导致横向拉伸',
    })
  }

  const lines = lineCount(art)
  if (lines > o.maxLines) {
    issues.push({ level: 'error', code: 'lines.too-many', message: `行数 ${lines} 超出上限 ${o.maxLines}` })
  }

  const w = maxLineWidth(art)
  if (w > o.maxWidth) {
    issues.push({ level: 'error', code: 'width.too-wide', message: `宽度 ${w} 超出上限 ${o.maxWidth}` })
  }

  // 多行图案：等宽 或 视觉居中 都算合格，两者都不是才提醒
  if (o.requireAligned && lines > 1 && !isWidthAligned(art) && !isVisuallyBalanced(art)) {
    issues.push({ level: 'warn', code: 'lines.misaligned', message: '多行既不宽度对齐也不居中，排版可能歪' })
  }

  if (o.requireBalancedBrackets) {
    issues.push(...checkBrackets(art))
  }

  // 行尾空白：复制时容易带出，提醒一下
  if (art.split('\n').some((l) => /\s+$/.test(l))) {
    issues.push({ level: 'warn', code: 'lines.trailing-space', message: '存在行尾空白，复制时可能被清理' })
  }

  return issues
}

export function hasError(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === 'error')
}

export function formatIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) return '校验通过'
  return issues.map((i) => `${i.level === 'error' ? '✕' : '!'} ${i.message}`).join('\n')
}

/** 便捷方法：单行作品的校验入口 */
export function validateInline(art: string, maxWidth = 60): ValidationIssue[] {
  return validate(art, { maxLines: 1, maxWidth, requireBalancedBrackets: true })
}

export { displayWidth }
