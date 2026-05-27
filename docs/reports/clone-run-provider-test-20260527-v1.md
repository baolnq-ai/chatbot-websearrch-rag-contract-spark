# Báo cáo: clone, chạy tmux và test provider

- Ngày: 2026-05-27
- Trạng thái: completed
- Plan: `plans/plan-clone-run-provider-test-20260527-v1.md`
- Log: `logs/tasks/2026/2026-05-27-clone-run-provider-test.md`

## Tóm tắt

Task này clone repo, đọc tài liệu/source hiện có, chuẩn hóa cách chạy local theo dải port 6101-6150 và kiểm thử provider theo khả năng môi trường.

## Kết quả

- Repo đã clone thành công.
- Đã đọc các tài liệu vận hành chính và test web search cũ.
- Đã cập nhật mặc định local sang dải port `6101-6150`.
- Đã đổi tmux session mặc định sang `rag-chatbot-code`.
- Đã chạy `bash ./run_all_services.sh`; Docker services và tmux code services đã lên.
- Đã sửa lỗi fresh clone ở backend: `StaticFiles(directory="static")` bị fail khi `backend/static` chưa tồn tại.
- Đã test provider CRUD qua API root: tạo thử OpenRouter, Groq, Local vLLM provider configs rồi cleanup.

## Verify Đã Chạy

- `docker compose --env-file .env.example -f docker-compose.yml config`
- `docker compose --env-file .env.example -f docker-compose.all.yml config`
- `python3 -m py_compile backend/main.py backend/service/admin_setting_service.py backend/service/runtime_config_service.py`
- `npm run lint` trong `frontend`: pass với 25 warning hiện hữu.
- HTTP smoke:
  - `http://127.0.0.1:6101/` -> 200
  - `http://127.0.0.1:6102/docs` -> 200
  - `http://127.0.0.1:6104/docs` -> 200
  - `http://127.0.0.1:6105/docs` -> 200
  - `http://127.0.0.1:6107/` -> 200
  - `http://127.0.0.1:6121/` -> 200
- Provider smoke:
  - Login root -> 200.
  - List providers before -> 200.
  - Create OpenRouter/Groq/Local vLLM smoke providers -> `200,200,200`.
  - Delete cleanup -> `200,200,200`.
  - Provider count after cleanup: 2 seed providers.

## Cập nhật hạ tầng 2026-05-27

- Sau khi dừng workload nặng ngoài project, cấu hình chuẩn hiện tại đã được xác nhận chạy ổn với `GPU_MEMORY_UTIL=0.30`, `LLM_CONTEXT_WINDOW=8192`.
- Benchmark `test/benmark-10-30` pass 22/22 checks, 16 câu hỏi, có upload file, embedding, RAG, web search, contract và dashboard ảnh.
- `run_all_services.sh` hiện chờ vLLM ready trước khi bật embedding để giảm lỗi profiling unified memory.

## Rủi ro ghi nhận trong lần test ban đầu

- Trong lần test ban đầu, vLLM chưa trả `GET /v1/models` vì có workload ngoài repo chiếm unified memory. Rủi ro này đã được xử lý ở benchmark sau khi dừng workload nặng và chuyển mặc định về `GPU_MEMORY_UTIL=0.30`, `LLM_CONTEXT_WINDOW=8192`.
- Full benchmark web/RAG/contract đã được chạy bổ sung trong `test/benmark-10-30`.

## Evidence

- Thư mục evidence: `tests/provider-install-evidence-2026-05-27/`.
- Ảnh evidence: `tests/provider-install-evidence-2026-05-27/provider-install-smoke-evidence.png`.
