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
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence
from xml.etree import ElementTree as ET


EXPECTED_TYPES = ("activity", "sequence", "component")
TYPE_NAMES = {
    "activity": "端到端活动图",
    "sequence": "核心时序图",
    "component": "组件图",
}
GENERATED_AT = "2026-07-13T00:00:00+08:00"


@dataclass(frozen=True)
class PlantUmlBlock:
    kind: str
    text: str


@dataclass
class Shape:
    id: str
    label: str
    x: float
    y: float
    width: float
    height: float
    style: str
    parent: str = "1"
    kind: str = "shape"


@dataclass
class Edge:
    id: str
    source: str | None
    target: str | None
    label: str
    points: tuple[tuple[float, float], ...]
    style: str = "edgeStyle=orthogonalEdgeStyle;rounded=0;endArrow=block;html=1;"


@dataclass
class Diagram:
    kind: str
    name: str
    width: float
    height: float
    shapes: list[Shape]
    edges: list[Edge]


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
        blocks.append(PlantUmlBlock(classify_plantuml(text), text))

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


def _node_style(kind: str) -> str:
    styles = {
        "action": "rounded=1;whiteSpace=wrap;html=1;fillColor=#EAF3FF;strokeColor=#5B8FF9;fontColor=#17365D;",
        "decision": "rhombus;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontColor=#5B4500;",
        "terminal": "ellipse;whiteSpace=wrap;html=1;fillColor=#D9EAD3;strokeColor=#6AA84F;fontColor=#274E13;",
        "participant": "rounded=1;whiteSpace=wrap;html=1;fillColor=#E8F0FE;strokeColor=#3C78D8;fontColor=#17365D;",
        "frame": "rounded=0;whiteSpace=wrap;html=1;fillColor=#F8F9FA;fillOpacity=25;strokeColor=#7F8C8D;dashed=1;verticalAlign=top;align=left;spacingTop=5;",
        "component": "rounded=1;whiteSpace=wrap;html=1;fillColor=#FCE4D6;strokeColor=#C55A11;fontColor=#7F2704;",
        "package": "swimlane;html=1;horizontal=0;startSize=28;fillColor=#F3F6FA;swimlaneFillColor=#D9EAF7;strokeColor=#5B9BD5;fontStyle=1;",
    }
    return styles[kind]


def _new_shape(shapes: list[Shape], prefix: str, label: str, x: float, y: float,
               width: float, height: float, kind: str, parent: str = "1") -> Shape:
    shape = Shape(f"{prefix}-{len(shapes) + 1}", label, x, y, width, height,
                  _node_style(kind), parent=parent, kind=kind)
    shapes.append(shape)
    return shape


def _new_edge(edges: list[Edge], prefix: str, source: str | None, target: str | None,
              label: str, points: Sequence[tuple[float, float]], style: str | None = None) -> Edge:
    edge = Edge(f"{prefix}-{len(edges) + 1}", source, target, label, tuple(points),
                style or "edgeStyle=orthogonalEdgeStyle;rounded=0;endArrow=block;html=1;")
    edges.append(edge)
    return edge


def _activity_labels(block: PlantUmlBlock) -> tuple[list[str], list[str]]:
    actions = re.findall(r"^\s*:([^;]+);\s*$", block.text, re.M)
    decisions = re.findall(r"^(?:if|while) \(([^)]+)\)", block.text, re.M)
    if len(actions) != 26 or len(decisions) != 5:
        raise ValueError(f"活动图结构校验失败：动作 {len(actions)} 个、判断 {len(decisions)} 个")
    return actions, decisions


def build_activity(block: PlantUmlBlock) -> Diagram:
    actions, decisions = _activity_labels(block)
    shapes: list[Shape] = []
    edges: list[Edge] = []

    def a(text: str, x: float, y: float) -> Shape:
        return _new_shape(shapes, "activity-shape", text, x, y, 300, 58, "action")

    def d(text: str, x: float, y: float) -> Shape:
        return _new_shape(shapes, "activity-shape", text, x, y, 220, 82, "decision")

    def t(label: str, x: float, y: float) -> Shape:
        return _new_shape(shapes, "activity-shape", label, x, y, 74, 50, "terminal")

    def link(left: Shape, right: Shape, label: str = "") -> None:
        _new_edge(edges, "activity-edge", left.id, right.id, label,
                  ((left.x + left.width / 2, left.y + left.height),
                   (right.x + right.width / 2, right.y)))

    start = t("开始", 655, 20)
    submit = a(actions[0], 542, 100)
    understand = a(actions[1], 542, 188)
    strategy = a(actions[2], 542, 276)
    strategy_ok = d(decisions[0], 582, 372)
    adjust = a(actions[3], 120, 490)
    stop_strategy = t("结束", 234, 584)
    plan = a(actions[4], 542, 490)
    confirm_plan = a(actions[5], 542, 578)
    context = a(actions[6], 542, 666)
    generate = a(actions[7], 542, 754)
    validate = a(actions[8], 542, 842)
    validation_ok = d(decisions[1], 582, 938)
    analyse = a(actions[9], 120, 1060)
    repair_limit = d(decisions[2], 160, 1156)
    manual = a(actions[10], 18, 1280)
    auto_repair = a(actions[11], 360, 1280)
    retry = a(actions[12], 542, 1394)
    quality = a(actions[13], 542, 1490)
    result = a(actions[14], 542, 1578)
    cloud_delivery = d(decisions[3], 582, 1674)
    quick = a(actions[15], 120, 1798)
    stop_quick = t("结束", 234, 1896)
    container = a(actions[16], 542, 1798)
    image = a(actions[17], 542, 1886)
    resources = a(actions[18], 542, 1974)
    deploy = a(actions[19], 542, 2062)
    verify = a(actions[20], 542, 2150)
    gate = a(actions[21], 542, 2238)
    gate_ok = d(decisions[4], 582, 2334)
    fix = a(actions[22], 120, 2458)
    stop_gate = t("结束", 234, 2556)
    offline = a(actions[23], 330, 2458)
    online = a(actions[24], 820, 2458)
    delivery = a(actions[25], 542, 2570)
    stop_delivery = t("结束", 655, 2670)

    link(start, submit); link(submit, understand); link(understand, strategy); link(strategy, strategy_ok)
    link(strategy_ok, adjust, "否"); link(adjust, stop_strategy)
    link(strategy_ok, plan, "是"); link(plan, confirm_plan); link(confirm_plan, context)
    link(context, generate); link(generate, validate); link(validate, validation_ok)
    link(validation_ok, analyse, "否"); link(analyse, repair_limit)
    link(repair_limit, manual, "是"); link(repair_limit, auto_repair, "否")
    link(manual, retry); link(auto_repair, retry); link(retry, validation_ok, "重新验证")
    link(validation_ok, quality, "是"); link(quality, result); link(result, cloud_delivery)
    link(cloud_delivery, quick, "否"); link(quick, stop_quick)
    link(cloud_delivery, container, "是"); link(container, image); link(image, resources)
    link(resources, deploy); link(deploy, verify); link(verify, gate); link(gate, gate_ok)
    link(gate_ok, fix, "否"); link(fix, stop_gate)
    link(gate_ok, offline, "是"); link(gate_ok, online, "否")
    link(offline, delivery); link(online, delivery); link(delivery, stop_delivery)
    return Diagram("activity", TYPE_NAMES["activity"], 1320, 2780, shapes, edges)


def _sequence_participants(block: PlantUmlBlock) -> list[tuple[str, str]]:
    participants: list[tuple[str, str]] = []
    for line in block.text.splitlines():
        match = re.match(r'^\s*(?:actor|participant)\s+(?:"([^"]+)"|(\S+))\s+as\s+(\w+)\s*$', line)
        if match:
            participants.append((match.group(3), match.group(1) or match.group(2)))
    if len(participants) != 8:
        raise ValueError(f"时序图结构校验失败：参与者 {len(participants)} 个")
    return participants


MESSAGE_RE = re.compile(r"^\s*(\w+)\s+(-+>|<--|-->|->|\.\.>)\s+(\w+)\s*:\s*(.+?)\s*$")


def _sequence_events(block: PlantUmlBlock) -> tuple[list[tuple[str, str, str]], list[tuple[str, int, int]]]:
    messages: list[tuple[str, str, str]] = []
    frames: list[tuple[str, int, int]] = []
    stack: list[tuple[str, int]] = []
    for line in block.text.splitlines():
        stripped = line.strip()
        if stripped.startswith("alt "):
            stack.append((stripped[4:], len(messages)))
        elif stripped == "end" and stack:
            label, start = stack.pop()
            frames.append((label, start, len(messages)))
        elif stripped.startswith("else "):
            messages.append(("__branch__", "__branch__", stripped[5:]))
        else:
            match = MESSAGE_RE.match(line)
            if match:
                messages.append((match.group(1), match.group(3), match.group(4)))
    if stack:
        raise ValueError("时序图结构校验失败：存在未闭合的 alt 分支")
    if len(messages) < 30 or len(frames) != 4:
        raise ValueError(f"时序图结构校验失败：消息 {len(messages)} 个、交互框 {len(frames)} 个")
    return messages, frames


def build_sequence(block: PlantUmlBlock) -> Diagram:
    participants = _sequence_participants(block)
    messages, frames = _sequence_events(block)
    shapes: list[Shape] = []
    edges: list[Edge] = []
    alias_ids: dict[str, str] = {}
    x_by_alias: dict[str, float] = {}
    left = 70
    column = 172
    for index, (alias, label) in enumerate(participants):
        x = left + index * column
        x_by_alias[alias] = x + 48
        head = _new_shape(shapes, "sequence-participant", label, x, 30, 96, 52, "participant")
        alias_ids[alias] = head.id

    bottom = 160 + len(messages) * 38
    for alias, label in participants:
        x = x_by_alias[alias]
        _new_edge(edges, "sequence-lifeline", alias_ids[alias], alias_ids[alias], f"生命线：{label}",
                  ((x, 82), (x, bottom)),
                  "edgeStyle=none;dashed=1;endArrow=none;html=1;strokeColor=#9E9E9E;")

    frame_shapes: list[tuple[Shape, int, int]] = []
    for label, start, end in frames:
        y1 = 126 + max(0, start) * 38
        y2 = 126 + max(start + 1, end) * 38 + 26
        frame_shapes.append((_new_shape(shapes, "sequence-frame", f"条件分支：{label}", 32, y1, 1360, y2 - y1,
                                         "frame"), start, end))

    for index, (source, target, label) in enumerate(messages):
        y = 126 + index * 38
        if source == "__branch__":
            _new_edge(edges, "sequence-branch", None, None, f"分支：{label}", ((32, y), (1392, y)),
                      "edgeStyle=none;dashed=1;endArrow=none;html=1;strokeColor=#7F8C8D;")
            continue
        if source not in alias_ids or target not in alias_ids:
            raise ValueError(f"时序图引用了未声明的参与者：{source} 或 {target}")
        x1, x2 = x_by_alias[source], x_by_alias[target]
        _new_edge(edges, "sequence-message", alias_ids[source], alias_ids[target], label,
                  ((x1, y), (x2, y)),
                  "edgeStyle=orthogonalEdgeStyle;rounded=0;endArrow=block;html=1;fontSize=11;")
    return Diagram("sequence", TYPE_NAMES["sequence"], 1450, bottom + 80, shapes, edges)


CONNECTION_RE = re.compile(r"^\s*(\w+)\s+(-+>)\s+(\w+)\s*:\s*(.+?)\s*$")


def _component_parts(block: PlantUmlBlock) -> tuple[list[tuple[str, str, list[tuple[str, str]]]], list[tuple[str, str, str, str]]]:
    packages: list[tuple[str, str, list[tuple[str, str]]]] = []
    current: tuple[str, str, list[tuple[str, str]]] | None = None
    connections: list[tuple[str, str, str, str]] = []
    for line in block.text.splitlines():
        stripped = line.strip()
        package_match = re.match(r'^package\s+"([^"]+)"\s*\{$', stripped)
        if package_match:
            current = (package_match.group(1), f"component-package-{len(packages) + 1}", [])
            packages.append(current)
            continue
        if stripped == "}":
            current = None
            continue
        component_match = re.match(r'^\[([^\]]+)\]\s+as\s+(\w+)$', stripped)
        if component_match:
            if current is None:
                raise ValueError("组件图组件必须位于 package 中")
            current[2].append((component_match.group(2), component_match.group(1)))
            continue
        connection_match = CONNECTION_RE.match(line)
        if connection_match:
            connections.append((connection_match.group(1), connection_match.group(3), connection_match.group(4), connection_match.group(2)))
    if len(packages) != 3 or sum(len(package[2]) for package in packages) != 16 or len(connections) != 23:
        counts = ", ".join(f"{name}:{len(items)}" for name, _, items in packages)
        raise ValueError(f"组件图结构校验失败：分组 {len(packages)} 个（{counts}），连接 {len(connections)} 条")
    return packages, connections


def build_component(block: PlantUmlBlock) -> Diagram:
    packages, connections = _component_parts(block)
    shapes: list[Shape] = []
    edges: list[Edge] = []
    component_ids: dict[str, str] = {}
    component_centers: dict[str, tuple[float, float]] = {}
    group_specs = [(40, 40, 500, 610), (600, 40, 500, 610), (1160, 40, 500, 610)]
    for (package_name, package_id, components), (x, y, width, height) in zip(packages, group_specs):
        group = _new_shape(shapes, package_id, package_name, x, y, width, height, "package")
        for index, (alias, label) in enumerate(components):
            row, col = divmod(index, 2)
            component = _new_shape(shapes, "component-shape", label, x + 26 + col * 232, y + 68 + row * 132,
                                   205, 82, "component", parent=group.id)
            component_ids[alias] = component.id
            component_centers[alias] = (component.x + component.width / 2, component.y + component.height / 2)
    for source, target, label, _arrow in connections:
        if source not in component_ids or target not in component_ids:
            raise ValueError(f"组件图连接引用了未声明的组件：{source} 或 {target}")
        _new_edge(edges, "component-edge", component_ids[source], component_ids[target], label,
                  (component_centers[source], component_centers[target]))
    return Diagram("component", TYPE_NAMES["component"], 1700, 720, shapes, edges)


def build_diagrams(blocks: Iterable[PlantUmlBlock]) -> tuple[Diagram, ...]:
    builders = {"activity": build_activity, "sequence": build_sequence, "component": build_component}
    return tuple(builders[block.kind](block) for block in blocks)


def _drawio_geometry(shape: Shape, parents: dict[str, Shape]) -> tuple[float, float]:
    if shape.parent in parents:
        parent = parents[shape.parent]
        return shape.x - parent.x, shape.y - parent.y
    return shape.x, shape.y


def write_drawio(diagrams: Iterable[Diagram], output: Path) -> None:
    root = ET.Element("mxfile", {
        "host": "app.diagrams.net",
        "modified": GENERATED_AT,
        "agent": "Codex UML exporter",
        "version": "24.7.17",
        "type": "device",
    })
    for diagram in diagrams:
        page = ET.SubElement(root, "diagram", {"id": diagram.kind, "name": diagram.name})
        graph = ET.SubElement(page, "mxGraphModel", {
            "dx": "1600", "dy": "1000", "grid": "1", "gridSize": "10",
            "guides": "1", "tooltips": "1", "connect": "1", "arrows": "1",
            "fold": "1", "page": "1", "pageScale": "1", "math": "0", "shadow": "0",
            "pageWidth": str(max(1169, int(diagram.width))),
            "pageHeight": str(max(827, int(diagram.height))),
        })
        graph_root = ET.SubElement(graph, "root")
        ET.SubElement(graph_root, "mxCell", {"id": "0"})
        ET.SubElement(graph_root, "mxCell", {"id": "1", "parent": "0"})
        parents = {shape.id: shape for shape in diagram.shapes if shape.kind == "package"}
        # Draw background containers first so their child shapes remain visible.
        ordered_shapes = sorted(diagram.shapes, key=lambda shape: (shape.kind != "package", shape.parent != "1"))
        for shape in ordered_shapes:
            x, y = _drawio_geometry(shape, parents)
            cell = ET.SubElement(graph_root, "mxCell", {
                "id": shape.id,
                "value": shape.label,
                "style": shape.style,
                "vertex": "1",
                "parent": shape.parent,
            })
            ET.SubElement(cell, "mxGeometry", {
                "x": str(x), "y": str(y), "width": str(shape.width), "height": str(shape.height),
                "as": "geometry",
            })
        for edge in diagram.edges:
            attrs = {
                "id": edge.id, "value": edge.label, "style": edge.style,
                "edge": "1", "parent": "1",
            }
            if edge.source:
                attrs["source"] = edge.source
            if edge.target:
                attrs["target"] = edge.target
            cell = ET.SubElement(graph_root, "mxCell", attrs)
            geometry = ET.SubElement(cell, "mxGeometry", {"relative": "1", "as": "geometry"})
            if edge.points:
                points = ET.SubElement(geometry, "Array", {"as": "points"})
                for x, y in edge.points:
                    ET.SubElement(points, "mxPoint", {"x": str(x), "y": str(y)})
                if not edge.source:
                    ET.SubElement(geometry, "mxPoint", {"x": str(edge.points[0][0]), "y": str(edge.points[0][1]), "as": "sourcePoint"})
                if not edge.target:
                    ET.SubElement(geometry, "mxPoint", {"x": str(edge.points[-1][0]), "y": str(edge.points[-1][1]), "as": "targetPoint"})
    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    output.write_bytes(ET.tostring(root, encoding="utf-8", xml_declaration=True))


VSD_NS = "http://schemas.microsoft.com/office/visio/2012/main"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
DOC_REL_NS = "http://schemas.microsoft.com/visio/2010/relationships"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def _q(name: str) -> str:
    return f"{{{VSD_NS}}}{name}"


def _cell(parent: ET.Element, name: str, value: str | float) -> None:
    ET.SubElement(parent, _q("Cell"), {"N": name, "V": str(value)})


def _visio_text(parent: ET.Element, text: str) -> None:
    text_node = ET.SubElement(parent, _q("Text"))
    ET.SubElement(text_node, _q("cp"), {"IX": "0"})
    ET.SubElement(text_node, _q("pp"), {"IX": "0"})
    ET.SubElement(text_node, _q("tp"), {"IX": "0"})
    text_node.text = text


def _visio_shape(shape: Shape, numeric_id: int, page_height: float,
                 parent_origin: tuple[float, float] = (0, 0)) -> ET.Element:
    local_x = shape.x - parent_origin[0]
    local_y = shape.y - parent_origin[1]
    x = (local_x + shape.width / 2) / 96
    y = (page_height - local_y - shape.height / 2) / 96
    element = ET.Element(_q("Shape"), {
        "ID": str(numeric_id),
        "Type": "Group" if shape.kind == "package" else "Shape",
        "NameU": shape.id,
    })
    _cell(element, "PinX", x)
    _cell(element, "PinY", y)
    _cell(element, "Width", shape.width / 96)
    _cell(element, "Height", shape.height / 96)
    _cell(element, "LocPinX", shape.width / 192)
    _cell(element, "LocPinY", shape.height / 192)
    _cell(element, "LineColor", "#5B8FF9" if shape.kind != "package" else "#5B9BD5")
    _cell(element, "FillForegnd", "#FFFFFF")
    _cell(element, "FillPattern", "1")
    _visio_text(element, shape.label)
    return element


def _visio_page(diagram: Diagram, page_index: int) -> bytes:
    root = ET.Element(_q("PageContents"), {"xmlns:r": R_NS})
    shapes_node = ET.SubElement(root, _q("Shapes"))
    numeric: dict[str, int] = {}
    for index, shape in enumerate(diagram.shapes, start=1):
        numeric[shape.id] = page_index * 10000 + index

    for shape in diagram.shapes:
        if shape.parent != "1":
            continue
        element = _visio_shape(shape, numeric[shape.id], diagram.height, (0, 0))
        if shape.kind == "package":
            nested = ET.SubElement(element, _q("Shapes"))
            for child in diagram.shapes:
                if child.parent == shape.id:
                    nested.append(_visio_shape(child, numeric[child.id], diagram.height, (shape.x, shape.y)))
        shapes_node.append(element)

    connects = ET.SubElement(root, _q("Connects"))
    for index, edge in enumerate(diagram.edges, start=1):
        connector_id = page_index * 10000 + 5000 + index
        connector = _visio_connector(edge, connector_id, diagram.height)
        shapes_node.append(connector)
        if edge.source and edge.source in numeric:
            ET.SubElement(connects, _q("Connect"), {
                "FromSheet": str(connector_id), "FromPart": "9", "ToSheet": str(numeric[edge.source]), "ToPart": "1",
            })
        if edge.target and edge.target in numeric:
            ET.SubElement(connects, _q("Connect"), {
                "FromSheet": str(connector_id), "FromPart": "9", "ToSheet": str(numeric[edge.target]), "ToPart": "1",
            })
    ET.indent(root, space="  ")
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def _visio_connector(edge: Edge, numeric_id: int, page_height: float) -> ET.Element:
    start = edge.points[0] if edge.points else (0, 0)
    end = edge.points[-1] if edge.points else start
    element = ET.Element(_q("Shape"), {"ID": str(numeric_id), "Type": "Shape", "OneD": "1", "NameU": edge.id})
    _cell(element, "BeginX", start[0] / 96)
    _cell(element, "BeginY", (page_height - start[1]) / 96)
    _cell(element, "EndX", end[0] / 96)
    _cell(element, "EndY", (page_height - end[1]) / 96)
    _cell(element, "LineColor", "#7F8C8D")
    _cell(element, "LineWeight", "0.0138889")
    geometry = ET.SubElement(element, _q("Section"), {"N": "Geometry"})
    row0 = ET.SubElement(geometry, _q("Row"), {"T": "Rel", "IX": "0"})
    _cell(row0, "X", "0")
    _cell(row0, "Y", "0")
    row1 = ET.SubElement(geometry, _q("Row"), {"T": "Rel", "IX": "1"})
    _cell(row1, "X", "1")
    _cell(row1, "Y", "1")
    if edge.label:
        _visio_text(element, edge.label)
    return element


def _relationship(rel_id: str, rel_type: str, target: str) -> ET.Element:
    return ET.Element("Relationship", {"Id": rel_id, "Type": rel_type, "Target": target})


def _xml_bytes(root: ET.Element) -> bytes:
    ET.indent(root, space="  ")
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def write_vsdx(diagrams: Iterable[Diagram], output: Path) -> None:
    diagrams = tuple(diagrams)
    ET.register_namespace("", VSD_NS)
    ET.register_namespace("r", R_NS)
    timestamp = GENERATED_AT
    content_types = ET.Element("Types", {"xmlns": "http://schemas.openxmlformats.org/package/2006/content-types"})
    ET.SubElement(content_types, "Default", {"Extension": "rels", "ContentType": "application/vnd.openxmlformats-package.relationships+xml"})
    ET.SubElement(content_types, "Default", {"Extension": "xml", "ContentType": "application/xml"})
    overrides = [
        ("/visio/document.xml", "application/vnd.ms-visio.document.main+xml"),
        ("/visio/pages/pages.xml", "application/vnd.ms-visio.pages+xml"),
        ("/docProps/core.xml", "application/vnd.openxmlformats-package.core-properties+xml"),
        ("/docProps/app.xml", "application/vnd.openxmlformats-officedocument.extended-properties+xml"),
    ]
    overrides.extend((f"/visio/pages/page{index}.xml", "application/vnd.ms-visio.page+xml") for index in range(1, len(diagrams) + 1))
    for part, content_type in overrides:
        ET.SubElement(content_types, "Override", {"PartName": part, "ContentType": content_type})

    root_rels = ET.Element("Relationships", {"xmlns": REL_NS})
    root_rels.append(_relationship("rId1", "http://schemas.microsoft.com/visio/2010/relationships/document", "visio/document.xml"))
    root_rels.append(_relationship("rId2", "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", "docProps/core.xml"))
    root_rels.append(_relationship("rId3", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties", "docProps/app.xml"))

    document = ET.Element(_q("VisioDocument"), {"xmlns:r": R_NS})
    ET.SubElement(document, _q("DocumentProperties"), {"Creator": "Codex", "Created": timestamp})
    colors = ET.SubElement(document, _q("Colors"))
    ET.SubElement(colors, _q("ColorEntry"), {"IX": "0", "RGB": "FFFFFF"})
    face_names = ET.SubElement(document, _q("FaceNames"))
    ET.SubElement(face_names, _q("FaceName"), {"ID": "0", "Name": "Arial"})
    ET.SubElement(document, _q("DocumentSettings"), {"GlueSettings": "0", "SnapSettings": "0", "SnapExtensions": "0", "SnapAngles": "0", "DynamicGridEnabled": "0"})

    pages = ET.Element(_q("Pages"))
    pages_rels = ET.Element("Relationships", {"xmlns": REL_NS})
    for index, diagram in enumerate(diagrams, start=1):
        page = ET.SubElement(pages, _q("Page"), {"ID": str(index - 1), "NameU": diagram.name, "Name": diagram.name})
        ET.SubElement(page, _q("Rel"), {f"{{{R_NS}}}id": f"rId{index}"})
        pages_rels.append(_relationship(f"rId{index}", f"{DOC_REL_NS}/page", f"page{index}.xml"))

    core = ET.Element("cp:coreProperties", {
        "xmlns:cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
        "xmlns:dc": "http://purl.org/dc/elements/1.1/",
        "xmlns:dcterms": "http://purl.org/dc/terms/",
        "xmlns:dcmitype": "http://purl.org/dc/dcmitype/",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    })
    ET.SubElement(core, "dc:title").text = "快速生成及云原生交付 UML"
    ET.SubElement(core, "dc:creator").text = "Codex"
    ET.SubElement(core, "dcterms:created", {"xsi:type": "dcterms:W3CDTF"}).text = timestamp
    app = ET.Element("Properties", {"xmlns": "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"})
    ET.SubElement(app, "Application").text = "Codex UML exporter"
    ET.SubElement(app, "Pages").text = str(len(diagrams))

    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(*_zip_entry("[Content_Types].xml", _xml_bytes(content_types)))
        archive.writestr(*_zip_entry("_rels/.rels", _xml_bytes(root_rels)))
        archive.writestr(*_zip_entry("visio/document.xml", _xml_bytes(document)))
        archive.writestr(*_zip_entry("visio/_rels/document.xml.rels", _xml_bytes(_document_relationships())))
        archive.writestr(*_zip_entry("visio/pages/pages.xml", _xml_bytes(pages)))
        archive.writestr(*_zip_entry("visio/pages/_rels/pages.xml.rels", _xml_bytes(pages_rels)))
        for index, diagram in enumerate(diagrams, start=1):
            archive.writestr(*_zip_entry(f"visio/pages/page{index}.xml", _visio_page(diagram, index)))
        archive.writestr(*_zip_entry("docProps/core.xml", _xml_bytes(core)))
        archive.writestr(*_zip_entry("docProps/app.xml", _xml_bytes(app)))


def _document_relationships() -> ET.Element:
    rels = ET.Element("Relationships", {"xmlns": REL_NS})
    rels.append(_relationship("rId1", f"{DOC_REL_NS}/pages", "pages/pages.xml"))
    return rels


def _zip_entry(name: str, content: bytes) -> tuple[zipfile.ZipInfo, bytes]:
    info = zipfile.ZipInfo(name, date_time=(2026, 7, 13, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    return info, content


def parse_args() -> argparse.Namespace:
    here = Path(__file__).resolve().parent
    default_source = here / "快速生成及云原生交付_用例与UML设计_v2.0.md"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=default_source)
    parser.add_argument("--drawio", type=Path, help="draw.io 输出路径")
    parser.add_argument("--vsdx", type=Path, help="Visio 输出路径")
    parser.add_argument("--check-only", action="store_true", help="只校验源文档，不生成文件")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    blocks = load_blocks(args.source)
    if args.check_only:
        for block in blocks:
            print(f"{block.kind}: {TYPE_NAMES[block.kind]}")
        return 0
    diagrams = build_diagrams(blocks)
    drawio = args.drawio or args.source.with_suffix(".drawio")
    vsdx = args.vsdx or args.source.with_suffix(".vsdx")
    drawio.parent.mkdir(parents=True, exist_ok=True)
    vsdx.parent.mkdir(parents=True, exist_ok=True)
    write_drawio(diagrams, drawio)
    write_vsdx(diagrams, vsdx)
    print(f"已生成 {drawio}")
    print(f"已生成 {vsdx}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
