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
import io, os, re, json, html

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

# 도구 페이지: (파일 이름, 이름, 아이콘, 설명)
TOOLS = [
    ("course",   "수업 안내",   "📋", "평가 · 프로젝트 채점 기준 · 수업 약속 · AI 사용 신호등"),
    ("labs",     "실습실",      "🧪", "그래프 탐색 · 이진 탐색 트리 · 정렬 경주 등 직접 조작하는 시뮬레이터"),
    ("practice", "파이썬 실습", "🐍", "단원별 실습 세트를 Programiz로 실행 · 자주 나는 오류 해결표"),
    ("glossary", "용어 사전",   "📖", "전 단원 핵심 용어를 검색하고 본문으로 바로 가기"),
    ("my",       "내 학습",     "✅", "해 봤어요 진도 · 퀴즈 점수 · 정리 노트 · txt 내보내기"),
]
TOOL = {k: (n, i, d) for k, n, i, d in TOOLS}

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
    return ('<div class="wk" data-week="%d"><span class="n">%d주</span><ol>%s</ol></div>'
            % (w["week"], w["week"], "".join("<li>%s</li>" % l for l in w["lessons"])))

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
        tabs.append('    <a class="unittab %s%s" href="unit%d.html"><span class="r">%s</span><span class="nm">%s</span><span class="uw">%s</span></a>'
                    % (ucls(n), " is-current" if n == current else "", n, u["roman"], uname(u), wklabel(u)))
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
      <p><b>%s</b> — %s 수업 자료 · %s</p>
      <p>%s <b>%s</b> 선생님 제작.</p>
      <p>개념·예제 코드·수치는 교과서 본문을 근거로 정리했으며, 그림은 이해를 돕기 위해 새로 그렸습니다. 자세한 예제와 ‘스스로 해결하기’ 활동은 교과서를 함께 보세요.</p>
      <p class="copyright">본 자료는 학교 수업 목적으로 제작되었으며, 저작권법에 의해 무단 전재 및 배포를 금합니다.</p>
    </div>
    <nav class="foot-links" aria-label="사이트 전체">%s</nav>
  </div>
</footer>
""" % (COURSE["title"], COURSE["textbook"], COURSE["term"], COURSE["school"], COURSE["teacher"], "".join(links))

SITE_DATA = {
    "topics": {str(n): [t[0] for t in topics(n)] for n in UNIT_NS},
    "units": {str(n): {"roman": UNITS[n]["roman"], "name": UNITS[n]["name"], "weeks": UNITS[n]["weeks"] if n else None} for n in UNIT_NS},
    "quiz": {str(n): sum(1 for q in QUIZ if q["unit"] == n) for n in UNIT_NS},
    "weeks": COURSE["weeks"],
    "start": COURSE.get("semester_start"),
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
    </div>
  </div>
</section>
""" % (label, u["roman"], "UNIT %s" % u["roman"] if n else "BEFORE UNIT Ⅰ", u["name"], u["goal"], "".join(chips))
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
        cards.append("""  <a class="unitcard %s" href="unit%d.html">
    <div class="band"><span class="r">%s</span><span class="wk">%s</span></div>
    <div class="body">
      <h3>%s</h3><p>%s</p>
      <div class="stats"><span>소단원 <b>%d</b></span><span>실습 <b>%d</b></span><span>용어 <b>%d</b></span><span>퀴즈 <b>%d</b></span></div>
      <div class="ubar"><i data-uprog="%d"></i></div>
      <div class="ubar-l"><span>해 봤어요</span><span data-uprog-l="%d">0 / %d</span></div>
    </div>
  </a>""" % (ucls(n), n, u["roman"], wklabel(u), u["name"], u["summary"], len(tps), len(labs_in(n)),
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
    <a class="tile" href="course.html#rubric"><span class="ic">🧩</span><h3>프로젝트 채점 기준</h3><p>문제 해결 5단계로 보는 루브릭</p></a>
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
""" % (COURSE["school"], COURSE["term"], COURSE["title"], COURSE["textbook"], COURSE["term"], len(UNIT_NS), n_labs, len(QUIZ),
       PZ, "\n".join(cards), COURSE["term"], "".join(cols),
       "\n".join('    <a class="tile" href="%s.html"><span class="ic">%s</span><h3>%s</h3><p>%s</p></a>' % (k, i, n, d) for k, n, i, d in TOOLS if k != "course"))
    return page("정보과학 · %s" % COURSE["school"], "%s 수업 사이트 — 단원별 본문, 실습, 용어, 퀴즈." % COURSE["textbook"], "home", "home", body)

# ---------- 도구 페이지 ----------
def pagehead(key, inner):
    name = TOOL[key][0]
    return ('<header class="pagehead"><div class="pagehead-in"><p class="crumbs"><a href="index.html">수업 홈</a> / %s</p>%s</div></header>\n'
            % (name, inner))

def tool_page(key):
    name, ic, desc = TOOL[key]
    body = rd("src/pages/%s.html" % key)
    m = re.search(r'<header class="xp-hero">(.*?)</header>\s*', body, re.S)
    assert m, key
    rest = body[m.end():]
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
    else:
        wr("%s.html" % k, tool_page(k))

print("built: index.html, %s, %s" % (", ".join("unit%d.html" % n for n in UNIT_NS), ", ".join(k + ".html" for k, *_ in TOOLS)))
print("실행 가능한 코드 블록(단원 본문):", _run_total, "개 · 용어", len(GLOSS), "개 · 퀴즈", len(QUIZ), "문제")
