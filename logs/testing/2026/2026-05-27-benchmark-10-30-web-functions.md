# Log benchmark 10-30 chức năng web - 2026-05-27

## Mục tiêu

Benchmark 10-30 câu hỏi/luồng qua public web API, có upload file, latency, vLLM tokens/s, embedding/upload latency, ảnh report và README trong `test/benmark-10-30/`.

## Phase 1 - Chuẩn bị vận hành

- Đọc `setup.sh`, compose và các endpoint liên quan.
- Bổ sung `stop_all_services.sh` để dừng dự án không xóa dữ liệu.
- Cập nhật `setup.sh`:
  - validate port local trong dải `6100-6150`;
  - chờ vLLM readiness trước khi bật embedding;
  - chờ backend/frontend/parse-data/embedding sau khi start.
- Điều chỉnh mặc định GB10/DGX Spark: `GPU_MEMORY_UTIL=0.30`, `LLM_CONTEXT_WINDOW=8192`.

## Phase 2 - Benchmark

Hoàn tất lúc 2026-05-27 11:30 Asia/Ho_Chi_Minh.

Lệnh chạy:

```bash
set -a; source .env; set +a
PUBLIC_BASE_URL=http://localhost:6101 \
EMBEDDING_DIRECT_URL=http://localhost:6105 \
VLLM_DIRECT_URL=http://localhost:6106 \
node test/benmark-10-30/scripts/run-benchmark.mjs
```

Kết quả:

- Tổng checks: 22.
- Câu hỏi benchmark: 16.
- Pass/fail: 22/0.
- Upload/index CSV: 438 ms.
- Embedding: 1018 ms, 3 vectors, dimension 2048.
- Rerank: 175 ms, 3 documents.
- Latency câu hỏi p50/p95/max: 4251/223630/223630 ms.
- Throughput trung bình: 30.44 tokens/s hoặc token/s ước lượng cho SSE.
- Dashboard ảnh: `test/benmark-10-30/results/dashboard.png`.
- Báo cáo chi tiết: `test/benmark-10-30/results/report.md`.

Phạm vi đã chạy:

- Public home qua nginx.
- vLLM `/v1/models` và direct chat completion.
- Login root và `/api/v1/auth/me`.
- Embedding `/api/v1/embed`.
- Rerank `/api/v1/rerank`.
- Upload CSV RAG `/api/v1/rags/rag-upload`.
- RAG fast không file.
- RAG fast với file đã upload.
- Web search qua SearxNG/provider ngoài.
- Contract fast.
- Contract reasoning.

## Phase 3 - Quan sát hạ tầng

- `stop_all_services.sh` dừng đúng tmux session và compose services của project, không xóa cache/runtime data.
- `setup.sh` start lại được toàn bộ stack trên dải port `6100-6150`.
- vLLM gặp một lần lỗi profiling do unified memory thay đổi trong lúc init, container tự restart theo compose policy và readiness pass ở lần sau.
- Sau restart: backend, frontend nginx, parse-data, embedding, vLLM đều readiness 200.
- Process RAM cao nhất trong lúc benchmark: embedding Python khoảng 5.4GB RSS; vLLM EngineCore khoảng 2.0GB RSS cộng phần unified VRAM do driver quản lý.

## Rủi ro đang theo dõi

- Web search phụ thuộc SearxNG/provider thực tế nên latency biến động mạnh.
- Contract fast/reasoning có thể lâu nếu prompt sinh hợp đồng dài.
- Nên giữ `GPU_MEMORY_UTIL=0.30`, `LLM_CONTEXT_WINDOW=8192` làm mặc định ổn định cho GB10/DGX Spark local; chỉ tăng sau benchmark riêng khi máy thật sự rảnh.
