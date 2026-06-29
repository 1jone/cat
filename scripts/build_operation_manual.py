from pathlib import Path
from datetime import date

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output"
OUT_DIR.mkdir(exist_ok=True)
OUT_FILE = OUT_DIR / "猫咪追追追_抖音小游戏发布运营手册_2026.docx"

NAVY = "17365D"
BLUE = "2E74B5"
LIGHT_BLUE = "E8EEF5"
PALE_BLUE = "F4F7FB"
GOLD = "B7791F"
GREEN = "287A4B"
RED = "9B1C1C"
GRAY = "626B77"
LIGHT_GRAY = "F2F4F7"
WHITE = "FFFFFF"
BLACK = "111111"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=90, start=120, bottom=90, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_table_widths(table, widths):
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for row in table.rows:
        for idx, width in enumerate(widths):
            row.cells[idx].width = Inches(width)
            tc_pr = row.cells[idx]._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(int(width * 1440)))
            tc_w.set(qn("w:type"), "dxa")
            set_cell_margins(row.cells[idx])
            row.cells[idx].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    tbl_pr = table._tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), "9360")
    tbl_w.set(qn("w:type"), "dxa")
    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), "120")
    tbl_ind.set(qn("w:type"), "dxa")


def set_run_font(run, name="Microsoft YaHei", size=10.5, color=BLACK, bold=None, italic=None):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic


def style_paragraph_runs(paragraph, size=10.5, color=BLACK, bold=False):
    for run in paragraph.runs:
        set_run_font(run, size=size, color=color, bold=bold)


def add_para(doc, text="", size=10.5, color=BLACK, bold=False, italic=False,
             align=WD_ALIGN_PARAGRAPH.LEFT, before=0, after=6, line=1.25,
             keep=False):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = line
    p.paragraph_format.keep_with_next = keep
    r = p.add_run(text)
    set_run_font(r, size=size, color=color, bold=bold, italic=italic)
    return p


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}")
    p.add_run(text)
    return p


def add_bullet(doc, text, level=0):
    style = "List Bullet" if level == 0 else "List Bullet 2"
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.25
    r = p.add_run(text)
    set_run_font(r, size=10.5)
    return p


def add_number(doc, text):
    p = doc.add_paragraph(style="List Number")
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.25
    r = p.add_run(text)
    set_run_font(r, size=10.5)
    return p


def add_callout(doc, label, text, fill=PALE_BLUE, accent=BLUE):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.2
    p_pr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    p_pr.append(shd)
    borders = OxmlElement("w:pBdr")
    left = OxmlElement("w:left")
    left.set(qn("w:val"), "single")
    left.set(qn("w:sz"), "18")
    left.set(qn("w:space"), "8")
    left.set(qn("w:color"), accent)
    borders.append(left)
    p_pr.append(borders)
    ind = OxmlElement("w:ind")
    ind.set(qn("w:left"), "160")
    ind.set(qn("w:right"), "120")
    p_pr.append(ind)
    r1 = p.add_run(label + " ")
    set_run_font(r1, size=10.5, color=accent, bold=True)
    r2 = p.add_run(text)
    set_run_font(r2, size=10.5, color=BLACK)
    return p


def add_table(doc, headers, rows, widths, font_size=9.2):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    set_table_widths(table, widths)
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    for idx, header in enumerate(headers):
        set_cell_shading(hdr.cells[idx], LIGHT_BLUE)
        p = hdr.cells[idx].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(header)
        set_run_font(r, size=font_size, color=NAVY, bold=True)
    for row_data in rows:
        cells = table.add_row().cells
        for idx, value in enumerate(row_data):
            p = cells[idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.12
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(str(value))
            set_run_font(r, size=font_size)
    add_para(doc, "", after=3)
    return table


def add_hyperlink(paragraph, text, url):
    part = paragraph.part
    rel_id = part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    )
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), rel_id)
    new_run = OxmlElement("w:r")
    r_pr = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), BLUE)
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    r_fonts = OxmlElement("w:rFonts")
    r_fonts.set(qn("w:ascii"), "Microsoft YaHei")
    r_fonts.set(qn("w:hAnsi"), "Microsoft YaHei")
    r_fonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    size = OxmlElement("w:sz")
    size.set(qn("w:val"), "19")
    r_pr.extend([r_fonts, color, underline, size])
    new_run.append(r_pr)
    text_node = OxmlElement("w:t")
    text_node.text = text
    new_run.append(text_node)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("第 ")
    set_run_font(run, size=9, color=GRAY)
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = " PAGE "
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.extend([fld_char1, instr_text, fld_char2])
    end_run = paragraph.add_run(" 页")
    set_run_font(end_run, size=9, color=GRAY)


def configure_styles(doc):
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(0.492)
    section.footer_distance = Inches(0.492)

    normal = doc.styles["Normal"]
    normal.font.name = "Microsoft YaHei"
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    normal.font.size = Pt(10.5)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.25

    heading_specs = {
        "Heading 1": (16, BLUE, 18, 10),
        "Heading 2": (13, BLUE, 14, 7),
        "Heading 3": (11.5, NAVY, 10, 5),
    }
    for style_name, (size, color, before, after) in heading_specs.items():
        style = doc.styles[style_name]
        style.font.name = "Microsoft YaHei"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True

    for style_name in ("List Bullet", "List Bullet 2", "List Number"):
        style = doc.styles[style_name]
        style.font.name = "Microsoft YaHei"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
        style.font.size = Pt(10.5)
        style.paragraph_format.space_after = Pt(4)
        style.paragraph_format.line_spacing = 1.25

    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    hr = hp.add_run("猫咪追追追 | 抖音小游戏发布运营手册")
    set_run_font(hr, size=9, color=GRAY, bold=True)
    footer = section.footer
    add_page_number(footer.paragraphs[0])


def build_document():
    doc = Document()
    configure_styles(doc)

    # Editorial cover
    add_para(doc, "抖音小游戏 · 发布与增长实战手册", size=11, color=GOLD, bold=True,
             align=WD_ALIGN_PARAGRAPH.CENTER, before=90, after=18)
    add_para(doc, "猫咪追追追", size=30, color=NAVY, bold=True,
             align=WD_ALIGN_PARAGRAPH.CENTER, after=8)
    add_para(doc, "从审核完成到稳定运营的 90 天行动方案", size=15, color=BLUE,
             align=WD_ALIGN_PARAGRAPH.CENTER, after=24)
    add_para(doc, "适用阶段：正式发布、冷启动、内容增长、留存优化与广告变现",
             size=10.5, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER, after=70)
    add_callout(
        doc,
        "核心判断",
        "这款产品最适合走“萌宠内容获客 + 极短局内体验 + 排行榜挑战 + 侧边栏/签到复访 + 激励广告变现”的轻运营路线。首月不要急着大额买量，先把自然流量转化、次日留存和单用户广告体验跑通。",
        fill=LIGHT_BLUE,
        accent=NAVY,
    )
    add_para(doc, f"版本日期：{date.today().isoformat()}（依据公开资料检索整理）",
             size=9.5, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER, before=35)
    doc.add_page_break()

    add_heading(doc, "使用说明", 1)
    add_para(doc, "本手册按“发布准备—冷启动—日常运营—增长实验—复盘迭代”排列，可直接作为运营负责人、内容负责人和开发负责人的共同执行文档。平台规则与能力可能更新，涉及投放、广告、支付、内容审核和未成年人保护时，应以抖音开放平台后台当日展示为准。")
    add_callout(doc, "目标口径", "文中的指标目标采用“先建基线、再逐周提升”的方式，不虚构行业平均值。上线前 7 天先形成产品自己的真实基线，第 8 天起再设提升目标。", fill="FFF8E8", accent=GOLD)

    add_heading(doc, "一、运营总策略", 1)
    add_heading(doc, "1.1 产品定位", 2)
    add_table(doc, ["维度", "建议定位"], [
        ("一句话", "一款让玩家追着灵活目标快速点击、挑战反应力和好友高分的萌宠休闲小游戏。"),
        ("核心人群", "喜欢猫咪、萌宠、解压、反应力挑战、碎片化娱乐的抖音用户。"),
        ("首要场景", "刷到挑战视频后即点即玩；通勤、排队、睡前进行 1-3 分钟轻度挑战。"),
        ("核心情绪", "可爱、手忙脚乱、差一点破纪录、想赢过朋友。"),
        ("增长飞轮", "短视频展示高光/翻车 → 点击锚点开玩 → 产生高分与分享欲 → 排行榜/群聊比较 → 侧边栏和签到复访。"),
        ("主要变现", "以自愿激励视频为主，Banner 与插屏为辅；先保护体验，再提高广告深度。"),
    ], [1.25, 5.25])

    add_heading(doc, "1.2 现有能力如何用于运营", 2)
    add_table(doc, ["产品能力", "运营用途", "首月动作"], [
        ("12 类目标/运动模式", "持续制造新鲜感和内容素材差异", "每周选 2 个目标做主题挑战，不一次性把全部内容讲完"),
        ("受惊逃跑机制", "形成高传播性的意外瞬间", "制作“别碰它旁边”“猫咪突然加速”系列短视频"),
        ("无尽模式", "承接高手、提升时长和广告价值", "第 2 周发起无尽模式分数赛"),
        ("好友排行榜", "刺激比较、复玩和邀请", "结算页突出“超过好友/还差 X 分”"),
        ("签到与金币", "建立每日回访理由", "连续 7 天奖励写清楚，避免价值感模糊"),
        ("侧边栏奖励", "平台复访主入口", "首局后或产生高分后引导添加，奖励随机关卡体验"),
        ("群聊", "沉淀高活跃玩家和反馈", "以榜单、攻略、活动公告为主，避免只发广告"),
        ("激励/Banner/插屏", "IAA 收益", "激励广告绑定明确价值；插屏从低频开始做分组测试"),
    ], [1.25, 2.25, 3.0])

    add_heading(doc, "二、正式发布前 24 小时", 1)
    add_heading(doc, "2.1 发布与后台配置清单", 2)
    checklist_rows = [
        ("发布版本", "审核通过版本已点击“发布”，线上版本号、代码包、基础信息一致", "运营/开发"),
        ("搜索配置", "游戏名、猫咪游戏、萌宠游戏、反应力、点击挑战、解压小游戏等高相关词已提交", "运营"),
        ("分享配置", "分享标题、文案、图片已设置，图片直接展示玩法与高分冲突", "运营/设计"),
        ("侧边栏", "真实抖音环境验证添加、侧边栏进入识别、奖励发放与冷却", "开发/测试"),
        ("广告", "正式广告位 ID 生效；激励完成/中断、插屏频控、Banner 遮挡均验证", "开发/测试"),
        ("排行榜", "TimeMode、Endless 排行榜提交与打开均成功", "开发/测试"),
        ("客服与反馈", "玩家能找到客服/群聊；准备常见问题与故障收集模板", "运营"),
        ("数据", "平台看板可用；关键自定义事件已确认命名和口径", "运营/开发"),
        ("合规", "隐私政策、适龄提示、防沉迷、内容与广告展示符合当前规则", "负责人"),
        ("应急", "准备可快速回滚的上一个稳定版本与公告模板", "开发/运营"),
    ]
    add_table(doc, ["项目", "验收标准", "负责人"], checklist_rows, [1.1, 4.55, 0.85], font_size=8.8)

    add_heading(doc, "2.2 上线日排班", 2)
    add_table(doc, ["时间", "动作", "观察项"], [
        ("发布前", "冻结非必要功能改动；保存审核版本、素材和配置截图", "版本一致性、广告位、搜索/分享配置"),
        ("发布后 0-2 小时", "全链路真机体验 3 次，覆盖新用户、老用户、侧边栏进入", "启动、首帧、按钮、广告、排行、存储"),
        ("2-6 小时", "发布首批 3 条短视频，分玩法、高分、萌点三个角度", "播放、3 秒留存、锚点点击、游戏新增"),
        ("6-12 小时", "查看实时数据和用户反馈，不因短期波动频繁改动", "错误率、取消率、平均帧率、启动人数"),
        ("次日 10:00", "完成首日复盘，确定仅 1-2 个高优先级修正", "新增、活跃、时长、广告、差评原因"),
    ], [1.1, 3.7, 1.7])

    add_heading(doc, "三、首发 30 天行动日历", 1)
    add_table(doc, ["阶段", "目标", "关键动作", "退出条件"], [
        ("第 1-3 天\n稳定期", "确保可玩、可留、可变现", "每天 3-5 条素材小测；盯启动失败、首局退出、广告异常；回复全部有效反馈", "无高频阻断问题；核心流程稳定"),
        ("第 4-7 天\n基线期", "形成首周真实数据基线", "固定素材标签；统计渠道质量；记录不同目标、模式、广告点位表现", "获得按渠道拆分的新增、留存、时长、收益基线"),
        ("第 8-14 天\n优化期", "提升首局完成率与次留", "优化新手第一局；强化侧边栏奖励；上线无尽模式挑战；测试 2 套分享文案", "至少一个留存动作产生可重复提升"),
        ("第 15-21 天\n放大期", "放大高质量自然流量", "复制胜出素材结构；联系中小萌宠/休闲游戏达人；群内周榜活动", "素材点击与后效稳定，不只看播放量"),
        ("第 22-30 天\n商业期", "在不伤留存前提下提升 ARPDAU", "调整激励价值；低频测试插屏；比较广告前后流失；准备次月版本", "收益提升且次留、时长未明显恶化"),
    ], [1.05, 1.25, 3.15, 1.05], font_size=8.7)

    add_heading(doc, "四、内容运营：短视频就是第一发行渠道", 1)
    add_heading(doc, "4.1 账号内容支柱", 2)
    add_table(doc, ["内容支柱", "占比", "模板"], [
        ("挑战型", "35%", "“你能在 10 秒内点到几次？”“超过 500 分算我输”"),
        ("翻车型", "25%", "目标突然受惊加速、最后一秒错失高分、手指跟不上"),
        ("萌宠型", "20%", "不同猫咪/玩具目标的可爱动作、配音、性格设定"),
        ("技巧型", "10%", "如何预判 wave/figure8/circular 轨迹，如何冲无尽模式"),
        ("社交型", "10%", "好友排行榜、群内周榜、玩家投稿与评论区点题"),
    ], [1.15, 0.7, 4.65])

    add_heading(doc, "4.2 可直接拍摄的 12 个选题", 2)
    topics = [
        "这只猫看起来很好点，直到我碰了它旁边一下。",
        "别眨眼：圆周运动目标 15 秒挑战。",
        "我以为 500 分很简单，最后 1 秒手抖了。",
        "十二种运动模式里，哪一种最让人抓狂？",
        "猫咪玩家的反应力测试：第一遍通常过不了。",
        "评论区说太简单，于是我打开了无尽模式。",
        "朋友只比我高 3 分，这能忍？",
        "新手先学会这一招：不要追着目标尾巴点。",
        "只用一根手指能冲到多少分？",
        "今天的群榜第一名，手速到底有多离谱。",
        "把目标吓跑之后，它为什么不回原位？展示自然连贯的受惊恢复。",
        "你选毛线球、逗猫棒还是小鱼？评论区决定明天挑战。",
    ]
    for topic in topics:
        add_bullet(doc, topic)

    add_heading(doc, "4.3 单条视频结构", 2)
    add_table(doc, ["时段", "画面/文案", "目的"], [
        ("0-2 秒", "直接展示最难或最可爱的瞬间；大字提出挑战", "阻止划走"),
        ("2-6 秒", "展示规则，保持画面持续变化", "让用户看懂玩法"),
        ("6-12 秒", "出现失误、追分或速度变化", "制造情绪和悬念"),
        ("结尾 2 秒", "展示分数与“点左下角挑战/你能超过吗”", "引导点击锚点"),
    ], [0.9, 4.35, 1.25])
    add_callout(doc, "素材纪律", "不要只追播放量。每条素材必须绑定游戏新增、首局完成、次日留存等后效数据。高播放低点击的素材是内容成功、发行失败。", fill="FFF2F2", accent=RED)

    add_heading(doc, "五、用户留存与社交运营", 1)
    add_heading(doc, "5.1 新用户前 3 分钟", 2)
    add_number(doc, "首屏 3 秒内让玩家知道“点目标得分”，减少菜单信息干扰。")
    add_number(doc, "第一局优先使用轨迹更容易理解的目标，让玩家先获得成功感。")
    add_number(doc, "第一次结算突出新纪录、好友差距和再次挑战，不同时堆叠多个弹窗。")
    add_number(doc, "玩家产生一次正反馈后，再展示侧边栏奖励或签到价值。")
    add_number(doc, "激励广告必须由用户主动选择，并清晰说明奖励内容与有效期。")

    add_heading(doc, "5.2 留存活动设计", 2)
    add_table(doc, ["活动", "频率", "规则建议", "主要指标"], [
        ("每日目标挑战", "每日", "指定一种运动模式，达到分数领金币/展示成就", "当日复玩率"),
        ("好友超越赛", "每周", "超过一名好友或刷新个人纪录，群内晒榜", "排行打开率、复玩次数"),
        ("无尽模式周榜", "每周", "周日结榜，展示前三名和玩家技巧", "无尽模式参与率、时长"),
        ("七日签到", "常驻", "明确每日奖励和第七天价值，允许合理补签", "签到率、7 日留存"),
        ("侧边栏惊喜", "常驻", "从侧边栏回访获得随机关卡体验，控制奖励冷却", "侧边栏添加率、回访率"),
        ("评论区共创", "每周", "由评论投票决定下周目标、主题色或挑战规则", "评论率、账号关注"),
    ], [1.25, 0.7, 3.35, 1.2], font_size=8.8)

    add_heading(doc, "六、广告变现策略", 1)
    add_heading(doc, "6.1 原则", 2)
    add_bullet(doc, "优先激励广告：体力恢复、临时解锁、补签、无限体力进度等价值清晰的场景。")
    add_bullet(doc, "Banner 只放在非高强度操作界面，确保不遮挡按钮、不造成误触。")
    add_bullet(doc, "插屏只放在自然停顿点，并设置冷启动保护、会话上限和时间间隔。")
    add_bullet(doc, "广告策略调整必须同时观察收入、次留、会话时长和退出率，不能只看展示次数。")
    add_callout(doc, "当前代码风险", "项目配置中仍可见“测试模式：无冷却/会话近似无限”等注释与高频触发逻辑。正式运营前应再次确认线上配置不是测试频控，尤其是选择页定时插屏和返回首页插屏。", fill="FFF8E8", accent=GOLD)

    add_heading(doc, "6.2 首月建议频控", 2)
    add_table(doc, ["广告类型", "首周建议", "第 2-4 周实验", "停止/回退信号"], [
        ("激励视频", "保持现有价值点，但每个入口文案明确奖励", "测试奖励价值与按钮位置，不测试强迫观看", "完成率下降、投诉增加、奖励感知弱"),
        ("插屏", "极低频或先关闭主动定时触发", "仅在结算后/返回首页测试；按用户分组", "退出率上升、次留下降、误触反馈"),
        ("Banner", "只在选择/结算等静态页面展示", "测试尺寸与展示时段", "遮挡、误触、页面停留明显下降"),
    ], [1.0, 1.9, 2.3, 1.3], font_size=8.8)

    add_heading(doc, "七、数据看板与增长实验", 1)
    add_heading(doc, "7.1 每日必看指标", 2)
    add_table(doc, ["漏斗阶段", "核心指标", "诊断问题"], [
        ("获客", "新增用户、来源渠道、素材锚点点击、搜索进入", "什么内容带来真正玩家，而非空播放？"),
        ("启动", "下载耗时、加载耗时、取消率、JS 错误率", "用户是否在看到游戏前就流失？"),
        ("体验", "首局开始率、首局完成率、单次停留、平均帧率", "规则是否看懂，操作是否流畅？"),
        ("留存", "次日/3 日/7 日留存、侧边栏回访、签到率", "玩家明天为什么回来？"),
        ("社交", "排行榜打开、分享调起、录屏成功发布、群聊进入", "是否有值得比较和传播的结果？"),
        ("变现", "广告请求/展示/完成、每活跃用户广告次数、ARPDAU", "收益提升是否以体验恶化为代价？"),
    ], [1.0, 2.6, 2.9], font_size=8.9)

    add_heading(doc, "7.2 基线与目标设置法", 2)
    add_table(doc, ["周期", "做法", "示例"], [
        ("第 1-7 天", "只建立基线，按来源、素材、设备和新老用户拆分", "记录次留中位数、首局完成率、每活跃广告次数"),
        ("第 8-14 天", "每次只改一个主要变量，目标为相对基线提升", "侧边栏引导改版后，比较添加率与次留"),
        ("第 15-30 天", "放大胜出方案，并验证收益与留存是否同时成立", "素材 A 带来更多新增，但素材 B 的 3 日留存更高，则优先 B"),
        ("月度", "保留实验日志，沉淀“假设—改动—结果—结论”", "形成下一版本需求池，不凭印象排期"),
    ], [1.0, 3.3, 2.2], font_size=8.9)

    add_heading(doc, "7.3 优先实验池", 2)
    experiments = [
        ("新手首局目标", "容易轨迹 vs 随机轨迹", "首局完成率、次留"),
        ("结算页主按钮", "再来一次 vs 超越好友", "复玩率、排行打开率"),
        ("侧边栏引导时机", "首局后 vs 新纪录后", "添加率、当日退出率、次留"),
        ("分享文案", "挑战型 vs 萌宠型", "分享发布率、回流新增"),
        ("激励奖励", "恢复体力 vs 临时关卡体验", "广告完成率、后续游戏局数"),
        ("内容素材", "受惊翻车 vs 高分技巧", "锚点点击、新增后次留"),
    ]
    add_table(doc, ["实验", "变量", "判定指标"], experiments, [1.35, 2.55, 2.6])

    add_heading(doc, "八、预算与渠道组合", 1)
    add_table(doc, ["档位", "月预算建议", "钱怎么花", "适用条件"], [
        ("轻运营", "0-5,000 元", "自制素材、剪辑工具、少量奖品/设计；不做规模买量", "数据未跑稳，团队 1-2 人"),
        ("验证增长", "5,000-30,000 元", "中小达人合作、素材外包、小额直投测试", "次留和变现已有稳定基线"),
        ("放大投放", "30,000 元以上", "达人矩阵、信息流直投、持续素材生产与投放优化", "已验证 LTV、回收周期和素材后效"),
    ], [1.0, 1.15, 2.9, 1.45], font_size=8.8)
    add_callout(doc, "投放门槛", "在不知道单个新增用户带来的 7 日/30 日收入和留存前，不建议扩大买量。先用小预算验证“素材点击—进入游戏—次留—广告收益”的完整链路。", fill="FFF2F2", accent=RED)

    add_heading(doc, "九、团队 SOP", 1)
    add_heading(doc, "9.1 每日", 2)
    for item in [
        "10:00 查看昨日用户、留存、性能和广告数据，记录异常。",
        "11:00 回复评论、群聊与客服反馈，提炼前三类问题。",
        "14:00 发布/排期当日素材，确认锚点、标题和封面。",
        "17:00 查看实时表现，停掉明显低质素材，不因单条爆量立刻改产品。",
        "20:00 记录当天事件：版本、活动、素材、投放、平台波动。",
    ]:
        add_bullet(doc, item)

    add_heading(doc, "9.2 每周", 2)
    add_table(doc, ["星期", "固定动作"], [
        ("周一", "上周复盘：渠道质量、留存、收益、性能、用户反馈"),
        ("周二", "确定本周 1 个产品实验和 2 个内容主题"),
        ("周三", "上线小改动/活动，观察早期数据"),
        ("周四", "达人沟通、玩家投稿、群内互动"),
        ("周五", "发布周末挑战和榜单预热"),
        ("周日", "结榜、展示优秀玩家、收集下周共创选题"),
    ], [1.0, 5.5])

    add_heading(doc, "十、风险与应急", 1)
    add_table(doc, ["风险", "预警信号", "处理动作"], [
        ("版本故障", "启动失败、JS 错误率突增、核心按钮失效", "停止投放和发布引流内容；公告；回滚或紧急修复"),
        ("广告伤体验", "退出率、差评、次留同时恶化", "立即降频；关闭问题点位；核对是否误用测试配置"),
        ("内容违规", "锚点视频限流/下架、账号警告", "停止同类素材；核对锚点、夸张承诺、诱导与版权"),
        ("数据异常", "新增或收入突变但平台/版本无对应变化", "核对统计口径、平台延迟、渠道作弊与广告回传"),
        ("群聊舆情", "集中投诉、谣言、攻击性内容", "统一事实口径；及时回应；保留记录；必要时升级平台客服"),
        ("隐私/未成年人", "权限、实名、防沉迷或个人信息投诉", "立即停止相关处理；按平台与法律要求排查整改"),
    ], [1.15, 2.25, 3.1], font_size=8.8)

    add_heading(doc, "十一、90 天路线图", 1)
    add_table(doc, ["周期", "业务重点", "交付物"], [
        ("0-30 天", "稳定产品、建立数据基线、跑通自然内容和基础变现", "首月复盘；胜出素材模板；核心漏斗看板；问题清单"),
        ("31-60 天", "强化排行榜、侧边栏、签到与群聊活动；验证达人/小额投放", "留存实验报告；达人合作模板；第二月活动日历"),
        ("61-90 天", "形成可复制的内容与投放模型，规划版本主题化", "渠道 ROI 模型；季度版本计划；用户分层运营方案"),
    ], [1.0, 3.35, 2.15])

    add_heading(doc, "十二、首月验收标准", 1)
    add_bullet(doc, "产品：核心流程无高频阻断问题，性能和广告异常有日常监控。")
    add_bullet(doc, "内容：至少形成 2 种可重复的高质量素材结构，而不是依赖单条偶然爆款。")
    add_bullet(doc, "留存：明确侧边栏、签到、排行榜中至少一个已验证有效的复访杠杆。")
    add_bullet(doc, "变现：明确各广告点位的收益与流失代价，线上频控不使用测试配置。")
    add_bullet(doc, "组织：每天有数据记录，每周有实验复盘，每月有版本需求优先级。")

    add_heading(doc, "附录 A：可直接使用的文案", 1)
    add_heading(doc, "搜索关键词候选", 2)
    add_para(doc, "猫咪追追追、猫咪小游戏、萌宠小游戏、点击游戏、反应力测试、手速挑战、解压小游戏、休闲小游戏、无尽挑战、好友排行榜。")
    add_heading(doc, "分享标题候选", 2)
    for item in [
        "我差 3 分就破纪录了，你能超过我吗？",
        "这只猫突然加速，我的手完全跟不上。",
        "反应力挑战：10 秒内你能点中几次？",
        "我在猫咪追追追拿到新纪录，来排行榜见。",
    ]:
        add_bullet(doc, item)
    add_heading(doc, "客服反馈模板", 2)
    add_para(doc, "感谢反馈。请提供：手机型号、抖音版本、发生时间、所在页面、操作步骤、是否播放广告，以及截图/录屏。我们会优先排查影响正常游戏的问题。")

    add_heading(doc, "附录 B：资料来源与更新检查", 1)
    add_para(doc, "以下资料用于核对平台能力、发布流程、运营入口和数据口径。文档生成于 2026-06-12；实际执行前应重新查看后台最新规则。", size=9.5, color=GRAY)
    sources = [
        ("抖音开放平台首页与小游戏服务场景", "https://developer.open-douyin.com/"),
        ("了解抖音小游戏", "https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/minigame/introduction"),
        ("发布小游戏", "https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/minigame/release"),
        ("运营指引", "https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/minigame/operationalguidelines"),
        ("必接能力", "https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/minigame/essential-skills"),
        ("游戏管理工作台功能介绍", "https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/operation1/user-ops/game-management/workbench-function-introduction"),
        ("数据基础介绍", "https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/operation1/about-data/data-intro/intro"),
        ("运营规范入口", "https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/operation1/norms/introduction"),
    ]
    for title, url in sources:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(4)
        add_hyperlink(p, title, url)

    add_callout(doc, "每月规则检查", "固定在每月第一个工作日检查：平台更新日志、运营规范、广告规则、搜索/分享资源规范、锚点视频规则、未成年人保护与隐私要求。", fill=LIGHT_BLUE, accent=NAVY)

    doc.core_properties.title = "猫咪追追追：抖音小游戏发布运营手册"
    doc.core_properties.subject = "发布、冷启动、内容增长、留存、广告变现与数据运营"
    doc.core_properties.author = "运营方案"
    doc.core_properties.keywords = "抖音小游戏, 猫咪追追追, 运营, 发布, 增长, 广告变现"
    doc.save(OUT_FILE)
    return OUT_FILE


if __name__ == "__main__":
    print(build_document())
