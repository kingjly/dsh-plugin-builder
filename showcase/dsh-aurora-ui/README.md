# dsh-aurora-ui

A pure Client Web plugin for DeepSeek Harness. It registers a high-contrast Aurora theme, activates it at load time, and contributes a floating shell controller without replacing the built-in sidebar, conversation, or details surfaces.

## Install

```powershell
dsh plugin --profile web add ./showcase/dsh-aurora-ui
dsh web --port 3080
```

Use the same `DSH_HOME` for installation and every restart.

## Visible effect

- cyan/violet semantic palette across the complete Web UI;
- layered conversation background and themed text selection;
- persistent **Aurora UI** controller in the bottom-right corner;
- controls to restore the original theme, toggle the sidebar, and close details.

The package uses only the documented `ctx.theme`, `shell.overlay`, and `ctx.layout` seams. It does not replace the `root`, `sidebar`, or `conversation` single slots.

![Aurora UI running in DeepSeek Harness](../../docs/images/aurora-ui.png)
