# dsh-command-safety

An installable DeepSeek Harness policy guard. It intercepts existing `bash` and
`pwsh` calls through `ctx.tools.guard()`; it does not register duplicate shell tools.

```powershell
dsh web --patch ./cordis.dev.yml
```

Safe commands and unrelated tools pass through unchanged. Matching commands are
denied before execution, and the reason plus matched rule is visible to the model/user.

Install the built package into a profile:

```powershell
pnpm install
pnpm build
dsh plugin --profile web add .
dsh --profile web --dump-config
```

This sample policy is intentionally small and configurable; it is not a complete
shell sandbox and should be composed with Harness sandbox/approval controls.
