/**
 * 组件库 —— 组合颜文字的零件仓库。
 *
 * 每个零件都带情绪标签，组合引擎按标签挑零件，而不是纯随机。
 * 手性零件（左右手）必须成对出现，且不能同侧重复。
 */
import type { Emotion } from '../core/types'

interface Tagged {
  emotions?: readonly Emotion[]
}

export interface EyePart extends Tagged {
  v: string
}
export interface MouthPart extends Tagged {
  v: string
}
export interface ArmPart extends Tagged {
  l: string
  r: string
}
export interface BlushPart extends Tagged {
  v: string
}
export interface DecorPart extends Tagged {
  v: string
}

/** 括号对：左、右 */
export const BRACKETS: ReadonlyArray<readonly [string, string]> = [
  ['(', ')'],
  ['（', '）'],
  ['[', ']'],
  ['【', '】'],
  ['〈', '〉'],
  ['《', '》'],
  ['༺', '༻'],
  ['❨', '❩'],
]

/**
 * 窄括号对：带手臂时只在里面挑。
 * 原因：手臂零件全是窄字符，配上一对全角的《》会导致视觉重心失衡。
 */
export const NARROW_BRACKETS: ReadonlyArray<readonly [string, string]> = [
  ['(', ')'],
  ['（', '）'],
  ['[', ']'],
  ['【', '】'],
  ['❨', '❩'],
]

export const EYES: readonly EyePart[] = [
  // 开心 / 得意
  { v: '◕', emotions: ['happy', 'love'] },
  { v: 'ᵔ', emotions: ['happy'] },
  { v: '⌒', emotions: ['happy', 'smug'] },
  { v: '˘', emotions: ['happy', 'shy'] },
  { v: '❛', emotions: ['happy'] },
  { v: '≧', emotions: ['happy', 'smug'] },
  { v: '≦', emotions: ['happy', 'smug'] },
  { v: 'ᗜ', emotions: ['happy', 'smug'] },
  { v: '⌣', emotions: ['happy'] },
  { v: '๑', emotions: ['happy', 'shy'] },
  { v: '￣', emotions: ['smug', 'tired'] },
  { v: 'ì', emotions: ['smug'] },

  // 难过 / 哭
  { v: 'ಥ', emotions: ['sad', 'cry'] },
  { v: '﹏', emotions: ['sad', 'cry'] },
  { v: '᷄', emotions: ['sad', 'cry'] },
  { v: '᷅', emotions: ['cry'] },
  { v: 'T', emotions: ['cry'] },
  { v: '´', emotions: ['sad', 'cry'] },
  { v: '`', emotions: ['sad', 'cry'] },

  // 生气
  { v: '◢', emotions: ['angry'] },
  { v: '｀', emotions: ['angry'] },
  { v: '益', emotions: ['angry'] },
  { v: 'メ', emotions: ['angry'] },

  // 惊讶
  { v: '⊙', emotions: ['surprised'] },
  { v: 'ﾟ', emotions: ['surprised'] },
  { v: 'º', emotions: ['surprised'] },

  // 喜欢
  { v: '♡', emotions: ['love'] },
  { v: '❤', emotions: ['love'] },
  { v: 'ᴗ', emotions: ['love', 'happy'] },

  // 害羞
  { v: '〃', emotions: ['shy'] },
  { v: '⁄', emotions: ['shy'] },

  // 疑惑 / 平静 / 疲惫
  { v: '・', emotions: ['confused', 'neutral'] },
  { v: '•', emotions: ['neutral', 'confused'] },
  { v: '˙', emotions: ['neutral'] },
  { v: '･', emotions: ['neutral'] },
  { v: '─', emotions: ['tired'] },
  { v: '﹃', emotions: ['tired'] },

  // 开心 / 得意（扩充）
  { v: 'ᵕ', emotions: ['happy'] },
  { v: '◠', emotions: ['happy'] },
  { v: '◍', emotions: ['happy'] },
  { v: '❃', emotions: ['happy', 'love'] },
  { v: '◉', emotions: ['happy', 'surprised'] },
  { v: '￢', emotions: ['smug'] },
  { v: '︶', emotions: ['smug', 'happy'] },

  // 难过 / 哭（扩充）
  { v: 'ᗩ', emotions: ['sad', 'cry'] },
  { v: '◜', emotions: ['sad'] },

  // 生气（扩充）
  { v: 'ム', emotions: ['angry'] },

  // 惊讶（扩充）
  { v: 'Ｏ', emotions: ['surprised'] },
  { v: '◊', emotions: ['surprised'] },

  // 喜欢 / 害羞（扩充）
  { v: '♥', emotions: ['love'] },
  { v: '❥', emotions: ['love'] },
  { v: 'ღ', emotions: ['love'] },
  { v: '灬', emotions: ['shy'] },

  // 疑惑 / 疲惫 / 中性（扩充）
  { v: '؟', emotions: ['confused'] },
  { v: 'ー', emotions: ['tired'] },
  { v: 'ᐧ', emotions: ['neutral'] },
]

export const MOUTHS: readonly MouthPart[] = [
  // 开心
  { v: '‿', emotions: ['happy'] },
  { v: '◡', emotions: ['happy'] },
  { v: 'ᴗ', emotions: ['happy', 'love'] },
  { v: '▽', emotions: ['happy', 'surprised'] },
  { v: 'ω', emotions: ['happy', 'love', 'shy'] },
  { v: '⩊', emotions: ['happy', 'smug'] },
  { v: 'ヮ', emotions: ['happy'] },
  { v: '∀', emotions: ['happy', 'smug'] },

  // 难过 / 哭
  { v: '﹏', emotions: ['sad', 'cry', 'shy'] },
  { v: '︿', emotions: ['sad', 'cry'] },
  { v: 'ε', emotions: ['sad', 'shy'] },
  { v: '᷄', emotions: ['sad', 'cry'] },

  // 生气
  { v: 'д', emotions: ['angry'] },
  { v: 'Д', emotions: ['angry'] },
  { v: '皿', emotions: ['angry'] },
  { v: '益', emotions: ['angry'] },
  { v: 'ᗣ', emotions: ['angry'] },

  // 惊讶
  { v: 'o', emotions: ['surprised'] },
  { v: 'O', emotions: ['surprised'] },
  { v: '０', emotions: ['surprised'] },
  { v: 'ロ', emotions: ['surprised'] },
  { v: '△', emotions: ['surprised'] },

  // 喜欢
  { v: 'з', emotions: ['love', 'shy'] },
  { v: '♡', emotions: ['love'] },

  // 平淡 / 困惑 / 疲惫
  { v: '＿', emotions: ['neutral', 'tired', 'confused'] },
  { v: '一', emotions: ['neutral'] },
  { v: '～', emotions: ['confused'] },
  { v: '﹃', emotions: ['tired'] },

  // 开心（扩充）
  { v: 'ᵕ', emotions: ['happy'] },
  { v: '◠', emotions: ['happy'] },
  { v: 'ㅅ', emotions: ['happy'] },
  { v: 'ㅈ', emotions: ['happy', 'smug'] },

  // 难过 / 生气（扩充）
  { v: '᷄', emotions: ['sad', 'cry'] },
  { v: 'ㅂ', emotions: ['angry'] },
  { v: 'Π', emotions: ['angry'] },

  // 惊讶（扩充）
  { v: 'இ', emotions: ['surprised'] },
  { v: 'ㅇ', emotions: ['surprised'] },

  // 得意 / 中性（扩充）
  { v: '‿', emotions: ['smug'] },
  { v: 'ㅡ', emotions: ['neutral'] },
]

export const ARMS: readonly ArmPart[] = [
  { l: '٩', r: '۶', emotions: ['happy', 'smug'] },
  { l: '٩', r: 'و', emotions: ['happy', 'smug'] },
  { l: 'ᕦ', r: 'ᕤ', emotions: ['happy', 'angry'] },
  { l: 'ᕕ', r: 'ᕗ', emotions: ['happy', 'tired'] },
  { l: '\\', r: '/', emotions: ['happy'] },
  { l: 'ノ', r: 'ヽ', emotions: ['happy', 'angry'] },
  { l: '☞', r: '☜', emotions: ['smug'] },
  { l: '☜', r: '☞', emotions: ['smug'] },
  { l: '༼', r: '༽', emotions: ['cry', 'sad'] },
  { l: 'ʕ', r: 'ʔ', emotions: ['neutral'] },
  { l: 'ƪ', r: 'ʃ', emotions: ['shy'] },
  { l: '♪', r: '♪', emotions: ['happy'] },
  { l: 'ᕙ', r: 'ᕗ', emotions: ['angry', 'happy'] },
  { l: 'ʚ', r: 'ɞ', emotions: ['happy', 'love'] },
  { l: '⸜', r: '⸝', emotions: ['happy'] },
  { l: '☚', r: '☛', emotions: ['smug'] },
  { l: '╰', r: '╯', emotions: ['tired', 'neutral'] },
]

export const BLUSH: readonly BlushPart[] = [
  { v: '๑', emotions: ['happy', 'shy', 'love'] },
  { v: '〃', emotions: ['shy'] },
  { v: '✿', emotions: ['happy', 'love'] },
  { v: '❀', emotions: ['happy', 'love'] },
  { v: '＊', emotions: ['happy'] },
  { v: '♡', emotions: ['love'] },
  { v: '✧', emotions: ['happy', 'smug'] },
  { v: '˃', emotions: ['happy'] },
  { v: '❁', emotions: ['happy', 'love'] },
  { v: '✾', emotions: ['happy', 'love'] },
  { v: '⋆', emotions: ['happy'] },
  { v: '♢', emotions: ['happy', 'smug'] },
  { v: '⁄', emotions: ['shy'] },
  { v: '•', emotions: ['shy'] },
]

export const DECOR: readonly DecorPart[] = [
  { v: '✧', emotions: ['happy', 'smug'] },
  { v: '✦', emotions: ['happy'] },
  { v: '★', emotions: ['happy'] },
  { v: '☆', emotions: ['happy', 'neutral'] },
  { v: '♡', emotions: ['love'] },
  { v: '♥', emotions: ['love'] },
  { v: '♪', emotions: ['happy'] },
  { v: '♫', emotions: ['happy'] },
  { v: '˚', emotions: ['neutral'] },
  { v: '。', emotions: ['neutral'] },
  { v: '＊', emotions: ['happy'] },
  { v: '゛', emotions: ['confused'] },
  { v: '✩', emotions: ['happy'] },
  { v: '✽', emotions: ['happy'] },
  { v: '❈', emotions: ['happy'] },
  { v: '﹡', emotions: ['happy'] },
  { v: '⟡', emotions: ['happy', 'smug'] },
  { v: '❃', emotions: ['love'] },
  { v: '｡', emotions: ['neutral'] },
  { v: '゜', emotions: ['confused'] },
]
