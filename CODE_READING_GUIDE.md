# Đọc code LostLink USTH

Tài liệu này ghi lại cấu trúc **đang có trong code** ở nhánh `codex/refactor-layout-20260917`. Nó giúp tìm đúng file khi sửa một chức năng; `README.md` vẫn là hướng dẫn cài đặt và chạy dự án.

## Các trang và chức năng

| Trang | Chức năng chính |
| --- | --- |
| `index.html` | Trang chủ, tin mới, lối vào các chức năng. |
| `lost.html`, `found.html` | Danh sách tin LOST/FOUND, tìm kiếm và lọc trên dữ liệu đã tải. |
| `search.html` | Tra cứu tài sản với bộ lọc loại, danh mục, vị trí, giá trị cao và sắp xếp. |
| `detail.html` | Chi tiết bài, liên hệ, chia sẻ, phản hồi và gửi yêu cầu nhận đồ cho tin FOUND. |
| `post.html`, `success.html` | Tạo/sửa tin, upload ảnh, câu hỏi xác minh; hiện và sao chép mã quản lý sau khi đăng. |
| `my-posts.html` | Tra cứu bằng mã quản lý, sửa, hoàn tất hoặc xóa tin. |
| `claims.html`, `claim-status.html` | Thông tin yêu cầu nhận đồ và tra cứu trạng thái bằng mã. |
| `contact.html`, `feedback-status.html` | Gửi phản hồi và tra cứu phản hồi bằng mã. |
| `campus-map.html` | Bản đồ các vị trí và bài đăng liên quan. |
| `security-report.html`, `security-center.html` | Gửi báo cáo an ninh và theo dõi sự việc. |
| `admin/login.html`, `admin/dashboard.html` | Đăng nhập admin, tổng quan và tin/phản hồi gần đây. |
| `admin/posts.html`, `admin/claims.html` | Kiểm duyệt bài và xử lý yêu cầu nhận đồ. |
| `admin/feedback.html`, `admin/security.html` | Xem/trả lời phản hồi và xử lý báo cáo an ninh. |

## Đường đi của dữ liệu

1. HTML tạo form và các phần tử có `id`, `class` hoặc `data-*`; JavaScript tìm chúng để gắn sự kiện và hiển thị dữ liệu.
2. `asset/js/config.js` đặt URL backend. `asset/js/api.js` gom `fetch`, JSON, token admin và xử lý lỗi vào `window.LostLink.request`.
3. Các file giao diện gọi API trong `backend/server.js`. Mỗi nhóm `/api/...` đi qua `backend/routes/`, middleware (rate limit, quyền truy cập) rồi tới `backend/controllers/`.
4. Controller kiểm tra dữ liệu, gọi PostgreSQL qua `backend/config/database.js`, rồi trả JSON. `backend/database/schema.sql` mô tả các bảng `users`, `posts`, `claims`, `feedback`, `security_reports`, `uploaded_images`.
5. Khi đăng tin có ảnh: `main.js` gửi file tới `POST /api/uploads`; backend xử lý ảnh và lưu trên Storage, trả `imageUrl`; sau đó `main.js` gửi dữ liệu tới `POST /api/posts`. Mã quản lý từ phản hồi được giữ trong `sessionStorage` của tab và hiển thị ở `success.html`.
6. Trang danh sách lấy tin một lần từ API rồi lọc/sắp xếp trong trình duyệt. Trang tìm kiếm đầy đủ dùng `portal-complete.js`. Chi tiết tin phát sự kiện `lostlink:detail-loaded` để `portal-features.js` khởi tạo nút yêu cầu nhận đồ sau khi bài đã tải.
7. Admin dùng JWT trong `localStorage`; `admin.js` kiểm tra quyền bằng `/api/auth/me` trước khi tải dữ liệu quản trị. Yêu cầu nhận đồ, phản hồi và báo cáo được xử lý qua controller tương ứng.

## Các đường API hiện tại

| Nhóm | HTTP method và đường dẫn |
| --- | --- |
| Xác thực | `POST /api/auth/login`, `GET /api/auth/me` |
| Tin | `GET /api/posts`, `POST /api/posts/mine`, `GET /api/posts/:id`, `POST /api/posts`, `PUT /api/posts/:id`, `PATCH /api/posts/:id/status`, `DELETE /api/posts/:id` |
| Yêu cầu nhận đồ | `POST /api/claims`, `GET /api/claims/track/:code`, `GET /api/claims/post/:postId`, `GET /api/claims`, `PUT /api/claims/:id/status` |
| Phản hồi | `POST /api/feedback`, `GET /api/feedback/track/:code`, `GET /api/feedback`, `PUT /api/feedback/:id` |
| An ninh | `POST /api/security-reports`, `GET /api/security-reports/track/:code`, `GET /api/security-reports`, `PUT /api/security-reports/:id/status` |
| Quản trị | `GET /api/admin/dashboard`, `GET /api/admin/posts`, `PATCH /api/admin/posts/:id/status` |
| Ảnh | `POST /api/uploads` (multipart, field `image`) |

`GET /api/health` dùng để kiểm tra backend. Các route admin và route danh sách/cập nhật yêu cầu, phản hồi, báo cáo chỉ dành cho admin; xem `backend/routes/` để thấy middleware chính xác.

## File phụ thuộc nhau thế nào

- Trang công khai tải CSS theo thứ tự `base.css` → `main.css` → `portal-features.css` → `portal-complete.css` → `lostlink.css`. Quy tắc phía sau có thể ghi đè quy tắc phía trước; kiểm tra cả năm file trước khi xóa hoặc đổi selector.
- Trang công khai tải JS theo thứ tự `config.js` → `api.js` → `auth.js` → `main.js` → `portal-features.js` → `portal-complete.js` → `lostlink-ui.js`. Một số trang còn tải `catalog.js` trước `api.js`. `catalog.js` cũng được backend dùng để chuẩn hóa danh mục/vị trí.
- Trang admin tải `admin.css` → `admin-features.css` → `admin-complete.css` → `admin-lostlink.css`, và JS `config.js` → `api.js` → `admin.js` → `admin-features.js` → `admin-complete.js`.
- Nhiều phần tử được tạo bằng template string JavaScript, nên một class không xuất hiện trong HTML vẫn có thể đang được dùng. Các hàm khởi tạo chạy ở `DOMContentLoaded`; giữ thứ tự script và sự kiện khi sửa.

## Thứ tự đọc đề xuất

1. Đọc `success.html`, `post.html`, `lost.html` để thấy HTML cung cấp điểm gắn cho JS.
2. Đọc `asset/js/config.js`, `api.js`, rồi phần `loadListingPosts`/`readListingFilters`/`filterAndSortListingPosts`/`renderListingPosts` trong `main.js` để theo dõi một vòng lấy và hiển thị tin.
3. Đọc `backend/server.js`, `backend/routes/postRoutes.js`, rồi `backend/controllers/postController.js` để nối yêu cầu HTTP tới truy vấn SQL và kiểm tra mã quản lý.
4. Đọc `asset/js/portal-features.js`, `portal-complete.js` cho yêu cầu nhận đồ, tìm kiếm, bản đồ và an ninh; `asset/js/admin.js`, `admin-features.js` cho quản trị.
5. Cuối cùng đọc `backend/database/schema.sql` và controller của từng nhóm. Khi sửa CSS, dò selector qua các file CSS theo đúng thứ tự tải nêu trên.

## Mốc kiểm tra của đợt này

- Trước sửa: commit `2081cf1`, cây làm việc sạch, backend có 7/7 test đạt. Ảnh người dùng cho thấy mã quản lý dài tràn khỏi ô trên trang thành công.
- Sau sửa: backend có 8/8 test đạt; bài kiểm tra thao tác tìm/lọc/sắp xếp/reset danh sách có 1/1 đạt; cú pháp JS và cấu trúc/thành phần hiển thị của `success.html` đã được đối chiếu.
- Chưa kiểm tra bằng trình duyệt/DB thật trong đợt này. Không chạy migration, không sửa dữ liệu production, không push/merge/deploy.
