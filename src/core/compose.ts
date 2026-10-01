/**
 * 组合引擎 —— 策略二：按语法 + 约束拼装出新颜文字。
 *
 * 语法：
 *   [装饰] [左臂] [左括号] [腮红] 左眼 [嘴] 右眼 [腮红] [右括号] [右臂] [装饰]
 *
 * 三条硬约束（生成后不满足就丢弃重来）：
 *   1. 括号必须配对（由 validator 兜底）
 *   2. 左右眼宽度差 <= 2，否则看起来是歪的
 *   3. 手臂必须成对，绝不出现同侧重复
 *
 * 用 seed 驱动的伪随机，保证「同样的输入 → 同样的输出」。
 */
import type { Emotion, Intent } from './types'
import { ARMS, BLUSH, BRACKETS, DECOR, EYES, MOUTHS, NARROW_BRACKETS } from '../data/parts'
import { checkBrackets } from './validator'
import { codePointWidth, displayWidth } from './width'

interface Tagged {
  emotions?: readonly Emotion[]
}

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.min(arr.length - 1, Math.floor(rnd() * arr.length))]
}

/** 用户没说情绪时用的默认基调 —— 别让「生气眼 + 开心嘴」这种组合随出来 */
const DEFAULT_EMOTIONS: readonly Emotion[] = ['happy', 'neutral']

/**
 * 按情绪过滤零件。
 * 命中不足 2 个就退回全集，避免候选之间高度重复。
 */
function pool<T extends Tagged>(items: readonly T[], emotions: readonly Emotion[]): readonly T[] {
  const emo = emotions.length > 0 ? emotions : DEFAULT_EMOTIONS
  const hit = items.filter((it) => it.emotions?.some((x) => emo.includes(x)))
  return hit.length >= 2 ? hit : items
}

/** 括号：优先用最常见的几对，偶尔才上冷门的，避免一屏全是《》 */
function pickBracket(
  rnd: () => number,
  brackets: ReadonlyArray<readonly [string, string]>,
): readonly [string, string] {
  const common = brackets.slice(0, 4)
  return rnd() < 0.85 && common.length > 0 ? pick(rnd, common) : pick(rnd, brackets)
}

function widthOf(text: string): number {
  let w = 0
  for (const ch of text) w += codePointWidth(ch.codePointAt(0) as number)
  return w
}

function buildOne(intent: Intent, rnd: () => number): string {
  const emo = intent.emotions

  const eyePool = pool(EYES, emo)
  const mouthPool = pool(MOUTHS, emo)
  const armPool = pool(ARMS, emo)
  const blushPool = pool(BLUSH, emo)
  const decorPool = pool(DECOR, emo)

  // 先决定有没有手臂，因为它会影响括号的选择
  const arm = rnd() < 0.6 ? pick(rnd, armPool) : null
  const [bl, br] = pickBracket(rnd, arm ? NARROW_BRACKETS : BRACKETS)

  const left = pick(rnd, eyePool).v
  // 70% 对称眼，30% 不对称（不对称时只从宽度接近的里挑，否则看起来是歪的）
  let right = left
  if (rnd() < 0.3) {
    const candidates = eyePool.filter((x) => Math.abs(widthOf(x.v) - widthOf(left)) <= 1)
    if (candidates.length > 0) right = pick(rnd, candidates).v
  }

  const mouth = pick(rnd, mouthPool).v

  const blushL = rnd() < 0.25 ? pick(rnd, blushPool).v : ''
  const blushR = rnd() < 0.25 ? pick(rnd, blushPool).v : ''

  const decorL = rnd() < 0.3 ? pick(rnd, decorPool).v : ''
  const decorR = rnd() < 0.35 ? pick(rnd, decorPool).v : ''

  return (
    decorL +
    (arm ? arm.l : '') +
    bl +
    blushL +
    left +
    mouth +
    right +
    blushR +
    br +
    (arm ? arm.r : '') +
    decorR
  )
}

/** 组合质量的硬门槛 */
function acceptable(art: string): boolean {
  if (checkBrackets(art).length > 0) return false
  if (displayWidth(art) > 40) return false
  if (art.includes('\n')) return false
  return true
}

export function composeCandidates(intent: Intent, n: number): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const maxAttempts = n * 30

  for (let i = 0; i < maxAttempts && out.length < n; i++) {
    const rnd = mulberry32(hash(`${intent.raw}|${intent.kind}|${intent.emotions.join(',')}|${i}`))
    const art = buildOne(intent, rnd)
    if (seen.has(art)) continue
    if (!acceptable(art)) continue
    seen.add(art)
    out.push(art)
  }

  return out
}
