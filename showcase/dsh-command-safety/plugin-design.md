# DSH Command Safety design

## Shape decision

- Goal: deny selected destructive shell invocations while preserving ordinary `bash` and `pwsh` behavior.
- Build a plugin: yes.
- Out-of-tree / first-party: out-of-tree.
- Shape: monotonic guard / policy.
- Mount point: `ctx.tools.guard()`.
- Why not another shape: `bash` and `pwsh` already exist; registering wrapper tools would create conflicts, while a waterfall handler could accidentally swallow or replace execution.
- Split a capability seam: no; this is a policy guard on the existing registry seam.

## Contract

- Package: `dsh-command-safety`
- Plugin name: `showcase-command-safety`
- Loader row id: `showcase-command-safety`
- Inject: `tools`
- Model-visible name: none
- Credentials: none

## Configuration

| Field | Type | Default | Purpose |
|---|---|---|---|
| `protectedTools` | string[] | `bash`, `pwsh` | Tool calls whose command arguments are inspected |
| `blockedPatterns` | string[] | destructive root/home deletion patterns | Case-insensitive Unicode regular expressions |
| `reason` | string | policy denial text | Explanation surfaced to the model/user |

Invalid regular expressions fail during plugin loading instead of silently disabling policy.

## Verification plan

- [x] Static plugin validator
- [x] Matching direct, string, and composite-wrapped arguments are denied
- [x] Allowed and unrelated calls return no denial
- [x] Invalid regex fails loudly
- [x] A real Web conversation shows the typed denial, reason, and matched rule.
- [x] The protected command was denied before PowerShell ran.
- [x] Settings → Plugins → Plugin list finds the mounted entry through `showcase` search.
