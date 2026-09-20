# Generate JA/KO (and optional refresh) setup HTML pages from markdown.
# Images point at English screenshot folders (windows-11-en / app-en).
from __future__ import annotations

import html
import re
from pathlib import Path

SITE = Path(__file__).resolve().parent
APP_ROOT = SITE.parent
SETUP_MD = APP_ROOT / "docs" / "setup-home-storage"
SETUP_HTML = SITE / "help" / "setup"

LANG_META = {
    "ja": {
        "html_lang": "ja",
        "label": "日本語",
        "user_guide": "ユーザーガイド",
        "setup_home": "ホームストレージ設定",
        "troubleshooting": "トラブルシューティング",
        "img_note": "日本語専用の画面がない場合は、英語版スクリーンショットを表示しています。",
        "crumb_setup": "ホームストレージ設定",
    },
    "ko": {
        "html_lang": "ko",
        "label": "한국어",
        "user_guide": "사용자 가이드",
        "setup_home": "홈 저장소 설정",
        "troubleshooting": "문제 해결",
        "img_note": "한국어 전용 화면이 없으면 영어 스크린샷을 사용합니다.",
        "crumb_setup": "홈 저장소 설정",
    },
}

GUIDES = [
    # (md_stem without locale, html_dir, title_fallback, has_dedicated_en_html)
    ("windows-11", "windows-11", "Windows 11", True),
    ("synology", "synology", "Synology NAS", True),
    ("qnap", "qnap", "QNAP NAS", True),
]


def inline(text: str) -> str:
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    return text


def remap_links(md: str, lang: str) -> str:
    pairs = [
        (r"\]\(\./troubleshooting\.md\)", f"](../troubleshooting/index.html#{lang})"),
        (r"\]\(\./synology\.md\)", f"](../synology/{lang}.html)"),
        (r"\]\(\./qnap\.md\)", f"](../qnap/{lang}.html)"),
        (r"\]\(\./windows-11\.md\)", f"](../windows-11/{lang}.html)"),
        (r"\]\(\./webdav\.md\)", f"](../webdav/index.html#{lang})"),
        (r"\]\(\./tailscale\.md\)", f"](../tailscale/index.html#{lang})"),
        (r"\]\(\./README\.md\)", "](../index.html#" + lang + ")"),
        (r"\]\(\.\./user-manual\.md\)", "](../../index.html#" + lang + ")"),
        (r"\]\(\./images/windows-11/", "](../images/windows-11-en/"),
        (r"\]\(\./images/app/", "](../images/app-en/"),
        (r"\]\(\./images/windows-11-en/", "](../images/windows-11-en/"),
        (r"\]\(\./images/app-en/", "](../images/app-en/"),
    ]
    for pat, repl in pairs:
        md = re.sub(pat, repl, md)
    return md


def list_match(line: str):
    m = re.match(r"^(\s*)(-\s+|\d+\.\s+)(.*)$", line)
    if not m:
        return None
    return len(m.group(1).replace("\t", "    ")), m.group(2).startswith("-"), m.group(3)


def convert_body(md: str) -> str:
    lines = md.splitlines()
    out: list[str] = []
    i = 0

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
            indent, _, text = info
            if indent < base:
                break
            if indent > base:
                nested, j = parse_list(j)
                items[-1] += nested
                continue
            # checkbox
            text = re.sub(r"^\[\s*\]\s*", "", text)
            text = re.sub(r"^\[x\]\s*", "", text, flags=re.I)
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
        return f"<{tag}>" + "".join(f"<li>{it}</li>" for it in items) + f"</{tag}>", j

    # Drop H1 (used as page title)
    while i < len(lines) and not lines[i].startswith("# "):
        i += 1
    if i < len(lines) and lines[i].startswith("# "):
        i += 1

    section_buf: list[str] = []
    current_h2: str | None = None

    def flush_section():
        nonlocal section_buf, current_h2
        if current_h2 is None and not section_buf:
            return
        if current_h2 is None:
            out.extend(section_buf)
        else:
            out.append("<section>")
            out.append(f"<h2>{inline(current_h2)}</h2>")
            out.extend(section_buf)
            out.append("</section>")
        section_buf = []
        current_h2 = None

    while i < len(lines):
        line = lines[i]
        if line.startswith("## "):
            flush_section()
            current_h2 = line[3:].strip()
            i += 1
            continue
        if line.startswith("### "):
            section_buf.append(f"<h3>{inline(line[4:].strip())}</h3>")
        elif re.match(r"^!\[([^\]]*)\]\(([^)]+)\)", line):
            m = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)", line)
            assert m
            alt, src = m.group(1), m.group(2)
            # phone screenshots vs desktop
            wh = (' width="1080" height="1920"' if "/app" in src else ' width="1280" height="720"')
            section_buf.append(
                "<figure>"
                f'<img src="{html.escape(src)}" alt="{html.escape(alt)}"{wh} loading="lazy" />'
                f"<figcaption>{inline(alt)}</figcaption>"
                "</figure>"
            )
        elif line.startswith("> "):
            notes = []
            while i < len(lines) and lines[i].startswith("> "):
                notes.append(lines[i][2:])
                i += 1
            cls = "warning" if notes and ("Safety" in notes[0] or "注意" in notes[0] or "주의" in notes[0]) else "note"
            section_buf.append(
                f'<p class="{cls}">' + "<br />".join(inline(n) for n in notes) + "</p>"
            )
            continue
        elif list_match(line) and list_match(line)[0] == 0:
            block, i = parse_list(i)
            section_buf.append(block)
            continue
        elif line.strip() in ("", "---"):
            pass
        else:
            section_buf.append(f"<p>{inline(line)}</p>")
        i += 1
    flush_section()
    return "\n".join(out)


def page_title(md: str, fallback: str) -> str:
    for line in md.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def wrap_page(lang: str, title: str, body: str, guide_dir: str) -> str:
    meta = LANG_META[lang]
    other = "ko" if lang == "ja" else "ja"
    return f"""<!DOCTYPE html>
<html lang="{meta['html_lang']}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{html.escape(title)} — Home Gallery</title>
  <meta name="description" content="{html.escape(title)}" />
  <link rel="stylesheet" href="../styles.css" />
</head>
<body>
  <main>
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="../../index.html">{meta['user_guide']}</a>
      <span>/</span>
      <a href="../index.html">{meta['crumb_setup']}</a>
      <span>/</span>
      <span>{html.escape(guide_dir)}</span>
    </nav>

    <header>
      <h1>{inline(title)}</h1>
      <p class="meta">Home Gallery</p>
      <p class="note">{html.escape(meta['img_note'])}</p>
      <div class="langs">
        <a href="index.html">繁體中文</a>
        <a href="en.html">English</a>
        <a href="ja.html">日本語</a>
        <a href="ko.html">한국어</a>
        <a href="../troubleshooting/index.html#{lang}">{meta['troubleshooting']}</a>
      </div>
    </header>

{body}

    <footer>
      <a href="../index.html">{meta['setup_home']}</a> ·
      <a href="mailto:jasoncs311@gmail.com">jasoncs311@gmail.com</a>
    </footer>
  </main>
</body>
</html>
"""


def build_guide(stem: str, html_dir: str, fallback: str, lang: str) -> None:
    src = SETUP_MD / f"{stem}.{lang}.md"
    if not src.exists():
        print(f"skip missing {src}")
        return
    md = remap_links(src.read_text(encoding="utf-8"), lang)
    title = page_title(md, fallback)
    body = convert_body(md)
    out = SETUP_HTML / html_dir / f"{lang}.html"
    out.write_text(wrap_page(lang, title, body, html_dir), encoding="utf-8")
    print(f"Wrote {out}")


def build_hub_sections() -> None:
    """Append/replace JA/KO sections on setup/index.html."""
    index = SETUP_HTML / "index.html"
    text = index.read_text(encoding="utf-8")
    # Ensure lang links in header
    if 'href="#ja"' not in text:
        text = text.replace(
            """        <a href="#zh-tw">繁體中文</a>
        <a href="#en">English</a>
        <a href="../index.html">User guide</a>""",
            """        <a href="#zh-tw">繁體中文</a>
        <a href="#en">English</a>
        <a href="#ja">日本語</a>
        <a href="#ko">한국어</a>
        <a href="../index.html">User guide</a>""",
        )

    ja_section = """
    <section id="ja">
      <h2>日本語 — 経路を選ぶ</h2>
      <p>ホームギャラリーで自宅の写真を使う前に、PC／NAS で共有フォルダーを用意してから、アプリでホストを追加してください。</p>
      <p class="note">日本語専用の画面がない場合は、英語版スクリーンショットを表示しています。</p>
      <div class="path-grid">
        <a class="path-card" href="windows-11/ja.html">
          <strong>Windows 11 PC <span class="badge">おすすめ</span></strong>
          <span>PC で共有フォルダーを開く（英語スクショ）</span>
        </a>
        <a class="path-card" href="synology/ja.html">
          <strong>Synology NAS</strong>
          <span>SMB と権限を有効化</span>
        </a>
        <a class="path-card" href="qnap/ja.html">
          <strong>QNAP NAS</strong>
          <span>Microsoft ネットワークと権限</span>
        </a>
        <a class="path-card" href="troubleshooting/index.html#ja">
          <strong>接続できない？</strong>
          <span>ホスト未検出、認証失敗、読み取り専用</span>
        </a>
        <a class="path-card" href="webdav/index.html#ja">
          <strong>外出／WebDAV（NAS）</strong>
          <span>HTTPS WebDAV：DDNS／公衆 IP + ポート</span>
        </a>
        <a class="path-card" href="tailscale/index.html#ja">
          <strong>外出／Tailscale（Windows）</strong>
          <span>PC＋スマホ＋App に 100.x を貼り付け</span>
        </a>
      </div>
    </section>
"""
    ko_section = """
    <section id="ko">
      <h2>한국어 — 경로 선택</h2>
      <p>홈 갤러리로 집 사진을 쓰기 전에 PC/NAS에서 공유 폴더를 준비한 뒤, 앱에서 호스트를 추가하세요.</p>
      <p class="note">한국어 전용 화면이 없으면 영어 스크린샷을 사용합니다.</p>
      <div class="path-grid">
        <a class="path-card" href="windows-11/ko.html">
          <strong>Windows 11 PC <span class="badge">추천</span></strong>
          <span>PC에서 공유 폴더 설정（영문 스크린샷）</span>
        </a>
        <a class="path-card" href="synology/ko.html">
          <strong>Synology NAS</strong>
          <span>SMB 및 권한 사용</span>
        </a>
        <a class="path-card" href="qnap/ko.html">
          <strong>QNAP NAS</strong>
          <span>Microsoft 네트워크 및 권한</span>
        </a>
        <a class="path-card" href="troubleshooting/index.html#ko">
          <strong>연결이 안 되나요?</strong>
          <span>호스트 미발견, 로그인 실패, 읽기 전용</span>
        </a>
        <a class="path-card" href="webdav/index.html#ko">
          <strong>외출／WebDAV（NAS）</strong>
          <span>HTTPS WebDAV: DDNS／공인 IP + 포트</span>
        </a>
        <a class="path-card" href="tailscale/index.html#ko">
          <strong>외출／Tailscale（Windows）</strong>
          <span>PC+휴대폰+앱에 100.x 붙여넣기</span>
        </a>
      </div>
    </section>
"""

    # Remove existing ja/ko sections if regenerating
    text = re.sub(r"\n    <section id=\"ja\">.*?</section>\n", "\n", text, flags=re.S)
    text = re.sub(r"\n    <section id=\"ko\">.*?</section>\n", "\n", text, flags=re.S)

    # Insert before footer
    footer_mark = "    <footer>"
    if footer_mark not in text:
        raise SystemExit("setup index footer not found")
    text = text.replace(footer_mark, ja_section + ko_section + "\n" + footer_mark)
    index.write_text(text, encoding="utf-8")
    print(f"Updated {index}")


def append_locale_to_bilingual(page: str, md_stem: str) -> None:
    """Add #ja / #ko sections into troubleshooting/webdav/tailscale index.html from MD."""
    path = SETUP_HTML / page / "index.html"
    if not path.exists():
        print(f"skip missing {path}")
        return
    text = path.read_text(encoding="utf-8")
    # lang switcher
    if 'href="#ja"' not in text:
        text = text.replace(
            '<a href="#en">English</a>',
            '<a href="#en">English</a>\n        <a href="#ja">日本語</a>\n        <a href="#ko">한국어</a>',
        )
        text = text.replace(
            '<a href="#zh-tw">繁體中文</a>',
            '<a href="#zh-tw">繁體中文</a>',
        )

    for lang in ("ja", "ko"):
        src = SETUP_MD / f"{md_stem}.{lang}.md"
        if not src.exists():
            print(f"skip missing {src}")
            continue
        md = remap_links(src.read_text(encoding="utf-8"), lang)
        title = page_title(md, md_stem)
        body = convert_body(md)
        # convert_body wraps ## as sections; unwrap into one section id=
        section = f'\n    <section id="{lang}">\n      <h2>{html.escape(LANG_META[lang]["label"])} — {inline(title)}</h2>\n'
        section += f'      <p class="note">{html.escape(LANG_META[lang]["img_note"])}</p>\n'
        # strip outer <section> from body pieces - body already has sections
        section += body + "\n    </section>\n"
        text = re.sub(rf'\n    <section id="{lang}">.*?</section>\n', "\n", text, flags=re.S)
        footer_mark = "    <footer>"
        if footer_mark not in text:
            # some pages may end differently
            text = text.replace("</main>", section + "</main>")
        else:
            text = text.replace(footer_mark, section + "\n" + footer_mark)
    path.write_text(text, encoding="utf-8")
    print(f"Updated {path}")


def main() -> None:
    for stem, html_dir, fallback, _ in GUIDES:
        for lang in ("ja", "ko"):
            build_guide(stem, html_dir, fallback, lang)
    build_hub_sections()
    for page, stem in (
        ("troubleshooting", "troubleshooting"),
        ("webdav", "webdav"),
        ("tailscale", "tailscale"),
    ):
        append_locale_to_bilingual(page, stem)
    # Also update zh/en lang switchers on dedicated guide pages
    for _, html_dir, _, _ in GUIDES:
        for name in ("index.html", "en.html"):
            p = SETUP_HTML / html_dir / name
            if not p.exists():
                continue
            t = p.read_text(encoding="utf-8")
            if 'href="ja.html"' not in t and '<div class="langs">' in t:
                t = t.replace(
                    '<a href="en.html">English</a>',
                    '<a href="en.html">English</a>\n        <a href="ja.html">日本語</a>\n        <a href="ko.html">한국어</a>',
                )
                # zh index may link differently
                if 'href="en.html">English</a>\n        <a href="ja.html">' not in t:
                    t = t.replace(
                        '<a href="index.html">繁體中文</a>\n        <a href="en.html">English</a>',
                        '<a href="index.html">繁體中文</a>\n        <a href="en.html">English</a>\n'
                        '        <a href="ja.html">日本語</a>\n        <a href="ko.html">한국어</a>',
                    )
                p.write_text(t, encoding="utf-8")
                print(f"Lang links → {p}")


if __name__ == "__main__":
    main()
