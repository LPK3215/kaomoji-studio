import { useCallback, useRef, useState } from 'react'
import { getAIConfig, saveAIConfig, type AIConfig } from './core/ai'
import { generate } from './core/pipeline'
import type { ArtKind, Candidate, Emotion, Intent, Subject } from './core/types'
import {
  ACTION_LABEL,
  EMOTION_LABEL,
  EMOTIONS,
  KIND_LABEL,
  STRATEGY_LABEL,
  SUBJECT_LABEL,
  SUBJECTS,
} from './core/types'

const EXAMPLES = ['开心', '委屈的小狗', '打个招呼', '得意一点', '拼一个喜', '晚安']

const KIND_OPTIONS: Array<{ value: ArtKind | 'auto'; label: string }> = [
  { value: 'auto', label: '自动判断' },
  { value: 'kaomoji', label: KIND_LABEL.kaomoji },
  { value: 'composed', label: KIND_LABEL.composed },
  { value: 'char_art', label: KIND_LABEL.char_art },
  { value: 'picture_art', label: KIND_LABEL.picture_art },
]

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export default function App() {
  const [raw, setRaw] = useState('')
  const [kind, setKind] = useState<ArtKind | 'auto'>('auto')
  const [emotions, setEmotions] = useState<Emotion[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [count, setCount] = useState(6)
  const [useAI, setUseAI] = useState(false)
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => getAIConfig())

  const [intent, setIntent] = useState<Intent | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)

  /** 请求序号：快速连点、或开启 AI 后网络请求乱序返回时，只采纳最新一次的结果 */
  const reqIdRef = useRef(0)

  const run = useCallback(async () => {
    if (!raw.trim()) return
    const reqId = ++reqIdRef.current
    setLoading(true)
    setCopiedId(null)
    try {
      const result = await generate(raw, {
        kind,
        emotions,
        subjects,
        count,
        useAI,
        aiConfig: useAI ? aiConfig : null,
      })
      // 过期请求直接丢弃，避免旧结果覆盖新结果
      if (reqId !== reqIdRef.current) return
      setIntent(result.intent)
      setCandidates(result.candidates)
      setNotes(result.notes)
      setHasRun(true)
    } finally {
      if (reqId === reqIdRef.current) setLoading(false)
    }
  }, [raw, kind, emotions, subjects, count, useAI, aiConfig])

  const copy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // 非安全上下文下 clipboard API 不可用，退回 execCommand
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopiedId(id)
    window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1400)
  }, [])

  const updateAI = useCallback((patch: Partial<AIConfig>) => {
    setAiConfig((prev) => {
      const next = { ...prev, ...patch }
      saveAIConfig(next)
      return next
    })
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>颜文字工坊</h1>
        <p>输入一句话，得到一组可以直接复制粘贴的符号作品。</p>
        <div className="tagline">ಥ﹏ಥ ≽^⚈⩊⚈^≼ ٩(*´◒`*)۶ ( ◢д◣)</div>
      </header>

      <section className="panel">
        <div className="panel-title">想要什么</div>
        <textarea
          className="input"
          value={raw}
          placeholder="描述一下，比如：今天有点委屈，像被雨淋湿的小狗"
          onChange={(ev) => setRaw(ev.target.value)}
          onKeyDown={(ev) => {
            if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
              ev.preventDefault()
              void run()
            }
          }}
        />

        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="ex-link" onClick={() => setRaw(ex)}>
              {ex}
            </button>
          ))}
        </div>

        <div className="row">
          <div className="field">
            <span>类型</span>
            <select
              className="select"
              value={kind}
              onChange={(ev) => setKind(ev.target.value as ArtKind | 'auto')}
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <span>数量</span>
            <input
              className="num"
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(ev) => setCount(Math.max(1, Math.min(12, Number(ev.target.value) || 1)))}
            />
          </div>
          <button className="btn-primary" onClick={() => void run()} disabled={loading || !raw.trim()}>
            {loading ? '生成中…' : '生成'}
          </button>
        </div>

        <div className="row" style={{ marginTop: 18 }}>
          <div style={{ width: '100%' }}>
            <div className="panel-title" style={{ marginBottom: 8 }}>
              情绪（可多选，选中后覆盖自动识别）
            </div>
            <div className="chips">
              {EMOTIONS.map((em) => (
                <button
                  key={em}
                  className={`chip${emotions.includes(em) ? ' on' : ''}`}
                  onClick={() => setEmotions((prev) => toggle(prev, em))}
                >
                  {EMOTION_LABEL[em]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 16 }}>
          <div style={{ width: '100%' }}>
            <div className="panel-title" style={{ marginBottom: 8 }}>
              主体
            </div>
            <div className="chips">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  className={`chip${subjects.includes(s) ? ' on' : ''}`}
                  onClick={() => setSubjects((prev) => toggle(prev, s))}
                >
                  {SUBJECT_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <details className="ai">
          <summary>AI 接入（可选）— 默认关闭，关闭时全流程零模型调用</summary>
          <div className="ai-body">
            <label className="switch">
              <input type="checkbox" checked={useAI} onChange={(ev) => setUseAI(ev.target.checked)} />
              <span>用 AI 解析自然语言意图</span>
            </label>
            <div className="hint">
              开启后，模型只做一件事：把你的描述翻译成结构化意图，不产出颜文字本身。
              Key 存在本机 localStorage，仅个人使用场景适用。
            </div>
            <input
              className="text"
              type="text"
              placeholder="接口地址，如 https://api.openai.com/v1"
              value={aiConfig.baseUrl}
              onChange={(ev) => updateAI({ baseUrl: ev.target.value })}
            />
            <input
              className="text"
              type="text"
              placeholder="API Key"
              value={aiConfig.apiKey}
              onChange={(ev) => updateAI({ apiKey: ev.target.value })}
            />
            <input
              className="text"
              type="text"
              placeholder="模型名，如 gpt-4o-mini"
              value={aiConfig.model}
              onChange={(ev) => updateAI({ model: ev.target.value })}
            />
          </div>
        </details>

        {intent && (
          <div className="intent-bar">
            <span>解析结果</span>
            <span className="kv">
              类型 <b>{KIND_LABEL[intent.kind]}</b>
            </span>
            {intent.emotions.length > 0 && (
              <span className="kv">
                情绪 <b>{intent.emotions.map((x) => EMOTION_LABEL[x]).join(' / ')}</b>
              </span>
            )}
            {intent.subjects.length > 0 && (
              <span className="kv">
                主体 <b>{intent.subjects.map((x) => SUBJECT_LABEL[x]).join(' / ')}</b>
              </span>
            )}
            {intent.action && (
              <span className="kv">
                动作 <b>{ACTION_LABEL[intent.action] ?? intent.action}</b>
              </span>
            )}
            {intent.text && (
              <span className="kv">
                拼字 <b>{intent.text}</b>
              </span>
            )}
            <span className="kv">
              来源 <b>{intent.source === 'ai' ? 'AI' : '规则'}</b>
            </span>
          </div>
        )}

        {notes.length > 0 && (
          <div className="notes">
            {notes.map((n) => (
              <div className="note" key={n}>
                {n}
              </div>
            ))}
          </div>
        )}
      </section>

      {candidates.length > 0 ? (
        <>
          <div className="result-head">
            <h2>候选</h2>
            <span>已全部通过校验 · 共 {candidates.length} 个</span>
          </div>
          <div className="grid">
            {candidates.map((c) => (
              <div key={c.id} className={`card${c.lines > 3 ? ' wide' : ''}`}>
                <div className={`art${c.lines > 1 ? ' multi' : ''}`}>{c.art}</div>
                <div className="card-foot">
                  <div className="meta">
                    <span className={`strategy ${c.strategy}`}>{STRATEGY_LABEL[c.strategy]}</span>
                    <span>
                      {c.lines} 行 / {c.width} 列
                    </span>
                  </div>
                  <button
                    className={`btn-copy${copiedId === c.id ? ' copied' : ''}`}
                    onClick={() => void copy(c.art, c.id)}
                  >
                    {copiedId === c.id ? '已复制' : '复制'}
                  </button>
                </div>
                {c.issues.length > 0 && (
                  <div className="issue">{c.issues.map((i) => i.message).join('；')}</div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty">
          <span className="big">{hasRun ? '(・_・)' : '(◕‿◕)'}</span>
          {hasRun ? '没有可用的候选，换个描述试试' : '在上面输入一句话，然后点生成'}
        </div>
      )}
    </div>
  )
}
