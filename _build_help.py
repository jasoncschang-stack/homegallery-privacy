# Convert docs/user-manual.md (+ English sibling) into help/index.html for GitHub Pages.
from __future__ import annotations

import html
import re
from pathlib import Path

SITE = Path(__file__).resolve().parent
APP_ROOT = SITE.parent
ZH_SRC = APP_ROOT / "docs" / "user-manual.md"
EN_SRC = SITE / "_user_manual_en.md"
OUT = SITE / "help" / "index.html"

ZH_LINKS = [
    (r"\]\(\./setup-home-storage/windows-11\.md\)", "](setup/windows-11/index.html)"),
    (r"\]\(\./setup-home-storage/synology\.md\)", "](setup/synology/index.html)"),
    (r"\]\(\./setup-home-storage/qnap\.md\)", "](setup/qnap/index.html)"),
    (r"\]\(\./setup-home-storage/troubleshooting\.md\)", "](setup/troubleshooting/index.html)"),
    (r"\]\(\./setup-home-storage/webdav\.md\)", "](setup/webdav/index.html)"),
    (r"\]\(\./setup-home-storage/tailscale\.md\)", "](setup/tailscale/index.html)"),
    (r"\]\(\./setup-home-storage/\)", "](setup/index.html#zh-tw)"),
]
EN_LINKS = [
    (r"\]\(\./setup-home-storage/windows-11\.md\)", "](setup/windows-11/en.html)"),
    (r"\]\(\./setup-home-storage/synology\.md\)", "](setup/synology/en.html)"),
    (r"\]\(\./setup-home-storage/qnap\.md\)", "](setup/qnap/en.html)"),
    (r"\]\(\./setup-home-storage/troubleshooting\.md\)", "](setup/troubleshooting/index.html#en)"),
    (r"\]\(\./setup-home-storage/webdav\.md\)", "](setup/webdav/index.html#en)"),
    (r"\]\(\./setup-home-storage/tailscale\.md\)", "](setup/tailscale/index.html#en)"),
    (r"\]\(\./setup-home-storage/\)", "](setup/index.html#en)"),
]

DROP_PATTERNS = [
    r"詳見 \[平行目錄與SAF策略\.md\]\(\./平行目錄與SAF策略\.md\) §2\.4。\n?",
    r"詳見 \[平行目錄與SAF策略\.md\]\(\./平行目錄與SAF策略\.md\)。\n?",
    r"產品切割詳見 \[版本分割評估\.md\]\(\./版本分割評估\.md\)。\n?",
    r"詳見 \[備份功能評估\.md\]\(\./備份功能評估\.md\)、\[備份還原規劃\.md\]\(\./備份還原規劃\.md\)（含 §2\.D tombstone 邏輯）。\n?",
    r"詳見 \[客戶問題處理策略\.md\]\(\./客戶問題處理策略\.md\)、\[系統異常處理策略\.md\]\(\./系統異常處理策略\.md\)。\n?",
    r"線上手冊部署見 \[privacy-site/README\.md\]\(\.\./privacy-site/README\.md\)（與隱私權同站）。\n?",
    r"開發／維護用的引擎路由與緩衝策略見倉庫文件 \[視頻播放評估\.md\]\(\./視頻播放評估\.md\)。\n?",
    r"開發／維護策略見 \[視頻播放評估\.md\]\(\./視頻播放評估\.md\) §7\.1。\n?",
    r"See the in-repo technical notes \(not published here\)\.\n?",
    r"Internal product-split notes are not published here\.\n?",
]

LABEL_FIXES = [
    (r">webdav\.md<", ">WebDAV guide<"),
    (r">tailscale\.md<", ">Tailscale guide<"),
    (r">setup-home-storage/webdav\.md<", ">WebDAV guide<"),
    (r">setup-home-storage/tailscale\.md<", ">Tailscale guide<"),
]


def inline(text: str) -> str:
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)

    def _autolink(match: re.Match[str]) -> str:
        raw = match.group(1)
        url = raw.rstrip(").,;）")
        trailing = raw[len(url) :]
        return f'<a href="{url}">{url}</a>{trailing}'

    text = re.sub(r"(?<![\"'>])(https://[^\s<]+)", _autolink, text)
    return text


def slug(title: str) -> str:
    title = re.sub(r"^#+\s*", "", title)
    title = re.sub(r"[^\w\u4e00-\u9fff\- ]+", "", title)
    title = re.sub(r"\s+", "-", title.strip())
    return title[:56] or "section"


def list_match(line: str):
    m = re.match(r"^(\s*)(-\s+|\d+\.\s+)(.*)$", line)
    if not m:
        return None
    return len(m.group(1).replace("\t", "    ")), m.group(2).startswith("-"), m.group(3)


def preprocess(md: str, lang: str) -> str:
    for pat, repl in ZH_LINKS if lang == "zh" else EN_LINKS:
        md = re.sub(pat, repl, md)
    for pat in DROP_PATTERNS:
        md = re.sub(pat, "", md)
    md = re.split(r"\n## 14[\.、] ", md, maxsplit=1)[0]
    md = re.split(r"\n## 14\. Revision history\n", md, maxsplit=1)[0]
    md = re.sub(
        r"> \*\*公開站更新時程（2026/07/25）\*\*[^\n]*\n?",
        "",
        md,
    )
    md = re.sub(r"\n© 2026 Jason C\.S\. Chang\s*$", "", md)
    return md


def convert(md: str, id_prefix: str, lang: str) -> str:
    lines = md.splitlines()
    out: list[str] = []
    i = 0
    used: set[str] = set()

    def uid(title: str) -> str:
        base = id_prefix + slug(title)
        sid, n = base, 2
        while sid in used:
            sid = f"{base}-{n}"
            n += 1
        used.add(sid)
        return sid

    def parse_list(at: int):
        first = list_match(lines[at])
        assert first is not None
        base, is_ul, _ = first
        items: list[str] = []
        j = at
        while j < len(lines):
            raw = lines[j]
            if raw.strip() == "":
                break
            info = list_match(raw)
            if info is None:
                if items and (raw.startswith(" " * (base + 2)) or raw.startswith("\t")):
                    items[-1] += " " + raw.strip()
                    j += 1
                    continue
                break
            indent, child_ul, text = info
            if indent < base:
                break
            if indent > base:
                nested, j = parse_list(j)
                items[-1] += nested
                continue
            items.append(inline(text))
            j += 1
            while j < len(lines):
                nxt = lines[j]
                if nxt.strip() == "":
                    break
                ninfo = list_match(nxt)
                if ninfo is None:
                    if nxt.startswith(" " * (base + 2)) or nxt.startswith("\t"):
                        items[-1] += " " + nxt.strip()
                        j += 1
                        continue
                    break
                nindent, _, _ = ninfo
                if nindent > base:
                    nested, j = parse_list(j)
                    items[-1] += nested
                else:
                    break
        tag = "ul" if is_ul else "ol"
        html_block = f"<{tag}>" + "".join(f"<li>{it}</li>" for it in items) + f"</{tag}>"
        return html_block, j

    while i < len(lines):
        line = lines[i]
        if line.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s:|\-]+$", lines[i + 1]):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip("|").split("|")])
                i += 1
            header, body = rows[0], rows[2:]
            out.append(
                "<table><thead><tr>"
                + "".join(f"<th>{inline(c)}</th>" for c in header)
                + "</tr></thead><tbody>"
            )
            for row in body:
                out.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in row) + "</tr>")
            out.append("</tbody></table>")
            continue
        if line.startswith("#### "):
            out.append(f"<h4>{inline(line[5:].strip())}</h4>")
        elif line.startswith("### "):
            title = line[4:].strip()
            out.append(f'<h3 id="{uid(title)}">{inline(title)}</h3>')
        elif line.startswith("## "):
            title = line[3:].strip()
            out.append(f'<h3 id="{uid(title)}">{inline(title)}</h3>')
        elif line.startswith("# "):
            i += 1
            continue
        elif line.startswith("> "):
            notes = []
            while i < len(lines) and lines[i].startswith("> "):
                notes.append(lines[i][2:])
                i += 1
            out.append('<p class="note">' + "<br />".join(inline(n) for n in notes) + "</p>")
            continue
        elif list_match(line) and list_match(line)[0] == 0:
            block, i = parse_list(i)
            out.append(block)
            continue
        elif line.strip() in ("", "---"):
            pass
        else:
            out.append(f"<p>{inline(line)}</p>")
        i += 1

    body = "\n".join(out)
    fixes = LABEL_FIXES
    if lang == "zh":
        fixes = [
            (r">webdav\.md<", ">WebDAV 使用手冊<"),
            (r">tailscale\.md<", ">Tailscale 使用手冊<"),
            (r">setup-home-storage/webdav\.md<", ">WebDAV 使用手冊<"),
            (r">setup-home-storage/tailscale\.md<", ">Tailscale 使用手冊<"),
        ]
    for pat, repl in fixes:
        body = re.sub(pat, repl, body)
    return body


def toc(body: str, extra: str) -> str:
    items = []
    for hid, title in re.findall(r'<h3 id="([^"]+)">([^<]+)</h3>', body):
        if re.match(r"^\d+\.\s", title) and not re.match(r"^\d+\.\d+", title):
            items.append(f'<li><a href="#{hid}">{title}</a></li>')
    return '<nav class="toc" aria-label="Contents"><ul>' + "".join(items) + extra + "</ul></nav>"


TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Home Gallery — User Guide</title>
  <meta name="description" content="Full user guide for Home Gallery (家相簿): local gallery, home albums, timeline, SMB hosts, backup &amp; restore." />
  <style>
    :root {{
      --bg: #f6f8fb;
      --card: #ffffff;
      --text: #1a1f2e;
      --muted: #5b6578;
      --accent: #1b6ef3;
      --line: #e3e8f0;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      background: linear-gradient(180deg, #eaf2ff 0%, var(--bg) 28%, var(--bg) 100%);
      color: var(--text);
      line-height: 1.55;
    }}
    main {{
      max-width: 48rem;
      margin: 0 auto;
      padding: 2rem 1.25rem 4rem;
    }}
    header {{
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 1.5rem 1.35rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 24px rgba(27, 110, 243, 0.06);
    }}
    h1 {{
      margin: 0 0 0.35rem;
      font-size: 1.65rem;
      letter-spacing: -0.02em;
    }}
    .meta {{ color: var(--muted); font-size: 0.95rem; margin: 0.2rem 0; }}
    .langs {{ margin-top: 1rem; display: flex; gap: 0.75rem; flex-wrap: wrap; }}
    .langs a {{
      color: var(--accent);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
    }}
    .langs a:hover {{ text-decoration: underline; }}
    section {{
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 1.35rem 1.35rem 1.5rem;
      margin-bottom: 1.25rem;
    }}
    h2 {{
      margin: 0 0 0.85rem;
      font-size: 1.25rem;
      color: var(--accent);
    }}
    h3 {{ margin: 1.35rem 0 0.45rem; font-size: 1.08rem; scroll-margin-top: 0.75rem; }}
    h4 {{ margin: 1rem 0 0.4rem; font-size: 0.98rem; color: #334155; }}
    p, li {{ color: var(--text); }}
    ul, ol {{ padding-left: 1.25rem; }}
    li ul, li ol {{ margin: 0.35rem 0 0.15rem; }}
    code {{
      font-size: 0.88em;
      background: #f0f5ff;
      padding: 0.05em 0.32em;
      border-radius: 4px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
      margin: 0.75rem 0 0.25rem;
    }}
    th, td {{
      border: 1px solid var(--line);
      padding: 0.55rem 0.6rem;
      vertical-align: top;
      text-align: left;
    }}
    th {{ background: #f0f5ff; }}
    .note {{
      background: #f3f7ff;
      border-left: 3px solid var(--accent);
      padding: 0.75rem 0.9rem;
      margin: 0.85rem 0 0;
      color: var(--muted);
      font-size: 0.92rem;
    }}
    footer {{
      color: var(--muted);
      font-size: 0.88rem;
      text-align: center;
      margin-top: 0.5rem;
    }}
    a {{ color: var(--accent); }}
    nav.toc ul {{ margin: 0.35rem 0 0; }}
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Home Gallery User Guide</h1>
      <p class="meta">家相簿／Home Gallery · Package <code>com.jasoncs.homegallery</code></p>
      <p class="meta"><strong>Updated:</strong> 2026-09-14 · App <strong>1.2.0</strong> · Manual <strong>1.45</strong></p>
      <p class="meta"><strong>Contact:</strong> <a href="mailto:jasoncs311@gmail.com">jasoncs311@gmail.com</a></p>
      <div class="langs">
        <a href="#en">English</a>
        <a href="#zh-tw">繁體中文</a>
        <a href="../">Privacy policy</a>
      </div>
    </header>

    <section id="en">
      <h2>English</h2>
      {en_toc}
      {en_body}
    </section>

    <section id="zh-tw">
      <h2>繁體中文</h2>
      {zh_toc}
      {zh_body}
    </section>

    <p class="note">
      Play Console support / website URL (optional):
      <code>https://jasoncschang-stack.github.io/homegallery-privacy/help/</code>
    </p>

    <footer>
      © 2026 Jason C.S. Chang · Home Gallery（家相簿）
    </footer>
  </main>
</body>
</html>
"""


def main() -> None:
    zh = convert(preprocess(ZH_SRC.read_text(encoding="utf-8"), "zh"), "zh-", "zh")
    en = convert(preprocess(EN_SRC.read_text(encoding="utf-8"), "en"), "en-", "en")
    page = TEMPLATE.format(
        en_toc=toc(
            en,
            '<li><a href="setup/index.html#en">Set up home storage</a> (Windows / NAS)</li>',
        ),
        zh_toc=toc(
            zh,
            '<li><a href="setup/index.html#zh-tw">家中儲存建置</a>（Windows／NAS）</li>',
        ),
        en_body=en,
        zh_body=zh,
    )
    OUT.write_text(page, encoding="utf-8")
    print(f"Wrote {OUT} ({len(page)} chars; zh={len(zh)} en={len(en)})")


if __name__ == "__main__":
    main()
