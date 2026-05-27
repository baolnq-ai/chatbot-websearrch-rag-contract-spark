from __future__ import annotations

import math
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "assets"
OUT_WEBP = ASSETS / "rag-chat-demo.webp"
OUT_GIF = ASSETS / "rag-chat-demo.gif"
LIVE_FRAME = ASSETS / "rag-chat-web-response.png"

FPS = 24
DURATION_SECONDS = 36
W, H = 960, 540

FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def ease(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def lerp(a: float, b: float, x: float) -> float:
    return a + (b - a) * x


def mix(c1: tuple[int, int, int], c2: tuple[int, int, int], x: float) -> tuple[int, int, int]:
    return tuple(int(lerp(a, b, x)) for a, b in zip(c1, c2))


def rounded(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, int, int],
    outline: tuple[int, int, int] | None = None,
    width: int = 1,
) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def shadow_box(
    image: Image.Image,
    xy: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, int, int],
    shadow: tuple[int, int, int, int] = (30, 48, 72, 28),
    offset: tuple[int, int] = (0, 10),
    blur: int = 18,
    outline: tuple[int, int, int] | None = None,
) -> None:
    x1, y1, x2, y2 = xy
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((x1 + offset[0], y1 + offset[1], x2 + offset[0], y2 + offset[1]), radius, fill=shadow)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    image.alpha_composite(layer)
    d = ImageDraw.Draw(image)
    d.rounded_rectangle(xy, radius, fill=fill, outline=outline, width=1)


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int, fill: tuple[int, int, int], bold: bool = False) -> None:
    draw.text(xy, value, font=font(size, bold), fill=fill)


def wrapped_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    value: str,
    size: int,
    fill: tuple[int, int, int],
    width_chars: int,
    line_gap: int = 8,
    bold: bool = False,
) -> int:
    y = xy[1]
    for line in textwrap.wrap(value, width=width_chars):
        draw.text((xy[0], y), line, font=font(size, bold), fill=fill)
        y += size + line_gap
    return y


def clip_text(value: str, progress: float) -> str:
    count = int(len(value) * max(0.0, min(1.0, progress)))
    return value[:count]


def draw_sidebar(draw: ImageDraw.ImageDraw, active_history: bool = False) -> None:
    rounded(draw, (0, 0, 280, H), 0, (238, 244, 252))
    text(draw, (58, 28), "NTC AI Assistant", 20, (10, 20, 38), True)
    draw.ellipse((18, 26, 43, 51), fill=(255, 117, 38))
    text(draw, (23, 30), "AI", 12, (255, 255, 255), True)
    rounded(draw, (20, 72, 260, 114), 21, (226, 235, 248), (204, 216, 233))
    text(draw, (64, 84), "Cuộc trò chuyện mới", 15, (14, 34, 68), True)
    text(draw, (24, 146), "THƯ MỤC FILE (0)", 12, (91, 107, 134), True)
    text(draw, (24, 202), "QUẢN LÝ NGUỒN WEB", 12, (91, 107, 134), True)
    text(draw, (24, 258), "LỊCH SỬ CHAT", 12, (91, 107, 134), True)
    history_fill = (236, 224, 196) if active_history else (238, 244, 252)
    rounded(draw, (18, 292, 266, 335), 21, history_fill)
    text(draw, (42, 305), "Demo nhanh: hệ thống", 14, (31, 96, 255), True)
    text(draw, (42, 354), "Kiến trúc RAG?", 14, (28, 43, 66))
    text(draw, (42, 404), "Benchmark 10-30", 14, (28, 43, 66))
    draw.ellipse((18, 486, 52, 520), fill=(238, 158, 45))
    text(draw, (30, 493), "R", 16, (255, 255, 255), True)
    text(draw, (64, 488), "Root Admin", 14, (17, 29, 53), True)
    text(draw, (64, 508), "Admin", 11, (109, 125, 154))


def draw_workspace_base(image: Image.Image, t: float, active_history: bool = False) -> ImageDraw.ImageDraw:
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, W, H), fill=(244, 248, 253))
    draw_sidebar(draw, active_history)
    draw.rectangle((280, 0, W, H), fill=(247, 250, 254))
    text(draw, (308, 20), "Gemma-4-E4B-It", 16, (12, 24, 45), True)
    text(draw, (446, 20), "⌄", 16, (83, 100, 129), True)
    draw.ellipse((910, 16, 944, 50), fill=(238, 158, 45))
    text(draw, (922, 23), "R", 15, (255, 255, 255), True)
    pulse = int(16 + 7 * math.sin(t * 2 * math.pi))
    draw.ellipse((304, 218, 326, 240), fill=(255, 117, 38))
    text(draw, (310, 221), "AI", 10, (255, 255, 255), True)
    draw.ellipse((307, 221, 323, 237), outline=(255, 255, 255, pulse), width=1)
    return draw


def draw_chat_frame(image: Image.Image, frame_index: int, t: float) -> None:
    draw = draw_workspace_base(image, t, active_history=t > 28)
    question = "Demo nhanh: hệ thống RAG/vLLM đang hoạt động thế nào? Trả lời ngắn gọn."
    answer = (
        "Hệ thống RAG/vLLM đang hoạt động ổn định: backend nhận request, embedding/rerank xử lý ngữ cảnh, "
        "vLLM sinh câu trả lời và frontend stream kết quả về workspace. Câu trả lời này được tạo trong demo banner."
    )

    if t < 8:
        shadow_box(image, (396, 150, 796, 390), 8, (255, 255, 255), outline=(213, 224, 239))
        text(draw, (436, 182), "NTC AI WORKSPACE", 14, (255, 117, 38), True)
        text(draw, (436, 215), "Sign in to NTC AI", 24, (12, 24, 45), True)
        text(draw, (436, 250), "Secure gateway to RAG and contract workspace.", 13, (90, 106, 133))
        email_progress = ease((t - 1.5) / 1.5)
        pass_progress = ease((t - 3.2) / 1.4)
        rounded(draw, (436, 286, 756, 326), 6, (247, 250, 254), (207, 219, 236))
        rounded(draw, (436, 338, 756, 378), 6, (247, 250, 254), (207, 219, 236))
        text(draw, (450, 297), clip_text("admin@example.com", email_progress), 14, (15, 28, 52))
        text(draw, (450, 349), "•" * int(9 * pass_progress), 14, (15, 28, 52))
        if t > 5:
            rounded(draw, (618, 392, 756, 434), 6, (31, 96, 255))
            text(draw, (660, 404), "Sign In", 14, (255, 255, 255), True)
        return

    q_progress = ease((t - 10) / 6)
    a_progress = ease((t - 17) / 10)

    if t >= 8:
        text(draw, (394, 92), "Xin chào Root Admin!", 24, (17, 29, 53), True)
        text(draw, (394, 126), "Kiểm thử chat, RAG, vLLM và service health trong cùng một luồng demo.", 14, (90, 106, 133))

    if t < 16:
        rounded(draw, (300, 388, 940, 510), 32, (239, 244, 251), (218, 228, 242))
        text(draw, (330, 412), clip_text(question, q_progress), 17, (16, 30, 54))
        if int(t * 3) % 2 == 0:
            draw.rectangle((330 + min(520, int(8.4 * len(clip_text(question, q_progress)))), 436, 333 + min(520, int(8.4 * len(clip_text(question, q_progress)))), 458), fill=(31, 96, 255))
        rounded(draw, (500, 466, 612, 492), 13, (230, 238, 250), (204, 216, 233))
        text(draw, (520, 471), "Truy vấn dữ liệu", 12, (25, 42, 68), True)
        rounded(draw, (820, 462, 884, 492), 15, (31, 96, 255))
        text(draw, (842, 468), "Gửi", 12, (255, 255, 255), True)
        return

    shadow_box(image, (396, 82, 940, 168), 10, (240, 247, 255), outline=(205, 218, 236))
    wrapped_text(draw, (412, 106), question, 15, (14, 29, 53), 68, 6)

    shadow_box(image, (356, 198, 900, 352), 10, (255, 255, 255), outline=(210, 222, 239))
    visible_answer = clip_text(answer, a_progress)
    wrapped_text(draw, (374, 222), visible_answer, 16, (14, 29, 53), 60, 7)
    if a_progress < 1 and int(t * 4) % 2 == 0:
        draw.rectangle((374 + (len(visible_answer) % 54) * 8, 316, 377 + (len(visible_answer) % 54) * 8, 338), fill=(31, 96, 255))

    status_y = 376
    statuses = [
        ("Backend", "200"),
        ("Embedding", "184ms"),
        ("vLLM", "31 tok/s"),
        ("Evidence", "pass"),
    ]
    for i, (name, value) in enumerate(statuses):
        x = 356 + i * 138
        alpha = ease((t - 20 - i * 1.2) / 1.4)
        fill = mix((235, 241, 249), (223, 246, 235), alpha)
        outline = mix((204, 216, 233), (90, 190, 130), alpha)
        rounded(draw, (x, status_y, x + 122, status_y + 42), 8, fill, outline)
        text(draw, (x + 12, status_y + 8), name, 11, (79, 96, 124), True)
        text(draw, (x + 12, status_y + 23), value, 12, (16, 91, 52), True)

    rounded(draw, (300, 442, 940, 512), 30, (239, 244, 251), (218, 228, 242))
    text(draw, (328, 465), "Bạn muốn hỏi gì tiếp?", 16, (108, 125, 154))
    text(draw, (818, 466), "Fast", 14, (74, 91, 120))

    if t > 29:
        progress = ease((t - 29) / 2.4)
        x1 = int(900 - 330 * progress)
        shadow_box(image, (x1, 70, x1 + 320, 166), 8, (255, 255, 255), outline=(205, 218, 236))
        text(draw, (x1 + 18, 88), "Test report synced", 14, (31, 96, 255), True)
        text(draw, (x1 + 18, 116), "docs / logs / reports / evidence", 13, (63, 78, 105))
        text(draw, (x1 + 18, 138), "Ready for GitHub README banner", 13, (16, 91, 52), True)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    frame_count = FPS * DURATION_SECONDS
    frames: list[Image.Image] = []

    for index in range(frame_count):
        t = index / FPS
        image = Image.new("RGBA", (W, H), (247, 250, 254, 255))
        draw_chat_frame(image, index, t)
        frames.append(image.convert("RGB"))

    durations = [1000 // FPS for _ in frames]
    frames[0].save(
        OUT_WEBP,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        quality=86,
        method=6,
        lossless=False,
    )
    frames[0].resize((640, 360), Image.Resampling.LANCZOS).save(
        OUT_GIF,
        save_all=True,
        append_images=[frame.resize((640, 360), Image.Resampling.LANCZOS) for frame in frames[1:]],
        duration=durations,
        loop=0,
        optimize=True,
    )
    print({"webp": str(OUT_WEBP), "gif": str(OUT_GIF), "frames": frame_count, "fps": FPS, "seconds": DURATION_SECONDS})


if __name__ == "__main__":
    main()
