# Thiệp mời Lễ Tốt Nghiệp (website)

Website thiệp mời tốt nghiệp dạng một trang, màu chủ đạo xanh ngọc `#BFDDF0`.
Không cần cài đặt hay build: chỉ là HTML/CSS/JS thuần, deploy được ngay lên **GitHub Pages** hoặc **Vercel**.

**Có sẵn:**

- Màn mở đầu bầu trời lấp lánh, chạm vào cánh cửa để mở thiệp (cửa mở, sáng lên rồi chuyển cảnh)
- Thiệp mời: thẻ ảnh đeo cổ, khung lượn sóng, tên, ngày giờ, địa điểm
- Nhạc nền: bắt đầu phát khi khách chạm cửa, nút đĩa than để bật/tắt, tự dừng khi chuyển tab
- Đồng hồ đếm ngược đến buổi lễ
- Nút lưu vào Google Calendar và file lịch cho iPhone/Outlook (.ics)
- Bản đồ Google Maps, nút chỉ đường, nút sao chép địa chỉ
- Form xác nhận tham gia (RSVP) lưu vào Google Sheet, hiện tỉ lệ % như video mẫu
- Ảnh xem trước khi gửi link qua Zalo/Facebook

---

## 1. Cấu trúc thư mục

```
thiep-tot-nghiep/
├── index.html                 ← khung trang (ít khi cần sửa)
├── assets/
│   ├── js/config.js           ← ★ NỘI DUNG THIỆP: sửa ở đây
│   ├── js/main.js             ← logic (không cần sửa)
│   ├── css/style.css          ← giao diện, màu sắc
│   ├── img/avatar.svg         ← ảnh mẫu, thay bằng ảnh của bạn
│   ├── img/og-cover.jpg       ← ảnh hiện khi chia sẻ link
│   └── music/                 ← ★ bỏ file music.mp3 vào đây
├── cam-on.html                ← trang thiệp cảm ơn riêng từng khách (mục 9)
├── album.html                 ← trang album gia đình có mật khẩu (mục 9)
├── google-apps-script/Code.gs ← code lưu RSVP vào Google Sheet
├── google-apps-script/Memories.gs ← code cho thiệp cảm ơn + album (mục 9)
└── .nojekyll                  ← giúp GitHub Pages phục vụ đúng file
```

## 2. Sửa nội dung thiệp

Mở `assets/js/config.js` và sửa các dòng:

| Mục | Ý nghĩa |
|---|---|
| `graduate.name`, `graduate.degree` | Tên và ngành/bằng |
| `graduate.photo` | Đường dẫn ảnh chân dung (tỉ lệ 3:4, ví dụ 600×800) |
| `event.start`, `event.end` | Giờ bắt đầu/kết thúc, dạng `2026-12-19T16:30:00+07:00` |
| `venue.name`, `venue.hall`, `venue.address` | Tên trường, hội trường, địa chỉ |
| `venue.mapQuery` | Từ khóa để bản đồ tìm đúng chỗ (tên trường hoặc tọa độ) |
| `music.src`, `music.volume` | File nhạc và âm lượng |
| `rsvp.endpoint` | URL Google Apps Script (mục 4) |
| `text.*` | Các câu chữ trên thiệp |

Thứ trong tuần, tháng, năm và giờ trên thiệp được **tính tự động** từ `event.start`.

**Đổi ảnh:** chép ảnh vào `assets/img/` (ví dụ `photo.jpg`, nên nén dưới 300 KB), rồi sửa `photo: "assets/img/photo.jpg"`.

**Thêm nhạc:** chép file mp3 vào `assets/music/` và đặt tên `music.mp3`. Nên dùng file dưới 5 MB. Chưa có nhạc thì nút nhạc tự ẩn.
Trình duyệt chặn tự phát nhạc khi chưa có thao tác của người dùng, vì vậy nhạc bắt đầu đúng lúc khách chạm vào cánh cửa.

**Đổi tiêu đề khi chia sẻ link:** sửa thẻ `<title>` và các thẻ `og:` ở đầu `index.html` (Zalo/Facebook đọc trực tiếp từ HTML, không đọc config.js).

**Đổi màu:** các biến màu nằm ở đầu `assets/css/style.css` (`--sky` là màu chủ đạo `#BFDDF0`, `--navy` là màu chữ).

## 3. Xem thử trên máy

Cách dễ nhất: mở thư mục bằng **VS Code**, cài extension **Live Server**, bấm chuột phải `index.html` → *Open with Live Server*.

Hoặc dùng Python:

```bash
cd thiep-tot-nghiep
python3 -m http.server 8000
# mở http://localhost:8000
```

## 4. Lưu câu trả lời RSVP vào Google Sheet (miễn phí, 5 phút)

Khi `rsvp.endpoint` để trống, form chạy **chế độ demo** (không lưu, có dòng nhắc "Chế độ demo"). Để lưu thật:

1. Vào [sheets.new](https://sheets.new) tạo một Google Sheet mới, đặt tên ví dụ *RSVP Tốt nghiệp*.
2. Menu **Tiện ích mở rộng → Apps Script** (Extensions → Apps Script).
3. Xóa code mẫu, dán toàn bộ nội dung file `google-apps-script/Code.gs`, bấm **Lưu**.
4. Chọn hàm `setup` trên thanh công cụ → bấm **Chạy** → cấp quyền cho tài khoản Google của bạn
   (nếu hiện "Google chưa xác minh ứng dụng này": *Nâng cao → Đi tới … (không an toàn)*; đây là script của chính bạn).
5. Bấm **Triển khai → Tùy chọn triển khai mới** (Deploy → New deployment):
   - Loại: **Ứng dụng web** (Web app)
   - Thực thi dưới dạng: **Tôi** (Me)
   - Người có quyền truy cập: **Bất kỳ ai** (Anyone)
6. Bấm **Triển khai**, sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`).
7. Dán URL vào `config.js`:
   ```js
   rsvp: { enabled: true, endpoint: "https://script.google.com/macros/s/XXXX/exec", ... }
   ```
8. Gửi thử một câu trả lời trên web, mở Google Sheet sẽ thấy dòng mới trong trang tính **RSVP**.

Lưu ý:

- Nếu sau này sửa `Code.gs`, phải vào **Triển khai → Quản lý triển khai → ✏️ → Phiên bản: Mới** thì thay đổi mới có hiệu lực (URL giữ nguyên).
- Khách bấm "Sửa câu trả lời" rồi gửi lại thì dòng cũ được cập nhật, không bị trùng.
- Tỉ lệ % hiển thị cho khách chỉ gồm số người đến/không đến, không lộ tên. Muốn ẩn tỉ lệ: `showStats: false`.

## 5. Deploy lên GitHub Pages

1. Tạo repository mới trên GitHub (ví dụ `thiep-tot-nghiep`), để **Public**.
2. Đưa code lên:
   ```bash
   cd thiep-tot-nghiep
   git init
   git add .
   git commit -m "Thiệp mời tốt nghiệp"
   git branch -M main
   git remote add origin https://github.com/<ten-ban>/thiep-tot-nghiep.git
   git push -u origin main
   ```
   (Không dùng Git: trên trang repo bấm **Add file → Upload files**, kéo thả toàn bộ file và thư mục vào.)
3. Vào **Settings → Pages** → *Source*: **Deploy from a branch** → Branch: `main`, thư mục `/ (root)` → **Save**.
4. Sau 1–2 phút, web chạy tại `https://<ten-ban>.github.io/thiep-tot-nghiep/`.

Mọi đường dẫn trong project là đường dẫn tương đối nên chạy đúng cả khi web nằm trong thư mục con như trên.

## 6. Deploy lên Vercel

1. Đưa code lên GitHub như bước 1–2 ở trên.
2. Vào [vercel.com](https://vercel.com) → đăng nhập bằng GitHub → **Add New → Project** → chọn repo.
3. *Framework Preset*: **Other**. Để trống Build Command và Output Directory → **Deploy**.
4. Web chạy tại `https://<ten-project>.vercel.app`. Mỗi lần `git push`, Vercel tự cập nhật.

Hoặc dùng dòng lệnh: `npm i -g vercel`, rồi chạy `vercel` trong thư mục project.

## 7. Sau khi deploy

- **Ảnh xem trước khi chia sẻ:** sửa `og:image` trong `index.html` thành URL đầy đủ, ví dụ
  `https://<ten-ban>.github.io/thiep-tot-nghiep/assets/img/og-cover.jpg`.
  Zalo và Facebook lưu bộ nhớ đệm ảnh xem trước; nếu sửa sau khi đã gửi link, dùng
  [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) để làm mới.
- Mở thử trên điện thoại (cả Safari và Chrome), bấm thử RSVP, kiểm tra Google Sheet.
- Đường dẫn có thể thêm `#xac-nhan` để sau khi mở cửa trang tự cuộn tới form RSVP.

## 8. Câu hỏi thường gặp

**Nhạc không phát?** Kiểm tra đúng tên file `assets/music/music.mp3` (phân biệt hoa thường trên GitHub Pages). Mở DevTools → Console để xem thông báo `[Thiệp]`.

**Gửi RSVP báo lỗi?** Kiểm tra URL kết thúc bằng `/exec`, quyền truy cập là *Bất kỳ ai*, và đã tạo phiên bản triển khai mới sau khi sửa code.

**Muốn bỏ bản đồ nhúng?** Đặt `venue.showMap: false`; nút *Chỉ đường* vẫn giữ.

**Muốn bỏ hẳn RSVP?** Đặt `rsvp.enabled: false`.

## 9. Thiệp cảm ơn & Album kỷ niệm

Hai trang mới, dùng chung Google Sheet và Apps Script với RSVP:

- `cam-on.html?k=<mã>`: thiệp cảm ơn riêng cho từng khách, có lời nhắn của Châu và 2–3 ảnh của khách đó.
- `album.html`: album gia đình có mật khẩu, tự chia thành các phần theo thư mục con trên Google Drive.

**Chưa kết nối Sheet thì hai trang chạy chế độ demo** (chỉ có ảnh mẫu): mở `cam-on.html?k=demo`; album dùng mật khẩu `demo`.

### 9.1. Chủ tài khoản làm một lần

1. Trên Google Drive, tạo thư mục **Thiệp cảm ơn** (bên trong sẽ có một thư mục con cho mỗi khách) và thư mục **Album**.
2. Với cả hai thư mục cha: chuột phải → **Chia sẻ** → *Quyền truy cập chung* → **Bất kỳ ai có đường liên kết – Người xem** (chỉ cần đặt một lần). Chia sẻ thêm cho Châu với quyền **Người chỉnh sửa** (Editor).
3. Mở Google Sheet RSVP → **Tiện ích mở rộng → Apps Script**. Bấm dấu **+** cạnh *Tệp* → **Tập lệnh**, đặt tên `Memories`, rồi dán toàn bộ nội dung `google-apps-script/Memories.gs`.
4. Mở `Code.gs`, xóa nội dung cũ và dán lại toàn bộ `google-apps-script/Code.gs` mới (bản mới có thêm phần chuyển yêu cầu sang `Memories.gs`), bấm **Lưu**.
5. Chọn hàm `setupThanks` trên thanh công cụ → **Chạy** → cấp quyền, lần này có thêm quyền truy cập Google Drive. Sheet sẽ có thêm trang tính **CamOn**.
6. Vào **Cài đặt dự án** (Project Settings, biểu tượng bánh răng) → **Thuộc tính tập lệnh** (Script Properties) → thêm hai dòng:
   - `ALBUM_PASSWORD`: mật khẩu album (tự đặt).
   - `ALBUM_FOLDER_ID`: ID của thư mục cha **Album** (đoạn cuối của link, sau `/folders/`).
   - `THANKS_FOLDER_ID` (tuỳ chọn): ID của thư mục **Thiệp cảm ơn**, để dùng nút **Tạo thư mục cho khách** ở mục 9.2.
7. ⚠️ Bước 5 (chạy `setupThanks` và cấp quyền Drive) **phải xong trước bước này**, nếu không toàn bộ web app, kể cả RSVP, sẽ báo lỗi xin quyền. Bấm **Triển khai → Quản lý triển khai → ✏️** (sửa triển khai hiện có) → *Phiên bản*: **Phiên bản mới** → **Triển khai**. **Không** tạo triển khai mới, vì URL sẽ đổi và RSVP ngừng chạy.
8. Trong `assets/js/config.js`, đặt `memories.endpoint` bằng **đúng URL** của `rsvp.endpoint` (dạng `https://script.google.com/macros/s/…/exec`).
9. Tải lại Google Sheet, sẽ thấy menu **Thiệp cảm ơn**.

Lưu ý bảo mật: repo này là **public**, vì vậy **không** ghi mật khẩu album hay ID thư mục vào code, README hay config.js. Chúng chỉ nằm trong Script Properties. Chỉ gửi link `album.html` và mật khẩu riêng cho gia đình (nhắn tin riêng, không đăng nhóm công khai). Nhập sai mật khẩu 10 lần thì album khóa khoảng 10 phút.

### 9.2. Châu làm cho mỗi khách

**Cách nhanh cho nhiều khách:** dán danh sách tên vào cột `Tên gọi` (mỗi tên một dòng), bấm **Thiệp cảm ơn → Tạo thư mục cho khách**. Script tạo sẵn trong **Thiệp cảm ơn** một thư mục cho mỗi khách và tự điền cột `Thư mục ảnh`; dòng đã có link thì bỏ qua, thư mục trùng tên thì dùng lại. Sau đó chỉ cần bỏ ảnh vào từng thư mục, điền `Lời chúc`, rồi làm bước 3–4 bên dưới.

Hoặc làm tay từng khách:

1. Trong thư mục **Thiệp cảm ơn** trên Drive, tạo thư mục con theo tên khách và bỏ vào 2–3 ảnh **JPG**. Ảnh chụp nhóm thì sao chép vào thư mục của từng người.
2. Mở Google Sheet, vào trang tính **CamOn**, điền một dòng cho khách:
   - `Tên gọi`: cách gọi khách trên thiệp (ví dụ *chị Lan*).
   - `Lời chúc`: lời nhắn riêng của Châu.
   - `Thư mục ảnh`: dán link thư mục của khách (chuột phải thư mục → Chia sẻ → Sao chép đường liên kết).
3. Bấm menu **Thiệp cảm ơn → Tạo mã & link**. Cột `Mã` và `Link` tự được điền.
4. Sao chép cột `Link` gửi cho khách qua Zalo.

Mã của khách **không bao giờ đổi** sau khi đã tạo, nên link gửi rồi vẫn dùng được khi Châu sửa lời hay thêm ảnh.

### 9.3. Khi thêm hoặc đổi nội dung

- Thêm/đổi ảnh, hoặc sửa `Tên gọi`/`Lời chúc` xong, bấm **Thiệp cảm ơn → Làm mới cache ảnh**. Nếu không, thay đổi có thể mất tới **6 giờ** mới hiện.
- Ảnh không hiện trên thiệp hoặc album: bấm **Thiệp cảm ơn → Bật chia sẻ ảnh (dự phòng)**.

### 9.4. Album chia phần theo thư mục

- Mỗi **thư mục con** bên trong **Album** là một phần của trang album, sắp theo tên thư mục. Ví dụ `1. Ngày lễ` và `2. Pregrad` hiện thành hai phần **Ngày lễ** và **Pregrad** (tiền tố số `1. `, `2. ` được ẩn đi).
- Ảnh để thẳng trong thư mục **Album** (không nằm trong thư mục con) tạo thành phần đầu tiên, không có tiêu đề.
- Muốn đổi thứ tự thì đổi số đầu tên thư mục. Vì sắp xếp theo thứ tự chữ cái, nếu có từ 10 phần trở lên hãy dùng `01. `, `02. `, … (nếu không `10. ` sẽ đứng trước `2. `).
- Tránh đặt tiêu đề bắt đầu bằng năm rồi tới dấu `.` hoặc `-` (ví dụ `2024. Pregrad`), vì phần số đó cũng bị coi là tiền tố và bị ẩn.
- Album hiện tối đa 300 ảnh; phần rỗng không hiện.

### 9.5. Lưu ý về ảnh

- Ưu tiên ảnh **JPG**. Ảnh HEIC (iPhone) có thể không hiển thị, hãy đổi sang JPG trước khi tải lên.
- Chưa hỗ trợ video.
- Chữ trên hai trang sửa trong `config.js` ở các mục `thanks` và `album`.
