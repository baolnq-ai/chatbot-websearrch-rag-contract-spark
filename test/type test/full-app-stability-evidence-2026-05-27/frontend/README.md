# Frontend evidence

Thư mục này lưu ảnh chụp UI bằng Playwright cho các luồng chính: trang public, đăng nhập, chat workspace, settings, admin panel và menu công cụ.

Ảnh được chụp qua nginx `http://localhost:6101` để kiểm chứng đúng public entrypoint theo README.

Runner tương tác nằm tại `frontend/tests/full-app-ui.spec.mjs`; ảnh output vẫn ghi về thư mục evidence này.
