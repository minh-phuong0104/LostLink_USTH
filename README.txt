USTH LOST & FOUND PORTAL — FRONTEND COMPLETE
============================================

Cách chạy
---------
1. Giải nén thư mục.
2. Mở thư mục bằng VS Code.
3. Mở Index.html bằng Live Server.
4. Không cần npm, Node.js hay backend.

Dữ liệu demo
------------
Toàn bộ luồng chức năng dùng localStorage của trình duyệt, vì vậy các trang có thể chia sẻ dữ liệu với nhau khi chạy cùng một origin (ví dụ Live Server).

Tài khoản Admin demo
--------------------
Email: admin@usth.edu.vn
Password: Admin123!

Luồng demo nên dùng
-------------------
1. Vào post.html, chọn FOUND.
2. Nhập thông tin tài sản, đánh dấu "Tài sản giá trị cao" nếu cần và tạo câu hỏi xác minh bí mật.
3. Đăng tin và mở trang chi tiết.
4. Chọn "Yêu cầu nhận lại đồ", trả lời các câu hỏi và gửi hồ sơ.
5. Mở claims.html để xem trạng thái hồ sơ.
6. Vào admin/login.html -> Yêu cầu nhận đồ.
7. Admin xem câu trả lời, duyệt hồ sơ và cấp mã REC-XXXXXX.
8. Quay lại claims.html để mở Thẻ tiếp nhận tài sản.
9. Tại Security Desk, nhập mã REC hoặc mã sinh viên và xác nhận bàn giao.
10. Hồ sơ chuyển sang "Đã bàn giao" và bài FOUND được cập nhật trạng thái COMPLETED.

Các trang chức năng chính
-------------------------
- Index.html: dashboard/tổng quan Lost & Found.
- search.html: tra cứu toàn hệ thống với bộ lọc nâng cao.
- lost.html / found.html: danh sách tin.
- post.html: đăng LOST/FOUND, ảnh, high-value, câu hỏi xác minh.
- detail.html: chi tiết và gửi yêu cầu nhận lại đồ.
- campus-map.html: bản đồ khuôn viên, lọc LOST/FOUND, danh mục, zoom.
- claims.html: danh sách hồ sơ nhận đồ + thẻ tiếp nhận điện tử.
- claim-status.html: tra cứu một hồ sơ bằng mã CLM.
- security-report.html: gửi báo cáo an ninh.
- security-center.html: theo dõi tiến trình các báo cáo an ninh.
- contact.html / feedback-status.html: phản hồi hệ thống và tra cứu trạng thái.
- my-posts.html: quản lý bài bằng mã LL.
- admin/: dashboard, bài đăng, claim, an ninh, feedback.

Lưu ý
-----
Đây là frontend prototype. Đăng nhập, phân quyền, dữ liệu claim, mã tiếp nhận và báo cáo an ninh hiện được lưu ở trình duyệt để phục vụ demo. Khi triển khai thật, các phần này phải chuyển sang backend/database và xác thực phía server.
