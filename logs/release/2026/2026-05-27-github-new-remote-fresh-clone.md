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

Trạng thái cập nhật:

- Đã tạo commit local `da7d70f` trước khi xử lý snapshot.
- Đã thêm remote mới `spark=https://github.com/baolnq-ai/chatbot-websearrch-rag-contract-spark.git`.
- Sau khi login lại GitHub, push thường vẫn bị GitHub Push Protection chặn vì lịch sử repo cũ có commit chứa Hugging Face token trong `docker-compose.yml`.
- Hướng xử lý: tạo snapshot/orphan commit chỉ chứa source hiện tại sạch, không đẩy lịch sử cũ sang repo mới.
- Đã bỏ track `backend/database/geoip/*.mmdb` vì `GeoLite2-City.mmdb` lớn hơn 50MB; fresh clone mặc định chạy với `GEOIP_STRICT=false`.
- Đã dừng compose services và tmux/code processes của source hiện tại bằng `stop_all_services.sh` và cleanup PID còn sót theo path repo.

Việc còn lại sau khi có credential:

```bash
gh auth login -h github.com
git push spark main
```

Sau push cần clone lại repo mới vào thư mục sạch và chạy:

```bash
bash ./run_all_services.sh
```
