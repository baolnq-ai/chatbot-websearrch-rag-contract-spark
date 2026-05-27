# Log kiểm thử demo GIF banner - 2026-05-27

## Mục tiêu

Quay demo ứng dụng thật để làm banner README và kiểm tra lại các endpoint chính sau khi cập nhật token budget cho context 8k.

## Lệnh đã chạy

```bash
node scripts/capture_web_demo.mjs
python3 scripts/make_demo_gif.py
```

## Kết quả

- GIF banner đã xuất: `docs/assets/rag-chat-demo.gif`.
- Ảnh frame cuối đã xuất: `docs/assets/rag-chat-web-response.png`.
- Evidence folder: `test/type test/demo-banner-gif-evidence-2026-05-27/`.
- Đo GIF: 1439 stored frames, 60.0 giây, trung bình 23.98fps.
- Endpoint sau capture:
  - Frontend `6101`: `200`.
  - Backend `6102/docs`: `200`.
  - Parse-data `6104/docs`: `200`.
  - Embedding `6105/docs`: `200`.
  - vLLM `6106/v1/models`: `200`.

## Điều chỉnh phát hiện trong test

- Lỗi cũ: `RAG_OUTPUT_TOKEN_BUDGET=10000` vượt `LLM_CONTEXT_WINDOW=8192`, làm vLLM trả `400 max_tokens`.
- Đã chỉnh mặc định Spark: `LLM_MAX_TOKENS=2048`, `RAG_INPUT_TOKEN_BUDGET=6144`, `RAG_OUTPUT_TOKEN_BUDGET=2048`, `RAG_FILE_CONTEXT_TOKEN_BUDGET=4096`, `RAG_HISTORY_TOKEN_BUDGET=1024`, `RAG_SELECTED_PATH_TOKEN_BUDGET=6144`.

## Rủi ro còn lại

- GIF dài 60 giây ở gần 24fps nên dung lượng khoảng 23MB. File vẫn dưới giới hạn push thông thường của GitHub.
