# Generated plugin showcase

These three independent packages were produced by following the repository's
`SKILL.md` workflow against `@deepseek-ai/dsh@0.1.0-rc.6`.

| Package | Shape | Mount point | Model-visible tool |
|---|---|---|---|
| `dsh-greeter` | Tool | `ctx.tools.register()` | `greet` |
| `dsh-text-metrics` | Tool | `ctx.tools.register()` | `text_metrics` |
| `dsh-command-safety` | Hook | `tools/pre-execute` | None |

## Run all three from source

```powershell
py -3 ../scripts/render_showcase_overlays.py
pnpm install
dsh web --patch ./cordis.dev.yml
```

The renderer writes portable `file://` import specifiers for the current checkout,
including the required `file:///C:/...` form on Windows.

## Build and test

```powershell
pnpm build
pnpm test
```

Each package also contains its own installable `dsh.bundle`, design record,
development overlay, smoke test, and README.
