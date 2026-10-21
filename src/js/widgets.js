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
})();

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
