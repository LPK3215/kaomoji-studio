/**
 * 生成架构图 —— docs/architecture.svg
 *
 * 用途：展示生成流水线：输入 → 意图解析 → 策略分发（3 条）→ 校验 → 策展 → 输出。
 * 依赖：仅 Node 内置模块（node:fs / node:path / node:url），零第三方依赖。
 * 运行：node scripts/visualization/generate_architecture.mjs
 * 输出：docs/architecture.svg
 *
 * 数据来源：与 src/core/ 的实际模块一一对应（lexicon / retrieve / compose / glyph / validator / pipeline）。
 * 若增删策略或模块，请同步修改下面的 NODES，再重跑本脚本。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

const C = {
  bg: '#0e0f13',
  card: '#1b1e27',
  border: '#2a2e3a',
  text: '#e8eaf0',
  dim: '#9aa1b2',
  faint: '#6b7286',
  accent: '#7c8cff',
  green: '#48d597',
  amber: '#e8b84b',
}

const W = 1120
const H = 420

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const FONT_SANS = "'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',system-ui,sans-serif"
const FONT_MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'

/** 主流程节点（水平排布，居中 y = 210） */
const MAIN = [
  { x: 24, w: 112, title: '输入', sub: '一句话', color: C.dim },
  { x: 176, w: 152, title: '意图解析', sub: 'lexicon', color: C.accent },
  { x: 610, w: 152, title: '质量校验', sub: 'validator', color: C.green },
  { x: 802, w: 132, title: '策展', sub: '去重 · 均衡', color: C.accent },
  { x: 974, w: 112, title: '输出', sub: '可复制', color: C.dim },
]
const MAIN_Y = 174
const MAIN_H = 72

/** 三条并行的生成策略（垂直排布） */
const BRANCHES = [
  { x: 376, w: 194, y: 60, title: '成品库检索', sub: 'retrieve', color: C.green },
  { x: 376, w: 194, y: 178, title: '组件拼装', sub: 'compose', color: C.accent },
  { x: 376, w: 194, y: 296, title: '字形栅格化', sub: 'glyph · Canvas', color: C.amber },
]
const BRANCH_H = 64

const rect = (x, y, w, h, stroke) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${C.card}" stroke="${stroke}"/>`

const label = (x, y, w, title, sub, color) =>
  `<text x="${x + w / 2}" y="${y + 30}" text-anchor="middle" font-family="${FONT_SANS}" font-size="16" font-weight="600" fill="${C.text}">${esc(title)}</text>` +
  `<text x="${x + w / 2}" y="${y + 52}" text-anchor="middle" font-family="${FONT_MONO}" font-size="12" fill="${color}">${esc(sub)}</text>`

const arrow = (d, color = C.border) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" marker-end="url(#arrow)"/>`

let body = ''

// 主流程
for (const n of MAIN) {
  body += rect(n.x, MAIN_Y, n.w, MAIN_H, C.border)
  body += label(n.x, MAIN_Y, n.w, n.title, n.sub, n.color)
}

// 分支：lexicon 出口向右扇出到三条策略
const lexRight = 176 + 152
body += arrow(`M ${lexRight + 12} 210 H 340`)
for (const b of BRANCHES) {
  const cy = b.y + BRANCH_H / 2
  body += arrow(`M 340 210 V ${cy} H ${b.x - 12}`)
  body += rect(b.x, b.y, b.w, BRANCH_H, C.border)
  body += label(b.x, b.y, b.w, b.title, b.sub, b.color)
}

// 分支汇聚到 validator
const brRight = 376 + 194
for (const b of BRANCHES) {
  const cy = b.y + BRANCH_H / 2
  body += arrow(`M ${brRight + 12} ${cy} H 586 V 210`)
}
body += arrow(`M 586 210 H 598`)

// 主流程后续连接
body += arrow(`M ${610 + 152 + 12} 210 H ${802 - 12}`)
body += arrow(`M ${802 + 132 + 12} 210 H ${974 - 12}`)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="生成流水线架构图">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${C.faint}"/>
    </marker>
  </defs>

  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="${C.bg}" stroke="${C.border}"/>

  <text x="32" y="36" font-family="${FONT_SANS}" font-size="15" font-weight="600" fill="${C.text}">生成流水线</text>
  <text x="118" y="36" font-family="${FONT_MONO}" font-size="12" fill="${C.faint}">src/core/</text>

  ${body}
</svg>
`

mkdirSync(join(root, 'docs'), { recursive: true })
writeFileSync(join(root, 'docs', 'architecture.svg'), svg)
console.log(`docs/architecture.svg 已生成（${svg.length} 字节）`)
