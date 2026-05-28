# Task Log - 2026-05-28 - Rename stop script

## Thoi gian

- 2026-05-28 Asia/Ho_Chi_Minh.

## Thay doi

- Doi script dung local tu `stop_all_services.sh` thanh `stop.sh`.
- Cap nhat README va tai lieu van hanh hien hanh sang lenh `bash ./stop.sh`.
- Kiem tra `setup.sh`: khong co tham chieu den ten script cu, cleanup/start flow khong xung dot voi rename.

## Verify

- `bash -n setup.sh stop.sh`: pass.
- `bash ./stop.sh`: chay thanh cong, docker compose services da duoc stop voi `down --remove-orphans`.
