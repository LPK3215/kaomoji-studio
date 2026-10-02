# 变更日志

本项目所有值得记录的变更都写在这里。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- 补充开源规范文件：`LICENSE`、`CONTRIBUTING.md`、`CHANGELOG.md`、`FAQ.md`、`AUTHORS`、`.gitattributes`、`.editorconfig`
- 新增文档配图与可就地复用的生成脚本：`docs/banner.svg`、`docs/architecture.svg`（脚本位于 `scripts/visualization/`）

### 变更

- 工程精简：移除图像符号化、对话式微调、服务端 LLM 代理等超出「小工具」定位的模块，回到「文字 → 颜文字」单一骨干
- 扩充组件库（眼 / 嘴 / 臂 / 腮红 / 装饰）与成品库（情绪 / 主体 / 动作 / 图案）

### 修复

- 拼字目标提取收紧，不再拿整句输入兜底，避免栅格化出无意义字符
- 组合引擎为手臂增加左右等宽约束，防止整张脸被拉偏
- 检索层把 `composed` 与 `kaomoji` 视为同类，动作成品条目能命中类型加分
- 字形栅格化完善 CJK 字体链，并在字体缺失导致空白输出时回退
- 校验器补充冷门文字区检查（真机显示为方块的字符）
- 界面生成请求增加竞态保护，避免旧结果覆盖新结果

## [0.1.0] - 2026-10-02

### 新增

- 初版：成品库检索、组件拼装、字形栅格化三条生成策略
- 显示宽度计算（East Asian Width + 组合字符 + VS16）
- 质量校验器（宽度 / 括号 / 行数 / 字符安全）
- 可选的 AI 意图解析（仅输出结构化 JSON，默认关闭）

[Unreleased]: https://cnb.cool/lpk3215/yanwenzi
[0.1.0]: https://cnb.cool/lpk3215/yanwenzi
