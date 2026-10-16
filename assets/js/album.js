/* =====================================================================
   Trang album chung có mật khẩu (album.html) — không cần sửa file này
   Chữ trên trang nằm trong assets/js/config.js (mục album)
   Mật khẩu chỉ gửi lên máy chủ để kiểm tra; trang không lưu mật khẩu.
   ===================================================================== */
(function () {
  "use strict";

  var C = window.INVITE || {};
  var A = C.album || {};
  var Mem = window.Memories;
  var KEY = "album-sections-v2";
  var OLD_KEY = "album-photos-v1";   // bản cũ: chỉ xoá, không đọc

  function $(sel) { return document.querySelector(sel); }
  function show(el, text) {
    el.textContent = text == null ? "" : String(text);
    el.hidden = !el.textContent;
  }

  var form = $("#form"), pw = $("#pw"), btn = $("#submit"), statusEl = $("#status");

  $("#albumTitle").textContent = A.title || "Album kỷ niệm";
  show($("#hint"), A.hint);
  $("#pageTitle").textContent = A.title || "Album kỷ niệm";
  $("#submitText").textContent = A.submit || "Mở album";
  $("#pwLabel").textContent = A.placeholder || "Mật khẩu";
  pw.placeholder = A.placeholder || "Mật khẩu";

  // Không nạp được memories-core.js → báo lỗi, không cho nhập
  if (!Mem) {
    console.error("[Thiệp] Không tải được assets/js/memories-core.js.");
    show(statusEl, A.netError || "Mạng đang chập chờn, bạn thử lại nhé.");
    btn.disabled = true;
    pw.disabled = true;
    return;
  }
  Mem.makeStars($("#stars"), Mem.reduceMotion);

  function validPhotos(list) {
    return Array.isArray(list) && list.length > 0 && list.every(function (p) {
      return p && typeof p === "object" && typeof p.thumb === "string" && typeof p.full === "string" && p.thumb && p.full;
    });
  }
  // Lọc phần/ảnh hợp lệ; bỏ phần không còn ảnh
  function cleanSections(list) {
    if (!Array.isArray(list)) return [];
    var out = [];
    list.forEach(function (s) {
      if (!s || typeof s !== "object" || !Array.isArray(s.photos)) return;
      var photos = s.photos.filter(function (p) {
        return p && typeof p.thumb === "string" && typeof p.full === "string" && p.thumb && p.full;
      }).map(function (p) { return { thumb: p.thumb, full: p.full }; });
      if (photos.length) out.push({ title: typeof s.title === "string" ? s.title : "", photos: photos });
    });
    return out;
  }
  function validSections(list) {
    return Array.isArray(list) && list.length > 0 && list.every(function (s) {
      return s && typeof s === "object" && typeof s.title === "string" && validPhotos(s.photos);
    });
  }

  function readSaved() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      var list = JSON.parse(raw);
      return validSections(list) ? list : null;
    } catch (e) { return null; }
  }
  function save(list) {
    try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* bỏ qua: chỉ mất việc nhớ khi tải lại */ }
  }
  function clearSaved() {
    try { sessionStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
  }
  try { sessionStorage.removeItem(OLD_KEY); } catch (e) { /* bỏ qua */ }

  function renderGrid(photos) {
    var grid = document.createElement("div");
    grid.className = "mem-grid";
    photos.forEach(function (p, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mem-grid__item";
      b.style.setProperty("--i", i);
      b.setAttribute("aria-label", "Xem ảnh " + (i + 1) + "/" + photos.length);
      var img = document.createElement("img");
      img.src = p.thumb;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      b.appendChild(img);
      b.addEventListener("click", function () { Mem.openLightbox(photos, i); });
      grid.appendChild(b);
    });
    return grid;
  }

  function renderSections(sections) {
    var host = $("#sections");
    host.textContent = "";
    sections.forEach(function (s) {
      var wrap = document.createElement("section");
      wrap.className = "mem-album__section";
      if (s.title) {
        var h = document.createElement("h2");
        h.className = "mem-album__section-title";
        h.textContent = s.title;
        wrap.appendChild(h);
      }
      wrap.appendChild(renderGrid(s.photos));
      host.appendChild(wrap);
    });
    if (sections.length) $("#noPhotos").hidden = true;
    else show($("#noPhotos"), A.empty);
  }

  function unlock(sections) {
    renderSections(sections);
    $("#gate").hidden = true;
    var site = $("#site");
    site.hidden = false;
    document.body.classList.remove("is-locked");
    window.scrollTo(0, 0);
    site.classList.add("is-entering");
  }

  var saved = readSaved();
  if (saved) { unlock(saved); return; }
  clearSaved();

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (btn.disabled) return;
    var value = pw.value;
    if (!value) { pw.focus(); return; }
    btn.disabled = true;
    statusEl.hidden = true;

    Mem.unlockAlbum(C.memories, value)
      .catch(function () { return { ok: false, error: "network" }; })
      .then(function (res) {
        btn.disabled = false;
        if (res && res.ok && Array.isArray(res.sections)) {
          var sections = cleanSections(res.sections);
          pw.value = "";
          if (sections.length) save(sections);
          unlock(sections);
          return;
        }
        var err = (res && res.error) || "network";
        console.info("[Thiệp] Không mở được album: " + err);
        var net = A.netError || "Mạng đang chập chờn, bạn thử lại nhé.";
        show(statusEl, err === "wrong_password" ? (A.wrong || "Mật khẩu chưa đúng, bạn thử lại nhé.")
          : err === "too_many_attempts" ? (A.locked || "Bạn nhập sai nhiều lần rồi, hãy thử lại sau một lúc nhé.") : net);
        if (err === "wrong_password") pw.select();
        else if (err === "too_many_attempts") pw.value = "";
      });
  });
})();
