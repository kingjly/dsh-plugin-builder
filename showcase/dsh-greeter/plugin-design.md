# DSH Greeter design

## Shape decision

- Goal: let the model greet a named person with deployment-configurable wording.
- Build a plugin: yes.
- Out-of-tree / first-party: out-of-tree.
- Shape: tool.
- Mount point: `ctx.tools.register(defineTool(...))`.
- Why not another shape: this adds a new structured model capability; it does not intercept an existing tool, replace a provider, or change the client UI.
- Split a capability seam: no; there is only one local implementation.

## Contract

- Package: `dsh-greeter`
- Plugin name: `dsh-greeter`
- Loader row id: `showcase-greeter`
- Inject: `tools`
- Model-visible name: `greet`
- Credentials: none

## Configuration

| Field | Type | Default | Purpose |
|---|---|---|---|
| `greeting` | string | `Hello, ` | Text before the recipient name |
| `punctuation` | string | `!` | Text after the recipient name |

## Verification plan

- [x] Static plugin validator
- [x] Tool registration and successful call smoke test
- [x] Missing and blank name failures
- [x] Web profile loads the plugin (model invocation not run: no API key configured)
