# Changelog

## 0.2.0 — 2026-08-14

- 用本 Skill 实际生成并交付三个插件：`dsh-greeter`、`dsh-text-metrics`、`dsh-command-safety`。
- 安装并验证 `@deepseek-ai/dsh@0.1.0-rc.6`，完成 Web overlay 加载、profile 安装和 `--dump-config` 检查。
- 增加 9 个 smoke tests，覆盖工具成功/非法参数、配置失败、钩子放行/拒绝路径。
- 默认构建从原生 `tsdown` 改为轻量 `tsc`，减少 Git `prepare` 的安装体积和平台依赖。
- 修复 Windows 开发 overlay：本地 ESM 入口使用 `file:///C:/...` URL，并在静态校验器中阻止裸盘符路径。
- README 中英文重写，加入真实生成物、运行步骤、目录契约、限制与可复现验证截图。
- 新增 `scripts/render_showcase_validation.py`，从实际 CLI、校验器、测试和 profile 输出生成 README PNG。

## 0.1.0 — 2026-08-13

- README 收成 Skill 说明：安装、怎么喊、5 条常用示例、生成后怎么跑。
- README 示例按官方插件类型重写：工具、钩子、LLM、Web/FS 提供方、命令、Chat 节点、协议桥、MCP。
- README 按 Skill 项目重排：去掉技术栈，补全 `/dsh-plugin-builder` 提示词和预期结果。
- 重写中文 README，去掉英译腔和硬搬术语。
- 增加中英双 README（`README.md` / `README_CN.md`）。
- 首版。从 DeepSeek Harness 官方文档抽出树外插件制作流程。
- 形态决策门：工具 / 钩子 / 提供方 / LLM / UI / 协议桥；拒绝改 agent-loop。
- 模板覆盖 hello、工具、钩子、bundle patch、dev overlay。
- 静态校验脚本检查 `dsh.bundle`、`apply` 导出、官方工具名冲突、明显密钥。
- 来源钉在 `deepseek-ai/deepseek-harness@47f943859bef60e4160492346772ded9b24f765a`。
