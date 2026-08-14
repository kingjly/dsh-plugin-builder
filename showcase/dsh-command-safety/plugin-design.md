# DSH Command Safety design

## Shape decision

- Goal: deny selected destructive shell invocations while preserving ordinary `bash` and `pwsh` behavior.
- Build a plugin: yes.
- Out-of-tree / first-party: out-of-tree.
- Shape: hook / policy.
- Mount point: `tools/pre-execute` waterfall.
- Why not another shape: `bash` and `pwsh` already exist; registering wrapper tools would create conflicts and let other providers bypass the policy.
- Split a capability seam: no; this is a policy listener on the existing registry seam.

## Contract

- Package: `dsh-command-safety`
- Plugin name: `dsh-command-safety`
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
- [x] Denial path does not call `next()`
- [x] Allowed path delegates through `next()`
- [x] Invalid regex fails loudly
- [x] Web profile loads the plugin (model invocation not run: no API key configured)
