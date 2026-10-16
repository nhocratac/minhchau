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
  var KEY = "album-photos-v1";

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

  function readSaved() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      var list = JSON.parse(raw);
      return validPhotos(list) ? list : null;
    } catch (e) { return null; }
  }
  function save(list) {
    try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* bỏ qua: chỉ mất việc nhớ khi tải lại */ }
  }
  function clearSaved() {
    try { sessionStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
  }

  function renderGrid(photos) {
    var grid = $("#grid");
    grid.textContent = "";
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
    if (photos.length) $("#noPhotos").hidden = true;
    else show($("#noPhotos"), A.empty);
  }

  function unlock(photos) {
    renderGrid(photos);
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
        if (res && res.ok && Array.isArray(res.photos)) {
          var photos = res.photos.filter(function (p) { return p && p.thumb && p.full; });
          pw.value = "";
          if (validPhotos(photos)) save(photos);
          unlock(photos);
          return;
        }
        var err = (res && res.error) || "network";
        console.info("[Thiệp] Không mở được album: " + err);
        show(statusEl, err === "wrong_password" ? A.wrong
          : err === "too_many_attempts" ? A.locked : A.netError);
        if (err === "wrong_password") { pw.select(); }
      });
  });
})();
