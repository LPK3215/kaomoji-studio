/**
 * 同步全景观览页到 docs/ —— 供 GitHub Pages 经典模式使用
 *
 * 用途：Pages 经典模式只认 `/` 或 `/docs`，本仓库用 `/docs`。
 *       把 project_overview/ 下的源码复制到 docs/，并把页内指向仓库根的文件链接
 *       从 `../xxx` 重写为 `./xxx`（部署后站点根就是 docs/）。
 * 依赖：仅 Node 内置模块（node:fs / node:path / node:url），零第三方依赖。
 * 运行：node scripts/sync-overview.mjs
 * 产物：docs/index.html、docs/style.css、docs/script.js、docs/charts.js、
 *       docs/assets/*、docs/.nojekyll，以及随页展示的仓库文档副本。
 *
 * 说明：docs/banner.svg 与 docs/architecture.svg 由 scripts/visualization/ 生成，
 *       本脚本不会覆盖它们。
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const srcDir = join(root, 'project_overview')
const outDir = join(root, 'docs')

/** 页面本体：复制并重写链接 */
const PAGE_FILES = ['index.html', 'style.css', 'script.js', 'charts.js']

/** 文档索引里引用的仓库文档：一并复制，保证 Pages 上链接可达 */
const DOC_COPIES = ['README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'FAQ.md', 'AUTHORS', 'LICENSE']

if (!existsSync(srcDir)) {
  console.error('未找到 project_overview/，请先创建全景观览页')
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

for (const file of PAGE_FILES) {
  const from = join(srcDir, file)
  if (!existsSync(from)) continue

  let text = readFileSync(from, 'utf8')

  if (file === 'index.html') {
    // 本地打开时页面在 project_overview/，链接用 ../ 指向仓库根；
    // 部署到 docs/ 后站点根就是 docs/，改回 ./ 才不会 404。
    // 注意顺序：先处理更具体的 ../docs/，再处理 ../README.md 这类。
    text = text.replace(/href="\.\.\/docs\//g, 'href="./').replace(/href="\.\.\//g, 'href="./')
  }

  writeFileSync(join(outDir, file), text)
}

// 位图资源（如后续补充截图）
const assetDir = join(srcDir, 'assets')
if (existsSync(assetDir)) {
  cpSync(assetDir, join(outDir, 'assets'), { recursive: true })
  const keep = join(outDir, 'assets', '.gitkeep')
  if (existsSync(keep)) rmSync(keep)
}

// 文档副本
const copied = []
for (const file of DOC_COPIES) {
  const from = join(root, file)
  if (!existsSync(from)) continue
  cpSync(from, join(outDir, file))
  copied.push(file)
}

// Pages 经典模式：禁用 Jekyll，避免下划线开头的路径被忽略
writeFileSync(join(outDir, '.nojekyll'), '')

console.log('已同步到 docs/：' + PAGE_FILES.join('、'))
console.log('链接已重写：href="../xxx" → href="./xxx"')
console.log('文档副本：' + (copied.join('、') || '（无）'))
console.log('已写入 docs/.nojekyll（空文件，禁用 Jekyll）')
