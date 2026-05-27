from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
FRAMES_DIR = ROOT / ".runtime" / "demo-frames"
OUT = ROOT / "docs" / "assets" / "rag-chat-demo.gif"
TARGET_FRAMES = 1440
FRAME_DURATION_MS = 42


def main() -> None:
    frame_paths = sorted(FRAMES_DIR.glob("frame-*.png"))
    if not frame_paths:
        raise SystemExit("Không có frame để tạo GIF")

    frames = []
    for frame_path in frame_paths:
        image = Image.open(frame_path).convert("RGB")
        image.thumbnail((480, 270))
        frames.append(image)

    # GIF không lưu FPS như video; duration 42ms tương đương xấp xỉ 24fps.
    # Nội suy frame capture sang 1440 frame để banner đạt khoảng 60 giây.
    # Pixel cuối được đổi rất nhẹ để encoder không gộp các frame giữ nguyên.
    repeated = []
    for index in range(TARGET_FRAMES):
        source_index = min(len(frames) - 1, round(index * (len(frames) - 1) / max(1, TARGET_FRAMES - 1)))
        frame = frames[source_index].copy()
        marker = ((index * 53) % 256, (index * 97) % 256, (index * 193) % 256)
        for x in range(frame.width - 3, frame.width):
            for y in range(frame.height - 3, frame.height):
                frame.putpixel((x, y), marker)
        repeated.append(frame.convert("P", palette=Image.Palette.ADAPTIVE, colors=96))

    # GIF duration is stored in 10ms ticks. Mix 40ms and 50ms frames so
    # 1440 frames total exactly about 60s, i.e. an average 24fps banner.
    durations = [40 if index % 6 else 50 for index in range(TARGET_FRAMES)]

    repeated[0].save(
        OUT,
        save_all=True,
        append_images=repeated[1:],
        duration=durations,
        loop=0,
        optimize=False,
        disposal=2,
    )
    print(f"{OUT} frames={len(repeated)} duration_ms={sum(durations)}")


if __name__ == "__main__":
    main()
