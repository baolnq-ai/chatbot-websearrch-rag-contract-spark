# Log Test Setup Clean Restart

Thời gian: 2026-05-27

## Mục tiêu

Kiểm tra script setup chính sau khi đổi tên từ file start cũ sang `setup.sh`, đảm bảo script tự dọn tmux/process/container cũ rồi khởi động lại toàn bộ stack ổn định trên GB10/DGX Spark.

## Thay đổi liên quan

- Đổi script start chính thành `setup.sh`.
- Giữ `stop_all_services.sh` làm script dừng.
- Thêm pre-start cleanup trong `setup.sh`: kill tmux cũ, kill stale project code process và compose down với `--remove-orphans`.
- Thêm cleanup stale process trong `stop_all_services.sh`.
- Tách timeout vLLM: `VLLM_READINESS_TIMEOUT_SEC=1200`.
- Cập nhật README/docs/log references từ tên script cũ sang `setup.sh`.

## Lệnh đã chạy

```bash
bash -n setup.sh stop_all_services.sh
bash ./setup.sh
```

## Kết quả chính

- `setup.sh` tự kill tmux `rag-chatbot-code` cũ.
- `setup.sh` phát hiện và kill stale project code process.
- `setup.sh` chạy `docker compose down --remove-orphans` trước khi up lại.
- vLLM load model từ cache local và endpoint `/v1/models` trả `200`.
- Backend, frontend qua nginx, parse-data và embedding đều trả `200`.
- tmux `rag-chatbot-code` có đủ 5 window service.

## Endpoint verify

| Endpoint | HTTP | Ghi chú |
| --- | --- | --- |
| `http://127.0.0.1:6101/` | 200 | Frontend qua nginx |
| `http://127.0.0.1:6102/docs` | 200 | Backend docs |
| `http://127.0.0.1:6104/docs` | 200 | Parse-data docs |
| `http://127.0.0.1:6105/docs` | 200 | Embedding docs |
| `http://127.0.0.1:6106/v1/models` | 200 | vLLM models |

## Rủi ro còn lại

- GeoIP file chưa có nên geolocation degraded, nhưng startup không bị chặn vì `GEOIP_STRICT=false`.
- Frontend dependency có npm audit warning 10 vulnerabilities; cần task security/dependency riêng.
- HF Hub đang chạy không token; nếu cache bị xóa, lần tải mới có thể chậm hoặc rate-limit.

