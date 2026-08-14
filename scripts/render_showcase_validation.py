#!/usr/bin/env python3
"""Run the showcase checks and render their real results as a README PNG."""
from __future__ import annotations

import os
import re
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SHOWCASE = ROOT / "showcase"
OUTPUT = ROOT / "docs" / "images" / "showcase-validation.png"
ANSI_RE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")


def run(command: list[str], cwd: Path = ROOT, env: dict[str, str] | None = None) -> str:
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    completed = subprocess.run(
        command,
        cwd=cwd,
        env=merged_env,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=True,
    )
    return ANSI_RE.sub("", completed.stdout).strip()


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    windows = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
    candidates = [
        windows / ("consolab.ttf" if bold else "consola.ttf"),
        windows / ("CascadiaMono-Bold.ttf" if bold else "CascadiaMono.ttf"),
    ]
    for candidate in candidates:
        if candidate.is_file():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def main() -> int:
    dsh = shutil.which("dsh.CMD") or shutil.which("dsh") or "dsh"
    pnpm = shutil.which("pnpm.CMD") or shutil.which("pnpm") or "pnpm"
    py = shutil.which("py.exe") or shutil.which("py") or "py"
    version = run([dsh, "--version"])
    validator_lines: list[str] = []
    for package in ("dsh-greeter", "dsh-text-metrics", "dsh-command-safety"):
        result = run(
            [py, "-3", str(ROOT / "scripts" / "validate_dsh_plugin.py"), str(SHOWCASE / package)]
        )
        validator_lines.append(f"{package:<24} {result}")

    tests = run([pnpm, "test"], cwd=SHOWCASE)
    test_summary = []
    for line in tests.splitlines():
        clean = line.strip()
        if "tests " in clean or "pass " in clean or "fail " in clean:
            test_summary.append(clean)
    pass_count = sum(int(match.group(1)) for line in test_summary if (match := re.search(r"pass (\d+)", line)))
    fail_count = sum(int(match.group(1)) for line in test_summary if (match := re.search(r"fail (\d+)", line)))

    dsh_home = ROOT / ".dsh-home"
    run(
        [
            dsh,
            "plugin",
            "--profile",
            "showcase",
            "add",
            str(SHOWCASE / "dsh-greeter"),
            str(SHOWCASE / "dsh-text-metrics"),
            str(SHOWCASE / "dsh-command-safety"),
            "--offline",
        ],
        cwd=SHOWCASE,
        env={"DSH_HOME": str(dsh_home)},
    )
    config = run(
        [dsh, "--profile", "showcase", "--dump-config"],
        cwd=SHOWCASE,
        env={"DSH_HOME": str(dsh_home)},
    )
    bundles = [
        package
        for package in ("dsh-greeter", "dsh-text-metrics", "dsh-command-safety")
        if f"# == {package}" in config
    ]

    width, height = 1440, 900
    image = Image.new("RGB", (width, height), "#08111f")
    draw = ImageDraw.Draw(image)
    title_font = font(34, bold=True)
    body_font = font(24)
    small_font = font(19)
    green = "#59d185"
    blue = "#79b8ff"
    muted = "#93a4b8"
    white = "#e7edf5"

    draw.rounded_rectangle((28, 28, width - 28, height - 28), radius=18, fill="#0d1726", outline="#26374c", width=2)
    draw.ellipse((58, 58, 76, 76), fill="#ff5f57")
    draw.ellipse((86, 58, 104, 76), fill="#febc2e")
    draw.ellipse((114, 58, 132, 76), fill="#28c840")
    draw.text((164, 48), "dsh-plugin-builder · real validation run", font=title_font, fill=white)
    draw.text((60, 112), f"Captured {datetime.now().astimezone().strftime('%Y-%m-%d %H:%M UTC%z')}", font=small_font, fill=muted)

    y = 160
    sections = [
        ("$ dsh --version", [(version, green)]),
        ("$ py -3 scripts/validate_dsh_plugin.py <plugin>", [(line, green) for line in validator_lines]),
        ("$ pnpm --dir showcase test", [(f"{pass_count} smoke tests · pass {pass_count} · fail {fail_count}", green)]),
        ("$ dsh --profile showcase --dump-config", [(f"installed bundles: {', '.join(bundles)}", green)]),
    ]
    for heading, lines in sections:
        draw.text((60, y), heading, font=body_font, fill=blue)
        y += 42
        for value, color in lines:
            draw.text((86, y), value, font=body_font, fill=color)
            y += 38
        y += 24

    draw.text((60, height - 92), "Generated from command output; no model API key required.", font=small_font, fill=muted)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT, optimize=True)
    print(OUTPUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
