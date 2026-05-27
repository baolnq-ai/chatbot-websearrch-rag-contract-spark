# Evidence demo GIF banner - 2026-05-27

Thư mục này lưu bằng chứng cho task quay GIF demo ứng dụng làm banner README.

## Artifact

- `demo-final-frame.png`: frame cuối sau khi đăng nhập, gửi câu demo và nhận phản hồi từ RAG/vLLM.
- GIF chính nằm tại `docs/assets/rag-chat-demo.gif` để README hiển thị trực tiếp trên GitHub.
- Báo cáo chi tiết nằm tại `docs/reports/demo-banner-gif-20260527-v1.md`.

## Kết quả

- Frontend qua Nginx `http://localhost:6101` trả `200`.
- Backend docs `http://localhost:6102/docs` trả `200`.
- Parse-data docs `http://localhost:6104/docs` trả `200`.
- Embedding docs `http://localhost:6105/docs` trả `200`.
- vLLM models `http://localhost:6106/v1/models` trả `200`.
- Chat demo trả lời được sau khi hạ output budget phù hợp context 8k.
