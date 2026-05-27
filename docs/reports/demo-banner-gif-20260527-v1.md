# Báo cáo demo GIF banner - 2026-05-27

## Mục tiêu

Quay lại demo ứng dụng đang chạy để làm banner README, đảm bảo artifact nằm trong source clone gốc và xem được trực tiếp trên GitHub.

## Phạm vi

- Source active: `/home/ntcai/NTC-App/chatbot/chatbot-websearrch-rag-contract-spark-fresh2`.
- Public app: `http://localhost:6101`.
- Runtime chính: Nginx, backend, parse-data, embedding, vLLM và tmux `rag-chatbot-code`.

## Artifact

- GIF banner: `docs/assets/rag-chat-demo.gif`.
- Ảnh frame cuối: `docs/assets/rag-chat-web-response.png`.
- Evidence test: `test/type test/demo-banner-gif-evidence-2026-05-27/`.

## Thông số GIF

- Capture app thật qua Playwright headless.
- Thời lượng: khoảng 60 giây.
- Tốc độ trung bình: khoảng 24fps.
- Kích thước file: khoảng 23MB.
- Nội dung demo: đăng nhập root local, vào workspace chat, mở công cụ, gửi câu hỏi demo và hiển thị phản hồi từ RAG/vLLM.

## Lệnh đã chạy

```bash
node scripts/capture_web_demo.mjs
python3 scripts/make_demo_gif.py
```

## Verify

```bash
python3 - <<'PY'
from PIL import Image
from pathlib import Path
p = Path("docs/assets/rag-chat-demo.gif")
im = Image.open(p)
frames = 0
duration = 0
try:
    while True:
        frames += 1
        duration += im.info.get("duration", 0)
        im.seek(im.tell() + 1)
except EOFError:
    pass
print(frames, duration / 1000, frames / (duration / 1000))
PY
```

Kết quả đo sau khi xuất:

- Stored frames: 1439.
- Duration: 60.0s.
- Average fps: 23.98.

## Ghi chú

Trong lúc thử gửi câu chat đầu tiên phát hiện `RAG_OUTPUT_TOKEN_BUDGET=10000` vượt `LLM_CONTEXT_WINDOW=8192`, làm vLLM từ chối request. Đã hạ mặc định Spark xuống `LLM_MAX_TOKENS=2048`, `RAG_OUTPUT_TOKEN_BUDGET=2048` và điều chỉnh các budget input/context còn lại để phù hợp context 8k.
