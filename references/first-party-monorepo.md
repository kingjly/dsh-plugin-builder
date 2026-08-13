# First-party monorepo 包

仅当用户明确在贡献 `deepseek-ai/deepseek-harness` 时使用。树外插件不要遵守本节的 workspace 门禁。

官方清单：`docs/cookbook/adding-a-package.md`。

## 必须做的

- 路径 `packages/<group>/<pkg>/`，包名 `@deepseek-ai/dsh-<pkg>`。
- `private: true`，`version` 与根包一致，`type: module`，`main: lib/index.js`。
- `@deepseek-ai/cordis` 同时在 peerDependencies 与 devDependencies。
- 加入 `tsconfig.host.json` 或 `tsconfig.client.json` 其中一个 references，不要两个都加。
- Client 包 extends `tsconfig.base.client.json`，声明 `dsh.client`。
- README 含 Model Experience 与 Known Limitations（或加入官方 allowlist）。
- 新行为走扩展点；改 `agent-loop` 必须同步改 `docs/architecture.md`。
- 按仓库 `docs/testing.md` 补单测 / e2e / snapshot。

## 不要用树外模板冒充 first-party

不要给 monorepo 包写 `dsh.bundle` 当唯一分发方式（官方组合包在 `packages/bundle/`）。不要把社区包名 `dsh-foo` 推进 `@deepseek-ai` scope。
