#!/usr/bin/env python3
"""渲染 assets/templates/ 下的模板，把 {{PLACEHOLDER}} 替换为 vars 里的值。

纯 stdlib。用法:

  py -3 scripts/render_template.py <template_file> KEY=VALUE KEY2=VALUE2 [-o out.txt]
  py -3 scripts/render_template.py <template_file> -v vars.json [-o out.txt]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

PLACEHOLDER_RE = re.compile(r"\{\{([A-Z0-9_]+)\}\}")


def load_vars(args: list[str]) -> dict[str, str]:
    vars_: dict[str, str] = {}
    rest: list[str] = []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "-v" and i + 1 < len(args):
            vf = Path(args[i + 1])
            vars_.update(json.loads(vf.read_text(encoding="utf-8")))
            i += 2
            continue
        if "=" in a and not a.startswith("-"):
            k, _, v = a.partition("=")
            vars_[k.strip()] = v
            i += 1
            continue
        rest.append(a)
        i += 1
    args[:] = rest
    return vars_


def render(text: str, vars_: dict[str, str]) -> tuple[str, list[str]]:
    missing: list[str] = []

    def repl(m: re.Match[str]) -> str:
        key = m.group(1)
        if key in vars_:
            return str(vars_[key])
        if key not in missing:
            missing.append(key)
        return m.group(0)

    return PLACEHOLDER_RE.sub(repl, text), missing


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(
            "Usage: render_template.py <template> [KEY=VAL ...] [-v vars.json] [-o out]",
            file=sys.stderr,
        )
        return 2
    tpl_path = Path(argv[1])
    if not tpl_path.is_file():
        print(f"模板不存在: {tpl_path}", file=sys.stderr)
        return 2
    args = argv[2:]
    out: str | None = None
    if "-o" in args:
        idx = args.index("-o")
        if idx + 1 < len(args):
            out = args[idx + 1]
            del args[idx : idx + 2]
    vars_ = load_vars(args)
    rendered, missing = render(tpl_path.read_text(encoding="utf-8"), vars_)
    for k in missing:
        print(f"[warn] 未提供变量 {k}（占位符保留）", file=sys.stderr)
    if out:
        Path(out).write_text(rendered, encoding="utf-8")
        print(f"已写出: {out}")
    else:
        sys.stdout.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
