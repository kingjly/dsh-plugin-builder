# dsh-greeter

An installable DeepSeek Harness tool plugin that registers `greet`.

```powershell
dsh web --patch ./cordis.dev.yml
```

Ask the model: `Use greet to greet Ada.`

Install the built package into a profile:

```powershell
pnpm install
pnpm build
dsh plugin --profile web add .
dsh --profile web --dump-config
```

Configuration is stored in the bundle patch; the plugin has no credentials.
