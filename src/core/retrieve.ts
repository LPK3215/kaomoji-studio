/**
 * 检索器 —— 策略一：从成品库里按标签打分挑最好的。
 *
 * 这是「每个都能直接复制粘贴」的首要保障：成品库里的东西都是人工确认过的。
 */
import type { ArtKind, Intent } from './types'
import type { KaomojiEntry } from '../data/kaomoji'
import { KAOMOJI } from '../data/kaomoji'

export interface Scored {
  entry: KaomojiEntry
  score: number
  kind: ArtKind
}

export function kindOf(entry: KaomojiEntry): ArtKind {
  return entry.art.includes('\n') ? 'picture_art' : 'kaomoji'
}

export function scoreEntry(entry: KaomojiEntry, intent: Intent): number {
  let s = 0

  const hasEmotionQuery = intent.emotions.length > 0
  const hasSubjectQuery = intent.subjects.length > 0

  const emotionHits = hasEmotionQuery
    ? entry.emotions.filter((x) => intent.emotions.includes(x)).length
    : 0

  const subjectHits =
    hasSubjectQuery && entry.subjects
      ? entry.subjects.filter((x) => intent.subjects.includes(x)).length
      : 0

  /*
   * 排除规则：情绪和主体一个都没命中才淘汰。
   *
   * 为什么不能只看情绪：「委屈的小狗」里，狗脸的情绪标签是 happy/neutral，
   * 情绪一条都不命中就被淘汰了，结果用户拿到的全是通用哭脸，一只狗都没有。
   * 主体命中有权把条目救回来 —— 用户明确说了狗，狗就比通用的脸更该出现。
   */
  if (hasEmotionQuery && emotionHits === 0 && subjectHits === 0) return 0
  if (!hasEmotionQuery && hasSubjectQuery && subjectHits === 0) return 0

  s += emotionHits * 4
  // 主体权重高于情绪：明确点名了「狗」，就别拿通用脸糊弄
  s += subjectHits * 8

  // 动作匹配：命中加分；条目带动作标记但没命中要扣分
  // （否则「难过」会把 `m(_ _)m` 这种道歉手势排到哭脸前面）
  if (entry.actions && entry.actions.length > 0) {
    if (intent.action && entry.actions.includes(intent.action)) s += 5
    else s -= 2
  }

  s += entry.weight ?? 0

  if (intent.styleHints.length > 0) {
    s += entry.styles.filter((x) => intent.styleHints.includes(x)).length
  }

  const entryKind = kindOf(entry)
  /*
   * 「组合颜文字」是一种意图，不是一个产物类型：
   * 它最终产出的仍然是单行颜文字（成品库里的动作条目也是单行）。
   * 所以这里把 composed 与 kaomoji 视为同类，动作成品条目才能拿到类型加分，
   * 不会被通用拼装结果挤到后面。
   */
  const sameKind = entryKind === intent.kind || (intent.kind === 'composed' && entryKind === 'kaomoji')
  const wantsSingleLine = intent.kind === 'kaomoji' || intent.kind === 'composed'

  // 明确说要「大图」时，图案的优先级必须压倒单行颜文字，否则会被单行的挤到后面
  if (sameKind) s += intent.kind === 'picture_art' ? 8 : 3
  if (wantsSingleLine && entryKind === 'picture_art') s -= 4
  if (intent.kind === 'picture_art' && entryKind === 'kaomoji') s -= 6

  return s
}

export function retrieve(intent: Intent, pool: readonly KaomojiEntry[] = KAOMOJI): Scored[] {
  const scored: Scored[] = []
  for (const entry of pool) {
    const score = scoreEntry(entry, intent)
    if (score > 0) scored.push({ entry, score, kind: kindOf(entry) })
  }
  // 按分数降序；同分时按 id 稳定排序，保证「同样输入 → 同样输出」
  scored.sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
  return scored
}
