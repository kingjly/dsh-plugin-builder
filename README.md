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
/dsh-plugin-builder Write a dsh plugin that exposes a greet tool. It takes a name and returns a greeting.
```

In Grok you can also run `/skills dsh-plugin-builder`.

If you omit details, the skill assumes: independent npm package (not the official monorepo), Host plane (agent process), TypeScript ESM, `web` profile, `--patch` first, then pack. The agent should only ask follow-ups that change the artifact: the goal, Host vs browser, whether secrets exist, and the env var names.

Put these in the prompt when you know them:

1. What problem to solve (not just “make a plugin”)
2. Output directory
3. Local `--patch` first, or an installable bundle
4. Env var names for secrets. Do not paste live tokens and expect them on disk — the skill only writes references

### Prompt examples

Each block can follow `/dsh-plugin-builder`. The expected result is what `SKILL.md` requires, not a guess.

**Tool (the model needs a new capability)**

```text
/dsh-plugin-builder Write a plugin at D:/tmp/dsh-greet.
Give the model a greet tool that takes name and returns a greeting.
Load it with --patch first.
```

Expected: a tool plugin, `inject: ['tools']`, `ctx.tools.register(defineTool({ name: 'greet', ... }))`, `execute` returns canonical JSON, `output.render` is what the model sees. The tree includes `package.json` (`type: module` and `dsh.bundle.patch`), `cordis.patch.yml`, `src/index.ts`, `plugin-design.md`, and a `cordis.dev.yml` whose plugin `name` is the absolute path of `src/index.ts`.

**Hook (intercept an existing tool; do not register another `bash`)**

```text
/dsh-plugin-builder Do not let the model run rm -rf /.
The official bash tool already exists. Do not register another tool with that name.
```

Expected: a `tools/pre-execute` hook. Deny with `{ kind: 'deny', reason: '...' }` on a match; otherwise call `next()`.

**OpenAI-compatible gateway**

```text
/dsh-plugin-builder Connect an OpenAI-compatible chat-completions gateway.
The key is in OPENAI_API_KEY.
```

Expected: configure official `@deepseek-ai/dsh-llm-pi-ai` first. Write `ctx.llm.registerAdapter` only if that adapter cannot express the protocol or auth. Persist the env var name, never the key.

**Wrap a small internal CLI**

```text
/dsh-plugin-builder Turn our internal weather CLI into a dsh plugin.
It prints plain text and takes few flags. Write it to ./dsh-weather.
```

A tool plugin that spawns the CLI is allowed. Pass argv as an array; do not concatenate a shell string. Return canonical JSON, not raw CLI text as the programmatic API.

**Chat progress row**

```text
/dsh-plugin-builder Show code-review progress in the Web Chat.
The Host does not emit matching session events yet.
```

Expected: design replayable session events (`SessionEventMap`) first, then a Client Conversation Node. A Client-only plugin with nothing in the log is wrong.

**Must stop (not a plugin)**

```text
/dsh-plugin-builder Patch agent-loop so a failed turn retries automatically.
```

Refuse to change `agent-loop`. Do not emit a loop-patch package. Retries belong on `tools/execute` or the official retry / guard plugins.

```text
/dsh-plugin-builder Write another read tool that is easier to use.
```

Refuse to register a tool named `read`. Official `read` / `write` / `edit` already exist. Change `ctx.fs` or add `fs/*` policy instead.

```text
/dsh-plugin-builder I already have a GitHub MCP server. Wire it into dsh.
```

Use official `@deepseek-ai/dsh-mcp-client` (one plugin per MCP server). Do not reimplement each MCP tool with `defineTool`.

```text
/dsh-plugin-builder Make a dsh plugin.
```

Not enough to invent a product. Ask only questions that change the artifact, or emit the minimal hello plugin.

### What a finished run must return

From the skill’s output contract:

1. Shape decision: yes/no, which kind, why not the others
2. File paths, if a plugin was generated
3. Load command (`--patch` or `dsh plugin add`)
4. What was tested and what was not
5. Known limits

If the decision is “do not make a plugin”, return the alternative only. Do not generate a package.

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
