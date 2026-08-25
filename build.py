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

# ---------- 실행 가능한 코드 블록 표시 ----------
import ast as _ast, html as _html

_NO_RUN = ('turtle', 'ColabTurtle', 'pip install', 'import os', 'os.path', 'csv', '...', '⋮', '•')

def mark_runnable(body):
    """파이썬으로 파싱되고, 최상위에서 실제 실행되며, 출력이 있는 블록에만 data-run을 단다."""
    out, cnt = [], 0
    for part in re.split(r'(<pre>.*?</pre>)', body, flags=re.S):
        m = re.match(r'<pre>(.*?)</pre>', part, re.S)
        if not m:
            out.append(part); continue
        code = _html.unescape(m.group(1))
        runnable = True
        if any(k in code for k in _NO_RUN):
            runnable = False
        else:
            try:
                tree = _ast.parse(code)
            except SyntaxError:
                runnable = False
            else:
                skip = (_ast.FunctionDef, _ast.AsyncFunctionDef, _ast.ClassDef,
                        _ast.Import, _ast.ImportFrom)
                has_exec = any(not isinstance(nd, skip) for nd in tree.body)
                if not has_exec or 'print(' not in code:
                    runnable = False
        if runnable:
            cnt += 1
            attrs = ' data-run data-editable'
            if 'input(' in code:
                attrs += ' data-needs-stdin'
            out.append('<pre%s>%s</pre>' % (attrs, m.group(1)))
        else:
            out.append(part)
    return ''.join(out), cnt


_DRILL_RE = re.compile(
    r'(<div class="drill">\s*<span class="lbl">스스로 해결하기</span>)(.*?)'
    r'(?=<div class="(?:drill|deep)"|</article>|<h4|<h3)', re.S)

def mark_editable_drill(body):
    """'스스로 해결하기' 안의 코드는 학생이 직접 고쳐 쓰는 것이 목적이므로,
    미완성 코드라도 항상 수정 가능(data-editable)한 실행 블록으로 만든다."""
    cnt = 0
    def block_sub(bm):
        nonlocal cnt
        def pre_sub(pm):
            nonlocal cnt
            cnt += 1
            code = pm.group(1)
            attrs = ' data-run data-editable'
            if 'input(' in _html.unescape(code):
                attrs += ' data-needs-stdin'
            return '<pre%s>%s</pre>' % (attrs, code)
        content = re.sub(r'<pre>(.*?)</pre>', pre_sub, bm.group(2), flags=re.S)
        return bm.group(1) + content
    return _DRILL_RE.sub(block_sub, body), cnt


_QUIZ_ANSWER_RE = re.compile(r'<div class="answer">.*?</div>\s*</details>', re.S)

def mark_quiz_blank(body):
    """연습 문제 정답 코드는 펼치자마자 다 보여 주지 않고 빈 칸으로 시작해서
    먼저 스스로 풀어 보게 하고, 버튼을 눌러야 정답이 나오게 표시만 해 둔다.
    실제 빈칸 처리와 정답 보기 버튼은 실행기 JS(EXTRA_JS)가 담당한다."""
    def block_sub(bm):
        return re.sub(r'<pre(?=[ >])', '<pre data-blank', bm.group(0))
    return _QUIZ_ANSWER_RE.sub(block_sub, body)


UNIT_META = {
    1: ("Ⅰ", "프로그래밍", "1~5주차", "함수 · 모듈 · 재귀 구조 — 코드를 작은 단위로 나누는 법"),
    2: ("Ⅱ", "데이터 구조", "6~9주차", "스택 · 큐 · 트리 · 그래프 — 데이터를 담는 그릇의 모양"),
    3: ("Ⅲ", "알고리즘", "10~13주차", "복잡도 · 탐색 기반 · 관계 기반 — 더 빠른 해결 전략"),
    4: ("Ⅳ", "정보과학 프로젝트", "14~16주차", "문제 발견부터 검증까지, 실제로 만들어 보는 4단계"),
}

_run_total = 0
for _n in (1, 2, 3, 4):
    units[_n], _c0 = mark_editable_drill(units[_n])
    units[_n], _c1 = mark_runnable(units[_n])
    units[_n] = mark_quiz_blank(units[_n])
    _run_total += _c0 + _c1

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
  .themetoggle{
    flex:0 0 auto; display:inline-flex; align-items:center; gap:.4rem;
    padding:.34rem .6rem; border:1px solid var(--line); background:var(--surface-2);
    color:var(--ink2); border-radius:2px; cursor:pointer; font-size:.78rem; line-height:1;
    transition:border-color .18s ease, color .18s ease;
  }
  .themetoggle:hover{border-color:var(--accent); color:var(--accent-ink)}
  .themetoggle svg{width:1rem; height:1rem; display:block}
  .themetoggle .ico-sun{display:none}
  :root[data-theme="dark"] .themetoggle .ico-sun{display:block}
  :root[data-theme="dark"] .themetoggle .ico-moon{display:none}
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]) .themetoggle .ico-sun{display:block}
    :root:not([data-theme="light"]) .themetoggle .ico-moon{display:none}
  }
  @media (max-width:640px){ .themetoggle .ico-label{display:none} .themetoggle{padding:.5rem .6rem} }
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

  /* ---------- 파이썬 코드 실행기 ---------- */
  pre[data-run]{margin-bottom:0; border-radius:3px 3px 0 0}
  pre.is-editable{
    outline:2px dashed var(--accent); outline-offset:-2px; cursor:text;
  }
  pre.is-editable:focus{outline-style:solid; background:var(--accent-soft)}
  pre.is-editable:empty::before{content:attr(data-placeholder); color:var(--ink3); pointer-events:none}
  .runner{
    margin:0 0 1.2rem; border:1px solid var(--line); border-top:none;
    background:var(--surface); border-radius:0 0 3px 3px;
  }
  .runner-bar{display:flex; flex-wrap:wrap; gap:.45rem; align-items:center; padding:.5rem .7rem}
  .runner-bar .hint{font-size:.76rem; color:var(--ink3); margin-left:auto}
  .stdin-lab{
    display:block; font-size:.75rem; color:var(--ink3);
    padding:.5rem .7rem .6rem; border-top:1px solid var(--line-2);
  }
  .stdin-lab textarea{
    display:block; width:100%; margin-top:.35rem;
    border:1px solid var(--line); background:var(--code-bg); color:var(--code-ink);
    font-family:var(--mono); font-size:.82rem; padding:.45rem .55rem;
    resize:vertical; border-radius:2px;
  }
  .runner-out{
    margin:0; border:none; border-top:1px solid var(--line-2); border-radius:0;
    background:var(--code-bg); font-size:.84rem; max-height:22rem; overflow:auto;
    white-space:pre-wrap; word-break:break-all; padding:.7rem;
  }
  .runner-out.err{color:var(--err)}
  .runner-out.wait{color:var(--ink3)}

  /* ---------- 열람 잠금 화면 ---------- */
  html:not(.unlocked) body{overflow:hidden}
  html.unlocked #gate{display:none}
  #gate{
    position:fixed; inset:0; z-index:100; background:var(--paper);
    display:flex; align-items:center; justify-content:center; padding:1.5rem;
    background-image:radial-gradient(circle at 1px 1px, var(--dot) 1px, transparent 0);
    background-size:22px 22px;
  }
  .gate-card{
    width:100%; max-width:23rem; background:var(--surface);
    border:1px solid var(--line); border-top:2px solid var(--accent);
    border-radius:3px; padding:2rem 1.8rem 1.6rem; box-shadow:var(--lift);
    display:flex; flex-direction:column;
  }
  .gate-card h1{
    font-family:var(--display-solid); font-weight:500; font-size:1.9rem;
    letter-spacing:.1em; text-indent:.1em; margin:0; color:var(--ink);
    text-shadow:var(--title-shadow);
  }
  .gate-sub{margin:.7rem 0 1.6rem; font-size:.86rem; color:var(--ink3); line-height:1.6}
  .gate-lab{
    font-family:var(--mono); font-size:.68rem; letter-spacing:.14em;
    text-transform:uppercase; color:var(--accent); margin-bottom:.4rem;
  }
  .gate-pwrap{position:relative}
  #gate-pw{
    width:100%; padding:.6rem 2.6rem .6rem .7rem; font-size:1rem;
    border:1px solid var(--line); background:var(--surface-2); color:var(--ink);
    border-radius:2px;
  }
  #gate-pw:focus{outline:2px solid var(--accent); outline-offset:-2px}
  .gate-eye{
    position:absolute; right:.15rem; top:50%; transform:translateY(-50%);
    width:2.2rem; height:2.2rem; display:flex; align-items:center; justify-content:center;
    border:none; background:none; color:var(--ink2); cursor:pointer; border-radius:2px;
  }
  .gate-eye:hover{color:var(--accent-ink)}
  .gate-eye:focus-visible{outline:2px solid var(--accent); outline-offset:1px}
  .gate-eye svg{width:1.15rem; height:1.15rem; display:block}
  .gate-eye .ico-eye-off{display:none}
  .gate-eye[aria-pressed="true"] .ico-eye{display:none}
  .gate-eye[aria-pressed="true"] .ico-eye-off{display:block}
  .gate-hint{margin:.45rem 0 0; font-size:.74rem; color:var(--ink3); line-height:1.55}
  .gate-msg{margin:.6rem 0 0; font-size:.82rem; color:var(--err); min-height:1.2em}
  .gate-btn{margin-top:.9rem; width:100%; justify-content:center; padding:.6rem}
  .gate-note{
    margin:1.5rem 0 0; padding-top:1rem; border-top:1px solid var(--line-2);
    font-size:.76rem; color:var(--ink3); line-height:1.65;
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
/* ============ 파이썬 코드 실행기 ============ */
(function () {
  'use strict';
  var pres = [].slice.call(document.querySelectorAll('pre[data-run]'));
  if (!pres.length) return;

  var BASE = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/';
  var booting = null, gvars = null;

  function boot() {
    if (booting) return booting;
    booting = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = BASE + 'pyodide.js';
      s.onload = function () { window.loadPyodide({ indexURL: BASE }).then(resolve, reject); };
      s.onerror = function () { reject(new Error('실행기를 내려받지 못했습니다. 인터넷 연결을 확인해 주세요.')); };
      document.head.appendChild(s);
    });
    return booting;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function globalsOf(py) { if (!gvars) gvars = py.toPy({}); return gvars; }
  function resetVars() { if (gvars) { gvars.destroy(); gvars = null; } }

  // Pyodide 기본 배포판에 들어 있지 않은 순수 파이썬 라이브러리는
  // loadPackagesFromImports가 찾지 못해 ModuleNotFoundError가 난다.
  // 코드에서 이런 라이브러리를 쓰면 micropip으로 한 번만 내려받는다.
  var EXTRA_PKGS = ['colorama'];
  var micropip = null, installedPkgs = {};
  function ensureExtraPackages(py, code) {
    var need = EXTRA_PKGS.filter(function (name) {
      return !installedPkgs[name] && code.indexOf(name) !== -1;
    });
    if (!need.length) return Promise.resolve();
    var ready = micropip ? Promise.resolve(micropip)
      : py.loadPackage('micropip').then(function () {
          return (micropip = py.pyimport('micropip'));
        });
    return ready.then(function (mp) {
      return need.reduce(function (p, name) {
        return p.then(function () { return mp.install(name); })
          .then(function () { installedPkgs[name] = true; });
      }, Promise.resolve());
    });
  }

  // execCommand('insertText', ...)는 더 이상 표준이 아니고 브라우저마다 동작이
  // 다르므로, 편집 가능한 코드 블록에서는 Selection/Range API로 직접 텍스트
  // 노드를 다뤄 Tab·Enter·붙여넣기가 항상 같은 방식으로 동작하게 한다.
  function insertPlainText(text) {
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    range.deleteContents();
    var node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function run(pre, out, stdinEl, btn) {
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = '실행 중…';
    out.hidden = false;
    out.className = 'runner-out wait';
    out.textContent = booting ? '실행 중…'
      : '파이썬 실행기를 준비하고 있습니다. 처음 한 번만 몇 초 걸립니다…';

    var NL = String.fromCharCode(10), CR = String.fromCharCode(13);
    var raw = stdinEl ? stdinEl.value.split(CR).join('') : '';
    var lines = stdinEl ? raw.split(NL) : [];
    var i = 0;
    var buf = [];

    // stdout은 줄바꿈이 없으면 곧바로 batched 콜백으로 넘어오지 않고 뒤늦게
    // 모아서 전달될 수 있어, input() 프롬프트와 입력값을 실행 도중 실시간으로
    // 순서대로 재현하기 어렵다. 그 대신 실제로 소비된 입력값을 결과 맨 앞에
    // 따로 정리해 보여 주어, input()을 쓴 예제도 결과를 바로 확인할 수 있게 한다.
    function withInputSummary(body) {
      if (!i) return body;
      var used = lines.slice(0, i).map(function (v) { return v === '' ? '(빈 값)' : v; });
      return 'input() 입력값 → ' + used.join(', ') + NL + NL + body;
    }

    boot().then(function (py) {
      return ensureExtraPackages(py, pre.textContent).then(function () {
        py.setStdin({ stdin: function () { return i < lines.length ? lines[i++] : ''; } });
        py.setStdout({ batched: function (s) { buf.push(s); } });
        py.setStderr({ batched: function (s) { buf.push(s); } });
        return py.runPythonAsync(pre.textContent, { globals: globalsOf(py) });
      }).then(function () {
        out.className = 'runner-out';
        out.textContent = withInputSummary(buf.length ? buf.join(NL) : '(출력 없음)');
      });
    }).catch(function (e) {
      out.className = 'runner-out err';
      var msg = String((e && e.message) || e);
      var m = msg.match(new RegExp('([A-Za-z_]*(?:Error|Exception)[^]*)$'));
      var errText = (m ? m[1] : msg).trim();
      out.textContent = withInputSummary(buf.length ? buf.join(NL) + NL + NL + errText : errText);
      if (/NameError/.test(msg)) {
        out.textContent += String.fromCharCode(10,10) + '힌트: 이 예제는 앞 코드 블록에서 만든 함수나 변수를 씁니다. 위쪽 블록을 먼저 실행해 보세요.';
      }
    }).then(function () {
      btn.disabled = false;
      btn.textContent = label;
    });
  }

  pres.forEach(function (pre) {
    var editable = pre.hasAttribute('data-editable');
    var isBlank = pre.hasAttribute('data-blank');
    var original = pre.textContent;
    var revealed = !isBlank;

    var wrap = el('div', 'runner');
    var bar = el('div', 'runner-bar');

    var runBtn = el('button', 'btn btn-p', '▶ 실행');  runBtn.type = 'button';
    var copyBtn = el('button', 'btn', '복사');          copyBtn.type = 'button';
    var resetBtn = el('button', 'btn', '변수 초기화');   resetBtn.type = 'button';
    bar.appendChild(runBtn); bar.appendChild(copyBtn); bar.appendChild(resetBtn);

    if (editable) {
      pre.classList.add('is-editable');
      pre.contentEditable = 'true';
      pre.spellcheck = false;
      pre.setAttribute('aria-label', '코드를 직접 고칠 수 있습니다');

      // 연습 문제 정답 코드는 바로 보여 주지 않고 빈 칸으로 시작해서
      // 먼저 스스로 풀어 보게 하고, 버튼을 눌러야 정답을 확인할 수 있다.
      if (isBlank) {
        pre.textContent = '';
        pre.setAttribute('data-placeholder', '여기에 직접 코드를 작성해 보세요');
      }

      var revertBtn = el('button', 'btn', isBlank ? '정답 코드 보기' : '원래 코드로');
      revertBtn.type = 'button';
      revertBtn.addEventListener('click', function () {
        if (isBlank) {
          revealed = !revealed;
          pre.textContent = revealed ? original : '';
          revertBtn.textContent = revealed ? '다시 비우기' : '정답 코드 보기';
        } else {
          pre.textContent = original;
        }
        out.hidden = true;
      });
      bar.appendChild(revertBtn);

      pre.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text/plain');
        insertPlainText(text);
      });
      pre.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
          e.preventDefault();
          insertPlainText('    ');
        } else if (e.key === 'Enter') {
          // contenteditable 기본 동작은 줄바꿈 대신 <div>/<br>을 넣어
          // textContent에 개행이 사라지므로, 실제 개행 문자를 직접 삽입한다.
          e.preventDefault();
          insertPlainText(String.fromCharCode(10));
        }
      });
    }

    bar.appendChild(el('span', 'hint', editable ? '직접 고쳐서 실행해 보세요' : '브라우저 안에서 실행됩니다'));
    wrap.appendChild(bar);

    var stdinEl = null;
    if (pre.hasAttribute('data-needs-stdin')) {
      var lab = el('label', 'stdin-lab', 'input() 에 넣을 값 — 한 줄에 하나씩');
      stdinEl = el('textarea');
      stdinEl.rows = 2;
      stdinEl.placeholder = '값을 비워 두면 빈 문자열이 입력됩니다';
      lab.appendChild(stdinEl);
      wrap.appendChild(lab);
    }

    var out = el('pre', 'runner-out');
    out.hidden = true;
    wrap.appendChild(out);
    pre.insertAdjacentElement('afterend', wrap);

    runBtn.addEventListener('click', function () { run(pre, out, stdinEl, runBtn); });
    resetBtn.addEventListener('click', function () {
      resetVars();
      out.hidden = false; out.className = 'runner-out wait';
      out.textContent = '지금까지 만들어진 변수와 함수를 모두 지웠습니다.';
    });
    copyBtn.addEventListener('click', function () {
      var text = pre.textContent;
      var done = function () {
        copyBtn.textContent = '복사됨';
        setTimeout(function () { copyBtn.textContent = '복사'; }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  });
})();

/* ============ 열람 잠금 ============ */
(function () {
  'use strict';
  var gate = document.getElementById('gate');
  if (!gate) return;
  var form = gate.querySelector('[data-gate-form]');
  var pw = gate.querySelector('[data-gate-pw]');
  var msg = gate.querySelector('[data-gate-msg]');
  var eye = gate.querySelector('[data-gate-eye]');
  // 한글 IME가 꺼진 상태에서 친 영문 자판 값(qhansrh)도 함께 받아 준다.
  // 맥에서 자모가 분리되어 들어오는 경우를 위해 NFC로 정규화한다.
  var KEYS = ['보문고', 'qhansrh'];

  function norm(s) {
    s = (s || '').trim().toLowerCase();
    try { s = s.normalize('NFC'); } catch (e) {}
    return s;
  }

  function unlock() {
    try { localStorage.setItem('unlocked', 'yes'); } catch (e) {}
    document.documentElement.classList.add('unlocked');
  }
  if (document.documentElement.classList.contains('unlocked')) return;

  if (eye) {
    eye.addEventListener('click', function () {
      var shown = pw.type === 'text';
      pw.type = shown ? 'password' : 'text';
      eye.setAttribute('aria-pressed', String(!shown));
      eye.setAttribute('aria-label', shown ? '비밀번호 표시' : '비밀번호 숨기기');
      pw.focus();
    });
  }

  setTimeout(function () { pw.focus(); }, 60);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = norm(pw.value);
    if (KEYS.map(norm).indexOf(v) >= 0) {
      msg.textContent = '';
      unlock();
    } else {
      msg.textContent = '비밀번호가 맞지 않습니다. 한글 입력 상태인지 확인해 주세요.';
      pw.value = '';
      pw.focus();
    }
  });
})();

/* ============ 밝게/어둡게 전환 ============ */
(function () {
  'use strict';
  var btns = [].slice.call(document.querySelectorAll('[data-theme-toggle]'));
  if (!btns.length) return;
  var root = document.documentElement;

  function current() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function apply(t, save) {
    root.setAttribute('data-theme', t);
    if (save) { try { localStorage.setItem('theme', t); } catch (e) {} }
    btns.forEach(function (b) {
      b.setAttribute('aria-pressed', String(t === 'dark'));
      b.title = (t === 'dark') ? '밝은 화면으로' : '어두운 화면으로';
      var lab = b.querySelector('.ico-label');
      if (lab) lab.textContent = (t === 'dark') ? '밝게' : '어둡게';
    });
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      apply(current() === 'dark' ? 'light' : 'dark', true);
    });
  });
  apply(current(), false);
})();

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
<script>
(function(){try{if(localStorage.getItem('unlocked')==='yes')document.documentElement.className+=' unlocked';}catch(e){}})();
(function(){try{var m=localStorage.getItem('theme');if(m==='dark'||m==='light')document.documentElement.setAttribute('data-theme',m);}catch(e){}})();
</script>
<link rel="stylesheet" href="%s">
</head>
""" % (title, desc, title, desc, FAVICON, css)

GATE = """<div id="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
  <form class="gate-card" data-gate-form autocomplete="off">
    <h1 id="gate-title">정보과학</h1>
    <p class="gate-sub">씨마스 『정보과학』 2022 개정 교육과정 수업 자료</p>
    <label class="gate-lab" for="gate-pw">열람 비밀번호</label>
    <div class="gate-pwrap">
      <input id="gate-pw" type="password" data-gate-pw autocomplete="off"
             spellcheck="false" autocapitalize="off" placeholder="수업 시간에 안내된 비밀번호">
      <button class="gate-eye" type="button" data-gate-eye aria-pressed="false" aria-label="비밀번호 표시">
        <svg class="ico-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>
        <svg class="ico-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.9 5.1A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a13.6 13.6 0 0 1-3.2 4.1M6.5 6.5C3.4 8.3 1.5 12 1.5 12a13.5 13.5 0 0 0 4.2 4.9"/></svg>
      </button>
    </div>
    <p class="gate-hint">한글로 입력하세요. 대소문자와 앞뒤 공백은 구분하지 않습니다.</p>
    <p class="gate-msg" data-gate-msg role="status" aria-live="polite"></p>
    <button class="btn btn-p gate-btn" type="submit">들어가기</button>
    <p class="gate-note">본 자료는 학교 수업 목적으로 제작되었으며,
      저작권법에 의해 무단 전재 및 배포를 금합니다.</p>
  </form>
</div>
"""


THEME_BTN = """    <button class="themetoggle" type="button" data-theme-toggle aria-pressed="false" title="어두운 화면으로">
      <svg class="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      <svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.6v2M12 19.4v2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M2.6 12h2M19.4 12h2M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4"/></svg>
      <span class="ico-label">어둡게</span>
    </button>"""


def topbar(current, prefix="", brand=True):
    links = []
    for n in (1, 2, 3, 4):
        r, name, wk, _ = UNIT_META[n]
        cls = ' class="is-current"' if n == current else ''
        links.append('      <a href="%sunit%d.html"%s>%s %s</a>' % (prefix, n, cls, r, name))
    return """<header class="topbar">
  <div class="topbar-in">
%s
    <nav class="unitnav" aria-label="단원">
%s
    </nav>
%s
  </div>
  <div class="progress" data-progress></div>
</header>
""" % (
        ('    <a class="brand" href="%sindex.html">정보과학</a>' % prefix) if brand else '',
        "\n".join(links), THEME_BTN)

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
            + '<body class="u%d">\n' % n + GATE
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
  <div><h3>코드를 바로 실행해 보세요</h3><p>예제 코드 아래 <b>▶ 실행</b>을 누르면 설치 없이 브라우저 안에서 파이썬이 돌아갑니다. <code>input()</code>이 있는 예제는 입력값을 미리 적어 두면 됩니다.</p></div>
  <div><h3>직접 조작하는 실습</h3><p>스택·큐·재귀 호출·하노이 탑·이진 탐색 등 7개의 실습 위젯이 본문 안에 들어 있습니다.</p></div>
</section>
"""
home_map = unitmap
for n in (1, 2, 3, 4):
    home_map = home_map.replace('href="#unit%d"' % n, 'href="unit%d.html"' % n)

home = (head("정보과학",
             "씨마스 『정보과학』 2022 개정 교육과정 핵심 내용 정리 · 보문고등학교 김용득 선생님 제작.")
        + '<body>\n' + GATE
        + topbar(None, brand=False)
        + masthead + "\n\n" + home_map + "\n\n" + HOWTO + "\n" + plan + "\n\n"
        + footer + '\n<script src="assets/app.js"></script>\n</body>\n</html>\n')
io.open(os.path.join(OUT, "index.html"), "w", encoding="utf-8", newline="\n").write(home)

print("built:", ", ".join(sorted(os.listdir(OUT))))
print("실행 가능한 코드 블록:", _run_total, "개")
