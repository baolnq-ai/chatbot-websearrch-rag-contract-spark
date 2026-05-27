# Runbook vận hành

Cập nhật lần cuối: 2026-05-27

## 1. Mục tiêu vận hành

- Duy trì hệ thống ổn định khi tải tăng.
- Phát hiện sớm lỗi và phản ứng theo checklist.
- Đảm bảo chất lượng phản hồi AI và citation.

## 2. Nguồn quan sát chính

- Logs container qua `docker compose logs`.
- Metrics Prometheus và exporter (node, redis, postgres, gpu).
- Trạng thái backend endpoints và pipeline jobs.
- Dashboard benchmark trong `test/benmark-10-30/results/dashboard.html`.

## 3. Start/stop local GB10/DGX Spark

Port local của project phải nằm trong dải `6100-6150`. Script start sẽ validate các biến port local trước khi chạy.

Start full stack từ fresh clone:

```bash
bash ./setup.sh
```

Nếu `.env` chưa tồn tại, script tự tạo từ `.env.example`. Mặc định script tự dọn runtime cũ trước khi chạy: kill tmux `rag-chatbot-code`, kill stale code process trong source hiện tại và chạy `docker compose down --remove-orphans`.

Khi đã cài dependencies và muốn restart nhanh, dùng:

```bash
SETUP_LOCAL_DEPS=false FRONTEND_BUILD_ON_START=true RUN_CODE_SERVICES=true bash ./setup.sh
```

Stop full stack:

```bash
bash ./stop_all_services.sh
```

Mặc định ổn định cho GB10/DGX Spark local:

- `GPU_MEMORY_UTIL=0.30`.
- `LLM_CONTEXT_WINDOW=8192`.
- `VLLM_READINESS_TIMEOUT_SEC=1200` để đủ thời gian cold start/cache trống.
- vLLM được chờ ready trước khi bật embedding để tránh tranh unified memory lúc init.

## 4. Sự cố thường gặp và cách xử lý

### 4.1 Backend không khởi động

1. Kiểm tra biến môi trường bắt buộc trong `.env`.
2. Kiểm tra Postgres/Redis/Qdrant đã sẵn sàng.
3. Kiểm tra lỗi migration hoặc kết nối DB trong logs backend.

### 4.2 Upload parse lỗi

1. Kiểm tra parse-data service và endpoint parse.
2. Kiểm tra định dạng file upload có được hỗ trợ.
3. Kiểm tra giới hạn dung lượng và timeout.

### 4.3 Trả lời web search kém chất lượng

1. Kiểm tra provider và rate-limit.
2. Kiểm tra evidence count, domain diversity, citation validity.
3. Điều chỉnh cấu hình broker/fallback theo tài liệu hardening.

### 4.4 Chậm hoặc timeout khi chat

1. Kiểm tra tải GPU và vLLM queue.
2. Kiểm tra Redis hit ratio và độ trễ DB.
3. Giảm budget web fetch hoặc tối ưu prompt context.

### 4.5 vLLM lỗi profiling unified memory lúc init

1. Kiểm tra process đang nhả/giữ RAM bằng `ps -eo pid,ppid,comm,%mem,rss,args --sort=-rss | head`.
2. Đợi container vLLM restart theo compose policy rồi kiểm tra `http://127.0.0.1:6106/v1/models`.
3. Nếu lặp lại, giữ `GPU_MEMORY_UTIL=0.30`, giảm context hoặc dừng workload ngoài project trước khi start lại.

## 5. Checklist release vận hành

1. CI pass toàn bộ checks.
2. Docker compose config hợp lệ.
3. Smoke test backend/frontend thành công.
4. Theo dõi 30-60 phút sau deploy.
5. Có kế hoạch rollback rõ ràng.
