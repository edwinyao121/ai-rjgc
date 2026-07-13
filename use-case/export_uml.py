#!/usr/bin/env python3
"""Export the three UML diagrams in the companion Markdown document.

The exporter deliberately uses only the Python standard library so it can be
re-run in a clean checkout without a diagramming application or third-party
package.  The source PlantUML blocks remain the semantic source of truth;
the format writers build editable native shapes from those blocks.
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


EXPECTED_TYPES = ("activity", "sequence", "component")
TYPE_NAMES = {
    "activity": "端到端活动图",
    "sequence": "核心时序图",
    "component": "组件图",
}


@dataclass(frozen=True)
class PlantUmlBlock:
    kind: str
    text: str
    start: int
    end: int


def classify_plantuml(text: str) -> str:
    """Return the known diagram kind represented by one PlantUML block."""

    if "start\n" in text and "while (验证是否通过?)" in text:
        return "activity"
    if "actor 项目负责人 as Owner" in text and "participant \"外部系统\" as External" in text:
        return "sequence"
    if "skinparam componentStyle rectangle" in text and 'package "云端控制面"' in text:
        return "component"
    raise ValueError("无法识别 PlantUML 图块类型")


def extract_blocks(markdown: str) -> tuple[PlantUmlBlock, ...]:
    """Extract and validate exactly the three expected PlantUML blocks."""

    matches = list(re.finditer(r"```plantuml\s*\n(.*?)\n```", markdown, re.S))
    if len(matches) != 3:
        raise ValueError(f"源文档必须恰好包含 3 个 PlantUML 图块，实际为 {len(matches)} 个")

    blocks: list[PlantUmlBlock] = []
    for match in matches:
        text = match.group(1).strip()
        if not text.startswith("@startuml") or not text.endswith("@enduml"):
            raise ValueError("PlantUML 图块必须以 @startuml 开始并以 @enduml 结束")
        blocks.append(PlantUmlBlock(classify_plantuml(text), text, match.start(), match.end()))

    kinds = tuple(block.kind for block in blocks)
    if set(kinds) != set(EXPECTED_TYPES):
        missing = sorted(set(EXPECTED_TYPES) - set(kinds))
        duplicate = sorted(kind for kind in set(kinds) if kinds.count(kind) > 1)
        details = []
        if missing:
            details.append(f"缺少 {', '.join(missing)}")
        if duplicate:
            details.append(f"重复 {', '.join(duplicate)}")
        raise ValueError("PlantUML 图块类型不完整：" + "；".join(details))

    return tuple(sorted(blocks, key=lambda block: EXPECTED_TYPES.index(block.kind)))


def load_blocks(source: Path) -> tuple[PlantUmlBlock, ...]:
    return extract_blocks(source.read_text(encoding="utf-8"))


def parse_args() -> argparse.Namespace:
    here = Path(__file__).resolve().parent
    default_source = here / "快速生成及云原生交付_用例与UML设计_v2.0.md"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=default_source)
    parser.add_argument("--check-only", action="store_true", help="只校验源文档，不生成文件")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    blocks = load_blocks(args.source)
    if args.check_only:
        for block in blocks:
            print(f"{block.kind}: {TYPE_NAMES[block.kind]}")
        return 0
    raise NotImplementedError("格式导出尚未实现")


if __name__ == "__main__":
    raise SystemExit(main())
