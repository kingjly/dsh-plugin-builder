# dsh-plugin-builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.txt)
[![Skill](https://img.shields.io/badge/Agent_Skill-0.1.0-111827)](./SKILL.md)
[![dsh](https://img.shields.io/badge/dsh-0.1.0--rc.5-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](./scripts/validate_dsh_plugin.py)

**[中文文档](./README_CN.md)**

An Agent Skill that turns a capability request into an **installable DeepSeek Harness (`dsh`) plugin**.

It decides the plugin shape first (tool, hook, provider, LLM adapter, UI node, or protocol bridge), scaffolds an out-of-tree ESM package with `dsh.bundle`, and tells the agent how to load it with `--patch` or `dsh plugin add`.

Use it when you want a real plugin, not a prompt tweak and not a fork of `agent-loop`.

## Features

- **Shape gate before code** — refuse loop patches, duplicate official tools (`read` / `bash` / `web_search`), and jobs that belong in a Skill or MCP server
- **Out-of-tree by default** — emit `dsh-<slug>` npm packages, not `@deepseek-ai/dsh-*` monorepo packages
- **Official seams only** — `defineTool`, waterfall hooks, `ctx.llm`, `ctx.web` / `ctx.fs` providers, Conversation Nodes
- **Scaffolding templates** — hello plugin, tool, hook, `cordis.patch.yml`, dev overlay, design note
- **Static checks** — `validate_dsh_plugin.py` verifies `dsh.bundle`, `apply` export, reserved tool names, and obvious secrets
- **Eval set** — 10 cases covering greet tools, deny hooks, loop refusal, and git-install pitfalls

## When to use

- “Write a dsh plugin / DeepSeek Harness plugin”
- `dsh plugin add`, `cordis.yml`, `defineTool`, `dsh.bundle`, `dsh-plugin`
- Swap a provider behind an official seam (`ctx.llm`, `ctx.web`, `ctx.fs`, `ctx.subagents`)

**Do not use this skill to:**

- Patch `agent-loop`
- Author a Claude / Grok `SKILL.md` (use skill-factory)
- Build a standalone MCP server (use mcp-factory, then official `dsh-mcp-client`)

## Tech stack

| Piece | Choice |
|---|---|
| Skill format | Agent Skill (`SKILL.md` + references) |
| Target runtime | [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) on Cordis |
| Generated plugins | TypeScript ESM, Schemastery `Config` |
| Validators | Python 3.10+, stdlib only |
| Pinned docs | `deepseek-ai/deepseek-harness@47f943859bef60e4160492346772ded9b24f765a` (`dsh@0.1.0-rc.5`) |

## Quick start

### Install the skill

Clone into a skills root your agent already loads:

```sh
git clone https://github.com/kingjly/dsh-plugin-builder.git
```

```text
~/.claude/skills/dsh-plugin-builder/     # Claude Code
~/.grok/skills/dsh-plugin-builder/       # Grok
.agents/skills/dsh-plugin-builder/       # project-local
```

Then ask:

```text
Write a dsh plugin that gives the model a greet tool.
Block bash when the command looks like rm -rf /.
Connect an OpenAI-compatible gateway.
```

Slash command, if your client lists skills: `/dsh-plugin-builder`.

### Check this skill package

```sh
py -3 path/to/skill-factory/scripts/validate_skill_package.py ./dsh-plugin-builder
```

### Check a generated plugin

```sh
py -3 scripts/validate_dsh_plugin.py /path/to/your-plugin
```

A valid tree looks like:

```text
dsh-hello/
├── package.json          # type: module, dsh.bundle.patch
├── cordis.patch.yml      # layer inserted by dsh plugin add
├── src/index.ts          # name + inject + apply
└── tsconfig.json
```

Load while developing (absolute path in the overlay):

```sh
pnpm dsh web --patch ./cordis.dev.yml
```

Install into a profile:

```sh
dsh plugin --profile web add ./dsh-hello
dsh --profile web --dump-config
```

## How the skill works

1. **Intake** — one-line goal, Host vs Client, secrets
2. **Shape gate** — stop or pick the seam (`references/shape-decision.md`)
3. **Scaffold** — render `assets/templates/`
4. **Implement** — one shape only
5. **Validate** — static script, then `--patch` if `dsh` is available
6. **Publish notes** — `dsh.bundle`, git `prepare` + `allowBuilds`, or npm / tarball

## Project structure

```text
dsh-plugin-builder/
├── SKILL.md                 # compact workflow
├── README.md                # English
├── README_CN.md             # Chinese
├── LICENSE.txt
├── CHANGELOG.md
├── agents/openai.yaml
├── references/              # load on demand
│   ├── shape-decision.md
│   ├── tool-plugin.md
│   ├── hook-policy.md
│   ├── llm-adapter.md
│   ├── ui-node.md
│   ├── publish-profile.md
│   ├── safety.md
│   ├── first-party-monorepo.md
│   └── source-ledger.md
├── assets/templates/
├── scripts/
│   ├── render_template.py
│   └── validate_dsh_plugin.py
├── evals/
└── examples/
```

## Scripts

```sh
py -3 scripts/render_template.py assets/templates/plugin-tool.template.ts PACKAGE_NAME=dsh-hello -o out.ts
py -3 scripts/validate_dsh_plugin.py /path/to/plugin
```

No network. No `dsh` process is started.

## Limitations

- DSH is a developer preview. APIs will break. Re-check official docs after you generate a plugin.
- Validators are static. They do not boot the Web UI.
- Out-of-tree plugins do not appear in Web Settings unless the host allowlist is changed.
- Agent-preset plugins must not register a settings namespace.

## Contributing

Issues and PRs are welcome. Keep `SKILL.md` short; put detail in `references/`. Add or update an eval case when you change the shape gate.

## License

[MIT](./LICENSE.txt)

---

Built for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) by [kingjly](https://github.com/kingjly).
