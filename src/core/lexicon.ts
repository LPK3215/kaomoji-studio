/**
 * 词典与归一化 —— 把「人话」翻译成结构化意图（规则版，不依赖模型）。
 *
 * 这是「无 AI 精确模式」的核心：只要用户输入能被词典命中，
 * 整个流程一行模型都不用调。
 */
import type { ArtKind, Emotion, Intent, Style, Subject } from './types'
import { ACTIONS } from './types'

const EMOTION_SYNONYMS: Record<Emotion, readonly string[]> = {
  happy: ['开心', '高兴', '快乐', '开森', '愉快', '兴奋', '爽', '哈哈', '笑', '喜悦', 'happy', 'joy', 'smile', '😄', '😊'],
  sad: [
    '难过', '伤心', '悲伤', '失落', '沮丧', '郁闷', '低落',
    '委屈', '心酸', '难受', '不开心', '失望', '苦笑',
    'sad', 'unhappy', '😔',
  ],
  angry: ['生气', '愤怒', '火大', '气死', '恼火', '烦躁', '烦', '不爽', 'angry', 'mad', '😠', '💢'],
  surprised: ['惊讶', '吃惊', '震惊', '意外', '惊喜', 'surprise', 'shock', '😲'],
  love: ['喜欢', '爱', '爱你', '心动', '爱心', '爱慕', 'love', 'heart', '❤️', '💕'],
  shy: ['害羞', '羞涩', '不好意思', '腼腆', '羞耻', 'shy', 'embarrassed'],
  confused: ['疑惑', '困惑', '不懂', '问号', '迷茫', '无奈', '迷惑', 'confused', 'what'],
  tired: ['疲惫', '累', '困', '疲惫不堪', '没精神', '心累', '好累', '瘫', 'tired', 'sleepy', 'zzz'],
  smug: ['得意', '骄傲', '嚣张', '臭美', '神气', 'smug', 'proud'],
  cry: ['大哭', '哭了', '泪', '哭', '眼泪', 'cry', 'tears', '😭'],
  neutral: ['平静', '普通', '正常', '无语', '一般', 'neutral', 'meh'],
}

const SUBJECT_SYNONYMS: Record<Subject, readonly string[]> = {
  cat: ['猫', '猫咪', '喵', '小猫', 'cat', 'kitty', '🐱', '🐈'],
  rabbit: ['兔子', '兔', '小兔', '兔兔', 'rabbit', 'bunny', '🐰'],
  bear: ['熊', '小熊', 'bear', '🐻'],
  dog: ['狗', '小狗', '狗狗', '汪', 'dog', 'puppy', '🐶'],
  bird: ['鸟', '小鸟', '鸡', 'bird', 'chick', '🐤'],
  pig: ['猪', '小猪', 'pig', '🐷'],
  human: ['人', '我', '本人', 'person', 'human'],
}

const ACTION_SYNONYMS: Record<string, readonly string[]> = {
  greet: ['打招呼', '打个招呼', '问好', '问候', '你好', '您好', '嗨', '哈喽', '招手', 'hello', 'hi', 'hey'],
  cheer: ['加油', '打气', '鼓劲', 'fighting', '冲', '努力'],
  thanks: ['谢谢', '感谢', '多谢', 'thanks', 'thank you'],
  sorry: ['对不起', '抱歉', '道歉', 'sorry', '道歉'],
  night: ['晚安', '睡觉', '睡了', 'good night'],
  birthday: ['生日', '生日快乐', 'birthday'],
  ok: ['ok', 'OK', '好的', '收到', '没问题', '搞定'],
  pray: ['祈祷', '拜托', '求求', 'pray', 'please'],
  run: ['跑', '溜了', '跑了', '逃', 'run', '走开'],
}

/**
 * 动作 → 默认情绪。
 *
 * 为什么需要：用户说「晚安」时只命中了动作，情绪是空的，
 * 组合引擎会用「开心」的默认基调拼出一张精神抖擞的脸，这明显不对。
 * 「晚安」应该往「疲惫」走。
 */
const ACTION_EMOTION_HINT: Record<string, readonly Emotion[]> = {
  greet: ['happy'],
  cheer: ['happy'],
  thanks: ['happy', 'love'],
  sorry: ['sad'],
  night: ['tired'],
  birthday: ['happy'],
  ok: ['happy', 'smug'],
  pray: ['sad', 'neutral'],
  run: ['tired', 'happy'],
}

const STYLE_SYNONYMS: Record<Style, readonly string[]> = {
  jp: ['颜文字', '日系', '日本', '日式', 'kaomoji'],
  cute: ['可爱', '萌', '甜', '少女', 'cute', 'kawaii'],
  ascii: ['ascii', '英文', '字符画', '纯文本'],
  cn: ['中文', '中文系', '汉字'],
}

/* 反向索引在模块加载时构建一次 */
function buildIndex<T extends string>(map: Record<T, readonly string[]>): Array<[string, T]> {
  const out: Array<[string, T]> = []
  for (const key of Object.keys(map) as T[]) {
    for (const word of map[key]) out.push([word.toLowerCase(), key])
  }
  // 长词优先，避免「生日快乐」被「生日」先命中
  out.sort((a, b) => b[0].length - a[0].length)
  return out
}

const EMOTION_INDEX = buildIndex(EMOTION_SYNONYMS)
const SUBJECT_INDEX = buildIndex(SUBJECT_SYNONYMS)
const ACTION_INDEX = buildIndex(ACTION_SYNONYMS)
const STYLE_INDEX = buildIndex(STYLE_SYNONYMS)

function match<T extends string>(index: Array<[string, T]>, haystack: string): T[] {
  const hits: T[] = []
  for (const [word, key] of index) {
    if (haystack.includes(word) && !hits.includes(key)) hits.push(key)
  }
  return hits
}

/** 从输入里抠出「要拼的字」，例如「拼一个喜」「用符号写 OK」 */
function extractCharTarget(raw: string): string | null {
  const patterns = [
    /(?:拼|写|画|做|生成|摆)(?:一个|个|出|成)?\s*([\u4e00-\u9fffA-Za-z0-9]{1,4})(?:字|这个字)?/,
    /([\u4e00-\u9fffA-Za-z0-9]{1,4})(?:这个)?字(?:出来|吧|的)/,
  ]
  for (const re of patterns) {
    const m = raw.match(re)
    if (m?.[1]) {
      const t = m[1]
      // 排除掉纯动词命中的情况
      if (!['一个', '出来', '一下', '起来'].includes(t)) return t
    }
  }
  return null
}

export interface NormalizeOptions {
  count?: number
  kind?: ArtKind | 'auto'
}

export function normalize(raw: string, opts: NormalizeOptions = {}): Intent {
  const low = raw.toLowerCase()

  const emotions = match(EMOTION_INDEX, low)
  const subjects = match(SUBJECT_INDEX, low)
  const actions = match(ACTION_INDEX, low)
  const styles = match(STYLE_INDEX, low)

  const charTarget = extractCharTarget(raw)
  const action = actions[0] ?? null

  // 只说了动作、没说情绪时，用动作暗示的情绪兜底（「晚安」→ 疲惫）
  if (emotions.length === 0 && action && ACTION_EMOTION_HINT[action]) {
    emotions.push(...ACTION_EMOTION_HINT[action])
  }

  let kind: ArtKind = 'kaomoji'
  if (charTarget) {
    kind = 'char_art'
  } else if (/(图案|大图|字符画|ascii\s*art|横幅|一整只|拼一个图)/i.test(raw)) {
    kind = 'picture_art'
  } else if (actions.length > 0) {
    // composed 表达的是「想要带动作的组合感」，是意图而非产物类型；
    // 检索层会把 composed 与 kaomoji 视为同类，动作成品条目照样能命中加分。
    kind = 'composed'
  }
  // 注意：只提到「猫」「兔子」这类主体时，不强行判成图案。
  // 单行动物颜文字才是最常见诉求，图案条目会在检索里自然排到后面。
  if (opts.kind && opts.kind !== 'auto') kind = opts.kind

  // 什么线索都没命中时，给一个「开心 + 组合颜文字」的合理默认值
  if (
    kind !== 'char_art' &&
    emotions.length === 0 &&
    subjects.length === 0 &&
    actions.length === 0
  ) {
    emotions.push('happy')
    kind = 'composed'
  }

  return {
    kind,
    emotions,
    subjects,
    action,
    text: charTarget,
    styleHints: styles,
    count: opts.count ?? 6,
    raw,
    source: 'rule',
  }
}

export { ACTIONS }
