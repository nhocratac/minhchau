/**
 * =====================================================================
 *  Lưu câu trả lời RSVP của thiệp tốt nghiệp vào Google Sheet
 *  Cách cài đặt: xem README.md, mục 3.
 * =====================================================================
 *  - POST: lưu / cập nhật câu trả lời, trả về thống kê
 *  - GET : chỉ trả về thống kê (số người đến / không đến)
 *  Mỗi khách có một "Mã khách" lưu trên trình duyệt của họ, nên khi khách
 *  bấm "Sửa câu trả lời" rồi gửi lại, dòng cũ sẽ được cập nhật thay vì
 *  thêm dòng mới.
 */

const SHEET_NAME = 'RSVP';
const HEADERS = ['Thời gian', 'Tên', 'Tham dự', 'Số người', 'Lời chúc', 'Mã khách', 'Thiết bị'];

/** Chạy hàm này một lần trong trình soạn thảo để cấp quyền và tạo trang tính. */
function setup() {
  getSheet_();
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const p = (e && e.parameter) || {};
    if (p.website) return json_({ ok: true }); // ô bẫy chống spam

    const name = clean_(p.name, 80);
    const attending = p.attending === 'yes' ? 'yes' : p.attending === 'no' ? 'no' : '';
    if (!name || !attending) return json_({ ok: false, error: 'Thiếu tên hoặc lựa chọn tham dự' });

    const guests = attending === 'yes' ? Math.min(10, Math.max(1, parseInt(p.guests, 10) || 1)) : 0;
    const clientId = clean_(p.clientId, 64);
    const row = [
      new Date(),
      name,
      attending === 'yes' ? 'Có' : 'Không',
      guests,
      clean_(p.message, 500),
      clientId,
      clean_(p.userAgent, 180),
    ];

    const sheet = getSheet_();
    const target = clientId ? findRowByClient_(sheet, clientId) : 0;
    if (target) {
      sheet.getRange(target, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    return json_({ ok: true, updated: !!target, stats: stats_(sheet) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, stats: stats_(getSheet_()) });
}

/* ------------------------------------------------------------------ */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#BFDDF0');
    sheet.setColumnWidth(2, 180);
    sheet.setColumnWidth(5, 320);
  }
  return sheet;
}

function findRowByClient_(sheet, clientId) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const ids = sheet.getRange(2, 6, last - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === clientId) return i + 2;
  }
  return 0;
}

function stats_(sheet) {
  const last = sheet.getLastRow();
  let yes = 0, no = 0, guests = 0;
  if (last > 1) {
    sheet.getRange(2, 3, last - 1, 2).getValues().forEach(function (r) {
      if (r[0] === 'Có') { yes++; guests += Number(r[1]) || 0; }
      else if (r[0] === 'Không') { no++; }
    });
  }
  return { yes: yes, no: no, guests: guests };
}

/** Cắt độ dài và chặn chèn công thức (=, +, -, @) vào ô tính. */
function clean_(value, max) {
  let s = String(value == null ? '' : value).trim().slice(0, max);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
