# Báo cáo demo banner - 2026-05-27

## Mục tiêu

Làm lại demo ứng dụng để làm banner README, ưu tiên màu đẹp, chuyển động mượt và có đủ đoạn test chat. Artifact nằm trong source clone gốc và xem được trực tiếp trên GitHub.

## Phạm vi

- Source active: `/home/ntcai/NTC-App/chatbot/chatbot-websearrch-rag-contract-spark-fresh2`.
- Public app: `http://localhost:6101`.
- Runtime chính: Nginx, backend, parse-data, embedding, vLLM và tmux `rag-chatbot-code`.

## Artifact

- Banner chính: `docs/assets/rag-chat-demo.webp`.
- GIF fallback: `docs/assets/rag-chat-demo.gif`.
- Ảnh frame cuối: `docs/assets/rag-chat-web-response.png`.
- Evidence test: `test/type test/demo-banner-gif-evidence-2026-05-27/`.

## Thông số banner

- Render bằng `scripts/make_polished_demo_banner.py`.
- WebP chính: khoảng 2.6MB.
- GIF fallback: khoảng 5.4MB.
- Timeline render: 36 giây, 24fps.
- Nội dung demo: đăng nhập root local, vào workspace chat, gõ câu hỏi demo, hiển thị phản hồi RAG/vLLM và trạng thái backend/embedding/vLLM/evidence.

## Lệnh đã chạy

```bash
python3 scripts/make_polished_demo_banner.py
```

## Verify

```bash
python3 - <<'PY'
from PIL import Image
from pathlib import Path
p = Path("docs/assets/rag-chat-demo.webp")
im = Image.open(p)
print(im.n_frames, round(p.stat().st_size / 1024 / 1024, 2), im.size)
PY
```

Kết quả đo sau khi xuất:

- WebP stored frames sau tối ưu: 408.
- Render source: 864 frames, 36 giây, 24fps.
- Kích thước: khoảng 2.6MB.

## Ghi chú

Trong lúc thử gửi câu chat đầu tiên phát hiện `RAG_OUTPUT_TOKEN_BUDGET=10000` vượt `LLM_CONTEXT_WINDOW=8192`, làm vLLM từ chối request. Đã hạ mặc định Spark xuống `LLM_MAX_TOKENS=2048`, `RAG_OUTPUT_TOKEN_BUDGET=2048` và điều chỉnh các budget input/context còn lại để phù hợp context 8k.
