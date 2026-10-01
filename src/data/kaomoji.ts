/**
 * 成品库 —— 人工整理的高质量颜文字。
 *
 * 这是「品质优先」策略的主路径：命中就直出，零幻觉、零风险。
 * 冷启动只需要几百条就能覆盖绝大多数情绪场景。
 */
import type { Emotion, Style, Subject } from '../core/types'

export interface KaomojiEntry {
  id: string
  art: string
  emotions: readonly Emotion[]
  subjects?: readonly Subject[]
  actions?: readonly string[]
  styles: readonly Style[]
  /**
   * 代表度权重。
   *
   * 为什么需要它：`ಥ﹏ಥ` 和 `m(_ _)m` 的情绪标签都是 sad，
   * 纯按标签打分它们会打成平手，而平局时按 id 排序会让「道歉手势」排在「哭脸」前面。
   * 给真正有代表性的条目加权，才能让最该出现的那张脸排在第一位。
   */
  weight?: number
}

const JP: readonly Style[] = ['jp', 'cute']
const ASCII: readonly Style[] = ['ascii']
const CN: readonly Style[] = ['cn', 'jp']

interface Extra {
  subjects?: readonly Subject[]
  actions?: readonly string[]
  weight?: number
}

function e(
  id: string,
  art: string,
  emotions: readonly Emotion[],
  styles: readonly Style[] = JP,
  extra: Extra = {},
): KaomojiEntry {
  return { id, art, emotions, styles, ...extra }
}

export const KAOMOJI: readonly KaomojiEntry[] = [
  /* ---------- 开心 ---------- */
  e('h1', '(◕‿◕)', ['happy'], JP, { weight: 6 }),
  e('h2', '(＾▽＾)', ['happy'], JP, { weight: 3 }),
  e('h3', '(*^▽^*)', ['happy'], JP, { weight: 3 }),
  e('h4', '(⌒‿⌒)', ['happy']),
  e('h5', '(๑˃̵ᴗ˂̵)', ['happy']),
  e('h6', '(✿◠‿◠)', ['happy']),
  e('h7', 'ヽ(・∀・)ﾉ', ['happy'], JP, { actions: ['greet'], weight: 2 }),
  e('h8', '(θ‿θ)', ['happy']),
  e('h9', '(ᵔᴥᵔ)', ['happy']),
  e('h10', '(*´∀`*)', ['happy', 'love'], JP, { weight: 3 }),
  e('h11', '(≧▽≦)', ['happy'], JP, { weight: 4 }),
  e('h12', '(*≧ω≦*)', ['happy'], JP, { weight: 3 }),
  e('h13', '(๑>ᴗ<๑)', ['happy'], JP, { weight: 2 }),
  e('h14', 'ヽ(*⌒▽⌒*)ﾉ', ['happy'], JP, { weight: 2 }),
  e('h15', '٩(*´◒`*)۶', ['happy'], JP, { weight: 6 }),

  /* ---------- 难过 ---------- */
  e('s1', 'ಥ﹏ಥ', ['sad', 'cry'], JP, { weight: 8 }),
  e('s2', '(T_T)', ['sad', 'cry'], ASCII, { weight: 3 }),
  e('s3', '(｡•́︿•̀｡)', ['sad'], JP, { weight: 3 }),
  e('s4', '(◞‸◟)', ['sad'], JP, { weight: 2 }),
  e('s5', '(ノ_<。)', ['sad', 'cry']),
  e('s6', '(´;ω;`)', ['sad', 'cry'], JP, { weight: 3 }),
  e('s7', '(っ- ‸ - ς)', ['sad']),
  e('s8', '°(ಗдಗ。)°', ['sad', 'surprised']),
  e('s9', '(｡╯︵╰｡)', ['sad'], JP, { weight: 3 }),
  e('s10', '(/_;)', ['sad'], ASCII),
  e('s11', '•﹏•', ['sad'], JP, { weight: 5 }),

  /* ---------- 生气 ---------- */
  e('a1', '(◢д◣)', ['angry'], JP, { weight: 6 }),
  e('a2', '(＃`Д´)', ['angry'], JP, { weight: 4 }),
  e('a3', '(╬ Ò﹏Ó)', ['angry'], JP, { weight: 2 }),
  e('a4', '(｀Д´)', ['angry'], JP, { weight: 3 }),
  e('a5', '(ﾉಥ益ಥ)ﾉ', ['angry', 'cry']),
  e('a6', '(＃￣0￣)', ['angry']),
  e('a7', 'ヽ(ｏ`皿′ｏ)ﾉ', ['angry']),
  e('a8', '(＃°Д°)', ['angry'], JP, { weight: 3 }),

  /* ---------- 惊讶 ---------- */
  e('u1', '(⊙_⊙)', ['surprised'], ASCII),
  e('u2', '(ﾟдﾟ)', ['surprised']),
  e('u3', 'Σ(°△°|||)', ['surprised']),
  e('u4', '(ﾟoﾟ;)', ['surprised']),
  e('u5', '(⊙﹏⊙)', ['surprised']),

  /* ---------- 喜欢 ---------- */
  e('l1', '(♡´▽`♡)', ['love'], JP, { weight: 4 }),
  e('l2', '(❤ω❤)', ['love'], JP, { weight: 3 }),
  e('l3', '(´,,•ω•,,)', ['love'], JP, { weight: 3 }),
  e('l4', '(｡♥‿♥｡)', ['love'], JP, { weight: 3 }),
  e('l5', '(*´∀`*)♡', ['love', 'happy']),
  e('l6', '(๑♡⌓♡๑)', ['love']),
  e('l7', '(๑˃ᴗ˂)ﻭ', ['love', 'happy']),

  /* ---------- 害羞 ---------- */
  e('y1', '(˘̩̩̩ε˘̩ƪ)', ['shy'], JP, { weight: 6 }),
  e('y2', '(*/ω＼*)', ['shy'], JP, { weight: 4 }),
  e('y3', '(〃▽〃)', ['shy'], JP, { weight: 3 }),
  e('y4', '(⁄ ⁄•⁄ω⁄•⁄ ⁄)', ['shy']),

  /* ---------- 疑惑 ---------- */
  e('c1', '(・_・?)', ['confused'], ASCII),
  e('c2', '(・・；)', ['confused']),
  e('c3', '(￣～￣;)', ['confused']),
  e('c4', '(・・?)', ['confused']),
  e('c5', '(¯\\_(ツ)_/¯)', ['confused', 'neutral'], ASCII),

  /* ---------- 疲惫 ---------- */
  e('t1', '(－_－) zzZ', ['tired'], ASCII),
  e('t2', '(∪.∪ )...zzz', ['tired'], ASCII),
  e('t3', '(=_=)', ['tired'], ASCII),
  e('t4', '( ˘ω˘ )ｽﾔｧ', ['tired'], JP, { actions: ['night'] }),

  /* ---------- 得意 ---------- */
  e('m1', '≽^⚈⩊⚈^≼', ['smug'], JP, { weight: 8 }),
  e('m2', '(￣ω￣)', ['smug'], JP, { weight: 3 }),
  e('m3', '(¬‿¬)', ['smug'], ASCII, { weight: 3 }),
  e('m4', '(｀∀´)Ψ', ['smug'], JP, { weight: 4 }),
  e('m5', '(￣︶￣)', ['smug'], JP, { weight: 2 }),

  /* ---------- 大哭 ---------- */
  e('k1', '(ಥ_ಥ)', ['cry'], JP, { weight: 5 }),
  e('k2', '(ㄒoㄒ)', ['cry'], JP, { weight: 4 }),
  e('k3', '(;´Д`)', ['cry'], JP, { weight: 3 }),
  e('k4', '｡ﾟ(ﾟ´Д｀ﾟ)ﾟ｡', ['cry'], JP, { weight: 3 }),
  e('k5', '(╥﹏╥)', ['cry'], JP, { weight: 4 }),
  e('k6', '(థ﹏థ)', ['cry'], JP, { weight: 2 }),

  /* ---------- 平静 / 无语 ---------- */
  e('n1', '(・_・)', ['neutral'], ASCII),
  e('n2', '(￣ー￣)', ['neutral']),
  e('n3', '(－_－)', ['neutral']),
  e('n4', '(￣▽￣)', ['neutral']),

  /* ---------- 动物 ---------- */
  e('cat1', '(=^･ω･^=)', ['happy'], JP, { subjects: ['cat'], weight: 5 }),
  e('cat2', '(=①ω①=)', ['happy'], JP, { subjects: ['cat'], weight: 3 }),
  e('cat3', 'ฅ^•ﻌ•^ฅ', ['happy'], JP, { subjects: ['cat'], weight: 3 }),
  e('cat4', '(=^‥^=)', ['neutral'], JP, { subjects: ['cat'], weight: 2 }),
  e('cat5', '(ΦωΦ)', ['smug'], JP, { subjects: ['cat'], weight: 2 }),
  e('cat6', '(=ＴェＴ=)', ['sad'], JP, { subjects: ['cat'], weight: 2 }),
  e('cat7', 'ฅ(•ㅅ•❀)ฅ', ['happy'], JP, { subjects: ['cat'], weight: 2 }),

  e('rab1', '／(･ × ･)＼', ['happy'], JP, { subjects: ['rabbit'], weight: 4 }),
  e('rab2', '૮₍ ˃ ⤙ ˂ ₎ა', ['happy'], JP, { subjects: ['rabbit'], weight: 3 }),
  e('rab3', 'ᐢ⩊ᐢ', ['happy'], JP, { subjects: ['rabbit'], weight: 3 }),
  e('rab4', '(•ㅅ•)', ['happy'], JP, { subjects: ['rabbit'] }),
  e('rab5', '／(´；ω；)＼', ['sad'], JP, { subjects: ['rabbit'], weight: 4 }),

  e('bear1', 'ʕ•ᴥ•ʔ', ['happy'], JP, { subjects: ['bear'] }),
  e('bear2', '(´･ᴥ･`)', ['neutral'], JP, { subjects: ['bear'] }),
  e('bear3', 'ʕ￫ᴥ￩ʔ', ['angry'], JP, { subjects: ['bear'] }),

  e('dog1', '▽･ｪ･▽', ['happy'], JP, { subjects: ['dog'], weight: 5 }),
  e('dog2', 'ᕕ( ᐛ )ᕗ', ['happy', 'tired'], JP, { subjects: ['dog'], actions: ['run'], weight: 3 }),
  e('dog3', '(◞ ･ｪ･ ◟)', ['sad'], JP, { subjects: ['dog'], weight: 4 }),
  e('dog4', '(｀･ｪ･´)', ['angry'], JP, { subjects: ['dog'], weight: 3 }),
  e('dog5', '(´･ｪ･`)', ['sad', 'neutral'], JP, { subjects: ['dog'], weight: 3 }),

  e('bird1', '(・θ・)', ['neutral'], JP, { subjects: ['bird'] }),
  e('bird2', 'ʚ(・ө・)ɞ', ['happy'], JP, { subjects: ['bird'] }),

  e('pig1', '(￣(oo)￣)', ['neutral'], JP, { subjects: ['pig'] }),
  e('pig2', '( ´(00)｀ )', ['happy'], JP, { subjects: ['pig'] }),

  /* ---------- 动作 ---------- */
  e('act1', '(｡･ω･｡)ﾉ', ['happy'], JP, { actions: ['greet'], weight: 4 }),
  e('act2', 'ヾ(＾∇＾)', ['happy'], JP, { actions: ['greet'], weight: 3 }),
  e('act3', '( ´ ▽ ` )ﾉ', ['happy'], JP, { actions: ['greet'], weight: 3 }),
  e('act4', '٩(ˊᗜˋ*)و', ['happy'], JP, { actions: ['cheer'], weight: 4 }),
  e('act5', '(๑•̀ㅂ•́)و✧', ['happy', 'smug'], JP, { actions: ['cheer', 'ok'], weight: 5 }),
  e('act6', 'ᕦ(ò_óˇ)ᕤ', ['angry', 'happy'], ASCII, { actions: ['cheer'], weight: 3 }),
  e('act7', 'm(_ _)m', ['sad'], JP, { actions: ['sorry'], weight: 4 }),
  e('act8', '(_ _)', ['neutral'], JP, { actions: ['sorry'], weight: 2 }),
  e('act9', '(´｡• ᵕ •｡`) ♡', ['love'], JP, { actions: ['thanks'], weight: 4 }),
  e('act10', '(｀・ω・´)b', ['happy', 'smug'], JP, { actions: ['ok'], weight: 5 }),
  e('act11', '(人´∀`).☆.。.:*', ['happy'], CN, { actions: ['pray'], weight: 3 }),
  e('act12', '٩(๑•̀ω•́๑)۶', ['happy'], JP, { actions: ['cheer', 'greet'], weight: 4 }),
  e('act13', '(◕‿◕)♡', ['happy', 'love'], JP, { actions: ['thanks'], weight: 3 }),
  e('act14', '(*´∀`*)ﾉ', ['happy'], JP, { actions: ['greet', 'thanks'], weight: 3 }),
  e('act15', '(๑•̀ㅂ•́)و', ['happy'], JP, { actions: ['cheer'], weight: 2 }),
  e('act16', '٩(๑❛ᴗ❛๑)۶', ['happy'], JP, { actions: ['cheer', 'greet'], weight: 2 }),
  e('act17', '｡ﾟ(ﾟ´ω`ﾟ)ﾟ｡', ['sad', 'cry'], JP, { actions: ['sorry'], weight: 2 }),
  e('act18', '(￣o￣) zzZ', ['tired'], ASCII, { actions: ['night'], weight: 4 }),
  e('act19', '(∪｡∪)｡｡｡zzz', ['tired'], JP, { actions: ['night'], weight: 3 }),
  e('act20', '(｜｜)', ['tired'], JP, { actions: ['night'] }),

  /* ---------- 图案（多行，需等宽） ---------- */
  e(
    'pic1',
    ['   /\\_/\\', '  ( o.o )', '   > ^ <'].join('\n'),
    ['happy'],
    ASCII,
    { subjects: ['cat'] },
  ),
  e(
    'pic2',
    ['   (\\_/)', "  (='.'=)", '  (")_(")'].join('\n'),
    ['happy'],
    ASCII,
    { subjects: ['rabbit'] },
  ),
]

export const KAOMOJI_BY_ID = new Map(KAOMOJI.map((k) => [k.id, k]))
