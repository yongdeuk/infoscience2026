(function () {
  'use strict';
  var fmt = function (n) { return n.toLocaleString('ko-KR'); };

  /* ============ 1. 스택 시뮬레이터 ============ */
  (function () {
    var root = document.getElementById('lab-stack'); if (!root) return;
    var box = root.querySelector('[data-box]'),
        topEl = root.querySelector('[data-top]'),
        input = root.querySelector('[data-val]'),
        status = root.querySelector('[data-status]'),
        log = root.querySelector('[data-log]');
    var stack = [], out = [], auto = 0, MAX = 6;

    function nextAuto() { return String.fromCharCode(65 + (auto++ % 26)); }
    function render(newIdx) {
      box.innerHTML = '';
      stack.forEach(function (v, i) {
        var d = document.createElement('div');
        d.className = 'cell' + (i === newIdx ? ' new' : '');
        d.textContent = v;
        box.appendChild(d);
      });
      topEl.textContent = stack.length ? 'top → ' + stack[stack.length - 1] : 'top → (빈 스택)';
      log.textContent = '꺼낸 순서: ' + (out.length ? out.join(' → ') : '(없음)');
    }
    function say(html) { status.innerHTML = html; }

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'push') {
        if (stack.length >= MAX) { say('스택이 가득 찼습니다 — <b>오버플로</b>. 더 이상 push할 수 없습니다.'); return; }
        var v = (input.value || '').trim() || nextAuto();
        stack.push(v); input.value = '';
        render(stack.length - 1);
        say('<b>push(\'' + v + '\')</b> — 맨 위(top)에 <b>' + v + '</b>를 쌓았습니다. 현재 ' + stack.length + '개.');
      } else if (act === 'pop') {
        if (!stack.length) { say('빈 스택에서 pop을 하면 <b>언더플로 오류</b>입니다. 그래서 삭제 전에 <code>isEmpty()</code>로 검사합니다.'); return; }
        var p = stack.pop(); out.push(p); render();
        say('<b>pop()</b> → <b>' + p + '</b>를 반환하고 <b>삭제</b>했습니다. 가장 나중에 넣은 것이 먼저 나옵니다.');
      } else if (act === 'peek') {
        if (!stack.length) { say('빈 스택에서는 peek도 할 수 없습니다.'); return; }
        render(); var last = box.lastElementChild;
        if (last) { last.classList.add('peeked'); setTimeout(function () { last.classList.remove('peeked'); }, 1100); }
        say('<b>peek()</b> → <b>' + stack[stack.length - 1] + '</b>. 확인만 하고 <b>삭제하지 않습니다</b>. 개수는 그대로 ' + stack.length + '개.');
      } else if (act === 'clear') {
        stack = []; out = []; auto = 0; render();
        say('스택을 비웠습니다. 다시 push해 보세요.');
      }
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); root.querySelector('[data-act="push"]').click(); }
    });
    render();
  })();

  /* ============ 2. 스택 vs 큐 비교 ============ */
  (function () {
    var root = document.getElementById('lab-queue'); if (!root) return;
    var qbox = root.querySelector('[data-qbox]'), sbox = root.querySelector('[data-sbox]'),
        qtop = root.querySelector('[data-qtop]'), stop = root.querySelector('[data-stop]'),
        status = root.querySelector('[data-status]'), log = root.querySelector('[data-log]');
    var q = [], s = [], qout = [], sout = [], auto = 0, MAX = 5, busy = false;

    function render(nq, ns) {
      qbox.innerHTML = ''; sbox.innerHTML = '';
      q.forEach(function (v, i) {
        var d = document.createElement('div');
        d.className = 'cell' + (i === nq ? ' new' : ''); d.textContent = v; qbox.appendChild(d);
      });
      s.forEach(function (v, i) {
        var d = document.createElement('div');
        d.className = 'cell' + (i === ns ? ' new' : ''); d.textContent = v; sbox.appendChild(d);
      });
      qtop.textContent = q.length ? 'front → ' + q[0] : 'front → (빈 큐)';
      stop.textContent = s.length ? 'top → ' + s[s.length - 1] : 'top → (빈 스택)';
      log.innerHTML = '큐에서 나온 순서: ' + (qout.length ? '<b>' + qout.join(' → ') + '</b>' : '(없음)') +
        '<br>스택에서 나온 순서: ' + (sout.length ? '<b>' + sout.join(' → ') + '</b>' : '(없음)');
    }
    function say(h) { status.innerHTML = h; }
    function push() {
      if (q.length >= MAX) { say('자리가 가득 찼습니다. 먼저 빼 보세요.'); return false; }
      var v = String.fromCharCode(65 + (auto++ % 26));
      q.push(v); s.push(v); render(q.length - 1, s.length - 1);
      say('두 구조 모두에 <b>' + v + '</b>를 넣었습니다. 큐는 뒤(rear)에, 스택은 위(top)에 쌓입니다.');
      return true;
    }
    function pop() {
      if (!q.length) { say('둘 다 비어 있습니다. 먼저 넣어 보세요.'); return false; }
      var a = q.shift(), b = s.pop(); qout.push(a); sout.push(b); render();
      say('큐는 <b>' + a + '</b>(가장 먼저 넣은 것), 스택은 <b>' + b + '</b>(가장 나중에 넣은 것)를 내놓았습니다.');
      return true;
    }
    function reset() { q = []; s = []; qout = []; sout = []; auto = 0; render(); }

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b || busy) return;
      var act = b.dataset.act;
      if (act === 'in') push();
      else if (act === 'out') pop();
      else if (act === 'reset') { reset(); say('초기화했습니다.'); }
      else if (act === 'demo') {
        busy = true; reset();
        var steps = [push, push, push, push, pop, pop, pop, pop], i = 0;
        var t = setInterval(function () {
          steps[i++]();
          if (i >= steps.length) {
            clearInterval(t); busy = false;
            say('넣은 순서는 <b>A → B → C → D</b>로 같았지만, 큐는 <b>A → B → C → D</b>, 스택은 <b>D → C → B → A</b>로 나왔습니다.');
          }
        }, 480);
      }
    });
    render();
  })();

  /* ============ 3. 재귀 호출 따라가기 ============ */
  (function () {
    var root = document.getElementById('lab-recur'); if (!root) return;
    var box = root.querySelector('[data-rstack]'), trace = root.querySelector('[data-trace]'),
        depthEl = root.querySelector('[data-depth]'), fnSel = root.querySelector('[data-fn]'),
        nIn = root.querySelector('[data-n]'), nLab = root.querySelector('[data-nlab]'),
        status = root.querySelector('[data-status]'), codeEl = root.querySelector('[data-code]'),
        playBtn = root.querySelector('[data-act="play"]');

    var SPEC = {
      fact: {
        nlab: 'n', min: 1, max: 7, def: 5, name: 'factorial',
        code: 'def factorial(n):\n    if n <= 1:          # 기본 단계\n        return 1\n    return n * factorial(n - 1)   # 재귀 단계',
        run: function (n, ev) {
          ev.push({ t: 'call', label: 'factorial(' + n + ')', arg: n });
          if (n <= 1) { ev.push({ t: 'ret', label: 'factorial(' + n + ')', expr: '1 (기본 단계)', val: 1 }); return 1; }
          var r = this.run(n - 1, ev), v = n * r;
          ev.push({ t: 'ret', label: 'factorial(' + n + ')', expr: n + ' × ' + r + ' = ' + v, val: v });
          return v;
        }
      },
      pow: {
        nlab: 'n', min: 0, max: 8, def: 5, name: 'power',
        code: 'def power(x, n):\n    if n == 0:          # 기본 단계\n        return 1\n    return x * power(x, n - 1)    # 재귀 단계',
        run: function (n, ev) {
          ev.push({ t: 'call', label: 'power(2, ' + n + ')', arg: n });
          if (n === 0) { ev.push({ t: 'ret', label: 'power(2, 0)', expr: '1 (기본 단계)', val: 1 }); return 1; }
          var r = this.run(n - 1, ev), v = 2 * r;
          ev.push({ t: 'ret', label: 'power(2, ' + n + ')', expr: '2 × ' + r + ' = ' + v, val: v });
          return v;
        }
      },
      digit: {
        nlab: '숫자', min: 1, max: 999999, def: 7925, name: 'digit_sum',
        code: 'def digit_sum(n):\n    if n < 10:          # 기본 단계\n        return n\n    return digit_sum(n // 10) + n % 10   # 재귀 단계',
        run: function (n, ev) {
          ev.push({ t: 'call', label: 'digit_sum(' + n + ')', arg: n });
          if (n < 10) { ev.push({ t: 'ret', label: 'digit_sum(' + n + ')', expr: n + ' (기본 단계)', val: n }); return n; }
          var r = this.run(Math.floor(n / 10), ev), v = r + (n % 10);
          ev.push({ t: 'ret', label: 'digit_sum(' + n + ')', expr: r + ' + ' + (n % 10) + ' = ' + v, val: v });
          return v;
        }
      }
    };

    var ev = [], step = 0, frames = [], timer = null, spec = SPEC.fact;

    function build() {
      stop();
      spec = SPEC[fnSel.value];
      nLab.textContent = spec.nlab;
      nIn.min = spec.min; nIn.max = spec.max;
      var n = parseInt(nIn.value, 10);
      if (isNaN(n) || n < spec.min || n > spec.max) { n = spec.def; nIn.value = n; }
      codeEl.textContent = spec.code;
      ev = []; spec.run(n, ev); step = 0; frames = [];
      render();
      status.innerHTML = '<b>다음 단계</b>를 누를 때마다 호출 하나가 쌓이거나 값 하나가 반환됩니다. 총 ' + ev.length + '단계.';
    }
    function render(msg) {
      box.innerHTML = '';
      frames.forEach(function (f, i) {
        var d = document.createElement('div');
        d.className = 'cell' + (f.done ? ' done' : '') + (i === frames.length - 1 && !f.done ? ' active' : '');
        d.innerHTML = '<b>' + f.label + '</b>' + (f.done ? '<span>→ ' + f.expr + '</span>' : '<span>계산 대기 중</span>');
        box.appendChild(d);
      });
      var live = frames.filter(function (f) { return !f.done; }).length;
      depthEl.textContent = '깊이 ' + live;
      trace.innerHTML = '';
      ev.slice(0, step).forEach(function (e, i) {
        var d = document.createElement('div');
        d.className = (e.t === 'call' ? 'call' : 'ret') + (i === step - 1 ? ' now' : '');
        d.textContent = (e.t === 'call' ? '↓ 호출  ' : '↑ 반환  ') + e.label + (e.t === 'ret' ? ' = ' + e.val : '');
        trace.appendChild(d);
      });
      trace.scrollTop = trace.scrollHeight;
      if (msg) status.innerHTML = msg;
    }
    function next() {
      if (step >= ev.length) return false;
      var e = ev[step++];
      if (e.t === 'call') {
        frames.push({ label: e.label, done: false });
        render('<b>' + e.label + '</b> 호출 — 스택에 쌓입니다. 아직 답을 모르니 <b>기다립니다</b>.');
      } else {
        for (var i = frames.length - 1; i >= 0; i--) {
          if (!frames[i].done) { frames[i].done = true; frames[i].expr = e.expr; break; }
        }
        render('<b>' + e.label + '</b>가 <b>' + e.val + '</b>를 반환 — 스택에서 빠지고, 기다리던 위 단계가 계산을 이어갑니다.');
      }
      if (step >= ev.length) {
        var last = ev[ev.length - 1];
        status.innerHTML = '끝났습니다. 최종 결과는 <b>' + last.val + '</b>. 호출은 위에서 아래로, 반환은 <b>아래에서 위로</b> 일어났습니다.';
      }
      return step < ev.length;
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } playBtn.textContent = '자동 재생'; }
    function play() {
      if (timer) { stop(); return; }
      if (step >= ev.length) { build(); }
      playBtn.textContent = '멈추기';
      timer = setInterval(function () { if (!next()) stop(); }, 620);
    }

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'step') { stop(); next(); }
      else if (b.dataset.act === 'play') play();
      else if (b.dataset.act === 'reset') build();
    });
    fnSel.addEventListener('change', function () { nIn.value = SPEC[fnSel.value].def; build(); });
    nIn.addEventListener('change', build);
    build();
  })();

  /* ============ 4. 하노이 탑 ============ */
  (function () {
    var root = document.getElementById('lab-hanoi'); if (!root) return;
    var pegEls = [].slice.call(root.querySelectorAll('.peg')),
        movesEl = root.querySelector('[data-moves]'), minEl = root.querySelector('[data-min]'),
        sel = root.querySelector('[data-n]'), status = root.querySelector('[data-status]'),
        autoBtn = root.querySelector('[data-act="auto"]');
    var n = 3, pegs = [[], [], []], picked = null, moves = 0, hist = [], timer = null;

    function say(h) { status.innerHTML = h; }
    function reset(keepMsg) {
      stopAuto();
      n = parseInt(sel.value, 10);
      pegs = [[], [], []];
      for (var i = n; i >= 1; i--) pegs[0].push(i);
      picked = null; moves = 0; hist = [];
      minEl.textContent = Math.pow(2, n) - 1;
      render();
      if (!keepMsg) say('원반 <b>' + n + '개</b>로 시작합니다. 기둥을 눌러 맨 위 원반을 집고, 다른 기둥을 눌러 내려놓으세요.');
    }
    function render() {
      movesEl.textContent = moves;
      pegEls.forEach(function (el, i) {
        [].slice.call(el.querySelectorAll('.disk')).forEach(function (d) { d.remove(); });
        el.classList.toggle('sel', picked === i);
        pegs[i].forEach(function (size, idx) {
          var d = document.createElement('span');
          d.className = 'disk';
          var min = 38, max = 94;
          d.style.width = (n === 1 ? max : min + (size - 1) * (max - min) / (n - 1)) + '%';
          d.textContent = size;
          if (picked === i && idx === pegs[i].length - 1) d.classList.add('lift');
          el.appendChild(d);
        });
      });
    }
    function tryMove(from, to, quiet) {
      var d = pegs[from][pegs[from].length - 1];
      var t = pegs[to][pegs[to].length - 1];
      if (t !== undefined && t < d) {
        say('<b>' + d + '번 원반</b>을 더 작은 <b>' + t + '번 원반</b> 위에 올릴 수 없습니다.');
        return false;
      }
      pegs[from].pop(); pegs[to].push(d); moves++; hist.push([from, to]);
      if (!quiet) say('원반 <b>' + d + '</b>를 ' + 'ABC'[from] + ' → ' + 'ABC'[to] + '로 옮겼습니다. (' + moves + '번째)');
      return true;
    }
    function checkWin() {
      if (pegs[2].length !== n) return;
      var best = Math.pow(2, n) - 1;
      stopAuto();
      say(moves === best
        ? '완성! <b>최소 횟수 ' + best + '번</b>으로 정확히 옮겼습니다. 훌륭합니다.'
        : '완성! ' + moves + '번 만에 옮겼습니다. 최소는 <b>' + best + '번</b>(2<sup>' + n + '</sup>−1)이니 다시 도전해 보세요.');
    }
    function solve(k, a, c, b, list) {
      if (k === 0) return;
      solve(k - 1, a, b, c, list); list.push([a, c]); solve(k - 1, b, c, a, list);
    }
    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
      autoBtn.textContent = '자동 풀이 보기';
    }
    function startAuto() {
      reset(true); var list = []; solve(n, 0, 2, 1, list); var i = 0;
      autoBtn.textContent = '멈추기';
      say('재귀 함수가 만든 <b>' + list.length + '번</b>의 이동을 순서대로 재생합니다.');
      timer = setInterval(function () {
        if (i >= list.length) { stopAuto(); checkWin(); return; }
        tryMove(list[i][0], list[i][1], true); render();
        say('이동 ' + (i + 1) + '/' + list.length + ' — ' + 'ABC'[list[i][0]] + ' → ' + 'ABC'[list[i][1]]);
        i++;
      }, 430);
    }

    pegEls.forEach(function (el, i) {
      el.addEventListener('click', function () {
        if (timer) return;
        if (picked === null) {
          if (!pegs[i].length) { say('빈 기둥입니다. 원반이 있는 기둥을 먼저 누르세요.'); return; }
          picked = i; render();
          say('<b>' + pegs[i][pegs[i].length - 1] + '번 원반</b>을 집었습니다. 내려놓을 기둥을 누르세요.');
        } else if (picked === i) {
          picked = null; render(); say('선택을 취소했습니다.');
        } else {
          var from = picked; picked = null;
          if (tryMove(from, i)) { render(); checkWin(); } else { render(); }
        }
      });
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'reset') reset();
      else if (act === 'auto') { if (timer) { stopAuto(); say('멈췄습니다.'); } else startAuto(); }
      else if (act === 'undo') {
        if (timer) return;
        if (!hist.length) { say('되돌릴 이동이 없습니다.'); return; }
        var h = hist.pop(); pegs[h[0]].push(pegs[h[1]].pop()); moves--; picked = null; render();
        say('한 수 무렀습니다. 현재 ' + moves + '번째.');
      }
    });
    sel.addEventListener('change', function () { reset(); });
    reset(true);
  })();

  /* ============ 5. 이진 탐색 ============ */
  (function () {
    var root = document.getElementById('lab-bsearch'); if (!root) return;
    var row = root.querySelector('[data-row]'), bcnt = root.querySelector('[data-bcnt]'),
        lcnt = root.querySelector('[data-lcnt]'), tInput = root.querySelector('[data-target]'),
        status = root.querySelector('[data-status]');
    var arr = [3, 8, 12, 17, 23, 29, 34, 41, 47, 55, 62, 68, 74, 80, 88, 95];
    var lo, hi, mid, steps, done, foundIdx;

    function say(h) { status.innerHTML = h; }
    function reset(msg) {
      lo = 0; hi = arr.length - 1; mid = -1; steps = 0; done = false; foundIdx = -1;
      render();
      var t = parseInt(tInput.value, 10);
      var k = arr.indexOf(t);
      lcnt.textContent = k >= 0 ? k + 1 : arr.length;
      if (msg !== false) say('찾을 값 <b>' + t + '</b>. <b>다음 단계</b>를 눌러 중간값과 비교해 보세요.');
    }
    function render() {
      row.innerHTML = '';
      var t = parseInt(tInput.value, 10);
      arr.forEach(function (v, i) {
        var c = document.createElement('div');
        c.className = 'bs-cell';
        if (i === foundIdx) c.className += ' found';
        else if (i === mid) c.className += ' mid';
        else if (i < lo || i > hi) c.className += ' out';
        if (v === t && foundIdx < 0) c.className += ' target';
        c.textContent = v;
        row.appendChild(c);
      });
      bcnt.textContent = steps;
    }
    function step() {
      if (done) return false;
      var t = parseInt(tInput.value, 10);
      if (lo > hi) { done = true; mid = -1; render(); say('탐색 범위가 사라졌습니다. <b>' + t + '</b>는 배열에 없습니다. 비교 ' + steps + '회.'); return false; }
      mid = Math.floor((lo + hi) / 2); steps++;
      if (arr[mid] === t) {
        done = true; foundIdx = mid; render();
        say('<b>' + arr[mid] + ' = ' + t + '</b> — 찾았습니다! 비교 <b>' + steps + '회</b>. 순차 탐색이라면 ' + lcnt.textContent + '회 필요했습니다.');
      } else if (arr[mid] < t) {
        say('중간값 <b>' + arr[mid] + '</b> &lt; ' + t + ' → 왼쪽 절반을 <b>통째로 버립니다</b>.');
        lo = mid + 1; render();
      } else {
        say('중간값 <b>' + arr[mid] + '</b> &gt; ' + t + ' → 오른쪽 절반을 <b>통째로 버립니다</b>.');
        hi = mid - 1; render();
      }
      return !done;
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'step') step();
      else if (act === 'all') { var g = 0; while (step() && g++ < 40) {} }
      else if (act === 'reset') reset();
      else if (act === 'rand') { tInput.value = arr[Math.floor(Math.random() * arr.length)]; reset(); }
    });
    tInput.addEventListener('change', function () { reset(); });
    tInput.value = 74; reset();
  })();

  /* ============ 6. 재귀 vs 동적 계획법 ============ */
  (function () {
    var root = document.getElementById('lab-dp'); if (!root) return;
    var slider = root.querySelector('[data-n]'), nlab = root.querySelector('[data-nlabel]'),
        bar1 = root.querySelector('[data-bar1]'), bar2 = root.querySelector('[data-bar2]'),
        v1 = root.querySelector('[data-v1]'), v2 = root.querySelector('[data-v2]'),
        status = root.querySelector('[data-status]');
    var memo = { 1: 1, 2: 1 };
    function calls(n) {
      if (memo[n]) return memo[n];
      for (var i = 3; i <= n; i++) if (!memo[i]) memo[i] = 1 + memo[i - 1] + memo[i - 2];
      return memo[n];
    }
    function update() {
      var n = parseInt(slider.value, 10);
      nlab.textContent = n;
      var rec = calls(n), dp = n;
      bar1.style.width = '100%';
      bar2.style.width = Math.max(0.4, dp / rec * 100) + '%';
      v1.textContent = fmt(rec) + '회';
      v2.textContent = fmt(dp) + '회';
      var ratio = Math.round(rec / dp);
      status.innerHTML = 'n = <b>' + n + '</b> — 재귀는 <b>' + fmt(rec) + '회</b> 호출, 동적 계획법은 <b>' + fmt(dp) + '회</b>. 약 <b>' + fmt(ratio) + '배</b> 차이입니다.';
    }
    slider.addEventListener('input', update);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      slider.value = b.dataset.act.slice(1); update();
    });
    update();
  })();

  /* ============ 7. 빅오 비교 ============ */
  (function () {
    var root = document.getElementById('lab-bigo'); if (!root) return;
    var wrap = root.querySelector('[data-bars]'), slider = root.querySelector('[data-n]'),
        nlab = root.querySelector('[data-nlabel]'), status = root.querySelector('[data-status]');
    var defs = [
      { name: 'O(1)', f: function () { return 1; } },
      { name: 'O(log n)', f: function (n) { return Math.max(1, Math.ceil(Math.log2(n))); } },
      { name: 'O(n)', f: function (n) { return n; } },
      { name: 'O(n log n)', f: function (n) { return n * Math.max(1, Math.ceil(Math.log2(n))); } },
      { name: 'O(n²)', f: function (n) { return n * n; } }
    ];
    defs.forEach(function (d) {
      var r = document.createElement('div'); r.className = 'bar-row';
      r.innerHTML = '<span class="bar-name">' + d.name + '</span>' +
        '<span class="bar-track"><span class="bar-fill"></span></span><span class="bar-val"></span>';
      wrap.appendChild(r); d.fill = r.querySelector('.bar-fill'); d.val = r.querySelector('.bar-val');
    });
    function update() {
      var n = parseInt(slider.value, 10); nlab.textContent = n;
      var vals = defs.map(function (d) { return d.f(n); });
      var max = Math.max.apply(null, vals);
      defs.forEach(function (d, i) {
        d.fill.style.width = Math.max(0.4, vals[i] / max * 100) + '%';
        d.val.textContent = fmt(vals[i]);
      });
      status.innerHTML = 'n = <b>' + n + '</b>일 때 O(n²)은 <b>' + fmt(n * n) + '회</b>, O(n)은 ' + fmt(n) +
        '회, O(log n)은 ' + fmt(defs[1].f(n)) + '회입니다.';
    }
    slider.addEventListener('input', update);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      slider.value = b.dataset.act.slice(1); update();
    });
    update();
  })();
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
