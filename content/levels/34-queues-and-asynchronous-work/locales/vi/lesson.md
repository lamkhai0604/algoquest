# Queue (hàng đợi) và asynchronous work (công việc làm sau khi đã trả lời request)

## [objectives] Mục tiêu học tập

- Giải thích message broker (máy chủ lưu và chuyển message) lưu gì, cách producer (bên gửi message), queue và consumer (bên nhận và xử lý message) phối hợp.
- Đưa việc chậm ra khỏi request, ước lượng số worker (tiến trình xử lý công việc từ hàng đợi) cần để theo kịp message (thông điệp) đến.
- Ước lượng backlog (lượng việc đang chờ) tăng nhanh ra sao khi việc đến nhanh hơn tốc độ xử lý, và mất bao lâu để xử lý hết.
- Giải thích acknowledgment (ack) (xác nhận đã xử lý xong) và at-least-once delivery (giao ít nhất một lần), dùng idempotency key (khoá để lặp lại thao tác mà không đổi kết quả) để lặp việc an toàn.
- Thử lại việc lỗi bằng exponential backoff (chờ lâu gấp đôi sau mỗi lần thử lại) và jitter (độ lệch ngẫu nhiên thêm vào thời gian chờ), chuyển message lỗi liên tục đến dead-letter queue (hàng đợi cho message lỗi nhiều lần).
- Phân biệt queue với publish-subscribe (pub/sub) (xuất bản và đăng ký nhận) và event log (nhật ký sự kiện), áp dụng back-pressure (giảm hoặc từ chối việc mới khi bị quá tải) khi backlog quá lớn.

### Thuật ngữ chính

- **Asynchronous work.** Việc làm sau khi đã trả lời request, thay vì làm trong lúc người dùng chờ.
- **Message broker.** Server (máy chủ) lưu message đến khi chúng được xử lý. RabbitMQ, Amazon SQS và Apache Kafka là ví dụ.
- **Producer và consumer.** **Producer** gửi message đến broker; **consumer** (thường gọi là **worker**) lấy message và làm việc tương ứng.
- **Queue.** Danh sách message trong broker, nơi mỗi message do một consumer xử lý. Nhiều worker chia nhau công việc, gần theo thứ tự vào trước ra trước như Level 6.
- **Acknowledgment (ack).** Thông báo từ consumer đến broker rằng message đã xử lý xong, để broker xóa nó. Message đã được lấy nhưng chưa được ack sẽ được giao lại sau một giới hạn thời gian, thường gọi là **visibility timeout (thời gian message bị ẩn khi đang xử lý)**.
- **At-least-once delivery.** Mọi message được xử lý ít nhất một lần, đôi khi hai lần, chẳng hạn worker làm xong nhưng hỏng trước khi ack.
- **Idempotency key.** Khóa duy nhất đi kèm một việc, như order id, để làm lại với cùng khóa không thay đổi kết quả (SD 5 đã giải thích phương thức idempotent; cách này giúp thao tác bất kỳ lặp lại an toàn).
- **Backlog.** Những message đang chờ trong queue. Nó tăng khi message đến nhanh hơn worker xử lý xong.
- **Retry với exponential backoff.** Thử lại việc lỗi sau những khoảng chờ tăng dần, như 1, 2, 4, 8 và 16 giây. **Jitter** thêm một độ lệch ngẫu nhiên nhỏ vào mỗi lần chờ để nhiều lần thử lại không đến cùng lúc.
- **Dead-letter queue.** Queue riêng cho message lỗi quá nhiều lần, giữ để người xem xét thay vì thử lại mãi.
- **Publish-subscribe (pub/sub).** Producer phát message một lần, mỗi subscriber (bên đăng ký nhận) nhận bản riêng, như email service và warehouse service đều nhận “đã đặt đơn”.
- **Event log.** Broker giữ mọi message theo thứ tự trong một thời gian, như 7 ngày, kể cả khi đã đọc. Mỗi consumer giữ vị trí riêng (**offset (vị trí trong dãy dữ liệu (số mục đã đi qua))**) và có thể đọc lại từ vị trí cũ.
- **Back-pressure.** Làm chậm hoặc từ chối việc mới khi backlog quá lớn, tránh để hệ thống tụt lại thêm.

## [problem-hook] Vấn đề mở đầu

Cửa hàng trực tuyến làm mọi thứ trong lúc khách chờ sau khi nhấn “Đặt hàng”: lưu đơn, gửi email xác nhận, tạo hóa đơn PDF và báo kho. Khách chờ khoảng 1.4 giây; khi nhà cung cấp email chậm, trang hết thời gian chờ và một số khách nhấn lại, tạo đơn thứ hai.

Trong đợt giảm giá, 50 đơn đến mỗi giây. Bộ tạo hóa đơn không theo kịp, khiến cả trang đặt hàng chậm theo. Nhưng những việc phụ này không cần xong trước khi khách thấy “Cảm ơn bạn đã đặt hàng”.

## [intuition] Cách hiểu trực quan

Hãy nghĩ về nhà hàng đông khách. Nhân viên phục vụ không đứng chờ trong bếp khi món đang nấu. Họ ghi món lên phiếu, ghim lên thanh treo rồi quay lại bàn. Đầu bếp lần lượt lấy phiếu; thêm đầu bếp thì nấu được nhiều phiếu cùng lúc. Thanh treo là queue, nhân viên phục vụ là producer, đầu bếp là worker.

Nếu phiếu đến nhanh hơn tốc độ nấu, hàng phiếu dài ra: đó là backlog. Đầu bếp chỉ đánh dấu xong sau khi đĩa rời bếp; nếu họ bị gọi đi giữa chừng, người khác lấy lại cùng phiếu. Đôi khi món được nấu hai lần, nên bếp kiểm tra số bàn trước khi gửi đĩa thứ hai: kiểm tra đó đóng vai trò idempotency key.

**Liên hệ với Level 6.** Queue là cấu trúc vào trước ra trước của Level 6, đặt trên server riêng để nhiều producer và worker cùng dùng; khi broker ghi xuống đĩa, queue còn sau khi khởi động lại.

## [when-to-use] Khi nào nên dùng

- **Queue với worker:** việc không cần hoàn tất trước khi trả lời người dùng, như email, hóa đơn, đổi kích thước ảnh hoặc gọi đối tác chậm.
- **Publish-subscribe:** nhiều bộ phận độc lập phản ứng với cùng sự kiện, mỗi bên cần bản riêng, như email, kho và phân tích sau “đã đặt đơn”.
- **Event log:** consumer cần đọc lại lịch sử, bắt đầu muộn rồi theo kịp, hoặc xử lý sự kiện theo thứ tự, như dựng lại báo cáo hay cấp dữ liệu từ một luồng cho nhiều hệ thống.
- **Retry với backoff:** lỗi có thể tạm thời, như timeout (hết thời gian chờ) hoặc 503 từ đối tác.
- **Dead-letter queue:** message có thể hỏng hoặc cần người xử lý, nên phải ngừng thử lại mà không làm mất.
- **Không dùng queue:** người dùng cần kết quả ngay, như giá đang hiện hoặc “ghế này còn trống không?” (SD 4).

## [template-code] Khung thiết kế

Bài này không có code. Dùng **khung thiết kế** sau cho asynchronous work:

```text
1. What must finish before the user gets an answer? Keep only that in the request.
   Everything else becomes a message.
2. Workers: arrival rate x time per job = workers busy at once.
   Add room (for example, run at most 70% busy, rounding up).
3. Backlog: if arrival > capacity, backlog grows by (arrival - capacity) per second.
   It drains at (capacity - arrival) once the peak ends.
4. Delivery is at least once: give each job an idempotency key and make
   repeats harmless (a unique constraint, or a key the other side checks).
5. Acknowledge only after the work is done. Visibility timeout > the longest job.
6. Failures: retry with exponential backoff and jitter, at most N times,
   then send to a dead-letter queue and alert a person.
7. One consumer per message (queue) or a copy for each subscriber (pub/sub)?
   Must consumers read history again (event log)?
8. Back-pressure: what happens when the backlog passes its limit?
```

## [complexity] Chi phí và ước lượng

**Thời gian trả lời.** Lưu đơn mất 30 ms, đưa một message vào queue khoảng 5 ms, nên khách chờ khoảng 35 ms thay vì 30 + 400 + 800 + 200 = 1,430 ms cho lưu đơn, email, hóa đơn và gọi kho.

**Số worker cần.** Mỗi worker làm một việc tại một thời điểm. Nếu hóa đơn mất 0.8 giây, một worker xong 1 ÷ 0.8 = 1.25 hóa đơn mỗi giây. Với 50 đơn mỗi giây, 50 ÷ 1.25 = 40 worker luôn bận; để giữ mức bận không quá 70%, chạy 40 ÷ 0.7 ≈ 57.1, làm tròn lên 58.

**Backlog tăng.** Chỉ có 30 worker thì năng lực là 30 × 1.25 = 37.5 hóa đơn mỗi giây. Khi đơn đến 50 mỗi giây, backlog tăng 50 − 37.5 = 12.5 mỗi giây: 7,500 hóa đơn chờ sau đợt giảm giá 10 phút. Khi đơn giảm còn 10 mỗi giây, backlog giảm với tốc độ 37.5 − 10 = 27.5 mỗi giây: 7,500 ÷ 27.5 ≈ 273 giây, khoảng 4.5 phút.

**Thời gian retry.** Chờ 1, 2, 4, 8 và 16 giây giữa năm lần retry cho tổng 1 + 2 + 4 + 8 + 16 = 31 giây chờ trước khi message đến dead-letter queue; thời gian các lời gọi lỗi và jitter còn thêm vào một chút. Gấp đôi thêm một lần sẽ chờ tổng 63 giây qua sáu lần retry; nhiều hệ thống cũng chặn một lần chờ ở mức tối đa, như 60 giây.

| Kiểu broker | Ai nhận message | Sau khi xử lý | Cách dùng thường gặp |
| --- | --- | --- | --- |
| Queue | Một consumer trong số các worker | Xóa sau ack | Email, hóa đơn, đổi kích thước ảnh |
| Publish-subscribe | Mỗi subscriber nhận một bản | Xóa khỏi queue của từng subscriber sau ack | Nhiều service phản ứng với một sự kiện |
| Event log | Mỗi consumer đọc ở offset riêng | Giữ đến hết thời gian lưu | Đọc lại lịch sử, luồng theo thứ tự |

## [common-mistakes] Lỗi thường gặp

- **Ack trước khi làm xong.** Nếu worker hỏng sau ack, message đã mất và email không được gửi.
- **Cho rằng mỗi message đến đúng một lần.** Với at-least-once delivery, hỏng giữa lúc làm xong và ack khiến việc lặp lại. Không có idempotency key, khách nhận hai email hoặc kho gửi hàng hai lần.
- **Retry ngay lập tức, mãi mãi.** Khi đối tác ngừng hoạt động, hàng nghìn lần retry ngay thêm tải đúng lúc họ khó chịu tải nhất. Tăng khoảng chờ, thêm jitter và dừng sau giới hạn.
- **Visibility timeout ngắn hơn công việc.** Nếu một việc mất 2 phút và timeout là 30 giây, worker thứ hai bắt đầu cùng việc khi worker đầu vẫn đang làm.
- **Bỏ qua backlog.** Queue che quá tải được một lúc; nếu việc liên tục đến nhanh hơn tốc độ xử lý, thời gian chờ tăng không dừng.

## [edge-cases] Trường hợp đặc biệt

- **Poison message (message làm worker lỗi mỗi lần xử lý).** Message làm mọi worker hỏng, như trường dữ liệu lỗi, sẽ bị retry mãi. Sau vài lần lỗi, nó đến dead-letter queue.
- **Chính queue hỏng.** Message chưa được lưu sẽ mất. Producer lưu đơn trước, chỉ gửi message sau khi lưu thành công; broker có replica (SD 6) giữ message đã lưu qua sự cố một server.
- **Thứ tự quan trọng.** Với nhiều worker, message hoàn tất khác thứ tự đến. Nếu cần giữ thứ tự cho một khách hoặc một đơn, xem phần mở rộng.
- **Backlog dài khiến việc cũ mất ích lợi.** Thông báo “món ăn sẵn sàng” đến muộn một giờ còn tệ hơn không gửi. Một số message mang hạn dùng và bị bỏ sau hạn.
- **Back-pressure đến người dùng.** Khi backlog vượt giới hạn, producer có thể từ chối việc mới (như 503 hoặc 429) hoặc bỏ việc tùy chọn, như phân tích, để bảo vệ phần quan trọng.

### Mở rộng (không bắt buộc): thứ tự theo khóa, batch và stream processing

Phần lớn broker chỉ giữ thứ tự trong một queue hoặc một phần của log. Để giữ thứ tự sự kiện của một đơn, định tuyến mọi message cùng khóa (order id) đến cùng phần, nơi một consumer đọc theo thứ tự. Message của các đơn khác nhau vẫn có thể xong theo thứ tự bất kỳ, thường không sao.

**Batch processing (xử lý theo lô)** gom dữ liệu rồi xử lý một lượt theo lịch, như báo cáo bán hàng hằng đêm. **Stream processing (xử lý theo luồng)** xử lý từng sự kiện khi đến, như cập nhật dashboard trực tiếp mỗi giây. Batch đơn giản và rẻ hơn; stream cho kết quả mới hơn.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** Sau “Đặt hàng”, cửa hàng phải gửi email xác nhận (khoảng 400 ms qua nhà cung cấp email), tạo hóa đơn PDF (khoảng 0.8 s) và báo kho (khoảng 200 ms qua API (giao diện lập trình ứng dụng) của kho). Trong đợt giảm giá, 50 đơn đến mỗi giây trong 10 phút. Trang đặt hàng phải trả lời trong 200 ms. Không được gửi email hai lần và kho không được giao hai lần. Bình thường cả hai xong trong một phút; khi kho ngừng hoạt động, lời gọi kho có thể chậm tối đa 30 phút. API của kho đôi khi ngừng hoạt động tới 10 phút. Cả nhà cung cấp email và API kho đều nhận idempotency key, bỏ qua request thứ hai cùng khóa. Hãy thiết kế asynchronous work.

**Lời giải:**

1. **Giữ request ngắn.** Trang lưu đơn (30 ms), phát một message “đã đặt đơn” cùng order id rồi trả lời: khoảng 35 ms, trong 200 ms. Nếu phát message lỗi, trang báo lỗi để khách thử lại, vì lưu đơn và gửi message là hai bước riêng (SD 10 trình bày cách làm cả hai đáng tin cậy).
2. **Một sự kiện, ba consumer.** “Đã đặt đơn” đến một topic publish-subscribe với ba queue subscriber: email, hóa đơn và kho. Mỗi bên có worker riêng, nên kho chậm không trì hoãn email.
3. **Worker.** Hóa đơn: 50 × 0.8 = 40 worker bận, dùng 58 để không vượt 70%. Email: 50 × 0.4 = 20 worker bận, dùng 29. Gọi kho: 50 × 0.2 = 10 worker bận, dùng 15.
4. **Ít nhất một lần, nhưng lặp an toàn.** Worker email gửi order id làm idempotency key; nhà cung cấp bỏ qua request lặp cùng khóa. Worker kho làm tương tự với API kho. Worker hóa đơn ghi PDF dưới order id, nên lặp lại ghi đè cùng tệp. Mỗi worker chỉ ack sau khi lời gọi thành công.
5. **Retry.** Lời gọi kho lỗi được retry bằng exponential backoff và jitter, bắt đầu 1 giây, mỗi khoảng chờ tối đa 60 giây, trong tối đa 30 phút, dài hơn sự cố 10 phút. Trong sự cố, 50 × 600 = 30,000 message kho chờ trong queue, broker dễ dàng lưu được. Sau 30 phút, message đến dead-letter queue và báo cho người xử lý.
6. **Back-pressure.** Nếu backlog email vượt 100,000 message, cửa hàng ngừng gửi email tiếp thị dùng chung worker, để email xác nhận vẫn được gửi.

**Kết quả:** Trang lưu đơn và phát một sự kiện, trả lời khoảng 35 ms. Ba queue subscriber với 58, 29 và 15 worker xử lý hóa đơn, email và gọi kho; idempotency key giúp message lặp không gây tác dụng thêm; backoff retry kéo dài hơn sự cố 10 phút, message còn lỗi đến dead-letter queue.
