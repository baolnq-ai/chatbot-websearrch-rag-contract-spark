# Benchmark 10-30 câu hỏi

Thư mục này lưu benchmark chạy trên hạ tầng local GB10/DGX Spark cho dự án chatbot.

## Kết quả chạy 2026-05-27

- Thời gian chạy: 2026-05-27 11:21:02 -> 11:30:11 Asia/Ho_Chi_Minh.
- Public base: `http://localhost:6101`.
- Model: `google/gemma-4-E4B-it`, context `8192`, `GPU_MEMORY_UTIL=0.30`.
- Tổng checks: 22, pass: 22, fail: 0.
- Tổng câu hỏi sinh câu trả lời: 16.
- Upload/index CSV: 438 ms.
- Embedding: 1018 ms cho 3 đoạn, dimension 2048.
- Rerank: 175 ms cho 3 documents.
- Latency câu hỏi p50/p95/max: 4251/223630/223630 ms.
- Throughput trung bình: 30.44 tokens/s hoặc token/s ước lượng cho SSE.

Artifacts:

- `results/report.md`: báo cáo Markdown có câu hỏi, câu trả lời rút gọn, latency, tokens/s.
- `results/results.json`: dữ liệu máy đọc đầy đủ.
- `results/results.csv`: bảng kết quả để lọc/sort.
- `results/dashboard.html`: dashboard local.
- `results/dashboard.png`: ảnh bằng chứng dashboard.

Ghi chú kết quả:

- Web search là flow chậm nhất vì fetch/rerank nhiều nguồn thật qua SearxNG/provider ngoài.
- Contract fast sinh văn bản dài nên latency cao hơn RAG fast/direct vLLM.
- Không ghi token/cookie/password vào artifact.

## Mục tiêu

Mục tiêu:

- Chạy 10-30 câu hỏi/luồng qua public web API `http://localhost:6101`.
- Có upload file RAG thật để đo upload/index latency.
- Đo latency từng câu, vLLM tokens/s nếu endpoint có `usage`, throughput ước lượng cho SSE, embedding latency và trạng thái pass/fail.
- Lưu câu hỏi, câu trả lời rút gọn, endpoint, flow, latency và lỗi nếu có.
- Có dashboard HTML/PNG để đọc nhanh trên GitHub/browser.

Nội dung:

- `scripts/run-benchmark.mjs`: script benchmark chính.
- `data/`: file test được upload trong benchmark.
- `results/`: JSON/CSV/Markdown/HTML/PNG kết quả.
- `README.md`: mô tả cách đọc và chạy lại benchmark.

Cách chạy lại:

```bash
set -a; source .env; set +a
PUBLIC_BASE_URL=http://localhost:6101 \
EMBEDDING_DIRECT_URL=http://localhost:6105 \
VLLM_DIRECT_URL=http://localhost:6106 \
node test/benmark-10-30/scripts/run-benchmark.mjs
```

Sau khi chạy, mở `results/dashboard.html` hoặc xem `results/dashboard.png`.

Lưu ý:

- Script không ghi token/cookie/password vào output.
- Web search phụ thuộc provider thực tế nên có thể biến động latency.
- Contract reasoning có thể chậm hơn các flow khác.
