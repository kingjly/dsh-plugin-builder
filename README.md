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
/dsh-plugin-builder The model cannot see our internal tickets. Give it a tool: ticket id in, status and owner out.
```

In Grok you can also run `/skills dsh-plugin-builder`.

If you omit details, the skill assumes: independent npm package (not the official monorepo), Host plane (agent process), TypeScript ESM, `web` profile, `--patch` first, then pack. The agent should only ask follow-ups that change the artifact: the goal, Host vs browser, whether secrets exist, and the env var names.

Put these in the prompt when you know them:

1. What problem to solve (not just “make a plugin”)
2. Output directory
3. Local `--patch` first, or an installable bundle
4. Env var names for secrets. Do not paste live tokens and expect them on disk — the skill only writes references

### Prompt examples

Paste these after `/dsh-plugin-builder`. Each note is what you should see if the run followed `SKILL.md`, not an internals dump.

**Look up an internal ticket**

You say:

```text
/dsh-plugin-builder
The model cannot see our tickets. GET https://tickets.corp.example/api/tickets/{id},
auth header from TICKET_TOKEN. Add a lookup_ticket tool: ticket id in,
status and owner out. Write it to D:/work/dsh-ticket and load with --patch first.
```

If it did the right thing: `D:/work/dsh-ticket/` contains `src/index.ts`, `package.json` (with `dsh.bundle`), `cordis.patch.yml`, `cordis.dev.yml`, and `plugin-design.md`. The decision says “tool plugin”, not a hook and not `bash` wrapping curl. The path in `cordis.dev.yml` is the absolute path of `src/index.ts`. After you start the Web UI, “who owns T-1024?” should call `lookup_ticket`. The repo may mention `TICKET_TOKEN`, never a live token.

**Stop a full-disk delete**

You say:

```text
/dsh-plugin-builder
When it cleans the repo it keeps running rm -rf /. Official bash is already there.
Do not add another bash tool. Reject that command and tell the model why.
```

If it did the right thing: you get a hook, not a second `bash`. `ls` and `git status` still run. `rm -rf /` is denied and the model sees the reason. The hook listens on `tools/pre-execute` and must pass the call through when it allows it.

**Company OpenAI-compatible gateway**

You say:

```text
/dsh-plugin-builder
We do not talk to OpenAI directly. Use https://llm.corp.example/v1,
chat completions, key in OPENAI_API_KEY.
Prefer configuring what we already ship. Do not write a new adapter first.
```

If it did the right thing: it edits `@deepseek-ai/dsh-llm-pi-ai` (`baseURL` + `apiKeyEnv: OPENAI_API_KEY`) instead of creating `llm-mycompany`. A new adapter is only allowed if that gateway does not fit. No secret material in the tree.

**On-call CLI**

You say:

```text
/dsh-plugin-builder
We have oncall-status shanghai. It prints one line: ok 3 people.
I want a tool for that. Do not make the model type the command in bash.
Write it to ./dsh-oncall.
```

If it did the right thing: `./dsh-oncall` is a tool (for example `oncall_status`) that spawns `oncall-status` with an argv array, not `oncall-status ${city}` in a shell string. The model gets fields (ok, count), not raw stdout as the API. “How many people are on call in Shanghai?” should hit that tool.

**Progress that survives refresh**

You say:

```text
/dsh-plugin-builder
While a review runs I want the chat to show “3/10 files done”,
and I want that number back after refresh.
The Host does not write those events into the session log yet.
```

If it did the right thing: it adds replayable Host session events (stable review id) first, then the chat row. A Client-only widget with an empty log is wrong — refresh would lose the count.

**These must not produce a plugin**

“Patch agent-loop so a failed turn retries.”  
Refuse the loop change. No package. Point at tool-execution retry or the official retry / guard plugins.

“Official read is awkward. Write a nicer read.”  
Refuse another tool named `read`. File IO is already `read` / `write` / `edit`.

“GitHub MCP is already running. Wire it into dsh.”  
Mount official `@deepseek-ai/dsh-mcp-client` (one plugin per server). Do not rewrite list/create issue by hand.

“Make a dsh plugin.”  
Not enough. Ask what problem to solve and where to put files. Do not invent a ticket or weather app.

A finished reply still needs: the shape decision, file paths if any, how to start it, what was tested, what was not. If the answer is “don’t make a plugin”, stop there — no empty package.

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
