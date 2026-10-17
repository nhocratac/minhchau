/**
 * =====================================================================
 *  Thiệp cảm ơn + Album ảnh (dùng chung web app với RSVP trong Code.gs)
 * =====================================================================
 *  - GET  ?action=thanks&k=<mã>        : lời cảm ơn + ảnh riêng của từng khách
 *  - POST action=album&password=<...>  : album chia phần theo thư mục con, có mật khẩu
 *  Dữ liệu khách nằm ở tab "CamOn" (xem THANKS_HEADERS). Mật khẩu album chỉ
 *  lưu trong Project Settings > Script Properties (ALBUM_PASSWORD), cùng
 *  ALBUM_FOLDER_ID là ID thư mục Drive chứa ảnh album.
 */

const THANKS_SHEET = 'CamOn';
const THANKS_HEADERS = ['Tên gọi', 'Lời chúc', 'Thư mục ảnh', 'Mã', 'Link', 'Ghi chú'];
const SITE_URL = 'https://nhocratac.github.io/minhchau/';

const MAX_PHOTOS = 300;
const CACHE_SECONDS = 21600;  // 6 giờ
const FAIL_WINDOW = 600;      // 10 phút
const MAX_FAILS = 10;
// Bỏ các ký tự dễ nhầm (0/o, 1/l/i) cho mã khách
const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Menu trong Google Sheet để chủ thiệp thao tác không cần mở code. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Thiệp cảm ơn')
    .addItem('Cài đặt tab CamOn', 'setupThanks')
    .addItem('Tạo mã & link', 'generateLinks')
    .addItem('Làm mới cache ảnh', 'clearMemoriesCache')
    .addItem('Bật chia sẻ ảnh (dự phòng)', 'shareAllPhotos')
    .addToUi();
}

/** Tạo tab CamOn với dòng tiêu đề (chạy một lần). */
function setupThanks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(THANKS_SHEET);
  if (!sheet) sheet = ss.insertSheet(THANKS_SHEET);
  if (sheet.getLastRow() === 0) sheet.appendRow(THANKS_HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, THANKS_HEADERS.length).setFontWeight('bold').setBackground('#BFDDF0');
  return sheet;
}

/** Mã khách ngẫu nhiên 10 ký tự, sinh từ UUID. */
function newCode_() {
  const hex = Utilities.getUuid().replace(/-/g, '');
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += CODE_CHARS.charAt(parseInt(hex.substr(i * 3, 3), 16) % CODE_CHARS.length);
  }
  return out;
}

/** Lấy ID thư mục Drive từ link hoặc ID trần; không nhận ra thì trả ''. */
function folderIdFromUrl_(s) {
  s = String(s == null ? '' : s).trim();
  const m = s.match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{6,}$/.test(s) ? s : '';
}

function photoUrls_(fileId) {
  const base = 'https://lh3.googleusercontent.com/d/' + fileId;
  return { thumb: base + '=w1200', full: base + '=w2400' };
}

/** Tên tiêu đề (đã trim) -> chỉ số cột, để không phụ thuộc thứ tự cột. */
function headerIndex_(row) {
  const idx = {};
  row.forEach(function (h, i) { idx[String(h).trim()] = i; });
  return idx;
}

/** Tìm khách theo mã trong các dòng dữ liệu (không gồm dòng tiêu đề). */
function findGuest_(rows, idx, code) {
  code = String(code == null ? '' : code).trim().toLowerCase();
  if (!/^[a-z0-9]{6,32}$/.test(code)) return null;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[idx['Mã']] == null ? '' : r[idx['Mã']]).trim().toLowerCase() === code) {
      return {
        name: String(r[idx['Tên gọi']] == null ? '' : r[idx['Tên gọi']]),
        message: String(r[idx['Lời chúc']] == null ? '' : r[idx['Lời chúc']]),
        folder: String(r[idx['Thư mục ảnh']] == null ? '' : r[idx['Thư mục ảnh']]),
      };
    }
  }
  return null;
}

/** Ảnh trong thư mục Drive, sắp theo tên, tối đa MAX_PHOTOS. Lỗi Drive thì ném lỗi. */
function listPhotosOrThrow_(folderId) {
  const files = DriveApp.getFolderById(folderId).getFiles();
  const list = [];
  while (files.hasNext()) {
    const f = files.next();
    if (String(f.getMimeType()).indexOf('image/') === 0) list.push({ id: f.getId(), name: f.getName() });
  }
  list.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
  return list.slice(0, MAX_PHOTOS).map(function (f) { return photoUrls_(f.id); });
}

/** Như trên nhưng nuốt lỗi: lỗi thì trả [] (dùng cho thiệp từng khách). */
function listPhotos_(folderId) {
  try {
    return listPhotosOrThrow_(folderId);
  } catch (err) {
    return [];
  }
}

/** Tên thư mục -> tiêu đề phần: bỏ tiền tố số ("2. Pregrad" -> "Pregrad"). */
function albumSectionTitle_(name) {
  return String(name == null ? '' : name).replace(/^\s*\d+\s*[.)\-_]\s*/, '').trim();
}

/**
 * Album chia phần: ảnh nằm trực tiếp trong thư mục album -> phần đầu (title ''),
 * mỗi thư mục con trực tiếp -> một phần (sắp theo tên thư mục). Phần rỗng bị bỏ.
 * Tổng tối đa MAX_PHOTOS ảnh (cắt phần sau). Lỗi Drive thì ném lỗi.
 */
function listAlbumSections_(folderId) {
  const root = DriveApp.getFolderById(folderId);
  const subs = [];
  const it = root.getFolders();
  while (it.hasNext()) {
    const f = it.next();
    subs.push({ id: f.getId(), name: String(f.getName()) });
  }
  subs.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });

  const sections = [{ title: '', photos: listPhotosOrThrow_(folderId) }];
  subs.forEach(function (f) {
    sections.push({ title: albumSectionTitle_(f.name), photos: listPhotosOrThrow_(f.id) });
  });

  let left = MAX_PHOTOS;
  const out = [];
  sections.forEach(function (s) {
    const photos = s.photos.slice(0, Math.max(left, 0));
    left -= photos.length;
    if (photos.length) out.push({ title: s.title, photos: photos });
  });
  return out;
}

/** Trả lời cho GET ?action=thanks. Mọi trường hợp không tìm thấy đều giống hệt nhau. */
function handleThanksGet_(code) {
  const notFound = { ok: false, error: 'not_found' };
  code = String(code == null ? '' : code).trim().toLowerCase();
  if (!/^[a-z0-9]{6,32}$/.test(code)) return notFound;

  const cache = CacheService.getScriptCache();
  const hit = cache.get('g:' + code);
  if (hit) {
    try { return JSON.parse(hit); } catch (err) { /* cache hỏng: đọc lại từ sheet */ }
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(THANKS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return notFound;
  const lastCol = sheet.getLastColumn();
  const idx = headerIndex_(sheet.getRange(1, 1, 1, lastCol).getValues()[0]);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  const guest = findGuest_(rows, idx, code);
  if (!guest) return notFound;

  const folderId = folderIdFromUrl_(guest.folder);
  let photos = [];
  let driveFailed = false;
  if (folderId) {
    try { photos = listPhotosOrThrow_(folderId); } catch (err) { driveFailed = true; }
  }
  const result = {
    ok: true,
    guest: { name: guest.name, message: guest.message, photos: photos },
  };
  // Lỗi Drive: vẫn trả tên/lời chúc nhưng KHÔNG cache để lần sau đọc lại ảnh
  if (driveFailed) return result;
  try { cache.put('g:' + code, JSON.stringify(result), CACHE_SECONDS); } catch (err) { /* quá cỡ cache: bỏ qua */ }
  return result;
}

/** Trả lời cho POST action=album. Mật khẩu không bao giờ vào cache hay response. */
function handleAlbumPost_(password) {
  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('ALBUM_PASSWORD');
  const folderId = props.getProperty('ALBUM_FOLDER_ID');
  if (!secret || !folderId) return { ok: false, error: 'not_configured' };

  const cache = CacheService.getScriptCache();
  // Kiểm tra số lần sai trước khi so mật khẩu
  const fails = Number(cache.get('album:fails')) || 0;
  if (fails >= MAX_FAILS) return { ok: false, error: 'too_many_attempts' };

  if (String(password == null ? '' : password).trim() !== String(secret).trim()) {
    cache.put('album:fails', String(fails + 1), FAIL_WINDOW);
    return { ok: false, error: 'wrong_password' };
  }

  let sections = null;
  const hit = cache.get('album:sections');
  if (hit) {
    try { sections = JSON.parse(hit); } catch (err) { sections = null; }
  }
  if (!sections) {
    try {
      sections = listAlbumSections_(folderId);
    } catch (err) {
      // Lỗi Drive: trả rỗng và KHÔNG cache để lần sau đọc lại
      return { ok: true, sections: [] };
    }
    try { cache.put('album:sections', JSON.stringify(sections), CACHE_SECONDS); } catch (err) { /* bỏ qua */ }
  }
  return { ok: true, sections: sections };
}

/**
 * Điền "Mã" và "Link" cho các dòng có "Tên gọi". Dòng đã có mã thì giữ nguyên mã.
 * Tìm cột theo tên tiêu đề nên chủ thiệp có thể đổi thứ tự cột.
 */
function generateLinks() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(THANKS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return;
  const lastCol = sheet.getLastColumn();
  const idx = headerIndex_(sheet.getRange(1, 1, 1, lastCol).getValues()[0]);
  if (idx['Tên gọi'] === undefined || idx['Mã'] === undefined || idx['Link'] === undefined) {
    throw new Error('Thiếu cột Tên gọi / Mã / Link — chạy "Cài đặt tab CamOn" trước.');
  }
  const n = sheet.getLastRow() - 1;
  const rows = sheet.getRange(2, 1, n, lastCol).getValues();

  const used = {};
  rows.forEach(function (r) {
    const c = String(r[idx['Mã']]).trim().toLowerCase();
    if (c) used[c] = true;
  });

  const codes = [];
  const links = [];
  rows.forEach(function (r) {
    let code = String(r[idx['Mã']]).trim();
    if (!code && String(r[idx['Tên gọi']]).trim()) {
      do { code = newCode_(); } while (used[code]);
      used[code] = true;
    }
    codes.push([code]);
    links.push([code ? SITE_URL + 'cam-on.html?k=' + code : '']);
  });
  // Ép cột Mã là văn bản thuần để Sheets không tự đổi mã thành số
  sheet.getRange(2, idx['Mã'] + 1, n, 1).setNumberFormat('@').setValues(codes);
  sheet.getRange(2, idx['Link'] + 1, n, 1).setValues(links);
}

/** Xoá cache ảnh album và ảnh từng khách (dùng khi vừa thêm/đổi ảnh trên Drive). */
function clearMemoriesCache() {
  const cache = CacheService.getScriptCache();
  cache.remove('album:sections');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(THANKS_SHEET);
  if (sheet && sheet.getLastRow() > 1) {
    const idx = headerIndex_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
    if (idx['Mã'] !== undefined) {
      sheet.getRange(2, idx['Mã'] + 1, sheet.getLastRow() - 1, 1).getValues().forEach(function (r) {
        const c = String(r[0]).trim().toLowerCase();
        if (c) cache.remove('g:' + c);
      });
    }
  }
}

/** Dự phòng: đặt "Bất kỳ ai có link đều xem được" cho mọi ảnh khách + album. */
function shareAllPhotos() {
  const folderIds = [];
  const album = PropertiesService.getScriptProperties().getProperty('ALBUM_FOLDER_ID');
  if (album) folderIds.push(album);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(THANKS_SHEET);
  if (sheet && sheet.getLastRow() > 1) {
    const idx = headerIndex_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
    if (idx['Thư mục ảnh'] !== undefined) {
      sheet.getRange(2, idx['Thư mục ảnh'] + 1, sheet.getLastRow() - 1, 1).getValues().forEach(function (r) {
        const id = folderIdFromUrl_(r[0]);
        if (id && folderIds.indexOf(id) < 0) folderIds.push(id);
      });
    }
  }

  // Album chia phần: ảnh nằm trong các thư mục con trực tiếp (một cấp, như listAlbumSections_)
  if (album) {
    try {
      const subs = DriveApp.getFolderById(album).getFolders();
      while (subs.hasNext()) {
        const sid = subs.next().getId();
        if (folderIds.indexOf(sid) < 0) folderIds.push(sid);
      }
    } catch (err) { /* lỗi Drive: bỏ qua, thư mục album vẫn được xử lý bên dưới */ }
  }

  let ok = 0, failed = 0;
  folderIds.forEach(function (id) {
    try {
      const files = DriveApp.getFolderById(id).getFiles();
      while (files.hasNext()) {
        const f = files.next();
        try {
          f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          ok++;
        } catch (err) { failed++; }
      }
    } catch (err) { failed++; }
  });
  SpreadsheetApp.getUi().alert('Đã chia sẻ ' + ok + ' file. Số file/thư mục lỗi: ' + failed + '.');
}
