#!/usr/bin/env python3
"""静态检查树外 dsh 插件包。

检查 package.json 的 dsh.bundle、patch 文件、入口导出、以及明显密钥泄漏。
不启动 dsh，不访问网络。

  py -3 scripts/validate_dsh_plugin.py <plugin_dir>
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SECRET_RE = re.compile(
    r"""(?ix)
    (api[_-]?key|secret|token|password|authorization)
    \s*[:=]\s*
    ['\"](?!sk-xxx|your-|changeme|example|<|\$\{|process\.env)[A-Za-z0-9_\-+/=]{12,}['\"]
    """
)
WINDOWS_BARE_ESM_PATH_RE = re.compile(
    r"(?m)^\s*name:\s*['\"]?[A-Za-z]:[\\/]"
)
APPLY_RE = re.compile(r"export\s+(?:async\s+)?function\s+apply\b|export\s+const\s+apply\b")
NAME_RE = re.compile(r"export\s+const\s+name\s*=")
RESERVED_TOOLS = {
    "read",
    "write",
    "edit",
    "read_image",
    "glob",
    "grep",
    "bash",
    "pwsh",
    "web_search",
    "web_fetch",
    "skill",
    "subagent",
    "todo_write",
    "run_code",
}


def errors_for(root: Path) -> list[str]:
    errors: list[str] = []
    pkg_path = root / "package.json"
    if not pkg_path.is_file():
        return ["缺少 package.json"]

    try:
        pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"package.json 不是合法 JSON: {exc}"]

    if pkg.get("type") != "module":
        errors.append('package.json 必须 "type": "module"')

    bundle = (pkg.get("dsh") or {}).get("bundle") or {}
    patch_rel = bundle.get("patch")
    if not patch_rel:
        errors.append("缺少 dsh.bundle.patch；没有它 dsh plugin add 不会激活一层")
    else:
        patch_path = root / patch_rel
        if not patch_path.is_file():
            errors.append(f"找不到 patch 文件: {patch_rel}")
        else:
            text = patch_path.read_text(encoding="utf-8")
            if "insert:" not in text and "id:" not in text:
                errors.append("cordis patch 看起来不是 patch 条目数组")

    client = (pkg.get("dsh") or {}).get("client")
    if client is not None:
        if not isinstance(client, dict):
            errors.append("dsh.client 必须是对象")
        else:
            if client.get("platform") != "web":
                errors.append('Web Client 插件必须声明 dsh.client.platform = "web"')
            inject = client.get("inject")
            if not isinstance(inject, list) or not all(isinstance(item, str) for item in inject):
                errors.append("dsh.client.inject 必须是包名字符串数组")
        client_export = (pkg.get("exports") or {}).get("./client")
        if not isinstance(client_export, dict) or not isinstance(client_export.get("default"), str):
            errors.append("dsh.client 插件必须导出 exports['./client'].default")
        if not (root / "src" / "client" / "index.ts").is_file():
            errors.append("dsh.client 插件缺少 src/client/index.ts")

    entry_candidates = [
        root / "src" / "index.ts",
        root / "index.ts",
        root / "index.js",
        root / "src" / "index.js",
    ]
    main = pkg.get("main")
    if isinstance(main, str):
        entry_candidates.append(root / main)

    entry = next((p for p in entry_candidates if p.is_file()), None)
    if entry is None:
        errors.append("找不到插件入口（src/index.ts 或 package.json main）")
    else:
        src = entry.read_text(encoding="utf-8")
        if not APPLY_RE.search(src):
            errors.append(f"{entry.name} 未导出 apply")
        if not NAME_RE.search(src) and "export default" not in src:
            errors.append(f"{entry.name} 未导出 name（函数插件需要）")
        if "export const Config" in src and "Schema" not in src:
            errors.append("Config 必须是 Schemastery schema，不能是普通对象")
        if SECRET_RE.search(src):
            errors.append("入口疑似硬编码密钥")
        for tool in RESERVED_TOOLS:
            if re.search(rf"name:\s*['\"]{tool}['\"]", src):
                errors.append(f"不要注册官方已占用的工具名 {tool!r}；改提供方或加钩子")

    if client is not None:
        client_src = root / "src" / "client" / "index.ts"
        if client_src.is_file():
            text = client_src.read_text(encoding="utf-8")
            if not APPLY_RE.search(text):
                errors.append("src/client/index.ts 未导出 apply")
            if "conversationEvents.register" in text and "conversation.chat.node" not in text:
                errors.append("Conversation Node 已注册 Definition，但没有注册 keyed Chat renderer")

    for path in root.rglob("*"):
        if path.suffix.lower() not in {".ts", ".js", ".yml", ".yaml", ".json", ".md"}:
            continue
        if "node_modules" in path.parts or "dist" in path.parts:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        if SECRET_RE.search(text) and path.name != "package.json":
            errors.append(f"疑似硬编码密钥: {path.relative_to(root)}")

    dev_patch = root / "cordis.dev.yml"
    if dev_patch.is_file():
        text = dev_patch.read_text(encoding="utf-8")
        if WINDOWS_BARE_ESM_PATH_RE.search(text):
            errors.append(
                "cordis.dev.yml 的 Windows 绝对路径必须使用 file:///C:/... URL；"
                "裸 C:/... 会被 Node ESM 当成不支持的协议"
            )

    return errors


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: validate_dsh_plugin.py <plugin_dir>", file=sys.stderr)
        return 2
    root = Path(argv[1]).expanduser().resolve()
    if not root.is_dir():
        print(f"不是目录: {root}", file=sys.stderr)
        return 2
    found = errors_for(root)
    if found:
        print("FAIL")
        for item in found:
            print(f"- {item}")
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
