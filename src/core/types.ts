/** 作品粒度 —— 四种东西的生成方式完全不同，必须分开。 */
export type ArtKind = 'kaomoji' | 'composed' | 'char_art' | 'picture_art'

export type Emotion =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'love'
  | 'shy'
  | 'confused'
  | 'tired'
  | 'smug'
  | 'cry'
  | 'neutral'

export type Subject = 'cat' | 'rabbit' | 'bear' | 'dog' | 'bird' | 'pig' | 'human'

export type Style = 'jp' | 'cute' | 'ascii' | 'cn'

export type Strategy = 'retrieve' | 'compose' | 'glyph'

export const EMOTIONS: readonly Emotion[] = [
  'happy',
  'sad',
  'angry',
  'surprised',
  'love',
  'shy',
  'confused',
  'tired',
  'smug',
  'cry',
  'neutral',
]

export const EMOTION_LABEL: Record<Emotion, string> = {
  happy: '开心',
  sad: '难过',
  angry: '生气',
  surprised: '惊讶',
  love: '喜欢',
  shy: '害羞',
  confused: '疑惑',
  tired: '疲惫',
  smug: '得意',
  cry: '大哭',
  neutral: '平静',
}

export const SUBJECTS: readonly Subject[] = ['cat', 'rabbit', 'bear', 'dog', 'bird', 'pig', 'human']

export const SUBJECT_LABEL: Record<Subject, string> = {
  cat: '猫',
  rabbit: '兔子',
  bear: '熊',
  dog: '狗',
  bird: '鸟',
  pig: '猪',
  human: '人',
}

export const KIND_LABEL: Record<ArtKind, string> = {
  kaomoji: '颜文字',
  composed: '组合颜文字',
  char_art: '拼字',
  picture_art: '图案',
}

export const STYLE_LABEL: Record<Style, string> = {
  jp: '日系',
  cute: '可爱',
  ascii: '英文',
  cn: '中文系',
}

export const STRATEGY_LABEL: Record<Strategy, string> = {
  retrieve: '成品库',
  compose: '组件拼装',
  glyph: '字形栅格化',
}

/** 意图 —— 系统的中间表示。AI 只负责产出它，工具只消费它。 */
export interface Intent {
  kind: ArtKind
  emotions: Emotion[]
  subjects: Subject[]
  action: string | null
  /** 需要被拼出来的文字（char_art 专用） */
  text: string | null
  styleHints: Style[]
  count: number
  raw: string
  source: 'rule' | 'ai'
}

export interface ValidationIssue {
  level: 'error' | 'warn'
  code: string
  message: string
}

export interface Candidate {
  id: string
  art: string
  kind: ArtKind
  strategy: Strategy
  score: number
  width: number
  lines: number
  issues: ValidationIssue[]
}

export const ACTIONS: readonly string[] = [
  'greet',
  'cheer',
  'thanks',
  'sorry',
  'night',
  'birthday',
  'ok',
  'pray',
  'run',
]

export const ACTION_LABEL: Record<string, string> = {
  greet: '打招呼',
  cheer: '加油',
  thanks: '道谢',
  sorry: '道歉',
  night: '晚安',
  birthday: '生日',
  ok: 'OK',
  pray: '祈祷',
  run: '跑走',
}
