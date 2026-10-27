/* ===== 수업 도구: 해 봤어요 체크 · 용어 사전 · 퀴즈 · 내 학습 · 파이썬 실습(Programiz) · 실습실 시뮬레이터 =====
   기록은 모두 이 기기의 localStorage에만 저장된다(키 앞머리 'is.'). 이 파일은 build.py가 만들지 않으므로 직접 고친다. */
(function () {
  'use strict';

  var SITE = window.SITE || { topics: {}, units: {}, quiz: {}, weeks: [] };
  var TOPICS = SITE.topics;
  var UNITS = Object.keys(TOPICS);
  var UNIT_NAME = {};
  UNITS.forEach(function (u) { var x = SITE.units[u]; UNIT_NAME[u] = u === '0' ? x.name : x.roman + ' ' + x.name; });

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

  /* ---------- 홈: 단원 카드 진도 · 이번 주 ---------- */
  (function () {
    $$('[data-uprog]').forEach(function (i) {
      var u = i.getAttribute('data-uprog'), n = (TOPICS[u] || []).length, d = n ? doneCount(u) : 0;
      i.style.width = (n ? Math.round(d / n * 100) : 0) + '%';
      var l = $('[data-uprog-l="' + u + '"]');
      if (l) l.textContent = d + ' / ' + n + (quizBest(u) !== null ? ' · 퀴즈 ' + quizBest(u) + '점' : '');
    });
  })();

  /* ---------- 교사 설정(settings.json): 학기 시작일 · 평가 비율 ----------
     배포된 settings.json을 매번 새로 읽는다(빌드 없이 GitHub에서 고치면 바로 반영).
     읽지 못하면 빌드할 때 넣어 둔 값(SITE.settings)을 쓴다. 교사가 '미리 보기'를 켜면 이 기기에서만 그 값을 쓴다. */
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // 유튜브 주소(watch?v=, youtu.be/, embed/, shorts/, 공유 링크)나 11자 영상 ID에서 ID만 꺼낸다
  function ytId(u) {
    u = String(u || '').trim();
    if (/^[\w-]{11}$/.test(u)) return u;
    var m = u.match(/(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : '';
  }
  function previewSettings() { try { var v = get('settings.preview', ''); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function loadSettings(cb) {
    var pv = previewSettings();
    if (pv) { cb(pv, true); return; }
    var fallback = SITE.settings || {};
    if (!window.fetch) { cb(fallback, false); return; }
    fetch('settings.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { cb(j, false); }, function () { cb(fallback, false); });
  }
  function weekOf(st) {
    // 교사 설정에서 '이번 주'를 직접 정했으면 날짜 계산보다 먼저 쓴다
    if (st && +st.current_week >= 1) return +st.current_week;
    if (!st || !st.semester_start) return null;
    var t0 = new Date(st.semester_start + 'T00:00:00');
    if (isNaN(t0)) return null;
    return Math.floor((Date.now() - t0.getTime()) / (7 * 864e5)) + 1;
  }
  function gradeTable(st) {
    var total = 0;
    var body = (st.grading || []).map(function (g, i) {
      total += +g.ratio || 0;
      var what = esc(g.what) + (g.rubric ? ' (<a href="course.html#rubric-' + (i + 1) + '">채점 기준</a>)' : '');
      return '<tr><td>' + esc(g.type) + '</td><td>' + esc(g.name) + '</td><td>' + what + '</td><td>' + esc(g.when) + '</td><td class="num">' + esc(g.ratio) + '%</td></tr>';
    }).join('');
    return '<div class="tablewrap"><table class="gradetbl"><thead><tr><th>구분</th><th>평가</th><th>무엇을 보나요</th><th>시기</th><th>반영 비율</th></tr></thead><tbody>' +
      body + '</tbody><tfoot><tr><td colspan="4">합계</td><td class="num"><b>' + total + '%</b></td></tr></tfoot></table></div>';
  }
  // 채점 기준표: 첫 열에서 위와 같은 칸은 합쳐 보인다(build.py 의 rubric_table과 같은 표)
  function rubricTable(rb) {
    function cell(t) { return esc(t).replace(/\n/g, '<br>'); }
    var out = [], rows = rb.rows, i = 0;
    while (i < rows.length) {
      var span = 1;
      while (i + span < rows.length && rows[i + span][0] === rows[i][0]) span++;
      out.push('<tr>' + (span > 1 ? '<td rowspan="' + span + '">' : '<td>') + cell(rows[i][0]) + '</td>' +
        rows[i].slice(1).map(function (x) { return '<td>' + cell(x) + '</td>'; }).join('') + '</tr>');
      rows.slice(i + 1, i + span).forEach(function (r) {
        out.push('<tr class="rb-cont">' + r.slice(1).map(function (x) { return '<td>' + cell(x) + '</td>'; }).join('') + '</tr>');
      });
      i += span;
    }
    return '<div class="tablewrap"><table class="rubric"><thead><tr>' + rb.head.map(function (h) { return '<th>' + cell(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + out.join('') + '</tbody></table></div>';
  }
  function rubricsHtml(st) {
    var out = (st.grading || []).map(function (g, i) {
      return g.rubric ? '<h3 id="rubric-' + (i + 1) + '">' + esc(g.name) + '</h3>' + rubricTable(g.rubric) : '';
    }).join('');
    return out || '<p class="muted">채점 기준표가 아직 없어요.</p>';
  }
  function applySettings(st, isPreview) {
    $$('[data-term]').forEach(function (e) { if (st.term) e.textContent = st.term; });
    var rb = $('[data-rubrics]');
    if (rb && st.grading) rb.innerHTML = rubricsHtml(st);
    var g = $('[data-grade]');
    if (g && st.grading) g.innerHTML = gradeTable(st);
    $$('[data-grade-year]').forEach(function (e) { e.textContent = (st.year ? st.year + '학년도 ' : '') + (st.term || ''); });
    var main = $('#main');
    if (isPreview && main) {
      var n = document.createElement('p');
      n.className = 'set-banner';
      n.innerHTML = '교사 설정 <b>미리 보기</b>가 켜져 있어요. 이 기기에서만 보입니다. <a href="settings.html#s-save">설정으로 →</a>';
      main.insertBefore(n, main.firstChild);
    }
    var now = $('[data-now]'), wk = weekOf(st);
    if (!now || wk === null) return;
    var w = SITE.weeks.filter(function (x) { return x.week === wk; })[0];
    if (!w) return;
    var unit = null;
    UNITS.forEach(function (u) { var r = SITE.units[u].weeks; if (r && wk >= r[0] && wk <= r[1]) unit = u; });
    now.innerHTML = '<p class="kicker">이번 주 · ' + wk + '주차</p><h2>' + (unit ? UNIT_NAME[unit] : '이번 주 수업') + '</h2><ol>' +
      w.lessons.map(function (l, i) { var k = (wk - 1) * 3 + i + 1; return '<li><a href="lesson' + (k < 10 ? '0' : '') + k + '.html">' + k + '차시 · ' + l + '</a></li>'; }).join('') + '</ol>' +
      (unit ? '<a class="go" href="unit' + unit + '.html">단원 펼치기 →</a>' : '');
    var row = $('#plan .wk[data-week="' + wk + '"]');
    if (row) row.classList.add('now');
  }
  loadSettings(applySettings);

  /* ---------- 차시 페이지: 코드 설명 · 예측 · 생각 쓰기 · 마침 체크 · 제출 ---------- */
  (function () {
    var L = window.LESSON;
    if (!L) return;
    var key = 'L' + (L.n < 10 ? '0' : '') + L.n;
    // 코드 블록마다 예측 질문(위)과 코드 설명(아래)
    $$('pre[data-c]').forEach(function (pre) {
      var note = L.notes['C' + pre.getAttribute('data-c')];
      if (!note) return;
      if (note.predict) {
        var pd = document.createElement('div');
        pd.className = 'predict';
        pd.innerHTML = '<b>🤔 예측해 보기</b> ' + note.predict.q + ' <button class="btn" type="button">답 보기</button><p class="predict-a" hidden>' + note.predict.a + '</p>';
        $('button', pd).addEventListener('click', function () { var a = $('.predict-a', pd); a.hidden = !a.hidden; this.textContent = a.hidden ? '답 보기' : '답 숨기기'; });
        pre.parentNode.insertBefore(pd, pre);
      }
      var lines = (window.codeText ? window.codeText(pre) : pre.textContent).split('\n');
      var d = document.createElement('details');
      d.className = 'codenote';
      d.innerHTML = '<summary>💡 코드 설명 — ' + note.say + '</summary><ol class="cn-lines">' +
        (note.lines || []).map(function (x) {
          var src = (lines[x[0] - 1] || '').trim();
          return '<li><span class="cn-n">' + x[0] + '줄</span>' + (src && !pre.querySelector('input.blank') ? '<code>' + esc(src) + '</code>' : '') + '<span>' + x[1] + '</span></li>';
        }).join('') + '</ol>';
      var after = pre.nextElementSibling && pre.nextElementSibling.classList.contains('runner') ? pre.nextElementSibling : pre;
      after.parentNode.insertBefore(d, after.nextSibling);
    });
    // 생각 쓰기 · 한 줄 정리 (이 기기에 저장)
    $$('[data-think]').forEach(function (ta) {
      var k = 'think.' + ta.getAttribute('data-think'), saved = ta.nextElementSibling, t = null;
      ta.value = get(k, '');
      ta.addEventListener('input', function () {
        set(k, ta.value);
        clearTimeout(t);
        t = setTimeout(function () { if (saved) saved.textContent = '이 기기에 저장됨 · ' + new Date().toLocaleTimeString('ko-KR'); }, 400);
      });
    });
    // 이 차시 마쳤어요
    $$('[data-lesson-done]').forEach(function (btn) {
      var k = 'lesson.' + btn.getAttribute('data-lesson-done');
      function paint() { var on = get(k) === '1'; btn.setAttribute('aria-pressed', on); btn.textContent = on ? '✓ 이 차시 마쳤어요' : '☐ 이 차시 마쳤어요'; }
      btn.addEventListener('click', function () { if (get(k) === '1') del(k); else set(k, '1'); paint(); });
      paint();
    });
    // 선생님께 제출 (교사 설정에 Apps Script 주소가 있을 때만)
    var box = $('[data-submit]');
    if (!box) return;
    loadSettings(function (st) {
      if (!st.submit_url) return;
      box.hidden = false;
      var btn = $('button', box), msg = $('[data-submit-msg]', box);
      btn.addEventListener('click', function () {
        var name = get('name', '');
        if (!name) {
          name = (window.prompt('학번과 이름을 적어 주세요 (예: 10203 홍길동)') || '').trim();
          if (!name) return;
          set('name', name);
        }
        var thinks = $$('[data-think]').map(function (ta) { return ta.value.trim(); });
        var tasks = $$('.task pre[data-task]').map(function (p, i) {
          return '[과제' + (i + 1) + (p.closest('.task').classList.contains('is-pass') ? ' ✓' : '') + ']\n' + p.textContent.trim();
        });
        var q = quizBest(key);
        var data = {
          name: name, lesson: L.n, title: document.title.replace(/ · 정보과학$/, ''),
          exit: get('think.' + key + '.exit', ''), thinks: thinks.slice(0, -1).filter(Boolean).join('\n---\n'),
          passed: $$('.task.is-pass').length + ' / ' + $$('.task pre[data-task]').length,
          quiz: q === null ? '' : q + '점', code: tasks.join('\n\n').slice(0, 40000)
        };
        btn.disabled = true; msg.textContent = '보내는 중…';
        fetch(st.submit_url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
          .then(function () { msg.textContent = '보냈어요 ✓ (' + name + ') · ' + new Date().toLocaleTimeString('ko-KR'); set('sent.' + key, '1'); },
                function () { msg.textContent = '보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'; })
          .then(function () { btn.disabled = false; });
      });
    });
  })();

  /* ---------- 모두의 생각 보드 (Apps Script) ---------- */
  (function () {
    var L = window.LESSON, boards = $$('[data-board]');
    if (!L || !boards.length) return;
    loadSettings(function (st) {
      var url = st.submit_url;
      if (!url) return;
      boards.forEach(function (bd) {
        var slot = bd.getAttribute('data-board'), list = $('[data-board-list]', bd), sel = $('[data-board-class]', bd);
        var msg = $('[data-board-msg]', bd), cnt = $('[data-board-count]', bd), rows = [], timer = null;
        bd.hidden = false;
        var mine = (get('name', '').match(/(\d)(\d{2})\d{2}/) || []);
        var myClass = mine.length ? mine[1] + '-' + (+mine[2]) : '';
        function draw() {
          var cls = sel.value, seen = {};
          rows.forEach(function (r) { if (r.c) seen[r.c] = 1; });
          var opts = Object.keys(seen).sort();
          if (sel.options.length - 1 !== opts.length) {
            var keep = cls;
            sel.innerHTML = '<option value="">모든 반</option>' + opts.map(function (c) { return '<option value="' + c + '">' + c.replace('-', '학년 ') + '반</option>'; }).join('');
            sel.value = keep || (opts.indexOf(myClass) >= 0 ? myClass : '');
            cls = sel.value;
          }
          var vis = rows.filter(function (r) { return !cls || r.c === cls; });
          cnt.textContent = vis.length ? vis.length + '개' : '아직 없어요';
          list.innerHTML = vis.map(function (r) { return '<li>' + esc(r.x).replace(/\n/g, '<br>') + '</li>'; }).join('');
        }
        function pull() {
          fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'lesson=' + L.n + '&slot=' + slot, { cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .then(function (j) { rows = j || []; draw(); }, function () { cnt.textContent = '보드를 불러오지 못했어요'; });
        }
        // 화면에 보일 때만 5초마다 새로 읽는다
        function loop(on) { clearInterval(timer); if (on) { pull(); timer = setInterval(pull, 5000); } }
        if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { loop(es[0].isIntersecting || bd.classList.contains('is-big')); }).observe(bd);
        else loop(true);
        sel.addEventListener('change', draw);
        $('[data-board-big]', bd).addEventListener('click', function () {
          var big = bd.classList.toggle('is-big');
          this.textContent = big ? '닫기' : '크게 보기';
          document.body.classList.toggle('has-big', big);
          loop(true);
        });
        $('[data-board-send]', bd).addEventListener('click', function () {
          var ta = $('[data-board-in]', bd), text = ta.value.trim(), btn = this;
          if (!text) { ta.focus(); return; }
          var name = get('name', '');
          if (!name) {
            name = (window.prompt('학번과 이름을 적어 주세요 (예: 10203 홍길동). 보드에는 이름이 보이지 않아요.') || '').trim();
            if (!name) return;
            set('name', name);
          }
          btn.disabled = true; msg.textContent = '올리는 중…';
          fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ type: 'board', name: name, lesson: L.n, slot: slot, text: text }) })
            .then(function () { msg.textContent = '올렸어요 ✓'; ta.value = ''; setTimeout(pull, 800); },
                  function () { msg.textContent = '올리지 못했어요. 다시 눌러 주세요.'; })
            .then(function () { btn.disabled = false; });
        });
      });
    });
  })();

  /* ---------- 차시 목록: 마친 차시 표시 · 이번 주 ---------- */
  (function () {
    var rows = $$('[data-lesson]');
    if (!rows.length) return;
    rows.forEach(function (r) { if (get('lesson.' + r.getAttribute('data-lesson')) === '1') r.classList.add('is-done'); });
    var now = $('[data-lnow]');
    loadSettings(function (st) {
      var wk = weekOf(st);
      if (!wk || wk < 1 || wk > 16) return;
      rows.forEach(function (r) {
        var k = +r.getAttribute('data-lesson');
        if (Math.ceil(k / 3) === wk) r.classList.add('is-week');
      });
      if (now) {
        now.hidden = false;
        now.innerHTML = '<b>이번 주 · ' + wk + '주차</b>' + [1, 2, 3].map(function (i) {
          var k = (wk - 1) * 3 + i, r = $('[data-lesson="' + k + '"]');
          return r ? '<a href="' + r.getAttribute('href') + '">' + k + '차시 · ' + $('.lt', r).textContent + '</a>' : '';
        }).join('');
      }
    });
  })();

  /* ---------- 교사 모드: 바닥글 '정보과학'을 5번 연속 누르면 교사 설정으로 ----------
     링크를 숨기는 장치일 뿐 보안은 아니다. 실제 저장은 저장소 주인의 GitHub 로그인이 있어야 된다. */
  (function () {
    var tap = $('[data-teacher-tap]'), n = 0, t = null;
    if (!tap) return;
    tap.addEventListener('click', function () {
      n++;
      clearTimeout(t);
      t = setTimeout(function () { n = 0; }, 1500);   // 1.5초 안에 다음을 눌러야 이어서 센다
      if (n >= 5) { set('teacher', '1'); location.href = 'settings.html'; }
    });
  })();

  /* ---------- 차시: 시뮬레이터 링크 (settings.json의 sims가 있으면 그것을 쓴다) ---------- */
  (function () {
    var box = $('[data-sims]');
    if (!box) return;
    loadSettings(function (st) {
      if (!st.sims) return;   // 설정에 sims가 없으면 빌드 때 넣은 기본 링크를 그대로 둔다
      var a = (st.sims[box.getAttribute('data-sims')] || []).filter(function (x) { return x && /^https?:\/\//.test(x.url); });
      box.hidden = !a.length;
      box.innerHTML = '<b>함께 보는 시뮬레이터</b>' + a.map(function (x) {
        return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.label || '시뮬레이터') + ' ↗</a>';
      }).join('');
    });
  })();

  /* ---------- 차시: 생각 열기 영상 (settings.json의 videos) ----------
     처음에는 썸네일만 보여 주고, 누르면 그 자리에서 유튜브를 재생한다(쿠키 없는 youtube-nocookie). */
  (function () {
    var box = $('[data-video]');
    if (!box) return;
    loadSettings(function (st) {
      var v = (st.videos || {})[box.getAttribute('data-video')];
      var id = v && ytId(v.id);
      if (!id) return;
      var title = v.title || '관련 영상';
      box.hidden = false;
      box.innerHTML = '<button class="lv-play" type="button" aria-label="영상 재생: ' + esc(title) + '">' +
        '<img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="" loading="lazy"><span class="lv-btn" aria-hidden="true">▶</span></button>' +
        '<p class="lv-cap">🎬 <b>' + esc(title) + '</b> <a href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener">유튜브에서 보기 ↗</a></p>';
      var img = $('.lv-play img', box);
      img.addEventListener('error', function () { img.remove(); });
      $('.lv-play', box).addEventListener('click', function () {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
        f.title = title;
        f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        f.allowFullscreen = true;
        f.className = 'lv-frame';
        this.replaceWith(f);
      });
    });
  })();

  /* ---------- 교사 설정 페이지 ---------- */
  (function () {
    var form = $('[data-set-form]');
    if (!form) return;
    if (get('teacher') !== '1') { location.replace('index.html'); return; }
    $('[data-teacher-off]').addEventListener('click', function () { del('teacher'); location.replace('index.html'); });
    var rowsEl = $('[data-set-rows]'), totalEl = $('[data-set-total]'), msg = $('[data-set-msg]'), F = form.elements;
    function rowHtml(g) {
      return '<tr><td><select data-k="type" aria-label="구분"><option' + (g.type === '지필' ? ' selected' : '') + '>지필</option><option' + (g.type === '수행' ? ' selected' : '') + '>수행</option></select></td>' +
        '<td><input data-k="name" aria-label="평가 이름" value="' + esc(g.name) + '"></td><td><input data-k="what" aria-label="무엇을 보나요" value="' + esc(g.what) + '"></td>' +
        '<td><input data-k="when" aria-label="시기" value="' + esc(g.when) + '"></td><td><input data-k="ratio" aria-label="비율" type="number" min="0" max="100" value="' + esc(g.ratio) + '"></td>' +
        '<td><button class="btn" type="button" data-set-del aria-label="이 항목 지우기">✕</button></td></tr>';
    }
    function read() {
      return {
        year: +F.year.value || null,
        term: F.term.value,
        semester_start: F.semester_start.value || null,
        current_week: +F.current_week.value || null,
        submit_url: F.submit_url.value.trim(),
        videos: readVideos(),
        sims: readSims(),
        grading: $$('tr', rowsEl).map(function (tr) {
          var o = {};
          $$('[data-k]', tr).forEach(function (i) { var k = i.getAttribute('data-k'); o[k] = k === 'ratio' ? (+i.value || 0) : i.value.trim(); });
          if (tr._rubric) o.rubric = tr._rubric;
          return o;
        })
      };
    }
    function total(st) { return st.grading.reduce(function (a, g) { return a + g.ratio; }, 0); }
    function refresh() {
      var st = read(), t = total(st), wk = weekOf(st);
      totalEl.innerHTML = '합계 <b>' + t + '%</b>';
      totalEl.classList.toggle('bad', t !== 100);
      $('[data-set-preview]').innerHTML = gradeTable(st);
      drawRubrics(st);
      $('[data-set-week]').textContent = st.current_week ? '이번 주를 ' + st.current_week + '주차(' + ((st.current_week - 1) * 3 + 1) + '~' + st.current_week * 3 + '차시)로 정해 두었어요. 칸을 비우면 학기 시작일로 자동 계산해요.'
        : !st.semester_start ? '학기 시작일을 넣으면 홈에 이번 주 수업이 나옵니다.'
        : wk < 1 ? '학기 시작 전이에요. 시작일이 든 주를 1주차로 셉니다.'
        : wk > 16 ? '16주가 지났어요(' + wk + '주차). 홈에는 이번 주 카드 대신 시작 안내가 보입니다.'
        : '오늘은 ' + wk + '주차입니다.';
      $('[data-set-preview-state]').textContent = previewSettings() ? '이 기기에서 미리 보기 중' : '';
    }
    function fill(st) {
      F.year.value = st.year || new Date().getFullYear();
      F.term.value = st.term || '1학기';
      F.semester_start.value = st.semester_start || '';
      F.current_week.value = st.current_week || '';
      F.submit_url.value = st.submit_url || '';
      fillVideos(st.videos || {});
      fillSims(st.sims || {});
      rowsEl.innerHTML = (st.grading || []).map(rowHtml).join('');
      $$('tr', rowsEl).forEach(function (tr, i) { if (st.grading[i].rubric) tr._rubric = st.grading[i].rubric; });
      refresh();
    }
    /* 차시별 생각 열기 영상: 주소 칸 → { "5": {"id": "…", "title": "…"} } */
    function readVideos() {
      var o = {};
      $$('[data-vk]').forEach(function (tr) {
        var id = ytId($('[data-vurl]', tr).value);
        if (id) o[tr.getAttribute('data-vk')] = { id: id, title: tr._vt && tr._vid === id ? tr._vt : '' };
      });
      return o;
    }
    function fillVideos(v) {
      $$('[data-vk]').forEach(function (tr) {
        var x = v[tr.getAttribute('data-vk')];
        tr._vid = x ? x.id : ''; tr._vt = x ? x.title : '';
        $('[data-vurl]', tr).value = x ? 'https://youtu.be/' + x.id : '';
        paintVideo(tr);
      });
    }
    /* 차시별 시뮬레이터: 한 줄에 '이름 | 주소' → { "15": [{"label": "…", "url": "…"}] } */
    function simLine(l) {
      var m = l.trim().match(/^(.*?)\s*\|\s*(https?:\/\/\S+)$/) || l.trim().match(/^()(https?:\/\/\S+)$/);
      return m ? { label: m[1] || '시뮬레이터', url: m[2] } : null;
    }
    function readSims() {
      var o = {};
      $$('[data-vk]').forEach(function (tr) {
        var a = $('[data-sims-in]', tr).value.split('\n').map(simLine).filter(Boolean);
        if (a.length) o[tr.getAttribute('data-vk')] = a;
      });
      return o;
    }
    function fillSims(v) {
      $$('[data-vk]').forEach(function (tr) {
        $('[data-sims-in]', tr).value = (v[tr.getAttribute('data-vk')] || []).map(function (x) { return x.label + ' | ' + x.url; }).join('\n');
      });
    }
    function paintVideo(tr) {
      var id = ytId($('[data-vurl]', tr).value), t = $('[data-vtitle]', tr);
      t.innerHTML = id ? ' <a href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener" title="새 탭에서 확인">▶ ' + esc(id === tr._vid && tr._vt ? tr._vt : '새 영상') + '</a>' : '';
    }
    $$('[data-vk] [data-vurl]').forEach(function (i) { i.addEventListener('input', function () { paintVideo(i.closest('[data-vk]')); }); });
    function say(t, bad) { msg.textContent = t; msg.classList.toggle('bad', !!bad); }

    /* 수행평가 채점 기준표: 엑셀·CSV 파일을 올리거나 표를 붙여 넣으면 settings.json에 함께 들어간다 */
    var rbBox = $('[data-set-rubrics]'), rbSig = '';
    function drawRubrics(st) {
      var sig = JSON.stringify(st.grading.map(function (g) { return [g.type, g.name, g.rubric || null]; }));
      if (sig === rbSig) return;   // 붙여 넣는 중인 칸이 지워지지 않도록 바뀐 게 있을 때만 다시 그린다
      rbSig = sig;
      var cards = st.grading.map(function (g, i) {
        if (g.type !== '수행') return '';
        return '<div class="mybox rb-card" data-i="' + i + '"><h3>' + (esc(g.name) || '(이름 없음)') + '</h3>' +
          (g.rubric ? rubricTable(g.rubric) : '<p class="muted">채점 기준표가 아직 없어요.</p>') +
          '<p class="rb-btns"><label class="btn btn-p">파일 올리기 (엑셀·CSV)<input type="file" accept=".xlsx,.xls,.csv,.ods" hidden data-rb-file></label> ' +
          '<button class="btn" type="button" data-rb-paste-toggle>표 붙여 넣기</button> ' +
          (g.rubric ? '<button class="btn" type="button" data-rb-clear>기준표 지우기</button>' : '') +
          ' <span class="rb-msg" data-rb-msg role="status"></span></p>' +
          '<div class="rb-paste" data-rb-paste hidden><textarea rows="6" placeholder="엑셀·한글·구글 시트에서 표를 통째로 복사해 붙여 넣으세요. 첫 줄은 제목 줄(예: 항목 · 잘함 · 보통 · 노력 필요)입니다."></textarea>' +
          '<p><button class="btn btn-p" type="button" data-rb-apply>적용</button></p></div></div>';
      }).join('');
      rbBox.innerHTML = cards || '<p class="muted">구분이 <b>수행</b>인 평가 항목이 없어요.</p>';
    }
    // 2차원 표 → {head, rows}. 빈 줄·빈 열을 빼고, 첫 열이 비면(병합 칸) 위 칸 값으로 채운다.
    function toRubric(m) {
      m = m.map(function (r) { return r.map(function (c) { return String(c == null ? '' : c).replace(/\r/g, '').trim(); }); })
        .filter(function (r) { return r.some(function (c) { return c; }); });
      if (m.length < 2) return null;
      var w = Math.max.apply(null, m.map(function (r) { return r.length; }));
      m = m.map(function (r) { while (r.length < w) r.push(''); return r; });
      var keep = [];
      for (var c = 0; c < w; c++) if (m.some(function (r) { return r[c]; })) keep.push(c);
      if (keep.length < 2) return null;
      m = m.map(function (r) { return keep.map(function (c) { return r[c]; }); });
      for (var r = 2; r < m.length; r++) if (!m[r][0]) m[r][0] = m[r - 1][0];
      return { head: m[0], rows: m.slice(1) };
    }
    function parseTsv(t) {
      // 엑셀·구글 시트 복사본: 칸 안 줄바꿈은 "…"로 감싸 온다
      var rows = [[]], cur = '', q = false;
      for (var i = 0; i < t.length; i++) {
        var ch = t[i];
        if (q) { if (ch === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
        else if (ch === '"' && cur === '') q = true;
        else if (ch === '\t') { rows[rows.length - 1].push(cur); cur = ''; }
        else if (ch === '\n') { rows[rows.length - 1].push(cur); cur = ''; rows.push([]); }
        else cur += ch;
      }
      rows[rows.length - 1].push(cur);
      return rows;
    }
    var xlsxReady = null;
    function loadXlsx() {
      // SheetJS(Apache-2.0)를 이 사이트에 함께 두고, 파일을 고를 때만 불러온다
      if (!xlsxReady) xlsxReady = new Promise(function (ok, no) {
        var sc = document.createElement('script');
        sc.src = 'assets/vendor/xlsx.full.min.js';
        sc.onload = function () { ok(window.XLSX); };
        sc.onerror = no;
        document.head.appendChild(sc);
      });
      return xlsxReady;
    }
    function sheetMatrix(X, ws) {
      (ws['!merges'] || []).forEach(function (mg) {
        var v = ws[X.utils.encode_cell(mg.s)];
        for (var r = mg.s.r; r <= mg.e.r; r++) for (var c = mg.s.c; c <= mg.e.c; c++) {
          if (r === mg.s.r && c === mg.s.c) continue;
          ws[X.utils.encode_cell({ r: r, c: c })] = v ? { t: 's', v: v.v } : undefined;
        }
      });
      return X.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
    }
    function setRubric(card, rb, note) {
      var tr = $$('tr', rowsEl)[+card.getAttribute('data-i')];
      if (!tr) return;
      if (rb) tr._rubric = rb; else delete tr._rubric;
      refresh();
      var m = $('.rb-card[data-i="' + card.getAttribute('data-i') + '"] [data-rb-msg]');
      if (m) m.textContent = note;
    }
    function rbFail(card, t) { var m = $('[data-rb-msg]', card); m.textContent = t; m.classList.add('bad'); }
    rbBox.addEventListener('click', function (e) {
      var card = e.target.closest('.rb-card');
      if (!card) return;
      if (e.target.closest('[data-rb-paste-toggle]')) { var p = $('[data-rb-paste]', card); p.hidden = !p.hidden; if (!p.hidden) $('textarea', p).focus(); }
      if (e.target.closest('[data-rb-clear]')) setRubric(card, null, '지웠어요.');
      if (e.target.closest('[data-rb-apply]')) {
        var rb = toRubric(parseTsv($('textarea', card).value));
        if (!rb) return rbFail(card, '표를 읽지 못했어요. 제목 줄과 내용 줄이 있는 표를 통째로 복사해 주세요.');
        setRubric(card, rb, '적용했어요 ✓ ' + rb.rows.length + '줄');
      }
    });
    rbBox.addEventListener('change', function (e) {
      var inp = e.target.closest('[data-rb-file]');
      if (!inp || !inp.files[0]) return;
      var card = inp.closest('.rb-card'), f = inp.files[0];
      if (/\.(hwp|hwpx|pdf|docx?)$/i.test(f.name)) return rbFail(card, '한글·PDF·워드 파일은 바로 읽지 못해요. 표를 복사해 「표 붙여 넣기」로 넣거나 엑셀로 저장해 올려 주세요.');
      $('[data-rb-msg]', card).textContent = '읽는 중…';
      Promise.all([loadXlsx(), f.arrayBuffer()]).then(function (r) {
        var X = r[0], wb = X.read(r[1], { type: 'array' });
        var rb = toRubric(sheetMatrix(X, wb.Sheets[wb.SheetNames[0]]));
        if (!rb) return rbFail(card, '첫 번째 시트에서 표를 찾지 못했어요.');
        setRubric(card, rb, '적용했어요 ✓ ' + f.name + ' · ' + rb.rows.length + '줄');
      }).catch(function () { rbFail(card, '파일을 읽지 못했어요. 엑셀(xlsx)이나 CSV로 저장해 다시 올려 주세요.'); });
    });
    function valid(st) {
      var badS = null;
      $$('[data-vk]').some(function (tr) {
        return $('[data-sims-in]', tr).value.split('\n').some(function (l) {
          if (l.trim() && !simLine(l)) { badS = [tr, l.trim()]; return true; }
        });
      });
      if (badS) { say(badS[0].getAttribute('data-vk') + '차시 시뮬레이터 줄을 읽지 못했어요: "' + badS[1] + '" → 이름 | https://주소 모양으로 적어 주세요.', true); $('[data-sims-in]', badS[0]).focus(); return false; }
      var badV = $$('[data-vk]').filter(function (tr) { var v = $('[data-vurl]', tr).value.trim(); return v && !ytId(v); })[0];
      if (badV) { say(badV.getAttribute('data-vk') + '차시 영상 주소를 읽지 못했어요. 유튜브 주소를 그대로 붙여 넣어 주세요.', true); $('[data-vurl]', badV).focus(); return false; }
      if (st.submit_url && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(st.submit_url)) { say('Apps Script 주소는 https://script.google.com/macros/s/…/exec 모양이어야 해요.', true); return false; }
      if (total(st) !== 100) { say('비율 합계가 100%가 아니에요(지금 ' + total(st) + '%).', true); return false; }
      if (st.grading.some(function (g) { return !g.name; })) { say('이름이 빈 평가 항목이 있어요.', true); return false; }
      return true;
    }
    function json(st) { return JSON.stringify(st, null, 2) + '\n'; }
    function copy(text) {
      function legacy() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        ta.remove();
        return ok;
      }
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(function () { return true; }, legacy);
      }
      return Promise.resolve(legacy());
    }
    $('[data-copy-gs]').addEventListener('click', function () {
      var b = this;
      fetch('apps-script/Code.gs', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(copy)
        .then(function (ok) { b.textContent = ok ? '복사했어요 ✓' : '복사하지 못했어요'; }, function () { b.textContent = '코드를 불러오지 못했어요'; });
    });
    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $('[data-set-add]').addEventListener('click', function () {
      rowsEl.insertAdjacentHTML('beforeend', rowHtml({ type: '수행', name: '', what: '', when: '', ratio: 0 }));
      refresh();
    });
    rowsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-set-del]');
      if (b) { b.closest('tr').remove(); refresh(); }
    });
    $('[data-set-github]').addEventListener('click', function () {
      var st = read();
      if (!valid(st)) return;
      window.open(SITE.settings_edit, '_blank', 'noopener');   // 클릭한 순간에 열어야 팝업 차단에 걸리지 않는다
      copy(json(st)).then(function (ok) {
        say(ok ? '복사했어요 ✓ 열린 편집 창에서 Ctrl+A → Ctrl+V 후 Commit changes를 누르세요.'
               : '복사하지 못했어요. ② 파일로 저장을 써 주세요.', !ok);
      });
    });
    $('[data-set-download]').addEventListener('click', function () {
      var st = read();
      if (!valid(st)) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json(st)], { type: 'application/json' }));
      a.download = 'settings.json';
      document.body.appendChild(a); a.click(); a.remove();
      say('내려받았어요. 저장소의 settings.json을 이 파일로 바꿔 올리세요.');
    });
    $('[data-set-preview-on]').addEventListener('click', function () {
      var st = read();
      if (!valid(st)) return;
      set('settings.preview', JSON.stringify(st)); refresh();
      say('이 기기에서 미리 보기를 켰어요. 홈과 수업 안내에서 확인해 보세요.');
    });
    $('[data-set-preview-off]').addEventListener('click', function () { del('settings.preview'); refresh(); say('미리 보기를 껐어요.'); });
    // 미리 보기 중이라도 편집 칸은 배포된 값이 아니라 미리 보기 값에서 시작한다(작업 이어 가기)
    loadSettings(function (st) { fill(st); });
  })();

  /* ---------- 용어 사전 ---------- */
  (function () {
    var list = $('[data-gl-list]');
    if (!list) return;
    var items = $$('.gl', list), q = $('[data-gl-q]'), count = $('[data-gl-count]'), empty = $('[data-gl-empty]');
    var unit = 'all';
    function apply() {
      var s = q.value.trim().toLowerCase(), n = 0;
      items.forEach(function (it) {
        var ok = (unit === 'all' || it.getAttribute('data-unit') === unit) &&
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
    if (sets.length > 1) {   // 여러 단원 세트를 한 페이지에 둘 때만 탭으로 전환
      var m = location.hash.match(/^#u([0-4])$/);
      show(m ? m[1] : get('quiz.tab', sets[0].getAttribute('data-qz-set')));
    }
  })();

  /* ---------- 내 학습 ---------- */
  (function () {
    var doneBox = $('[data-my-done]');
    if (!doneBox) return;
    function bar(name, val, max, label) {
      var pct = max ? Math.round(val / max * 100) : 0;
      return '<div class="pbar"><span class="nm">' + name + '</span><span class="tr"><span class="fl" style="width:' + pct + '%"></span></span><span class="vl">' + label + '</span></div>';
    }
    // 차시 진도: 단원마다 마친 차시 수와 확인 문제 평균(푼 차시만)
    function lessonsOf(u) {
      var w = (SITE.units[u] || {}).weeks, out = [];
      if (!w) return out;
      for (var k = (w[0] - 1) * 3 + 1; k <= w[1] * 3; k++) out.push(k);
      return out;
    }
    function lessonStat(u) {
      var ks = lessonsOf(u), done = 0, sum = 0, n = 0;
      ks.forEach(function (k) {
        if (get('lesson.' + k) === '1') done++;
        var q = quizBest('L' + (k < 10 ? '0' : '') + k);
        if (q !== null) { sum += q; n++; }
      });
      return { total: ks.length, done: done, avg: n ? Math.round(sum / n) : null, n: n };
    }
    function render() {
      doneBox.innerHTML = UNITS.filter(function (u) { return +u > 0; }).map(function (u) {
        var s = lessonStat(u);
        return '<div class="u' + u + '">' + bar(UNIT_NAME[u], s.done, s.total, s.done + ' / ' + s.total) + '</div>';
      }).join('');
      $('[data-my-quiz]').innerHTML = UNITS.filter(function (u) { return +u > 0; }).map(function (u) {
        var s = lessonStat(u);
        return '<div class="u' + u + '">' + bar(UNIT_NAME[u], s.avg || 0, 100, s.avg === null ? '안 풂' : s.avg + '점 (' + s.n + '차시)') + '</div>';
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
      UNITS.forEach(function (u) {
        if (+u === 0) return;
        var st = lessonStat(u);
        out.push('■ ' + UNIT_NAME[u]);
        out.push('  마친 차시: ' + st.done + ' / ' + st.total + '   확인 문제 평균: ' + (st.avg === null ? '안 풂' : st.avg + '점 (' + st.n + '차시)'));
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
      if (!window.confirm('마친 차시, 확인 문제 점수, 정리 노트를 모두 지울까요? 되돌릴 수 없어요.')) return;
      try {
        Object.keys(localStorage).forEach(function (k) { if (k.indexOf('is.') === 0) localStorage.removeItem(k); });
      } catch (e) {}
      $$('[data-note]').forEach(function (ta) { ta.value = ''; });
      nameIn.value = '';
      render();
    });
  })();

  /* ---------- 파이썬 실습: 코드 복사 + Programiz 열기 · 오류 검색 ---------- */
  (function () {
    var PZ = SITE.programiz || 'https://www.programiz.com/python-programming/online-compiler/';
    function copy(text) {
      // 클립보드 API가 막힌 환경(http, 일부 학교 브라우저)에서는 textarea로 복사한다.
      function legacy() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        ta.remove();
        return ok;
      }
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacy(); });
      }
      return Promise.resolve(legacy());
    }
    function codeOf(pres) { return pres.map(function (p) { return (window.codeText ? window.codeText(p) : p.textContent).replace(/\s+$/, ''); }).join('\n\n') + '\n'; }
    function flash(btn, ok, okText) {
      var label = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', label);
      btn.textContent = ok ? okText : '복사하지 못했어요 — 코드를 직접 선택해 복사하세요';
      setTimeout(function () { btn.textContent = label; }, 2600);
    }
    function sendToPz(btn, text) {
      window.open(PZ, '_blank', 'noopener');   // 클릭한 순간에 열어야 팝업 차단에 걸리지 않는다
      copy(text).then(function (ok) { flash(btn, ok, '복사했어요 ✓ Programiz 편집 창에서 Ctrl+A → Ctrl+V'); });
    }
    $$('[data-nb]').forEach(function (nb) {
      var cells = $$('pre[data-cell]', nb);
      var all = $('[data-nb-copy]', nb);
      if (all) all.addEventListener('click', function () { sendToPz(all, codeOf(cells)); });
      cells.forEach(function (pre, i) {
        var runner = pre.nextElementSibling, bar = runner && runner.querySelector('.runner-bar');
        if (!bar) return;
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'btn';
        btn.textContent = i ? 'Programiz에서 실행 (앞 칸 포함)' : 'Programiz에서 실행';
        btn.title = '이 칸까지의 코드를 복사하고 Programiz를 엽니다';
        btn.addEventListener('click', function () { sendToPz(btn, codeOf(cells.slice(0, i + 1))); });
        bar.insertBefore(btn, bar.querySelector('.hint'));
      });
    });
    // 단원 본문의 실행 블록에도 같은 버튼을 단다(그 블록 코드만 복사).
    $$('main pre[data-run]').forEach(function (pre) {
      if (pre.closest('[data-nb]')) return;
      var runner = pre.nextElementSibling, bar = runner && runner.querySelector('.runner-bar');
      if (!bar) return;
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'btn';
      btn.textContent = 'Programiz에서 실행';
      btn.title = '이 코드를 복사하고 Programiz를 엽니다';
      btn.addEventListener('click', function () { sendToPz(btn, codeOf([pre])); });
      bar.insertBefore(btn, bar.querySelector('.hint'));
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
      dsEl.innerHTML = f.ds.length ? f.ds.map(function (x) { return '<span class="gchip w">' + x + '</span>'; }).join('') : '<span class="muted">(비어 있음)</span>';
      ordEl.innerHTML = f.visited.map(function (x) { return '<span class="gchip">' + x + '</span>'; }).join('') || '<span class="muted">(아직 없음)</span>';
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
