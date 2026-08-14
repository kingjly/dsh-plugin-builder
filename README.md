# dsh-plugin-builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.txt)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek_Harness-0.1.0--rc.6-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)
[![Agent Skill](https://img.shields.io/badge/Agent_Skill-Grok%20%7C%20Claude%20%7C%20Codex-0ea5e9)](./SKILL.md)
[![Tests](https://img.shields.io/badge/smoke_tests-16%20passing-16a34a)](./showcase)

[中文文档](./README_CN.md)

An Agent Skill for deciding, building, validating, and packaging installable [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) plugins.

It chooses the narrowest supported extension point before generating code: tool, policy guard, provider seam, LLM adapter, Client Conversation Node, theme or shell contribution, protocol bridge—or no plugin at all. Valid requests become independent TypeScript ESM packages with a `dsh.bundle`, development overlay, design record, smoke tests, and verification commands.

Validated on Windows with `@deepseek-ai/dsh@0.1.0-rc.6`. Harness is still a developer preview and may introduce breaking changes.

## Real, tested showcase

The repository includes four plugins produced with this Skill. All are installed in the local `web` profile, visible in Settings, and tested through the actual Web UI.

| Package | Shape and extension point | Visible effect |
|---|---|---|
| [`dsh-aurora-ui`](./showcase/dsh-aurora-ui) | Pure Client Web UI; `ctx.theme.register()`, additive `shell.overlay`, and `ctx.layout` | Recolors the whole application with a cyan/violet Aurora theme and adds a floating controller for theme, sidebar, and details actions. |
| [`dsh-luna-pet`](./showcase/dsh-luna-pet) | Pure Client Web UI; additive `shell.overlay` with an embedded 8×9 WebP atlas | Reuses the user's existing Luna pet and adds visible work, wait, review, patrol, petting, content, and failure animations plus compact mode. |
| [`dsh-release-readiness`](./showcase/dsh-release-readiness) | Host tool + Client Conversation Node; `ctx.tools.register()` and `conversation.chat.node` | The model submits evidence-backed gates and Chat renders a scored release dashboard with warnings and blockers. The card replays after a service restart from core `tool/result` metadata. |
| [`dsh-command-safety`](./showcase/dsh-command-safety) | Monotonic policy guard; `ctx.tools.guard()` | Destructive-looking `bash` or `pwsh` calls are denied before the shell runs, with the matched rule shown in the conversation. |

### Whole-app Aurora workbench

`dsh-aurora-ui` registers a third-party semantic theme and contributes an additive shell overlay. The real controller below switched between Aurora and the original theme, collapsed and restored the sidebar, and closed the details panel without replacing first-party shell surfaces.

![Real DeepSeek Harness Aurora Web UI plugin](./docs/images/aurora-ui.png)

### Animated Luna desktop pet

`dsh-luna-pet` reuses the user's existing Luna atlas without modifying `~/.codex/pets/luna`. In this real `WORKING` capture, Luna is using her laptop; the card can switch to waiting, review, patrol, and failure states. Hovering plays her original head-pat response, clicking plays her contented response, and compact mode keeps only the pet visible.

![Real DeepSeek Harness Luna pet plugin](./docs/images/luna-pet-ui.png)

### Release dashboard

A configured third-party model called `release_readiness` with five real project gates. The plugin calculated `90/100`, rendered four passes and one warning, and the same card was verified again after restarting Harness.

![Real DeepSeek Harness release-readiness dashboard](./docs/images/release-readiness-ui.png)

### Command denial

The model attempted a `Remove-Item -Recurse -Force` probe against a path confirmed not to exist. `dsh-command-safety` denied it before PowerShell ran and surfaced the exact matching policy.

![Real DeepSeek Harness command-safety denial](./docs/images/command-safety-denial.png)

### Searchable plugin inventory

Searching `showcase` in **Settings → Plugins → Plugin list** returns all four mounted and enabled entries.

![Real DeepSeek Harness plugin inventory search](./docs/images/plugin-inventory.png)

These five images are direct captures from the live local service at `http://127.0.0.1:3080`; they are not generated or composited.

### Generated validation report

This separate image is intentionally generated from command output: the installed CLI version, four static validator runs, 16 smoke tests, and installed profile inspection.

![Generated validation report for the four dsh plugins](./docs/images/showcase-validation.png)

Regenerate it with `py -3 scripts/render_showcase_validation.py`.

## Install the Skill

Clone the repository into a Skill directory scanned by your agent client. Keep the folder name `dsh-plugin-builder`.

```powershell
git clone https://github.com/kingjly/dsh-plugin-builder.git "$HOME/.grok/skills/dsh-plugin-builder"
```

Common locations:

```text
~/.grok/skills/dsh-plugin-builder/       # Grok
~/.claude/skills/dsh-plugin-builder/     # Claude Code
.agents/skills/dsh-plugin-builder/       # project-local clients
```

The Skill is ready when `SKILL.md` exists at the directory root.

## Use it

Explicit invocation:

```text
/dsh-plugin-builder Create a release-readiness tool with a replayable Web conversation card. Package it as an installable bundle and test it locally.
```

For the most precise result, state the capability and side effects, output directory, required delivery form (`--patch`, installable bundle, or both), and credential environment-variable names. Never paste live secrets into generated files.

Defaults are an out-of-tree Host plugin, TypeScript ESM, the `web` profile, no agent-loop changes, and a local overlay test before installation.

## Decision-first workflow

| Request | Selected extension |
|---|---|
| Add a structured model capability | Tool registered with `defineTool()` |
| Deny or constrain an existing tool call | Monotonic `ctx.tools.guard()` policy |
| Replace filesystem, shell, search, sandbox, or subagent execution | Existing Service Provider seam |
| Add or route a model backend | Configure `dsh-llm-pi-ai` first; write an adapter only when necessary |
| Add a replayable Chat surface | Host result/event plus Client Conversation Node |
| Change the whole Web UI or add shell controls | Client plugin using a semantic theme and additive shell slot |
| Connect an IM, IDE, or automation protocol | Protocol bridge over `ctx.agents` |
| Modify `agent-loop`, duplicate `bash`, or rewrite an existing MCP tool | Refuse and point to the supported seam |

Every generated package records its choice in `plugin-design.md` before implementation.

## Run the showcase

Prerequisites: Node.js 22+, pnpm, Python 3.10+, and DeepSeek Harness.

```powershell
pnpm add --global @deepseek-ai/dsh@0.1.0-rc.6
py -3 scripts/render_showcase_overlays.py
cd showcase
pnpm install
pnpm build
pnpm test
```

Run all four packages from source:

```powershell
dsh web --patch ./cordis.dev.yml
```

Or install all four into a persistent `web` profile from the repository root:

```powershell
$env:DSH_HOME = (Join-Path (Get-Location) '.dsh-home')
dsh plugin --profile web add .\showcase\dsh-aurora-ui .\showcase\dsh-luna-pet .\showcase\dsh-release-readiness .\showcase\dsh-command-safety
dsh --profile web --dump-config
dsh web --port 3080
```

Always use the same `DSH_HOME` for plugin installation and every restart. Starting once without it opens a different profile and storage root, which can make model settings and conversations appear to have disappeared even though the original data is still intact.

On Windows, local ESM entries in `cordis.dev.yml` must be `file:///C:/...` URLs. `render_showcase_overlays.py` regenerates portable absolute import specifiers for the current checkout.

No model key is required for compilation, static validation, tests, bundle installation, or `--dump-config`. A configured model is required only for an end-to-end conversation.

## Try the visible effects

With `dsh-aurora-ui` installed, the complete Web UI switches to Aurora and the bottom-right controller can restore the original theme, toggle the workspace sidebar, or close the details panel.

With `dsh-luna-pet` installed, use the Luna card to select Idle, Work, Wait, Review, Patrol, or Oops. Hover Luna for her head-pat response, click her for the contented animation, and use Compact to leave only the animated pet visible.

Ask the model to call `release_readiness` with explicit gates such as Build, Tests, Documentation, Screenshots, and Distribution. Each gate must be `pass`, `warn`, or `fail`; the dashboard is deterministic.

For the safety demo, first confirm the probe path does not exist:

```powershell
Test-Path -LiteralPath .\__dsh_plugin_builder_nonexistent_probe__
```

Then ask the model to call `pwsh` with:

```powershell
Remove-Item -LiteralPath ".\__dsh_plugin_builder_nonexistent_probe__" -Recurse -Force
```

The policy should deny the call in Chat. The sample rule is intentionally illustrative; do not treat it as a complete sandbox.

## Generated package contract

```text
dsh-<slug>/
├── src/index.ts          # name + inject + apply + Schemastery Config
├── src/client/index.ts   # optional Web Client plugin: node, theme, or shell contribution
├── test/smoke.test.mjs   # success, failure, and replay/guard paths
├── cordis.dev.yml        # source overlay with absolute import specifier
├── cordis.patch.yml      # installed bundle layer
├── plugin-design.md      # shape decision and verification record
├── package.json          # ESM + dsh.bundle + optional dsh.client
├── tsconfig.json
└── README.md
```

## Validate a generated plugin

```powershell
py -3 scripts/validate_dsh_plugin.py ./showcase/dsh-release-readiness
py -3 scripts/validate_dsh_plugin.py ./showcase/dsh-command-safety
py -3 scripts/validate_dsh_plugin.py ./showcase/dsh-aurora-ui
py -3 scripts/validate_dsh_plugin.py ./showcase/dsh-luna-pet
```

The validator checks ESM and bundle metadata, entries, exported plugin contract, Schemastery config, Client metadata when present, collisions with shipped tool names, likely hard-coded credentials, and invalid bare Windows paths. It is a fast static gate; real delivery should also compile, run tests, load the overlay, inspect `--dump-config`, and exercise the Web UI.

## Repository map

```text
├── SKILL.md                 # routing and delivery contract
├── assets/templates/        # ESM plugin and bundle templates
├── references/              # tool, guard, adapter, UI, safety, publish rules
├── scripts/                 # overlay renderer, validator, report renderer
├── showcase/                # four meaningful, tested plugins
├── examples/                # request fixtures
└── evals/                   # rubric, failure taxonomy, evaluation cases
```

## Important limits

- DeepSeek Harness is in developer preview; re-check official contracts when versions change.
- `dsh-command-safety` is an example policy layer, not a complete shell sandbox or approval system.
- `dsh-release-readiness` stores its UI payload in core `tool/result` presentation metadata so persisted sessions remain replayable.
- `dsh-aurora-ui` activates its custom theme at runtime; Harness persists only its built-in theme preference, so the plugin re-applies Aurora when the Client bundle mounts and restores that preference when requested or unloaded.
- `dsh-luna-pet` embeds the validated 1.69 MB Luna WebP atlas in its Client bundle (about 2.26 MB after base64 embedding). Its row 3/4 interactions are intentionally named **petted** and **content** to match the user's existing artwork rather than generic wave/jump labels.
- Git installs run `prepare` only when package-manager build permissions allow it. Prefer trusted, commit-pinned sources or prebuilt tarballs.
- The four showcase packages have not been published to npm.

## License

[MIT](./LICENSE.txt)
