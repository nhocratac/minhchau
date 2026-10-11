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
├── google-apps-script/Code.gs ← code lưu RSVP vào Google Sheet
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
