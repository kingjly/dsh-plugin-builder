# Aurora Workbench Web UI design

## Shape decision

- Goal: make an installed plugin visibly transform the complete DeepSeek Harness Web experience and provide useful shell controls without changing the agent loop.
- Build a plugin: yes; this is browser runtime registration and UI composition, not a prompt or Skill concern.
- Out-of-tree / first-party: out-of-tree.
- Shape: pure Client Web UI plugin with a minimal Host mount entry.
- Mount points: `ctx.theme.register()`, additive `shell.overlay`, and the public `ctx.layout` action service.
- Why not another shape: a Conversation Node only changes one Chat row; replacing `root`, `sidebar`, or `conversation` would shadow first-party seats and remove existing behavior.
- Split a seam: no. The theme and its one controller are one visual feature.

## Contract

- Package: `dsh-aurora-ui`
- Plugin name: `showcase-aurora-ui`
- Loader row id: `showcase-aurora-ui`
- Client inject: `slots`, `theme`, `layout`
- Credentials: none

## Visible behavior

- Registers and activates the `aurora-workbench` dark theme.
- Overrides semantic background, border, label, interaction, Markdown, scrollbar, and status tokens.
- Adds an always-visible floating controller through `shell.overlay`.
- Lets the user restore the original theme, toggle the sidebar, and close details.
- Cleans up its body marker, restores the original theme, and disposes the registered theme when unloaded.

## Verification plan

- [x] Host and browser bundles build.
- [x] Static plugin validator passes.
- [x] Tests prove theme registration, activation, cleanup, additive slot registration, and loader wrapping.
- [x] The installed Web profile displays the Aurora palette and floating controller.
- [x] Controller actions work without replacing first-party shell slots.
- [x] Settings → Plugins → Plugin list finds the mounted entry through `showcase` search.
