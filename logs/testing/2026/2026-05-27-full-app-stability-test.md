# Log kiểm thử ổn định toàn app - 2026-05-27

## Mục tiêu

Chạy lại hệ thống local theo README, giữ dải port dự án `6100-6150`, kiểm thử frontend/backend/service chính và lưu evidence có ảnh.

## Thay đổi trong phiên

- Cập nhật README để ghi rõ quy ước port local `6100-6150`.
- Sửa compose vLLM để tắt đủ multimodal dummy input: `image`, `audio`, `video`.
- Thêm `@playwright/test` dev dependency để chạy UI evidence tương tác.
- Thêm runner UI `frontend/tests/full-app-ui.spec.mjs`.
- Thêm evidence tại `test/type test/full-app-stability-evidence-2026-05-27/`.
- Điều chỉnh `.env` local `GPU_MEMORY_UTIL=0.30` để vLLM chạy ổn với free unified memory hiện tại.

## Kết quả chạy

- Docker/service:
  - Nginx public entrypoint `6101` trả `200`.
  - Backend docs `6102/docs` trả `200`.
  - Parse-data docs `6104/docs` trả `200`.
  - Embedding docs `6105/docs` trả `200`.
  - vLLM `6106/v1/models` trả `200`, model `google/gemma-4-E4B-it`.
- API smoke:
  - Command: `node test/type test/full-app-stability-evidence-2026-05-27/api/run-api-smoke.mjs`.
  - Kết quả: `26/26` pass.
  - Bao gồm vLLM chat completion ngắn và RAG SSE ngắn.
- Frontend UI smoke:
  - Command: `npx playwright test tests/full-app-ui.spec.mjs --reporter=line --workers=1 --timeout=90000`.
  - Kết quả: `1 passed`.
  - Evidence gồm signin error, signup, forgot password, chat workspace, tool menu và settings modal.
- Static checks:
  - `python3 -m py_compile ...`: pass.
  - `docker compose --env-file .env.example -f docker-compose.yml config`: pass.
  - `docker compose --env-file .env.example -f docker-compose.all.yml config`: pass.
  - `npm run build`: pass.
  - `npm run lint`: pass với 25 warnings hiện hữu, 0 errors.

## Ghi chú bộ nhớ

Máy GB10/DGX Spark dùng unified/shared memory. vLLM thấy tổng khoảng `121.69 GiB`, nhưng lúc init `GPU_MEMORY_UTIL=0.37` cần `45.03 GiB` free và fail khi free startup còn khoảng `39.75 GiB`. Sau khi thử lại, cấu hình `0.30` chạy ổn.

## Rủi ro còn lại

- `npm audit` báo 10 vulnerabilities từ dependency tree hiện tại; chưa chạy `npm audit fix` vì có thể làm đổi version ngoài phạm vi smoke test.
- Lint còn 25 warnings về hook dependencies và `<img>` từ source hiện hữu; không có error.
- Một số container ngoài dự án đang dùng port ngoài `6100-6150`; không can thiệp vì không thuộc repo này.

Trạng thái: completed.
