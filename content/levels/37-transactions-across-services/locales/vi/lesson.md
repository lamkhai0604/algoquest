# Transaction (giao dịch) xuyên nhiều service (dịch vụ)

## [objectives] Mục tiêu học tập

- Giải thích vì sao một transaction trong một database (cơ sở dữ liệu) đơn giản, còn thay đổi qua nhiều service thì không.
- Mô tả điều xảy ra khi workflow qua nhiều service thất bại giữa chừng.
- Thiết kế saga (chuỗi transaction cục bộ có bước bù trừ): chuỗi local transaction (transaction trong database của một service) với các bước bù trừ, do orchestrator (service điều phối) hoặc các event điều khiển.
- Sắp xếp các bước của saga để khi thất bại cần ít bước bù trừ và không thực hiện quá sớm việc không thể hoàn tác.
- Lưu dữ liệu và publish message (thông điệp) đáng tin cậy bằng transactional outbox (bảng outbox ghi cùng transaction với dữ liệu), đồng thời giúp consumer (bên nhận và xử lý message) xử lý an toàn khi có bản trùng.
- Giải thích two-phase commit làm gì và vì sao ít dùng giữa các service.

### Thuật ngữ chính

- **Local transaction.** Transaction bên trong database riêng của một service: tất cả hoặc không có gì, như trong SD 4.
- **Distributed transaction (giao dịch trải trên nhiều database).** Một hành động nghiệp vụ thay đổi dữ liệu trong nhiều database thuộc các service khác nhau.
- **Partial failure (hỏng một phần).** Một số bước trong workflow thành công, số khác thất bại, khiến các service lệch trạng thái, như đã trừ tiền thẻ cho đơn hàng không thể giao.
- **Saga.** Workflow được chia thành chuỗi local transaction, mỗi service một bước. Nếu một bước thất bại, saga chạy **compensating transaction (transaction bù trừ)** cho các bước đã thành công, theo thứ tự ngược.
- **Compensating transaction.** Hành động mới bù lại tác động nghiệp vụ của bước trước, như hoàn tiền cho khoản đã thu hoặc giải phóng hàng đã giữ. Đây không phải rollback: bước trước đã được lưu và đã có thể được nhìn thấy.
- **Orchestration (điều phối tập trung) và choreography (các service tự phản ứng theo sự kiện).** Hai cách chạy saga. **Orchestrator** là một service yêu cầu từng bên tham gia làm bước tiếp theo và khởi động bù trừ; trong **choreography**, mỗi service phản ứng với event của các service khác, không có bộ điều khiển trung tâm.
- **Transactional outbox.** Bảng trong database riêng của service. Service lưu thay đổi nghiệp vụ và message cần gửi trong cùng local transaction; một **relay (tiến trình chuyển message từ outbox)** đọc bảng và publish message sau đó.
- **Two-phase commit (2PC) (cam kết hai pha).** Giao thức trong đó **coordinator (bên điều phối)** yêu cầu mọi bên tham gia chuẩn bị và khóa phần sẽ thay đổi, rồi yêu cầu tất cả commit hoặc tất cả abort.

## [problem-hook] Vấn đề mở đầu

Checkout của cửa hàng trước đây là một chương trình với một database. Đặt hàng sẽ lưu đơn, lấy hàng trong kho và ghi nhận thanh toán trong một transaction: nếu có gì thất bại thì không lưu gì cả.

Giờ cửa hàng tách thành Order service, Payment service và Inventory service, mỗi bên có database riêng. Một tối, Order service lưu đơn, Payment service thu tiền từ thẻ khách, rồi Inventory service báo sản phẩm cuối đã được bán trước đó một giây. Khách đã trả tiền cho món hàng sẽ không nhận được, và không có một “rollback” duy nhất nào sửa được, vì ba database đã lưu phần riêng của mình.

## [intuition] Cách hiểu trực quan

Hãy nghĩ đến việc tự đặt chuyến đi: chuyến bay, khách sạn và xe thuê, mỗi thứ từ một công ty khác nhau. Không có nút “đặt cả ba hoặc không đặt gì”. Bạn đặt chuyến bay, rồi khách sạn, sau đó mới biết không còn xe. Để trở lại trạng thái ban đầu, bạn hủy khách sạn rồi hủy chuyến bay. Các lần hủy là hành động mới: có thể mất một ngày, và hãng bay có thể giữ lại phí. Đó là saga với các bước bù trừ.

Người đi du lịch khéo sẽ đặt theo thứ tự tốt hơn: trước tiên là thứ dễ hết nhất hoặc thứ được hủy miễn phí. Họ cũng không gửi tin “mình sắp đi nghỉ!” cho bạn bè trước khi đặt xong mọi thứ, vì không thể thu hồi tin nhắn ấy.

**Liên hệ với SD 4 và SD 7.** Mỗi bước của saga là local transaction thông thường trong SD 4; các bước trao đổi qua queue (hàng đợi) của SD 7, vẫn có at-least-once delivery (giao ít nhất một lần) và idempotency key (khoá để lặp lại thao tác mà không đổi kết quả).

## [when-to-use] Khi nào nên dùng

- **Một local transaction:** khi dữ liệu cần thay đổi cùng nhau có thể nằm trong database của một service. Cách này luôn đơn giản hơn; hãy cân nhắc liệu các service có bị chia quá nhỏ không.
- **Saga:** một hành động nghiệp vụ phải thay đổi dữ liệu thuộc nhiều service, và có thể chấp nhận khoảng thời gian ngắn các service chưa thống nhất, như đơn hiển thị “đang chờ” trong vài giây.
- **Orchestration:** workflow có nhiều bước hoặc nhánh, và nhóm muốn có một nơi để xem và thay đổi, như checkout hoặc đặt chuyến đi.
- **Choreography:** hai hoặc ba service, mỗi bên phản ứng với một event, khi thêm coordinator trung tâm là quá mức cần thiết.
- **Transactional outbox:** khi service phải vừa lưu dữ liệu vừa publish message về dữ liệu đó; nếu không, crash giữa hai việc sẽ làm mất message hoặc gửi message về dữ liệu chưa từng được lưu.
- **Two-phase commit:** hiếm khi dùng giữa các service; đôi khi dùng bên trong một hệ thống mà mọi database đều hỗ trợ và round trip (lượt đi và về) ngắn.

## [template-code] Khung thiết kế

Bài này không có code. Dùng **khung thiết kế** sau cho workflow xuyên nhiều service:

```text
1. Can the data that must change together live in one database? Then use
   one local transaction and stop here.
2. List the steps, one local transaction per service, and for each step
   its compensation (cancel, release, refund). Mark steps that cannot be
   compensated (an email sent, goods shipped).
3. Order the steps: likely failures and cheap-to-undo steps first;
   steps that cannot be compensated last, after the last risky step.
4. Run it: an orchestrator (one place, easier to follow) or choreography
   (events, fewer moving parts for small flows).
5. Every message: save it with the data in an outbox, publish it with a
   relay, and make every step and compensation idempotent (one key per action).
6. While the saga runs, what does the user see? ("pending", then
   "confirmed" or "cancelled and refunded")
```

## [complexity] Chi phí và ước lượng

**Chi phí của một lần thất bại.** Nếu saga có k bước và bước j thất bại, j − 1 bước trước cần bù trừ theo thứ tự ngược. Với thứ tự “lưu đơn, thu tiền thẻ, giữ hàng”, lỗi giữ hàng cần 2 bước bù trừ: hoàn tiền rồi hủy đơn. Với “lưu đơn, giữ hàng, thu tiền thẻ”, cùng lỗi ấy chỉ cần 1 bước: hủy đơn, và khách chưa bị thu tiền.

**Tần suất xảy ra.** Nếu 1% trong 100 đơn mỗi giây thất bại ở bước giữ hàng, có 1 saga thất bại mỗi giây. Thu tiền trước khi giữ hàng nghĩa là một lần hoàn tiền mỗi giây, mỗi lần kèm phí và một khách không hài lòng; giữ hàng trước chỉ làm hủy đơn đang chờ.

**Thời gian chạy saga.** Các bước là local transaction nối với nhau bằng message. Giữ hàng mất khoảng 20 ms, ủy quyền thẻ mất 200 ms đến 2 giây khi hoạt động bình thường (ước lượng), xác nhận đơn mất khoảng 10 ms, cộng thêm vài mili giây cho mỗi message. Khách thấy “đã nhận đơn” ngay sau khi lưu đơn (khoảng 30 ms) và “đã xác nhận” sau một hoặc hai giây.

**Độ trễ và bản trùng của outbox.** Relay kiểm tra outbox mỗi 100 ms lấy được mỗi dòng mới trong khoảng 100 ms; publish và delivery cộng thêm độ trễ riêng của broker. Nếu relay ngừng chạy, message chờ trong outbox đến khi nó khởi động lại. Nếu relay crash sau khi publish nhưng trước khi đánh dấu dòng đã gửi, nó publish lại message: consumer phải idempotent (gửi lại nhiều lần vẫn giữ cùng trạng thái dự kiến), như trong SD 7.

| Cách làm | Tất cả hoặc không có gì? | Thời gian giữ lock (khóa) | Dùng được với provider bên ngoài | Trường hợp thường dùng |
| --- | --- | --- | --- | --- |
| Một local transaction | Có | Mili giây, một database | Không cần | Dữ liệu trong một service |
| Saga có bước bù trừ | Cuối cùng đạt được, qua bù trừ | Chỉ trong từng bước cục bộ | Có (hoàn tiền, hủy) | Workflow xuyên nhiều service |
| Two-phase commit | Có | Qua mọi round trip, đến khi coordinator quyết định | Chỉ khi provider hỗ trợ | Hiếm, trong một hệ thống |

## [common-mistakes] Lỗi thường gặp

- **Gọi lần lượt mọi service rồi hy vọng.** Nếu lời gọi thứ ba thất bại hoặc timeout (hết thời gian chờ), hai lời gọi đầu đã thay đổi dữ liệu và không có gì hoàn tác chúng.
- **Bước bù trừ không idempotent.** Message hoàn tiền được giao hai lần không được hoàn tiền hai lần; mỗi hành động có key riêng tạo từ order id, như `order123-authorize` cho ủy quyền và `order123-void` để hủy ủy quyền. Retry (thử lại) cùng hành động dùng lại key; bù trừ là hành động khác với key khác.
- **Làm việc không thể hoàn tác quá sớm.** Email “đơn đã được xác nhận” trước bước giữ hàng có thể biến thành “xin lỗi, chưa xác nhận được”. Đặt những bước ấy cuối cùng.
- **Lưu dữ liệu rồi publish trong hai bước riêng.** Crash giữa hai bước để lại đơn hàng mà không ai biết. Dùng outbox.
- **Cho rằng timeout nghĩa là thất bại.** Lời gọi thanh toán timeout có thể đã thu tiền thẻ. Hỏi lại provider với cùng idempotency key hoặc kiểm tra trạng thái trước khi bù trừ.

## [edge-cases] Trường hợp đặc biệt

- **Bù trừ thất bại.** Chính lời gọi hoàn tiền cũng có thể lỗi. Các bước bù trừ được retry với backoff (SD 7) đến khi thành công; bước liên tục thất bại đi vào dead-letter queue (hàng đợi cho message lỗi nhiều lần) để người xử lý.
- **Người dùng hành động trong lúc saga chạy.** Khách hủy khi đơn vẫn đang được xác nhận. Orchestrator phải xử lý hủy như một bước khác, không phải thay đổi riêng chạy đua với saga.
- **Người khác thấy trạng thái trung gian.** Hàng đã giữ không còn sẵn cho người khác trong lúc saga chạy, dù sau đó đơn bị hủy; phần giữ hàng nên hết hạn nếu saga bị kẹt. Hết hạn và sử dụng phần giữ hàng phải là các local transaction cạnh tranh trên dòng reservation trong Inventory service: sử dụng chỉ thành công khi còn hiệu lực, hết hạn chỉ thành công khi chưa được dùng, nên chính xác một bên thắng.
- **Bước không thể bù trừ.** Hàng đã giao không thể “chưa giao”; saga phải hoàn tất mọi bước có rủi ro trước những bước ấy, sau đó chỉ có thể tiến tiếp.

### Mở rộng (không bắt buộc): two-phase commit và exactly-once dưới dạng hiệu ứng

Trong **two-phase commit**, coordinator trước tiên gửi “prepare”: mỗi bên tham gia thực hiện công việc, khóa các dòng sẽ thay đổi, ghi đủ thông tin vào log (dòng ghi sự kiện) để hoàn tất về sau, và biểu quyết có hoặc không. Nếu tất cả đồng ý, coordinator ghi “commit” vào log rồi yêu cầu mọi bên commit; nếu không thì yêu cầu tất cả abort. Vấn đề là chờ đợi: các bên giữ lock đến khi biết quyết định; nếu coordinator crash sau “prepare”, chúng bị chặn đến khi nó trở lại. Database như PostgreSQL hỗ trợ (`PREPARE TRANSACTION`), nhưng provider ngoài như mạng thẻ không tham gia, nên cách này ít phù hợp giữa các service.

**Exactly-once** delivery không thể đạt được qua mạng có thể làm mất câu trả lời: bên gửi không phân biệt được phản hồi bị mất với phản hồi chậm, nên phải chấp nhận rủi ro gửi hai lần hoặc không bao giờ giao. Thay vào đó, hệ thống đạt **exactly-once effect (hiệu ứng như chỉ xử lý một lần)**: at-least-once delivery cộng xử lý idempotent, nên message lặp lại không thay đổi gì ở lần thứ hai.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** Cửa hàng nhận 100 đơn mỗi giây lúc cao điểm. Đặt đơn phải giữ hàng (Inventory service, khoảng 20 ms), ủy quyền thẻ (Payment service, qua card provider trả lời trong 2 s khi bình thường; nếu lời gọi timeout, tra trạng thái bằng cùng key trả lời trong 500 ms), đánh dấu phần giữ hàng đã được dùng (Inventory, khoảng 20 ms), đánh dấu đơn đã xác nhận (Order service, khoảng 10 ms) và gửi email xác nhận. Khoảng 1% đơn thất bại ở bước giữ hàng và 2% ở bước thẻ. Message giữa các service mất tối đa 10 ms. Khách phải thấy phản hồi đầu trong 300 ms và, khi các service cùng card provider hoạt động bình thường, biết kết quả cuối trong 5 giây. Card provider nhận idempotency key và hỗ trợ “void authorization” để hủy ủy quyền. Thiết kế workflow.

**Lời giải:**

1. **Thứ tự các bước.** Lưu đơn “pending” → giữ hàng → ủy quyền thẻ → đánh dấu phần giữ hàng đã dùng và xác nhận đơn → gửi email. Giữ hàng trước thanh toán vì khi giữ hàng thất bại không cần hoàn tiền; email cuối cùng vì không thể thu hồi.
2. **Phản hồi đầu.** Order service lưu đơn đang chờ và một dòng outbox trong cùng local transaction (khoảng 30 ms), rồi trả lời “đã nhận đơn”, trong giới hạn 300 ms.
3. **Orchestration.** Order service chạy saga: relay publish “giữ hàng cho đơn 123”; thành công thì yêu cầu Payment service ủy quyền; thành công thì xác nhận đơn, sau đó mới đưa email vào queue. Mỗi hành động mang idempotency key riêng tạo từ order id, như `order123-reserve`, `order123-authorize` và, nếu cần, `order123-void`.
4. **Thất bại.** Giữ hàng thất bại (1 mỗi giây lúc cao điểm): hủy đơn, không có gì khác cần hoàn tác. Thẻ thất bại (2 mỗi giây): giải phóng hàng rồi hủy đơn, theo thứ tự ngược. Lời gọi thẻ timeout được hỏi lại với cùng key trước khi bù trừ bất cứ thứ gì.
5. **Thời gian.** Trên đường đi bình thường chậm nhất: 30 (lưu) + 20 (hàng) + 2,000 (thẻ) + 500 (một lần tra trạng thái sau timeout) + 20 (dùng phần giữ hàng) + 10 (xác nhận) + 4 message × 10 = 2,620 ms, khoảng 2.6 giây, trong 5. Trang hiển thị “pending” đến lúc đó. Bù trừ sau thất bại có thể xong muộn hơn; khách được báo “đơn thất bại” ngay khi biết lỗi.
6. **Saga bị kẹt.** Phần giữ hàng không được dùng trong 10 phút sẽ hết hạn và trả hàng về kho, nên saga bị treo không giấu hàng mãi. Sử dụng và hết hạn là các local transaction cạnh tranh trên dòng reservation: chính xác một bên thắng. Nếu saga bị treo chạy tiếp và Inventory báo reservation đã hết hạn, nó hủy ủy quyền (`order123-void`) rồi hủy đơn. Message đến muộn hoặc lặp lại cho reservation ấy thấy đã hết hạn và không đổi gì.

**Kết quả:** Saga do Order service điều phối: đơn đang chờ kèm outbox, giữ hàng, ủy quyền thẻ, xác nhận rồi email. Mỗi bước là local transaction với idempotency key; thất bại được bù trừ theo thứ tự ngược (giải phóng hàng, hủy ủy quyền, hủy đơn), và bước duy nhất không thể hoàn tác nằm cuối cùng.
