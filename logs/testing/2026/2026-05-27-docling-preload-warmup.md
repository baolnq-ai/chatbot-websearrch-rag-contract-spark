# Log Test Docling Preload Warmup

Thời gian: 2026-05-27

## Mục tiêu

Xác nhận nguyên nhân upload PDF đầu tiên lâu và thêm warm-up để model Docling/EasyOCR/TableFormer được load khi parse-data khởi động.

## Kết luận log

- Upload `8.pdf` trước đó không crash frontend/backend.
- Backend đã upload file lên MinIO, sau đó chờ parse-data tại `http://127.0.0.1:6104/api/v1/parse`.
- Parse-data mất thời gian ở bước cold start model: EasyOCR detection model và Docling model từ Hugging Face.
- File `8.pdf` hoàn tất parse sau khoảng 275 giây ở lần cold start.
- Code giải phóng RAM sau parse vẫn giữ nguyên: `del result` và `gc.collect()`.

## Thay đổi

- Thêm `PARSER_PRELOAD_DOCLING_MODELS=true`.
- Thêm startup warm-up trong `parse-data/main.py`.
- Warm-up convert một PDF nhỏ bằng chính `document_converter` hiện tại để load model trước request upload thật.

## Verify

```bash
python3 -m py_compile parse-data/main.py parse-data/src/config/docling_config.py parse-data/src/service/parse_service.py parse-data/src/router/parse_router.py
curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:6104/docs
```

Kết quả:

- Python compile: pass.
- Parse-data `/docs`: 200.
- Log parse-data có `[DOCLING_WARMUP] Hoàn tất preload model trong 15.27s`.

## Rủi ro còn lại

- Fresh machine/cache trống vẫn có thể mất vài phút khi khởi động parse-data lần đầu vì phải tải model. Khác biệt là thời gian này nằm ở startup, không nằm trong request upload đầu tiên của người dùng.
- Curl test bằng `cache/minio/raw-files/8.pdf` không dùng làm bằng chứng parse vì path đó là thư mục object MinIO, không phải PDF gốc trực tiếp.

