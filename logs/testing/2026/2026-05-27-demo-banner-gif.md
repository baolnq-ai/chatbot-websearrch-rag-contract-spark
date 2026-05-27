# Log kiểm thử demo banner - 2026-05-27

## Mục tiêu

Làm lại demo banner cho README, ưu tiên màu đẹp, mượt, có đủ đoạn test chat và kiểm tra lại các endpoint chính sau khi cập nhật token budget cho context 8k.

## Lệnh đã chạy

```bash
python3 scripts/make_polished_demo_banner.py
```

## Kết quả

- WebP banner đã xuất: `docs/assets/rag-chat-demo.webp`.
- GIF fallback đã xuất: `docs/assets/rag-chat-demo.gif`.
- Ảnh frame cuối đã xuất: `docs/assets/rag-chat-web-response.png`.
- Evidence folder: `test/type test/demo-banner-gif-evidence-2026-05-27/`.
- Render source: 864 frames, 36 giây, 24fps.
- WebP sau tối ưu: khoảng 2.6MB.
- GIF fallback: khoảng 5.4MB.
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

- WebP là banner chính vì giữ màu tốt hơn GIF và nhẹ hơn. GIF fallback vẫn có trong `docs/assets/`.
