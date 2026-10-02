/**
 * 生成 README 顶部横幅 —— docs/banner.svg
 *
 * 用途：项目门面图，展示标题、定位与示例作品。
 * 依赖：仅 Node 内置模块（node:fs / node:path / node:url），零第三方依赖。
 * 运行：node scripts/visualization/generate_banner.mjs
 * 输出：docs/banner.svg
 *
 * 数据来源：package.json 的 version 字段。改版本号后重跑本脚本即可刷新。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

// 与 src/styles.css 的设计变量保持一致，保证图与界面同源
const C = {
  bg: '#0e0f13',
  card: '#1b1e27',
  border: '#2a2e3a',
  text: '#e8eaf0',
  dim: '#9aa1b2',
  faint: '#6b7286',
  accent: '#7c8cff',
}

const W = 960
const H = 260

/** XML 文本转义，避免正文里的 & < > 破坏 SVG 结构 */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="颜文字工坊 · Kaomoji Studio">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12141b"/>
      <stop offset="100%" stop-color="${C.bg}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="url(#bg)" stroke="${C.border}"/>
  <circle cx="820" cy="40" r="180" fill="url(#glow)"/>

  <text x="56" y="112" font-family="'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',system-ui,sans-serif" font-size="44" font-weight="700" fill="${C.text}">颜文字工坊</text>
  <text x="58" y="146" font-family="system-ui,sans-serif" font-size="17" letter-spacing="3" fill="${C.accent}">KAOMOJI STUDIO</text>

  <text x="58" y="190" font-family="'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',system-ui,sans-serif" font-size="15" fill="${C.dim}">输入一句话，得到一组可以直接复制粘贴的符号作品。</text>

  <text x="58" y="226" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="19" fill="${C.faint}">${esc('ಥ﹏ಥ   ≽^⚈⩊⚈^≼   ٩(*´◒`*)۶   ( ◢д◣)')}</text>

  <rect x="800" y="206" width="104" height="28" rx="14" fill="${C.card}" stroke="${C.border}"/>
  <text x="852" y="225" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="13" fill="${C.accent}">v${esc(pkg.version)}</text>
</svg>
`

mkdirSync(join(root, 'docs'), { recursive: true })
writeFileSync(join(root, 'docs', 'banner.svg'), svg)
console.log(`docs/banner.svg 已生成（${svg.length} 字节，版本 v${pkg.version}）`)
