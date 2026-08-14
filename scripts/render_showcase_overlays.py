#!/usr/bin/env python3
"""Render portable showcase overlays with import specifiers for this checkout."""
from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SHOWCASE = ROOT / "showcase"


def uri(package: str) -> str:
    return (SHOWCASE / package / "src" / "index.ts").resolve().as_uri()


def write(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")
    print(path)


def main() -> int:
    readiness = uri("dsh-release-readiness")
    safety = uri("dsh-command-safety")

    write(
        SHOWCASE / "cordis.dev.yml",
        f"""- insert:
    - id: showcase-release-readiness
      name: '{readiness}'
      config:
        maxChecks: 24
    - id: showcase-command-safety
      name: '{safety}'
      config:
        protectedTools:
          - bash
          - pwsh
        blockedPatterns:
          - '\\brm\\s+-(?=[^\\s]*r)(?=[^\\s]*f)[^\\s]+\\s+(?:/|~|\\$HOME)(?:\\s|$)'
          - '\\bRemove-Item\\b(?=[^\\r\\n]*\\b-Recurse\\b)(?=[^\\r\\n]*\\b-Force\\b)'
        reason: 'Blocked by the showcase command-safety policy.'
""",
    )
    write(
        SHOWCASE / "dsh-release-readiness" / "cordis.dev.yml",
        f"""- insert:
    - id: showcase-release-readiness
      name: '{readiness}'
      config:
        maxChecks: 24
""",
    )
    write(
        SHOWCASE / "dsh-command-safety" / "cordis.dev.yml",
        f"""- insert:
    - id: showcase-command-safety
      name: '{safety}'
      config:
        protectedTools:
          - bash
          - pwsh
        blockedPatterns:
          - '\\brm\\s+-(?=[^\\s]*r)(?=[^\\s]*f)[^\\s]+\\s+(?:/|~|\\$HOME)(?:\\s|$)'
          - '\\bRemove-Item\\b(?=[^\\r\\n]*\\b-Recurse\\b)(?=[^\\r\\n]*\\b-Force\\b)'
        reason: 'Blocked by the command-safety policy.'
""",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
