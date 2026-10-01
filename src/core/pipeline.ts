/**
 * 编排层 —— 把意图、策略、校验、策展串成一条流水线。
 *
 *   输入 → ①意图解析 → ②策略分发 → ③生成 → ④校验 → ⑤策展 → 输出
 *
 * 回退链永远不为空：成品库 → 组件拼装 → 字形栅格化 → 现成结果兜底。
 */
import type { AIConfig } from './ai'
import { parseIntentWithAI } from './ai'
import { composeCandidates } from './compose'
import { textToArt, supportsGlyphRaster, type GlyphStyle } from './glyph'
import { normalize } from './lexicon'
import { retrieve } from './retrieve'
import type { ArtKind, Candidate, Emotion, Intent, Subject, Strategy } from './types'
import { hasError, validate } from './validator'
import { lineCount, maxLineWidth } from './width'
import { KAOMOJI } from '../data/kaomoji'

export interface GenerateOptions {
  kind?: ArtKind | 'auto'
  emotions?: Emotion[]
  subjects?: Subject[]
  count?: number
  useAI?: boolean
  aiConfig?: AIConfig | null
}

export interface GenerateResult {
  intent: Intent
  candidates: Candidate[]
  notes: string[]
}

function makeId(art: string): string {
  let h = 5381
  for (let i = 0; i < art.length; i++) h = (h * 33) ^ art.charCodeAt(i)
  return (h >>> 0).toString(36)
}

function toCandidate(art: string, kind: ArtKind, strategy: Strategy, score: number): Candidate {
  const issues = validate(art, {
    // 拼字是「宽 N 列 → 高约 N/2 行」，行数上限得跟着列数走
    maxLines: kind === 'char_art' ? 40 : kind === 'picture_art' ? 24 : 1,
    maxWidth: 64,
    requireAligned: kind === 'picture_art',
    requireBalancedBrackets: strategy === 'compose',
  })
  return {
    id: makeId(art),
    art,
    kind,
    strategy,
    score,
    width: maxLineWidth(art),
    lines: lineCount(art),
    issues,
  }
}

/** 策展：先按策略轮流取，保证多样性；再按分数排 */
function curate(candidates: Candidate[], count: number): Candidate[] {
  const usable = candidates.filter((c) => !hasError(c.issues))

  const seen = new Set<string>()
  const unique: Candidate[] = []
  for (const c of usable) {
    if (seen.has(c.art)) continue
    seen.add(c.art)
    unique.push(c)
  }

  const buckets = new Map<Strategy, Candidate[]>()
  for (const c of unique) {
    const list = buckets.get(c.strategy) ?? []
    list.push(c)
    buckets.set(c.strategy, list)
  }
  for (const list of buckets.values()) list.sort((a, b) => b.score - a.score)

  const order: Strategy[] = ['retrieve', 'compose', 'glyph']
  const out: Candidate[] = []
  let added = true
  while (out.length < count && added) {
    added = false
    for (const s of order) {
      const list = buckets.get(s)
      if (list && list.length > 0) {
        out.push(list.shift() as Candidate)
        added = true
        if (out.length >= count) break
      }
    }
  }
  return out
}

export async function generate(raw: string, opts: GenerateOptions = {}): Promise<GenerateResult> {
  const notes: string[] = []
  const count = opts.count ?? 6

  // ① 意图解析：先跑规则版，再按需让 AI 修正
  let intent: Intent = normalize(raw, { count, kind: opts.kind })

  if (opts.useAI && opts.aiConfig) {
    try {
      const ai = await parseIntentWithAI(raw, opts.aiConfig)
      intent = {
        ...intent,
        ...Object.fromEntries(Object.entries(ai).filter(([, v]) => v !== undefined && v !== null)),
        count,
      } as Intent
      intent.source = 'ai'
      notes.push('已由 AI 解析意图')
    } catch (err) {
      notes.push(`AI 解析失败，已回退到规则解析：${(err as Error).message}`)
    }
  }

  if (opts.kind && opts.kind !== 'auto') intent.kind = opts.kind
  if (opts.emotions && opts.emotions.length > 0) intent.emotions = opts.emotions
  if (opts.subjects && opts.subjects.length > 0) intent.subjects = opts.subjects

  const collected: Candidate[] = []

  // ② 字形栅格化分支：拼字是独立算法
  if (intent.kind === 'char_art') {
    const target = (intent.text ?? raw.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '')).slice(0, 4)
    if (!target) {
      notes.push('没能识别出要拼的字，请写明「拼一个 X」')
    } else if (!supportsGlyphRaster()) {
      notes.push('当前环境不支持 Canvas，无法进行字形栅格化')
    } else {
      /*
       * 给三种：
       *   1/2 窄字符符号画 —— 全平台宽度一致，绝对不会被拉伸，优先
       *   3   半格块      —— 最清楚，但 ▀▄█ 是模糊宽度字符，中文环境下可能被拉宽
       */
      const presets: Array<{ cols: number; style: GlyphStyle; score: number }> = [
        { cols: 40, style: 'symbol', score: 10 },
        { cols: 52, style: 'symbol', score: 9 },
        { cols: 44, style: 'block', score: 9 },
      ]
      for (const p of presets) {
        const art = textToArt(target, { cols: p.cols, style: p.style })
        if (art) collected.push(toCandidate(art, 'char_art', 'glyph', p.score))
      }
    }
  } else {
    // ③a 成品库检索
    const retrieved = retrieve(intent)
    for (const s of retrieved) {
      collected.push(toCandidate(s.entry.art, s.kind, 'retrieve', s.score))
    }

    /*
     * ③b 组件拼装补足。
     *
     * 只在「成品库不够用」时才拼装。
     * 原因：用户点名了「猫」，我们要给的是猫，不是一张随机拼出来的脸 ——
     * 拼装出来的东西不含主体语义，混进去只会稀释结果质量。
     */
    const needCompose =
      intent.kind !== 'picture_art' &&
      (intent.subjects.length === 0 || retrieved.length < count)

    if (needCompose) {
      for (const art of composeCandidates(intent, Math.max(count, 8))) {
        collected.push(toCandidate(art, 'composed', 'compose', 4))
      }
    }
  }

  // ④ 校验在 toCandidate 内完成，⑤ 策展在这里
  const candidates = curate(collected, count)

  if (candidates.length === 0) {
    notes.push(
      intent.kind === 'char_art'
        ? '字形栅格化没有产出结果，已给出通用兜底'
        : '没有找到完全匹配结果，已给出通用兜底',
    )
    const fallback = KAOMOJI.filter((k) => k.emotions.some((x) => intent.emotions.includes(x)))
    const pool = fallback.length > 0 ? fallback : KAOMOJI
    return {
      intent,
      notes,
      candidates: pool.slice(0, count).map((k) => toCandidate(k.art, 'kaomoji', 'retrieve', 1)),
    }
  }

  return { intent, candidates, notes }
}
