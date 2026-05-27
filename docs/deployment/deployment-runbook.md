# Runbook triển khai

Cập nhật lần cuối: 2026-05-27

## 1. Chuẩn bị trước khi chạy

- Cài Docker + Docker Compose plugin.
- Chuẩn bị file `.env` (và `.env.all` nếu dùng compose all).
- Đảm bảo thư mục cache đủ dung lượng lưu model/data.

## 2. Cách chạy tiêu chuẩn

### Cách 1: Script tổng

```bash
bash ./run_all_services.sh
```

Script sẽ:

- Setup dependencies cục bộ (theo biến môi trường).
- Kiểm tra image vLLM.
- Kiểm tra GeoIP.
- Startup các dịch vụ qua docker compose.

### Cách 2: Docker Compose trực tiếp

```bash
docker compose -f docker-compose.yml up -d --build
```

## 3. Dịch vụ và cổng mặc định

- Frontend qua Nginx: `http://localhost:6101`
- Backend API: `http://localhost:6102`
- Frontend local tmux: `http://localhost:6103`
- Parse-data: `http://localhost:6104`
- Embedding/Rerank: `http://localhost:6105`
- vLLM: `http://localhost:6106`
- Prometheus collector: `http://localhost:6107`
- PostgreSQL/PgBouncer/Adminer: `localhost:6110`, `localhost:6111`, `http://localhost:6112`
- Qdrant: `http://localhost:6113`
- MinIO: `http://localhost:6114` và console `http://localhost:6115`
- Redis/Redis Insight: `localhost:6116`, `http://localhost:6117`
- Prometheus: `http://localhost:6118`
- Exporters/SearxNG: `6119-6123`

## 4. Kiểm tra sức khỏe nhanh

```bash
curl -f http://localhost:6102/api/v1/health || true
curl -f http://localhost:6104/health || true
curl -f http://localhost:6105/api/v1/embed -H "Content-Type: application/json" -d '{"texts":["ping"]}' || true
```

## 5. Backup và restore

- Backup: dùng `backup.sh`.
- Restore: dùng `restore.sh <duong_dan_backup>`.
- Có thể bật auto restore lần đầu qua biến môi trường script runtime.
