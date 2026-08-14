# Changelog

## 0.5.0 — 2026-08-14

- 将已有插件的识别、修改、热启用和热停用升级为 Skill 的一等任务模式，不再默认进入新包脚手架。
- 新增 `references/plugin-lifecycle.md`：锁定实际 `DSH_HOME` / profile，区分安装、配置、启用与挂载状态，并给出 raw entry id 的安全 patch 流程。
- 实测 rc.6 可在不重启 Host 的情况下把 Aurora inventory 切换为已停用；已打开页面需要刷新一次才卸载 Client UI，Luna 不受影响。
- 明确 `dsh plugin add/remove` 与 profile manifest 变更不是热切换，官方 Settings inventory 仍是只读界面。
- 增加生命周期 eval、失败分类、质量门和中英文 README 使用说明，并更新 Skill UI 元数据。

## 0.4.0 — 2026-08-14

- 新增纯 Client Web UI 插件 `dsh-luna-pet`，复用用户已有 Luna 8×9 WebP 动画图集，并通过 additive `shell.overlay` 提供桌面宠物。
- Luna 支持工作、等待、审阅、巡逻和故障状态；悬停响应摸头、点击进入满足状态，并提供紧凑模式与 reduced-motion 适配。
- 原始 `~/.codex/pets/luna` 未被修改；复制品通过 `hatch-pet` 确定性校验，并按现有素材的真实动作语义映射行 3/4。
- Showcase 扩展为四个插件和 16 项 smoke tests，加入 Luna 实际运行截图及设置页四插件搜索截图。
- README 只保留真实 DSH Web 截图；移除命令输出生成的验证图及其生成脚本。

## 0.3.0 — 2026-08-14

- 新增纯 Client 插件 `dsh-aurora-ui`：通过 `ctx.theme.register()` 改变整套 Web 语义配色，并向 additive `shell.overlay` 加入浮动控制器。
- 控制器可恢复原主题、切换侧栏和关闭详情栏；插件不替换 `root`、`sidebar` 或 `conversation` single slot。
- 将主题、全局浮层、布局服务和加载顺序经验回写到 `references/ui-node.md` 与静态校验器。
- Showcase 扩展为三个插件和 12 项 smoke tests，并加入真实 Aurora Web UI 截图。

## 0.2.0 — 2026-08-14

- 用本 Skill 实际生成并交付两个有明显效果的插件：带可回放 Web 卡片的 `dsh-release-readiness`，以及执行前拒绝危险 Shell 调用的 `dsh-command-safety`。
- 安装并验证 `@deepseek-ai/dsh@0.1.0-rc.6`，完成 Web overlay、profile 安装、`--dump-config`、真实模型调用和服务重启回放检查。
- 增加 9 个 smoke tests，覆盖确定性发布评分、核心 `tool/result` 元数据、Client bundle、guard 拒绝/放行、复合参数与配置失败。
- 根据实测把最终拒绝策略收敛为单调的 `ctx.tools.guard()`，并修复 PowerShell 参数正则中连字符前错误的词边界。
- 修复 Windows 开发 overlay：本地 ESM 入口使用 `file:///C:/...` URL，并在静态校验器中阻止裸盘符路径。
- README 中英文重写，加入三张真实 Web UI 截图、设置检索结果、运行步骤、`DSH_HOME` 持久化注意事项和可复现验证报告。
- 新增/更新 `scripts/render_showcase_validation.py`，从实际 CLI、两个校验器、9 项测试和 profile 输出生成 README PNG。

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
