# Log release GitHub remote mới - 2026-05-27

## Mục tiêu

Chuẩn hóa source để push sang repo mới `baolnq-ai/chatbot-websearrch-rag-contract-spark.git`, không push vào remote cũ, giữ `.env` thật ngoài Git và đảm bảo fresh clone có thể chạy bằng một lệnh.

## Phase 1 - Chuẩn hóa cấu hình

- `.env.example` dùng port local `6100-6150`, `GPU_MEMORY_UTIL=0.30`, `LLM_CONTEXT_WINDOW=8192`.
- `.env.example` dùng `HF_CACHE_MOUNT=./cache/huggingface`.
- `run_all_services.sh` tự tạo `.env` từ `.env.example` khi fresh clone chưa có `.env`.
- `GEOIP_STRICT=false` trong `.env.example` để fresh clone không bị chặn nếu chưa có MaxMind key.
- `backup.sh` đọc `.env` và bỏ fallback Redis password hardcoded.
- `backend/database/setup_redis.py` bỏ Redis password cũ và redact Redis URL khi log.

## Phase 2 - Tài liệu và test artifact

- README cập nhật cách chạy một lệnh, port, hạ tầng GB10/DGX Spark và benchmark.
- README đưa mục `Cần key gì` lên đầu để người clone biết sửa `.env` ở đâu và key nào bắt buộc/optional.
- `run_all_services.sh` tôn trọng `HF_CACHE_MOUNT` truyền từ shell khi tự tạo `.env`, giúp fresh clone dùng lại model cache sẵn có bằng một lệnh.
- Fresh clone test đầu tiên fail ở vLLM readiness do lỗi memory profiling lặp lại trên unified memory. Đã thêm `VLLM_KV_CACHE_MEMORY_BYTES=2147483648` và truyền `--kv-cache-memory-bytes` để tránh profiling KV cache.
- Docs vận hành/cấu hình cập nhật fresh clone và cache path.
- Benchmark/evidence nằm trong `test/benmark-10-30` và `test/type test/...` để xem được trên GitHub.

## Verify trước commit

- `bash -n run_all_services.sh stop_all_services.sh backup.sh`: pass.
- `node --check test/benmark-10-30/scripts/run-benchmark.mjs`: pass.
- `python3 -m py_compile backend/database/setup_redis.py backend/main.py`: pass.
- `docker compose --env-file .env.example -f docker-compose.yml config`: pass.
- `docker compose --env-file .env.example -f docker-compose.all.yml config`: pass.
- `git diff --check`: pass.
- Secret scan regex cơ bản: không thấy token/private key/Redis password cũ; còn false positive chữ `github` trong tên tài liệu.
- `npm run lint`: pass, 25 warning hiện hữu.
- `env -u NODE_TLS_REJECT_UNAUTHORIZED npm run build`: pass.

## Phase 3 - Push và fresh clone

- Đã thêm remote mới `spark=https://github.com/baolnq-ai/chatbot-websearrch-rag-contract-spark.git`.
- Push thường bị GitHub Push Protection chặn vì lịch sử repo cũ có commit chứa Hugging Face token trong `docker-compose.yml`.
- Đã tạo snapshot/orphan commit chỉ chứa source hiện tại sạch, không đẩy lịch sử cũ sang repo mới.
- Đã bỏ track `backend/database/geoip/*.mmdb` vì `GeoLite2-City.mmdb` lớn hơn 50MB; fresh clone mặc định chạy với `GEOIP_STRICT=false`.
- Đã dừng compose services và tmux/code processes của source cũ bằng `stop_all_services.sh` và cleanup PID còn sót theo path repo.
- Đã push source snapshot sạch lên repo mới.

Các commit chính đã push:

- `76ee5c9` - source snapshot sạch đầu tiên.
- `2b7434d` - document required runtime keys.
- `50d743d` - support external HF cache on first run.
- `cbeaaf7` - pin vLLM KV cache for Spark.

## Fresh clone verify

Thư mục test:

```bash
/home/ntcai/NTC-App/chatbot/chatbot-websearrch-rag-contract-spark-fresh2
```

Lệnh chạy một lần:

```bash
HF_CACHE_MOUNT=/home/ntcai/NTC-App/chatbot/multiagent_chatbot_contract_github/cache/huggingface bash ./run_all_services.sh
```

Kết quả:

- `.env` được tự tạo từ `.env.example`.
- Dependency backend, parse-data, embedding, prometheus-collector và frontend cài được từ fresh clone.
- Docker Compose dựng được các service hạ tầng trong dải port `6100-6150`.
- vLLM nhận đúng `VLLM_KV_CACHE_MEMORY_BYTES=2147483648`, bỏ memory profiling KV cache và ready `200`.
- Backend ready `200`: `http://localhost:6102/docs`.
- Frontend qua Nginx ready `200`: `http://localhost:6101/`.
- Parse-data ready `200`: `http://localhost:6104/docs`.
- Embedding ready `200`: `http://localhost:6105/docs`.
- vLLM models ready `200`: `http://localhost:6106/v1/models`.

Ghi chú vận hành:

- Fresh clone không cần GeoIP để boot vì `GEOIP_STRICT=false`; chức năng IP geolocation/monitoring sẽ degrade nếu thiếu MaxMind key hoặc `.mmdb`.
- Nếu cache Hugging Face trống hoặc model gated, cần điền `HF_TOKEN` hoặc `HUGGING_FACE_HUB_TOKEN` trong `.env`.
- `npm install` frontend báo `10 vulnerabilities (5 moderate, 5 high)`; đây là cảnh báo audit dependency, không chặn boot.
