# Setup/Stop GB10/DGX Spark

Cập nhật: 2026-05-27

## Mục tiêu

Chuẩn hóa lệnh chạy một bước cho fresh clone và restart local trên GB10/DGX Spark:

```bash
bash ./setup.sh
```

## Hành vi của setup.sh

- Tự tạo `.env` từ `.env.example` nếu fresh clone chưa có `.env`.
- Validate toàn bộ port local trong dải `6100-6150`.
- In bản đồ port trước khi chạy.
- Dọn tmux cũ `rag-chatbot-code`.
- Kill stale code process thuộc source hiện tại: backend, frontend, parse-data, embedding và prometheus-collector.
- Chạy `docker compose down --remove-orphans` trước khi up lại stack.
- Cài dependency local nếu thiếu.
- Start Docker services, chờ vLLM `/v1/models`, rồi start code services trong tmux.
- In tmux attach command và thư mục runtime logs.

## Timeout và cache vLLM

Cold start vLLM có thể mất hơn 480 giây khi cache Hugging Face trống hoặc phải compile/warm-up lại. Mặc định mới:

- `READINESS_TIMEOUT_SEC=480` cho service thông thường.
- `VLLM_READINESS_TIMEOUT_SEC=1200` riêng cho vLLM.

Khi `cache/huggingface` đã có model, vLLM vẫn có thể mất khoảng vài phút để load checkpoint và warm-up CUDA graph. Đây là hành vi bình thường, không phải thiếu RAM nếu `free -h` còn memory available.

## Dừng dự án

```bash
bash ./stop.sh
```

Script dừng tmux, kill stale process còn lại trong source hiện tại và chạy `docker compose down --remove-orphans`. Dữ liệu trong `cache/` và `.runtime/` được giữ lại.

## Kết quả verify 2026-05-27

- `bash -n setup.sh stop.sh`: pass.
- `bash ./setup.sh`: pass sau khi tự dọn tmux/process/container cũ.
- Health check pass:
  - `http://127.0.0.1:6101/`
  - `http://127.0.0.1:6102/docs`
  - `http://127.0.0.1:6104/docs`
  - `http://127.0.0.1:6105/docs`
  - `http://127.0.0.1:6106/v1/models`
- tmux session `rag-chatbot-code` có đủ 5 window: backend, frontend, parse-data, prometheus-collector, embedding.

## Rủi ro còn lại

- Nếu cache HF trống và không có `HF_TOKEN`, tải model có thể chậm hoặc bị rate-limit.
- GeoIP vẫn degraded nếu chưa cung cấp `MAXMIND_LICENSE_KEY` hoặc URL `.mmdb`.
- `npm audit` báo 10 vulnerabilities trong frontend dependency; chưa chặn startup nhưng cần xử lý riêng trước production.
