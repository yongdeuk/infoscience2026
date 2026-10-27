/**
 * 정보과학 수업 사이트 — 제출 · 모두의 생각 보드 (Google Apps Script)
 *
 * 설치: 구글 시트 → 확장 프로그램 → Apps Script → 이 코드를 붙여 넣고 저장
 *       → 배포 → 새 배포 → 유형: 웹 앱, 실행 사용자: 나, 액세스 권한: 모든 사용자 → 배포
 *       → 나온 웹 앱 URL(…/exec)을 사이트의 교사 설정 「학생 제출·보드 주소」에 넣는다.
 *
 * 시트 두 장을 자동으로 만든다.
 *   제출: 차시를 마친 학생의 한 줄 정리
 *   보드: 「생각 열기」에 올린 짧은 글 (사이트에는 이름 없이 내용만 보인다)
 */
var MAX_TEXT = 2000;

function sheet_(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(head);
    sh.setFrozenRows(1);
  }
  return sh;
}

function clip_(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }

// 학번(예: 10203) 앞 세 자리 = 학년·반. 학번이 없으면 빈칸.
function klass_(name) { var m = String(name || '').match(/(\d)(\d{2})\d{2}/); return m ? m[1] + '-' + Number(m[2]) : ''; }

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var now = new Date();
    if (d.type === 'board') {
      sheet_('보드', ['시각', '반', '이름', '차시', '칸', '내용'])
        .appendRow([now, klass_(d.name), clip_(d.name, 40), Number(d.lesson) || 0, clip_(d.slot, 20), clip_(d.text, MAX_TEXT)]);
    } else {
      // 한 줄 정리만 받는다
      sheet_('제출', ['시각', '반', '이름', '차시', '제목', '한 줄 정리'])
        .appendRow([now, klass_(d.name), clip_(d.name, 40), Number(d.lesson) || 0, clip_(d.title, 100), clip_(d.exit, MAX_TEXT)]);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// 보드 읽기: ?lesson=7&slot=hook → 오늘 올라온 글 [{t, c, x}] (시각, 반, 내용). 이름은 보내지 않는다.
function doGet(e) {
  var p = e.parameter || {};
  var out = [];
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('보드');
  if (sh && sh.getLastRow() > 1) {
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
    for (var i = rows.length - 1; i >= 0 && out.length < 300; i--) {
      var r = rows[i];
      if (Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), 'yyyy-MM-dd') !== today) break;
      if (String(r[3]) === String(p.lesson) && String(r[4]) === String(p.slot)) {
        out.push({ t: new Date(r[0]).getTime(), c: r[1], x: r[5] });
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify(out.reverse())).setMimeType(ContentService.MimeType.JSON);
}
