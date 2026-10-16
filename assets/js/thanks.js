/* =====================================================================
   Trang thiệp cảm ơn (cam-on.html?k=<mã khách>) — không cần sửa file này
   Chữ trên trang nằm trong assets/js/config.js (mục thanks / memories / music)
   ===================================================================== */
(function () {
  "use strict";

  var C = window.INVITE || {};
  var T = C.thanks || {};
  var G = C.graduate || {};
  var M = C.music || {};
  var Mem = window.Memories;

  function $(sel) { return document.querySelector(sel); }
  function show(el, text) {
    el.textContent = text == null ? "" : String(text);
    el.hidden = !el.textContent;
  }

  // Không nạp được memories-core.js → báo lỗi thay vì kẹt ở chấm loading
  if (!Mem) {
    console.error("[Thiệp] Không tải được assets/js/memories-core.js.");
    $("#loading").hidden = true;
    show($("#status"), T.netError || "Mạng đang chập chờn, bạn thử tải lại trang nhé.");
    return;
  }
  var reduceMotion = Mem.reduceMotion;

  /* ------------------------------------------------------------------
     1) Màn mở đầu
     ------------------------------------------------------------------ */
  var loading = $("#loading"), cta = $("#cta"), statusEl = $("#status");

  if (T.eyebrow) { $("#eyebrow").textContent = T.eyebrow; $("#cardEyebrow").textContent = T.eyebrow; }
  show($("#line1"), T.line1);
  if (T.title != null) show($("#introTitle"), T.title);
  $("#ctaText").textContent = T.cta || T.ctaFallback || "Mở thư";
  Mem.makeStars($("#stars"), reduceMotion);

  // line2: "{ten}" được thay bằng <span> chữ viết tay; mọi chữ đều gán bằng textContent.
  function renderLine2(name) {
    var el = $("#line2");
    var parts = String(T.line2 || "").split("{ten}");
    el.textContent = "";
    parts.forEach(function (part, i) {
      if (i > 0) {
        var span = document.createElement("span");
        span.className = "mem-intro__name";
        span.textContent = name;
        el.appendChild(span);
      }
      if (part) el.appendChild(document.createTextNode(part));
    });
    el.hidden = !el.textContent;
  }

  function showStatus(text) {
    loading.hidden = true;
    cta.hidden = true;
    show(statusEl, text);
  }

  /* ------------------------------------------------------------------
     2) Nội dung: lời nhắn + ảnh
     ------------------------------------------------------------------ */
  function renderContent(guest) {
    var name = String(guest.name || "").trim() || T.nameFallback || "bạn";
    $("#guestName").textContent = name;
    $("#message").textContent = String(guest.message || "");
    show($("#closing"), T.closing);
    show($("#sign"), G.name);

    var photos = (Array.isArray(guest.photos) ? guest.photos : []).filter(function (p) {
      return p && p.thumb && p.full;
    });
    var grid = $("#grid");
    grid.textContent = "";
    photos.forEach(function (p, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mem-grid__item";
      btn.style.setProperty("--i", i);
      btn.setAttribute("aria-label", "Xem ảnh " + (i + 1) + "/" + photos.length);
      var img = document.createElement("img");
      img.src = p.thumb;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      btn.appendChild(img);
      btn.addEventListener("click", function () { Mem.openLightbox(photos, i); });
      grid.appendChild(btn);
    });
    if (photos.length) $("#noPhotos").hidden = true;
    else show($("#noPhotos"), T.noPhotos);
  }

  /* ------------------------------------------------------------------
     3) Nhạc nền (giống thiệp mời)
     ------------------------------------------------------------------ */
  var audio = $("#bgm");
  var musicBtn = $("#musicBtn");
  var musicOK = !!(T.music && M.src);
  var wantPlay = false;
  var resumeOnShow = false;
  var targetVol = Math.min(1, Math.max(0, M.volume == null ? 0.6 : Number(M.volume)));
  var fadeId = 0;

  function setMusicUI(on) {
    musicBtn.hidden = !musicOK;
    musicBtn.classList.toggle("is-playing", on);
    musicBtn.setAttribute("aria-pressed", String(on));
    musicBtn.setAttribute("aria-label", on ? (T.musicOn || "Tắt nhạc") : (T.musicOff || "Bật nhạc"));
  }

  function fadeVolume(to, ms) {
    var id = ++fadeId;
    var from = audio.volume;
    var t0 = performance.now();
    return new Promise(function (resolve) {
      (function step(now) {
        if (id !== fadeId) return resolve(false);
        var k = Math.min(1, (now - t0) / ms);
        try { audio.volume = from + (to - from) * k; } catch (e) { /* iOS: volume chỉ đọc */ }
        if (k < 1) requestAnimationFrame(step); else resolve(true);
      })(t0);
    });
  }

  function playMusic() {
    if (!musicOK) return;
    wantPlay = true;
    var p = audio.play(); // gọi trực tiếp trong sự kiện chạm để trình duyệt cho phép phát
    setMusicUI(true);
    if (p && p.then) {
      p.then(function () { fadeVolume(targetVol, 1600); })
        .catch(function (err) {
          if (err && err.name === "AbortError") return;
          wantPlay = false;
          setMusicUI(false);
        });
    } else {
      fadeVolume(targetVol, 1600);
    }
  }

  function pauseMusic() {
    wantPlay = false;
    setMusicUI(false);
    fadeVolume(0, 350).then(function (finished) { if (finished && !wantPlay) audio.pause(); });
  }

  function setupMusic() {
    if (!musicOK) return;
    try { audio.volume = 0; } catch (e) { /* iOS */ }
    audio.addEventListener("error", function () {
      musicOK = false;
      wantPlay = false;
      musicBtn.hidden = true;
      console.warn("[Thiệp] Không tải được nhạc nền: " + M.src +
        "\n→ Kiểm tra music.src trong config.js.");
    });
    audio.src = M.src;
    musicBtn.setAttribute("aria-label", T.musicOn || "Tắt nhạc");
    musicBtn.addEventListener("click", function () {
      if (wantPlay && !audio.paused) pauseMusic(); else playMusic();
    });
    // Tạm dừng khi chuyển tab / tắt màn hình, phát lại khi quay lại
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        // Dựa vào wantPlay (không phải audio.paused): play() lần đầu có thể còn đang chờ
        if (wantPlay) { audio.pause(); resumeOnShow = true; }
      } else if (resumeOnShow && wantPlay) {
        resumeOnShow = false;
        audio.play().catch(function () { setMusicUI(false); wantPlay = false; });
      }
    });
  }

  /* ------------------------------------------------------------------
     4) Mở thư: intro mờ đi → loé sáng → nội dung
     ------------------------------------------------------------------ */
  var opened = false;
  function openThanks() {
    if (opened) return;
    opened = true;
    playMusic();

    var intro = $("#intro"), flash = $("#flash"), site = $("#site");
    var k = reduceMotion ? 0.25 : 1;
    cta.disabled = true;

    setTimeout(function () { intro.classList.add("is-leaving"); }, 600 * k);
    setTimeout(function () { flash.classList.add("is-on"); }, 1150 * k);
    setTimeout(function () {
      intro.hidden = true;
      site.hidden = false;
      document.body.classList.remove("is-locked");
      window.scrollTo(0, 0);
      site.classList.add("is-entering");
      requestAnimationFrame(function () { flash.classList.remove("is-on"); });
    }, 1900 * k);
  }

  /* ------------------------------------------------------------------
     5) Khởi động
     ------------------------------------------------------------------ */
  setupMusic();

  var code = Mem.readCode(location.search);
  if (!code) {
    console.info("[Thiệp] Link thiếu mã khách (?k=...).");
    showStatus(T.badLink);
    return;
  }

  Mem.getThanks(C.memories, code)
    .catch(function () { return { ok: false, error: "network" }; })
    .then(function (res) {
      if (!res || !res.ok || !res.guest) {
        var err = (res && res.error) || "network";
        console.info("[Thiệp] Không mở được thư cảm ơn: " + err);
        showStatus(err === "not_found" ? T.badLink : T.netError);
        return;
      }
      var name = String(res.guest.name || "").trim() || T.nameFallback || "bạn";
      renderLine2(name);
      renderContent(res.guest);
      loading.hidden = true;
      cta.hidden = false;
      cta.addEventListener("click", openThanks);
    });
})();
