/* =====================================================================
   Thiệp cảm ơn + Album — phần dùng chung (không cần sửa file này)
   Nội dung chữ nằm trong assets/js/config.js (mục memories / thanks / album)
   ===================================================================== */
(function (root) {
  "use strict";

  var reduceMotion = !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- Dữ liệu tạm (chạy khi memories.endpoint = "") ---------- */
  function img(n) { return { thumb: "assets/img/mock/m" + n + ".svg", full: "assets/img/mock/m" + n + ".svg" }; }
  var MOCK_ALBUM = [img(1), img(2), img(3), img(4), img(5), img(6)];
  var MOCK_GUESTS = {
    demo: {
      name: "Lan Anh",
      message: "Cảm ơn Lan Anh đã đến chung vui cùng Châu hôm nay.\nCó bạn ở đó, ngày tốt nghiệp của Châu thêm trọn vẹn.",
      photos: [img(1), img(2), img(3)]
    },
    demo2: {
      name: "Bé <Na> & Tí",
      message: "Cảm ơn hai bạn nhỏ đã đến thật xinh.\nChâu rất vui khi có hai bạn.",
      photos: []
    }
  };
  var MOCK_PASSWORD = "demo";
  var MOCK_DELAY = 500;

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- Hàm thuần ---------- */
  function fillName(template, name) {
    return String(template == null ? "" : template).split("{ten}").join(name);
  }

  function readCode(search) {
    var k = new URLSearchParams(search || "").get("k");
    k = String(k == null ? "" : k).trim().toLowerCase();
    return /^[a-z0-9]{3,32}$/.test(k) ? k : "";
  }

  /* ---------- Gọi Apps Script ---------- */
  // Mọi lỗi mạng / quá giờ / không phải JSON / HTTP không 2xx đều thành {ok:false, error:"network"}.
  function request(url, init, opts) {
    opts = opts || {};
    var doFetch = opts.fetch || (root.fetch && root.fetch.bind(root));
    var timeoutMs = opts.timeoutMs == null ? 15000 : opts.timeoutMs;
    var NET = { ok: false, error: "network" };
    var timer;
    var timeout = new Promise(function (resolve) {
      timer = setTimeout(function () { resolve(NET); }, timeoutMs);
    });
    var call = Promise.resolve()
      .then(function () { return doFetch(url, init); })
      .then(function (res) {
        if (!res || !res.ok) return NET;
        return res.json();
      })
      .then(function (data) { return data && typeof data === "object" ? data : NET; })
      .catch(function () { return NET; });
    return Promise.race([call, timeout]).then(function (r) { clearTimeout(timer); return r; });
  }

  function getThanks(cfg, code, opts) {
    if (!cfg || !cfg.endpoint) {
      return wait(MOCK_DELAY).then(function () {
        var g = Object.prototype.hasOwnProperty.call(MOCK_GUESTS, code) ? MOCK_GUESTS[code] : null;
        return g ? { ok: true, guest: g } : { ok: false, error: "not_found" };
      });
    }
    var url = cfg.endpoint + "?action=thanks&k=" + encodeURIComponent(code);
    return request(url, { method: "GET" }, opts);
  }

  function unlockAlbum(cfg, password, opts) {
    if (!cfg || !cfg.endpoint) {
      return wait(MOCK_DELAY).then(function () {
        return password === MOCK_PASSWORD
          ? { ok: true, photos: MOCK_ALBUM }
          : { ok: false, error: "wrong_password" };
      });
    }
    var body = new URLSearchParams({ action: "album", password: password });
    return request(cfg.endpoint, { method: "POST", body: body }, opts);
  }

  /* ---------- DOM (chỉ chạy khi được gọi, không đụng DOM lúc nạp file) ---------- */
  function makeStars(box, reduce) {
    var n = reduce ? 28 : 72;
    var frag = document.createDocumentFragment();
    var NS = "http://www.w3.org/2000/svg";
    for (var i = 0; i < n; i++) {
      var el;
      var spark = Math.random() < 0.24;
      if (spark) {
        el = document.createElementNS(NS, "svg");
        el.setAttribute("class", "spark");
        el.setAttribute("aria-hidden", "true");
        var use = document.createElementNS(NS, "use");
        use.setAttribute("href", "#i-sparkle");
        el.appendChild(use);
        el.style.setProperty("--s", (9 + Math.random() * 12).toFixed(1) + "px");
        if (Math.random() < 0.35) el.style.setProperty("--c", "#F4D88E");
      } else {
        el = document.createElement("span");
        el.className = "star";
        el.style.setProperty("--s", (1.5 + Math.random() * 2.4).toFixed(1) + "px");
      }
      el.style.left = (Math.random() * 100).toFixed(2) + "%";
      el.style.top = (Math.pow(Math.random(), 1.3) * 92).toFixed(2) + "%";
      el.style.setProperty("--d", (2.6 + Math.random() * 3.6).toFixed(2) + "s");
      el.style.setProperty("--delay", (-Math.random() * 6).toFixed(2) + "s");
      frag.appendChild(el);
    }
    box.appendChild(frag);
  }

  function openLightbox(photos, index) {
    if (!photos || !photos.length) return;
    var i = Math.max(0, Math.min(index || 0, photos.length - 1));
    var opener = document.activeElement;

    var box = document.createElement("div");
    box.className = "mem-lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Xem ảnh");

    function btn(cls, label, text) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mem-lightbox__btn " + cls;
      b.setAttribute("aria-label", label);
      b.textContent = text;
      return b;
    }
    var close = btn("mem-lightbox__close", "Đóng", "✕");
    var prev = btn("mem-lightbox__prev", "Ảnh trước", "‹");
    var next = btn("mem-lightbox__next", "Ảnh sau", "›");
    var pic = document.createElement("img");
    pic.className = "mem-lightbox__img";
    pic.alt = "";
    var dl = document.createElement("a");
    dl.className = "mem-lightbox__dl";
    dl.textContent = "Tải ảnh";
    dl.target = "_blank";
    dl.rel = "noopener";
    box.appendChild(pic);
    box.appendChild(close);
    box.appendChild(prev);
    box.appendChild(next);
    box.appendChild(dl);

    function show() {
      pic.src = photos[i].full;
      dl.href = photos[i].full;
      var single = photos.length < 2;
      prev.hidden = single;
      next.hidden = single;
    }
    function go(d) { i = (i + d + photos.length) % photos.length; show(); }
    function shut() {
      document.removeEventListener("keydown", onKey);
      if (box.parentNode) box.parentNode.removeChild(box);
      document.body.style.overflow = prevOverflow;
      if (opener && opener.focus) opener.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") shut();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    }

    close.addEventListener("click", shut);
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    box.addEventListener("click", function (e) { if (e.target === box) shut(); });

    var x0 = null;
    box.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    document.body.appendChild(box);
    show();
    close.focus();
  }

  var api = {
    fillName: fillName,
    readCode: readCode,
    getThanks: getThanks,
    unlockAlbum: unlockAlbum,
    MOCK_GUESTS: MOCK_GUESTS,
    MOCK_ALBUM: MOCK_ALBUM,
    makeStars: makeStars,
    openLightbox: openLightbox,
    reduceMotion: reduceMotion
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Memories = api;
})(typeof window !== "undefined" ? window : globalThis);
