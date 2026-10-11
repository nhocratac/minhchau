/* =====================================================================
   Thiệp mời Lễ Tốt Nghiệp — logic
   Không cần sửa file này; mọi nội dung nằm trong assets/js/config.js
   ===================================================================== */
(function () {
  "use strict";

  var C = window.INVITE || {};
  var G = C.graduate || {};
  var E = C.event || {};
  var V = C.venue || {};
  var M = C.music || {};
  var R = C.rsvp || {};
  var T = C.text || {};
  var K = C.contact || {};

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var enc = encodeURIComponent;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* bỏ qua */ } }
  };

  /* ------------------------------------------------------------------
     Thông báo nhỏ
     ------------------------------------------------------------------ */
  var toastTimer;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-show"); }, 2600);
  }

  /* ------------------------------------------------------------------
     1) Đổ nội dung từ config vào trang
     ------------------------------------------------------------------ */
  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  function bindContent() {
    $$("[data-bind]").forEach(function (el) {
      var v = getPath(C, el.dataset.bind);
      if (v === undefined) return;
      if (v === "" || v === null) { el.hidden = true; return; }
      el.textContent = v;
    });

    // Tiêu đề màn mở đầu: tách từng chữ để chạy hiệu ứng
    var title = T.title || ["Lễ", "Tốt", "Nghiệp"];
    var lines = Array.isArray(title) ? title : String(title).split(/\s+/);
    var h1 = $("#introTitle");
    h1.textContent = "";
    h1.setAttribute("aria-label", lines.join(" "));
    var i = 0;
    lines.forEach(function (line) {
      var row = document.createElement("span");
      row.className = "line";
      row.setAttribute("aria-hidden", "true");
      Array.from(String(line).normalize("NFC")).forEach(function (ch) {
        var c = document.createElement("span");
        c.className = "ch";
        c.textContent = ch;
        c.style.animationDelay = (0.7 + i * 0.08).toFixed(2) + "s";
        i++;
        row.appendChild(c);
      });
      h1.appendChild(row);
    });

    if (Array.isArray(T.ceremony) && T.ceremony.length) {
      var h2 = $("#ceremony");
      h2.textContent = "";
      T.ceremony.forEach(function (t) {
        var s = document.createElement("span");
        s.textContent = t;
        h2.appendChild(s);
      });
    }

    var photo = $("#photo");
    if (G.photo) photo.src = G.photo;
    photo.alt = "Ảnh của " + (G.name || "người tốt nghiệp");

    if (G.name) document.title = "Thư mời Lễ Tốt Nghiệp · " + G.name;
  }

  /* ------------------------------------------------------------------
     2) Ngày giờ (luôn hiển thị theo múi giờ trong config)
     ------------------------------------------------------------------ */
  var start = new Date(E.start || Date.now() + 30 * 864e5);
  var end = new Date(E.end || start.getTime() + 2 * 36e5);
  var tz = E.timezone || "Asia/Ho_Chi_Minh";
  var WEEKDAYS = { Sun: "Chủ Nhật", Mon: "Thứ Hai", Tue: "Thứ Ba", Wed: "Thứ Tư", Thu: "Thứ Năm", Fri: "Thứ Sáu", Sat: "Thứ Bảy" };

  function dateParts(d) {
    var out = {};
    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz, year: "numeric", month: "numeric", day: "numeric",
        weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(d).forEach(function (p) { out[p.type] = p.value; });
    } catch (e) {
      out = {
        year: String(d.getFullYear()), month: String(d.getMonth() + 1), day: String(d.getDate()),
        weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
        hour: String(d.getHours()).padStart(2, "0"), minute: String(d.getMinutes()).padStart(2, "0")
      };
    }
    if (out.hour === "24") out.hour = "00";
    return out;
  }

  function renderDate() {
    var s = dateParts(start), e = dateParts(end);
    $("#dMonth").textContent = "Tháng " + s.month;
    $("#dDay").textContent = String(s.day).padStart(2, "0");
    $("#dWeekday").textContent = WEEKDAYS[s.weekday] || s.weekday;
    $("#dTime").textContent = s.hour + ":" + s.minute + " – " + e.hour + ":" + e.minute;
    $("#dYear").textContent = s.year;
    $("#dateBlock").setAttribute("aria-label",
      (WEEKDAYS[s.weekday] || "") + ", ngày " + s.day + " tháng " + s.month + " năm " + s.year +
      ", từ " + s.hour + ":" + s.minute + " đến " + e.hour + ":" + e.minute);
  }

  /* ------------------------------------------------------------------
     3) Đếm ngược
     ------------------------------------------------------------------ */
  function pad(n) { return String(n).padStart(2, "0"); }

  function tick() {
    var now = Date.now();
    var diff = start.getTime() - now;
    if (diff <= 0) {
      $("#countdown").hidden = true;
      var done = $("#cdDone");
      done.hidden = false;
      if (now < end.getTime()) done.textContent = "Buổi lễ đang diễn ra. Hẹn gặp bạn tại hội trường!";
      return false;
    }
    $("#cdDays").textContent = pad(Math.floor(diff / 864e5));
    $("#cdHours").textContent = pad(Math.floor(diff / 36e5) % 24);
    $("#cdMins").textContent = pad(Math.floor(diff / 6e4) % 60);
    $("#cdSecs").textContent = pad(Math.floor(diff / 1e3) % 60);
    return true;
  }

  function startCountdown() {
    if (!tick()) return;
    var timer = setInterval(function () { if (!tick()) clearInterval(timer); }, 1000);
  }

  /* ------------------------------------------------------------------
     4) Thêm vào lịch
     ------------------------------------------------------------------ */
  var placeText = [V.name, V.hall, V.address].filter(Boolean).join(", ");
  var eventTitle = "Lễ tốt nghiệp của " + (G.name || "mình");
  var inviteSentence = "Thân mời bạn đến dự lễ tốt nghiệp của " + (G.name || "mình") + ".";

  function toUTC(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }

  function icsEscape(s) { return String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1"); }

  // Gập dòng dài theo chuẩn iCalendar (75 byte/dòng)
  function icsFold(line) {
    var out = "", bytes = 0;
    Array.from(line).forEach(function (ch) {
      var b = unescape(enc(ch)).length;
      if (bytes + b > 73) { out += "\r\n "; bytes = 1; }
      out += ch;
      bytes += b;
    });
    return out;
  }

  function buildIcs() {
    var desc = inviteSentence + "\n" + placeText + "\n" + location.href.split("#")[0];
    var lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Thiep Tot Nghiep//VI", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + toUTC(start) + "-" + Math.random().toString(36).slice(2) + "@thiep-tot-nghiep",
      "DTSTAMP:" + toUTC(new Date()),
      "DTSTART:" + toUTC(start),
      "DTEND:" + toUTC(end),
      "SUMMARY:" + icsEscape(eventTitle),
      "LOCATION:" + icsEscape(placeText),
      "DESCRIPTION:" + icsEscape(desc),
      "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(eventTitle), "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ];
    return lines.map(icsFold).join("\r\n") + "\r\n";
  }

  function setupCalendar() {
    var details = inviteSentence + "\n" + placeText;
    $("#calGoogle").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + enc(eventTitle) +
      "&dates=" + toUTC(start) + "/" + toUTC(end) +
      "&details=" + enc(details) +
      "&location=" + enc(placeText) +
      "&ctz=" + enc(tz);

    $("#calIcs").addEventListener("click", function () {
      var blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "le-tot-nghiep.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      toast("Đã tải file lịch. Mở file để thêm vào lịch nhé.");
    });
  }

  /* ------------------------------------------------------------------
     5) Bản đồ & sao chép địa chỉ
     ------------------------------------------------------------------ */
  function setupMap() {
    var q = V.mapQuery || V.address || V.name || "";
    $("#mapDirections").href = "https://www.google.com/maps/dir/?api=1&destination=" + enc(q);

    var box = $("#mapBox");
    if (V.showMap === false || !q) { box.hidden = true; return; }
    var iframe = document.createElement("iframe");
    iframe.src = "https://maps.google.com/maps?q=" + enc(q) + "&z=16&hl=vi&output=embed";
    iframe.title = "Bản đồ đến " + (V.name || "địa điểm");
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;
    box.appendChild(iframe);
  }

  function setupCampusMap() {
    if (!V.campusMap) { $("#campus").hidden = true; return; }
    var full = V.campusMapFull || V.campusMap;
    var box = $("#campusBox");
    var link = $("#campusLink");
    $("#campusImg").src = V.campusMap;
    link.href = full;

    function close() {
      box.hidden = true;
      document.body.classList.remove("is-locked");
      link.focus();
    }
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var img = $("#campusFullImg");
      if (!img.getAttribute("src")) img.src = full;
      box.hidden = false;
      document.body.classList.add("is-locked");
      $(".lightbox__scroll", box).scrollLeft = 0;
      $("#campusClose").focus();
    });
    $("#campusClose").addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    if (!ok) throw new Error("copy failed");
  }

  /* ------------------------------------------------------------------
     Liên hệ: nút gọi điện và Zalo
     ------------------------------------------------------------------ */
  function setupContact() {
    var phone = String(K.phone || "").replace(/[^\d+]/g, "");
    if (!phone) { $("#lien-he").hidden = true; return; }
    $("#contactPhone").textContent = phone.replace(/^(\d{4})(\d{3})(\d+)$/, "$1 $2 $3");
    $("#contactCall").href = "tel:" + phone;
    $("#contactZalo").href = "https://zalo.me/" + phone;
  }

  function setupCopy() {
    $("#copyAddr").addEventListener("click", function () {
      var text = [V.name, V.hall, V.address].filter(Boolean).join(", ");
      copyText(text).then(function () { toast("Đã sao chép địa chỉ"); })
        .catch(function () {
          var r = document.createRange();
          r.selectNodeContents($("#placeAddr"));
          var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
          toast("Địa chỉ đã được bôi đen, bạn bấm Sao chép nhé");
        });
    });
  }

  /* ------------------------------------------------------------------
     6) Nhạc nền
     ------------------------------------------------------------------ */
  var audio = $("#bgm");
  var musicBtn = $("#musicBtn");
  var musicOK = !!M.src;
  var wantPlay = false;
  var resumeOnShow = false;
  var targetVol = Math.min(1, Math.max(0, M.volume == null ? 0.6 : Number(M.volume)));
  var fadeId = 0;

  function setMusicUI(on) {
    musicBtn.hidden = !musicOK;
    musicBtn.classList.toggle("is-playing", on);
    musicBtn.setAttribute("aria-pressed", String(on));
    musicBtn.setAttribute("aria-label", on ? "Tắt nhạc" : "Bật nhạc");
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
    audio.volume = 0;
    audio.addEventListener("error", function () {
      musicOK = false;
      musicBtn.hidden = true;
      console.warn("[Thiệp] Không tải được nhạc nền: " + M.src +
        "\n→ Thêm file .mp3 vào thư mục assets/music/ và kiểm tra music.src trong config.js.");
    });
    audio.src = M.src;
    musicBtn.addEventListener("click", function () {
      if (wantPlay && !audio.paused) pauseMusic(); else playMusic();
    });
    // Tạm dừng khi chuyển tab / tắt màn hình, phát lại khi quay lại
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (!audio.paused) { audio.pause(); resumeOnShow = true; }
      } else if (resumeOnShow && wantPlay) {
        resumeOnShow = false;
        audio.play().catch(function () { setMusicUI(false); wantPlay = false; });
      }
    });
  }

  /* ------------------------------------------------------------------
     7) Sao lấp lánh ở màn mở đầu
     ------------------------------------------------------------------ */
  function makeStars() {
    var box = $("#stars");
    var n = reduceMotion ? 28 : 72;
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

  /* ------------------------------------------------------------------
     8) Khung thiệp lượn sóng (vẽ theo kích thước thật của thiệp)
     ------------------------------------------------------------------ */
  function wavyPath(w, h) {
    var inset = 11, r = 42, amp = 7.5, waveLen = 74, step = 3;
    var x0 = inset, y0 = inset, x1 = w - inset, y1 = h - inset;
    r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
    var sw = x1 - x0 - 2 * r, sh = y1 - y0 - 2 * r, arc = Math.PI * r / 2;
    var corner = function (cx, cy, a0) {
      return function (t) {
        var a = a0 + t / r;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
      };
    };
    var segs = [
      { len: sw, f: function (t) { return { x: x0 + r + t, y: y0, nx: 0, ny: -1 }; } },
      { len: arc, f: corner(x1 - r, y0 + r, -Math.PI / 2) },
      { len: sh, f: function (t) { return { x: x1, y: y0 + r + t, nx: 1, ny: 0 }; } },
      { len: arc, f: corner(x1 - r, y1 - r, 0) },
      { len: sw, f: function (t) { return { x: x1 - r - t, y: y1, nx: 0, ny: 1 }; } },
      { len: arc, f: corner(x0 + r, y1 - r, Math.PI / 2) },
      { len: sh, f: function (t) { return { x: x0, y: y1 - r - t, nx: -1, ny: 0 }; } },
      { len: arc, f: corner(x0 + r, y0 + r, Math.PI) }
    ];
    var total = segs.reduce(function (a, s) { return a + s.len; }, 0);
    var waves = Math.max(4, Math.round(total / waveLen));
    var lambda = total / waves;
    var slow = total / 3;
    var d = "", s0 = 0;
    segs.forEach(function (seg) {
      for (var t = 0; t < seg.len; t += step) {
        var p = seg.f(t), s = s0 + t;
        var a = amp * (0.55 + 0.45 * Math.sin(2 * Math.PI * s / slow + 1.3));
        var off = a * Math.sin(2 * Math.PI * s / lambda);
        var x = p.x + p.nx * off;
        var y = p.y + p.ny * off;
        d += (d ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      }
      s0 += seg.len;
    });
    return d + "Z";
  }

  function drawFrame() {
    var card = $("#invite");
    var svg = $("#inviteFrame");
    var w = card.offsetWidth, h = card.offsetHeight;
    if (!w || !h) return;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.querySelector("path").setAttribute("d", wavyPath(w, h));
  }

  function watchFrame() {
    drawFrame();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { drawFrame(); }).observe($("#invite"));
    } else {
      window.addEventListener("resize", drawFrame);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawFrame);
  }

  /* ------------------------------------------------------------------
     9) Hiện dần khi cuộn
     ------------------------------------------------------------------ */
  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var els = $$("[data-reveal]");
    document.documentElement.classList.add("has-reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     10) Mở thiệp
     ------------------------------------------------------------------ */
  var opened = false;
  function openInvite() {
    if (opened) return;
    opened = true;
    playMusic();

    var intro = $("#intro"), door = $("#door"), flash = $("#flash"), site = $("#site");
    var k = reduceMotion ? 0.25 : 1;
    door.classList.add("is-open");
    door.setAttribute("aria-expanded", "true");

    setTimeout(function () { intro.classList.add("is-leaving"); }, 600 * k);
    setTimeout(function () { flash.classList.add("is-on"); }, 1150 * k);
    setTimeout(function () {
      intro.hidden = true;
      site.hidden = false;
      document.body.classList.remove("is-locked");
      window.scrollTo(0, 0);
      site.classList.add("is-entering");
      watchFrame();
      initReveal();
      requestAnimationFrame(function () { flash.classList.remove("is-on"); });
      var target = location.hash && document.getElementById(location.hash.slice(1));
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: "smooth" }); }, 900);
    }, 1900 * k);
  }

  /* ------------------------------------------------------------------
     11) Xác nhận tham gia (RSVP)
     ------------------------------------------------------------------ */
  var RSVP_KEY = "invite-rsvp-v1";

  function clientId() {
    var id = store.get("invite-client-id");
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      store.set("invite-client-id", id);
    }
    return id;
  }

  function sendRsvp(payload) {
    if (!R.endpoint) {
      // Chế độ demo: chưa gắn Google Sheet
      return wait(700).then(function () {
        return { ok: true, demo: true, stats: { yes: payload.attending === "yes" ? 1 : 0, no: payload.attending === "no" ? 1 : 0 } };
      });
    }
    var body = new URLSearchParams();
    Object.keys(payload).forEach(function (k) { body.append(k, payload[k]); });
    return fetch(R.endpoint, { method: "POST", body: body })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.error) || "Server error");
        return data;
      });
  }

  function setupRsvp() {
    var section = $("#xac-nhan");
    if (R.enabled === false) { section.hidden = true; return; }

    var form = $("#rsvpForm");
    var nameEl = $("#rsvpName");
    var guestsEl = $("#rsvpGuests");
    var msgEl = $("#rsvpMessage");
    var submit = $("#rsvpSubmit");
    var note = $("#rsvpNote");
    var done = $("#rsvpDone");
    var guestsField = $("#guestsField");
    var radios = $$('input[name="attending"]', form);

    if (R.askMessage === false) $("#messageField").hidden = true;

    function attending() {
      var r = radios.filter(function (x) { return x.checked; })[0];
      return r ? r.value : "";
    }
    function setNote(msg, isError) {
      note.textContent = msg || "";
      note.classList.toggle("is-error", !!isError);
    }
    function validate() {
      if (form.classList.contains("is-done")) return;
      submit.disabled = !(nameEl.value.trim() && attending());
      guestsField.hidden = !(R.askGuests !== false && attending() === "yes");
    }
    function clampGuests(v) { return Math.min(10, Math.max(1, parseInt(v, 10) || 1)); }

    form.addEventListener("input", validate);
    form.addEventListener("change", validate);
    $$(".stepper__btn", form).forEach(function (b) {
      b.addEventListener("click", function () {
        guestsEl.value = clampGuests(Number(guestsEl.value) + Number(b.dataset.step));
      });
    });
    guestsEl.addEventListener("blur", function () { guestsEl.value = clampGuests(guestsEl.value); });

    function lock(locked) {
      nameEl.readOnly = locked;
      msgEl.readOnly = locked;
      guestsEl.readOnly = locked;
      radios.forEach(function (r) { r.disabled = locked; });
      $$(".stepper__btn", form).forEach(function (b) { b.disabled = locked; });
    }

    function showStats(stats) {
      var yes = Number(stats && stats.yes) || 0, no = Number(stats && stats.no) || 0, total = yes + no;
      radios.forEach(function (r) {
        var box = r.nextElementSibling;
        var pct = total ? Math.round(((r.value === "yes" ? yes : no) / total) * 100) : 0;
        if (R.showStats === false || !stats) {
          box.querySelector(".choice__pct").textContent = "";
          box.querySelector(".choice__fill").style.removeProperty("--pct");
          return;
        }
        box.querySelector(".choice__pct").textContent = pct + "%";
        box.querySelector(".choice__fill").style.setProperty("--pct", pct + "%");
      });
    }

    function showDone(data, stats, demo) {
      nameEl.value = data.name || "";
      radios.forEach(function (r) { r.checked = r.value === data.attending; });
      guestsEl.value = clampGuests(data.guests || 1);
      msgEl.value = data.message || "";
      guestsField.hidden = !(R.askGuests !== false && data.attending === "yes");
      if (!msgEl.value) $("#messageField").hidden = true;

      form.classList.add("is-done");
      lock(true);
      submit.hidden = true;
      setNote("");
      // đợi một nhịp để thanh % chạy từ 0
      requestAnimationFrame(function () { requestAnimationFrame(function () { showStats(stats); }); });
      $("#rsvpSavedText").textContent = data.attending === "yes"
        ? "Đã lưu câu trả lời. Hẹn gặp bạn nhé!"
        : "Đã lưu câu trả lời. Cảm ơn bạn đã báo!";
      if (demo) setNote("Chế độ demo: chưa kết nối Google Sheet nên câu trả lời chưa được gửi đi.");
      done.hidden = false;
    }

    $("#rsvpEdit").addEventListener("click", function () {
      form.classList.remove("is-done");
      lock(false);
      submit.hidden = false;
      done.hidden = true;
      setNote("");
      if (R.askMessage !== false) $("#messageField").hidden = false;
      showStats(null);
      validate();
      nameEl.focus();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      validate();
      if (submit.disabled) return;
      if ($("#rsvpWebsite").value) return; // bot

      var payload = {
        name: nameEl.value.trim().slice(0, 80),
        attending: attending(),
        guests: attending() === "yes" ? clampGuests(guestsEl.value) : 0,
        message: R.askMessage === false ? "" : msgEl.value.trim().slice(0, 500),
        clientId: clientId(),
        userAgent: navigator.userAgent.slice(0, 180)
      };

      submit.classList.add("is-loading");
      submit.textContent = "Đang gửi";
      setNote("");

      sendRsvp(payload).then(function (res) {
        var saved = Object.assign({}, payload, { stats: res.stats || null, demo: !!res.demo, at: Date.now() });
        store.set(RSVP_KEY, saved);
        showDone(payload, res.stats, res.demo);
      }).catch(function (err) {
        console.error("[Thiệp] Gửi RSVP lỗi:", err);
        setNote("Chưa gửi được. Bạn kiểm tra kết nối mạng rồi bấm gửi lại nhé.", true);
      }).then(function () {
        submit.classList.remove("is-loading");
        submit.textContent = "Gửi xác nhận";
      });
    });

    // Khách đã trả lời trước đó: hiện lại câu trả lời
    var prev = store.get(RSVP_KEY);
    if (prev && prev.name && prev.attending) {
      showDone(prev, prev.stats, prev.demo);
      // lấy tỉ lệ mới nhất từ Google Sheet
      if (R.endpoint && R.showStats !== false) {
        fetch(R.endpoint).then(function (r) { return r.json(); })
          .then(function (d) { if (d && d.ok && d.stats) showStats(d.stats); })
          .catch(function () { /* giữ số cũ */ });
      }
    }
    validate();
  }

  /* ------------------------------------------------------------------
     Khởi động
     ------------------------------------------------------------------ */
  function init() {
    bindContent();
    renderDate();
    startCountdown();
    setupCalendar();
    setupMap();
    setupCopy();
    setupContact();
    setupCampusMap();
    setupMusic();
    setupRsvp();
    makeStars();
    $("#door").addEventListener("click", openInvite);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
