# Admin Frontend - Lost&Found USTH

## Truy cập

Chạy project bằng HTTP server, sau đó mở:

- Website: `http://localhost:8080/Index.html`
- Admin: `http://localhost:8080/admin/login.html`

Tài khoản demo Frontend:

- Email: `admin@usth.edu.vn`
- Password: `Admin123!`

## Mã quản lý bài đăng

Admin xem mã quản lý tại **Quản lý bài đăng** (`admin/posts.html`).

Bảng hiển thị trực tiếp:

- Tiêu đề
- LOST / FOUND
- Trạng thái
- **Mã quản lý LL-XXXXXX**
- Ngày đăng
- Thao tác

Nút **Xem** mở chi tiết và hiển thị lại mã quản lý kèm nút **Sao chép**.

## Phản hồi hệ thống

Người dùng gửi phản hồi tại `contact.html`.

Admin xem tại `admin/feedback.html` và có thể đổi trạng thái:

`Mới -> Đã đọc -> Đã xử lý`

## Lưu ý

Đây là bản Frontend-only. Đăng nhập Admin, mã quản lý, bài đăng và phản hồi đang dùng localStorage/sessionStorage để demo. Khi triển khai thật, quyền Admin và mã quản lý phải được xác thực phía backend.


## Theo dõi phản hồi bằng mã

- Khi người dùng gửi phản hồi từ `contact.html`, hệ thống tạo mã dạng `FB-XXXXXX`.
- Người dùng tra cứu tại `feedback-status.html`.
- Admin mở `admin/feedback.html`, có thể đánh dấu **Đã đọc**, nhập **Phản hồi của Admin**, rồi chọn **Đã xử lý**.
- Trạng thái được lưu theo `NEW -> READ -> RESOLVED`; thời điểm đọc/xử lý và nội dung trả lời được hiển thị cho người dùng khi tra cứu mã.
- Vì đây là frontend-only, dữ liệu dùng `localStorage` và chỉ đồng bộ trong cùng origin/trình duyệt.
