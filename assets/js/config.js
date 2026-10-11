/* =====================================================================
   CẤU HÌNH THIỆP MỜI — bạn chỉ cần sửa file này
   ---------------------------------------------------------------------
   • Giữ nguyên dấu ngoặc kép "..." và dấu phẩy cuối mỗi dòng.
   • Sửa xong, lưu file rồi tải lại trang để xem.
   ===================================================================== */
window.INVITE = {

  /* ---------- Người tốt nghiệp ---------- */
  graduate: {
    name: "Nguyễn Minh Châu",
    degree: "Cử nhân Luật",                  // để "" nếu không muốn hiện
    // Ảnh chân dung tỉ lệ 3:4 (vd 600x800). Bỏ ảnh vào assets/img/ rồi đổi tên ở đây.
    photo: "assets/img/photo.jpg",           // vd: "assets/img/photo.jpg"
  },

  /* ---------- Thời gian (giờ Việt Nam, +07:00) ---------- */
  event: {
    start: "2026-10-17T09:30:00+07:00",      // NĂM-THÁNG-NGÀY T GIỜ:PHÚT:GIÂY
    end:   "2026-10-17T11:00:00+07:00",
    timezone: "Asia/Ho_Chi_Minh",            // thứ/ngày/giờ trên thiệp luôn tính theo múi giờ này
  },

  /* ---------- Địa điểm ---------- */
  venue: {
    name: "Trường Đại học Tôn Đức Thắng",
    hall: "",                                // để "" nếu không cần
    address: "19 Nguyễn Hữu Thọ, Quận 7, TP. Hồ Chí Minh",
    // Từ khóa để Google Maps tìm đúng chỗ: tên trường, địa chỉ, hoặc tọa độ "21.0285,105.8542".
    mapQuery: "Đại học Tôn Đức Thắng, 19 Nguyễn Hữu Thọ, Quận 7",
    showMap: true,                           // false = ẩn khung bản đồ, chỉ giữ nút "Chỉ đường"
  },

  /* ---------- Nhạc nền ---------- */
  music: {
    // Bỏ file .mp3 của bạn vào assets/music/ và đặt tên music.mp3 (hoặc đổi đường dẫn ở đây).
    // Nhạc bắt đầu phát khi khách chạm vào cánh cửa. Không có file thì nút nhạc tự ẩn.
    src: "assets/music/music.mp3",
    volume: 0.6,                             // 0 → 1
  },

  /* ---------- Liên hệ ---------- */
  contact: {
    // Số điện thoại: hiện nút "Gọi" và "Zalo". Để "" = ẩn cả mục Liên hệ.
    phone: "0976411503",
  },

  /* ---------- Xác nhận tham gia (RSVP) ---------- */
  rsvp: {
    enabled: true,
    // Dán URL Web App của Google Apps Script (xem README, mục 3). Để "" = chế độ demo, không lưu.
    endpoint: "https://script.google.com/macros/s/AKfycbx25b5tLOh6T8wX-0JiDSKm5G6e3dU9ybkLKfe8v-yclO_hiv9xiy0rZotAT0MAB7hj/exec",
    askGuests: true,                         // hỏi số người đi cùng
    askMessage: true,                        // ô gửi lời chúc
    showStats: true,                         // hiện tỉ lệ % sau khi gửi (giống video mẫu)
  },

  /* ---------- Chữ trên thiệp ---------- */
  text: {
    eyebrow: "Thư mời tham dự",
    title: ["Lễ", "Tốt", "Nghiệp"],          // mỗi phần tử là một dòng
    tapHint: "Chạm vào cánh cửa để mở thiệp",
    inviteLine: "Thân mời bạn đến dự",
    ceremony: ["Graduation", "Ceremony"],
    message: "4 năm, 1 tấm bằng, 0 lần bỏ cuộc 😚💪🏻\nMình đã chính thức hết hạn làm sinh viên, chính thức trở thành người lớn làm việc toàn thời gian 🫶🏻 Nên vào ngày tốt nghiệp sắp tới, mình không mong gì nhiều, chỉ mong được nhìn thấy mọi người ở đó, mỉm cười cùng mình, và cùng mình lưu lại một tấm hình. Vì có những khoảnh khắc chỉ đến một lần trong đời, và mình hi vọng sẽ có bạn trong khoảnh khắc ấy 💙💐🫶🏻\nReady for the next chapter.\nMission completed. 🎓",   // mục "Lời nhắn" ngay sau thiệp; \n = xuống dòng; để "" = ẩn
    closing: "Cảm ơn bạn đã đọc thiệp của Châu. Hẹn gặp bạn vào ngày 17/10 nhé!",
  },
};
