# dsh-release-readiness

A dual-face DeepSeek Harness plugin: the model calls `release_readiness`, the Host computes an evidence-based release gate, and the Web Client renders its core `tool/result` presentation metadata as a custom dashboard in Chat. Because the UI payload lives in a standard persisted event, the card survives service restarts and session replay.

## Install

```powershell
dsh plugin --profile web add ./showcase/dsh-release-readiness
dsh --profile web
```

The package builds both `lib/index.js` and `lib/client.js`. Its browser entry is discovered from `dsh.client`, while `cordis.patch.yml` mounts the Host tool.

## Example input

```json
{
  "releaseName": "dsh-plugin-builder v0.2.0",
  "checks": [
    { "name": "Build", "category": "CI", "status": "pass", "detail": "TypeScript compiled." },
    { "name": "Screenshots", "category": "Docs", "status": "warn", "detail": "Capture before publishing." }
  ]
}
```

The result is `ready` only when every gate passes, `at-risk` when warnings remain, and `blocked` when any failure remains. The deterministic score weights a pass as 1, a warning as 0.5, and a failure as 0.
