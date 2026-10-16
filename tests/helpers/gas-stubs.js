// Stub môi trường Google Apps Script để chạy các file .gs bằng Node (không cần mạng).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

/** Trang tính trong bộ nhớ: rows là mảng 2 chiều, ô tính từ 1 như Apps Script. */
function makeSheet(name, rows) {
  const sheet = {
    rows: (rows || []).map((r) => r.slice()),
    getName: () => name,
    getLastRow: () => sheet.rows.length,
    getLastColumn: () => sheet.rows.reduce((m, r) => Math.max(m, r.length), 0),
    appendRow(row) { sheet.rows.push(row.slice()); },
    setFrozenRows() {},
    setColumnWidth() {},
    getRange(r, c, nr, nc) {
      nr = nr || 1; nc = nc || 1;
      const range = {
        getValues() {
          const out = [];
          for (let i = 0; i < nr; i++) {
            const src = sheet.rows[r - 1 + i] || [];
            const line = [];
            for (let j = 0; j < nc; j++) line.push(src[c - 1 + j] === undefined ? '' : src[c - 1 + j]);
            out.push(line);
          }
          return out;
        },
        setValues(vals) {
          for (let i = 0; i < nr; i++) {
            while (sheet.rows.length < r + i) sheet.rows.push([]);
            const row = sheet.rows[r - 1 + i];
            for (let j = 0; j < nc; j++) {
              while (row.length < c - 1 + j) row.push('');
              row[c - 1 + j] = vals[i][j];
            }
          }
          return range;
        },
        setFontWeight: () => range,
        setBackground: () => range,
      };
      return range;
    },
  };
  return sheet;
}

/**
 * Nạp các file .gs vào cùng một vm context (như Apps Script dùng chung global scope).
 * @param files  đường dẫn file .gs
 * @param opts   { sheets: {tên: rows[][]}, folders: {id: [{id,name,mimeType}]}, subfolders: {id: [{id,name}]}, props: {khoá: giá trị} }
 * @returns context kèm __sheets, __cache, __alerts, __shared để test kiểm tra; __get(expr) đọc const/let.
 */
function loadGas(files, opts) {
  opts = opts || {};
  const sheets = {};
  Object.keys(opts.sheets || {}).forEach((n) => { sheets[n] = makeSheet(n, opts.sheets[n]); });
  const folders = opts.folders || {};
  const subfolders = opts.subfolders || {};
  const props = opts.props || {};
  const cache = new Map();
  const alerts = [];
  const shared = [];

  const ss = {
    getSheetByName: (n) => sheets[n] || null,
    insertSheet(n) { sheets[n] = makeSheet(n, []); return sheets[n]; },
  };
  const sandbox = {
    console,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      getUi: () => ({
        alert: (m) => alerts.push(m),
        createMenu: () => { const m = { addItem: () => m, addToUi: () => m }; return m; },
      }),
    },
    DriveApp: {
      Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' },
      Permission: { VIEW: 'VIEW' },
      getFolderById(id) {
        if (!folders[id]) throw new Error('Không tìm thấy thư mục ' + id);
        return {
          // Giống FolderIterator của Apps Script: hasNext() / next() -> Folder (getId, getName)
          getFolders() {
            let i = 0;
            const list = subfolders[id] || [];
            return {
              hasNext: () => i < list.length,
              next() {
                const f = list[i++];
                return { getId: () => f.id, getName: () => f.name };
              },
            };
          },
          getFiles() {
            let i = 0;
            const list = folders[id];
            return {
              hasNext: () => i < list.length,
              next() {
                const f = list[i++];
                return {
                  getId: () => f.id,
                  getName: () => f.name,
                  getMimeType: () => f.mimeType,
                  setSharing(a, p) {
                    if (f.failShare) throw new Error('không chia sẻ được');
                    shared.push([f.id, a, p]);
                  },
                };
              },
            };
          },
        };
      },
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (cache.has(k) ? cache.get(k) : null),
        put: (k, v) => { cache.set(k, String(v)); },
        remove: (k) => { cache.delete(k); },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (Object.prototype.hasOwnProperty.call(props, k) ? props[k] : null),
      }),
    },
    LockService: {
      getScriptLock: () => ({ waitLock() {}, releaseLock() {} }),
    },
    ContentService: {
      MimeType: { JSON: 'JSON' },
      createTextOutput: (s) => ({ getContent: () => s, setMimeType() { return this; } }),
    },
    Utilities: { getUuid: () => crypto.randomUUID() },
  };
  const ctx = vm.createContext(sandbox);
  files.forEach((f) => vm.runInContext(fs.readFileSync(path.resolve(f), 'utf8'), ctx, { filename: f }));
  ctx.__sheets = sheets;
  ctx.__cache = cache;
  ctx.__alerts = alerts;
  ctx.__shared = shared;
  ctx.__get = (expr) => vm.runInContext(expr, ctx);
  return ctx;
}

module.exports = { loadGas };
