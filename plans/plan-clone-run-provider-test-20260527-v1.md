# Plan: clone-run-provider-test

- Created: 2026-05-27 09:33
- Updated: 2026-05-27 09:55
- Status: closed
- Related log: logs/tasks/2026/2026-05-27-clone-run-provider-test.md
- Related doc: docs/reports/clone-run-provider-test-20260527-v1.md

## Goal
Clone repo `baolnq-ai/multiagent_chatbot_contract_github`, đọc tài liệu/source/log/plan/test hiện có, chuẩn hóa hướng dẫn chạy tmux theo port 6101-6150, khởi động hệ thống bằng tmux có tên chứa `chatbot`, rồi kiểm thử cài đặt provider theo mẫu test cũ.

## Scope
- In: README/run script/env example/compose/docs vận hành liên quan port và tmux; chạy service local; smoke test provider/search nếu đủ phụ thuộc.
- Out: không push code, không ghi secret thật, không refactor logic ngoài phạm vi chạy và kiểm thử.

## Skills
- `plan-skill`: quản lý phase, plan/log/doc và trạng thái.
- `testing-skill`: chạy test, lưu evidence ảnh và báo cáo pass/fail.
- `documentation-skill`: cập nhật README/docs khi thay đổi cách chạy.
- `logging-skill`: ghi log phiên làm việc.

## Phases
| Phase | Goal | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Clone và đọc README/docs/logs/plans/tests/source chính | done | Đã clone repo và đọc README, run script, test websearch, plan/log cũ |
| 2 | Cập nhật port/tmux docs và cấu hình mặc định | done | `docker compose ... config` pass cho compose main/all |
| 3 | Cài dependencies và chạy app bằng tmux theo port 6101-6150 | done | `rag-chatbot-code` đang chạy; HTTP 200 cho 6101/6102/6104/6105/6107/6121 |
| 4 | Test provider/install/smoke theo mẫu có sẵn | done | Provider CRUD smoke: login/list/create/delete đều 200, cleanup xong |
| 5 | Lưu evidence, cập nhật log/doc và đóng plan | done | Evidence PNG và doc/log đã cập nhật |

## Verification
- `docker compose --env-file .env -f docker-compose.yml config`
- Health/docs endpoints theo port 6101-6150.
- Kiểm tra `tmux ls` có session chứa `chatbot`.
- Test provider bằng API/admin hoặc harness phù hợp, không ghi secret.
- Evidence ảnh trong `tests/provider-install-evidence-2026-05-27/`.
- Rủi ro ghi nhận: vLLM `/v1/models` chưa ready vì GPU bị process ngoài repo chiếm khoảng 89GB; không chạy websearch harness full.

## Close Criteria
- README/docs phản ánh đúng cách chạy tmux và port 6101-6150.
- Service chạy được hoặc blocker được ghi rõ với command/log cụ thể.
- Test provider có kết quả, artifact và rủi ro còn lại.
- Plan chuyển về trạng thái completed/closed khi xong.
