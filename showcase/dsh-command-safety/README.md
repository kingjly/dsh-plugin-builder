# dsh-command-safety

An installable DeepSeek Harness policy hook. It intercepts existing `bash` and
`pwsh` calls at `tools/pre-execute`; it does not register duplicate shell tools.

```powershell
dsh web --patch ./cordis.dev.yml
```

Safe commands delegate to the rest of the waterfall with `next()`. Matching
commands return a typed denial whose reason is visible to the model/user.

Install the built package into a profile:

```powershell
pnpm install
pnpm build
dsh plugin --profile web add .
dsh --profile web --dump-config
```

This sample policy is intentionally small and configurable; it is not a complete
shell sandbox and should be composed with Harness sandbox/approval controls.
