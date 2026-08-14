# Generated plugin showcase

These four independent packages were produced by following the repository's `SKILL.md` workflow against `@deepseek-ai/dsh@0.1.0-rc.6`.

| Package | Shape | Mount point | Visible effect |
|---|---|---|---|
| `dsh-aurora-ui` | Pure Client Web UI | `ctx.theme.register()`, `shell.overlay`, `ctx.layout` | A whole-app Aurora palette plus a floating, interactive shell controller |
| `dsh-luna-pet` | Pure Client Web UI | additive `shell.overlay` | Frameless draggable Luna pet with persistent placement, compact mode, and nine animation states |
| `dsh-release-readiness` | Host Tool + Client Conversation Node | `ctx.tools.register()`, core `tool/result.meta`, keyed `conversation.chat.node` renderer | A scored, replayable release dashboard with warnings and blockers |
| `dsh-command-safety` | Policy guard | `ctx.tools.guard()` | A typed denial prevents a matching destructive shell call from executing |

## Run all packages from source

```powershell
py -3 ../scripts/render_showcase_overlays.py
pnpm install
pnpm build
pnpm test
dsh web --patch ./cordis.dev.yml
```

The renderer writes portable `file://` import specifiers for the current checkout, including the required `file:///C:/...` form on Windows.

Each package contains its own installable `dsh.bundle`, design record, development overlay, smoke tests, and README. The three Web plugins additionally ship browser bundles declared by `dsh.client`.

When using an installed profile, set the same `DSH_HOME` before installing and every time the service starts. Otherwise Harness will use another profile and conversation storage root.
