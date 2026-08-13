# Changelog

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
