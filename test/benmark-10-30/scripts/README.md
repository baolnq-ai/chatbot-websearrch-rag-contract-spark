# Scripts benchmark

Thư mục này chứa script tự động chạy benchmark 10-30 câu hỏi.

Script chính:

- `run-benchmark.mjs`: đăng nhập root qua API, đo health/auth/admin, đo embedding, upload file CSV vào RAG, chạy các câu hỏi RAG/web/contract/vLLM và xuất report.
