# Cấu hình Env, vLLM, RAG và Cache

Cập nhật: 2026-05-27 11:20

## Env tập trung

Các service code hiện đọc env từ thư mục gốc:

- `.env.all`: cấu hình Docker Compose all.
- `.env`: cấu hình local/prod override.
- `.env.example`: mẫu đầy đủ không chứa secret thật.

Fresh clone local có thể chạy `bash ./run_all_services.sh`; script tự tạo `.env` từ `.env.example` nếu chưa có.

Không dùng `.env` riêng trong `backend`, `embedding`, `parse-data`, `prometheus-collector`. Frontend vẫn có thể dùng `frontend/.env.local`.

## vLLM hiện tại

- Model: `google/gemma-4-E4B-it`.
- Context local mặc định: `LLM_CONTEXT_WINDOW=8192`.
- GPU memory local mặc định: `GPU_MEMORY_UTIL=0.30`.
- KV cache: `--kv-cache-dtype fp8`.
- HF cache trong `.env.example`: `HF_CACHE_MOUNT=./cache/huggingface`; khi script tự tạo `.env`, giá trị này được đổi sang absolute path của repo clone.
- Nếu cache trống hoặc model Hugging Face yêu cầu xác thực, đặt `HF_TOKEN` hoặc `HUGGING_FACE_HUB_TOKEN` trong `.env`.
- Kết quả kiểm tra ngày 2026-05-27 trên GB10/DGX Spark: `0.37` cần khoảng 45 GiB free unified memory tại thời điểm vLLM init và có thể fail khi còn dịch vụ nền; `0.30` với context 8k chạy ổn hơn cho local all-services.

## Budget RAG

Các budget được đặt trong env để chỉnh số lượng mà không đổi pipeline:

- `RAG_INPUT_TOKEN_BUDGET=50000`
- `RAG_OUTPUT_TOKEN_BUDGET=10000`
- `RAG_FILE_CONTEXT_TOKEN_BUDGET=40000`
- `RAG_HISTORY_TOKEN_BUDGET=10000`
- `RAG_SELECTED_PATH_TOKEN_BUDGET=50000`
- `RAG_AVG_TOKENS_PER_CHUNK=600`
- `RAG_CHARS_PER_TOKEN=2.5`

Pipeline vẫn giữ cách xử lý path, vector search, rerank, history và assistant node như cũ.

## Cache đang giữ

- `cache/huggingface/hub/models--google--gemma-4-E4B-it`: model vLLM đang chạy.
- `cache/minio`: dữ liệu object storage.
- `cache/pgdata`: dữ liệu PostgreSQL.
- `cache/qdrant_storage`: dữ liệu vector DB.
- `cache/redis_data`: dữ liệu Redis.
- `cache/prometheus_data`: dữ liệu Prometheus.

Không xóa các volume dữ liệu nếu chưa backup hoặc chưa chủ động reset môi trường.

## GeoIP local

- `backend/database/geoip/*.mmdb` không commit lên Git vì là dữ liệu runtime lớn.
- Fresh clone mặc định `GEOIP_STRICT=false`, backend vẫn chạy nếu chưa có GeoIP database.
- Nếu cần geolocation đầy đủ, đặt `MAXMIND_LICENSE_KEY` hoặc `GEOIP_CITY_DB_URL`/`GEOIP_ASN_DB_URL`, sau đó chạy lại `bash ./run_all_services.sh`.

## Cache đã dọn

Ngày 2026-05-23 đã xóa cache cũ không còn được project hiện tại mount/reference:

- `cache/bge`
- `cache/marker`
- `cache/huggingface/hub/models--Qwen--Qwen3-VL-8B-Instruct-FP8`
- `cache/huggingface/hub/models--khazarai--Qwen3-4B-Qwen3.6-plus-Reasoning-Distilled`
- root `.next`
- `__pycache__` trong các service Python
