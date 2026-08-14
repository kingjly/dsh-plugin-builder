# Release Readiness Dashboard design

## Shape decision

- Goal: turn explicit release gates into a deterministic readiness result and an immediately visible, replayable Web Chat dashboard.
- Build a plugin: yes.
- Out-of-tree / first-party: out-of-tree.
- Shape: one package with a Host tool plus a Client Conversation Node.
- Mount points: `ctx.tools.register()`, standard `tool/result.meta`, `ctx.conversationEvents`, and the keyed `conversation.chat.node` slot.
- Why not another shape: a prompt cannot enforce deterministic scoring or create a durable custom row; a provider replacement and loop change are unrelated.
- Split a seam: no. The tool and its one renderer evolve as one feature.

## Contract

- Package: `dsh-release-readiness`
- Plugin name: `showcase-release-readiness`
- Loader row id: `showcase-release-readiness`
- Inject: Host `tools`; Client `conversationEvents`, `slots`
- Model-visible name: `release_readiness`
- Credentials: none

## Configuration

| Field | Type | Default | Purpose |
|---|---|---:|---|
| `maxChecks` | positive integer | `24` | Bounds the release-gate payload and UI size. |

## Verification plan

- [x] Host and browser bundles build.
- [x] Static plugin validator passes.
- [x] Ready, warning, blocker, validation, and metadata paths are covered.
- [x] The tool writes JSON-safe dashboard data into core `tool/result` presentation metadata.
- [x] A real Web conversation renders the custom dashboard.
- [x] The dashboard replays after a full service restart.
- [x] Settings → Plugins → Plugin list finds the mounted entry through `showcase` search.
