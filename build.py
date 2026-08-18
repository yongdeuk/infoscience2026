# -*- coding: utf-8 -*-
"""src/infoscience.html(단일 파일 원본)을 홈 + 4개 단원 페이지로 분리해 빌드한다.

사용법: 저장소 루트에서  python build.py
원본을 고친 뒤 이 스크립트를 돌리면 index.html, unit1~4.html, assets/ 가 다시 만들어진다.
"""
import io, os, re, shutil

SRC = "src/infoscience.html"
OUT = "."
LIVE = "https://infoscience2026.vercel.app"

src = io.open(SRC, encoding="utf-8").read()

# ---------- 조각 추출 ----------
def grab(pattern, flags=re.S):
    m = re.search(pattern, src, flags)
    assert m, "not found: " + pattern[:60]
    return m.group(1)

style   = grab(r'<style>(.*?)</style>')
script  = grab(r'<script>(.*?)</script>')
masthead= grab(r'(<header class="masthead">.*?</header>)')
unitmap = grab(r'(<nav class="unitmap".*?</nav>)')
plan    = grab(r'(<section class="plan" id="plan">.*?</section>)')
footer  = grab(r'(<footer>.*?</footer>)')

units = {}
for n in (1, 2, 3, 4):
    units[n] = grab(r'(<section class="unit u%d" id="unit%d">.*?</section>\s*)(?=<!-- =+ UNIT|\n</main>)' % (n, n))

UNIT_META = {
    1: ("Ⅰ", "프로그래밍", "1~5주차", "함수 · 모듈 · 재귀 구조 — 코드를 작은 단위로 나누는 법"),
    2: ("Ⅱ", "데이터 구조", "6~9주차", "스택 · 큐 · 트리 · 그래프 — 데이터를 담는 그릇의 모양"),
    3: ("Ⅲ", "알고리즘", "10~13주차", "복잡도 · 탐색 기반 · 관계 기반 — 더 빠른 해결 전략"),
    4: ("Ⅳ", "정보과학 프로젝트", "14~16주차", "문제 발견부터 검증까지, 실제로 만들어 보는 4단계"),
}

# ---------- 추가 CSS ----------
EXTRA_CSS = """
  /* ---------- 상단 바 ---------- */
  .topbar{
    position:sticky; top:0; z-index:50; background:var(--surface);
    border-bottom:1px solid var(--line); transition:box-shadow .22s ease;
  }
  body.is-scrolled .topbar{box-shadow:0 8px 18px -12px rgba(20,25,34,.28)}
  .topbar-in{
    max-width:1120px; margin:0 auto; padding:0 1.25rem;
    display:flex; align-items:center; gap:1.25rem; min-height:var(--topbar-h);
  }
  .brand{
    font-family:var(--display); font-size:1.06rem; font-weight:400; color:var(--ink);
    white-space:nowrap; letter-spacing:.14em; padding-right:.14em;
  }
  .brand:hover{text-decoration:none; color:var(--accent-ink)}
  .unitnav{display:flex; gap:.15rem; overflow-x:auto; scrollbar-width:none; flex:1}
  .unitnav::-webkit-scrollbar{display:none}
  .unitnav a{
    padding:.3rem .6rem; font-size:.84rem; color:var(--ink2); white-space:nowrap;
    border-radius:2px; border-bottom:2px solid transparent;
  }
  .unitnav a:hover{text-decoration:none; color:var(--ink)}
  .unitnav a.is-current{color:var(--accent-ink); border-bottom-color:var(--accent); font-weight:700}
  .progress{height:2px; background:var(--accent); width:0; transition:width .12s linear}
  @media (prefers-reduced-motion: reduce){ .progress{transition:none} }
  .crumbbar{
    display:none; border-bottom:1px solid var(--line); background:var(--surface-2);
    font-size:.8rem; color:var(--ink3); padding:.4rem 1.25rem;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .crumbbar b{color:var(--accent-ink); font-weight:700}
  @media (max-width:1079px){
    .crumbbar{display:block; position:sticky; top:var(--topbar-h); z-index:49}
  }

  /* ---------- 목차(스크롤 스파이) ---------- */
  .toc{display:none}
  @media (min-width:1080px){
    .toc{
      display:block; position:sticky; top:calc(var(--topbar-h) + 1.5rem);
      max-height:calc(100vh - var(--topbar-h) - 3rem); overflow-y:auto;
      font-size:.85rem; line-height:1.5; padding-right:.4rem;
    }
    .toc-home{
      display:block; font-size:.78rem; color:var(--ink3); margin-bottom:.7rem;
    }
    .toc-home:hover{color:var(--accent-ink); text-decoration:none}
    .toc-title{
      font-weight:700; font-size:.95rem; color:var(--ink);
      padding-bottom:.45rem; margin-bottom:.55rem; border-bottom:2px solid var(--accent);
      display:flex; justify-content:space-between; align-items:baseline; gap:.5rem;
    }
    .toc-title span{
      font-family:var(--mono); font-size:.68rem; font-weight:400; color:var(--accent-ink);
    }
    .toc ol{list-style:none; margin:0; padding:0}
    .toc li{margin:0}
    .toc a{
      display:block; color:var(--ink2); padding:.28rem 0 .28rem .7rem;
      border-left:2px solid var(--line); position:relative;
    }
    .toc a:hover{color:var(--ink); text-decoration:none; border-left-color:var(--ink3)}
    .toc a em{font-family:var(--mono); font-style:normal; font-size:.72rem; color:var(--ink3); margin-right:.3rem}
    .toc a.is-parent{color:var(--ink); font-weight:700}
    .toc a.is-parent em{color:var(--accent)}
    .toc a.is-active{
      color:var(--accent-ink); font-weight:700;
      border-left-color:var(--accent); background:var(--accent-soft);
    }
    .toc a.is-active em{color:var(--accent-ink)}
    .toc .sub{margin:.1rem 0 .35rem}
    .toc .sub a{
      padding-left:1.5rem; font-size:.79rem; color:var(--ink3);
    }
    .toc .sub a::before{
      content:''; position:absolute; left:.75rem; top:1em;
      width:.4rem; height:1px; background:var(--line);
    }
    .toc .sub a.is-active::before{background:var(--accent)}
  }

  /* ---------- 이전/다음 ---------- */
  .pager{
    max-width:1120px; margin:0 auto; padding:2.5rem 1.25rem 0;
    display:grid; gap:.8rem; grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));
  }
  .pager a{
    border:1px solid var(--line); background:var(--surface); padding:1rem 1.15rem;
    color:var(--ink); display:block; border-radius:3px;
    transition:border-color .18s ease, transform .18s ease, box-shadow .18s ease;
  }
  .pager a:hover{
    border-color:var(--accent); text-decoration:none;
    transform:translateY(-2px); box-shadow:var(--lift);
  }
  .pager .dir{
    display:block; font-family:var(--mono); font-size:.68rem; letter-spacing:.14em;
    text-transform:uppercase; color:var(--ink3); margin-bottom:.3rem;
  }
  .pager .ttl{font-weight:700; font-size:.98rem}
  .pager .next{text-align:right}
  @media (prefers-reduced-motion: reduce){
    .pager a{transition:none} .pager a:hover{transform:none}
  }

  /* ---------- 홈 ---------- */
  .home-lead{max-width:1120px; margin:0 auto; padding:0 1.25rem}
  .home-lead h2{
    font-family:var(--serif); font-size:1.35rem; margin:2.5rem 0 .6rem; font-weight:700;
  }
  .home-lead p{color:var(--ink2); max-width:66ch; margin:.4rem 0}
  .howto{
    max-width:1120px; margin:1.2rem auto 0; padding:0 1.25rem;
    display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));
  }
  .howto div{
    border:1px solid var(--line); background:var(--surface); padding:1.15rem 1.2rem;
    border-radius:3px; transition:border-color .18s ease, box-shadow .18s ease;
  }
  .howto div:hover{border-color:var(--accent); box-shadow:var(--shadow)}
  .howto h3{position:relative; padding-left:.85rem}
  .howto h3::before{
    content:''; position:absolute; left:0; top:.42em;
    width:.32rem; height:.32rem; background:var(--accent); border-radius:50%;
  }
  .howto h3{margin:0 0 .35rem; font-size:.95rem; font-weight:700}
  .howto p{margin:0; font-size:.86rem; color:var(--ink3); line-height:1.6}
"""

# ---------- 글자 크기 1.3배 ----------
# rem 기준을 키워 여백·글자를 함께 확대하고, 위젯의 고정 px 치수도 rem으로 바꿔 같이 커지게 한다.
assert "font-family:var(--sans); font-size:16px;" in style, "body 글자 크기 선언을 찾지 못함"
style = style.replace("font-family:var(--sans); font-size:16px;",
                      "font-family:var(--sans); font-size:1rem;", 1)
style = style.replace("  body{\n", "  html{font-size:130%}\n  body{\n", 1)
assert "html{font-size:130%}" in style, "기준 글자 크기 치환 실패"

PX2REM = [
    # 상단 바 높이 · 헤딩 여유
    # 스택 · 큐
    ("width:132px; height:216px", "width:8.25rem; height:13.5rem"),
    ("width:min(100%,392px); height:66px", "width:min(100%,24.5rem); height:4.125rem"),
    (".stackbox .cell{height:32px; width:100%}", ".stackbox .cell{height:2rem; width:100%}"),
    (".queuebox .cell{height:100%; width:62px}", ".queuebox .cell{height:100%; width:3.875rem}"),
    ("width:min(100%,392px); font-size:.72rem", "width:min(100%,24.5rem); font-size:.72rem"),
    # 재귀 추적
    ("width:190px; height:auto; min-height:216px", "width:11.875rem; height:auto; min-height:13.5rem"),
    ("min-height:30px", "min-height:1.875rem"),
    ("max-height:246px", "max-height:15.4rem"),
    # 하노이
    ("max-width:520px; margin:0 auto}", "max-width:32.5rem; margin:0 auto}"),
    ("height:176px", "height:11rem"),
    ("border-bottom:7px solid var(--ink3)", "border-bottom:.44rem solid var(--ink3)"),
    ("width:7px; height:158px", "width:.44rem; height:9.875rem"),
    ("height:21px; border-radius:3px", "height:1.3rem; border-radius:3px"),
    ("bottom:-24px", "bottom:-1.5rem"),
    ("padding-bottom:26px", "padding-bottom:1.6rem"),
    # 이진 탐색 · 막대
    ("width:44px; height:40px", "width:2.75rem; height:2.5rem"),
    ("max-width:520px; margin:0 auto}\n  .bar-row", "max-width:32.5rem; margin:0 auto}\n  .bar-row"),
    ("height:22px; position:relative", "height:1.375rem; position:relative"),
    # 좁은 화면 보정
    ("width:112px; height:200px", "width:7rem; height:12.5rem"),
    ("width:54px}", "width:3.375rem}"),
    (".peg{height:150px} .peg::before{height:132px}", ".peg{height:9.4rem} .peg::before{height:8.25rem}"),
    ("width:38px; height:36px", "width:2.4rem; height:2.25rem"),
]
for a, b in PX2REM:
    if a in style:
        style = style.replace(a, b)
    else:
        print("  [건너뜀] px→rem 대상 없음:", a[:48])

# 상단 바 높이 변수 + 넓어진 글자에 맞춘 사이드바
style = style.replace(":root{\n", ":root{\n    --topbar-h:3.4rem;\n", 1)
style = style.replace("@media (min-width:1000px){\n    .wrap{grid-template-columns:216px minmax(0,1fr); gap:3rem; align-items:start}\n  }",
                      "@media (min-width:1080px){\n    .wrap{grid-template-columns:13.5rem minmax(0,1fr); gap:2.6rem; align-items:start}\n  }")

# 단일 페이지 시절의 .toc 규칙 제거(새 규칙으로 대체)
style = re.sub(r'  \.toc\{display:none\}\n  @media \(min-width:1000px\)\{.*?\n  \}\n',
               '', style, count=1, flags=re.S)
# 헤딩이 상단 바에 가리지 않도록
style = style.replace(".unit{padding-top:3rem; scroll-margin-top:1rem}",
                      ".unit{padding-top:2rem; scroll-margin-top:4.6rem}")
style = style.replace(".topic{margin-top:2.6rem; scroll-margin-top:1rem}",
                      ".topic{margin-top:2.6rem; scroll-margin-top:4.6rem}")
style = style.replace(".topic h4{", ".topic h4{scroll-margin-top:4.6rem; ")
style += EXTRA_CSS

# ---------- 추가 JS(스크롤 스파이) ----------
EXTRA_JS = """
/* ============ 목차 자동 생성 + 스크롤 스파이 ============ */
(function () {
  'use strict';
  var nav = document.getElementById('toc-nav');
  var crumb = document.querySelector('[data-crumb]');
  var bar = document.querySelector('[data-progress]');
  if (!nav && !crumb && !bar) return;

  // 1) 소단원(h3) 아래 h4를 하위 목차로 추가
  if (nav) {
    [].slice.call(nav.querySelectorAll('a[data-level="1"]')).forEach(function (a, ti) {
      var topic = document.getElementById(a.getAttribute('href').slice(1));
      if (!topic) return;
      var hs = [].slice.call(topic.querySelectorAll('h4'));
      if (!hs.length) return;
      var ol = document.createElement('ol');
      ol.className = 'sub';
      hs.forEach(function (h, i) {
        if (!h.id) h.id = 's' + (ti + 1) + '-' + (i + 1);
        var li = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#' + h.id;
        link.dataset.level = '2';
        link.textContent = h.textContent.trim();
        li.appendChild(link); ol.appendChild(li);
      });
      a.parentNode.appendChild(ol);
    });
  }

  // 2) 스파이 대상 = 문서 순서대로 정렬된 목차 링크
  var links = nav ? [].slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var items = links.map(function (a) {
    return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) };
  }).filter(function (x) { return x.el; });
  items.sort(function (p, q) {
    return p.el.getBoundingClientRect().top - q.el.getBoundingClientRect().top;
  });

  // 모바일 현재 위치 표시는 목차가 없어도 동작하도록 소단원에서 직접 수집
  var topics = [].slice.call(document.querySelectorAll('article.topic'));

  var ticking = false, lastIdx = -1;
  function top(el) { return el.getBoundingClientRect().top + window.pageYOffset; }

  // rAF가 억제되는 환경(백그라운드 탭 등)에서도 갱신되도록 타이머를 함께 건다
  function schedule() {
    if (ticking) return;
    ticking = true;
    var ran = false;
    var run = function () { if (ran) return; ran = true; update(); };
    if (window.requestAnimationFrame) window.requestAnimationFrame(run);
    setTimeout(run, 120);
  }

  function update() {
    ticking = false;
    var line = window.pageYOffset + 90;

    document.body.classList.toggle('is-scrolled', window.pageYOffset > 8);

    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.max(0, Math.min(100, window.pageYOffset / h * 100)) : 0) + '%';
    }

    if (items.length) {
      var idx = 0;
      for (var i = 0; i < items.length; i++) if (top(items[i].el) <= line) idx = i;
      if (idx !== lastIdx) {
        lastIdx = idx;
        items.forEach(function (x) { x.a.classList.remove('is-active', 'is-parent'); });
        items[idx].a.classList.add('is-active');
        if (items[idx].a.dataset.level === '2') {
          for (var j = idx; j >= 0; j--) {
            if (items[j].a.dataset.level === '1') { items[j].a.classList.add('is-parent'); break; }
          }
        }
        var act = items[idx].a;
        if (nav && act.offsetParent) {
          var r = act.getBoundingClientRect(), nr = nav.parentNode.getBoundingClientRect();
          if (r.top < nr.top || r.bottom > nr.bottom) act.scrollIntoView({ block: 'nearest' });
        }
      }
    }

    if (crumb && topics.length) {
      var cur = topics[0];
      topics.forEach(function (t) { if (top(t) <= line) cur = t; });
      var h3 = cur.querySelector('h3');
      if (h3) {
        var idxEl = h3.querySelector('.idx');
        var title = h3.cloneNode(true);
        [].slice.call(title.querySelectorAll('span')).forEach(function (s) { s.remove(); });
        crumb.innerHTML = (idxEl ? idxEl.textContent + ' ' : '') + '<b>' + title.textContent.trim() + '</b>';
      }
    }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { lastIdx = -1; update(); });
  window.addEventListener('load', update);
  update();
})();
"""
script = script.rstrip() + "\n" + EXTRA_JS

# ---------- 파일 쓰기 ----------
if os.path.isdir(OUT):
    for f in os.listdir(OUT):
        if f.endswith(".html"):
            os.remove(os.path.join(OUT, f))
os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)

RESET = """*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0}
img,svg{display:block;max-width:100%}
button,input,select,textarea{font:inherit}
"""
io.open(os.path.join(OUT, "assets", "style.css"), "w", encoding="utf-8", newline="\n").write(RESET + style)
io.open(os.path.join(OUT, "assets", "app.js"), "w", encoding="utf-8", newline="\n").write(script.strip() + "\n")

FAVICON = ("<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' "
           "viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#129513;</text></svg>\">")

def head(title, desc, css="assets/style.css"):
    return """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s</title>
<meta name="description" content="%s">
<meta property="og:title" content="%s">
<meta property="og:description" content="%s">
<meta property="og:type" content="website">
%s
<link rel="stylesheet" href="%s">
</head>
""" % (title, desc, title, desc, FAVICON, css)

def topbar(current, prefix=""):
    links = []
    for n in (1, 2, 3, 4):
        r, name, wk, _ = UNIT_META[n]
        cls = ' class="is-current"' if n == current else ''
        links.append('      <a href="%sunit%d.html"%s>%s %s</a>' % (prefix, n, cls, r, name))
    return """<header class="topbar">
  <div class="topbar-in">
    <a class="brand" href="%sindex.html">정보과학</a>
    <nav class="unitnav" aria-label="단원">
%s
    </nav>
  </div>
  <div class="progress" data-progress></div>
</header>
""" % (prefix, "\n".join(links))

def toc(n):
    r, name, wk, _ = UNIT_META[n]
    body = units[n]
    entries = []
    for m in re.finditer(r'<article class="topic" id="(t\d-\d)">\s*\n\s*<h3>(.*?)</h3>', body, re.S):
        tid, h3 = m.group(1), m.group(2)
        idx = re.search(r'<span class="idx">(.*?)</span>', h3)
        title = re.sub(r'<span class="lesson">.*?</span>', '', h3)
        title = re.sub(r'<span class="idx">.*?</span>', '', title)
        title = re.sub(r'<[^>]+>', '', title).strip()
        entries.append('        <li><a href="#%s" data-level="1"><em>%s</em>%s</a></li>'
                       % (tid, idx.group(1) if idx else '', title))
    return """<aside class="toc" aria-label="이 단원 목차">
  <a class="toc-home" href="index.html">← 전체 목차</a>
  <div class="toc-title">%s %s<span>%s</span></div>
  <nav id="toc-nav">
    <ol>
%s
    </ol>
  </nav>
</aside>
""" % (r, name, wk, "\n".join(entries))

def pager(n, prefix=""):
    parts = []
    if n > 1:
        r, name, wk, _ = UNIT_META[n - 1]
        parts.append('  <a class="prev" href="%sunit%d.html"><span class="dir">← 이전 단원</span>'
                     '<span class="ttl">%s %s</span></a>' % (prefix, n - 1, r, name))
    else:
        parts.append('  <a class="prev" href="%sindex.html"><span class="dir">← 처음으로</span>'
                     '<span class="ttl">전체 목차와 주차 계획</span></a>' % prefix)
    if n < 4:
        r, name, wk, _ = UNIT_META[n + 1]
        parts.append('  <a class="next" href="%sunit%d.html"><span class="dir">다음 단원 →</span>'
                     '<span class="ttl">%s %s</span></a>' % (prefix, n + 1, r, name))
    else:
        parts.append('  <a class="next" href="%sindex.html"><span class="dir">처음으로 →</span>'
                     '<span class="ttl">전체 목차와 주차 계획</span></a>' % prefix)
    return '<nav class="pager" aria-label="단원 이동">\n' + "\n".join(parts) + '\n</nav>\n'

def unit_page(n, prefix="", css="assets/style.css", js="assets/app.js"):
    r, name, wk, desc = UNIT_META[n]
    title = "%s %s · 정보과학" % (r, name)
    return (head(title, desc, css)
            + '<body class="u%d">\n' % n
            + topbar(n, prefix)
            + '<div class="crumbbar" data-crumb></div>\n'
            + '<div class="wrap">\n'
            + toc(n)
            + '<main>\n\n' + units[n].strip() + '\n\n</main>\n</div>\n\n'
            + pager(n, prefix)
            + footer + '\n'
            + '<script src="%s"></script>\n' % js
            + '</body>\n</html>\n')

for n in (1, 2, 3, 4):
    io.open(os.path.join(OUT, "unit%d.html" % n), "w", encoding="utf-8", newline="\n").write(unit_page(n))

# ---------- 홈 ----------
HOWTO = """<section class="howto">
  <div><h3>단원별로 나뉘어 있습니다</h3><p>위 카드나 상단 메뉴에서 단원을 고르세요. 각 단원은 독립된 페이지라 필요한 부분만 열어 볼 수 있습니다.</p></div>
  <div><h3>왼쪽 목차가 현재 위치를 알려 줍니다</h3><p>단원 페이지에서 스크롤하면 지금 보고 있는 항목이 왼쪽 목차에 표시됩니다. 휴대폰에서는 화면 위쪽에 나타납니다.</p></div>
  <div><h3>직접 조작해 보세요</h3><p>스택·큐·재귀 호출·하노이 탑·이진 탐색 등 7개의 실습이 본문 안에 들어 있습니다.</p></div>
</section>
"""
home_map = unitmap
for n in (1, 2, 3, 4):
    home_map = home_map.replace('href="#unit%d"' % n, 'href="unit%d.html"' % n)

home = (head("정보과학",
             "씨마스 『정보과학』 2022 개정 교육과정 핵심 내용 정리 · 보문고등학교 김용득 선생님 제작.")
        + '<body>\n'
        + masthead + "\n\n" + home_map + "\n\n" + HOWTO + "\n" + plan + "\n\n"
        + footer + '\n<script src="assets/app.js"></script>\n</body>\n</html>\n')
io.open(os.path.join(OUT, "index.html"), "w", encoding="utf-8", newline="\n").write(home)

print("built:", ", ".join(sorted(os.listdir(OUT))))
