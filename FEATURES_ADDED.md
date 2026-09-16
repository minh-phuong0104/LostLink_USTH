# Các chức năng được bổ sung từ File 1

Bản này hoàn thiện front-end theo các luồng chức năng nổi bật của project React/Vite File 1 nhưng giữ kiến trúc HTML/CSS/JavaScript để chạy trực tiếp bằng Live Server.

## Người dùng / Sinh viên

- Dashboard tổng quan trạng thái trên Trang chủ.
- Tra cứu tài sản toàn hệ thống (`search.html`).
- Tìm kiếm theo từ khóa, mã, mô tả, tòa/phòng.
- Lọc danh mục, địa điểm, LOST/FOUND và tài sản giá trị cao.
- Sắp xếp mới nhất, cũ nhất hoặc theo mã.
- Bản đồ campus tương tác với lọc loại tin, danh mục và zoom.
- Trung tâm thông báo có số lượng chưa đọc và đánh dấu đã đọc.
- Chế độ Student / Security trên header.
- Bộ tùy chỉnh Liquid Glass: theme, độ trong, wallpaper, ảnh riêng, dimming, blur, liquid blobs.
- Đăng tin FOUND có điểm lưu giữ, vai trò người báo và cờ high-value.
- Người nhặt tạo tối đa 3 câu hỏi xác minh bí mật cho từng tài sản.
- Form Secure Claim hiển thị đúng câu hỏi của từng tài sản.
- Hồ sơ claim lưu câu trả lời riêng, bằng chứng bổ sung, khoa/chương trình, email và số điện thoại.
- Trang `claims.html` hiển thị toàn bộ hồ sơ đã tạo trên trình duyệt demo.
- Khi claim được duyệt, người dùng mở Thẻ tiếp nhận tài sản có mã REC.
- Tra cứu hồ sơ riêng bằng mã CLM tại `claim-status.html`.
- Báo cáo hoạt động đáng ngờ/khẩn cấp.
- Theo dõi tiến trình báo cáo tại `security-center.html`.

## Security / Admin

- Security Desk quản lý claim.
- Xem câu trả lời của từng câu hỏi xác minh và gợi ý do người nhặt đặt.
- Duyệt claim và cấp mã tiếp nhận REC.
- Từ chối claim và ghi chú lý do.
- Nhập trực tiếp mã REC hoặc mã sinh viên để xác minh tại quầy.
- Xác nhận bàn giao vật lý và chuyển claim sang Completed.
- Danh sách tài sản FOUND đang lưu giữ.
- Quản lý báo cáo an ninh: điều tra, cử tuần tra, hoàn tất.
- Dashboard có số claim chờ duyệt, cảnh báo an ninh, tỷ lệ bàn giao và tài sản giá trị cao.

## Dữ liệu & Demo

Các trang dùng chung localStorage:
- `lostlink_usth_posts_v1`
- `lostlink_usth_claims_v1`
- `lostlink_usth_security_reports_v1`
- `lostlink_usth_notifications_v1`
- `lostlink_usth_ui_preferences_v1`

Nhờ đó toàn bộ flow có thể demo mà không cần backend.
