# Phương pháp phỏng vấn thiết kế

## [objectives] Mục tiêu học tập

- Thực hiện đủ quy trình cho câu hỏi thiết kế: làm rõ, ước lượng, API, data model (mô hình dữ liệu), high-level design (thiết kế tổng quan), một hoặc hai deep dive (đi sâu vào một phần), lỗi và tổng kết.
- Biến câu hỏi mơ hồ thành yêu cầu đánh số, nêu phần trong và ngoài design scope (phạm vi thiết kế).
- Ước lượng request, storage, bandwidth, latency (độ trễ) budget (ngân sách độ trễ) và chi phí sơ bộ, để con số dẫn dắt lựa chọn.
- Chọn deep dive ở yêu cầu khó nhất và nêu từng lỗi kèm điều kiện.
- Dùng thinking aloud (nói to suy nghĩ của mình) và bám kế hoạch thời gian, để cuộc phỏng vấn 45 phút kết thúc với thiết kế đầy đủ.

### Thuật ngữ chính

- **Functional requirement (yêu cầu chức năng).** Hệ thống phải làm gì, như “người chơi xem được top 100 điểm”.
- **Non-functional requirement (yêu cầu phi chức năng).** Làm tốt đến đâu, kèm con số: tải, latency, availability (luôn trả lời được request), freshness, như “điểm mới xuất hiện trong bảng xếp hạng trong 5 giây”.
- **Design scope.** Thiết kế này bao gồm và bỏ qua điều gì, nói rõ để dành thời gian đúng phần.
- **Back-of-the-envelope estimate (ước lượng nhanh).** Phép tính nhanh với số tròn, như “10 triệu người chơi × 20 trận ÷ 100,000 giây một ngày ≈ 2,000 lần ghi mỗi giây”, chính xác trong phạm vi chênh vài lần.
- **Latency budget.** Mục tiêu thời gian một request chia cho các bước đi qua, để mỗi phần có giới hạn.
- **Data model.** Bản ghi chính, key và query (truy vấn) đọc chúng.
- **High-level design.** Các hộp và mũi tên: client (máy khách (chương trình gửi yêu cầu)), load balancer (bộ cân bằng tải), server (máy chủ), store, queue (hàng đợi) và request đi qua thế nào.
- **Deep dive.** Xem kỹ một phần, thường là nơi có yêu cầu khó nhất hoặc con số lớn nhất.
- **Thinking aloud.** Nói lý do và giả định trong lúc làm, để người phỏng vấn theo dõi, sửa và hỗ trợ.

## [problem-hook] Vấn đề mở đầu

Người phỏng vấn nói: “Thiết kế leaderboard cho game điện thoại.” Nhiều ứng viên vẽ server ngay. Hai mươi phút sau họ có sáu hộp, không có con số, database (cơ sở dữ liệu) không trả lời kịp “hạng của tôi là gì?” và không còn thời gian nói về lỗi.

Câu hỏi giống nhau trong mọi cuộc phỏng vấn system design: cố ý mơ hồ, quá nhiều thứ để làm trong 45 phút. Quy trình cố định biến nó thành chuỗi quyết định nhỏ, mỗi quyết định dựa trên con số từ bước trước.

## [intuition] Cách hiểu trực quan

Hãy nghĩ về thợ xây được yêu cầu “xây nhà”. Thợ giỏi không bắt đầu bằng gạch. Đầu tiên hỏi: bao nhiêu người, mấy tầng, ngân sách nào, khí hậu nào (yêu cầu). Sau đó đo đất và tính giá vật liệu (ước lượng). Rồi vẽ cửa và phòng người dùng (API và data model), bản thiết kế cả nhà (high-level design), phần khó chi tiết như mái ở thị trấn nhiều tuyết (deep dive). Cuối cùng nói điều xảy ra khi ống vỡ (lỗi), dẫn chủ nhà xem kế hoạch (tổng kết).

Chủ nhà ở đó suốt nên thợ vừa vẽ vừa nói: “Tôi giả định hai tầng; sai thì cho tôi biết.” Đó là điều người phỏng vấn muốn nghe.

**Liên hệ SD 1 đến SD 14.** Mỗi bước dùng lại bài trước: ước lượng SD 1, server và load balancer SD 2, caching SD 3, database SD 4, API SD 5, queue SD 7, reliability SD 11 và các phần khác khi cần.

## [when-to-use] Khi nào nên dùng

- **Toàn bộ quy trình:** trong mọi cuộc phỏng vấn system design và tài liệu thiết kế, kể cả hệ thống nhỏ; bước ngắn được, bỏ bước thì không.
- **Làm rõ trước:** luôn cần trong vài phút đầu. Hỏi người dùng, quy mô, tính năng quan trọng nhất và chất lượng quan trọng nhất như latency hoặc consistency.
- **Ước lượng:** trước khi chọn bộ phận, để lựa chọn theo con số: một hay nhiều database, cần cache (bộ nhớ đệm) hoặc queue không.
- **Deep dive:** ở yêu cầu khó nhất hoặc nơi người phỏng vấn chỉ; làm tốt một phần hơn lướt ba phần.
- **Lỗi kèm điều kiện:** với mỗi phần quan trọng, nói lỗi gì, khi nào, người dùng thấy gì.
- **Trong design prompt của AlgoQuest:** từ bài này, form trả lời có một ô cho mỗi bước, từ yêu cầu và phạm vi đến tổng kết.

## [template-code] Khung thiết kế

Bài này không có code. Dùng **quy trình** sau cho mọi câu hỏi thiết kế, với kế hoạch 45 phút:

```text
1. Clarify (5 min): functional and non-functional requirements, with
   numbers; what is out of scope.
2. Estimate (5 min): requests per second (average and peak), storage,
   bandwidth, a latency budget per step, a rough cost.
3. API (3 min): the main calls, their inputs and outputs.
4. Data model (4 min): the main records, keys, and the queries.
5. High-level design (8 min): boxes and arrows; walk one request through.
6. Deep dive (10 min): one or two parts with the hardest requirement.
7. Failures (5 min): what fails, under which condition, what users see.
8. Summary (3 min): how the design meets each requirement; what you
   would do next. That is 43 minutes; leave 2 for questions.
```

## [complexity] Chi phí và ước lượng

**Request mỗi giây từ người dùng.** Ngày có 86,400 giây; làm tròn 100,000 để tính nhanh. Nếu 10 triệu người chơi 20 trận mỗi ngày thì có 200 triệu điểm mỗi ngày, khoảng 2,000 mỗi giây trung bình. Cao điểm thường gấp vài lần; giả định 5×, khoảng 10,000 mỗi giây.

**Storage.** 50 triệu người chơi × khoảng 100 byte mỗi bản ghi điểm = 5 GB: đủ nhỏ để giữ trong bộ nhớ một in-memory store, kèm bản sao.

**Bandwidth.** Danh sách top-100 khoảng 100 byte mỗi dòng là 10 KB. Với 5,000 lần đọc mỗi giây, có 50 MB mỗi giây, cache hoặc CDN (mạng phân phối nội dung) trước server gánh được.

**Latency budget.** Mục tiêu 200 ms cho “hạng của tôi”: tối đa 100 ms mạng tới và từ điện thoại, 10 ms ở load balancer và server, 5 ms trong in-memory store, còn khoảng 85 ms dự phòng.

**Chi phí sơ bộ.** Mười server giả định mỗi cái $200 mỗi tháng là $2,000 một tháng; in-memory store kèm bản sao thêm vài trăm. Con số cho biết thiết kế hợp lý không, không phải giá chính xác.

| Bước | Kết quả | Lỗi thường gặp |
| --- | --- | --- |
| Làm rõ | Yêu cầu đánh số kèm số liệu; phạm vi | Thiết kế trước khi biết quy mô |
| Ước lượng | Request mỗi giây, storage, bandwidth, latency budget, chi phí | Con số không lựa chọn nào về sau sử dụng |
| API và data model | Lời gọi và bản ghi phục vụ mọi yêu cầu | Data model không trả lời nhanh query chính |
| High-level design | Theo một request qua các hộp | Hộp không có lý do tồn tại |
| Deep dive | Phần khó nhất, chi tiết | Dàn trải mọi thứ |
| Lỗi và tổng kết | Điều kiện, điều người dùng thấy; kiểm tra yêu cầu | “Highly available” nhưng không có điều kiện |

## [common-mistakes] Lỗi thường gặp

- **Bắt đầu bằng hộp.** Không yêu cầu và số liệu thì mọi bộ phận là đoán; người phỏng vấn không hiểu vì sao có nó.
- **Ước lượng rồi bỏ qua.** Nếu 5 GB vừa bộ nhớ, nói rõ và dùng; nếu 10,000 lần ghi mỗi giây quá nhiều cho một database, nói cách xử lý.
- **Im lặng.** Im lâu che mất suy luận tốt. Nói đang quyết định gì, vì sao, và hỏi khi giả định quan trọng.
- **Hết giờ.** Dành 25 phút cho API không còn deep dive hay lỗi. Nhìn đồng hồ sau mỗi bước.
- **Lỗi mơ hồ.** “Thêm redundancy (dự phòng bằng nhiều bản sao)” không nói gì. “Nếu bản chính của in-memory store lỗi, replica tiếp quản trong vài giây; điểm ghi trong khoảng đó được phát lại từ database” thì có.

## [edge-cases] Trường hợp đặc biệt

- **Người phỏng vấn đổi yêu cầu giữa chừng.** Nói lựa chọn trước nào bị ảnh hưởng, cập nhật ước lượng, chỉ đổi phần đó.
- **Người phỏng vấn hỏi deep dive chưa dự định.** Theo họ; câu hỏi cho biết điều muốn đánh giá.
- **Không biết công nghệ họ nêu.** Nói rõ, mô tả cần gì từ công nghệ và thiết kế bằng bộ phận mình hiểu.
- **Con số có vẻ vô lý.** Nói kết quả và kiểm tra tính hợp lý: 2 triệu lần ghi mỗi giây cho game nhỏ có thể do thừa số không.

### Mở rộng (không bắt buộc): hiểu tín hiệu người phỏng vấn

Người phỏng vấn thường gợi ý: hỏi tiếp một phần (“hai điểm đến cùng lúc thì sao?”) nghĩa là muốn đi sâu; “chưa cần lo việc đó” nghĩa là nên chuyển tiếp. Hỏi ngắn sau yêu cầu và high-level design: “Phần này khớp ý anh/chị trước khi tôi đi sâu chưa?”. Tốn mười giây, có thể tiết kiệm mười phút.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** Thiết kế leaderboard cho game điện thoại. Dùng quy trình và kế hoạch thời gian. Giả định một node in-memory store chứa khoảng 25 GB, xử lý khoảng 100,000 sorted-set update mỗi giây, trả rank lookup trong 1 ms, chỉ cập nhật điểm nếu điểm mới cao hơn và có replica.

**Lời giải:**

1. **Làm rõ.** Chức năng: (F1) người chơi nộp điểm sau mỗi trận; (F2) ai cũng xem global top 100; (F3) người chơi xem hạng mình. Phi chức năng: (N1) 10 triệu người chơi mỗi ngày, khoảng 20 trận mỗi người, tổng 50 triệu người; (N2) điểm tốt nhất mới hiện trong bảng xếp hạng trong 5 giây; (N3) “hạng của tôi” trả lời trong 200 ms; (N4) chỉ tính điểm tốt nhất từng người. Ngoài phạm vi: leaderboard bạn bè, phát hiện gian lận.
2. **Ước lượng.** 10 triệu × 20 = 200 triệu điểm mỗi ngày ÷ 100,000 ≈ 2,000 lần ghi mỗi giây, khoảng 10,000 cao điểm. 50 triệu người × 100 byte = 5 GB. Đọc top-100: mỗi lần 10 KB. Latency budget N3: 100 ms mạng, 10 ms server, 5 ms store, dư 85 ms. Chi phí: khoảng 10 server và một in-memory store kèm bản sao, vài nghìn đô mỗi tháng.
3. **API.** `POST /scores {score}` → 202 Accepted; `GET /leaderboard/top?n=100`; `GET /leaderboard/me` → hạng và điểm. Người chơi lấy từ đăng nhập (SD 13), không bao giờ lấy từ request body.
4. **Data model.** Trong database: `best_scores(player_id PK, score, updated_at)` và bảng outbox (SD 10). Trong in-memory store: sorted set (tập hợp có thứ tự theo điểm) của (score, player_id), giữ người chơi theo điểm, trả “hạng người chơi” và “top 100” trong khoảng log₂(50 triệu) ≈ 26 bước.
5. **High-level design.** Điện thoại → load balancer → app server. Lần ghi điểm chỉ cập nhật `best_scores` nếu cao hơn, đồng thời thêm dòng outbox trong cùng transaction (giao dịch); relay (tiến trình chuyển message từ outbox) sao chép mỗi dòng tới sorted set với “chỉ cập nhật nếu cao hơn”, nên crash không làm mất cập nhật và điểm thấp đến muộn không ghi đè điểm mới. “Top 100” được cache 1 giây trước server, giữ danh sách cuối làm fallback (phương án dự phòng); “hạng của tôi” đọc sorted set.
6. **Deep dive: sorted set.** 10,000 lần ghi mỗi giây cao điểm là một phần mười 100,000 của node; 5 GB dù nhân đôi cho cấu trúc set vẫn vừa 25 GB, có replica failover (chuyển sang máy chủ dự phòng). Rank lookup dưới 1 ms, trong budget 5 ms. Chỉ điểm cao hơn làm đổi dữ liệu nên đa số lần ghi không làm gì sau các trận đầu ngày. N2 đạt khi relay chạy vì sao chép mỗi dòng trong khoảng một giây.
7. **Lỗi.** Bản chính store lỗi, replica tiếp quản trong vài giây; dòng outbox chưa được set xác nhận được sao chép lại, “chỉ nếu cao hơn” làm bản lặp vô hại. Mất cả hai bản thì dựng set từ `best_scores` (50 triệu dòng, nhiều phút) với cùng quy tắc, relay vẫn áp dụng dòng mới; lúc đó app hiện top 100 đã lưu cuối, “hạng của tôi” hiện “đang cập nhật”, nên không đạt N2, N3 đến khi dựng xong. Relay ngừng thì dòng chờ trong outbox, N2 không đạt đến khi khởi động lại.
8. **Tổng kết.** F1 đến F3 qua API; N1 bằng 10,000 lần ghi mỗi giây, một phần mười node; N2 bằng outbox relay, trong vài giây khi chạy; N3 bằng rank lookup dưới 1 ms trong budget 200 ms; N4 bằng “chỉ nếu cao hơn” ở cả database và set.

**Kết quả:** Yêu cầu kèm số liệu, rồi khoảng 2,000 lần ghi mỗi giây (10,000 cao điểm) và 5 GB, nên một in-memory sorted set có replica trả hạng trong khoảng 26 bước. Điểm tốt nhất nằm trong database; outbox relay cập nhật set bằng “chỉ nếu cao hơn” để không mất hoặc áp dụng ngược cập nhật. Cache 1 giây phục vụ top 100, giữ danh sách cuối khi dựng lại. Nêu lỗi kèm điều kiện, tổng kết kiểm tra từng yêu cầu.
