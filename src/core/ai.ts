/**
 * AI 接入层（可选）—— 模型只做一件事：把自然语言翻译成结构化意图。
 *
 * 它绝不直接产出颜文字。原因：
 *   - 模型会幻想不存在的字符组合、括号不配对、左右手同侧、宽度失控
 *   - 这些错误不可校验、不可复现、不可修
 *
 * 而只输出 JSON 的话：可校验、可回退、可缓存。
 * 所以这里是「调度员」，不是「渲染器」。
 */
import type { ArtKind, Emotion, Intent, Style, Subject } from './types'
import { EMOTIONS, SUBJECTS } from './types'
import { ACTIONS } from './types'

export interface AIConfig {
  baseUrl: string
  apiKey: string
  model: string
}

const STORAGE_KEY = 'kaomoji-studio.ai'

export const DEFAULT_AI_CONFIG: AIConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
}

export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_AI_CONFIG, ...(JSON.parse(raw) as Partial<AIConfig>) }
  } catch {
    /* 读取失败就用默认值 */
  }
  return { ...DEFAULT_AI_CONFIG }
}

export function saveAIConfig(cfg: AIConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  } catch {
    /* 隐私模式下可能写不了，忽略 */
  }
}

const SYSTEM_PROMPT = `你是一个「颜文字意图解析器」。你的唯一任务是把用户的自然语言需求翻译成结构化 JSON。

你不生成颜文字本身，只输出意图。

字段说明：
- kind: 作品类型。可选值："kaomoji"(单张脸的颜文字) | "composed"(带手/装饰的组合颜文字) | "char_art"(用符号拼出一个字) | "picture_art"(多行图案)
- emotions: 情绪数组。只能从这些值里选："happy","sad","angry","surprised","love","shy","confused","tired","smug","cry","neutral"
- subjects: 主体数组。只能从这些值里选："cat","rabbit","bear","dog","bird","pig","human"
- action: 单个动作字符串或 null。可选值："greet","cheer","thanks","sorry","night","birthday","ok","pray","run"
- text: 当 kind 为 "char_art" 时，要拼出来的文字（1-4 个字符），否则为 null
- styleHints: 风格数组。可选值："jp","cute","ascii","cn"

只输出 JSON，不要任何解释、不要 markdown 代码块。
如果某个字段无法从用户输入推断，就用空数组或 null。`

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function filterEnum<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  return asArray(value).filter((v): v is T => typeof v === 'string' && (allowed as readonly string[]).includes(v))
}

/** 把模型输出「消毒」成合法意图，非法值一律丢弃而不是报错 */
export function sanitizeAIResult(input: unknown, raw: string): Partial<Intent> {
  if (typeof input !== 'object' || input === null) return {}
  const o = input as Record<string, unknown>

  const kinds: readonly ArtKind[] = ['kaomoji', 'composed', 'char_art', 'picture_art']
  const styles: readonly Style[] = ['jp', 'cute', 'ascii', 'cn']

  const kind = typeof o.kind === 'string' && (kinds as readonly string[]).includes(o.kind)
    ? (o.kind as ArtKind)
    : undefined

  const action =
    typeof o.action === 'string' && (ACTIONS as readonly string[]).includes(o.action) ? o.action : null

  const text = typeof o.text === 'string' && o.text.trim().length > 0 ? o.text.trim().slice(0, 4) : null

  return {
    kind,
    emotions: filterEnum<Emotion>(o.emotions, EMOTIONS),
    subjects: filterEnum<Subject>(o.subjects, SUBJECTS),
    styleHints: filterEnum<Style>(o.styleHints, styles),
    action,
    text,
    raw,
    source: 'ai',
  }
}

/** 把模型输出的 JSON 串解析成对象 */
function parseModelContent(content: unknown): unknown {
  if (typeof content !== 'string') throw new Error('AI 返回格式异常')
  try {
    return JSON.parse(content)
  } catch {
    throw new Error('AI 返回的不是合法 JSON')
  }
}

/** 直连上游：Key 在浏览器侧，仅个人本机使用场景适用 */
export async function parseIntentWithAI(raw: string, cfg: AIConfig): Promise<Partial<Intent>> {
  if (!cfg.apiKey) throw new Error('尚未配置 API Key')
  if (!cfg.baseUrl) throw new Error('尚未配置接口地址')

  const url = `${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: raw },
      ],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`AI 请求失败 ${res.status}${detail ? `：${detail.slice(0, 160)}` : ''}`)
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: unknown } }> }
  return sanitizeAIResult(parseModelContent(data.choices?.[0]?.message?.content), raw)
}
