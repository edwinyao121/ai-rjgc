#!/usr/bin/env python3
"""Create an editable one-page Visio diagram from the quick-delivery reference image.

The reference image is used as the layout/content guide.  The generated page is
made of native Visio shapes and connectors; the image itself is not embedded.
"""

from __future__ import annotations

import argparse
import copy
import math
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


VSD_NS = "http://schemas.microsoft.com/office/visio/2012/main"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
CONTENT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
DC_NS = "http://purl.org/dc/elements/1.1/"
CP_NS = "http://schemas.openxmlformats.org/package/2006/metadata/core-properties"

PAGE_WIDTH = 17.5
PAGE_HEIGHT = 17.0


def q(name: str) -> str:
    return f"{{{VSD_NS}}}{name}"


def local(node: ET.Element, name: str) -> ET.Element | None:
    return node.find(f"./{{*}}{name}")


def cell(parent: ET.Element, name: str, value: str | float, formula: str | None = None) -> ET.Element:
    attrs = {"N": name, "V": str(value)}
    if formula:
        attrs["F"] = formula
    return ET.SubElement(parent, q("Cell"), attrs)


class PageBuilder:
    def __init__(self) -> None:
        self.root = ET.Element(q("PageContents"), {"{http://www.w3.org/XML/1998/namespace}space": "preserve"})
        self.shapes = ET.SubElement(self.root, q("Shapes"))
        self.next_id = 1

    def _shape(self, label: str, cx: float, cy: float, width: float, height: float,
               fill: str | None, stroke: str | None, *, kind: str = "rect",
               font_color: str = "#203040", font_size: float = 8.5,
               line_pattern: str = "1", fill_pattern: str = "1") -> ET.Element:
        shape = ET.SubElement(self.shapes, q("Shape"), {
            "ID": str(self.next_id), "Type": "Shape", "LineStyle": "3",
            "FillStyle": "3", "TextStyle": "3",
        })
        self.next_id += 1
        cell(shape, "PinX", cx)
        cell(shape, "PinY", cy)
        cell(shape, "Width", width)
        cell(shape, "Height", height)
        cell(shape, "LocPinX", width / 2, "Width*0.5")
        cell(shape, "LocPinY", height / 2, "Height*0.5")
        cell(shape, "Angle", 0)
        cell(shape, "FlipX", 0)
        cell(shape, "FlipY", 0)
        cell(shape, "ResizeMode", 0)
        cell(shape, "LinePattern", line_pattern)
        cell(shape, "FillPattern", fill_pattern)
        if stroke:
            cell(shape, "LineColor", stroke)
            cell(shape, "LineWeight", "0.0138889")
        if fill:
            cell(shape, "FillForegnd", fill)
        cell(shape, "CharSize", font_size, "THEMEGUARD(7.5 pt)")
        cell(shape, "Color", font_color)

        geometry = ET.SubElement(shape, q("Section"), {"N": "Geometry", "IX": "0"})
        cell(geometry, "NoFill", 0 if fill else 1)
        cell(geometry, "NoLine", 0 if stroke else 1)
        cell(geometry, "NoShow", 0)
        cell(geometry, "NoSnap", 0)
        cell(geometry, "NoQuickDrag", 0)
        if kind == "diamond":
            points = ((width / 2, height), (width, height / 2), (width / 2, 0), (0, height / 2), (0, 0))
            row = ET.SubElement(geometry, q("Row"), {"T": "MoveTo", "IX": "1"})
            cell(row, "X", points[0][0]); cell(row, "Y", points[0][1])
            for index, (x, y) in enumerate(points[1:], start=2):
                row = ET.SubElement(geometry, q("Row"), {"T": "LineTo", "IX": str(index)})
                cell(row, "X", x); cell(row, "Y", y)
        elif kind == "oval":
            row = ET.SubElement(geometry, q("Row"), {"T": "Ellipse", "IX": "1"})
            cell(row, "X", width / 2, "Width*0.5")
            cell(row, "Y", height / 2, "Height*0.5")
            cell(row, "A", width / 2, "Width*0.5")
            cell(row, "B", height / 2, "Height*0.5")
        else:
            points = ((0, 0), (width, 0), (width, height), (0, height), (0, 0))
            for index, (x, y) in enumerate(points, start=1):
                row_type = "MoveTo" if index == 1 else "LineTo"
                row = ET.SubElement(geometry, q("Row"), {"T": row_type, "IX": str(index)})
                cell(row, "X", x); cell(row, "Y", y)

        if label:
            text = ET.SubElement(shape, q("Text"))
            text.text = label
        return shape

    def box(self, label: str, cx: float, cy: float, width: float, height: float,
            fill: str = "#FFFFFF", stroke: str = "#9EADBA", **kwargs: object) -> ET.Element:
        return self._shape(label, cx, cy, width, height, fill, stroke, **kwargs)

    def text(self, label: str, cx: float, cy: float, width: float, height: float,
             font_color: str = "#203040", font_size: float = 8.5) -> ET.Element:
        return self._shape(label, cx, cy, width, height, None, None,
                           font_color=font_color, font_size=font_size, fill_pattern="0", line_pattern="0")

    def oval(self, label: str, cx: float, cy: float, width: float, height: float,
             fill: str, stroke: str, font_color: str = "#203040", font_size: float = 8.5) -> ET.Element:
        return self._shape(label, cx, cy, width, height, fill, stroke, kind="oval",
                           font_color=font_color, font_size=font_size)

    def diamond(self, label: str, cx: float, cy: float, width: float, height: float,
                fill: str, stroke: str, font_size: float = 8.0) -> ET.Element:
        return self._shape(label, cx, cy, width, height, fill, stroke, kind="diamond", font_size=font_size)

    def connector(self, x1: float, y1: float, x2: float, y2: float, *, label: str = "",
                  stroke: str = "#56616B", arrow: bool = True, dashed: bool = False,
                  font_size: float = 7.0) -> ET.Element:
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy) or 0.001
        shape = ET.SubElement(self.shapes, q("Shape"), {
            "ID": str(self.next_id), "Type": "Shape", "LineStyle": "3",
            "FillStyle": "3", "TextStyle": "3",
        })
        self.next_id += 1
        cell(shape, "PinX", (x1 + x2) / 2, "(BeginX+EndX)/2")
        cell(shape, "PinY", (y1 + y2) / 2, "(BeginY+EndY)/2")
        cell(shape, "Width", length, "SQRT((EndX-BeginX)^2+(EndY-BeginY)^2)")
        cell(shape, "Height", 0)
        cell(shape, "LocPinX", length / 2, "Width*0.5")
        cell(shape, "LocPinY", 0, "Height*0.5")
        cell(shape, "Angle", math.atan2(dy, dx), "ATAN2(EndY-BeginY,EndX-BeginX)")
        cell(shape, "BeginX", x1); cell(shape, "BeginY", y1)
        cell(shape, "EndX", x2); cell(shape, "EndY", y2)
        cell(shape, "LineColor", stroke)
        cell(shape, "LineWeight", "0.0138889")
        cell(shape, "LinePattern", "2" if dashed else "1")
        if arrow:
            cell(shape, "EndArrow", "5")
        geometry = ET.SubElement(shape, q("Section"), {"N": "Geometry", "IX": "0"})
        cell(geometry, "NoFill", 1); cell(geometry, "NoLine", 0); cell(geometry, "NoShow", 0)
        row = ET.SubElement(geometry, q("Row"), {"T": "MoveTo", "IX": "1"})
        cell(row, "X", 0, "Width*0"); cell(row, "Y", 0)
        row = ET.SubElement(geometry, q("Row"), {"T": "LineTo", "IX": "2"})
        cell(row, "X", length, "Width*1"); cell(row, "Y", 0)
        if label:
            text = ET.SubElement(shape, q("Text")); text.text = label
        return shape

    def bytes(self) -> bytes:
        return ET.tostring(self.root, encoding="utf-8", xml_declaration=True)


def build_page() -> bytes:
    b = PageBuilder()
    # Background regions.
    b.box("", 1.0, 8.6, 1.8, 14.9, "#FFFFFF", "#8C8C8C")
    b.box("", 8.7, 12.9, 13.2, 5.5, "#FFFFFF", "#9EADBA")
    b.box("", 8.7, 7.7, 13.2, 4.7, "#FFFFFF", "#9EADBA")
    b.box("", 8.7, 3.0, 13.2, 3.4, "#FFFFFF", "#9EADBA")
    b.box("", 16.4, 10.9, 1.8, 7.0, "#FFFFFF", "#8C8C8C")

    # Title and section labels.
    b.text("快速生成及云原生交付 - 用例图（按工程等级展示不同流程）", 8.75, 16.55, 15.8, 0.36, "#174A84", 16)
    b.text("系统根据工程等级决定快速生成路径，再根据风险等级决定交付控制强度", 8.75, 16.10, 13.5, 0.30, "#263238", 9.5)
    b.text("一、快速生成流程（根据工程等级选择路径）", 8.7, 15.60, 7.0, 0.28, "#1261A0", 10.5)
    b.text("二、分级门禁与验证（根据风险等级执行不同控制强度）", 8.7, 10.25, 9.5, 0.28, "#C54E19", 10.5)
    b.text("三、云原生交付流程（生成交付物并完成部署或打包）", 8.7, 4.48, 9.5, 0.28, "#2E7D32", 10.5)

    panel_x = (4.6, 8.7, 12.8)
    top_specs = [
        ("工程等级：验证原型", "目标：快速验证想法、流程与交互", "#EAF3FF", "#5B9BD5", ["1.1 提交需求与场景描述", "1.2 生成验证原型计划", "1.3 快速生成原型应用", "1.4 原型自动启动与体验验证", "1.5 收集反馈与需求迭代"]),
        ("工程等级：轻量可用", "目标：形成可运行的轻量应用", "#EEF8EA", "#70AD62", ["1.1 提交需求与场景描述", "1.2 生成轻量应用计划", "1.3 生成代码与基础测试", "1.4 自动构建与本地验证", "1.5 修复与完善"]),
        ("工程等级：生产级", "目标：形成符合规范的生产级应用", "#F3EEFC", "#8064A2", ["1.1 提交需求与场景描述", "1.2 生成生产级计划与方案", "1.3 生成代码、测试与配置", "1.4 自动化构建与完整验证", "1.5 修复与完善"]),
    ]
    for x, (heading, goal, fill, stroke, steps) in zip(panel_x, top_specs):
        b.box("", x, 12.9, 3.65, 4.75, fill, stroke)
        b.text(heading, x, 15.22, 3.15, 0.30, "#1F1F1F", 9.0)
        b.text(goal, x, 14.88, 3.15, 0.26, "#3F3F3F", 7.0)
        ys = (14.35, 13.67, 12.99, 12.31, 11.63)
        for index, (y, step) in enumerate(zip(ys, steps)):
            b.oval(step, x, y, 3.0, 0.42, "#FFFFFF", stroke, font_size=7.2)
            if index:
                b.connector(x, y + 0.22, x, y + 0.46, stroke=stroke)

    risk_specs = [
        ("风险等级：低风险", "示例：内部工具、非核心流程", "#FFF4D9", "#E9A323", ["2.1 冒烟测试与基本检查", "2.2 质量人员快速评估"]),
        ("风险等级：标准风险", "示例：业务应用、一般数据", "#FFF0D9", "#F0A000", ["2.1 功能测试与集成测试", "2.2 代码与安全扫描", "2.3 质量人员评估与签字"]),
        ("风险等级：高风险", "示例：核心业务、敏感数据、外部服务", "#FFF0EE", "#E86A5B", ["2.1 全面测试与性能测试", "2.2 安全扫描与合规检查", "2.3 风险评估与审批", "2.4 质量人员与负责人联合确认"]),
    ]
    for x, (heading, example, fill, stroke, steps) in zip(panel_x, risk_specs):
        b.box("", x, 7.7, 3.65, 4.05, fill, stroke)
        b.text(heading, x, 9.53, 3.15, 0.28, stroke, 8.8)
        b.text(example, x, 9.20, 3.15, 0.28, "#3F3F3F", 6.6)
        ys = (8.70, 8.06, 7.42, 6.78)
        for index, (y, step) in enumerate(zip(ys, steps)):
            b.oval(step, x, y, 3.0, 0.42, "#FFFFFF", stroke, font_size=7.1)
            if index:
                b.connector(x, y + 0.22, x, y + 0.42, stroke=stroke)
        decision_y = ys[len(steps) - 1] - 0.72
        b.diamond("通过门禁?", x, decision_y, 1.12, 0.62, "#FFF8E6", stroke, 6.8)
        b.connector(x, ys[len(steps) - 1] - 0.22, x, decision_y + 0.31, stroke=stroke)
        regen_x = x + 1.52
        b.box("修复或\n重新生成", regen_x, decision_y, 1.10, 0.72, "#FFF8E6", stroke, font_size=6.8)
        b.connector(x + 0.56, decision_y, regen_x - 0.55, decision_y, label="否", stroke=stroke, font_size=6.4)
        b.connector(x, decision_y - 0.31, x, 4.72, stroke=stroke)

    delivery_steps = ["3.1 构建容器镜像", "3.2 生成部署配置\n（K8s/Helm等）", "3.3 部署到测试环境", "3.4 运行验证与\n监控检查", "3.5 生成交付物与\n版本记录"]
    delivery_x = (3.4, 6.0, 8.6, 11.2, 13.8)
    for x, label in zip(delivery_x, delivery_steps):
        b.oval(label, x, 3.75, 2.25, 0.52, "#EDF8EA", "#70AD62", font_size=7.0)
    for left, right in zip(delivery_x, delivery_x[1:]):
        b.connector(left + 1.13, 3.75, right - 1.13, 3.75, stroke="#70AD62")
    b.box("在线交付\n部署到生产环境或指定环境", 5.3, 2.18, 3.25, 1.0, "#EAF3FF", "#5B9BD5", font_size=7.0)
    b.box("离线交付\n生成离线包（镜像、配置、脚本、文档）", 12.0, 2.18, 4.05, 1.0, "#F3EEFC", "#8064A2", font_size=7.0)
    b.connector(13.8, 3.49, 12.0, 2.70, stroke="#8064A2")
    b.connector(3.4, 3.49, 5.3, 2.70, stroke="#5B9BD5")

    # Participants and intelligent agents.
    roles = [
        ("项目负责人", "发起需求、选择工程等级、确认计划、验收交付", 14.25, "#8EC5F5"),
        ("开发人员", "参与需求澄清、查看计划、确认结果、使用生成成果", 11.15, "#A8D08D"),
        ("质量人员", "执行测试、质量检查、风险评估、门禁判定", 8.05, "#B4A7D6"),
        ("外部系统（如 Git、制品仓库、流水线等）", "提供代码托管、构建、制品库、部署环境等能力", 4.70, "#FFD966"),
    ]
    for name, desc, y, color in roles:
        b.oval("", 1.0, y + 0.70, 0.25, 0.25, color, "#506070")
        b.box(f"{name}\n{desc}", 1.0, y - 0.02, 1.52, 1.25, "#FFFFFF", "#7F8C8D", font_size=6.0)
    b.text("参与者", 1.0, 16.0, 1.4, 0.28, "#2F2F2F", 9.5)

    b.box("云端总控智能体\n（调度与辅助决策）\n理解需求\n制定计划\n拆解任务\n调度执行\n评估风险\n给出建议", 16.4, 13.35, 1.55, 3.05, "#F8FBFF", "#5B9BD5", font_color="#174A84", font_size=6.7)
    b.box("本地智能体\n（执行与生成）\n代码生成\n测试生成\n配置生成\n跑验证\n启动验证\n修复迭代", 16.4, 8.80, 1.55, 2.60, "#F4FBF0", "#70AD62", font_color="#38761D", font_size=6.7)

    # Role/agent associations.
    assoc = "#A0A0A0"
    b.connector(1.75, 14.05, 3.08, 14.32, stroke=assoc, arrow=False, dashed=True)
    b.connector(1.75, 11.02, 3.08, 13.02, stroke=assoc, arrow=False, dashed=True)
    b.connector(1.75, 7.90, 3.08, 8.55, stroke=assoc, arrow=False, dashed=True)
    b.connector(1.75, 4.55, 3.08, 3.75, stroke=assoc, arrow=False, dashed=True)
    b.connector(15.62, 13.45, 13.95, 14.25, stroke=assoc, arrow=False, dashed=True)
    b.connector(15.62, 12.90, 13.95, 12.95, stroke=assoc, arrow=False, dashed=True)
    b.connector(15.62, 8.85, 13.95, 8.05, stroke=assoc, arrow=False, dashed=True)

    # Legend and explanatory notes.
    b.text("图例说明", 0.95, 1.18, 1.4, 0.25, "#2F2F2F", 8.5)
    b.oval("用例", 2.10, 0.72, 1.0, 0.30, "#EDF8EA", "#70AD62", font_size=6.7)
    b.diamond("决策点", 3.45, 0.72, 0.70, 0.34, "#FFF4D9", "#E9A323", 6.2)
    b.connector(4.05, 0.72, 5.05, 0.72, stroke="#56616B")
    b.text("主要流程", 5.42, 0.72, 1.0, 0.25, "#2F2F2F", 6.7)
    b.connector(6.20, 0.72, 7.20, 0.72, stroke="#A0A0A0", arrow=False, dashed=True)
    b.text("参与关联", 7.55, 0.72, 1.0, 0.25, "#2F2F2F", 6.7)
    b.box("工程等级影响快速生成阶段\n验证原型 → 轻量可用 → 生产级", 10.25, 0.82, 2.7, 0.78, "#F1F7FE", "#9EB6D8", font_size=6.3)
    b.box("风险等级影响门禁与交付控制\n低风险 → 标准风险 → 高风险", 13.25, 0.82, 2.7, 0.78, "#FFF6ED", "#D9A66A", font_size=6.3)
    b.box("交付结果\n在线交付或离线交付", 16.0, 0.82, 2.0, 0.78, "#F5F0FC", "#B9A7D6", font_size=6.3)
    return b.bytes()


def set_page_cell(page: ET.Element, name: str, value: str) -> None:
    target = page.find(f".//{{*}}PageSheet/{{*}}Cell[@N='{name}']")
    if target is not None:
        target.set("V", value)


def rewrite_pages(data: bytes) -> bytes:
    root = ET.fromstring(data)
    pages = root.findall(f"{{{VSD_NS}}}Page")
    first = copy.deepcopy(pages[0])
    first.set("ID", "0")
    first.set("NameU", "快速生成和云原生交付_图示版")
    first.set("Name", "快速生成和云原生交付_图示版")
    first.set("IsCustomNameU", "1")
    first.set("IsCustomName", "1")
    first.set("ViewCenterX", "8.75")
    first.set("ViewCenterY", "8.5")
    set_page_cell(first, "PageWidth", str(PAGE_WIDTH))
    set_page_cell(first, "PageHeight", str(PAGE_HEIGHT))
    for child in list(root):
        if child.tag == f"{{{VSD_NS}}}Page":
            root.remove(child)
    root.append(first)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def rewrite_pages_rels(data: bytes) -> bytes:
    root = ET.Element(f"{{{REL_NS}}}Relationships")
    ET.SubElement(root, f"{{{REL_NS}}}Relationship", {
        "Id": "rId1", "Type": "http://schemas.microsoft.com/visio/2010/relationships/page", "Target": "page1.xml",
    })
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def rewrite_content_types(data: bytes) -> bytes:
    root = ET.fromstring(data)
    for child in list(root):
        if child.get("PartName") in {"/visio/pages/page2.xml", "/visio/pages/page3.xml"}:
            root.remove(child)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def rewrite_windows(data: bytes) -> bytes:
    root = ET.fromstring(data)
    window = root.find(f"{{{VSD_NS}}}Window")
    if window is not None:
        window.set("Page", "0")
        window.set("ViewCenterX", "8.75")
        window.set("ViewCenterY", "8.5")
        window.set("ViewScale", "-1")
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def rewrite_app(data: bytes) -> bytes:
    root = ET.fromstring(data)
    for node in root.iter():
        if node.tag.endswith("}i4") and (node.text or "").strip() == "3":
            node.text = "1"
    titles = next((node for node in root.iter() if node.tag.endswith("}vector") and node.get("baseType") == "lpstr"), None)
    if titles is not None:
        for child in list(titles):
            titles.remove(child)
        titles.set("size", "1")
        item = ET.SubElement(titles, "{http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes}lpstr")
        item.text = "快速生成和云原生交付_图示版"
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def rewrite_core(data: bytes) -> bytes:
    root = ET.fromstring(data)
    title = root.find(f"{{{DC_NS}}}title")
    if title is not None:
        title.text = "快速生成和云原生交付可编辑图"
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def build(template: Path, output: Path) -> None:
    page = build_page()
    replacements = {
        "visio/pages/page1.xml": page,
        "visio/pages/pages.xml": None,
        "visio/pages/_rels/pages.xml.rels": None,
        "[Content_Types].xml": None,
        "visio/windows.xml": None,
        "docProps/app.xml": None,
        "docProps/core.xml": None,
    }
    with zipfile.ZipFile(template, "r") as source:
        replacements["visio/pages/pages.xml"] = rewrite_pages(source.read("visio/pages/pages.xml"))
        replacements["visio/pages/_rels/pages.xml.rels"] = rewrite_pages_rels(source.read("visio/pages/_rels/pages.xml.rels"))
        replacements["[Content_Types].xml"] = rewrite_content_types(source.read("[Content_Types].xml"))
        replacements["visio/windows.xml"] = rewrite_windows(source.read("visio/windows.xml"))
        replacements["docProps/app.xml"] = rewrite_app(source.read("docProps/app.xml"))
        replacements["docProps/core.xml"] = rewrite_core(source.read("docProps/core.xml"))
        output.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as target:
            for info in source.infolist():
                if info.filename in {"visio/pages/page2.xml", "visio/pages/page3.xml"}:
                    continue
                target.writestr(info, replacements.get(info.filename, source.read(info.filename)))


def main() -> int:
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--template", type=Path, default=here / "uml" / "实现团队规范化智能开发_用例与UML.vsdx")
    parser.add_argument("--output", type=Path, default=here / "uml" / "快速生成和云原生交付_可编辑版.vsdx")
    args = parser.parse_args()
    build(args.template, args.output)
    print(f"已生成 {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
