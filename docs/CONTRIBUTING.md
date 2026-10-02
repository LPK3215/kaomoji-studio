# 贡献指南

感谢你对 **颜文字工坊（Kaomoji Studio）** 感兴趣。这个项目很小，规则也简单。

## 环境要求

- Node.js >= 18
- npm（仓库带 `package-lock.json`，请统一使用 npm）

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
```

提交前请确保类型检查与构建通过：

```bash
npm run typecheck  # tsc --noEmit
npm run build      # 类型检查 + 打包，产出到 dist/
```

## 项目结构

- `src/core/` —— 生成流水线，与界面无关，可单独复用
- `src/data/` —— 词库（成品库、组件库）
- `src/App.tsx` —— 界面

完整结构见 [README.md](./README.md)。

## 提交规范

提交信息使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat: 新增 xxx
fix: 修复 xxx
docs: 更新 xxx
refactor: 重构 xxx
chore: 杂项
```

## 扩充词库

这是最容易参与的贡献方式，改动集中在 `src/data/`。

**成品库 `src/data/kaomoji.ts`**

- 必须带 `emotions` 标签（取值见 `src/core/types.ts` 的 `Emotion`）
- 可选 `subjects` / `actions` / `styles` / `weight`
- 只使用主流设备都有字形的字符：不要用私有使用区、冷门文字区（乐谱、西夏文等），否则真机显示为方块
- 多行图案需「等宽」或「视觉居中」，否则会被校验器标记

**组件库 `src/data/parts.ts`**

- 每个零件都要带 `emotions`，组合引擎按标签取用
- 手臂必须「左右成对」且左右等宽，否则整张脸会歪

## 提交 PR

1. Fork 并新建分支：`git checkout -b feat/your-feature`
2. 保持改动聚焦，一次 PR 只做一件事
3. 确认 `npm run build` 通过
4. PR 描述里写清「改了什么、为什么」

## 许可证

贡献的代码与数据将以 [MIT](./LICENSE) 协议发布。
