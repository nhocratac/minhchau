const test = require('node:test');
const assert = require('node:assert');
const { loadGas } = require('./helpers/gas-stubs');

const FILES = ['google-apps-script/Code.gs', 'google-apps-script/Memories.gs'];
const HEAD = ['Tên gọi', 'Lời chúc', 'Thư mục ảnh', 'Mã', 'Link', 'Ghi chú'];
const NOT_FOUND = '{"ok":false,"error":"not_found"}';
const plain = (v) => JSON.parse(JSON.stringify(v));
const body = (out) => JSON.parse(out.getContent());

const folders = {
  F1: [
    { id: 'b', name: '02.jpg', mimeType: 'image/jpeg' },
    { id: 'v', name: '03.mp4', mimeType: 'video/mp4' },
    { id: 'a', name: '01.jpg', mimeType: 'image/jpeg' },
  ],
  F: [{ id: 'x1', name: 'a.png', mimeType: 'image/png' }],
};
const guestRow = ['Anh Nam', 'Cảm ơn anh\nnhiều', 'https://drive.google.com/drive/folders/F1?usp=sharing', 'a2b3c4d5e6', '', ''];

test('newCode_ đúng định dạng và không trùng', () => {
  const g = loadGas(FILES);
  const seen = new Set();
  for (let i = 0; i < 1000; i++) {
    const c = g.newCode_();
    assert.match(c, /^[abcdefghjkmnpqrstuvwxyz23456789]{10}$/);
    seen.add(c);
  }
  assert.strictEqual(seen.size, 1000);
});

test('folderIdFromUrl_', () => {
  const g = loadGas(FILES);
  assert.strictEqual(g.folderIdFromUrl_('https://drive.google.com/drive/folders/1AbC_d-9?usp=sharing'), '1AbC_d-9');
  assert.strictEqual(g.folderIdFromUrl_('https://drive.google.com/drive/u/0/folders/1AbC_d-9'), '1AbC_d-9');
  assert.strictEqual(g.folderIdFromUrl_('1AbC_d-9'), '1AbC_d-9');
  assert.strictEqual(g.folderIdFromUrl_('xin chào'), '');
});

test('photoUrls_', () => {
  const g = loadGas(FILES);
  assert.deepStrictEqual(plain(g.photoUrls_('ID')), {
    thumb: 'https://lh3.googleusercontent.com/d/ID=w1200',
    full: 'https://lh3.googleusercontent.com/d/ID=w2400',
  });
});

test('handleThanksGet_ trả khách, giữ xuống dòng, chỉ ảnh, sắp theo tên', () => {
  const g = loadGas(FILES, { sheets: { CamOn: [HEAD, guestRow] }, folders });
  const r = plain(g.handleThanksGet_('a2b3c4d5e6'));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.guest.name, 'Anh Nam');
  assert.strictEqual(r.guest.message, 'Cảm ơn anh\nnhiều');
  assert.deepStrictEqual(r.guest.photos.map((p) => p.thumb.split('/d/')[1]), ['a=w1200', 'b=w1200']);
});

test('mã không có / sai định dạng / rỗng đều trả not_found giống hệt', () => {
  const g = loadGas(FILES, { sheets: { CamOn: [HEAD, guestRow] }, folders });
  for (const c of ['khongco99', '!!', '', undefined]) {
    assert.strictEqual(JSON.stringify(g.handleThanksGet_(c)), NOT_FOUND);
  }
});

test('mã viết hoa vẫn tìm ra', () => {
  const g = loadGas(FILES, { sheets: { CamOn: [HEAD, guestRow] }, folders });
  assert.strictEqual(g.handleThanksGet_('A2B3C4D5E6').ok, true);
});

test('thiếu tab CamOn hoặc thư mục lỗi vẫn không vỡ', () => {
  const g = loadGas(FILES, { sheets: {}, folders });
  assert.strictEqual(JSON.stringify(g.handleThanksGet_('a2b3c4d5e6')), NOT_FOUND);
  const row = guestRow.slice(); row[2] = 'KHONGCO';
  const g2 = loadGas(FILES, { sheets: { CamOn: [HEAD, row] }, folders });
  assert.deepStrictEqual(plain(g2.handleThanksGet_('a2b3c4d5e6').guest.photos), []);
});

test('generateLinks với cột xáo thứ tự', () => {
  const head = ['Mã', 'Tên gọi', 'Link', 'Lời chúc', 'Thư mục ảnh', 'Ghi chú'];
  const g = loadGas(FILES, {
    sheets: { CamOn: [head, ['oldcode123', 'A', '', '', '', ''], ['', 'B', '', '', '', ''], ['', '', '', 'x', '', '']] },
  });
  g.generateLinks();
  const rows = g.__sheets.CamOn.rows;
  const site = g.__get('SITE_URL');
  assert.strictEqual(rows[1][0], 'oldcode123');
  assert.match(rows[2][0], /^[abcdefghjkmnpqrstuvwxyz23456789]{10}$/);
  assert.strictEqual(rows[1][2], site + 'cam-on.html?k=oldcode123');
  assert.strictEqual(rows[2][2], site + 'cam-on.html?k=' + rows[2][0]);
  assert.ok(!rows[3][0]);
  const before = JSON.stringify(rows);
  g.generateLinks();
  assert.strictEqual(JSON.stringify(g.__sheets.CamOn.rows), before);
});

test('setupThanks tạo tab CamOn với tiêu đề', () => {
  const g = loadGas(FILES);
  g.setupThanks();
  assert.deepStrictEqual(plain(g.__sheets.CamOn.rows[0]), plain(g.__get('THANKS_HEADERS')));
});

const albumOpts = (props) => ({ folders, props });

test('album: sai mật khẩu, khoá sau 10 lần, đúng mật khẩu', () => {
  const props = { ALBUM_PASSWORD: 'bi-mat', ALBUM_FOLDER_ID: 'F' };
  const g = loadGas(FILES, albumOpts(props));
  assert.strictEqual(g.handleAlbumPost_('sai').error, 'wrong_password');
  const g2 = loadGas(FILES, albumOpts(props));
  for (let i = 0; i < 10; i++) g2.handleAlbumPost_('sai');
  assert.strictEqual(g2.handleAlbumPost_('bi-mat').error, 'too_many_attempts');
  const g3 = loadGas(FILES, albumOpts(props));
  const ok = g3.handleAlbumPost_(' bi-mat ');
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.photos.length, 1);
  assert.ok(!JSON.stringify(ok).includes('bi-mat'));
  assert.ok(![...g3.__cache.values()].some((v) => v.includes('bi-mat')));
});

test('album: thiếu cấu hình', () => {
  assert.strictEqual(loadGas(FILES, albumOpts({})).handleAlbumPost_('x').error, 'not_configured');
  assert.strictEqual(loadGas(FILES, albumOpts({ ALBUM_PASSWORD: 'a' })).handleAlbumPost_('a').error, 'not_configured');
});

test('hồi quy RSVP: doPost thêm dòng, doGet trả stats', () => {
  const g = loadGas(FILES, { sheets: { RSVP: [] } });
  const r = body(g.doPost({ parameter: { name: 'A', attending: 'yes', guests: '2', clientId: 'c1' } }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.stats.yes, 1);
  assert.strictEqual(g.__sheets.RSVP.rows.length, 2);
  assert.deepStrictEqual(plain(body(g.doGet()).stats), { yes: 1, no: 0, guests: 2 });
  assert.strictEqual(body(g.doGet({ parameter: {} })).ok, true);
});

test('routing action: thanks (GET) và album (POST) không đụng RSVP', () => {
  const g = loadGas(FILES, {
    sheets: { CamOn: [HEAD, guestRow], RSVP: [] },
    folders,
    props: { ALBUM_PASSWORD: 'bi-mat', ALBUM_FOLDER_ID: 'F' },
  });
  assert.ok(body(g.doGet({ parameter: { action: 'thanks', k: 'a2b3c4d5e6' } })).guest);
  assert.strictEqual(body(g.doPost({ parameter: { action: 'album', password: 'x' } })).error, 'wrong_password');
  assert.strictEqual(g.__sheets.RSVP.rows.length, 0);
});
