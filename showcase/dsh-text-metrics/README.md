# dsh-text-metrics

An installable DeepSeek Harness tool plugin that registers `text_metrics` and
returns a canonical JSON object rather than prose-only output.

```powershell
dsh web --patch ./cordis.dev.yml
```

Ask the model: `Use text_metrics on "Hello world".`

Install the built package into a profile:

```powershell
pnpm install
pnpm build
dsh plugin --profile web add .
dsh --profile web --dump-config
```

`maxCharacters` is validated when the plugin loads and no credentials are used.
