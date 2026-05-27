# GeoIP Runtime Data

Thư mục này dùng để chứa `GeoLite2-City.mmdb` và `GeoLite2-ASN.mmdb` khi chạy local/production.

Các file `.mmdb` không commit lên Git vì là dữ liệu runtime lớn. Fresh clone vẫn chạy được với `GEOIP_STRICT=false`; nếu cần geolocation đầy đủ, cấu hình `MAXMIND_LICENSE_KEY` hoặc `GEOIP_CITY_DB_URL`/`GEOIP_ASN_DB_URL` rồi chạy lại `bash ./run_all_services.sh`.
