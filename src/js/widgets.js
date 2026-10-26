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

  /* ============ Ⅲ·Ⅳ단원 체험 (u34 labs) ============ */
  function labRoot(id) { return document.getElementById(id); }
  function labAct(root, fn) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (b && root.contains(b)) fn(b.dataset.act, b);
    });
  }
  function shuffled(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---- 8-퍼즐 ---- */
  (function () {
    var root = labRoot('lab-puzzle'); if (!root) return;
    var grid = root.querySelector('[data-grid]'), cnt = root.querySelector('[data-cnt]'), status = root.querySelector('[data-status]');
    var GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0], START = [1, 2, 3, 4, 0, 5, 7, 8, 6];
    var cells, moves, best;
    function say(h) { status.innerHTML = h; }
    function neighbors(i) {
      var r = Math.floor(i / 3), c = i % 3, out = [];
      if (r > 0) out.push(i - 3); if (r < 2) out.push(i + 3); if (c > 0) out.push(i - 1); if (c < 2) out.push(i + 1);
      return out;
    }
    function solved() { return cells.join() === GOAL.join(); }
    function render() {
      var blank = cells.indexOf(0), can = neighbors(blank);
      grid.innerHTML = '';
      cells.forEach(function (v, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'lx-tile' + (v === 0 ? ' blank' : '') + (can.indexOf(i) >= 0 ? ' can' : '') + (v && v === GOAL[i] ? ' ok' : '');
        b.textContent = v || '';
        b.dataset.i = i;
        if (v) b.setAttribute('aria-label', v + '번 타일' + (can.indexOf(i) >= 0 ? ' (옮길 수 있음)' : ''));
        else { b.disabled = true; b.setAttribute('aria-label', '빈칸'); }
        grid.appendChild(b);
      });
      cnt.textContent = moves;
    }
    function set(state, min, msg) { cells = state.slice(); moves = 0; best = min; render(); say(msg); }
    function scramble(n) {
      var s = GOAL.slice(), prev = -1;
      for (var k = 0; k < n; k++) {
        var blank = s.indexOf(0), opts = neighbors(blank).filter(function (x) { return x !== prev; });
        var pick = opts[Math.floor(Math.random() * opts.length)];
        s[blank] = s[pick]; s[pick] = 0; prev = blank;
      }
      if (s.join() === GOAL.join()) return scramble(n);
      return s;
    }
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.lx-tile'); if (!b || solved()) return;
      var i = +b.dataset.i, blank = cells.indexOf(0);
      if (neighbors(blank).indexOf(i) < 0) { say('빈칸과 <b>맞닿은 타일</b>만 옮길 수 있어요. 지금 고를 수 있는 행동은 ' + neighbors(blank).length + '가지예요.'); return; }
      cells[blank] = cells[i]; cells[i] = 0; moves++; render();
      if (solved()) say('<b>목표 상태 도착!</b> ' + moves + '번 옮겼어요.' + (best ? ' 이 문제는 ' + best + '번 이하로도 풀 수 있어요.' + (moves <= best ? ' 가장 짧은 길을 찾았네요!' : ' 더 짧은 길에 도전해 보세요.') : ''));
      else say('상태가 바뀌었어요. 지금 빈칸을 옮길 수 있는 방향은 <b>' + neighbors(cells.indexOf(0)).length + '가지</b>예요.');
    });
    labAct(root, function (act) {
      if (act === 'start') set(START, 2, '교과서의 초기 상태예요. 빈칸 옆의 타일을 눌러 옮겨 보세요. <b>2번</b>이면 풀려요.');
      else if (act === 'easy') set(scramble(6), 6, '쉬운 문제예요. 6번 이하로 풀 수 있어요.');
      else if (act === 'hard') set(scramble(18), 18, '어려운 문제예요. 18번 이하로 풀 수 있어요. 탐색할 상태가 얼마나 많은지 느껴 보세요.');
    });
    set(START, 2, '빈칸 옆의 타일을 눌러 옮겨 보세요. 타일을 한 번 옮길 때마다 <b>새로운 상태</b>가 돼요.');
  })();

  /* ---- N-퀸 ---- */
  (function () {
    var root = labRoot('lab-queens'); if (!root) return;
    var board = root.querySelector('[data-board]'), sel = root.querySelector('[data-n]'), status = root.querySelector('[data-status]');
    var N, queens;
    function attacks(a, b) { return a[0] === b[0] || a[1] === b[1] || Math.abs(a[0] - b[0]) === Math.abs(a[1] - b[1]); }
    function render() {
      board.innerHTML = '';
      board.style.gridTemplateColumns = 'repeat(' + N + ', 1fr)';
      board.style.maxWidth = (N * 3.1) + 'rem';
      var bad = {};
      queens.forEach(function (q, i) { queens.forEach(function (p, j) { if (i !== j && attacks(q, p)) bad[q.join()] = 1; }); });
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        var b = document.createElement('button');
        b.type = 'button';
        var has = queens.some(function (q) { return q[0] === r && q[1] === c; });
        var hit = !has && queens.some(function (q) { return attacks(q, [r, c]); });
        b.className = 'lx-sq' + ((r + c) % 2 ? ' dark' : '') + (has ? ' q' : '') + (hit ? ' hit' : '') + (bad[r + ',' + c] ? ' bad' : '');
        b.textContent = has ? '♛' : '';
        b.dataset.r = r; b.dataset.c = c;
        b.setAttribute('aria-label', (r + 1) + '행 ' + (c + 1) + '열' + (has ? ' 퀸' + (bad[r + ',' + c] ? ' (공격받음)' : '') : hit ? ' (공격받는 칸)' : ' (안전한 칸)'));
        board.appendChild(b);
      }
      var nb = Object.keys(bad).length;
      if (!queens.length) status.innerHTML = '칸을 눌러 퀸을 놓아 보세요. 색이 칠해진 칸은 이미 놓인 퀸이 <b>공격할 수 있는 칸</b>이에요.';
      else if (nb) status.innerHTML = '퀸 ' + queens.length + '개 중 <b>' + nb + '개가 서로 공격</b>하고 있어요. 붉은 퀸을 다시 눌러 치우고(되돌아가기) 다른 칸을 시도해 보세요.';
      else if (queens.length === N) status.innerHTML = '<b>성공!</b> 퀸 ' + N + '개가 서로 공격하지 못해요. 프로그램에서는 이 답을 <b>[' + queens.slice().sort(function (a, b) { return a[0] - b[0]; }).map(function (q) { return q[1]; }).join(', ') + ']</b>로 나타내요.';
      else status.innerHTML = '퀸 <b>' + queens.length + '개</b>를 안전하게 놓았어요. 남은 안전한 칸(색이 없는 칸)에 ' + (N - queens.length) + '개를 더 놓아 보세요. 놓을 칸이 없으면 되돌아가야 해요.';
    }
    function reset() { N = +sel.value; queens = []; render(); }
    board.addEventListener('click', function (e) {
      var b = e.target.closest('.lx-sq'); if (!b) return;
      var r = +b.dataset.r, c = +b.dataset.c;
      var k = -1; queens.forEach(function (q, i) { if (q[0] === r && q[1] === c) k = i; });
      if (k >= 0) queens.splice(k, 1);
      else if (queens.length < N) queens.push([r, c]);
      else { status.innerHTML = '퀸은 ' + N + '개까지만 놓을 수 있어요. 놓인 퀸을 눌러 먼저 치워 주세요.'; return; }
      render();
    });
    function solve() {
      var cols = [];
      function ok(r, c) { for (var i = 0; i < r; i++) if (cols[i] === c || Math.abs(cols[i] - c) === r - i) return false; return true; }
      function go(r) {
        if (r === N) return true;
        for (var c = 0; c < N; c++) if (ok(r, c)) { cols[r] = c; if (go(r + 1)) return true; }
        return false;
      }
      go(0);
      queens = cols.map(function (c, r) { return [r, c]; });
      render();
    }
    labAct(root, function (act) { if (act === 'reset') reset(); else if (act === 'solve') solve(); });
    sel.addEventListener('change', reset);
    reset();
  })();

  /* ---- 거스름돈: 탐욕 vs 최적 ---- */
  (function () {
    var root = labRoot('lab-coin'); if (!root) return;
    var sel = root.querySelector('[data-set]'), amt = root.querySelector('[data-amt]'),
        g = root.querySelector('[data-greedy]'), o = root.querySelector('[data-opt]'), status = root.querySelector('[data-status]');
    function chips(list) {
      return list.length ? list.map(function (c) { return '<span class="lx-chip">' + c + '</span>'; }).join('') + '<span class="lx-sum">' + list.length + '개</span>' : '<span class="lx-sum">만들 수 없음</span>';
    }
    function update() {
      var coins = sel.value.split(',').map(Number).sort(function (a, b) { return b - a; });
      var unit = coins[coins.length - 1];
      var n = Math.max(unit, Math.min(parseInt(amt.value, 10) || unit, unit === 10 ? 2000 : 60));
      n = Math.round(n / unit) * unit; amt.value = n; amt.step = unit; amt.min = unit; amt.max = unit === 10 ? 2000 : 60;
      var rest = n, gr = [];
      coins.forEach(function (c) { while (rest >= c) { gr.push(c); rest -= c; } });
      var m = n / unit, dp = [0], from = [0];
      for (var i = 1; i <= m; i++) {
        dp[i] = Infinity;
        coins.forEach(function (c) { var k = c / unit; if (k <= i && dp[i - k] + 1 < dp[i]) { dp[i] = dp[i - k] + 1; from[i] = k; } });
      }
      var op = []; for (var j = m; j > 0; j -= from[j]) op.push(from[j] * unit);
      op.sort(function (a, b) { return b - a; });
      g.innerHTML = chips(gr); o.innerHTML = chips(op);
      if (gr.length === op.length) status.innerHTML = '<b>' + n + '원</b> — 탐욕법도 가장 적은 <b>' + op.length + '개</b>를 찾았어요.' + (unit === 10 ? ' 우리나라 동전은 큰 동전이 작은 동전의 배수라서 탐욕법이 늘 통해요.' : ' 다른 금액도 넣어 보세요. 탐욕법이 틀리는 금액이 있어요.');
      else status.innerHTML = '<b>' + n + '원</b> — 탐욕법은 <b>' + gr.length + '개</b>, 실제 최소는 <b>' + op.length + '개</b>! 큰 동전부터 집었더니 손해를 봤어요. <b>탐욕법이 항상 가장 좋은 답을 주지는 않아요.</b>';
    }
    sel.addEventListener('change', function () { amt.value = sel.value === '500,100,50,10' ? 780 : 6; update(); });
    amt.addEventListener('input', update);
    labAct(root, function (act) { var u = +amt.step || 1; amt.value = (parseInt(amt.value, 10) || 0) + (act === 'up' ? u : -u); update(); });
    update();
  })();

  /* ---- 퀵 정렬 ---- */
  (function () {
    var root = labRoot('lab-qsort'); if (!root) return;
    var stage = root.querySelector('[data-stage]'), cnt = root.querySelector('[data-cnt]'), status = root.querySelector('[data-status]');
    var segs, comps, base;
    function load(a, msg) { base = a.slice(); segs = [{ v: a.slice(), done: a.length <= 1 }]; comps = 0; render(); status.innerHTML = msg; }
    function render() {
      stage.innerHTML = '';
      segs.forEach(function (s, si) {
        var grp = document.createElement('div');
        grp.className = 'lx-seg' + (s.done ? ' done' : '');
        s.v.forEach(function (v, i) {
          var bar = document.createElement('div');
          bar.className = 'lx-bar' + (s.done ? ' fixed' : '') + (!s.done && i === 0 && si === next() ? ' pivot' : '');
          bar.style.height = (1 + v * 0.62) + 'rem';
          bar.innerHTML = '<span>' + v + '</span>';
          grp.appendChild(bar);
        });
        stage.appendChild(grp);
      });
      cnt.textContent = comps;
    }
    function next() { for (var i = 0; i < segs.length; i++) if (!segs[i].done) return i; return -1; }
    function step() {
      var k = next();
      if (k < 0) return false;
      var s = segs[k].v, p = s[0], L = [], R = [];
      for (var i = 1; i < s.length; i++) { comps++; (s[i] <= p ? L : R).push(s[i]); }
      var rep = [];
      if (L.length) rep.push({ v: L, done: L.length === 1 });
      rep.push({ v: [p], done: true });
      if (R.length) rep.push({ v: R, done: R.length === 1 });
      Array.prototype.splice.apply(segs, [k, 1].concat(rep));
      render();
      var n = base.length;
      if (next() < 0) status.innerHTML = '<b>정렬 끝!</b> 비교 <b>' + comps + '번</b>. 선택 정렬이라면 언제나 ' + (n * (n - 1) / 2) + '번이에요.' + (comps === n * (n - 1) / 2 ? ' 이번에는 퀵 정렬도 똑같이 걸렸어요. 피벗이 늘 한쪽 끝 값이라 한쪽으로만 치우쳐 나뉘었기 때문이에요(최악의 경우).' : '');
      else status.innerHTML = '기준 <b>' + p + '</b>: 작거나 같은 값 ' + L.length + '개는 왼쪽, 큰 값 ' + R.length + '개는 오른쪽으로. <b>' + p + '</b>의 자리가 정해졌어요(색칠).';
      return true;
    }
    labAct(root, function (act) {
      if (act === 'step') { if (!step()) status.innerHTML = '이미 정렬이 끝났어요. <b>섞기</b>를 눌러 다시 해 보세요.'; }
      else if (act === 'all') { var g = 0; while (step() && g++ < 50) {} }
      else if (act === 'shuffle') load(shuffled([1, 2, 3, 4, 5, 6, 7, 8]), '새로 섞었어요. 굵은 테두리의 막대가 이번 <b>기준(피벗)</b>이에요.');
      else if (act === 'sorted') load([1, 2, 3, 4, 5, 6, 7, 8], '이미 정렬된 줄이에요. 퀵 정렬에게는 오히려 <b>가장 나쁜 경우</b>예요. 왜 그런지 한 단계씩 눌러 보세요.');
      else if (act === 'reset') load(base, '처음 상태로 돌아왔어요.');
    });
    load([5, 3, 8, 1, 7, 2, 6, 4], '<b>다음 단계</b>를 누르면 굵은 테두리의 막대(기준)를 중심으로 작은 값은 왼쪽, 큰 값은 오른쪽으로 갈라져요.');
  })();

  /* ---- 배낭 채우기 ---- */
  (function () {
    var root = labRoot('lab-knap'); if (!root) return;
    var itemsEl = root.querySelector('[data-items]'), capSel = root.querySelector('[data-cap]'), fill = root.querySelector('[data-fill]'),
        wv = root.querySelector('[data-w]'), vv = root.querySelector('[data-v]'), tried = root.querySelector('[data-tried]'), status = root.querySelector('[data-status]');
    var items = [[2, 3], [3, 4], [4, 5], [5, 6]], on, seen;
    function best(W) {
      var b = 0;
      for (var m = 0; m < 16; m++) { var w = 0, v = 0; for (var i = 0; i < 4; i++) if (m >> i & 1) { w += items[i][0]; v += items[i][1]; } if (w <= W && v > b) b = v; }
      return b;
    }
    function render() {
      var W = +capSel.value, w = 0, v = 0, mask = 0;
      itemsEl.innerHTML = '';
      items.forEach(function (it, i) {
        if (on[i]) { w += it[0]; v += it[1]; mask |= 1 << i; }
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'lx-item' + (on[i] ? ' on' : ''); b.dataset.i = i;
        b.setAttribute('aria-pressed', on[i] ? 'true' : 'false');
        b.innerHTML = '<b>' + (i + 1) + '번</b><span>' + it[0] + 'kg</span><span>가치 ' + it[1] + '</span>';
        itemsEl.appendChild(b);
      });
      seen[mask] = 1;
      fill.style.width = Math.min(100, w / W * 100) + '%';
      fill.className = 'lx-fill' + (w > W ? ' over' : '');
      wv.textContent = w + ' / ' + W + 'kg'; vv.textContent = w > W ? '—' : v;
      tried.textContent = Object.keys(seen).length + ' / 16';
      var B = best(W);
      if (!mask) status.innerHTML = '물건을 눌러 배낭에 담아 보세요. 다시 누르면 꺼내요. 무게 한도 안에서 <b>가치의 합</b>을 가장 크게 만들어 보세요.';
      else if (w > W) status.innerHTML = '<b>' + (w - W) + 'kg 초과!</b> 배낭이 찢어져요. 무언가를 꺼내야 해요.';
      else if (v === B) status.innerHTML = '<b>가치 ' + v + ' — 이보다 좋은 방법은 없어요!</b> 16가지를 모두 따져 본 것과 같은 답이에요.';
      else status.innerHTML = '가치 <b>' + v + '</b>. 담을 수는 있지만, 더 좋은 조합이 있어요. (' + (on[3] && W === 5 ? '가치가 가장 큰 4번부터 담는 탐욕법은 여기서 막혀요.' : '다른 조합도 시도해 보세요.') + ')';
    }
    function reset() { on = [false, false, false, false]; seen = {}; render(); }
    itemsEl.addEventListener('click', function (e) { var b = e.target.closest('.lx-item'); if (!b) return; on[+b.dataset.i] = !on[+b.dataset.i]; render(); });
    capSel.addEventListener('change', reset);
    labAct(root, function () { reset(); });
    reset();
  })();

  /* ---- 주식 최대 수익 ---- */
  (function () {
    var root = labRoot('lab-stock'); if (!root) return;
    var row = root.querySelector('[data-days]'), status = root.querySelector('[data-status]'), tries = root.querySelector('[data-tries]');
    var prices = [10300, 9600, 9800, 8200, 7800, 8300, 9500, 9800, 10200, 9500];
    var days = ['6/1', '6/2', '6/3', '6/4', '6/5', '6/8', '6/9', '6/10', '6/11', '6/12'];
    var buy, sell, n;
    function render() {
      row.innerHTML = '';
      prices.forEach(function (p, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.dataset.i = i;
        b.className = 'lx-day' + (i === buy ? ' buy' : '') + (i === sell ? ' sell' : '') + (buy !== null && sell === null && i <= buy ? ' off' : '');
        b.innerHTML = '<span class="d">' + days[i] + '</span><span class="col"><i style="height:' + ((p - 7000) / 3500 * 100) + '%"></i></span><b>' + fmt(p) + '</b><span class="t">' + (i === buy ? '삼' : i === sell ? '팖' : '&nbsp;') + '</span>';
        row.appendChild(b);
      });
      tries.textContent = n;
    }
    function reset() { buy = sell = null; render(); }
    row.addEventListener('click', function (e) {
      var b = e.target.closest('.lx-day'); if (!b) return;
      var i = +b.dataset.i;
      if (buy === null || sell !== null) { buy = i; sell = null; render(); status.innerHTML = '<b>' + days[i] + '</b>에 ' + fmt(prices[i]) + '원에 샀어요. 이제 <b>그 뒤의 날</b> 가운데 파는 날을 골라 보세요.'; return; }
      if (i <= buy) { status.innerHTML = '사기 전에는 팔 수 없어요. <b>' + days[buy] + ' 뒤의 날</b>을 골라 주세요.'; return; }
      sell = i; n++; render();
      var pf = prices[sell] - prices[buy];
      status.innerHTML = days[buy] + '에 사서 ' + days[sell] + '에 팔면 <b>' + (pf >= 0 ? '+' : '') + fmt(pf) + '원</b>. ' +
        (pf === 2400 ? '<b>최대 수익이에요!</b> ' + n + '번 만에 찾았어요. 전체 탐색은 45쌍을 모두 비교해요.' : pf < 0 ? '손해를 봤어요. 다른 날을 눌러 다시 사 보세요.' : '더 큰 수익이 있어요. 다른 날을 눌러 다시 사 보세요.');
    });
    labAct(root, function () { n = 0; reset(); status.innerHTML = '먼저 <b>사는 날</b>을 누르고, 그다음 <b>파는 날</b>을 눌러 보세요.'; });
    n = 0; reset();
    status.innerHTML = '먼저 <b>사는 날</b>을 누르고, 그다음 <b>파는 날</b>을 눌러 보세요.';
  })();

  /* ---- 급식 메뉴 고르기 ---- */
  (function () {
    var root = labRoot('lab-menu'); if (!root) return;
    var wrap = root.querySelector('[data-cats]'), total = root.querySelector('[data-total]'), tried = root.querySelector('[data-tried]'), status = root.querySelector('[data-status]');
    var cats = [['고기', [['닭고기', 40], ['돼지고기', 50], ['소고기', 30]]], ['야채', [['브로콜리', 20], ['시금치', 25], ['양배추', 35]]],
                ['국', [['미역국', 50], ['된장국', 20], ['김치찌개', 40]]], ['반찬', [['김치', 15], ['멸치볶음', 35], ['나물', 25]]]];
    var pick, seen, shown;
    function render() {
      wrap.innerHTML = '';
      cats.forEach(function (c, ci) {
        var col = document.createElement('div'); col.className = 'lx-cat';
        col.innerHTML = '<h6>' + c[0] + '</h6>';
        c[1].forEach(function (m, mi) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'lx-opt' + (pick[ci] === mi ? ' on' : ''); b.dataset.c = ci; b.dataset.m = mi;
          b.setAttribute('aria-pressed', pick[ci] === mi ? 'true' : 'false');
          b.innerHTML = m[0] + ' <span>' + (shown ? m[1] + 'g' : '?') + '</span>';
          col.appendChild(b);
        });
        wrap.appendChild(col);
      });
      var full = pick.every(function (p) { return p !== null; });
      var sum = 0; if (full) pick.forEach(function (p, ci) { sum += cats[ci][1][p][1]; });
      total.textContent = full ? sum + 'g' : '—';
      if (full) seen[pick.join('')] = 1;
      var k = Object.keys(seen).length;
      tried.textContent = k + ' / 81';
      if (!full) status.innerHTML = '줄마다 메뉴를 <b>하나씩</b> 골라 식단을 짜 보세요. 네 가지를 모두 고르면 잔반량의 합이 나와요.';
      else if (sum === 85) status.innerHTML = '<b>잔반 85g — 81가지 가운데 가장 적어요!</b> ' + k + '가지를 시험해 보고 찾았네요. 프로그램은 이 답을 눈 깜짝할 사이에 찾아요.';
      else {
        var rank = 1;
        for (var a = 0; a < 3; a++) for (var b2 = 0; b2 < 3; b2++) for (var c2 = 0; c2 < 3; c2++) for (var d2 = 0; d2 < 3; d2++)
          if (cats[0][1][a][1] + cats[1][1][b2][1] + cats[2][1][c2][1] + cats[3][1][d2][1] < sum) rank++;
        status.innerHTML = '이 식단의 잔반은 <b>' + sum + 'g</b>. 81가지 가운데 <b>' + rank + '번째</b>로 적어요. 지금까지 <b>' + k + '가지</b>를 시험했어요. 더 줄여 보세요.';
      }
    }
    function reset() { pick = [null, null, null, null]; seen = {}; shown = true; render(); }
    wrap.addEventListener('click', function (e) { var b = e.target.closest('.lx-opt'); if (!b) return; pick[+b.dataset.c] = +b.dataset.m; render(); });
    labAct(root, function (act) {
      if (act === 'reset') reset();
      else if (act === 'best') { shown = true; pick = cats.map(function (c) { var bi = 0; c[1].forEach(function (m, i) { if (m[1] < c[1][bi][1]) bi = i; }); return bi; }); render(); }
    });
    reset();
  })();

  /* ---- 탄소 발자국 계산기 ---- */
  (function () {
    var root = labRoot('lab-carbon'); if (!root) return;
    var rows = root.querySelector('[data-rows]'), total = root.querySelector('[data-total]'), status = root.querySelector('[data-status]');
    var acts = [['전기', 'kWh', 0.474, 20, 0.5, 6], ['버스', 'km', 0.1, 40, 1, 8], ['플라스틱', 'kg', 2.5, 1, 0.05, 0.2],
                ['쌀', 'kg', 2.7, 1, 0.05, 0.3], ['소고기', 'kg', 27, 0.5, 0.05, 0.1], ['채소', 'kg', 0.5, 1, 0.05, 0.3]];
    acts.forEach(function (a, i) {
      var d = document.createElement('div'); d.className = 'lx-crow';
      d.innerHTML = '<label for="lx-c' + i + '">' + a[0] + ' <small>1' + a[1] + '당 ' + a[2] + '</small></label>' +
        '<input id="lx-c' + i + '" type="range" min="0" max="' + a[3] + '" step="' + a[4] + '" value="' + a[5] + '" data-i="' + i + '">' +
        '<span class="amt" data-amt></span><span class="bar"><i data-bar></i></span><span class="val" data-val></span>';
      rows.appendChild(d);
    });
    function update() {
      var sum = 0, vals = [], maxI = 0;
      [].forEach.call(rows.querySelectorAll('input'), function (inp, i) { var v = parseFloat(inp.value) * acts[i][2]; vals.push(v); sum += v; if (v > vals[maxI]) maxI = i; });
      var top = Math.max.apply(null, vals.concat([0.01]));
      [].forEach.call(rows.children, function (d, i) {
        d.querySelector('[data-amt]').textContent = parseFloat(d.querySelector('input').value) + acts[i][1];
        d.querySelector('[data-bar]').style.width = (vals[i] / top * 100) + '%';
        d.querySelector('[data-val]').textContent = vals[i].toFixed(2) + 'kg';
      });
      total.textContent = sum.toFixed(2) + 'kg CO₂';
      status.innerHTML = sum === 0 ? '모두 0이에요. 슬라이더를 움직여 오늘 하루를 입력해 보세요.' :
        '오늘의 탄소 발자국은 <b>' + sum.toFixed(2) + 'kg</b>. 가장 큰 몫은 <b>' + acts[maxI][0] + '</b>(' + Math.round(vals[maxI] / sum * 100) + '%)예요. 이 값을 줄이면 효과가 가장 커요.';
    }
    rows.addEventListener('input', update);
    labAct(root, function (act) {
      [].forEach.call(rows.querySelectorAll('input'), function (inp, i) { inp.value = act === 'zero' ? 0 : acts[i][5]; });
      update();
    });
    update();
  })();

  /* ---- 다익스트라 ---- */
  (function () {
    var root = labRoot('lab-dijk'); if (!root) return;
    var svg = root.querySelector('[data-svg]'), tbl = root.querySelector('[data-tbl]'), sel = root.querySelector('[data-start]'), status = root.querySelector('[data-status]');
    var pos = { '집': [80, 130], '학교': [250, 50], '도서관': [300, 165], '카페': [520, 220], '학원': [520, 50] };
    var names = ['집', '학교', '도서관', '카페', '학원'];
    var edges = [['집', '학교', 300], ['집', '도서관', 450], ['집', '카페', 600], ['학교', '학원', 150], ['학교', '도서관', 68], ['도서관', '카페', 68], ['학원', '카페', 600]];
    var dist, done, from, cur, step;
    function reset() {
      dist = {}; done = {}; from = {}; cur = null; step = 0;
      names.forEach(function (n) { dist[n] = Infinity; });
      dist[sel.value] = 0;
      render();
      status.innerHTML = '출발점 <b>' + sel.value + '</b>만 0, 나머지는 아직 모름(∞)이에요. <b>다음 단계</b>를 눌러 보세요.';
    }
    function d(n) { return dist[n] === Infinity ? '∞' : dist[n]; }
    function render() {
      var h = '';
      edges.forEach(function (e) {
        var a = pos[e[0]], b = pos[e[1]], tree = from[e[0]] === e[1] || from[e[1]] === e[0], hot = cur && (e[0] === cur || e[1] === cur);
        var path = e[0] === '집' && e[1] === '카페' ? 'M80 130 Q 280 290 520 220' : 'M' + a[0] + ' ' + a[1] + ' L' + b[0] + ' ' + b[1];
        var mx = e[0] === '집' && e[1] === '카페' ? 280 : (a[0] + b[0]) / 2, my = e[0] === '집' && e[1] === '카페' ? 246 : (a[1] + b[1]) / 2;
        h += '<path d="' + path + '" class="' + (tree ? 'sv-a' : hot ? 'sv-line' : 'sv-mute') + '"' + (tree ? ' stroke-width="3"' : '') + '/>';
        h += '<text x="' + (mx + 8) + '" y="' + (my - 6) + '" class="' + (tree ? 'sv-t-a' : 'sv-t-s') + '">' + e[2] + '</text>';
      });
      names.forEach(function (n) {
        var p = pos[n];
        h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="28" class="' + (n === cur ? 'sv-box-a' : 'sv-box') + '"' + (done[n] ? ' stroke-width="3"' : '') + '/>';
        h += '<text x="' + p[0] + '" y="' + (p[1] - 1) + '" class="sv-t-b" text-anchor="middle">' + n + '</text>';
        h += '<text x="' + p[0] + '" y="' + (p[1] + 15) + '" class="' + (done[n] ? 'sv-t-a' : 'sv-t-s') + '" text-anchor="middle">' + d(n) + '</text>';
      });
      svg.innerHTML = h;
      tbl.innerHTML = '<tr>' + names.map(function (n) { return '<th>' + n + '</th>'; }).join('') + '</tr><tr>' +
        names.map(function (n) { return '<td class="' + (done[n] ? 'done' : '') + '">' + d(n) + (done[n] ? ' ✓' : '') + '</td>'; }).join('') + '</tr>';
    }
    function next() {
      var best = null;
      names.forEach(function (n) { if (!done[n] && dist[n] < Infinity && (best === null || dist[n] < dist[best])) best = n; });
      if (best === null) { cur = null; render(); status.innerHTML = '<b>끝!</b> 모든 장소의 최소 배출량이 정해졌어요. 굵은 선이 ' + sel.value + '에서 각 장소로 가는 가장 좋은 길이에요. 출발 장소를 바꿔 보세요.'; return false; }
      cur = best; done[best] = true; step++;
      var msg = [];
      edges.forEach(function (e) {
        var nb = e[0] === best ? e[1] : e[1] === best ? e[0] : null;
        if (!nb || done[nb]) return;
        var nd = dist[best] + e[2];
        if (nd < dist[nb]) { msg.push(nb + ' ' + d(nb) + ' → <b>' + nd + '</b>'); dist[nb] = nd; from[nb] = best; }
        else msg.push(nb + ': ' + nd + '이라 그대로');
      });
      render();
      status.innerHTML = '단계 ' + step + ' — 아직 확정되지 않은 곳 중 값이 가장 적은 곳은 <b>' + best + ' (' + dist[best] + ')</b>. 이 값을 확정(✓)해요. ' + (msg.length ? '이웃 확인: ' + msg.join(', ') + '.' : '고칠 이웃이 없어요.');
      return true;
    }
    labAct(root, function (act) {
      if (act === 'step') next();
      else if (act === 'all') { var g = 0; while (next() && g++ < 10) {} }
      else reset();
    });
    sel.addEventListener('change', reset);
    reset();
  })();

  /* ---- 교실 자리 배치 ---- */
  (function () {
    var root = labRoot('lab-seat'); if (!root) return;
    var grid = root.querySelector('[data-grid]'), chk = root.querySelector('[data-noprev]'), round = root.querySelector('[data-round]'), status = root.querySelector('[data-status]');
    var R = 4, C = 4, n = 0;
    var names = ['구민지', '최지영', '구정식', '강민재', '안지우', '김지훈', '김정순', '박재호', '백하윤', '이영호', '장명숙', '김경희', '이영환', '김영숙', '윤건우', '윤하윤'];
    var st = names.map(function (nm, i) {
      return { name: nm, fixed: i < 2 ? [0, i] : null, pref: i === 2 || i === 3 ? 'front' : i >= 14 ? 'back' : '', prev: null, seat: [Math.floor(i / C), i % C] };
    });
    function render(moved) {
      grid.innerHTML = '';
      for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
        var s = st.filter(function (x) { return x.seat[0] === r && x.seat[1] === c; })[0];
        var b = document.createElement('button');
        b.type = 'button'; b.dataset.name = s.name;
        b.className = 'lx-seat' + (s.fixed ? ' fixed' : s.pref ? ' ' + s.pref : '') + (moved && s.prev && s.prev[0] === r && s.prev[1] === c && !s.fixed ? ' same' : '');
        b.innerHTML = '<b>' + s.name + '</b><span>' + (s.fixed ? '고정' : s.pref === 'front' ? '앞 선호' : s.pref === 'back' ? '뒤 선호' : '&nbsp;') + '</span>';
        b.setAttribute('aria-label', s.name + (s.fixed ? ', 고정 자리' : s.pref === 'front' ? ', 앞자리 선호' : s.pref === 'back' ? ', 뒷자리 선호' : ', 선호 없음') + '. 누르면 선호를 바꿔요');
        grid.appendChild(b);
      }
      round.textContent = n;
    }
    function assign() {
      var seats = [], r, c;
      for (r = 0; r < R; r++) { seats.push([]); for (c = 0; c < C; c++) seats[r].push(null); }
      st.forEach(function (s) { s.prev = s.seat; });
      st.forEach(function (s) { if (s.fixed) seats[s.fixed[0]][s.fixed[1]] = s; });
      var noPrev = chk.checked, fails = 0;
      function positions(cnt, rev) {
        var out = [];
        for (var i = 0; i < R; i++) for (var j = 0; j < C; j++) {
          var rr = rev ? R - 1 - i : i, cc = rev ? C - 1 - j : j;
          if (out.length < cnt && !seats[rr][cc]) out.push([rr, cc]);
        }
        return out;
      }
      function safe(s, p) { return !(noPrev && s.prev[0] === p[0] && s.prev[1] === p[1]); }
      function bt(group, pos) {
        function go(i) {
          if (i >= group.length) return true;
          for (var k = 0; k < pos.length; k++) {
            var p = pos[k];
            if (!seats[p[0]][p[1]] && safe(group[i], p)) {
              seats[p[0]][p[1]] = group[i];
              if (go(i + 1)) return true;
              seats[p[0]][p[1]] = null;
            }
          }
          return false;
        }
        return go(0);
      }
      function place(group, rev) {
        var cnt = group.length;
        while (!bt(group, positions(cnt, rev))) { fails++; cnt++; if (cnt > R * C) return false; }
        return true;
      }
      var free = st.filter(function (s) { return !s.fixed; });
      var ok = place(shuffled(free.filter(function (s) { return s.pref === 'front'; })), false) &&
               place(shuffled(free.filter(function (s) { return s.pref === 'back'; })), true) &&
               place(shuffled(free.filter(function (s) { return !s.pref; })), false);
      if (!ok) { st.forEach(function (s) { s.prev = null; }); status.innerHTML = '조건을 모두 지키는 배치를 찾지 못했어요. 조건을 조금 풀어 보세요.'; return; }
      for (r = 0; r < R; r++) for (c = 0; c < C; c++) seats[r][c].seat = [r, c];
      n++; render(true);
      var same = st.filter(function (s) { return !s.fixed && s.prev[0] === s.seat[0] && s.prev[1] === s.seat[1]; }).length;
      status.innerHTML = n + '번째 자리 바꾸기 완료. ' + (noPrev ? '이전 자리에 다시 앉은 학생 <b>0명</b>.' : '이전 자리에 다시 앉은 학생 <b>' + same + '명</b>' + (same ? '(점선 표시)' : '') + '.') +
        (fails ? ' 선호 자리가 모자라 후보 자리를 <b>' + fails + '번</b> 늘려 다시 시도했어요.' : '') + ' 학생을 눌러 선호를 바꾼 뒤 다시 해 보세요.';
    }
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.lx-seat'); if (!b) return;
      var s = st.filter(function (x) { return x.name === b.dataset.name; })[0];
      if (s.fixed) { status.innerHTML = '<b>' + s.name + '</b>은(는) 고정 자리예요. 가장 먼저 배정되고 움직이지 않아요.'; return; }
      s.pref = s.pref === '' ? 'front' : s.pref === 'front' ? 'back' : '';
      render();
      var f = st.filter(function (x) { return x.pref === 'front'; }).length;
      status.innerHTML = '<b>' + s.name + '</b>: ' + (s.pref === 'front' ? '앞자리 선호' : s.pref === 'back' ? '뒷자리 선호' : '선호 없음') + '(으)로 바꿨어요.' + (f > 2 ? ' 앞자리 선호가 ' + f + '명인데 앞줄 빈자리는 2칸뿐이에요. 어떻게 될까요?' : '') + ' <b>자리 바꾸기</b>를 눌러 보세요.';
    });
    labAct(root, function (act) { if (act === 'go') assign(); });
    render();
    status.innerHTML = '지금이 현재 자리예요. <b>자리 바꾸기</b>를 누르면 고정 → 앞 선호 → 뒤 선호 → 나머지 순서로 다시 배정해요. 학생을 누르면 선호(앞/뒤/없음)를 바꿀 수 있어요.';
  })();

  /* ============ Ⅰ·Ⅱ단원 체험 (u12 labs) ============ */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function outLine(box, html) {
    var d = document.createElement('div'); d.innerHTML = html; box.appendChild(d);
    while (box.children.length > 40) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  }

  /* ---- 라면 로봇 (함수 정의와 호출) ---- */
  (function () {
    var root = labRoot('lab-func'); if (!root) return;
    var code = root.querySelector('[data-code]'), out = root.querySelector('[data-out]'), cnt = root.querySelector('[data-count]'),
        egg = root.querySelector('[data-egg]'), status = root.querySelector('[data-status]'), calls = 0;
    var DEF = 'def cook_ramen(count, egg=False):        # 정의: 한 번만 적어 둠\n' +
              '    water = 550 * count\n' +
              "    print(f'물 {water}mL 끓이기')\n" +
              "    print(f'면과 수프 {count}개씩 넣기')\n" +
              '    if egg:\n' +
              "        print('계란 넣기')\n" +
              "    print('5분 끓이기 → 불 끄기 → 그릇에 담기')\n" +
              "    return f'라면 {count}그릇 완성!'";
    function callText() { var n = +cnt.value || 1; return 'cook_ramen(' + n + (egg.checked ? ', egg=True' : '') + ')'; }
    function render() { code.innerHTML = esc(DEF) + '\n\n<b>print(' + esc(callText()) + ')</b>        # 호출'; }
    function call() {
      var n = Math.max(1, Math.min(5, +cnt.value || 1)); cnt.value = n; calls++;
      outLine(out, '<span class="p">&gt;&gt;&gt; print(' + esc(callText()) + ')</span>');
      outLine(out, '물 ' + (550 * n) + 'mL 끓이기');
      outLine(out, '면과 수프 ' + n + '개씩 넣기');
      if (egg.checked) outLine(out, '계란 넣기');
      outLine(out, '5분 끓이기 → 불 끄기 → 그릇에 담기');
      outLine(out, '<b>라면 ' + n + '그릇 완성!</b>');
      status.innerHTML = '인수 <b>' + n + '</b>' + (egg.checked ? '와 <b>True</b>' : '') + '를 보냈어요. 함수 안에서 count = ' + n + ', egg = ' + (egg.checked ? 'True' : 'False(기본값)') +
        '가 되어 본문이 실행됐고, <code>return</code>으로 돌려준 문장이 출력됐어요. 지금까지 <b>' + calls + '번</b> 호출했어요.';
    }
    cnt.addEventListener('input', render); egg.addEventListener('change', render);
    labAct(root, function (act) { if (act === 'call') call(); else { out.innerHTML = ''; calls = 0; status.innerHTML = '출력을 지웠어요.'; } });
    render();
    status.innerHTML = '위가 함수의 정의예요. <b>함수 호출하기</b>를 눌러 보세요.';
  })();

  /* ---- 변수의 영역 ---- */
  (function () {
    var root = labRoot('lab-scope'); if (!root) return;
    var g = root.querySelector('[data-g]'), l = root.querySelector('[data-l]'), lbox = root.querySelector('[data-lbox]'),
        out = root.querySelector('[data-out]'), status = root.querySelector('[data-status]'), drink = 'coffee', timer = null;
    function render() { g.textContent = "'" + drink + "'"; }
    function flash(val, cb) {
      clearTimeout(timer); lbox.classList.add('on'); l.textContent = val; cb();
      timer = setTimeout(function () { lbox.classList.remove('on'); l.textContent = '—'; }, 1600);
    }
    labAct(root, function (act) {
      if (act === 'local') flash("'lemonade'", function () {
        outLine(out, '<span class="p">print_local_drink()</span> → 음료: lemonade');
        status.innerHTML = '함수 안에 <b>새 지역 변수</b> drink가 잠깐 생겼다가, 함수가 끝나자 사라졌어요. 전역 drink는 그대로 <b>' + drink + '</b>예요.';
      });
      else if (act === 'global') { lbox.classList.remove('on'); l.textContent = '—'; drink = 'coke'; render();
        outLine(out, '<span class="p">print_global_drink()</span> → 음료: coke');
        status.innerHTML = '<code>global drink</code> 덕분에 지역 변수를 새로 만들지 않고 <b>전역 변수의 값 자체</b>를 coke로 바꿨어요.'; }
      else if (act === 'print') { outLine(out, "<span class=\"p\">print('음료:', drink)</span> → 음료: " + drink);
        status.innerHTML = '함수 바깥에서는 늘 <b>전역 변수</b>를 봐요. 지금 값은 <b>' + drink + '</b>예요.'; }
      else { drink = 'coffee'; out.innerHTML = ''; render(); status.innerHTML = '처음 상태예요. 전역 변수 drink = \'coffee\''; }
    });
    render(); status.innerHTML = '버튼을 눌러 함수를 호출하고, 두 상자의 값이 어떻게 변하는지 보세요.';
  })();

  /* ---- 음료 주문 (가변 인수·기본값) ---- */
  (function () {
    var root = labRoot('lab-order'); if (!root) return;
    var picks = root.querySelector('[data-picks]'), code = root.querySelector('[data-code]'), out = root.querySelector('[data-out]'),
        disc = root.querySelector('[data-disc]'), status = root.querySelector('[data-status]'), list = [];
    ['콜라', '사이다', '커피', '녹차', '주스'].forEach(function (d) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = '+ ' + d; b.dataset.d = d; picks.appendChild(b);
    });
    function callText() {
      var a = list.map(function (d) { return "'" + d + "'"; });
      if (disc.value) a.push('discount=' + disc.value);
      return 'order(' + a.join(', ') + ')';
    }
    function render() {
      code.innerHTML = 'def order(*drinks, discount=0):\n    # drinks = ' + esc('(' + list.map(function (d) { return "'" + d + "'"; }).join(', ') + (list.length === 1 ? ',' : '') + ')') +
        '   ← 튜플로 묶여 들어옴\n    # discount = ' + (disc.value || '0   ← 안 줘서 기본값') + '\n\n<b>' + esc(callText()) + '</b>';
    }
    picks.addEventListener('click', function (e) { var b = e.target.closest('[data-d]'); if (!b) return; if (list.length >= 8) return; list.push(b.dataset.d); render(); });
    disc.addEventListener('change', render);
    labAct(root, function (act) {
      if (act === 'clear') { list = []; out.innerHTML = ''; render(); status.innerHTML = '주문을 비웠어요.'; return; }
      outLine(out, '<span class="p">&gt;&gt;&gt; ' + esc(callText()) + '</span>');
      if (!list.length) { outLine(out, '주문한 음료가 없습니다.'); status.innerHTML = '인수를 하나도 주지 않아도 오류가 나지 않아요. drinks는 <b>빈 튜플 ()</b>이 돼요.'; return; }
      var d = +(disc.value || 0), total = Math.round(list.length * 2000 * (1 - d));
      outLine(out, esc(list.join(', ')) + ' 주문이 완료되었습니다. 합계 ' + fmt(total) + '원');
      status.innerHTML = '인수 <b>' + list.length + '개</b>가 drinks 튜플 하나로 묶여 들어갔어요. 할인율은 ' + (disc.value ? '<b>' + d + '</b>을 직접 넣었어요.' : '안 줘서 <b>기본값 0</b>이 쓰였어요.');
    });
    render(); status.innerHTML = '음료 버튼을 눌러 인수를 늘린 뒤 <b>함수 호출하기</b>를 눌러 보세요. 아무것도 고르지 않고 불러도 돼요.';
  })();

  /* ---- 로봇 공장 (클래스와 객체) ---- */
  (function () {
    var root = labRoot('lab-class'); if (!root) return;
    var wrap = root.querySelector('[data-robots]'), out = root.querySelector('[data-out]'), status = root.querySelector('[data-status]'),
        robots = [], names = 'ABCDEF';
    function render() {
      wrap.innerHTML = '';
      robots.forEach(function (r, i) {
        var d = document.createElement('div'); d.className = 'lx-robot';
        d.innerHTML = '<b>robot' + (i + 1) + '</b><span>name = \'' + r.name + '\'</span><span>speed = <i>' + r.speed + '</i></span>' +
          '<div><button class="btn" data-m="speak" data-i="' + i + '">speak()</button><button class="btn" data-m="walk" data-i="' + i + '">walk()</button>' +
          '<button class="btn" data-m="run" data-i="' + i + '">run()</button><button class="btn" data-m="up" data-i="' + i + '">change_speed()</button></div>';
        wrap.appendChild(d);
      });
    }
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]'); if (!b) return;
      var i = +b.dataset.i, r = robots[i], m = b.dataset.m, call = 'robot' + (i + 1) + '.' + (m === 'up' ? 'change_speed' : m) + '()', msg;
      if (m === 'speak') msg = r.name + '가 말합니다.';
      else if (m === 'walk') { r.speed = 3; msg = r.name + '가 3km/h로 걷습니다.'; }
      else if (m === 'run') { r.speed = 10; msg = r.name + '가 10km/h로 달립니다.'; }
      else { r.speed += 1; msg = r.name + '의 속도 ' + r.speed + 'km/h로 변경.'; }
      outLine(out, '<span class="p">' + call + '</span> → ' + msg); render();
      status.innerHTML = '<code>' + call + '</code>에서 self는 <b>robot' + (i + 1) + '</b>을 가리켜요. 그래서 이 로봇의 speed만 바뀌었어요.';
    });
    labAct(root, function (act) {
      if (act === 'reset') { robots = []; out.innerHTML = ''; render(); status.innerHTML = '모든 객체를 없앴어요.'; return; }
      if (robots.length >= 4) { status.innerHTML = '이 체험에서는 4대까지만 만들 수 있어요.'; return; }
      var r = { name: '로봇' + names[robots.length], speed: 0 }; robots.push(r);
      outLine(out, '<span class="p">robot' + robots.length + " = Robot('" + r.name + "')</span> → __init__ 실행: name, speed = 0");
      render(); status.innerHTML = '설계도(클래스) 하나로 객체 <b>' + robots.length + '개</b>를 만들었어요. 객체마다 자기 속성을 따로 가져요.';
    });
    status.innerHTML = '<b>Robot() 객체 만들기</b>를 눌러 로봇을 만들어 보세요.';
  })();

  /* ---- 프랙털 나무 ---- */
  (function () {
    var root = labRoot('lab-ftree'); if (!root) return;
    var svg = root.querySelector('[data-svg]'), dep = root.querySelector('[data-depth]'), ang = root.querySelector('[data-angle]'), rat = root.querySelector('[data-ratio]'),
        dl = root.querySelector('[data-dl]'), al = root.querySelector('[data-al]'), rl = root.querySelector('[data-rl]'),
        calls = root.querySelector('[data-calls]'), lines = root.querySelector('[data-lines]'), status = root.querySelector('[data-status]');
    function draw() {
      var D = +dep.value, A = +ang.value * Math.PI / 180, R = +rat.value / 100, segs = [], c = 0;
      function tree(x, y, len, dir, depth) {
        c++;
        if (depth === 0) return;
        var x2 = x + len * Math.cos(dir), y2 = y - len * Math.sin(dir);
        segs.push('<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
          '" stroke-width="' + Math.max(0.6, depth * 0.9).toFixed(1) + '" class="' + (depth === D ? 'sv-line' : 'sv-a') + '"/>');
        tree(x2, y2, len * R, dir + A, depth - 1);
        tree(x2, y2, len * R, dir - A, depth - 1);
      }
      tree(300, 320, 85, Math.PI / 2, D);
      svg.innerHTML = segs.join('');
      dl.textContent = D; al.textContent = ang.value; rl.textContent = R.toFixed(2);
      calls.textContent = fmt(c); lines.textContent = fmt(segs.length);
      status.innerHTML = D === 0 ? '깊이 0이면 <b>기본 단계</b>라서 아무것도 그리지 않고 바로 끝나요.' :
        '깊이 ' + D + ' — 가지 <b>' + fmt(segs.length) + '개</b> (2<sup>' + D + '</sup> − 1). 함수는 ' + fmt(c) + '번 불렸어요. 깊이 0으로 불린 ' + fmt(c - segs.length) + '번은 그리지 않고 바로 끝난 호출이에요.';
    }
    [dep, ang, rat].forEach(function (e) { e.addEventListener('input', draw); });
    draw();
  })();

  /* ---- 넣을까 말까 (부분 집합) ---- */
  (function () {
    var root = labRoot('lab-comb'); if (!root) return;
    var rows = root.querySelector('[data-rows]'), res = root.querySelector('[data-res]'), found = root.querySelector('[data-found]'),
        listEl = root.querySelector('[data-list]'), sel = root.querySelector('[data-str]'), status = root.querySelector('[data-status]'), pick, seen;
    function cur() { var s = sel.value, r = ''; for (var i = 0; i < s.length; i++) if (pick[i]) r += s[i]; return r; }
    function render() {
      var s = sel.value, r = cur(); rows.innerHTML = '';
      for (var i = 0; i < s.length; i++) {
        var d = document.createElement('div'); d.className = 'lx-cstep';
        d.innerHTML = '<span>idx ' + i + ' · <b>' + s[i] + '</b></span><button type="button" class="btn' + (pick[i] ? '' : ' btn-p') + '" data-i="' + i + '" data-v="0">빼기</button>' +
          '<button type="button" class="btn' + (pick[i] ? ' btn-p' : '') + '" data-i="' + i + '" data-v="1">넣기</button>';
        rows.appendChild(d);
      }
      seen[r] = 1;
      var total = Math.pow(2, s.length), keys = Object.keys(seen);
      res.textContent = "'" + r + "'"; found.textContent = keys.length + ' / ' + total;
      listEl.innerHTML = keys.sort(function (a, b) { return a.length - b.length || (a < b ? -1 : 1); }).map(function (k) { return '<span class="lx-chip">' + (k || '∅') + '</span>'; }).join('');
      status.innerHTML = keys.length === total ? '<b>' + total + '가지를 모두 찾았어요!</b> 재귀 함수 <code>comb()</code>는 글자마다 “빼는 경우”와 “넣는 경우”로 자기 자신을 두 번 불러 이 ' + total + '가지를 빠짐없이 만들어요.' :
        '지금 조합은 <b>\'' + r + '\'</b>. 아직 ' + (total - keys.length) + '가지가 남았어요.';
    }
    function reset() { pick = []; seen = {}; for (var i = 0; i < sel.value.length; i++) pick.push(false); render(); }
    rows.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b) return; pick[+b.dataset.i] = b.dataset.v === '1'; render(); });
    sel.addEventListener('change', reset); labAct(root, reset); reset();
  })();

  /* ---- 숫자 맞히기 ---- */
  (function () {
    var root = labRoot('lab-guess'); if (!root) return;
    var lo, hi, ans, tries, done, inp = root.querySelector('[data-guess]'), status = root.querySelector('[data-status]');
    function render() {
      root.querySelector('[data-lo]').textContent = lo; root.querySelector('[data-hi]').textContent = hi;
      var bar = root.querySelector('[data-bar]'); bar.style.left = (lo - 1) + '%'; bar.style.width = (hi - lo + 1) + '%';
      root.querySelector('[data-tries]').textContent = tries; root.querySelector('[data-left]').textContent = done ? 1 : hi - lo + 1;
    }
    function reset() { lo = 1; hi = 100; ans = 1 + Math.floor(Math.random() * 100); tries = 0; done = false; inp.value = 50; render(); status.innerHTML = '1부터 100 사이의 수를 하나 정했어요. 맞혀 보세요!'; }
    labAct(root, function (act) {
      if (act === 'new') return reset();
      if (done) { status.innerHTML = '이미 맞혔어요. <b>새 게임</b>을 눌러 주세요.'; return; }
      var g = parseInt(inp.value, 10);
      if (!(g >= 1 && g <= 100)) { status.innerHTML = '1부터 100 사이의 수를 넣어 주세요. (잘못된 입력은 횟수에 세지 않아요)'; return; }
      tries++;
      if (g === ans) { done = true; lo = hi = g; status.innerHTML = '<b>정답! ' + tries + '번 만에 맞혔어요.</b>' + (tries <= 7 ? ' 아주 잘했어요.' : ' 가운데 수를 고르면 7번 안에 맞힐 수 있어요.'); }
      else if (g < ans) { lo = Math.max(lo, g + 1); status.innerHTML = '<b>' + g + '</b>보다 <b>큰 수</b>예요. 남은 후보는 ' + lo + '~' + hi + '.'; inp.value = Math.floor((lo + hi) / 2); }
      else { hi = Math.min(hi, g - 1); status.innerHTML = '<b>' + g + '</b>보다 <b>작은 수</b>예요. 남은 후보는 ' + lo + '~' + hi + '.'; inp.value = Math.floor((lo + hi) / 2); }
      render();
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') root.querySelector('[data-act="go"]').click(); });
    reset();
  })();

  /* ---- 괄호 검사기 ---- */
  (function () {
    var root = labRoot('lab-bracket'); if (!root) return;
    var tape = root.querySelector('[data-tape]'), st = root.querySelector('[data-stack]'), expr = root.querySelector('[data-expr]'),
        status = root.querySelector('[data-status]'), pos, stack, done, bad;
    var PAIR = { ')': '(', ']': '[', '}': '{' };
    function render() {
      var s = expr.value; tape.innerHTML = '';
      for (var i = 0; i < s.length; i++) {
        var c = document.createElement('span'); var ch = s[i];
        c.className = 'lx-tc' + ('([{)]}'.indexOf(ch) >= 0 ? ' br' : '') + (i < pos ? ' read' : '') + (i === pos - 1 ? ' cur' : '') + (i === bad ? ' bad' : '');
        c.textContent = ch === ' ' ? '·' : ch; tape.appendChild(c);
      }
      st.innerHTML = stack.length ? stack.map(function (c) { return '<span class="lx-chip">' + esc(c) + '</span>'; }).join('') : '<span class="lx-sum">비어 있음</span>';
    }
    function reset() { pos = 0; stack = []; done = false; bad = -1; render(); status.innerHTML = '<b>한 글자 읽기</b>를 눌러 보세요. 여는 괄호는 스택에 넣고, 닫는 괄호가 나오면 맨 위의 것과 짝을 맞춰요.'; }
    function step() {
      if (done) return false;
      var s = expr.value;
      if (pos >= s.length) {
        done = true; render();
        status.innerHTML = stack.length ? '끝까지 읽었는데 스택에 <b>' + esc(stack.join(' ')) + '</b>가 남았어요. <b>False</b> — 여는 괄호와 닫는 괄호의 개수가 달라요(조건 ①).' :
          '끝까지 읽었고 스택이 비었어요. <b>True</b> — 괄호가 올바르게 짝지어졌어요!';
        return false;
      }
      var ch = s[pos++], msg;
      if ('([{'.indexOf(ch) >= 0) { stack.push(ch); msg = '<b>' + esc(ch) + '</b>는 여는 괄호 → push.'; }
      else if (PAIR[ch]) {
        if (!stack.length) { done = true; bad = pos - 1; render(); status.innerHTML = '<b>' + esc(ch) + '</b>를 읽었는데 스택이 비어 있어요. <b>False</b> — 닫는 괄호가 먼저 나왔어요(조건 ②).'; return false; }
        var top = stack.pop();
        if (top !== PAIR[ch]) { done = true; bad = pos - 1; render(); status.innerHTML = '<b>' + esc(ch) + '</b>를 읽고 pop했더니 <b>' + esc(top) + '</b>가 나왔어요. 종류가 달라요. <b>False</b> — 괄호가 엇갈렸어요(조건 ③).'; return false; }
        msg = '<b>' + esc(ch) + '</b>는 닫는 괄호 → pop한 <b>' + esc(top) + '</b>와 짝이 맞아요.';
      } else msg = '<b>' + esc(ch === ' ' ? '공백' : ch) + '</b>는 괄호가 아니라서 지나가요.';
      render(); status.innerHTML = msg; return true;
    }
    labAct(root, function (act) {
      if (act === 'step') step(); else if (act === 'all') { var g = 0; while (step() && g++ < 200) {} if (!done) step(); } else reset();
    });
    root.addEventListener('click', function (e) { var b = e.target.closest('[data-ex]'); if (!b) return; expr.value = b.dataset.ex; reset(); });
    expr.addEventListener('input', reset); reset();
  })();

  /* ---- 다리를 건너는 트럭 ---- */
  (function () {
    var root = labRoot('lab-truck'); if (!root) return;
    var L = 2, MAXW = 10, TR = [7, 4, 5, 6], waitQ, bridge, done, time, status = root.querySelector('[data-status]');
    function chip(t) { return '<span class="lx-chip">' + t + 'kg</span>'; }
    function weight() { return bridge.reduce(function (a, b) { return a + b; }, 0); }
    function render() {
      root.querySelector('[data-wait]').innerHTML = waitQ.length ? waitQ.map(chip).join('') : '<span class="lx-sum">없음</span>';
      root.querySelector('[data-done]').innerHTML = done.length ? done.map(chip).join('') : '<span class="lx-sum">없음</span>';
      root.querySelector('[data-bridge]').innerHTML = bridge.map(function (t) { return '<span class="lx-cell' + (t ? ' on' : '') + '">' + (t ? t + 'kg' : '빈칸') + '</span>'; }).join('');
      root.querySelector('[data-time]').textContent = time; root.querySelector('[data-weight]').textContent = weight();
    }
    function reset() { waitQ = TR.slice(); bridge = []; for (var i = 0; i < L; i++) bridge.push(0); done = []; time = 0; render(); status.innerHTML = '다리 길이 2칸, 무게 제한 10kg. <b>1초 진행</b>을 눌러 보세요.'; }
    function step() {
      if (!waitQ.length && !weight()) return false;
      time++;
      var off = bridge.shift(), msg = time + '초: ';
      if (off) { done.push(off); msg += off + 'kg 트럭이 다 건넜어요. '; }
      if (waitQ.length && weight() + waitQ[0] <= MAXW) { var t = waitQ.shift(); bridge.push(t); msg += t + 'kg 트럭이 다리에 올라갔어요.'; }
      else { bridge.push(0); if (waitQ.length) msg += waitQ[0] + 'kg 트럭은 무게(' + weight() + ' + ' + waitQ[0] + ' > 10) 때문에 기다려요.'; }
      render();
      status.innerHTML = (!waitQ.length && !weight()) ? '<b>모든 트럭이 ' + time + '초 만에 건넜어요!</b> 이것이 가장 짧은 시간이에요.' : msg;
      return true;
    }
    labAct(root, function (act) { if (act === 'step') step(); else if (act === 'all') { var g = 0; while (step() && g++ < 50) {} } else reset(); });
    reset();
  })();

  /* ---- 이진 탐색 트리 ---- */
  (function () {
    var root = labRoot('lab-bst'); if (!root) return;
    var svg = root.querySelector('[data-svg]'), val = root.querySelector('[data-val]'), status = root.querySelector('[data-status]'), tree, path, hit;
    function ins(v) {
      var p = [], n = tree;
      if (!n) { tree = { v: v }; return [v]; }
      while (true) {
        p.push(n.v);
        if (v === n.v) return null;
        var k = v < n.v ? 'l' : 'r';
        if (!n[k]) { n[k] = { v: v }; p.push(v); return p; }
        n = n[k];
      }
    }
    function depth(n) { return n ? 1 + Math.max(depth(n.l), depth(n.r)) : 0; }
    function render() {
      var h = [], d = depth(tree);
      function walk(n, x, y, span, lvl) {
        if (!n) return;
        var dy = Math.min(60, 250 / Math.max(1, d - 1 || 1));
        [['l', -1], ['r', 1]].forEach(function (k) {
          if (n[k[0]]) {
            var cx = x + k[1] * span, cy = y + dy, on = path.indexOf(n.v) >= 0 && path.indexOf(n[k[0]].v) >= 0;
            h.push('<line x1="' + x + '" y1="' + y + '" x2="' + cx + '" y2="' + cy + '" class="' + (on ? 'sv-a' : 'sv-line') + '"/>');
            walk(n[k[0]], cx, cy, span / 2, lvl + 1);
          }
        });
        var onp = path.indexOf(n.v) >= 0;
        h.push('<circle cx="' + x + '" cy="' + y + '" r="16" class="' + (n.v === hit ? 'sv-box-a' : onp ? 'sv-box-a' : 'sv-box') + '"' + (n.v === hit ? ' stroke-width="3"' : '') + '/>');
        h.push('<text x="' + x + '" y="' + (y + 5) + '" class="sv-t-b" text-anchor="middle">' + n.v + '</text>');
      }
      walk(tree, 320, 24, 150, 0);
      svg.setAttribute('viewBox', '0 0 640 ' + Math.max(120, Math.min(300, d * 60 + 20)));
      svg.innerHTML = h.join('') || '<text x="320" y="150" class="sv-t-s" text-anchor="middle">비어 있어요. 값을 넣어 보세요.</text>';
    }
    function reset() { tree = null; path = []; hit = null; render(); status.innerHTML = '값을 넣으면 루트부터 견주어 내려가며 자리를 찾아요.'; }
    function insert(v) {
      if (depth(tree) >= 6 && !ins.dry) { /* 깊이 제한 검사 */ }
      var p = ins(v); hit = v;
      if (!p) { path = []; status.innerHTML = '<b>' + v + '</b>는 이미 트리에 있어요.'; render(); return; }
      if (depth(tree) > 7) { status.innerHTML = '트리가 너무 깊어져서 그림이 작게 보일 수 있어요.'; }
      path = p; render();
      status.innerHTML = '<b>' + v + '</b> 넣기: ' + p.slice(0, -1).map(function (x) { return x + (v < x ? '보다 작아 왼쪽' : '보다 커서 오른쪽'); }).join(' → ') + (p.length > 1 ? ' → ' : '') + '빈자리에 저장. (트리 높이 ' + (depth(tree) - 1) + ')';
    }
    labAct(root, function (act) {
      var v = parseInt(val.value, 10);
      if (act === 'reset') return reset();
      if (act === 'sample' || act === 'sorted') { reset(); (act === 'sample' ? [8, 3, 5, 10, 2, 14] : [1, 2, 3, 4, 5]).forEach(function (x) { ins(x); }); path = []; hit = null; render();
        status.innerHTML = act === 'sample' ? '8, 3, 5, 10, 2, 14를 차례로 넣었어요. 이제 값을 찾아보세요.' : '1, 2, 3, 4, 5를 차례로 넣었더니 오른쪽으로만 늘어진 <b>한쪽으로 쏠린 트리</b>가 됐어요. 5를 찾으려면 5번이나 견주어야 해요.'; return; }
      if (!(v >= 1 && v <= 99)) { status.innerHTML = '1부터 99 사이의 수를 넣어 주세요.'; return; }
      if (act === 'insert') return insert(v);
      var n = tree, p = [], c = 0;
      while (n) { c++; p.push(n.v); if (v === n.v) break; n = v < n.v ? n.l : n.r; }
      path = p; hit = n ? v : null; render();
      status.innerHTML = n ? '<b>' + v + '</b>를 <b>' + c + '번</b> 견주어 찾았어요: ' + p.join(' → ') : '<b>' + v + '</b>는 없어요. ' + c + '번 견주어 빈자리에 닿았어요: ' + (p.join(' → ') || '빈 트리');
    });
    reset();
  })();

  /* ---- 그래프 그리기 (인접 행렬·리스트) ---- */
  (function () {
    var root = labRoot('lab-adj'); if (!root) return;
    var svg = root.querySelector('[data-svg]'), mat = root.querySelector('[data-mat]'), lst = root.querySelector('[data-list]'),
        dir = root.querySelector('[data-dir]'), status = root.querySelector('[data-status]');
    var N = ['A', 'B', 'C', 'D', 'E'], P = [[150, 35], [265, 115], [222, 225], [78, 225], [35, 115]], E, sel = null;
    function has(a, b) { return E.some(function (e) { return e[0] === a && e[1] === b || (!dir.checked && e[0] === b && e[1] === a); }); }
    function render() {
      var h = '<defs><marker id="lx-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>';
      E.forEach(function (e) {
        var a = P[e[0]], b = P[e[1]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
        h += '<line x1="' + (a[0] + ux * 20) + '" y1="' + (a[1] + uy * 20) + '" x2="' + (b[0] - ux * 21) + '" y2="' + (b[1] - uy * 21) + '" class="sv-line"' + (dir.checked ? ' marker-end="url(#lx-arrow)"' : '') + '/>';
      });
      P.forEach(function (p, i) {
        h += '<g data-n="' + i + '" style="cursor:pointer"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="19" class="' + (sel === i ? 'sv-box-a' : 'sv-box') + '"/><text x="' + p[0] + '" y="' + (p[1] + 5) + '" class="sv-t-b" text-anchor="middle">' + N[i] + '</text></g>';
      });
      svg.innerHTML = h;
      var t = '<tr><th></th>' + N.map(function (n) { return '<th>' + n + '</th>'; }).join('') + '</tr>', ones = 0, ltxt = [];
      for (var i = 0; i < 5; i++) {
        t += '<tr><th>' + N[i] + '</th>'; var row = [];
        for (var j = 0; j < 5; j++) { var v = has(i, j) ? 1 : 0; ones += v; if (v) row.push(N[j]); t += '<td class="' + (v ? 'done' : '') + '">' + v + '</td>'; }
        t += '</tr>'; ltxt.push('[' + N[i] + ']: ' + (row.join(' ') || '(없음)'));
      }
      mat.innerHTML = t; lst.textContent = '인접 리스트\n' + ltxt.join('\n');
      root.querySelector('[data-links]').textContent = E.length; root.querySelector('[data-ones]').textContent = ones;
    }
    svg.addEventListener('click', function (e) {
      var g = e.target.closest('[data-n]'); if (!g) return; var i = +g.dataset.n;
      if (sel === null) { sel = i; render(); status.innerHTML = '<b>' + N[i] + '</b>를 골랐어요. 이을 노드를 하나 더 누르세요.'; return; }
      if (sel === i) { sel = null; render(); status.innerHTML = '선택을 취소했어요.'; return; }
      var a = sel, b = i, k = -1;
      E.forEach(function (x, idx) { if ((x[0] === a && x[1] === b) || (!dir.checked && x[0] === b && x[1] === a)) k = idx; });
      if (k >= 0) { E.splice(k, 1); status.innerHTML = N[a] + '–' + N[b] + ' 링크를 지웠어요.'; }
      else { E.push([a, b]); status.innerHTML = dir.checked ? N[a] + '→' + N[b] + ' 화살표를 만들었어요. 행렬에서는 <b>' + N[a] + '줄 ' + N[b] + '칸 한쪽에만</b> 1이 생겨요.' :
        N[a] + '–' + N[b] + ' 링크를 만들었어요. 무방향이라 행렬의 <b>양쪽(' + N[a] + '줄 ' + N[b] + '칸, ' + N[b] + '줄 ' + N[a] + '칸)</b>에 1이 생겨요.'; }
      sel = null; render();
    });
    dir.addEventListener('change', function () { E = []; sel = null; render(); status.innerHTML = dir.checked ? '방향 그래프로 바꿨어요. 먼저 누른 노드에서 나중에 누른 노드로 화살표가 생겨요.' : '무방향 그래프로 바꿨어요.'; });
    labAct(root, function (act) {
      sel = null;
      if (act === 'reset') E = [];
      else if (act === 'sample') { dir.checked = false; E = [[0, 1], [0, 3], [1, 2], [1, 3], [2, 4]]; }
      else { E = []; for (var i = 0; i < 5; i++) for (var j = 0; j < 5; j++) if (i !== j && (dir.checked || i < j)) E.push([i, j]); }
      render();
      status.innerHTML = act === 'complete' ? '완전 그래프예요. 노드 5개일 때 링크는 ' + (dir.checked ? '5 × 4 = 20개' : '5 × 4 / 2 = 10개') + '. 행렬이 대각선만 빼고 꽉 찼어요.' :
        act === 'sample' ? '교과서의 탐색 예제 그래프예요(A–B, A–D, B–C, B–D, C–E). 행렬의 0이 아닌 칸이 링크 수의 두 배인 까닭은 무엇일까요?' : '모두 지웠어요.';
    });
    E = []; render(); status.innerHTML = '노드를 두 개 차례로 눌러 선을 이어 보세요.';
  })();

  /* ---- DFS와 BFS ---- */
  (function () {
    var root = labRoot('lab-search'); if (!root) return;
    var svg = root.querySelector('[data-svg]'), mode = root.querySelector('[data-mode]'), start = root.querySelector('[data-start]'),
        boxEl = root.querySelector('[data-box]'), boxLabel = root.querySelector('[data-boxlabel]'), orderEl = root.querySelector('[data-order]'), status = root.querySelector('[data-status]');
    var N = ['A', 'B', 'C', 'D', 'E'], P = [[70, 115], [200, 45], [340, 45], [200, 185], [470, 115]];
    var ADJ = [[1, 3], [0, 2, 3], [1, 4], [0, 1], [2]], EDGES = [[0, 1], [0, 3], [1, 2], [1, 3], [2, 4]];
    var box, visited, order, from, cur;
    function render() {
      var h = '';
      EDGES.forEach(function (e) { var on = from[e[1]] === e[0] || from[e[0]] === e[1]; h += '<line x1="' + P[e[0]][0] + '" y1="' + P[e[0]][1] + '" x2="' + P[e[1]][0] + '" y2="' + P[e[1]][1] + '" class="' + (on ? 'sv-a' : 'sv-mute') + '"' + (on ? ' stroke-width="3"' : '') + '/>'; });
      P.forEach(function (p, i) {
        var k = order.indexOf(i);
        h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="24" class="' + (i === cur ? 'sv-box-a' : 'sv-box') + '"' + (k >= 0 ? ' stroke-width="3"' : '') + '/>';
        h += '<text x="' + p[0] + '" y="' + (p[1] + 5) + '" class="sv-t-b" text-anchor="middle">' + N[i] + '</text>';
        if (k >= 0) h += '<text x="' + (p[0] + 26) + '" y="' + (p[1] - 20) + '" class="sv-t-a">' + (k + 1) + '</text>';
      });
      svg.innerHTML = h;
      boxLabel.textContent = mode.value === 'dfs' ? '스택 (오른쪽이 top)' : '큐 (왼쪽이 front)';
      boxEl.innerHTML = box.length ? box.map(function (i) { return '<span class="lx-chip">' + N[i] + '</span>'; }).join('') : '<span class="lx-sum">비어 있음</span>';
      orderEl.innerHTML = order.map(function (i) { return '<span class="lx-chip">' + N[i] + '</span>'; }).join('') || '<span class="lx-sum">아직 없음</span>';
    }
    function reset() {
      var s = N.indexOf(start.value); visited = {}; from = {}; order = [s]; visited[s] = 1; box = [s]; cur = s; render();
      status.innerHTML = '<b>' + N[s] + '</b>를 방문하고 ' + (mode.value === 'dfs' ? '스택' : '큐') + '에 넣었어요. <b>다음 단계</b>를 눌러 보세요.';
    }
    function step() {
      if (!box.length) return false;
      if (mode.value === 'dfs') {
        var top = box[box.length - 1], nxt = ADJ[top].filter(function (j) { return !visited[j]; })[0];
        cur = top;
        if (nxt === undefined) { box.pop(); cur = box.length ? box[box.length - 1] : null; render();
          status.innerHTML = box.length ? '<b>' + N[top] + '</b>에서 더 갈 곳이 없어요 → 스택에서 꺼내고(pop) <b>' + N[box[box.length - 1]] + '</b>로 되돌아가요.' : '<b>' + N[top] + '</b>도 꺼내서 스택이 비었어요. <b>탐색 끝!</b> 방문 순서: ' + order.map(function (i) { return N[i]; }).join(' → ');
          return box.length > 0; }
        visited[nxt] = 1; from[nxt] = top; order.push(nxt); box.push(nxt); cur = nxt; render();
        status.innerHTML = '<b>' + N[top] + '</b>와 이어진 곳 가운데 아직 안 간 <b>' + N[nxt] + '</b>로 들어가요 → 방문하고 스택에 push.';
        return true;
      }
      var c = box.shift(), added = [];
      cur = c;
      ADJ[c].forEach(function (j) { if (!visited[j]) { visited[j] = 1; from[j] = c; order.push(j); box.push(j); added.push(N[j]); } });
      render();
      status.innerHTML = box.length || added.length ? '큐의 맨 앞 <b>' + N[c] + '</b>를 꺼내고, 이어진 곳 가운데 안 간 ' + (added.length ? '<b>' + added.join(', ') + '</b>를 모두 방문해 큐에 넣었어요.' : '곳이 없어요.') :
        '큐가 비었어요. <b>탐색 끝!</b> 방문 순서: ' + order.map(function (i) { return N[i]; }).join(' → ');
      if (!box.length && added.length === 0) return false;
      return true;
    }
    labAct(root, function (act) {
      if (act === 'step') { if (!step() && !box.length) status.innerHTML = status.innerHTML.indexOf('끝') >= 0 ? status.innerHTML : '<b>탐색 끝!</b> 방문 순서: ' + order.map(function (i) { return N[i]; }).join(' → '); }
      else if (act === 'all') { var g = 0; while (box.length && g++ < 40) step(); status.innerHTML = '<b>탐색 끝!</b> 방문 순서: ' + order.map(function (i) { return N[i]; }).join(' → '); }
      else reset();
    });
    mode.addEventListener('change', reset); start.addEventListener('change', reset); reset();
  })();

  /* ---- 미로 탐색 ---- */
  (function () {
    var root = labRoot('lab-maze'); if (!root) return;
    var grid = root.querySelector('[data-grid]'), mode = root.querySelector('[data-mode]'), status = root.querySelector('[data-status]');
    var M = [[0, 1, 0, 0, 0, 0], [0, 1, 0, 1, 1, 0], [0, 0, 0, 1, 0, 0], [1, 1, 0, 1, 0, 1], [0, 0, 0, 0, 0, 1], [0, 1, 1, 1, 0, 0]];
    var S = [0, 0], G = [5, 5], box, seen, num, count, done, cur;
    function key(p) { return p[0] + ',' + p[1]; }
    function render() {
      grid.innerHTML = '';
      for (var r = 0; r < 6; r++) for (var c = 0; c < 6; c++) {
        var d = document.createElement('span'), k = r + ',' + c, inBox = box.some(function (p) { return p[0] === r && p[1] === c; });
        d.className = 'lx-mc' + (M[r][c] ? ' wall' : '') + (num[k] ? ' seen' : '') + (inBox ? ' wait' : '') + (cur && cur[0] === r && cur[1] === c ? ' cur' : '');
        d.textContent = (r === S[0] && c === S[1]) ? '입구' : (r === G[0] && c === G[1]) ? (num[k] || '출구') : (num[k] || '');
        grid.appendChild(d);
      }
      root.querySelector('[data-visited]').textContent = count;
      root.querySelector('[data-box]').textContent = box.length;
      root.querySelector('[data-boxlabel]').textContent = (mode.value === 'dfs' ? '스택' : '큐') + '에 든 칸 수';
    }
    function reset() { box = [S]; seen = {}; seen[key(S)] = 1; num = {}; count = 0; done = false; cur = null; render(); status.innerHTML = '입구 칸을 ' + (mode.value === 'dfs' ? '스택' : '큐') + '에 넣었어요. <b>한 칸 살펴보기</b>를 눌러 보세요.'; }
    function step() {
      if (done || !box.length) return false;
      var p = mode.value === 'dfs' ? box.pop() : box.shift(); cur = p; count++; num[key(p)] = count;
      if (p[0] === G[0] && p[1] === G[1]) { done = true; render(); status.innerHTML = '<b>출구 도착!</b> ' + count + '칸을 살펴봤어요. ' + (mode.value === 'dfs' ? '이번에는 큐(너비 우선)로도 해 보세요.' : '이번에는 스택(깊이 우선)으로도 해 보세요.'); return false; }
      var add = [];
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) {
        var q = [p[0] + d[0], p[1] + d[1]];
        if (q[0] >= 0 && q[0] < 6 && q[1] >= 0 && q[1] < 6 && !M[q[0]][q[1]] && !seen[key(q)]) { seen[key(q)] = 1; box.push(q); add.push('(' + q[0] + ',' + q[1] + ')'); }
      });
      render();
      status.innerHTML = '(' + p[0] + ',' + p[1] + ') 칸을 살펴봤어요. ' + (add.length ? '갈 수 있는 이웃 ' + add.join(' ') + '를 ' + (mode.value === 'dfs' ? '스택' : '큐') + '에 넣었어요.' : '더 갈 수 있는 새 칸이 없어요.');
      return true;
    }
    labAct(root, function (act) { if (act === 'step') step(); else if (act === 'all') { var g = 0; while (step() && g++ < 60) {} } else reset(); });
    mode.addEventListener('change', reset); reset();
  })();

  /* ============ 코딩 활동 위젯 (따라가기 · 빈칸 · 순서 · 예측) ============ */
  (function () {
    function h(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function data(el) { try { return JSON.parse(el.getAttribute('data-w')); } catch (e) { return null; } }

    /* ---- 코드 따라가기 ---- */
    function initTrace(el, d) {
      var body = el.querySelector('.wact-body'), i = 0, timer = null, N = d.steps.length;
      body.innerHTML =
        '<div class="tr-grid"><ol class="tr-code"></ol><div class="tr-side">' +
        '<div class="tr-note" aria-live="polite"></div><div class="tr-vars"></div>' +
        '<div class="tr-outwrap"><span>출력</span><pre class="tr-out"></pre></div></div></div>' +
        '<div class="tr-ctrl"><button type="button" class="btn" data-t="first">처음</button>' +
        '<button type="button" class="btn" data-t="prev">◀ 이전</button>' +
        '<button type="button" class="btn btn-p" data-t="next">다음 ▶</button>' +
        '<button type="button" class="btn" data-t="auto">자동 재생</button>' +
        '<span class="tr-count"></span></div>';
      var codeEl = body.querySelector('.tr-code');
      d.code.forEach(function (line, k) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="tr-ln">' + (k + 1) + '</span><code>' + (h(line) || ' ') + '</code>';
        codeEl.appendChild(li);
      });
      var lis = codeEl.children, noteEl = body.querySelector('.tr-note'), varsEl = body.querySelector('.tr-vars'),
          outEl = body.querySelector('.tr-out'), cntEl = body.querySelector('.tr-count'), prevLine = 0;
      function varsHtml(st, prev) {
        var old = {};
        if (prev) prev.s.forEach(function (fr, fi) { fr[1].forEach(function (v) { old[fi + ':' + v[0]] = v[1]; }); });
        return st.s.map(function (fr, fi) {
          var rows = fr[1].map(function (v) {
            var changed = prev && old[fi + ':' + v[0]] !== v[1];
            return '<tr' + (changed ? ' class="chg"' : '') + '><td>' + h(v[0]) + '</td><td>' + h(v[1]) + '</td></tr>';
          }).join('');
          return '<div class="tr-frame' + (fi === st.s.length - 1 ? ' top' : '') + '"><b>' + h(fr[0]) + '</b>' +
            (rows ? '<table>' + rows + '</table>' : '<em>변수 없음</em>') + '</div>';
        }).join('');
      }
      function show() {
        var st = d.steps[i], prev = i ? d.steps[i - 1] : null;
        for (var k = 0; k < lis.length; k++) lis[k].className = '';
        if (prev && prev.l) lis[prev.l - 1].className = 'was';
        if (st.l) { lis[st.l - 1].className = st.k === 'ret' ? 'ret' : 'now'; }
        var note;
        if (st.k === 'end') note = '<b>프로그램이 끝났어요.</b> 처음부터 다시 보거나, 다른 값으로 바꿔 생각해 보세요.';
        else if (st.k === 'ret') note = '<b>' + h(st.s[st.s.length - 1][0]) + '</b> 함수가 끝나고 <b>' + h(st.r) + '</b>을(를) 돌려줘요. 부른 곳으로 되돌아가요.';
        else note = (d.notes[st.l] ? h(d.notes[st.l]) : '<span class="tr-dim">' + st.l + '번 줄을 실행할 차례예요.</span>');
        if (st.k === 'line' && st.s.length > 1) note = '<span class="tr-where">' + h(st.s[st.s.length - 1][0]) + ' 안</span> ' + note;
        noteEl.innerHTML = note;
        varsEl.innerHTML = varsHtml(st, prev);
        outEl.textContent = st.o || '';
        cntEl.textContent = (i + 1) + ' / ' + N;
        if (st.l && lis[st.l - 1].scrollIntoView && codeEl.scrollHeight > codeEl.clientHeight) {
          var top = lis[st.l - 1].offsetTop - codeEl.offsetTop;
          if (top < codeEl.scrollTop || top > codeEl.scrollTop + codeEl.clientHeight - 30) codeEl.scrollTop = top - 40;
        }
      }
      function stop() { if (timer) { clearInterval(timer); timer = null; body.querySelector('[data-t="auto"]').textContent = '자동 재생'; } }
      body.addEventListener('click', function (e) {
        var b = e.target.closest('[data-t]'); if (!b) return;
        var t = b.dataset.t;
        if (t === 'auto') {
          if (timer) return stop();
          if (i >= N - 1) i = 0;
          b.textContent = '멈춤';
          timer = setInterval(function () { if (i >= N - 1) return stop(); i++; show(); }, 900);
          return;
        }
        stop();
        if (t === 'first') i = 0; else if (t === 'prev') i = Math.max(0, i - 1); else i = Math.min(N - 1, i + 1);
        show();
      });
      show();
    }

    /* ---- 빈칸 채우기 ---- */
    function initFill(el, d) {
      var body = el.querySelector('.wact-body'), answers = [], htmlCode = '', rest = d.code, re = /⟦([^⟧]*)⟧/g, m, last = 0;
      while ((m = re.exec(d.code))) {
        htmlCode += h(d.code.slice(last, m.index));
        var alts = m[1].split('|'), w = Math.max(3, alts[0].length + 1);
        htmlCode += '<input type="text" class="fl-in" data-k="' + answers.length + '" size="' + w + '" autocomplete="off" spellcheck="false" aria-label="빈칸 ' + (answers.length + 1) + '">';
        answers.push(alts);
        last = re.lastIndex;
      }
      htmlCode += h(d.code.slice(last));
      body.innerHTML = '<pre class="fl-code">' + htmlCode + '</pre>' +
        '<div class="tr-ctrl"><button type="button" class="btn btn-p" data-f="check">채점하기</button>' +
        '<button type="button" class="btn" data-f="hint">첫 글자 힌트</button>' +
        '<button type="button" class="btn" data-f="show">정답 보기</button>' +
        '<button type="button" class="btn" data-f="reset">다시 하기</button></div>' +
        '<p class="w-msg" aria-live="polite">빈칸 ' + answers.length + '개를 채우고 <b>채점하기</b>를 눌러 보세요.</p>';
      var ins = body.querySelectorAll('.fl-in'), msg = body.querySelector('.w-msg');
      function norm(s) { return s.replace(/\s+/g, '').replace(/"/g, "'"); }
      body.addEventListener('click', function (e) {
        var b = e.target.closest('[data-f]'); if (!b) return;
        var f = b.dataset.f, ok = 0;
        [].forEach.call(ins, function (inp, k) {
          var a = answers[k];
          if (f === 'reset') { inp.value = ''; inp.className = 'fl-in'; return; }
          if (f === 'show') { inp.value = a[0]; inp.className = 'fl-in shown'; return; }
          if (f === 'hint') { if (!inp.value) inp.value = a[0].charAt(0); return; }
          var good = a.some(function (x) { return norm(x) === norm(inp.value); });
          inp.className = 'fl-in ' + (good ? 'ok' : 'no');
          if (good) ok++;
        });
        if (f === 'check') msg.innerHTML = ok === ins.length ? '<b>모두 맞았어요! 🎉</b> 이제 이 코드가 어떻게 동작하는지 말로 설명해 보세요.' :
          '<b>' + ins.length + '개 중 ' + ok + '개</b> 맞았어요. 붉은 칸을 다시 생각해 보세요.';
        else if (f === 'show') msg.innerHTML = '정답을 채웠어요. 왜 이 답인지 한 줄씩 짚어 보세요.';
        else if (f === 'hint') msg.innerHTML = '빈칸에 첫 글자를 넣어 두었어요.';
        else msg.innerHTML = '빈칸을 비웠어요.';
      });
      body.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.classList.contains('fl-in')) { e.preventDefault(); body.querySelector('[data-f="check"]').click(); }
      });
    }

    /* ---- 순서 맞추기 ---- */
    function initParsons(el, d) {
      var body = el.querySelector('.wact-body'), order;
      body.innerHTML = '<ol class="ps-list"></ol><div class="tr-ctrl"><button type="button" class="btn btn-p" data-p="check">확인하기</button>' +
        '<button type="button" class="btn" data-p="shuffle">다시 섞기</button><button type="button" class="btn" data-p="show">정답 보기</button></div>' +
        '<p class="w-msg" aria-live="polite">줄 오른쪽의 ▲▼ 버튼으로 줄을 옮겨 바른 순서로 맞춰 보세요. 들여쓰기는 그대로 두었어요.</p>';
      var list = body.querySelector('.ps-list'), msg = body.querySelector('.w-msg');
      function render(marks) {
        list.innerHTML = '';
        order.forEach(function (k, pos) {
          var li = document.createElement('li');
          li.className = marks ? (d.lines[k] === d.lines[pos] ? 'ok' : 'no') : '';
          li.innerHTML = '<code>' + h(d.lines[k]) + '</code><span><button type="button" class="btn" data-m="-1" data-pos="' + pos + '" aria-label="위로">▲</button>' +
            '<button type="button" class="btn" data-m="1" data-pos="' + pos + '" aria-label="아래로">▼</button></span>';
          list.appendChild(li);
        });
      }
      function shuffle() {
        order = d.lines.map(function (_, k) { return k; });
        do { for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; } }
        while (order.length > 2 && order.every(function (k, p) { return d.lines[k] === d.lines[p]; }));
        render();
      }
      body.addEventListener('click', function (e) {
        var mv = e.target.closest('[data-m]');
        if (mv) {
          var p = +mv.dataset.pos, q = p + (+mv.dataset.m);
          if (q < 0 || q >= order.length) return;
          var t = order[p]; order[p] = order[q]; order[q] = t; render();
          var btn = list.children[q] && list.children[q].querySelector('[data-m="' + mv.dataset.m + '"]'); if (btn) btn.focus();
          return;
        }
        var b = e.target.closest('[data-p]'); if (!b) return;
        if (b.dataset.p === 'shuffle') { shuffle(); msg.innerHTML = '다시 섞었어요.'; return; }
        if (b.dataset.p === 'show') { order = d.lines.map(function (_, k) { return k; }); render(true); msg.innerHTML = '이것이 바른 순서예요. 왜 이 순서여야 하는지 생각해 보세요.'; return; }
        var right = order.filter(function (k, p) { return d.lines[k] === d.lines[p]; }).length;
        render(true);
        msg.innerHTML = right === order.length ? '<b>완벽해요! 🎉</b> 바른 순서예요.' : '<b>' + order.length + '줄 중 ' + right + '줄</b>이 제자리에 있어요. 붉은 줄의 위치를 다시 생각해 보세요.';
      });
      shuffle();
    }

    /* ---- 결과 예측 ---- */
    function initPredict(el, d) {
      var body = el.querySelector('.wact-body');
      body.innerHTML = '<pre class="pd-code">' + h(d.code) + '</pre><p class="pd-q">이 코드를 실행하면 무엇이 출력될까요? 먼저 골라 보세요.</p>' +
        '<div class="pd-opts">' + d.opts.map(function (o, k) { return '<button type="button" class="pd-opt" data-o="' + k + '"><b>' + '①②③④⑤⑥'.charAt(k) + '</b> <span>' + h(o).replace(/\\n/g, '<br>') + '</span></button>'; }).join('') + '</div>' +
        '<p class="w-msg" aria-live="polite"></p>';
      var msg = body.querySelector('.w-msg'), done = false;
      body.addEventListener('click', function (e) {
        var b = e.target.closest('[data-o]'); if (!b) return;
        var k = +b.dataset.o;
        if (k === d.ans) {
          done = true;
          [].forEach.call(body.querySelectorAll('.pd-opt'), function (x) { x.disabled = true; });
          b.classList.add('ok');
          msg.innerHTML = '<b>정답이에요!</b> ' + h(d.exp);
        } else {
          b.classList.add('no'); b.disabled = true;
          msg.innerHTML = '아니에요. 코드를 한 줄씩 다시 따라가 보세요.';
        }
      });
    }

    [].forEach.call(document.querySelectorAll('.wact'), function (el) {
      var d = data(el); if (!d) return;
      if (el.classList.contains('w-trace')) initTrace(el, d);
      else if (el.classList.contains('w-fill')) initFill(el, d);
      else if (el.classList.contains('w-parsons')) initParsons(el, d);
      else if (el.classList.contains('w-predict')) initPredict(el, d);
    });
  })();
})();

/* ============ 파이썬 코드 실행기 ============ */
(function () {
  'use strict';
  var pres = [].slice.call(document.querySelectorAll('pre[data-run], pre[data-blanks]'));
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
  // 빈칸(<input class="blank">)이 든 코드는 학생이 채운 값으로 코드를 만든다
  function codeText(pre) {
    if (!pre.querySelector('input.blank')) return pre.textContent;
    var c = pre.cloneNode(true);
    [].forEach.call(c.querySelectorAll('input.blank'), function (inp, i) {
      var v = pre.querySelectorAll('input.blank')[i].value;
      inp.replaceWith(document.createTextNode(v === '' ? '___' : v));
    });
    return c.textContent;
  }
  window.codeText = codeText;
  function norm(t) { return String(t).replace(/\r/g, '').split('\n').map(function (l) { return l.replace(/\s+$/, ''); }).join('\n').replace(/^\n+|\n+$/g, ''); }
  // 무한 반복 막기: 줄 실행 수가 너무 많으면 TimeoutError로 멈춘다
  // (메인 스레드에서 돌기 때문에 멈추지 않으면 탭 전체가 얼어 버린다)
  var guardFns = null;
  function guard(py, on) {
    if (!guardFns) guardFns = py.runPython([
      'import sys',
      'def _is_guard(on, limit=3000000):',
      '    if not on:',
      '        sys.settrace(None); return',
      '    n = [0]',
      '    def tr(frame, ev, arg):',
      '        n[0] += 1',
      '        if n[0] > limit:',
      '            sys.settrace(None)',
      '            raise TimeoutError("코드가 너무 오래 돌아서 멈췄어요. 끝나지 않는 반복(while)이 없는지 확인해 보세요.")',
      '        return tr',
      '    sys.settrace(tr)',
      '_is_guard'].join('\n'));
    guardFns(on);
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
      var code = codeText(pre);
      return ensureExtraPackages(py, code).then(function () {
        py.setStdin({ stdin: function () { return i < lines.length ? lines[i++] : ''; } });
        py.setStdout({ batched: function (s) { buf.push(s); } });
        py.setStderr({ batched: function (s) { buf.push(s); } });
        guard(py, true);
        return py.runPythonAsync(code, { globals: globalsOf(py) })
          .finally(function () { guard(py, false); });
      }).then(function () {
        out.className = 'runner-out';
        out.textContent = withInputSummary(buf.length ? buf.join(NL) : '(출력 없음)');
        // 실습 과제: 기대 출력과 같으면 정답 표시
        if (pre.hasAttribute('data-expect')) {
          var ok = norm(buf.join(NL)) === norm(pre.getAttribute('data-expect'));
          out.className = 'runner-out ' + (ok ? 'pass' : 'fail');
          out.textContent += NL + NL + (ok ? '✓ 정답이에요! 출력이 기대한 결과와 같아요.' : '✗ 아직이에요. 기대한 출력:' + NL + pre.getAttribute('data-expect'));
          var task = pre.closest('.task');
          if (task) {
            task.classList.toggle('is-pass', ok);
            if (ok) task.dispatchEvent(new CustomEvent('task:pass', { bubbles: true }));
          }
        }
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

    if (!pre.hasAttribute('data-run')) { runBtn.hidden = true; resetBtn.hidden = true; }
    var blanks = [].slice.call(pre.querySelectorAll('input.blank'));
    if (blanks.length) {
      var chk = el('button', 'btn', '빈칸 확인'); chk.type = 'button';
      var show = el('button', 'btn', '빈칸 정답'); show.type = 'button';
      var squash = function (t) { return t.replace(/\s+/g, ''); };
      chk.addEventListener('click', function () {
        var right = 0;
        blanks.forEach(function (b) {
          var ok = squash(b.value) === squash(b.getAttribute('data-ans'));
          b.classList.toggle('ok', ok); b.classList.toggle('ng', !ok);
          if (ok) right++;
        });
        out.hidden = false;
        out.className = 'runner-out ' + (right === blanks.length ? 'pass' : 'fail');
        out.textContent = right === blanks.length ? '✓ 빈칸 ' + right + '개를 모두 맞혔어요. ▶ 실행으로 결과도 확인해 보세요.'
          : '빈칸 ' + blanks.length + '개 중 ' + right + '개 맞혔어요. 빨간 칸을 다시 생각해 보세요.';
      });
      show.addEventListener('click', function () {
        blanks.forEach(function (b) { b.value = b.getAttribute('data-ans'); b.classList.remove('ng'); b.classList.add('ok'); });
      });
      bar.appendChild(chk); bar.appendChild(show);
    }
    bar.appendChild(el('span', 'hint', blanks.length ? '빈칸을 채우고 실행해 보세요' : editable ? '직접 고쳐서 실행해 보세요' : '브라우저 안에서 실행됩니다'));
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
      var text = codeText(pre);
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
  var topbarEl = document.querySelector('.topbar');
  function top(el) { return el.getBoundingClientRect().top + window.pageYOffset; }
  // scroll-margin-top(클릭 이동 기준)과 같은 만큼 여백을 두어, 방금 이동한
  // 위치와 '현재 항목' 판정 기준이 어긋나지 않게 한다. 상단바 높이를 매번
  // 실측하므로 글자 크기·화면 배율이 달라져도 함께 맞는다.
  function lineOffset() {
    var h = topbarEl ? topbarEl.getBoundingClientRect().height : 0;
    return h + 24;
  }

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
    var line = window.pageYOffset + lineOffset();

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
          if (r.top < nr.top || r.bottom > nr.bottom) act.scrollIntoView({ block: 'center' });
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
  window.addEventListener('hashchange', function () { lastIdx = -1; update(); });
  // 이 사이트는 scroll-behavior:smooth를 쓰지 않고 앵커로 '즉시' 이동하는데,
  // 이런 즉시 이동에서는 브라우저가 scroll 이벤트를 보내지 않는 경우가 있다.
  // 그러면 위치는 정확히 옮겨가도 목차의 강조 색은 이전 자리에 남는다.
  // 그래서 앵커(#...) 클릭을 직접 감지해, 이동이 끝난 다음 틱에 강제로 다시 계산한다.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    lastIdx = -1;
    setTimeout(update, 0);
  });
  update();
})();
