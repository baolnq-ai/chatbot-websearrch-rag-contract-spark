# Provider Install Evidence 2026-05-27

Thư mục này lưu artifact kiểm thử cho task clone, chạy tmux và test provider ngày 2026-05-27.

Nội dung gồm ảnh evidence, JSON response đã sanitize và summary ngắn cho provider smoke.

- `provider-install-smoke-evidence.png`: ảnh chứng minh provider CRUD pass và endpoint chính trả 200.
- `provider-test-summary.txt`: mã HTTP chính của login/list/create/delete.
- `providers-before.json`, `providers-after-create.json`, `providers-after-cleanup.json`: trạng thái provider trước/sau.
- `provider-create-responses.jsonl`, `provider-delete-responses.jsonl`: response CRUD smoke.
- `created-provider-ids.json`: id provider tạm đã tạo và cleanup.

Review ảnh: kết quả cụ thể xuất hiện trong ảnh, không phải loading/pending; không có token, cookie hay API key thật.
