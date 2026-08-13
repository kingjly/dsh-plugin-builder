# dsh-plugin-builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.txt)
[![Skill](https://img.shields.io/badge/Agent_Skill-0.1.0-111827)](./SKILL.md)
[![dsh](https://img.shields.io/badge/dsh-0.1.0--rc.5-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)

[中文文档](./README_CN.md)

An Agent Skill for writing [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) plugins.

Describe the capability you need. The agent first decides whether this should be a tool, hook, provider, LLM adapter, conversation node, or protocol bridge. If it should not be a plugin, it stops and names the alternative. If it should, it writes an independent npm package (with `dsh.bundle` in `package.json`) into a directory you choose, then tells you how to load it with `--patch` or `dsh plugin add`.

Docs are pinned to `deepseek-ai/deepseek-harness@47f943859bef60e4160492346772ded9b24f765a` (`dsh@0.1.0-rc.5`). dsh is a developer preview. Treat generated APIs as current-snapshot, not a stability promise.

## Install

Clone this repo into a skills directory your agent already scans. The folder name must be `dsh-plugin-builder` and it must contain `SKILL.md`:

```sh
git clone https://github.com/kingjly/dsh-plugin-builder.git
```

Typical locations:

```text
~/.claude/skills/dsh-plugin-builder/     # Claude Code
~/.grok/skills/dsh-plugin-builder/       # Grok
.agents/skills/dsh-plugin-builder/       # this project
```

Most clients pick it up without a restart. Some refresh the skill list within a few seconds.

## Usage

### How to invoke

These are equivalent. The slash command forces this skill. A plain request may also auto-invoke it from the `description` in `SKILL.md`.

```text
/dsh-plugin-builder
```

Then state the task. Or put it on one line:

```text
/dsh-plugin-builder Follow the official tutorial and write a greet tool in ./dsh-greet.
```

In Grok you can also run `/skills dsh-plugin-builder`.

If you omit details, the skill assumes: independent npm package (not the official monorepo), Host plane (agent process), TypeScript ESM, `web` profile, `--patch` first, then pack. The agent should only ask follow-ups that change the artifact: the goal, Host vs browser, whether secrets exist, and the env var names.

Put these in the prompt when you know them:

1. What problem to solve (not just “make a plugin”)
2. Output directory
3. Local `--patch` first, or an installable bundle
4. Env var names for secrets. Do not paste live tokens and expect them on disk — the skill only writes references

### Prompt examples

These follow the official kinds in [architecture](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/docs/architecture.md) and the [extension cookbook](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/docs/cookbook/extension-cookbook.md). One prompt, one kind.

**Tool** (`ctx.tools` — this is the official first tutorial)

```text
/dsh-plugin-builder Follow the official tutorial and write a greet tool in ./dsh-greet.
After start, “use greet to say hi to Ada” must call that tool.
```

An independent package with `dsh.bundle` and `defineTool({ name: 'greet' })`. Not a hook, and not a change to `bash`.

**Hook** (gate an existing tool — official permission-gate example)

```text
/dsh-plugin-builder If bash contains rm -rf /, deny it.
Official bash is already installed. Do not register another bash.
```

Listen on `tools/pre-execute`. Normal commands still run. The model sees the deny reason.

**LLM adapter** (`ctx.llm`)

```text
/dsh-plugin-builder Use an OpenAI-compatible endpoint at https://api.example.com/v1.
Key is OPENAI_API_KEY. Prefer configuring official dsh-llm-pi-ai. Do not write an adapter first.
```

Change `dsh-llm-pi-ai` config. A new `LlmAdapter` only if that protocol does not fit. No secret material in files.

**Web provider** (`ctx.web` — the model still sees `web_search` / `web_fetch`)

```text
/dsh-plugin-builder Add our own search backend behind official web_search.
Do not change the tool name the model sees.
```

Register a `ctx.web` search implementation. Do not add `my_search`.

**FS / sandbox provider** (`ctx.fs` / `ctx.subprocess` / `ctx.sandbox`)

```text
/dsh-plugin-builder Send file IO to a remote sandbox.
Do not invent another read / write / bash.
```

Swap the provider. The model keeps using official `read`, `write`, and `bash`.

**User command** (`ctx.commands` — no model turn)

```text
/dsh-plugin-builder Add a /status command that prints session state immediately, without a model turn.
```

Register on `ctx.commands`, not `defineTool`.

**Chat node** (Client plugin; facts must be in the session log)

```text
/dsh-plugin-builder Add a collapsible plan card in the web chat. It must survive refresh.
```

Host session events first, then a Client Conversation Node. A frontend-only widget is wrong.

**Protocol bridge** (`ctx.agents`)

```text
/dsh-plugin-builder Talk to this agent from Telegram. Incoming messages are user input.
```

Listen on `session/event` and feed `followup()`. This is a bridge, not a new tool.

**MCP** (official client already exists)

```text
/dsh-plugin-builder GitHub MCP is already running locally. Attach it to dsh.
```

Mount `@deepseek-ai/dsh-mcp-client`, one plugin per server. Do not rewrite those tools with `defineTool`.

**Do not make a plugin**

```text
/dsh-plugin-builder Patch agent-loop so a failed turn retries.
```

Refuse. No package. Retry on `tools/execute` or official retry / guard.

```text
/dsh-plugin-builder Official read is awkward. Write another read.
```

Refuse. `read` / `write` / `edit` are taken. Change `ctx.fs` or add an `fs/*` hook.

```text
/dsh-plugin-builder Make a dsh plugin.
```

Ask which official kind is needed. Do not invent a product.

A finished reply still names the kind, file paths if any, how to start, and what was tested. If the answer is “don’t”, stop there.

## Running a generated plugin

Dev overlay. The `name` in `cordis.dev.yml` must be an absolute path or load fails:

```sh
pnpm dsh web --patch ./cordis.dev.yml
```

If you use the published CLI instead of a source checkout, replace `pnpm dsh` with `dsh` or `npx @deepseek-ai/dsh`. `--patch` is a dsh flag.

Install into the `web` profile:

```sh
dsh plugin --profile web add ./dsh-hello
dsh --profile web --dump-config
```

`--dump-config` should show that bundle layer. A git install of a TypeScript source repo needs a self-contained `prepare` script, and the user must allow it in that profile’s `pnpm-workspace.yaml` (`allowBuilds`). Prefer `pnpm pack` or a prebuilt npm package if you do not want that prompt.

Static check from this repo (no network, does not start dsh):

```sh
py -3 scripts/validate_dsh_plugin.py /path/to/your-plugin
```

On Windows use `py -3`. A tool plugin should show: schema registered, one successful call, missing required args fail without crashing. A hook should show both deny and allow.

## Do not use this skill to

- Change `agent-loop` or write a custom loop
- Author a Claude / Grok `SKILL.md`
- Implement a standalone MCP server
- Only research the dsh ecosystem
- Add a first-party package under `packages/` in `deepseek-ai/deepseek-harness` (see `references/first-party-monorepo.md`)

## Limits

- Generated TypeScript tracks the pinned dsh types. A later preview bump may not compile.
- The validator does not open `http://127.0.0.1:3080`.
- Independently installed plugins do not show up in Web Settings unless the Host apiproxy allowlist includes them.
- Plugins mounted from an agent preset cannot register a settings namespace (duplicate registration across sessions). Put those values in the preset `cordis.yml`.

## What’s in this repo

The agent runs `SKILL.md`. `references/` is loaded per task. `assets/templates/` are scaffolds. `evals/` and `examples/` are eval fixtures.

## License

[MIT](./LICENSE.txt)
