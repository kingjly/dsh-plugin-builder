# dsh-plugin-builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.txt)
[![dsh](https://img.shields.io/badge/dsh-0.1.0--rc.5-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)

[中文文档](./README_CN.md)

An Agent Skill that writes installable [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) plugins.

Tell it what capability you need. It first checks the official extension points: tool, hook, adapter, or not a plugin at all. If a plugin is warranted, it writes an independent npm package (with `dsh.bundle` in `package.json`) and tells you how to load it with `--patch` or `dsh plugin add`. Selection rules live in `SKILL.md`.

Pinned to `dsh@0.1.0-rc.5` (`47f943859bef60e4160492346772ded9b24f765a`). dsh is a developer preview; APIs will change.

## Install

Clone into a skills directory your client already scans. The folder name must be `dsh-plugin-builder` and it must contain `SKILL.md`:

```sh
git clone https://github.com/kingjly/dsh-plugin-builder.git
```

```text
~/.claude/skills/dsh-plugin-builder/     # Claude Code
~/.grok/skills/dsh-plugin-builder/       # Grok
.agents/skills/dsh-plugin-builder/       # this project
```

## Usage

Force this skill:

```text
/dsh-plugin-builder Follow the official tutorial and write a greet tool in ./dsh-greet.
```

A plain “write a dsh plugin…” may also auto-invoke it. In Grok: `/skills dsh-plugin-builder`.

Say these up front:

- what to add (not just “make a plugin”)
- output directory
- `--patch` first, or an installable bundle
- env var names for secrets — do not paste live tokens

Defaults if you omit them: independent package, Host plane, TypeScript ESM, `web` profile, `--patch` first.

## Examples

**Tool** (official first tutorial)

```text
/dsh-plugin-builder Follow the official tutorial and write a greet tool in ./dsh-greet.
```

You should get a package with `dsh.bundle`. After starting the Web UI, “use greet to say hi to Ada” should call `greet`.

**Hook** (gate the existing bash tool)

```text
/dsh-plugin-builder Deny bash if the command contains rm -rf /. Official bash is already there; do not register another.
```

Normal commands still run. Dangerous ones are denied and the model sees why.

**Model endpoint** (configure first)

```text
/dsh-plugin-builder Use the OpenAI-compatible API at https://api.example.com/v1. Key is OPENAI_API_KEY. Prefer official dsh-llm-pi-ai; do not write an adapter first.
```

Config change only. No new adapter package. No secret material in files.

**MCP**

```text
/dsh-plugin-builder GitHub MCP is already running locally. Attach it to dsh.
```

Mount official `@deepseek-ai/dsh-mcp-client`, one plugin per server. Do not rewrite those tools by hand.

**Not a plugin**

```text
/dsh-plugin-builder Patch agent-loop so a failed turn retries.
```

Refuse. No package. Retry on tool execution, or use the official retry / guard plugins.

## After it generates

Dev overlay. The plugin path in `cordis.dev.yml` must be absolute:

```sh
pnpm dsh web --patch ./cordis.dev.yml
```

On the published CLI, use `dsh` or `npx @deepseek-ai/dsh` instead of `pnpm dsh`.

Install into a profile:

```sh
dsh plugin --profile web add ./dsh-greet
dsh --profile web --dump-config
```

`scripts/validate_dsh_plugin.py` is a static check. It does not open the Web UI.

## Do not use this skill to

- Change `agent-loop`
- Author a Claude / Grok `SKILL.md`
- Build a standalone MCP server (use the official client to attach one)
- Add a first-party package under `packages/` in `deepseek-ai/deepseek-harness`

## License

[MIT](./LICENSE.txt)
