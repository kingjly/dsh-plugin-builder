# DSH Text Metrics design

## Shape decision

- Goal: give the model deterministic, structured statistics for supplied text.
- Build a plugin: yes.
- Out-of-tree / first-party: out-of-tree.
- Shape: tool.
- Mount point: `ctx.tools.register(defineTool(...))`.
- Why not another shape: this is a new model-callable computation, not a replacement for filesystem, shell, search, or another existing provider.
- Split a capability seam: no; a single in-process implementation is sufficient.

## Contract

- Package: `dsh-text-metrics`
- Plugin name: `dsh-text-metrics`
- Loader row id: `showcase-text-metrics`
- Inject: `tools`
- Model-visible name: `text_metrics`
- Credentials: none

## Configuration

| Field | Type | Default | Purpose |
|---|---|---|---|
| `maxCharacters` | positive integer | `10000` | Reject unexpectedly large inputs before analysis |

## Verification plan

- [x] Static plugin validator
- [x] Structured successful output
- [x] Missing input and configured size-limit failures
- [x] Web profile loads the plugin (model invocation not run: no API key configured)
