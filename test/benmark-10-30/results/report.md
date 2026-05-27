# Benchmark 10-30 câu hỏi

- Bắt đầu: 2026-05-27T04:21:02.534Z
- Kết thúc: 2026-05-27T04:30:11.103Z
- Public base: `http://localhost:6101`
- Model: `google/gemma-4-E4B-it`
- Checks: 22, questions: 16, pass: 22, fail: 0
- Upload/index latency: 438 ms
- Embedding latency: 1018 ms (3 vectors, dim 2048)
- Question latency p50/p95/max: 4251/223630/223630 ms
- Avg throughput: 30.44 tokens/s hoặc token/s ước lượng cho SSE

| Result | Group | Name | Latency ms | tok/s | Question | Answer preview | Error |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| PASS | health | Public home | 34 |  |  | <!DOCTYPE html><!--PazEKrGd7mwFeLpM94p2o--><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet"  |  |
| PASS | health | vLLM models | 2 |  |  | {"object":"list","data":[{"id":"google/gemma-4-E4B-it","object":"model","created":1779855662,"owned_by":"vllm","root":"google/gemma-4-E4B-it","parent":null,"max_model_len":8192,"pe |  |
| PASS | auth | Login root | 206 |  |  | {"status":200,"account":{"id":1,"email":"admin@example.com","name":"Root Admin","phone":null,"address":null,"is_verified":true,"is_active":true,"has_avatar":false,"roles":["root"], |  |
| PASS | auth | Auth me | 12 |  |  | {"status":200,"result":{"id":1,"email":"admin@example.com","name":"Root Admin","phone":null,"address":null,"is_verified":true,"is_active":true,"has_avatar":false,"roles":["root"]," |  |
| PASS | embedding | Embedding 3 đoạn benchmark | 1018 |  |  | {"status":200,"result":[[-0.03521728515625,0.00492095947265625,-0.01499176025390625,0.006832122802734375,0.0198211669921875,0.0188751220703125,-0.0151824951171875,0.009941101074218 |  |
| PASS | embedding | Rerank kiểm tra liên quan | 175 |  |  | {"status":200,"result":[{"index":0,"document":"P1 phản hồi trong 15 phút","score":-3.519531},{"index":1,"document":"Thanh toán trong 30 ngày","score":-3.939453},{"index":2,"documen |  |
| PASS | vllm | Q1 Direct vLLM | 3585 | 12.55 | Trả lời ngắn: hệ thống đang dùng dải port local nào? | {"id":"chatcmpl-89e2d21e1556c4e8","object":"chat.completion","created":1779855664,"prompt_routed_experts":null,"model":"google/gemma-4-E4B-it","choices":[{"index":0,"message":{"rol |  |
| PASS | vllm | Q2 Direct vLLM | 2097 | 19.07 | Tóm tắt một câu lợi ích của RAG trong hệ thống nội bộ. | {"id":"chatcmpl-86f521946d8d5008","object":"chat.completion","created":1779855668,"prompt_routed_experts":null,"model":"google/gemma-4-E4B-it","choices":[{"index":0,"message":{"rol |  |
| PASS | vllm | Q3 Direct vLLM | 353 | 17 | Viết đúng một dòng: BENCHMARK_OK | {"id":"chatcmpl-8264e54cc5c9b85f","object":"chat.completion","created":1779855670,"prompt_routed_experts":null,"model":"google/gemma-4-E4B-it","choices":[{"index":0,"message":{"rol |  |
| PASS | rag-fast | Q4 RAG fast | 5764 | 38.51 | Không dùng file, hãy trả lời ngắn hệ thống này có các module chính nào? | Đang tìm kiếm tài liệu tự động... Đang tìm kiếm tài liệu... Đang tạo vector embedding cho câu hỏi... Đang tìm kiếm vector trong cơ sở dữ liệu (top 10 paths)... Tìm thấy 1 đoạn văn, |  |
| PASS | rag-fast | Q5 RAG fast | 12649 | 30.75 | Không dùng file, giải thích ngắn vai trò của Qdrant trong RAG. | Đang tìm kiếm tài liệu tự động... Đang tìm kiếm tài liệu... Đang tạo vector embedding cho câu hỏi... Đang tìm kiếm vector trong cơ sở dữ liệu (top 10 paths)... Tìm thấy 1 đoạn văn, |  |
| PASS | rag-fast | Q6 RAG fast | 5576 | 42.14 | Không dùng file, nêu một rủi ro khi prompt quá dài. | Đang tìm kiếm tài liệu tự động... Đang tìm kiếm tài liệu... Đang tạo vector embedding cho câu hỏi... Đang tìm kiếm vector trong cơ sở dữ liệu (top 10 paths)... Tìm thấy 1 đoạn văn, |  |
| PASS | rag-file | Q7 RAG uploaded file | 2279 | 64.5 | Dựa trên file benchmark vừa upload, SLA P1 phản hồi trong bao nhiêu phút? | Đang tìm kiếm tài liệu tự động... Đang tìm kiếm tài liệu... Đang tạo vector embedding cho câu hỏi... Đang tìm kiếm vector trong cơ sở dữ liệu (top 10 paths)... Tìm thấy 1 đoạn văn, |  |
| PASS | rag-file | Q8 RAG uploaded file | 4251 | 47.75 | Dựa trên file benchmark vừa upload, điều khoản thanh toán mặc định là gì? | Đang tìm kiếm tài liệu tự động... Đang tìm kiếm tài liệu... Đang tạo vector embedding cho câu hỏi... Đang tìm kiếm vector trong cơ sở dữ liệu (top 10 paths)... Tìm thấy 1 đoạn văn, |  |
| PASS | rag-file | Q9 RAG uploaded file | 3431 | 55.38 | Dựa trên file benchmark vừa upload, penalty chậm tiến độ là bao nhiêu? | Đang tìm kiếm tài liệu tự động... Đang tìm kiếm tài liệu... Đang tạo vector embedding cho câu hỏi... Đang tìm kiếm vector trong cơ sở dữ liệu (top 10 paths)... Tìm thấy 1 đoạn văn, |  |
| PASS | rag-file | Q10 RAG uploaded file | 3518 | 55.71 | Dựa trên file benchmark vừa upload, dải port local chuẩn là gì? | Đang tìm kiếm tài liệu tự động... Đang tìm kiếm tài liệu... Đang tạo vector embedding cho câu hỏi... Đang tìm kiếm vector trong cơ sở dữ liệu (top 10 paths)... Tìm thấy 1 đoạn văn, |  |
| PASS | rag-file | Q11 RAG uploaded file | 3208 | 58.92 | Dựa trên file benchmark vừa upload, GPU util mặc định của vLLM là bao nhiêu? | Đang tìm kiếm tài liệu tự động... Đang tìm kiếm tài liệu... Đang tạo vector embedding cho câu hỏi... Đang tìm kiếm vector trong cơ sở dữ liệu (top 10 paths)... Tìm thấy 1 đoạn văn, |  |
| PASS | web-search | Q12 Web search | 223630 | 5.16 | Web search: kiểm tra nhanh hôm nay localhost là gì trong ngữ cảnh URL? | Coordinator đang phân tích yêu cầu web search... mode=open_web, urls_user=0, domains_scope=0, preferred_domains=0, policy=open_web_broad, sub_queries=3, research_questions=3, loop= |  |
| PASS | web-search | Q13 Web search | 75875 | 6.79 | Web search: tìm khái niệm FastAPI là gì, trả lời rất ngắn. | Coordinator đang phân tích yêu cầu web search... mode=open_web, urls_user=0, domains_scope=0, preferred_domains=0, policy=open_web_broad, sub_queries=3, research_questions=2, loop= |  |
| PASS | contract-fast | Q14 Contract fast | 124452 | 3.74 | Tạo hợp đồng dịch vụ ngắn giữa Công ty A và Công ty B, giá trị 50 triệu, thanh toán 30 ngày. | Đang phác thảo hợp đồng... Đang phác thảo hợp đồng... Đang phác thảo hợp đồng... Đang phác thảo hợp đồng... Đang phác thảo hợp đồng... Đang phác thảo hợp đồng... Đang phác thảo hợp |  |
| PASS | contract-fast | Q15 Contract fast | 62467 | 5.14 | Tạo phụ lục hợp đồng ngắn gia hạn thời gian thực hiện thêm 15 ngày. | Đang phác thảo hợp đồng... Đang phác thảo hợp đồng... Đang phác thảo hợp đồng... Đang phác thảo hợp đồng... Đang phác thảo hợp đồng... Đang phác thảo hợp đồng... Đang phác thảo hợp |  |
| PASS | contract-reasoning | Q16 Contract reasoning | 13545 | 23.92 | Tạo hợp đồng bảo mật NDA ngắn giữa Bên tiết lộ và Bên nhận, thời hạn bảo mật 2 năm. | {"user_id": "1", "session_id": 16, "title": "Multi-Agent đang hội ý tạo hợp đồng...", "mess": "", "end": false}\n\ndata: {"user_id": "1", "session_id": 16, "title": "Hệ thống AI đa |  |
