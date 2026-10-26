"""'한 줄씩 보기' 자료 만들기 (build.py 가 페이지를 다 쓴 뒤 부른다).

단원·차시 페이지의 실행 가능한 코드 블록(<pre data-run>)을 실제로 한 줄씩 실행하며
줄마다 변수 값·출력·함수 호출을 기록해 assets/trace/<해시>.json 으로 저장하고,
그 코드 블록에 data-tr="<해시>" 를 붙인다. 화면에서는 실행기의 '한 줄씩 보기' 버튼이 이 파일을 읽는다.

빼는 것: 입력(input)이 필요한 코드, 학생이 채울 빈칸·과제 코드, 스택·큐 소단원(t2-1, t2-2) 코드,
실행 중 오류가 나거나 300단계가 넘는 코드.
"""
import ast, contextlib, hashlib, html, io, json, os, re, signal, sys, types

MAX_STEPS = 300
SKIP_TOPICS = ('t2-1', 't2-2')          # 스택 · 큐는 그대로 둔다


class _Stop(Exception):
    pass


def _short(v):
    if isinstance(v, str):
        r = repr(v)
    elif isinstance(v, (int, float, bool)) or v is None:
        r = repr(v)
    elif isinstance(v, (list, tuple, set, dict)):
        r = repr(v)
    elif hasattr(v, '__dict__') and not isinstance(v, (type, types.ModuleType, types.FunctionType)):
        r = '%s(%s)' % (type(v).__name__, ', '.join('%s=%s' % (k, repr(x)[:20]) for k, x in vars(v).items()))
    else:
        return None
    return r if len(r) <= 60 else r[:57] + '…'


def _names(code):
    """전역 변수 표에 보일 이름: 함수·클래스 본문 밖(맨 바깥)에서 쓰거나 만드는 이름, 그리고 global 선언."""
    out = set()

    def walk(node, top):
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
            if top:
                out.add(node.name)
            for ch in ast.iter_child_nodes(node):
                walk(ch, False)
            return
        if isinstance(node, ast.Global):
            out.update(node.names)
        if top and isinstance(node, ast.Name):
            out.add(node.id)
        for ch in ast.iter_child_nodes(node):
            walk(ch, top)
    walk(ast.parse(code), True)
    return out


def _alarm(*a):
    raise _Stop('timeout')


def _assigned(code):
    """코드 맨 바깥에서 새로 만드는 이름(앞 블록에서 남은 같은 이름을 지워 '새로 저장됨'이 보이게)."""
    out = set()
    for node in ast.parse(code).body:
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
            out.add(node.name)
        elif isinstance(node, (ast.Assign, ast.For)):
            tg = node.targets if isinstance(node, ast.Assign) else [node.target]
            for t in tg:
                for n in ast.walk(t):
                    if isinstance(n, ast.Name):
                        out.add(n.id)
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            for a in node.names:
                out.add((a.asname or a.name).split('.')[0])
    return out


def trace(code, g):
    names = _names(code)
    for k in _assigned(code):
        g.pop(k, None)
    lines = code.split('\n')
    steps, out = [], io.StringIO()

    def frames_of(frame):
        st, f = [], frame
        while f is not None and f.f_code.co_filename == '<trace>':
            st.append(f)
            f = f.f_back
        return list(reversed(st))

    def snap(frame, line, kind, ret=None):
        stack = []
        for f in frames_of(frame):
            nm = f.f_code.co_name
            if nm.startswith('<') and nm != '<module>':
                continue                                   # 리스트 내포 등은 따로 보이지 않게
            top = nm == '<module>'
            d = f.f_globals if top else f.f_locals
            vs = []
            for k, v in d.items():
                if k.startswith('__') or (top and k not in names):
                    continue
                if isinstance(v, types.FunctionType):
                    s = '함수' if v.__code__.co_filename == '<trace>' else None
                elif isinstance(v, type):
                    s = '클래스' if getattr(v, '__module__', '') == '__main__' else None
                else:
                    s = _short(v)
                if s is not None:
                    vs.append([k, s])
            stack.append(['전역' if top else nm + '()', vs])
        st = {'l': line, 'k': kind, 's': stack, 'o': out.getvalue()}
        if ret is not None:
            st['r'] = ret
        steps.append(st)
        if len(steps) > MAX_STEPS:
            raise _Stop('too long')

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != '<trace>':
            return None
        nm = frame.f_code.co_name
        if nm.startswith('<') and nm != '<module>':
            return tracer
        if event == 'line':
            snap(frame, frame.f_lineno, 'line')
        elif event == 'return' and nm != '<module>':
            snap(frame, frame.f_lineno, 'ret', _short(arg) or repr(arg)[:60])
        return tracer

    g['input'] = lambda *a: (_ for _ in ()).throw(_Stop('input'))
    with contextlib.redirect_stdout(out):
        old = signal.signal(signal.SIGALRM, _alarm)
        signal.alarm(5)
        sys.settrace(tracer)
        try:
            exec(compile(code, '<trace>', 'exec'), g)
        finally:
            sys.settrace(None)
            signal.alarm(0)
            signal.signal(signal.SIGALRM, old)
    if not steps:
        raise _Stop('empty')
    steps.append({'l': 0, 'k': 'end', 's': steps[-1]['s'], 'o': out.getvalue()})
    steps = _squash(steps, lines)
    _notes(steps, lines)
    return {'code': lines, 'notes': {}, 'steps': steps}


def _flat(st):
    d = {}
    for i, (fr, vs) in enumerate(st['s']):
        for k, v in vs:
            d[(i, fr, k)] = v
    return d


CTRL = re.compile(r'(if|elif|else|while|for|return|def|class|import|from|try|except|break|continue)\b')


def _squash(steps, lines):
    """여러 줄에 걸친 한 문장(긴 사전·리스트 등)에서 아무것도 바뀌지 않는 중간 단계는 뺀다."""
    keep = []
    for st in steps:
        if keep and st['k'] == 'line' and keep[-1]['k'] == 'line' and st['s'] == keep[-1]['s'] and st['o'] == keep[-1]['o']:
            src = lines[keep[-1]['l'] - 1].strip() if 0 < keep[-1]['l'] <= len(lines) else ''
            if not CTRL.match(src) and len(st['s']) == len(keep[-1]['s']):
                keep[-1] = st
                continue
        keep.append(st)
    return keep


def _notes(steps, lines):
    """줄마다 '방금 실행한 줄이 무엇을 바꿨는지'를 문장으로 적는다."""
    for i, st in enumerate(steps):
        if i == 0:
            st['n'] = '프로그램을 시작해요. 위에서부터 한 줄씩 실행해요.'
            continue
        pv = steps[i - 1]
        if st['k'] == 'ret':
            continue
        msgs = []
        a, b = _flat(pv), _flat(st)
        if len(st['s']) > len(pv['s']):
            fr = st['s'][-1]
            args = ', '.join('%s=%s' % (k, v) for k, v in fr[1][:4])
            msgs.append('%s 함수를 불렀어요%s.' % (fr[0], ' (' + args + ')' if args else ''))
        elif pv['k'] == 'ret':
            msgs.append('%s가 돌려준 %s을(를) 받아 계속해요.' % (pv['s'][-1][0], pv.get('r', '')))
        else:
            for key, v in b.items():
                if key[0] >= len(pv['s']):
                    continue
                if key not in a:
                    if v == '함수':
                        msgs.append('%s 함수를 정의했어요(아직 실행되지는 않아요).' % key[2])
                    elif v == '클래스':
                        msgs.append('%s 클래스를 정의했어요.' % key[2])
                    else:
                        msgs.append('%s에 %s이(가) 저장됐어요.' % (key[2], v))
                elif a[key] != v:
                    msgs.append('%s: %s → %s' % (key[2], a[key], v))
        new_out = st['o'][len(pv['o']):]
        if new_out.strip():
            shown = new_out.rstrip('\n').replace('\n', ' / ')
            msgs.append('화면에 출력: ' + (shown if len(shown) <= 60 else shown[:57] + '…'))
        if not msgs and pv['l']:
            src = lines[pv['l'] - 1].strip() if pv['l'] - 1 < len(lines) else ''
            if re.match(r'(if|elif|while)\b', src):
                msgs.append('조건을 확인했어요.')
            elif re.match(r'for\b', src):
                msgs.append('반복을 이어 가요.')
            elif src.startswith('else'):
                msgs.append('앞의 조건이 거짓이라 else 쪽으로 왔어요.')
            elif src.startswith(('import', 'from')):
                msgs.append('모듈을 불러왔어요.')
            elif src.startswith('return'):
                msgs.append('값을 돌려줘요.')
            else:
                msgs.append('바뀐 값은 없어요.')
        head = '%d번 줄 실행 → ' % pv['l'] if pv['l'] and pv['k'] == 'line' else ''
        st['n'] = head + ' '.join(msgs[:4])
        if st['k'] == 'end':
            st['n'] += ' 프로그램이 끝났어요.'


def _code_of(pre_inner):
    return html.unescape(re.sub(r'<[^>]+>', '', pre_inner))


def run(root, pages):
    outdir = os.path.join(root, 'assets', 'trace')
    os.makedirs(outdir, exist_ok=True)
    for f in os.listdir(outdir):
        if f.endswith('.json'):
            os.remove(os.path.join(outdir, f))

    skip = set()
    u2 = open(os.path.join(root, 'src', 'units', 'unit2.html'), encoding='utf-8').read()
    for tid in SKIP_TOPICS:
        m = re.search(r'<article class="topic" id="%s">.*?</article>' % tid, u2, re.S)
        for pm in re.finditer(r'<pre>(.*?)</pre>', m.group(0), re.S):
            skip.add(_code_of(pm.group(1)).strip())

    made, tried = {}, 0
    for page in pages:
        path = os.path.join(root, page)
        s = open(path, encoding='utf-8').read()
        g = {'__name__': '__main__'}
        parts = re.split(r'(<pre [^>]*data-run[^>]*>.*?</pre>)', s, flags=re.S)
        for i, part in enumerate(parts):
            m = re.match(r'<pre ([^>]*data-run[^>]*)>(.*?)</pre>$', part, re.S)
            if not m:
                continue
            attrs, inner = m.group(1), m.group(2)
            blanks = 'data-blanks' in attrs
            if blanks:   # 차시 빈칸 코드: 빈칸에 정답을 넣은 원래 코드로 단원 페이지의 자료를 찾는다
                inner_full = re.sub(r'<input[^>]*data-ans="([^"]*)"[^>]*>', lambda mm: mm.group(1), inner)
                code = _code_of(inner_full)
            else:
                code = _code_of(inner)
            ok = not blanks and not re.search(r'data-task|data-blank\b|data-needs-stdin', attrs) \
                and 'input(' not in code and code.strip() not in skip and '____' not in code
            key = hashlib.sha1(code.encode('utf-8')).hexdigest()[:12]
            if ok and key not in made:
                tried += 1
                try:
                    data = trace(code, g)
                    open(os.path.join(outdir, key + '.json'), 'w', encoding='utf-8').write(
                        json.dumps(data, ensure_ascii=False, separators=(',', ':')))
                    made[key] = True
                except BaseException:
                    made[key] = False
                    try:                                # 다음 블록을 위해 정의만이라도 남긴다
                        with contextlib.redirect_stdout(io.StringIO()):
                            signal.signal(signal.SIGALRM, _alarm); signal.alarm(3)
                            exec(compile(code, '<prev>', 'exec'), g)
                    except BaseException:
                        pass
                    finally:
                        signal.alarm(0)
            elif not ok and not blanks:
                try:
                    g['input'] = lambda *a: ''
                    with contextlib.redirect_stdout(io.StringIO()):
                        signal.signal(signal.SIGALRM, _alarm); signal.alarm(3)
                        exec(compile(code, '<prev>', 'exec'), g)
                except BaseException:
                    pass
                finally:
                    signal.alarm(0)
            if made.get(key):
                parts[i] = '<pre ' + attrs + ' data-tr="%s">' % key + inner + '</pre>'
        new = ''.join(parts)
        if new != s:
            open(path, 'w', encoding='utf-8', newline='\n').write(new)
    good = sum(1 for v in made.values() if v)
    return good, tried
