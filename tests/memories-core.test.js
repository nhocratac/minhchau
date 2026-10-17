"use strict";
const test = require("node:test");
const assert = require("node:assert");
const M = require("../assets/js/memories-core.js");

const okJson = (obj) => () => Promise.resolve({ ok: true, json: () => Promise.resolve(obj) });

test("fillName thay mọi {ten}", () => {
  assert.strictEqual(M.fillName("và {ten} nhé {ten}", "An"), "và An nhé An");
});

test("readCode", () => {
  assert.strictEqual(M.readCode("?k=A2B3C4D5E6&fbclid=xyz"), "a2b3c4d5e6");
  assert.strictEqual(M.readCode("?k=demo"), "demo");
  assert.strictEqual(M.readCode("?k=<script>"), "");
  assert.strictEqual(M.readCode(""), "");
});

test("mock getThanks", async () => {
  const r = await M.getThanks({ endpoint: "" }, "demo");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.guest.name, "Lan Anh");
  assert.strictEqual(r.guest.photos.length, 3);
  assert.deepStrictEqual(await M.getThanks({ endpoint: "" }, "zzz"), { ok: false, error: "not_found" });
});

test("mock unlockAlbum", async () => {
  const r = await M.unlockAlbum({ endpoint: "" }, "demo");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.photos, undefined);
  assert.deepStrictEqual(r.sections.map((s) => s.title), ["Ngày lễ", "Pregrad"]);
  assert.deepStrictEqual(r.sections.map((s) => s.photos.length), [4, 2]);
  const w = await M.unlockAlbum({ endpoint: "" }, "sai");
  assert.deepStrictEqual(w, { ok: false, error: "wrong_password" });
});

test("getThanks gọi đúng URL và trả JSON", async () => {
  let url;
  const fetch = (u) => { url = u; return okJson({ ok: true, guest: { name: "A" } })(); };
  const r = await M.getThanks({ endpoint: "https://x/exec" }, "a2b3c4d5e6", { fetch });
  assert.strictEqual(url, "https://x/exec?action=thanks&k=a2b3c4d5e6");
  assert.strictEqual(r.guest.name, "A");
});

test("getThanks: fetch reject -> network", async () => {
  const r = await M.getThanks({ endpoint: "https://x/exec" }, "abc", { fetch: () => Promise.reject(new Error("x")) });
  assert.deepStrictEqual(r, { ok: false, error: "network" });
});

test("getThanks: timeout -> network", async () => {
  const t0 = Date.now();
  const r = await M.getThanks({ endpoint: "https://x/exec" }, "abc", { timeoutMs: 50, fetch: () => new Promise(() => {}) });
  assert.strictEqual(r.error, "network");
  assert.ok(Date.now() - t0 < 1000);
});

test("getThanks: HTML (json throw) hoặc non-2xx -> network", async () => {
  const html = () => Promise.resolve({ ok: true, json: () => Promise.reject(new SyntaxError("<")) });
  assert.strictEqual((await M.getThanks({ endpoint: "https://x/exec" }, "abc", { fetch: html })).error, "network");
  const bad = () => Promise.resolve({ ok: false, json: () => Promise.resolve({ ok: true }) });
  assert.strictEqual((await M.getThanks({ endpoint: "https://x/exec" }, "abc", { fetch: bad })).error, "network");
});

test("unlockAlbum POST form-encoded", async () => {
  let init;
  const fetch = (u, i) => { init = i; return okJson({ ok: true, photos: [] })(); };
  const r = await M.unlockAlbum({ endpoint: "https://x/exec" }, "pw", { fetch });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(init.method, "POST");
  assert.ok(String(init.body).includes("action=album"));
  assert.ok(String(init.body).includes("password=pw"));
});

test("unlockAlbum: lỗi server được chuyển tiếp, reject -> network", async () => {
  const f = okJson({ ok: false, error: "too_many_attempts" });
  assert.strictEqual((await M.unlockAlbum({ endpoint: "https://x/exec" }, "p", { fetch: f })).error, "too_many_attempts");
  const r = await M.unlockAlbum({ endpoint: "https://x/exec" }, "p", { fetch: () => Promise.reject(new Error("x")) });
  assert.strictEqual(r.error, "network");
});

test("loadImage thử lại 3 lần (1,5s / 4s / 10s) rồi dừng", () => {
  const img = { src: "", onerror: null };
  const delays = [];
  const fakeTimer = (fn, ms) => { delays.push(ms); img.src = ""; fn(); };
  const url = "https://lh3.googleusercontent.com/d/ID=w800";
  M.loadImage(img, url, { setTimeout: fakeTimer });
  assert.strictEqual(img.src, url);
  assert.strictEqual(img.referrerPolicy, "no-referrer");
  for (let k = 0; k < 3; k++) { img.onerror(); assert.strictEqual(img.src, url); }
  img.onerror();
  assert.strictEqual(img.onerror, null);
  assert.deepStrictEqual(delays, [1500, 4000, 10000]);
});

test("loadImage bỏ qua lỗi của ảnh cũ khi đã đổi sang ảnh khác", () => {
  const img = { src: "", onerror: null };
  const timers = [];
  const lateTimer = (fn) => timers.push(fn);
  M.loadImage(img, "https://lh3.googleusercontent.com/d/A=w2400", { setTimeout: lateTimer });
  const oldOnError = img.onerror;
  M.loadImage(img, "https://lh3.googleusercontent.com/d/B=w2400", { setTimeout: lateTimer });
  oldOnError();
  timers.forEach((fn) => fn());
  assert.strictEqual(img.src, "https://lh3.googleusercontent.com/d/B=w2400");
});
