# Source Ledger

Build date: 2026-08-14. Source mode: `web` + installed runtime. Runtime pin: `@deepseek-ai/dsh@0.1.0-rc.6`. Official repository docs were rechecked live on 2026-08-14; the previously recorded source commit was `47f943859bef60e4160492346772ded9b24f765a` (`rc.5`).

Refresh when official tutorials, `defineTool` contract, bundle manifest, or profile layering change. DSH is developer preview; prefer the live repo over this ledger.

## Runtime verification

- Installed `@deepseek-ai/dsh@0.1.0-rc.6` globally on Windows with Node.js 24 and pnpm 10.
- Confirmed the `defineTool`, canonical output, `tools/pre-execute`, and bundle/profile contracts against the published `rc.6` package declarations.
- Loaded all four showcase plugins into `dsh web`; the server returned HTTP 200 on `127.0.0.1:3080`.
- Installed all four bundles into local profiles and confirmed their layers with `--dump-config` and the live Settings inventory.
- Found and documented the Windows ESM requirement: local absolute entries must use `file:///C:/...`, not bare `C:/...`.
- Confirmed rc.6 watches profile `cordis.patch.yml`: setting a raw entry id to `disabled: true` changed the live Host inventory to disabled without restarting the process. The already-open Web page retained its Client contribution until refresh; after refresh Aurora disappeared and Luna remained.

## Source 1

- Title: DeepSeek Harness README / README.zh
- Type: official repository
- Date accessed: 2026-08-13
- Authority: 2 / Freshness: 2 / Relevance: 2 / Operational: 1
- Why trusted: project root; defines product, preview status, `dsh-plugin` topic
- Operational claims used: everything is a plugin; Cordis; `npx @deepseek-ai/dsh web`; developer preview breaking changes
- Limitations: does not teach plugin authoring

## Source 2

- Title: docs/architecture.zh.md
- Type: official documentation
- Date accessed: 2026-08-13
- Authority: 2 / Freshness: 2 / Relevance: 2 / Operational: 2
- Why trusted: required reading before changing packages; maps features to extension points
- Operational claims used: no privileged kernel; profile/bundle layering; do not change agent-loop; capability seam = definition + provider + consumer; event domains; model-visible ⟺ logged
- Limitations: first-party oriented

## Source 3

- Title: docs/user/develop/basic/{index,tool,config,publish}.zh.md
- Type: official documentation
- Date accessed: 2026-08-13
- Authority: 2 / Freshness: 2 / Relevance: 2 / Operational: 2
- Why trusted: official out-of-tree plugin path
- Operational claims used: `apply(ctx)` plugin shape; `inject`; Schemastery `Config`; `--patch` absolute paths; `dsh.bundle` vs `dsh.profile`; layer order; git `prepare` + `allowBuilds`; tarball/npm avoid build permission
- Limitations: hello-plugin is JS-minimal; production TS layout inferred from cookbook

## Source 4

- Title: docs/cookbook/{extension-cookbook,adding-a-tool,adding-a-package,adding-an-llm-adapter,adding-a-conversation-node}.zh.md
- Type: official documentation
- Date accessed: 2026-08-13
- Authority: 2 / Freshness: 2 / Relevance: 2 / Operational: 2
- Why trusted: canonical contracts for tools, adapters, nodes, first-party packages
- Operational claims used: `defineTool` execute/output/render/presentation; waterfall points; `LlmAdapter.stream` obligations; Conversation Node match/start/update; first-party package layout
- Limitations: adding-a-package is monorepo-only; do not apply those constraints to community plugins

## Source 5

- Title: docs/user/develop/practice/index.zh.md
- Type: official documentation
- Date accessed: 2026-08-13
- Authority: 2 / Freshness: 2 / Relevance: 2 / Operational: 2
- Why trusted: official seam tutorial
- Operational claims used: do not split preemptively; provider and consumer depend only on definition
- Limitations: example uses `@deepseek-ai/dsh-*` names

## Source 6

- Title: packages/README.zh.md, docs/tool-catalog.zh.md, packages/mcp/README.zh.md, packages/web/README.zh.md
- Type: official documentation
- Date accessed: 2026-08-13
- Authority: 2 / Freshness: 2 / Relevance: 2 / Operational: 1
- Why trusted: inventories official seams and model-facing tools
- Operational claims used: existing tools/providers; MCP client registers external tools onto `ctx.tools`
- Limitations: catalogs first-party defaults, not community plugins

## Source 7

- Title: packages/client/ui-settings-plugins/README.md (via code search)
- Type: official package README
- Date accessed: 2026-08-13
- Authority: 2 / Freshness: 2 / Relevance: 2 / Operational: 2
- Why trusted: documents Settings UI constraints
- Operational claims used: only host-plane plugins appear; exposure is host allowlist; preset-mounted plugins cannot register settings namespaces
- Limitations: community plugins cannot surface settings without apiproxy change

## Source 8

- Title: AGENTS.md (repo root)
- Type: official contributor rules
- Date accessed: 2026-08-13
- Authority: 2 / Freshness: 2 / Relevance: 1 / Operational: 1
- Why trusted: harness invariants
- Operational claims used: registrations are effects; waterfall must call `next()`; no hardcoded tunables; misconfiguration fails loud
- Limitations: written for first-party agents contributing to the repo

## Source 9

- Title: installed `dsh-app-boot`, `cordis-plugin-loader`, `cordis-plugin-hmr`, and plugin inventory packages
- Type: published rc.6 runtime source and live verification
- Date accessed: 2026-08-14
- Authority: 2 / Freshness: 2 / Relevance: 2 / Operational: 2
- Why trusted: exact packages executing in the tested local service
- Operational claims used: profile and home patch files are watched; `disabled` disposes or initializes Loader entries; inventory is read-only; Client UI may require refresh after Host state changes
- Limitations: preview behavior may change after rc.6

## Not used as authority

- Community `dsh-plugin` repos and awesome-dsh-plugins: examples and vocabulary only. Compatibility is unstable during preview.
- Cordis paper: design background, not an authoring checklist.
