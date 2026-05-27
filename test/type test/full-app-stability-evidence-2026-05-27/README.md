# Evidence kiểm thử ổn định toàn app - 2026-05-27

Folder này lưu bằng chứng kiểm thử theo `testing-skill` cho phiên chạy local ngày 2026-05-27.

Phạm vi:

- `frontend/`: ảnh chụp UI sau thao tác thật trên nginx public port `6101`.
- `api/`: report HTML/JSON cho các API smoke qua dải port chuẩn `6100-6150`.
- `services/`: ảnh/report trạng thái service nền như backend, parse-data, embedding, vLLM và compose.

Nguyên tắc đọc evidence:

- Ảnh pass phải thấy cả hành động/input và kết quả/output trong cùng khung hình khi có thể.
- Ảnh loading, pending, empty state hoặc chỉ console log không được tính là pass.
- Không lưu token, cookie, API key, password thật hoặc dữ liệu cá nhân trong evidence.

Kết quả chính:

- API smoke: `26/26` pass, xem `api/api-smoke-report.html` hoặc `api/api-smoke-report.png`.
- UI smoke: `1 passed`, ảnh chính nằm trong `frontend/`.
- vLLM chạy trên `6106` và đã trả model/completion thật trong API smoke.
