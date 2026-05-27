# Log task: clone, chạy tmux và test provider

- Bắt đầu: 2026-05-27 09:33
- Trạng thái: completed
- Plan: `plans/plan-clone-run-provider-test-20260527-v1.md`
- Doc: `docs/reports/clone-run-provider-test-20260527-v1.md`

## Mục tiêu

Clone repo, đọc tài liệu/source liên quan, chạy hệ thống bằng tmux có tên chứa `chatbot` trên dải port 6101-6150, sau đó kiểm thử provider theo mẫu có sẵn.

## Diễn biến

- Đã clone repo từ `https://github.com/baolnq-ai/multiagent_chatbot_contract_github.git`.
- Đã đọc README chính, `run_all_services.sh`, test websearch, plan/log tối ưu web search cũ và danh sách file docs/source.
- Phát hiện script đã có tmux nhưng session mặc định chưa chứa chữ `chatbot`.
- Phát hiện host ports mặc định còn nằm ngoài dải 6101-6150.
- Đã cập nhật mặc định tmux sang `rag-chatbot-code`.
- Đã cập nhật port local/host-facing sang dải `6101-6150` trong `.env.example`, compose, README, runbook, Prometheus targets, README parse-data và embedding.
- Đã chạy `bash ./run_all_services.sh`, tạo tmux `rag-chatbot-code` và start Docker services.
- Backend fail lần đầu do thiếu `backend/static`; đã sửa `StaticFiles(..., check_dir=False)` và restart backend window.
- Đã test provider CRUD qua API root: tạo OpenRouter/Groq/Local vLLM smoke configs, sau đó cleanup.

## Verify

- `docker compose --env-file .env.example -f docker-compose.yml config` đạt.
- `docker compose --env-file .env.example -f docker-compose.all.yml config` đạt.
- `python3 -m py_compile backend/main.py backend/service/admin_setting_service.py backend/service/runtime_config_service.py` đạt.
- `npm run lint` đạt với 25 warning hiện hữu.
- HTTP smoke đạt 200 cho frontend nginx `6101`, backend docs `6102`, parse `6104`, embedding `6105`, prometheus collector `6107`, SearxNG `6121`.
- Provider smoke: login/list/create/delete đều trả 200, cleanup còn 2 seed providers.
- Evidence: `tests/provider-install-evidence-2026-05-27/provider-install-smoke-evidence.png`.

## Blocker/Rủi ro

- vLLM chưa ready trong cửa sổ test vì GPU đang bị process ngoài repo `/home/ntcai/DeepSeek/ds4-server` chiếm khoảng 89GB. Đã thử `.env` local nhẹ hơn nhưng `/v1/models` vẫn timeout.
- Không có secret provider ngoài; OpenRouter/Groq chỉ test CRUD cấu hình inactive, không test inference external.
