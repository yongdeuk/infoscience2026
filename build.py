# -*- coding: utf-8 -*-
"""정보과학 수업 사이트 빌드 스크립트.

사용법: 저장소 루트에서  python build.py

원본(src/)을 읽어 정적 페이지와 assets/site.css · assets/site.js 를 만든다.
  src/data/course.json    과목 정보, 단원(0~Ⅳ) 메타·학습 목표, 16주 차시 계획, 학기 시작일
  src/data/glossary.json  용어(단원별) → 단원 페이지 '핵심 용어' + 용어 사전 페이지
  src/data/quiz.json      퀴즈(단원별) → 단원 페이지 '단원 퀴즈'
  src/units/unitN.html    단원 본문(교과서 내용). 소단원은 <article class="topic" id="tN-M">
  src/pages/*.html        도구 페이지 본문(수업 안내·실습실·파이썬 실습·내 학습)
  src/css/*.css, src/js/*.js  스타일과 스크립트(이어 붙여 하나로 만든다)
"""
import io, os, re, sys, json, html

ROOT = os.path.dirname(os.path.abspath(__file__))
def P(*a): return os.path.join(ROOT, *a)
def rd(p): return io.open(P(p), encoding="utf-8").read()
def wr(p, s):
    os.makedirs(os.path.dirname(P(p)) or ROOT, exist_ok=True)
    io.open(P(p), "w", encoding="utf-8", newline="\n").write(s)

COURSE = json.loads(rd("src/data/course.json"))
GLOSS = json.loads(rd("src/data/glossary.json"))
QUIZ = json.loads(rd("src/data/quiz.json"))
UNITS = {u["n"]: u for u in COURSE["units"]}
UNIT_NS = sorted(UNITS)
PZ = COURSE["programiz"]
# 해마다 바뀌는 값(학기 시작일·평가 비율). 사이트가 실행 중에 다시 읽으므로 빌드 없이 고쳐도 반영된다.
SETTINGS = json.loads(rd("settings.json"))
# 학기는 settings.json을 따른다. 화면에서는 JS가 최신 값으로 [data-term]을 다시 채운다.
TERM = '<span data-term>%s</span> · %s' % (SETTINGS["term"], COURSE["hours"])
SETTINGS_EDIT = "https://github.com/%s/edit/%s/settings.json" % (COURSE["repo"], COURSE["branch"])

# 도구 페이지: (파일 이름, 이름, 아이콘, 설명)
TOOLS = [
    ("course",   "수업 안내",   "📋", "평가 · 수행평가 채점 기준 · 수업 약속 · AI 사용 신호등"),
    ("lessons",  "차시 수업",   "🗓️", "48차시를 한 차시씩 — 목표, 교과서, 빈칸 코드, 실습, 확인 문제"),
    ("labs",     "실습실",      "🧪", "그래프 탐색 · 이진 탐색 트리 · 정렬 경주 등 직접 조작하는 시뮬레이터"),
    ("practice", "파이썬 실습", "🐍", "단원별 실습 세트를 Programiz로 실행 · 자주 나는 오류 해결표"),
    ("glossary", "용어 사전",   "📖", "전 단원 핵심 용어를 검색하고 본문으로 바로 가기"),
    ("my",       "내 학습",     "✅", "해 봤어요 진도 · 퀴즈 점수 · 정리 노트 · txt 내보내기"),
]
TOOL = {k: (n, i, d) for k, n, i, d in TOOLS}
# 메뉴에는 없고 바닥글에서만 들어가는 교사용 페이지
TOOL["settings"] = ("교사 설정", "⚙️", "학기 시작일과 평가 비율을 고치는 교사용 설정")

# 실습실 페이지에만 있는 시뮬레이터(단원 페이지 '실습 모음'에 함께 보인다)
LAB_EXTRA = {
    2: [("labs.html#graph", "그래프 탐색 DFS · BFS"), ("labs.html#bst", "이진 탐색 트리")],
    3: [("labs.html#sort", "정렬 알고리즘 경주")],
}
# 파이썬 실습 페이지의 단원별 세트 위치
PRACTICE_ANCHOR = {1: "nb1", 2: "nb2", 3: "nb3", 4: "nb4"}

def esc(s): return html.escape(s, quote=False)
def uname(u): return u.get("short") or u["name"]
def wklabel(u):
    if u.get("weeks_label"): return u["weeks_label"]
    a, b = u["weeks"]
    return "%d주차" % a if a == b else "%d~%d주차" % (a, b)
def ucls(n): return "u%d" % n

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



FAVICON = ("<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' "
           "viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#129513;</text></svg>\">")


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



# ---------- 단원 본문 ----------
BODY = {}
_run_total = 0
for n in UNIT_NS:
    b = rd("src/units/unit%d.html" % n)
    b, c0 = mark_editable_drill(b)
    b, c1 = mark_runnable(b)
    b = mark_quiz_blank(b)
    BODY[n] = b
    _run_total += c0 + c1

def topics(n):
    out = []
    for m in re.finditer(r'<article class="topic" id="(t\d-\d+)">\s*<h3>(.*?)</h3>', BODY[n], re.S):
        h3 = m.group(2)
        idx = re.search(r'<span class="idx">(.*?)</span>', h3)
        title = re.sub(r'<span class="(?:lesson|idx)">.*?</span>', '', h3)
        title = re.sub(r'<[^>]+>', '', title).strip()
        out.append((m.group(1), idx.group(1) if idx else '', title))
    return out

def labs_in(n):
    out = []
    for m in re.finditer(r'<div class="lab" id="(lab-[\w-]+)">.*?<h5>(.*?)</h5>', BODY[n], re.S):
        out.append(("unit%d.html#%s" % (n, m.group(1)), re.sub(r'<[^>]+>', '', m.group(2)).split(' — ')[0]))
    return out + LAB_EXTRA.get(n, [])

def weeks_of(n):
    a, b = UNITS[n]["weeks"]
    return [w for w in COURSE["weeks"] if a <= w["week"] <= b]

def week_row(w):
    base = (w["week"] - 1) * 3
    return ('<div class="wk" data-week="%d"><span class="n">%d주</span><ol>%s</ol></div>'
            % (w["week"], w["week"], "".join('<li><a href="lesson%02d.html">%s</a></li>' % (base + i + 1, l) for i, l in enumerate(w["lessons"]))))

def quiz_html(n):
    qs = [q for q in QUIZ if q["unit"] == n]
    out = ['<section class="qz-set" data-qz-set="%d">' % n]
    for i, q in enumerate(qs):
        out.append('  <div class="qz" data-ans="%d">' % q["answer"])
        out.append('    <h4><span class="qnum">Q%d</span><span>%s</span></h4>' % (i + 1, q["q"]))
        if q.get("code"):
            code = q["code"] if "&lt;" in q["code"] else esc(q["code"])
            out.append('    <pre>%s</pre>' % code)
        out.append('    <ol class="opts">%s</ol>' % "".join(
            '<li><button type="button" data-n="%s">%s</button></li>' % ("①②③④"[j], o) for j, o in enumerate(q["options"])))
        out.append('    <p class="why"><b>해설</b> — %s</p>' % q["why"])
        out.append('  </div>')
    out.append('  <div class="qz-score" data-qz-score><span>맞힌 문제 <b data-qz-right>0</b> / %d</span>'
               '<span class="muted" data-qz-left>남은 문제 %d개</span><span class="muted" data-qz-best></span>'
               '<button class="btn" type="button" data-qz-reset>다시 풀기</button></div>' % (len(qs), len(qs)))
    out.append('</section>')
    return "\n".join(out)

def gloss_html(items, with_unit=False):
    out = []
    for g in items:
        u = UNITS[g["unit"]]
        out.append('  <div class="gl %s" data-unit="%d"><dt>%s <small>%s</small>%s</dt><dd>%s <a href="unit%d.html#%s">본문 →</a></dd></div>'
                   % (ucls(g["unit"]), g["unit"], g["term"], esc(g["en"]),
                      '<span class="pill">%s</span>' % (u["roman"] if g["unit"] else "기초") if with_unit else "",
                      g["desc"], g["unit"], g["topic"]))
    return "\n".join(out)

# ---------- 공통 틀 ----------
def head(title, desc):
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
<link rel="stylesheet" href="assets/site.css">
</head>
""" % (title, desc, title, desc, FAVICON)

def header(current):
    tools = ['      <a href="index.html"%s>수업 홈</a>' % (' class="is-current"' if current == "home" else "")]
    for k, name, ic, d in TOOLS:
        tools.append('      <a href="%s.html"%s>%s</a>' % (k, ' class="is-current"' if k == current else "", name))
    tabs = []
    for n in UNIT_NS:
        u = UNITS[n]
        tabs.append('    <a class="unittab %s%s" href="%s"><span class="r">%s</span><span class="nm">%s</span><span class="uw">%s</span></a>'
                    % (ucls(n), " is-current" if n == current else "", unit_entry(n), u["roman"], uname(u), wklabel(u)))
    return """<a class="skip" href="#main">본문 바로가기</a>
<header class="topbar">
  <div class="bar-top">
    <a class="brand" href="index.html"><span class="brand-mark">IS</span><span class="brand-name">정보과학</span></a>
    <nav class="toolnav" aria-label="수업 도구">
%s
    </nav>
%s
  </div>
  <nav class="unitbar" aria-label="단원"><div class="unitbar-in">
%s
  </div></nav>
  <div class="progress" data-progress></div>
</header>
""" % ("\n".join(tools), THEME_BTN, "\n".join(tabs))

def footer():
    links = ['<a href="index.html">수업 홈</a>'] + ['<a href="unit%d.html">%s %s</a>' % (n, UNITS[n]["roman"], uname(UNITS[n])) for n in UNIT_NS] \
        + ['<a href="%s.html">%s</a>' % (k, n) for k, n, i, d in TOOLS] \
        + ['<a href="%s" target="_blank" rel="noopener">Programiz</a>' % PZ]
    return """<footer>
  <div class="foot-in">
    <div>
      <p><b data-teacher-tap>%s</b> — %s 수업 자료 · %s</p>
      <p>%s <b>%s</b> 선생님 제작.</p>
      <p>개념·예제 코드·수치는 교과서 본문을 근거로 정리했으며, 그림은 이해를 돕기 위해 새로 그렸습니다. 자세한 예제와 ‘스스로 해결하기’ 활동은 교과서를 함께 보세요.</p>
      <p class="copyright">본 자료는 학교 수업 목적으로 제작되었으며, 저작권법에 의해 무단 전재 및 배포를 금합니다.</p>
    </div>
    <nav class="foot-links" aria-label="사이트 전체">%s</nav>
  </div>
</footer>
""" % (COURSE["title"], COURSE["textbook"], TERM, COURSE["school"], COURSE["teacher"], "".join(links))

SITE_DATA = {
    "topics": {str(n): [t[0] for t in topics(n)] for n in UNIT_NS},
    "units": {str(n): {"roman": UNITS[n]["roman"], "name": UNITS[n]["name"], "weeks": UNITS[n]["weeks"] if n else None} for n in UNIT_NS},
    "quiz": {str(n): sum(1 for q in QUIZ if q["unit"] == n) for n in UNIT_NS},
    "weeks": COURSE["weeks"],
    "settings": SETTINGS,
    "settings_edit": SETTINGS_EDIT,
    "programiz": PZ,
}

def page(title, desc, body_cls, current, body):
    return (head(title, desc)
            + '<body class="%s">\n' % body_cls + GATE + header(current)
            + body + "\n" + footer()
            + '<script>window.SITE=%s;</script>\n' % json.dumps(SITE_DATA, ensure_ascii=False, separators=(",", ":"))
            + '<script src="assets/site.js"></script>\n</body>\n</html>\n')

# ---------- 단원 페이지 ----------
def unit_page(n):
    u = UNITS[n]
    tps, labs = topics(n), labs_in(n)
    terms = [g for g in GLOSS if g["unit"] == n]
    nq = sum(1 for q in QUIZ if q["unit"] == n)
    label = "%s %s" % (u["roman"], u["name"]) if n else u["name"]
    chips = ['<span class="chip"><b>%s</b></span>' % wklabel(u), '<span class="chip">소단원 <b>%d</b></span>' % len(tps)]
    if labs: chips.append('<span class="chip">실습 <b>%d</b></span>' % len(labs))
    chips += ['<span class="chip">용어 <b>%d</b></span>' % len(terms), '<span class="chip">퀴즈 <b>%d</b></span>' % nq]
    hero = """<section class="unithero">
  <div class="unithero-in">
    <p class="crumbs"><a href="index.html">수업 홈</a> / %s</p>
    <div class="bigr" aria-hidden="true">%s</div>
    <div>
      <p class="kicker">%s</p>
      <h1>%s</h1>
      <p class="goal">%s</p>
      <div class="chips">%s</div>
      %s
    </div>
  </div>
</section>
""" % (label, u["roman"], "UNIT %s" % u["roman"] if n else "BEFORE UNIT Ⅰ", u["name"], u["goal"], "".join(chips),
       ('<p class="tolessons"><a class="btn btn-p" href="%s">차시별로 공부하기 · %d차시부터</a><span>이 페이지는 단원 내용을 한 번에 모아 보는 <b>단원 전체 보기</b>예요.</span></p>'
        % (lfile(first_lesson(n)), first_lesson(n))) if n and first_lesson(n) else "")
    quick = ['<a href="#%s">%s %s<span>%s</span></a>' % (tps[0][0], "처음부터", "읽기", tps[0][1])]
    if labs: quick.append('<a href="#u-labs">실습 모음<span>%d개</span></a>' % len(labs))
    quick.append('<a href="#u-terms">핵심 용어<span>%d개</span></a>' % len(terms))
    quick.append('<a href="#u-quiz">단원 퀴즈<span>%d문제</span></a>' % nq)
    quick.append('<a href="#u-practice">Programiz 실습<span>→</span></a>')
    overview = """<section class="overview">
  <div class="ovbox"><h2>이 단원을 마치면</h2><ul class="cando">%s</ul></div>
  <div class="ovbox"><h2>차시 계획</h2>%s</div>
  <div class="ovbox"><h2>바로 가기</h2><div class="qlinks">%s</div></div>
</section>
""" % ("".join("<li>%s</li>" % c for c in u["cando"]),
       "".join(week_row(w) for w in weeks_of(n)) if n else '<p class="muted" style="margin:0">1주차 오리엔테이션 전후에 스스로 복습합니다. 정보 과목에서 배운 내용을 다시 확인하는 단원이라 따로 시간을 잡지 않았어요.</p>',
       "".join(quick))
    toc = ['<aside class="toc" aria-label="이 단원 목차">', '  <div class="toc-title">%s</div>' % label, '  <nav id="toc-nav">',
           '    <p class="toc-group">본문</p>', '    <ol>']
    toc += ['      <li><a href="#%s" data-level="1"><em>%s</em>%s</a></li>' % t for t in tps]
    toc += ['    </ol>', '    <p class="toc-group">단원 마무리</p>', '    <ol>']
    if labs: toc.append('      <li><a href="#u-labs" data-level="1">실습 모음</a></li>')
    toc += ['      <li><a href="#u-terms" data-level="1">핵심 용어</a></li>', '      <li><a href="#u-quiz" data-level="1">단원 퀴즈</a></li>',
            '      <li><a href="#u-practice" data-level="1">Programiz 실습</a></li>', '    </ol>', '  </nav>', '</aside>']
    wrap = []
    if labs:
        wrap.append('<section class="wrapup" id="u-labs"><h3><span class="idx">마무리</span> 실습 모음</h3>'
                    '<p class="lede">이 단원에서 직접 조작해 보는 실습입니다. 다시 해 보고 싶은 것을 눌러 보세요.</p>'
                    '<div class="labindex">%s</div></section>'
                    % "".join('<a href="%s">%s</a>' % (h.replace("unit%d.html" % n, ""), t) for h, t in labs))
    wrap.append('<section class="wrapup" id="u-terms"><h3><span class="idx">마무리</span> 핵심 용어</h3>'
                '<p class="lede">이 단원에서 꼭 알아야 할 용어 %d개입니다. 전 단원 용어는 <a href="glossary.html">용어 사전</a>에서 검색할 수 있어요.</p>'
                '<dl class="gl-list">\n%s\n</dl></section>' % (len(terms), gloss_html(terms)))
    wrap.append('<section class="wrapup" id="u-quiz"><h3><span class="idx">마무리</span> 단원 퀴즈</h3>'
                '<p class="lede">보기를 누르면 바로 채점되고 해설이 나옵니다. 가장 좋은 점수는 <a href="my.html">내 학습</a>에 기록돼요.</p>\n%s\n</section>' % quiz_html(n))
    if n in PRACTICE_ANCHOR:
        prac = ('<a class="tile" href="practice.html#%s"><span class="ic">🐍</span><h3>%s 실습 세트</h3><p>이 단원 내용을 묶은 실습 코드입니다. 칸마다 <b>Programiz에서 실행</b>을 눌러 돌려 보세요.</p></a>'
                % (PRACTICE_ANCHOR[n], label))
    else:
        prac = ('<a class="tile" href="#%s"><span class="ic">🐍</span><h3>위 예제로 연습</h3><p>본문 예제마다 있는 <b>Programiz에서 실행</b>으로 바로 연습할 수 있어요.</p></a>' % tps[1][0])
    wrap.append('<section class="wrapup" id="u-practice"><h3><span class="idx">마무리</span> Programiz 실습</h3>'
                '<p class="lede">코드는 <a href="%s" target="_blank" rel="noopener">Programiz 온라인 컴파일러</a>에서 실행합니다. 사용법과 오류 해결표는 <a href="practice.html">파이썬 실습</a>에 있어요.</p>'
                '<div class="tiles">%s<a class="tile" href="practice.html#errors"><span class="ic">🩹</span><h3>오류 해결표</h3><p>빨간 글씨가 나오면 마지막 줄의 오류 이름으로 찾아보세요.</p></a></div></section>' % (PZ, prac))
    # 이전/다음
    i = UNIT_NS.index(n)
    def plink(cls, d, k):
        if k is None:
            return '<a class="%s" href="index.html"><span class="dir">%s</span><span class="ttl">수업 홈</span></a>' % (cls, d)
        v = UNITS[k]
        return '<a class="%s %s" href="unit%d.html"><span class="dir">%s</span><span class="ttl">%s %s</span></a>' % (cls, ucls(k), k, d, v["roman"], v["name"])
    pager = '<nav class="pager" aria-label="단원 이동">%s%s</nav>\n' % (
        plink("prev", "← 이전", UNIT_NS[i - 1] if i > 0 else None),
        plink("next", "다음 →", UNIT_NS[i + 1] if i + 1 < len(UNIT_NS) else None))
    body = (hero + overview + '<div class="crumbbar" data-crumb></div>\n<div class="wrap">\n' + "\n".join(toc)
            + '\n<main id="main">\n\n' + BODY[n].strip() + "\n\n" + "\n".join(wrap) + "\n</main>\n</div>\n" + pager)
    return page("%s · 정보과학" % label, u["summary"], "unitpage " + ucls(n), n, body)

# ---------- 홈 ----------
def home():
    cards = []
    for n in UNIT_NS:
        u = UNITS[n]
        tps = topics(n)
        cards.append("""  <a class="unitcard %s" href="%s">
    <div class="band"><span class="r">%s</span><span class="wk">%s</span></div>
    <div class="body">
      <h3>%s</h3><p>%s</p>
      <div class="stats"><span>소단원 <b>%d</b></span><span>실습 <b>%d</b></span><span>용어 <b>%d</b></span><span>퀴즈 <b>%d</b></span></div>
      <div class="ubar"><i data-uprog="%d"></i></div>
      <div class="ubar-l"><span>해 봤어요</span><span data-uprog-l="%d">0 / %d</span></div>
    </div>
  </a>""" % (ucls(n), unit_entry(n), u["roman"], wklabel(u), u["name"], u["summary"], len(tps), len(labs_in(n)),
             sum(1 for g in GLOSS if g["unit"] == n), sum(1 for q in QUIZ if q["unit"] == n), n, n, len(tps)))
    cols = []
    for n in UNIT_NS:
        if n == 0: continue
        u = UNITS[n]
        cols.append('<div class="wkcol %s"><h3><a href="unit%d.html">%s %s</a><span>%s</span></h3>%s</div>'
                    % (ucls(n), n, u["roman"], u["name"], wklabel(u), "".join(week_row(w) for w in weeks_of(n))))
    n_labs = sum(len(labs_in(n)) for n in UNIT_NS)
    body = """<section class="hero">
  <div class="hero-in">
    <div>
      <p class="kicker">%s · %s</p>
      <h1>%s</h1>
      <p>%s를 바탕으로 함수와 재귀, 데이터 구조, 알고리즘을 배우고 생활 속 문제를 프로그램으로 해결합니다.</p>
      <div class="chips"><span class="chip">%s</span><span class="chip">단원 <b>%d</b></span><span class="chip">실습 <b>%d</b></span><span class="chip">퀴즈 <b>%d</b></span><span class="chip">Python · Programiz</span></div>
    </div>
    <div class="nowcard" data-now>
      <p class="kicker">처음 오셨나요?</p>
      <h2>이렇게 시작하세요</h2>
      <ol>
        <li><a href="course.html">수업 안내</a>에서 평가와 AI 사용 규칙을 읽어요.</li>
        <li><a href="unit0.html">파이썬 기초</a>로 정보 시간에 배운 문법을 복습해요.</li>
        <li><a href="%s" target="_blank" rel="noopener">Programiz</a>를 열어 코드를 실행해 봐요.</li>
      </ol>
      <a class="go" href="unit1.html">Ⅰ 프로그래밍 시작하기 →</a>
    </div>
  </div>
</section>

<main id="main">
<section class="sec" id="units">
  <div class="sec-h"><h2>단원</h2><p>소단원 끝의 <b>해 봤어요</b>를 누르면 진도 막대가 채워져요.</p></div>
  <div class="unitcards">
%s
  </div>
</section>

<section class="sec" id="plan">
  <div class="sec-h"><h2>16주 수업 계획</h2><p>%s · 총 48시간</p></div>
  <div class="weeks">%s</div>
</section>

<section class="sec" id="guide">
  <div class="sec-h"><h2>수업 안내</h2><p>첫 시간에 함께 읽어요.</p></div>
  <div class="tiles">
    <a class="tile" href="course.html#grade"><span class="ic">📝</span><h3>평가</h3><p>지필·수행평가 영역과 반영 비율, 시기</p></a>
    <a class="tile" href="course.html#rubric"><span class="ic">🧩</span><h3>수행평가 채점 기준</h3><p>수행평가마다 무엇을 어떻게 채점하는지</p></a>
    <a class="tile" href="course.html#ai"><span class="ic">🚦</span><h3>AI 사용 신호등</h3><p>초록·노랑·빨강 — 활동마다 AI를 써도 되는 범위</p></a>
    <a class="tile" href="course.html#rules"><span class="ic">🤝</span><h3>수업 약속</h3><p>손으로 먼저, 오류는 힌트, 기록은 내 말로</p></a>
  </div>
</section>

<section class="sec" id="tools">
  <div class="sec-h"><h2>수업 도구</h2></div>
  <div class="tiles">
%s
  </div>
</section>
</main>
""" % (COURSE["school"], TERM, COURSE["title"], COURSE["textbook"], TERM, len(UNIT_NS), n_labs, len(QUIZ),
       PZ, "\n".join(cards), TERM, "".join(cols),
       "\n".join('    <a class="tile" href="%s.html"><span class="ic">%s</span><h3>%s</h3><p>%s</p></a>' % (k, i, n, d) for k, n, i, d in TOOLS if k != "course"))
    return page("정보과학 · %s" % COURSE["school"], "%s 수업 사이트 — 단원별 본문, 실습, 용어, 퀴즈." % COURSE["textbook"], "home", "home", body)

# ---------- 도구 페이지 ----------
def pagehead(key, inner):
    name = TOOL[key][0]
    return ('<header class="pagehead"><div class="pagehead-in"><p class="crumbs"><a href="index.html">수업 홈</a> / %s</p>%s</div></header>\n'
            % (name, inner))

def grade_table(st):
    # src/js/tools.js 의 gradeTable()과 같은 표. JS가 최신 settings.json으로 다시 그린다.
    rows = []
    for i, g in enumerate(st["grading"]):
        what = esc(g["what"]) + (' (<a href="course.html#rubric-%d">채점 기준</a>)' % (i + 1) if g.get("rubric") else "")
        rows.append('<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td class="num">%s%%</td></tr>'
                    % (esc(g["type"]), esc(g["name"]), what, esc(g["when"]), g["ratio"]))
    return ('<div class="tablewrap"><table class="gradetbl"><thead><tr><th>구분</th><th>평가</th><th>무엇을 보나요</th><th>시기</th><th>반영 비율</th></tr></thead><tbody>'
            + "".join(rows) + '</tbody><tfoot><tr><td colspan="4">합계</td><td class="num"><b>%d%%</b></td></tr></tfoot></table></div>'
            % sum(g["ratio"] for g in st["grading"]))

def rubric_table(rb):
    # src/js/tools.js 의 rubricTable()과 같은 표. 첫 열에서 위와 같은 칸은 합쳐 보인다.
    def cell(t): return esc(str(t)).replace("\n", "<br>")
    rows, i = [], 0
    while i < len(rb["rows"]):
        r = rb["rows"][i]
        span = 1
        while i + span < len(rb["rows"]) and rb["rows"][i + span][0] == r[0]:
            span += 1
        tds = ['<td rowspan="%d">%s</td>' % (span, cell(r[0])) if span > 1 else "<td>%s</td>" % cell(r[0])] + ["<td>%s</td>" % cell(x) for x in r[1:]]
        rows.append("<tr>%s</tr>" % "".join(tds))
        for r2 in rb["rows"][i + 1:i + span]:
            rows.append('<tr class="rb-cont">%s</tr>' % "".join("<td>%s</td>" % cell(x) for x in r2[1:]))
        i += span
    return ('<div class="tablewrap"><table class="rubric"><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>'
            % ("".join("<th>%s</th>" % cell(h) for h in rb["head"]), "".join(rows)))

def rubrics_html(st):
    out = []
    for i, g in enumerate(st["grading"]):
        if g.get("rubric"):
            out.append('<h3 id="rubric-%d">%s</h3>%s' % (i + 1, esc(g["name"]), rubric_table(g["rubric"])))
    return "".join(out) or '<p class="muted">채점 기준표가 아직 없어요.</p>'

def tool_page(key):
    name, ic, desc = TOOL[key]
    body = rd("src/pages/%s.html" % key)
    m = re.search(r'<header class="xp-hero">(.*?)</header>\s*', body, re.S)
    assert m, key
    rest = body[m.end():].replace("<!--GRADE-->", grade_table(SETTINGS)).replace("<!--RUBRICS-->", rubrics_html(SETTINGS)) \
        .replace("<!--VIDEOS-->", video_rows() if key == "settings" else "") \
        .replace("<span data-grade-year>학년도</span>", "<span data-grade-year>%s학년도 %s</span>" % (SETTINGS["year"], SETTINGS["term"]))
    return page("%s · 정보과학" % name, desc, "tool tool-%s" % key, key,
                pagehead(key, m.group(1)) + '<main class="xp" id="main">\n' + rest.strip() + "\n</main>\n")

def glossary_page():
    btns = ['<button class="btn" type="button" data-gl-u="all" aria-pressed="true">전체</button>']
    for n in UNIT_NS:
        u = UNITS[n]
        btns.append('<button class="btn" type="button" data-gl-u="%d" aria-pressed="false">%s</button>'
                    % (n, ("%s %s" % (u["roman"], uname(u))) if n else u["name"]))
    inner = ('<p class="kicker">GLOSSARY</p><h1>용어 사전</h1><p class="sub">전 단원 핵심 용어 %d개입니다. 낱말이나 영어 이름으로 찾고, <b>본문 →</b>을 눌러 그 용어가 나오는 곳으로 가세요.</p>' % len(GLOSS))
    body = ('<div class="gl-tools" data-gl-tools><input type="search" data-gl-q placeholder="용어나 영어 이름으로 찾기 (예: 스택, DFS, return)" aria-label="용어 검색">'
            + "".join(btns) + '<span class="gl-count" data-gl-count role="status" aria-live="polite"></span></div>\n'
            + '<dl class="gl-list" data-gl-list>\n' + gloss_html(GLOSS, True) + '\n</dl>\n<p class="muted" data-gl-empty hidden>찾는 용어가 없어요. 다른 낱말로 검색해 보세요.</p>\n')
    return page("용어 사전 · 정보과학", TOOL["glossary"][2], "tool tool-glossary", "glossary",
                pagehead("glossary", inner) + '<main class="xp" id="main">\n' + body + "</main>\n")


# ---------- 차시(1~48) ----------
# src/data/lessons.json: 차시마다 단원 본문의 어느 부분을 가져올지. src/lessons/LNN.json: 차시 목표·코드 설명·빈칸·실습·확인 문제.
sys.path.insert(0, P("tools"))
import lessonlib
LESSONS = json.loads(rd("src/data/lessons.json"))
LMAP = {int(k): v for k, v in LESSONS["map"].items()}
LTITLE = {}
for w in COURSE["weeks"]:
    for i, l in enumerate(w["lessons"]):
        LTITLE[(w["week"] - 1) * 3 + i + 1] = (w["week"], l)
NL = len(LMAP)
RAW_TOPICS = {}
for n in UNIT_NS:
    RAW_TOPICS.update(lessonlib.topic_bodies(rd("src/units/unit%d.html" % n)))

def ldata(k):
    p = P("src/lessons/L%02d.json" % k)
    return json.loads(rd("src/lessons/L%02d.json" % k)) if os.path.exists(p) else {}

def lunit(k):
    wk = LTITLE[k][0]
    for n in UNIT_NS:
        if n and UNITS[n]["weeks"][0] <= wk <= UNITS[n]["weeks"][1]:
            return n
    return 1

def lfile(k): return "lesson%02d.html" % k

def first_lesson(n):
    """단원 n의 첫 차시 번호(1차시 오리엔테이션은 빼고). 차시가 없는 단원(0)은 None."""
    for k in range(2, NL + 1):
        if lunit(k) == n:
            return k
    return None

def unit_entry(n):
    """단원 메뉴가 가리키는 곳: 첫 차시 페이지(없으면 단원 전체 페이지)."""
    k = first_lesson(n) if n else None
    return lfile(k) if k else "unit%d.html" % n

def ltitle(k): return re.sub(r"<[^>]+>", "", LTITLE[k][1])

def src_label(ref):
    tid = re.match(r"t\d-\d+", ref).group(0)
    h3 = RAW_TOPICS[tid][0]
    idx = re.search(r'<span class="idx">(.*?)</span>', h3)
    name = re.sub(r"<[^>]+>", "", re.sub(r'<span class="(?:lesson|idx)">.*?</span>', "", h3)).strip()
    n = int(tid[1])
    return '<a href="unit%d.html#%s">%s %s %s</a>' % (n, tid, UNITS[n]["roman"] if n else "", idx.group(1) if idx else "", name)

def apply_blanks(html_pre, blanks):
    """교과서 코드의 핵심 부분을 입력 칸으로 바꾼다. 실행기는 칸에 쓴 값으로 코드를 만든다."""
    m = re.match(r"(<pre[^>]*>)(.*)(</pre>)$", html_pre, re.S)
    open_tag, inner, close = m.groups()
    lines = inner.split("\n")
    for ln, frag in blanks:
        f = esc(frag)
        if 1 <= ln <= len(lines) and f in lines[ln - 1]:
            w = max(3, len(frag) + 1)
            lines[ln - 1] = lines[ln - 1].replace(
                f, '<input class="blank" data-ans="%s" size="%d" spellcheck="false" autocomplete="off" aria-label="빈칸">' % (esc(frag).replace('"', "&quot;"), w), 1)
    open_tag = open_tag.replace(" data-editable", "") + ""
    open_tag = open_tag[:-1] + " data-blanks>"
    return open_tag + "\n".join(lines) + close

def lesson_content(k, d):
    secs, last = [], None
    for ref in LMAP[k]:
        tid = re.match(r"t\d-\d+", ref).group(0)
        h = lessonlib.section(RAW_TOPICS, ref)
        if tid != last:
            secs.append('<p class="lsrc">교과서 · %s</p>' % src_label(ref))
            last = tid
        secs.append(h)
    body = "\n".join(secs)
    body, _ = mark_editable_drill(body)
    body, _ = mark_runnable(body)
    body = mark_quiz_blank(body)
    notes = d.get("code_notes", {})
    cnt = [0]
    def number(m):
        cnt[0] += 1
        pre = m.group(0)
        pre = pre.replace("<pre", '<pre data-c="%d"' % cnt[0], 1)
        bl = notes.get("C%d" % cnt[0], {}).get("blanks")
        before = body[:m.start()]
        if bl and before.count("<details") > before.count("</details>"):
            print("  · L%02d C%d: 풀이(details) 안의 코드라 빈칸을 건너뜀" % (k, cnt[0]))
            bl = None
        return apply_blanks(pre, bl) if bl else pre
    return re.sub(r"<pre[ >].*?</pre>", number, body, flags=re.S)

def task_html(k, i, t):
    kind = t.get("kind", "실습")
    head = '<div class="task" data-kind="%s"><div class="task-h"><span class="task-k">%s</span><h4>%s</h4></div><p>%s</p>' % (
        esc(kind), esc(kind), esc(t.get("title", "")), t.get("prompt", ""))
    if kind == "생각":
        return head + ('<textarea class="think" data-think="L%02d.%d" rows="4" placeholder="%s"></textarea><p class="muted small" data-think-saved></p></div>'
                       % (k, i, esc(t.get("placeholder", "여기에 써 보세요")).replace('"', "&quot;")))
    return head + ('<pre data-run data-editable data-task data-expect="%s">%s</pre>'
                   '<details class="hintbox"><summary>힌트</summary><p>%s</p></details>'
                   '<details class="hintbox"><summary>정답 코드 보기</summary><pre>%s</pre></details></div>'
                   % (esc(t.get("expect", "")).replace('"', "&quot;").replace("\n", "&#10;"), esc(t.get("starter", "")),
                      t.get("hint", ""), esc(t.get("answer", ""))))

def check_html(k, d):
    qs = d.get("check", [])
    if not qs:
        return ""
    out = ['<section class="qz-set" data-qz-set="L%02d">' % k]
    for i, q in enumerate(qs):
        out.append('<div class="qz" data-ans="%d"><h4><span class="qnum">Q%d</span><span>%s</span></h4><ol class="opts">%s</ol><p class="why"><b>해설</b> — %s</p></div>'
                   % (q["answer"], i + 1, q["q"], "".join('<li><button type="button" data-n="%s">%s</button></li>' % ("①②③④"[j], o) for j, o in enumerate(q["options"])), q["why"]))
    out.append('<div class="qz-score" data-qz-score><span>맞힌 문제 <b data-qz-right>0</b> / %d</span><span class="muted" data-qz-left></span><span class="muted" data-qz-best></span>'
               '<button class="btn" type="button" data-qz-reset>다시 풀기</button></div></section>' % len(qs))
    return "\n".join(out)

def board_html(slot, label):
    # 교사 설정에 Apps Script 주소가 있을 때만 JS가 보여 준다
    return ('<div class="board" data-board="%s" hidden><div class="board-in"><textarea data-board-in rows="2" maxlength="300" placeholder="%s"></textarea>'
            '<div class="board-bar"><button class="btn btn-p" type="button" data-board-send>보드에 올리기</button>'
            '<select data-board-class aria-label="반 고르기"><option value="">모든 반</option></select>'
            '<button class="btn" type="button" data-board-big>크게 보기</button><span class="muted small" data-board-msg></span></div></div>'
            '<div class="board-h"><b>모두의 생각</b> <span class="muted small" data-board-count></span></div>'
            '<ul class="board-list" data-board-list></ul></div>' % (slot, label))

def lesson_page(k):
    d = ldata(k)
    wk, _ = LTITLE[k]
    n = lunit(k) if k > 1 else 0
    u = UNITS[n]
    title = ltitle(k)
    sims = [LESSONS["sims"][s] for s in LESSONS.get("lesson_sims", {}).get(str(k), [])]
    goal = "".join("<li>%s</li>" % g for g in d.get("goal", []))
    hero = """<section class="unithero lessonhero">
  <div class="unithero-in">
    <p class="crumbs"><a href="index.html">수업 홈</a> / <a href="lessons.html">차시 수업</a> / %d차시</p>
    <div class="bigr" aria-hidden="true">%d</div>
    <div>
      <p class="kicker">%d차시 · %d주차 · <a href="unit%d.html">%s %s 차시 목록</a></p>
      <h1>%s</h1>
      %s
      <div class="lprog" aria-label="전체 %d차시 중 %d차시"><i style="width:%.1f%%"></i></div>
    </div>
  </div>
</section>
""" % (k, k, k, wk, n, u["roman"] if n else "", u["name"], title,
       ('<ul class="lgoal">%s</ul>' % goal) if goal else "", NL, k, k / NL * 100)
    steps = [("l-open", "생각 열기"), ("l-learn", "교과서로 배우기")]
    if d.get("tasks"): steps.append(("l-try", "직접 해 보기"))
    if d.get("check"): steps.append(("l-check", "확인 문제"))
    steps.append(("l-wrap", "한 줄 정리"))
    flow = '<nav class="lflow" aria-label="이 차시 순서">%s</nav>' % "".join(
        '<a href="#%s"><b>%d</b>%s</a>' % (a, i + 1, t) for i, (a, t) in enumerate(steps))
    parts = [flow]
    parts.append('<section class="lsec" id="l-open"><h2><span class="ln">1</span>생각 열기</h2><div class="callout hook">%s</div><div class="lvideo" data-video="%d" hidden></div>%s%s</section>'
                 % (d.get("hook", "오늘 배울 내용을 떠올려 보세요."), k, board_html("hook", "내 생각을 짧게 적어 보드에 올려 보세요"),
                    '<div class="simlinks" data-sims="%d"%s><b>함께 보는 시뮬레이터</b>%s</div>' % (k, "" if sims else " hidden", "".join(
                        '<a href="%s%s" target="_blank" rel="noopener">%s ↗</a>' % (LESSONS["sims_base"], s[0], s[1]) for s in sims))))
    parts.append('<section class="lsec" id="l-learn"><h2><span class="ln">2</span>교과서로 배우기</h2>'
                 '<p class="lede">코드 아래 <b>💡 코드 설명</b>을 펼쳐 보고, <b>빈칸</b>이 있으면 채운 뒤 실행해 보세요.</p>%s</section>'
                 % lesson_content(k, d))
    num = 3
    if d.get("tasks"):
        parts.append('<section class="lsec" id="l-try"><h2><span class="ln">%d</span>직접 해 보기</h2>'
                     '<p class="lede">코드를 고쳐서 <b>▶ 실행</b>하면 출력이 맞는지 바로 알려 줘요. 막히면 힌트부터 열어 보세요.</p>%s</section>'
                     % (num, "".join(task_html(k, i, t) for i, t in enumerate(d["tasks"]))))
        num += 1
    if d.get("check"):
        parts.append('<section class="lsec" id="l-check"><h2><span class="ln">%d</span>확인 문제</h2>%s</section>' % (num, check_html(k, d)))
        num += 1
    parts.append('<section class="lsec" id="l-wrap"><h2><span class="ln">%d</span>한 줄 정리</h2><p><b>%s</b></p>'
                 '<textarea class="think" data-think="L%02d.exit" rows="3" placeholder="내 말로 한두 문장"></textarea><p class="muted small" data-think-saved></p>'
                 '%s<div class="donebar"><button class="btn donebtn" type="button" data-lesson-done="%d">☐ 이 차시 마쳤어요</button><span>체크하면 <a href="lessons.html">차시 수업</a> 목록에 표시돼요.</span></div>'
                 '<div class="submitbox" data-submit hidden><button class="btn btn-p" type="button">선생님께 제출</button> <span class="muted small" data-submit-msg>한 줄 정리 · 생각 쓰기 · 실습 코드 · 확인 문제 점수를 보내요.</span></div></section>'
                 % (num, d.get("exit", "오늘 배운 것을 한 문장으로 정리해 보세요."), k, board_html("exit", "한 줄 정리를 보드에도 올려 보세요"), k))
    def plink(cls, dr, j):
        if j < 1 or j > NL:
            return '<a class="%s" href="lessons.html"><span class="dir">%s</span><span class="ttl">차시 목록</span></a>' % (cls, dr)
        return '<a class="%s" href="%s"><span class="dir">%s · %d차시</span><span class="ttl">%s</span></a>' % (cls, lfile(j), dr, j, ltitle(j))
    pager = '<nav class="pager" aria-label="차시 이동">%s%s</nav>\n' % (plink("prev", "← 이전", k - 1), plink("next", "다음 →", k + 1))
    data = '<script>window.LESSON=%s;</script>\n' % json.dumps({"n": k, "notes": d.get("code_notes", {})}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    def tnav(cls, arrow, j):
        if j < 1 or j > NL:
            return '<a class="tnav %s" href="lessons.html"><span>%s 차시 목록</span></a>' % (cls, arrow)
        return '<a class="tnav %s" href="%s"><span>%s %s 차시 · %d차시</span><b>%s</b></a>' % (
            cls, lfile(j), arrow, "이전" if cls == "prev" else "다음", j, ltitle(j))
    tlist = "".join(
        '<details%s><summary>%s %s</summary><ol>%s</ol></details>' % (
            " open" if un == n else "", UNITS[un]["roman"], UNITS[un]["name"],
            "".join('<li><a href="%s" data-lesson="%d"%s><em>%d</em>%s</a></li>' % (
                lfile(j), j, ' class="is-cur" aria-current="page"' if j == k else "", j, ltitle(j))
                for j in range(1, NL + 1) if lunit(j) == un))
        for un in UNIT_NS if un)
    toc = ('<aside class="toc ltoc" aria-label="이 차시 순서">%s<div class="toc-title"><span>지금 · %d차시</span>%s</div>'
           '<nav id="toc-nav"><ol>%s</ol></nav>%s'
           '<details class="tlist"><summary>차시 목록 펼치기</summary>%s</details></aside>'
           % (tnav("prev", "↑", k - 1), k, title,
              "".join('<li><a href="#%s" data-level="0"><em>%d</em>%s</a></li>' % (a, i + 1, t) for i, (a, t) in enumerate(steps)),
              tnav("next", "↓", k + 1), tlist))
    body = (hero + '<div class="wrap lwrap">\n' + toc + '\n<main class="lpage" id="main">\n' + "\n".join(parts)
            + "\n</main>\n</div>\n" + pager + data)
    out = page("%d차시 %s · 정보과학" % (k, title), "%d주차 %d차시 — %s" % (wk, k, title), "lessonpage " + ucls(n), "lessons", body)
    if n:
        out = out.replace('class="unittab %s"' % ucls(n), 'class="unittab %s is-current"' % ucls(n), 1)
    return out

def video_rows():
    """교사 설정: 차시별 생각 열기 영상 표. 값은 JS가 settings.json의 videos로 채운다."""
    out = []
    for n in UNIT_NS:
        if not n: continue
        out.append('<tr class="vgrp"><th colspan="4">%s %s</th></tr>' % (UNITS[n]["roman"], UNITS[n]["name"]))
        for k in range(1, NL + 1):
            if lunit(k) != n: continue
            out.append('<tr data-vk="%d"><td class="num">%d</td><td>%s<small data-vtitle></small></td>'
                       '<td><input data-vurl type="text" inputmode="url" spellcheck="false" aria-label="%d차시 영상 주소" placeholder="유튜브 주소 (비우면 영상 없음)"></td>'
                       '<td><textarea data-sims-in rows="2" spellcheck="false" aria-label="%d차시 시뮬레이터" placeholder="이름 | https://주소"></textarea></td></tr>'
                       % (k, k, ltitle(k), k, k))
    return "\n".join(out)

def lessons_index():
    cols = []
    for n in UNIT_NS:
        if not n: continue
        u = UNITS[n]
        rows = []
        for k in range(1, NL + 1):
            if lunit(k) != n: continue
            rows.append('<a class="lrow" href="%s" data-lesson="%d"><span class="lk">%d</span><span class="lt">%s</span><span class="lw">%d주</span></a>'
                        % (lfile(k), k, k, ltitle(k), LTITLE[k][0]))
        cols.append('<section class="lcol %s" id="lu-%d"><h3>%s %s<span>%s</span></h3>%s</section>'
                    % (ucls(n), n, u["roman"], u["name"], wklabel(u), "".join(rows)))
    inner = ('<p class="kicker">LESSONS</p><h1>차시 수업</h1><p class="sub">한 차시(50분)씩 진행해요. 차시마다 <b>목표 → 교과서 → 빈칸 코드·실습 → 확인 문제 → 한 줄 정리</b> 순서예요. '
             '마친 차시에는 ✓가 붙어요.</p>')
    body = '<div class="lnow" data-lnow hidden></div><div class="lcols">%s</div>' % "".join(cols)
    return page("차시 수업 · 정보과학", TOOL["lessons"][2], "tool tool-lessons", "lessons",
                pagehead("lessons", inner) + '<main class="xp" id="main">\n' + body + "</main>\n")

# ---------- 차시로만 보기 ----------
# 학생 화면은 차시 수업으로만 이어지게, 단원 페이지(I~IV)로 가는 링크를 그 내용을 다루는 차시로 바꾼다.
# 단원 페이지 파일은 그대로 만들어 두되(주소로는 열림) 메뉴·홈·용어 사전에서는 연결하지 않는다. 0단원은 차시가 없어 그대로.
TOPIC_LESSON = {}
for _k in range(1, NL + 1):
    for _r in LMAP[_k]:
        TOPIC_LESSON.setdefault(re.match(r"t\d-\d+", _r).group(0), _k)
def to_lessons(html):
    def sub(m):
        n, frag = int(m.group(1)), m.group(2) or ""
        if n == 0: return m.group(0)
        t = re.match(r"#(t\d-\d+)$", frag)
        if t and t.group(1) in TOPIC_LESSON:
            return 'href="%s"' % lfile(TOPIC_LESSON[t.group(1)])
        return 'href="lessons.html#lu-%d"' % n
    return re.sub(r'href="unit(\d)\.html(#[^"]*)?"', sub, html)
_wr = wr
def wr(p, s):
    _wr(p, s if re.match(r"unit\d\.html$", p) or not p.endswith(".html") else to_lessons(s))

# ---------- 출력 ----------
CSS = ["base.css", "content.css", "tools.css"]
JS = ["widgets.js", "tools.js"]
wr("assets/site.css", "\n".join(rd("src/css/" + f) for f in CSS))
wr("assets/site.js", "\n".join(rd("src/js/" + f) for f in JS))
wr("index.html", home())
for n in UNIT_NS:
    wr("unit%d.html" % n, unit_page(n))
for k, n, i, d in TOOLS:
    if k == "glossary":
        wr("glossary.html", glossary_page())
    elif k == "lessons":
        wr("lessons.html", lessons_index())
    else:
        wr("%s.html" % k, tool_page(k))
wr("settings.html", tool_page("settings"))
for k in range(1, NL + 1):
    wr(lfile(k), lesson_page(k))

# ---------- 한 줄씩 보기 자료 ----------
sys.path.insert(0, P("tools"))
import tracegen
_tr_pages = ["unit%d.html" % n for n in UNIT_NS] + [lfile(k) for k in range(1, NL + 1)]
_tr_ok, _tr_try = tracegen.run(ROOT, _tr_pages)
print("한 줄씩 보기: %d개 코드 블록 (시도 %d개)" % (_tr_ok, _tr_try))

print("built: index.html, %s, %s" % (", ".join("unit%d.html" % n for n in UNIT_NS), ", ".join(k + ".html" for k, *_ in TOOLS)))
print("실행 가능한 코드 블록(단원 본문):", _run_total, "개 · 용어", len(GLOSS), "개 · 퀴즈", len(QUIZ), "문제")
