/* ===== 수업 도구: 해 봤어요 체크 · 용어 사전 · 퀴즈 · 내 학습 · 코랩 노트북 · 실습실 시뮬레이터 =====
   기록은 모두 이 기기의 localStorage에만 저장된다(키 앞머리 'is.'). 이 파일은 build.py가 만들지 않으므로 직접 고친다. */
(function () {
  'use strict';

  var TOPICS = {
    1: ['t1-1', 't1-2', 't1-3', 't1-4', 't1-5'],
    2: ['t2-1', 't2-2', 't2-3', 't2-4', 't2-5'],
    3: ['t3-1', 't3-2', 't3-3', 't3-4', 't3-5', 't3-6', 't3-8', 't3-7'],
    4: ['t4-1', 't4-2', 't4-3', 't4-4', 't4-6', 't4-5']
  };
  var UNIT_NAME = { 1: 'Ⅰ 프로그래밍', 2: 'Ⅱ 데이터 구조', 3: 'Ⅲ 알고리즘', 4: 'Ⅳ 정보과학 프로젝트' };
  var QUIZ_N = 10;

  function get(k, d) { try { var v = localStorage.getItem('is.' + k); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem('is.' + k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem('is.' + k); } catch (e) {} }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function doneCount(u) { return TOPICS[u].filter(function (t) { return get('done.' + t) === '1'; }).length; }
  function quizBest(u) { var v = get('quiz.u' + u, ''); return v === '' ? null : +v; }

  /* ---------- 단원 페이지: 소단원마다 '해 봤어요' ---------- */
  (function () {
    var arts = $$('main article.topic[id]');
    if (!arts.length) return;
    function mark(id, on) {
      $$('.toc a[href="#' + id + '"]').forEach(function (a) { a.classList.toggle('is-done', on); });
    }
    arts.forEach(function (art) {
      var id = art.id;
      var bar = document.createElement('div');
      bar.className = 'donebar';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn donebtn';
      var on = get('done.' + id) === '1';
      function paint() {
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.textContent = on ? '✓ 해 봤어요' : '☐ 해 봤어요';
        mark(id, on);
      }
      btn.addEventListener('click', function () {
        on = !on;
        if (on) set('done.' + id, '1'); else del('done.' + id);
        paint();
      });
      var txt = document.createElement('span');
      txt.innerHTML = '이 소단원을 다 읽고 실습해 봤다면 체크하세요. 진도는 <a href="my.html">내 학습</a>에서 볼 수 있어요.';
      bar.appendChild(btn); bar.appendChild(txt);
      art.appendChild(bar);
      paint();
    });
  })();

  /* ---------- 홈: 내 진도 한 줄 ---------- */
  (function () {
    var box = $('[data-home-progress]');
    if (!box) return;
    var any = false, parts = [];
    [1, 2, 3, 4].forEach(function (u) {
      var d = doneCount(u), q = quizBest(u);
      if (d || q !== null) any = true;
      parts.push('<span>' + UNIT_NAME[u].split(' ')[0] + ' <b>' + d + '/' + TOPICS[u].length + '</b>' +
        (q !== null ? ' · 퀴즈 ' + q + '점' : '') + '</span>');
    });
    if (!any) return;
    box.innerHTML = '<span>내 진도</span>' + parts.join('') + '<a href="my.html">자세히 →</a>';
  })();

  /* ---------- 용어 사전 ---------- */
  (function () {
    var list = $('[data-gl-list]');
    if (!list) return;
    var items = $$('.gl', list), q = $('[data-gl-q]'), count = $('[data-gl-count]'), empty = $('[data-gl-empty]');
    var unit = '0';
    function apply() {
      var s = q.value.trim().toLowerCase(), n = 0;
      items.forEach(function (it) {
        var ok = (unit === '0' || it.getAttribute('data-unit') === unit) &&
                 (!s || it.textContent.toLowerCase().indexOf(s) !== -1);
        it.hidden = !ok;
        if (ok) n++;
      });
      count.textContent = n + '개';
      empty.hidden = n !== 0;
    }
    $$('[data-gl-u]').forEach(function (b) {
      b.addEventListener('click', function () {
        unit = b.getAttribute('data-gl-u');
        $$('[data-gl-u]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        apply();
      });
    });
    q.addEventListener('input', apply);
    var h = decodeURIComponent(location.hash.slice(1));
    if (h && h.indexOf('q=') === 0) q.value = h.slice(2);
    apply();
  })();

  /* ---------- 퀴즈 ---------- */
  (function () {
    var sets = $$('[data-qz-set]');
    if (!sets.length) return;
    function show(u) {
      sets.forEach(function (s) { s.hidden = s.getAttribute('data-qz-set') !== u; });
      $$('[data-qz-tab]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-qz-tab') === u ? 'true' : 'false'); });
      set('quiz.tab', u);
    }
    $$('[data-qz-tab]').forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-qz-tab')); });
    });
    sets.forEach(function (sec) {
      var u = sec.getAttribute('data-qz-set');
      var qs = $$('.qz', sec), total = qs.length;
      var right = $('[data-qz-right]', sec), left = $('[data-qz-left]', sec), bestEl = $('[data-qz-best]', sec);
      function score() {
        var done = qs.filter(function (q) { return q.classList.contains('answered'); });
        var ok = done.filter(function (q) { return q.getAttribute('data-ok') === '1'; }).length;
        right.textContent = ok;
        left.textContent = done.length < total ? '남은 문제 ' + (total - done.length) + '개' : '다 풀었어요!';
        if (done.length === total) {
          var pts = Math.round(ok / total * 100), b = quizBest(u);
          if (b === null || pts > b) { set('quiz.u' + u, String(pts)); b = pts; }
        }
        var bb = quizBest(u);
        bestEl.textContent = bb !== null ? '최고 점수 ' + bb + '점' : '';
      }
      qs.forEach(function (q) {
        var ans = +q.getAttribute('data-ans');
        var btns = $$('.opts button', q);
        btns.forEach(function (b, i) {
          b.addEventListener('click', function () {
            if (q.classList.contains('answered')) return;
            q.classList.add('answered');
            q.setAttribute('data-ok', i === ans ? '1' : '0');
            btns.forEach(function (x, j) {
              x.disabled = true;
              if (j === ans) x.classList.add('ok');
              else if (j === i) x.classList.add('ng');
            });
            score();
          });
        });
      });
      $('[data-qz-reset]', sec).addEventListener('click', function () {
        qs.forEach(function (q) {
          q.classList.remove('answered'); q.removeAttribute('data-ok');
          $$('.opts button', q).forEach(function (x) { x.disabled = false; x.classList.remove('ok', 'ng'); });
        });
        score();
        sec.scrollIntoView();
      });
      score();
    });
    var m = location.hash.match(/^#u([1-4])$/);
    show(m ? m[1] : get('quiz.tab', '1'));
  })();

  /* ---------- 내 학습 ---------- */
  (function () {
    var doneBox = $('[data-my-done]');
    if (!doneBox) return;
    function bar(name, val, max, label) {
      var pct = max ? Math.round(val / max * 100) : 0;
      return '<div class="pbar"><span class="nm">' + name + '</span><span class="tr"><span class="fl" style="width:' + pct + '%"></span></span><span class="vl">' + label + '</span></div>';
    }
    function render() {
      doneBox.innerHTML = [1, 2, 3, 4].map(function (u) {
        var d = doneCount(u);
        return '<div class="u' + u + '">' + bar(UNIT_NAME[u], d, TOPICS[u].length, d + ' / ' + TOPICS[u].length) + '</div>';
      }).join('');
      $('[data-my-quiz]').innerHTML = [1, 2, 3, 4].map(function (u) {
        var q = quizBest(u);
        return '<div class="u' + u + '">' + bar(UNIT_NAME[u], q || 0, 100, q === null ? '안 풂' : q + '점') + '</div>';
      }).join('');
    }
    render();
    $$('[data-note]').forEach(function (ta) {
      var k = 'note.' + ta.getAttribute('data-note'), saved = ta.parentNode.querySelector('[data-saved]'), t = null;
      ta.value = get(k, '');
      ta.addEventListener('input', function () {
        set(k, ta.value);
        saved.textContent = '저장 중…';
        clearTimeout(t);
        t = setTimeout(function () { saved.textContent = '저장됨 · ' + new Date().toLocaleTimeString('ko-KR'); }, 400);
      });
    });
    var nameIn = $('[data-my-name]');
    nameIn.value = get('name', '');
    nameIn.addEventListener('input', function () { set('name', nameIn.value); });
    $('[data-my-export]').addEventListener('click', function () {
      var NL = '\r\n', out = ['정보과학 학습 기록', '이름: ' + (nameIn.value || '-'), '내보낸 날: ' + new Date().toLocaleString('ko-KR'), ''];
      [1, 2, 3, 4].forEach(function (u) {
        var q = quizBest(u);
        out.push('■ ' + UNIT_NAME[u]);
        out.push('  해 봤어요: ' + doneCount(u) + ' / ' + TOPICS[u].length + '   퀴즈 최고: ' + (q === null ? '안 풂' : q + '점'));
        out.push('  [정리 노트]');
        out.push((get('note.u' + u, '') || '(비어 있음)').split('\n').map(function (l) { return '  ' + l; }).join(NL));
        out.push('');
      });
      var blob = new Blob(['﻿' + out.join(NL)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '정보과학_학습기록' + (nameIn.value ? '_' + nameIn.value.replace(/[\\/:*?"<>|\s]+/g, '_') : '') + '.txt';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $('[data-my-print]').addEventListener('click', function () { window.print(); });
    $('[data-my-reset]').addEventListener('click', function () {
      if (!window.confirm('해 봤어요 체크, 퀴즈 점수, 정리 노트를 모두 지울까요? 되돌릴 수 없어요.')) return;
      try {
        Object.keys(localStorage).forEach(function (k) { if (k.indexOf('is.') === 0) localStorage.removeItem(k); });
      } catch (e) {}
      $$('[data-note]').forEach(function (ta) { ta.value = ''; });
      nameIn.value = '';
      render();
    });
  })();

  /* ---------- 코랩: 노트북 내려받기 · 코드 복사 · 오류 검색 ---------- */
  (function () {
    $$('[data-nb]').forEach(function (nb) {
      var name = nb.getAttribute('data-nb');
      function cells() {
        var out = [{ cell_type: 'markdown', metadata: {}, source: ['# ' + name.replace(/_/g, ' ') + '\n', '\n', '정보과학 수업 실습 노트북입니다. 위에서부터 차례로 실행하세요(Shift+Enter).'] }];
        $$('.nbmd, pre[data-cell]', nb).forEach(function (el) {
          var text = el.matches('pre') ? el.textContent : el.textContent.trim();
          var lines = text.replace(/\s+$/, '').split('\n').map(function (l, i, a) { return i < a.length - 1 ? l + '\n' : l; });
          if (el.matches('pre')) out.push({ cell_type: 'code', metadata: {}, execution_count: null, outputs: [], source: lines });
          else out.push({ cell_type: 'markdown', metadata: {}, source: lines });
        });
        return out;
      }
      $('[data-nb-dl]', nb).addEventListener('click', function () {
        var doc = { nbformat: 4, nbformat_minor: 5, metadata: { kernelspec: { name: 'python3', display_name: 'Python 3' }, language_info: { name: 'python' }, colab: { provenance: [] } }, cells: cells() };
        var blob = new Blob([JSON.stringify(doc, null, 1)], { type: 'application/x-ipynb+json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name + '.ipynb';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      });
      var cp = $('[data-nb-copy]', nb);
      cp.addEventListener('click', function () {
        var text = $$('pre[data-cell]', nb).map(function (p) { return p.textContent.replace(/\s+$/, ''); }).join('\n\n');
        var label = cp.textContent;
        function done(ok) { cp.textContent = ok ? '복사했어요 ✓' : '복사하지 못했어요'; setTimeout(function () { cp.textContent = label; }, 1500); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        else done(false);
      });
    });

    var tbl = $('[data-err-table]');
    if (!tbl) return;
    var q = $('[data-err-q]'), cnt = $('[data-err-count]'), rows = $$('tbody tr', tbl);
    q.addEventListener('input', function () {
      var s = q.value.trim().toLowerCase(), n = 0;
      rows.forEach(function (r) { var ok = !s || r.textContent.toLowerCase().indexOf(s) !== -1; r.hidden = !ok; if (ok) n++; });
      cnt.textContent = s ? n + '개 찾음' : '';
    });
  })();

  /* ---------- 실습실 공통 ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function onAct(root, fn) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (b && root.contains(b)) fn(b.getAttribute('data-act'), b);
    });
  }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 그래프 탐색: DFS · BFS ---------- */
  (function () {
    var root = $('[data-gsim]');
    if (!root) return;
    var POS = { A: [50, 150], B: [160, 70], C: [160, 230], D: [275, 35], E: [275, 150], F: [275, 260], G: [395, 85], H: [395, 215] };
    var G = { A: ['B', 'C'], B: ['A', 'D', 'E'], C: ['A', 'F'], D: ['B', 'G'], E: ['B', 'G', 'H'], F: ['C', 'H'], G: ['D', 'E'], H: ['E', 'F'] };
    var names = Object.keys(G);
    var svg = $('[data-g-svg]', root), dsEl = $('[data-g-ds]', root), ordEl = $('[data-g-order]', root);
    var dsLabel = $('[data-g-dslabel]', root), status = $('[data-status]', root);
    var algoSel = $('[data-g-algo]', root), startSel = $('[data-g-start]', root);
    var edges = {}, nodes = {};
    names.forEach(function (n) { startSel.appendChild(new Option(n, n)); });
    names.forEach(function (a) {
      G[a].forEach(function (b) {
        if (a < b) edges[a + b] = svgEl('line', { x1: POS[a][0], y1: POS[a][1], x2: POS[b][0], y2: POS[b][1], 'class': 'gedge' }, svg);
      });
    });
    names.forEach(function (n) {
      var g = svgEl('g', { 'class': 'gnode', tabindex: '0', role: 'button', 'aria-label': n + '에서 시작' }, svg);
      svgEl('circle', { cx: POS[n][0], cy: POS[n][1], r: 20 }, g);
      svgEl('text', { x: POS[n][0], y: POS[n][1] }, g).textContent = n;
      g.addEventListener('click', function () { startSel.value = n; build(); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startSel.value = n; build(); } });
      nodes[n] = g;
    });

    var frames = [], step = 0, timer = null;
    function build() {
      stop();
      var algo = algoSel.value, s = startSel.value, visited = [], ds = [[s, null]], used = [];
      var seen = {}; seen[s] = true;
      frames = [{ cur: null, visited: [], ds: [s], used: [], msg: '시작 노드 <b>' + s + '</b>를 ' + (algo === 'dfs' ? '스택' : '큐') + '에 넣었어요. <b>다음 단계</b>를 눌러 보세요.' }];
      while (ds.length) {
        var item = algo === 'dfs' ? ds.pop() : ds.shift(), n = item[0], from = item[1];
        if (algo === 'dfs' && visited.indexOf(n) !== -1) {
          frames.push({ cur: null, visited: visited.slice(), ds: ds.map(function (x) { return x[0]; }), used: used.slice(), msg: '스택에서 <b>' + n + '</b>를 꺼냈지만 이미 방문했으니 건너뜁니다.' });
          continue;
        }
        visited.push(n);
        if (from) used.push(from < n ? from + n : n + from);
        var added = [];
        var nb = G[n].slice();
        if (algo === 'dfs') nb.reverse();
        nb.forEach(function (m) {
          if (algo === 'dfs') { if (visited.indexOf(m) === -1) { ds.push([m, n]); added.push(m); } }
          else if (!seen[m]) { seen[m] = true; ds.push([m, n]); added.push(m); }
        });
        if (algo === 'dfs') added.reverse();
        frames.push({
          cur: n, visited: visited.slice(), ds: ds.map(function (x) { return x[0]; }), used: used.slice(),
          msg: (algo === 'dfs' ? '스택 맨 위' : '큐 맨 앞') + '에서 <b>' + n + '</b>를 꺼내 방문했어요. ' +
            (added.length ? '아직 안 간 이웃 <b>' + added.join(', ') + '</b>를 ' + (algo === 'dfs' ? '스택' : '큐') + '에 넣습니다.' : '새로 넣을 이웃이 없어요.')
        });
      }
      frames[frames.length - 1].msg += ' <b>탐색 끝!</b> 방문 순서: ' + visited.join(' → ');
      dsLabel.textContent = algo === 'dfs' ? '스택 (오른쪽 끝이 top — 여기서 꺼냄)' : '큐 (왼쪽 끝이 front — 여기서 꺼냄)';
      step = 0;
      draw();
    }
    function draw() {
      var f = frames[step];
      names.forEach(function (n) {
        var c = nodes[n].classList;
        c.toggle('cur', f.cur === n);
        c.toggle('vis', f.cur !== n && f.visited.indexOf(n) !== -1);
        c.toggle('inq', f.visited.indexOf(n) === -1 && f.ds.indexOf(n) !== -1);
      });
      for (var k in edges) edges[k].classList.toggle('used', f.used.indexOf(k) !== -1);
      dsEl.innerHTML = f.ds.length ? f.ds.map(function (x) { return '<span class="chip w">' + x + '</span>'; }).join('') : '<span class="muted">(비어 있음)</span>';
      ordEl.innerHTML = f.visited.map(function (x) { return '<span class="chip">' + x + '</span>'; }).join('') || '<span class="muted">(아직 없음)</span>';
      status.innerHTML = f.msg;
      $('[data-act="step"]', root).disabled = step >= frames.length - 1;
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; $('[data-act="play"]', root).textContent = '자동 실행'; } }
    onAct(root, function (act) {
      if (act === 'step' && step < frames.length - 1) { step++; draw(); }
      if (act === 'reset') build();
      if (act === 'play') {
        if (timer) { stop(); return; }
        if (step >= frames.length - 1) build();
        $('[data-act="play"]', root).textContent = '멈춤';
        timer = setInterval(function () { if (step < frames.length - 1) { step++; draw(); } else stop(); }, reduced ? 1200 : 800);
      }
    });
    algoSel.addEventListener('change', build);
    startSel.addEventListener('change', build);
    build();
  })();

  /* ---------- 이진 탐색 트리 ---------- */
  (function () {
    var root = $('[data-bst]');
    if (!root) return;
    var svg = $('[data-bst-svg]', root), vIn = $('[data-bst-v]', root), status = $('[data-status]', root);
    var tree = null, size = 0, busy = null, nodeEls = {};
    var MAX = 20;
    function insert(v) {
      var path = [];
      if (!tree) { tree = { v: v, l: null, r: null }; size++; return { path: path, ok: true }; }
      var cur = tree;
      while (true) {
        path.push(cur.v);
        if (v === cur.v) return { path: path, ok: false };
        var side = v < cur.v ? 'l' : 'r';
        if (!cur[side]) { cur[side] = { v: v, l: null, r: null }; size++; return { path: path, ok: true, side: side, parent: cur.v }; }
        cur = cur[side];
      }
    }
    function find(v) {
      var path = [], cur = tree;
      while (cur) { path.push(cur.v); if (v === cur.v) return { path: path, ok: true }; cur = v < cur.v ? cur.l : cur.r; }
      return { path: path, ok: false };
    }
    function order(kind) {
      var out = [];
      (function walk(n) {
        if (!n) return;
        if (kind === 'pre') out.push(n.v);
        walk(n.l);
        if (kind === 'in') out.push(n.v);
        walk(n.r);
        if (kind === 'post') out.push(n.v);
      })(tree);
      return out;
    }
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      nodeEls = {};
      if (!tree) {
        svg.setAttribute('viewBox', '0 0 640 80');
        svgEl('text', { x: 320, y: 40, 'class': 'sv-t-s', 'text-anchor': 'middle' }, svg).textContent = '비어 있는 트리 — 값을 넣어 보세요';
        return;
      }
      var xs = {}, idx = 0, depthMax = 0;
      (function walk(n, d) { if (!n) return; walk(n.l, d + 1); xs[n.v] = [idx++, d]; depthMax = Math.max(depthMax, d); walk(n.r, d + 1); })(tree, 0);
      var W = Math.max(640, size * 40 + 40), H = depthMax * 56 + 60, gap = (W - 40) / Math.max(size, 1);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      function pos(v) { return [20 + gap * (xs[v][0] + .5), 30 + xs[v][1] * 56]; }
      (function lines(n) {
        if (!n) return;
        ['l', 'r'].forEach(function (s) {
          if (n[s]) { var a = pos(n.v), b = pos(n[s].v); svgEl('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'class': 'bedge' }, svg); lines(n[s]); }
        });
      })(tree);
      Object.keys(xs).forEach(function (v) {
        var p = pos(+v), g = svgEl('g', { 'class': 'bnode' }, svg);
        svgEl('circle', { cx: p[0], cy: p[1], r: 16 }, g);
        svgEl('text', { x: p[0], y: p[1] }, g).textContent = v;
        nodeEls[v] = g;
      });
    }
    function clearMarks() { for (var k in nodeEls) nodeEls[k].classList.remove('path', 'hit', 'ord'); }
    function animate(seq, cls, each, end) {
      clearInterval(busy);
      var i = 0;
      function tick() {
        if (i >= seq.length) { clearInterval(busy); busy = null; if (end) end(); return; }
        var el = nodeEls[seq[i]];
        if (el) el.classList.add(cls(i));
        if (each) each(i);
        i++;
      }
      tick();
      busy = setInterval(tick, reduced ? 120 : 480);
    }
    function readV() {
      var v = parseInt(vIn.value, 10);
      if (isNaN(v) || v < 1 || v > 99) { status.innerHTML = '1부터 99 사이의 정수를 넣어 주세요.'; return null; }
      return v;
    }
    function build(vals) { tree = null; size = 0; vals.forEach(insert); draw(); }
    onAct(root, function (act) {
      clearMarks();
      if (act === 'ins') {
        var v = readV(); if (v === null) return;
        if (size >= MAX && !find(v).ok) { status.innerHTML = '노드는 ' + MAX + '개까지 넣을 수 있어요. <b>비우기</b>나 <b>무작위 트리</b>로 새로 시작하세요.'; return; }
        var r = insert(v);
        draw();
        clearMarks();
        if (!r.ok) { animate(r.path, function () { return 'path'; }, null, function () { nodeEls[v].classList.add('hit'); }); status.innerHTML = '<b>' + v + '</b>는 이미 트리에 있어요. 이진 탐색 트리에는 같은 값을 두 번 넣지 않았어요.'; return; }
        if (!r.path.length) { nodeEls[v].classList.add('hit'); status.innerHTML = '빈 트리라서 <b>' + v + '</b>가 루트가 되었어요.'; return; }
        status.innerHTML = '<b>' + v + '</b>: ' + r.path.map(function (p) { return p + (v < p ? '보다 작다 → 왼쪽' : '보다 크다 → 오른쪽'); }).join(', ') + '. 빈자리에 넣었어요. 비교 <b>' + r.path.length + '번</b>.';
        animate(r.path, function () { return 'path'; }, null, function () { nodeEls[v].classList.add('hit'); });
        vIn.value = Math.floor(Math.random() * 99) + 1;
      }
      if (act === 'find') {
        var t = readV(); if (t === null) return;
        if (!tree) { status.innerHTML = '트리가 비어 있어요.'; return; }
        var f = find(t);
        animate(f.path, function (i) { return f.ok && i === f.path.length - 1 ? 'hit' : 'path'; }, null, function () {
          status.innerHTML = f.ok ? '<b>' + t + '</b>를 ' + f.path.length + '번 비교해서 찾았어요. 노드가 ' + size + '개지만 루트에서 내려가는 길만 봤어요.'
                                  : '<b>' + t + '</b>는 없어요. ' + f.path.join(' → ') + ' 다음 자리가 비어 있어서 탐색을 끝냈어요(비교 ' + f.path.length + '번).';
        });
        status.innerHTML = '루트부터 비교하며 내려가는 중…';
      }
      if (act === 'in' || act === 'pre' || act === 'post') {
        if (!tree) { status.innerHTML = '트리가 비어 있어요.'; return; }
        var seq = order(act), nm = { in: '중위(왼쪽 → 루트 → 오른쪽)', pre: '전위(루트 → 왼쪽 → 오른쪽)', post: '후위(왼쪽 → 오른쪽 → 루트)' }[act];
        animate(seq, function () { return 'ord'; }, function (i) {
          status.innerHTML = nm + ' 순회: <b>' + seq.slice(0, i + 1).join(', ') + '</b>' + (i === seq.length - 1 && act === 'in' ? ' — 오름차순으로 정렬되어 나왔어요!' : '');
        });
      }
      if (act === 'rand') {
        var pool = [], vals = [];
        for (var i = 1; i < 100; i++) pool.push(i);
        for (var j = 0; j < 9; j++) vals.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        build(vals);
        status.innerHTML = '무작위 값 9개를 넣은 순서: ' + vals.join(', ') + '. <b>중위 순회</b>를 눌러 보세요.';
      }
      if (act === 'sorted') {
        build([10, 20, 30, 40, 50, 60, 70]);
        status.innerHTML = '10, 20, …, 70을 차례로 넣었더니 모두 오른쪽으로만 이어졌어요. 70을 찾으려면 <b>7번</b> 비교해야 해요. 균형 잡힌 트리였다면 3번이면 충분해요.';
      }
      if (act === 'clear') { build([]); status.innerHTML = '트리를 비웠어요. 값을 넣어 보세요.'; }
    });
    build([50, 30, 70, 20, 40, 60, 80]);
    status.innerHTML = '50, 30, 70, 20, 40, 60, 80을 넣은 트리예요. 값을 정하고 <b>넣기</b>나 <b>찾기</b>를 눌러 보세요.';
  })();

  /* ---------- 정렬 경주 ---------- */
  (function () {
    var root = $('[data-sortrace]');
    if (!root) return;
    var grid = $('[data-sr-grid]', root), status = $('[data-status]', root);
    var kindSel = $('[data-sr-kind]', root), nSel = $('[data-sr-n]', root), speed = $('[data-sr-speed]', root);
    var goBtn = $('[data-act="go"]', root);
    // 각 알고리즘을 미리 돌려 연산 기록(c: 비교, s: 교환, w: 값 쓰기, f: 자리 확정)을 만든다.
    var ALGOS = [
      { name: '버블 정렬', o: 'O(n²)', run: function (a, ops) {
        var n = a.length;
        for (var i = 0; i < n - 1; i++) {
          var swapped = false;
          for (var j = 0; j < n - 1 - i; j++) {
            ops.push(['c', j, j + 1]);
            if (a[j] > a[j + 1]) { var t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; ops.push(['s', j, j + 1]); swapped = true; }
          }
          ops.push(['f', n - 1 - i]);
          if (!swapped) break;
        }
      } },
      { name: '선택 정렬', o: 'O(n²)', run: function (a, ops) {
        var n = a.length;
        for (var i = 0; i < n - 1; i++) {
          var m = i;
          for (var j = i + 1; j < n; j++) { ops.push(['c', m, j]); if (a[j] < a[m]) m = j; }
          if (m !== i) { var t = a[i]; a[i] = a[m]; a[m] = t; ops.push(['s', i, m]); }
          ops.push(['f', i]);
        }
      } },
      { name: '삽입 정렬', o: 'O(n²)', run: function (a, ops) {
        for (var i = 1; i < a.length; i++) {
          var j = i;
          while (j > 0) {
            ops.push(['c', j - 1, j]);
            if (a[j - 1] > a[j]) { var t = a[j]; a[j] = a[j - 1]; a[j - 1] = t; ops.push(['s', j - 1, j]); j--; }
            else break;
          }
        }
      } },
      { name: '퀵 정렬', o: '평균 O(n log n)', run: function (a, ops) {
        (function qs(lo, hi) {
          if (lo > hi) return;
          if (lo === hi) { ops.push(['f', lo]); return; }
          var p = lo, k = lo;                      // 첫 원소를 피벗으로
          for (var i = lo + 1; i <= hi; i++) {
            ops.push(['c', p, i]);
            if (a[i] < a[p]) { k++; var t = a[k]; a[k] = a[i]; a[i] = t; ops.push(['s', k, i]); }
          }
          var t2 = a[lo]; a[lo] = a[k]; a[k] = t2; ops.push(['s', lo, k]); ops.push(['f', k]);
          qs(lo, k - 1); qs(k + 1, hi);
        })(0, a.length - 1);
      } }
    ];
    var base = [], racers = [], timer = null, finished = 0;
    function makeArray() {
      var n = +nSel.value, a = [], i;
      for (i = 1; i <= n; i++) a.push(i);
      if (kindSel.value === 'rev') a.reverse();
      else if (kindSel.value === 'near') { for (i = 0; i < Math.max(2, n / 10); i++) { var x = Math.floor(Math.random() * (n - 1)); var t = a[x]; a[x] = a[x + 1]; a[x + 1] = t; } }
      else for (i = n - 1; i > 0; i--) { var r = Math.floor(Math.random() * (i + 1)); var t2 = a[i]; a[i] = a[r]; a[r] = t2; }
      return a;
    }
    function setup(arr) {
      stop();
      base = arr || makeArray();
      grid.innerHTML = '';
      finished = 0;
      racers = ALGOS.map(function (al) {
        var ops = [];
        al.run(base.slice(), ops);
        var card = document.createElement('div');
        card.className = 'sortcard';
        card.innerHTML = '<h6>' + al.name + '<span>' + al.o + '</span></h6><div class="sbars"></div><div class="cnt">비교 0번 · 교환 0번</div>';
        grid.appendChild(card);
        var bars = card.querySelector('.sbars'), max = base.length;
        var els = base.map(function (v) { var i = document.createElement('i'); i.style.height = (v / max * 100) + '%'; bars.appendChild(i); return i; });
        return { al: al, ops: ops, pos: 0, arr: base.slice(), els: els, card: card, cnt: card.querySelector('.cnt'), c: 0, s: 0, done: false, total: ops.filter(function (o) { return o[0] === 'c'; }).length };
      });
      status.innerHTML = '배열 ' + base.length + '칸이 준비됐어요. <b>시작</b>을 눌러 경주를 보세요.';
      goBtn.textContent = '시작';
    }
    function stepRacer(r, k) {
      $$('i.a', r.card).forEach(function (x) { x.classList.remove('a'); });
      for (var n = 0; n < k && r.pos < r.ops.length; n++) {
        var op = r.ops[r.pos++];
        if (op[0] === 'c') { r.c++; r.els[op[1]].classList.add('a'); r.els[op[2]].classList.add('a'); }
        else if (op[0] === 's') {
          var t = r.arr[op[1]]; r.arr[op[1]] = r.arr[op[2]]; r.arr[op[2]] = t; r.s++;
          r.els[op[1]].style.height = (r.arr[op[1]] / r.arr.length * 100) + '%';
          r.els[op[2]].style.height = (r.arr[op[2]] / r.arr.length * 100) + '%';
        } else if (op[0] === 'f') r.els[op[1]].classList.add('s');
      }
      r.cnt.textContent = '비교 ' + r.c + '번 · 교환 ' + r.s + '번';
      if (r.pos >= r.ops.length && !r.done) {
        r.done = true; finished++;
        r.els.forEach(function (x) { x.classList.remove('a'); x.classList.add('s'); });
        r.card.classList.add('done');
        r.cnt.innerHTML = '<span class="rank">' + finished + '등</span> · 비교 ' + r.c + '번 · 교환 ' + r.s + '번';
      }
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function tick() {
      var k = +speed.value;
      racers.forEach(function (r) { if (!r.done) stepRacer(r, k); });
      if (finished === racers.length) {
        stop();
        goBtn.textContent = '다시 보기';
        var sorted = racers.slice().sort(function (a, b) { return a.c - b.c; });
        status.innerHTML = '끝! 비교 횟수: ' + sorted.map(function (r) { return r.al.name + ' <b>' + r.c + '</b>'; }).join(', ') + '. 배열 모양을 바꿔 다시 해 보세요.';
      }
    }
    onAct(root, function (act) {
      if (act === 'new') setup();
      if (act === 'go') {
        if (timer) { stop(); goBtn.textContent = '계속'; return; }
        if (finished === racers.length) setup(base);
        goBtn.textContent = '멈춤';
        status.innerHTML = '정렬하는 중… 같은 배열, 같은 속도로 한 번에 ' + speed.value + '개 연산씩 진행합니다.';
        timer = setInterval(tick, 40);
      }
    });
    kindSel.addEventListener('change', function () { setup(); });
    nSel.addEventListener('change', function () { setup(); });
    setup();
  })();
})();
