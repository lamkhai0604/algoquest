# API (giao diện lập trình ứng dụng) và ranh giới service (dịch vụ)

## [objectives] Mục tiêu học tập

- Thiết kế REST (phong cách thiết kế API theo tài nguyên) API nhỏ: đặt tên resource (tài nguyên), chọn HTTP method (phương thức HTTP) và trả status code (mã trạng thái) phù hợp.
- Phân biệt safe method (phương thức an toàn, chỉ đọc) và idempotent (gửi lại nhiều lần vẫn giữ cùng trạng thái dự kiến) HTTP method với các phương thức khác, giải thích vì sao quan trọng khi gửi lại request.
- Phân trang danh sách dài bằng offset (vị trí trong dãy dữ liệu (số mục đã đi qua)) hoặc cursor (con trỏ đánh dấu vị trí trang trước), giải thích vì sao cursor giữ được tính đúng và tốc độ.
- Thay đổi API mà không làm hỏng ứng dụng vẫn dùng phiên bản cũ.
- Chọn polling (hỏi lại định kỳ), long polling (hỏi và chờ đến khi có thay đổi), server-sent events (server đẩy sự kiện qua một kết nối mở) hoặc WebSocket (kết nối mở hai chiều) cho cập nhật trực tiếp, và ước lượng chi phí polling.
- Quyết định khi nào tách một service thành nhiều service, ước lượng độ trễ và sự cố mà call chain (chuỗi lời gọi giữa các service) giữa các service thêm vào.

### Thuật ngữ chính

- **API (application programming interface).** Cách đã thống nhất để một chương trình yêu cầu chương trình khác làm việc: request nào tồn tại, nhận gì và trả gì. API là **contract (hợp đồng giao tiếp giữa hai bên)**: bên gọi phụ thuộc vào nó, không phải cách bên kia hoạt động bên trong.
- **Endpoint (điểm cuối nhận request).** Một địa chỉ nhận request, chẳng hạn `GET /orders/123`.
- **REST.** Phong cách phổ biến cho web API: dữ liệu tổ chức thành **resource** có địa chỉ (URL), chẳng hạn `/orders/123`, và được thay đổi bằng HTTP method chuẩn.
- **HTTP method.** Động từ của request: `GET` đọc, `POST` tạo hoặc bắt đầu hành động, `PUT` thay cả resource, `PATCH` sửa một phần, `DELETE` xóa.
- **Status code.** Số có ba chữ số trong mỗi response cho biết request diễn ra thế nào: 2xx thành công, 4xx bên gọi mắc lỗi, 5xx server (máy chủ) thất bại.
- **Safe method.** Phương thức chỉ đọc, không thay đổi gì trên server: `GET`, `HEAD`, `OPTIONS`.
- **Idempotent method.** Phương thức mà gửi cùng request hai lần để lại cùng trạng thái server như gửi một lần: `GET`, `PUT`, `DELETE` và các safe method. `POST` và `PATCH` không được bảo đảm như vậy.
- **Pagination (phân trang).** Trả danh sách dài theo trang, chẳng hạn 20 đơn hàng một lần. **Offset** nói bỏ qua bao nhiêu mục; **cursor** nói trang trước kết thúc ở đâu.
- **API version (phiên bản API).** Nhãn, chẳng hạn `/v1/` trong đường dẫn, giúp ứng dụng cũ tiếp tục chạy trong khi phiên bản mới thay contract. Thay đổi **backward-compatible (tương thích ngược)** giữ bên gọi cũ hoạt động.
- **JSON (định dạng dữ liệu dạng văn bản).** Định dạng dữ liệu văn bản, chẳng hạn `{"id": 123, "status": "cooking"}`, được phần lớn web API dùng.
- **gRPC (cách gọi giữa các service bằng thông điệp có kiểu).** Cách các service gọi nhau bằng thông điệp có kiểu trong định dạng nhị phân gọn (Protocol Buffers (định dạng nhị phân gọn cho thông điệp)) qua HTTP/2.
- **Polling, long polling, server-sent events (SSE), WebSocket.** Bốn cách lấy cập nhật: hỏi lại theo bộ hẹn giờ; hỏi rồi để server giữ câu trả lời đến khi có thay đổi; giữ một kết nối mở để server gửi sự kiện; giữ một kết nối mở để cả hai bên gửi thông điệp.
- **Monolith (ứng dụng nguyên khối) và service.** **Monolith** là một chương trình làm mọi việc; **service** (thường gọi là **microservice (dịch vụ nhỏ)**) là các chương trình nhỏ hơn, mỗi chương trình sở hữu một phần nghiệp vụ và dữ liệu, gọi nhau qua mạng.
- **API gateway (cổng API).** Điểm vào duy nhất trước nhiều service, định tuyến mỗi request đến service đúng và làm việc chung như kiểm tra đăng nhập.

## [problem-hook] Vấn đề mở đầu

Ứng dụng giao đồ ăn có một chương trình server và một database (cơ sở dữ liệu). Ứng dụng điện thoại hiển thị lịch sử đơn hàng cho mỗi khách và màn hình trực tiếp khi món đang được giao. Hệ thống hoạt động, nhưng ba vấn đề liên tục xuất hiện.

Lịch sử đôi khi hiện cùng đơn hàng hai lần khi khách cuộn xuống. Màn hình trực tiếp hỏi server "có tin mới không?" mỗi 5 giây; với 100,000 khách đang chờ vào giờ ăn tối, phần lớn công việc server là trả "không đổi". Nhóm cũng muốn tách chương trình thành Orders service, Payments service và Drivers service nhưng chưa ai nói được chi phí.

Mỗi vấn đề là câu hỏi về ranh giới giữa hai chương trình: một bên được hỏi gì, bên kia cam kết gì.

## [intuition] Cách hiểu trực quan

Hãy nghĩ về nhà hàng. **Thực đơn** là API: liệt kê món bạn được đặt và sẽ nhận. Bạn không vào bếp, không biết dùng bếp gas hay điện và không cần quan tâm. Vì khách chỉ phụ thuộc thực đơn, bếp có thể đổi bếp nấu, đầu bếp hoặc nhà cung cấp miễn món trên thực đơn không đổi. Nhưng in thực đơn mới bỏ món sẽ khiến khách đến vì món đó thất vọng: đây là thay đổi phá vỡ API.

Giờ nghĩ cách biết món đã xong. Bạn có thể đến quầy mỗi năm phút để hỏi (polling). Bạn có thể chờ ở quầy đến khi xong (long polling). Hoặc nhà hàng đưa thiết bị báo rung khi món xong (server đẩy tin). Thiết bị này giảm việc cho mọi người khi nhiều người cùng chờ.

**Liên hệ với SD 1.** Mỗi API call là request của SD 1: DNS (hệ thống tên miền), kết nối, công việc server và database. Tách một service thành nhiều service thêm các chuyến đi như vậy, mỗi lần gọi giữa service thêm một chuyến.

## [when-to-use] Khi nào nên dùng

- **REST với JSON:** lựa chọn mặc định cho public API, ứng dụng và trình duyệt gọi backend. Dễ đọc, kiểm tra và cache (bộ nhớ đệm).
- **gRPC:** lời gọi giữa các service của bạn khi tốc độ, thông điệp nhỏ và contract có kiểu chặt chẽ quan trọng. Trình duyệt cần lớp thêm (gRPC-Web), nên public API thường giữ REST.
- **Cursor pagination:** danh sách dài thay đổi khi người dùng phân trang, chẳng hạn feed và lịch sử đơn. **Offset pagination:** danh sách nhỏ ít đổi, hoặc cần nhảy đến trang 37.
- **Polling:** cập nhật hiếm hoặc chấp nhận trễ vài giây, và ít client (máy khách (chương trình gửi yêu cầu)) chờ cùng lúc.
- **Long polling:** cập nhật gần thời gian thực khi chỉ có thể dùng HTTP request (yêu cầu HTTP) thông thường.
- **Server-sent events:** server gửi cập nhật và client chỉ nghe, chẳng hạn trạng thái đơn, thông báo hoặc tỷ số trực tiếp.
- **WebSocket:** cả hai bên gửi thường xuyên, như chat, trò chơi nhiều người hoặc chỉnh sửa chung.
- **Nhiều service:** các nhóm cần thay đổi và deploy từng phần độc lập, hoặc tải giữa các phần rất khác nhau. **Một service:** nhóm nhỏ, sản phẩm mới hoặc các phần luôn đổi cùng nhau.

## [template-code] Mẫu thiết kế

Bài này không có mã chương trình. Dùng **mẫu thiết kế** cho API:

```text
1. Resource: liệt kê danh từ (orders, restaurants, drivers).
   -> /orders, /orders/{id}, /customers/{id}/orders
2. Method: GET để đọc, POST để tạo, PUT hoặc PATCH để sửa, DELETE để xóa.
   Gửi lại có an toàn không? GET, PUT và DELETE là idempotent; POST thì không.
3. Response: 200, 201 hoặc 204 khi thành công; 400, 401, 403, 404, 409 hoặc 429
   cho lỗi bên gọi; 500 hoặc 503 khi server thất bại.
4. Danh sách: phân trang bằng cursor -> GET /customers/7/orders?limit (giới hạn)=20&after=<cursor>
5. Thay đổi: chỉ thêm trường tùy chọn; thứ làm hỏng ứng dụng cũ -> /v2/
6. Cập nhật trực tiếp: polling, long polling, SSE hay WebSocket?
   -> ước lượng request mỗi giây nếu client dùng polling.
7. Gọi service: vẽ chuỗi. Các lời gọi có thể chạy song song không?
   Đặt timeout (hết thời gian chờ) cho mỗi lời gọi và quyết định hiển thị gì nếu một lời gọi thất bại.
```

**Status code thường dùng nhất:**

| Mã | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| 200 OK | Thành công; body có kết quả | `GET /orders/123` |
| 201 Created | Resource mới được tạo | `POST /orders` |
| 204 No Content | Thành công; không có gì trả về | `DELETE /orders/123/coupon` |
| 400 Bad Request | Request không hợp lệ | Đơn không có địa chỉ giao |
| 401 Unauthorized | Chưa đăng nhập hoặc thông tin đăng nhập không hợp lệ | Token (mã thông báo) thiếu hoặc hết hạn |
| 403 Forbidden | Đã đăng nhập nhưng không được phép | Xem đơn của khách khác |
| 404 Not Found | Không có resource đó | `GET /orders/999999` |
| 409 Conflict | Xung đột với trạng thái hiện tại | Giành ghế vừa bị lấy (SD 4) |
| 429 Too Many Requests | Bên gọi gửi quá nhiều request | Client vượt rate limit |
| 500 Internal Server Error | Server thất bại bất ngờ | Lỗi chương trình |
| 503 Service Unavailable | Server hiện không xử lý được | Quá tải hoặc bảo trì |

## [complexity] Chi phí và giới hạn

**Chi phí polling.** 100,000 khách xem màn hình trực tiếp, mỗi ứng dụng hỏi mỗi 5 giây:

1. Request mỗi giây: 100,000 ÷ 5 = 20,000.
2. Giao hàng mất khoảng 30 phút, nên mỗi ứng dụng hỏi 30 × 60 ÷ 5 = 360 lần.
3. Trạng thái đổi khoảng 6 lần (đã nhận, đang nấu, sẵn sàng, đã lấy, gần đến, đã giao). Vậy 354 trong 360 câu trả lời, khoảng 98%, nói "không đổi".

Với server-sent events, cùng 100,000 khách giữ 100,000 kết nối mở và server chỉ gửi 6 thay đổi: 100,000 × 6 ÷ 1,800 s ≈ 333 sự kiện mỗi giây thay vì 20,000 request. Chi phí chuyển từ request sang kết nối mở mà server phải giữ được.

**Chi phí pagination.** `OFFSET 10000 LIMIT 20` khiến database đi qua 10,000 row để trả 20, nên trang sau chậm hơn. Cursor như "đơn cũ hơn đơn cuối đã hiện" giữ time và id của đơn đó, trở thành `WHERE customer_id = 7 AND (created_at, id) < (<last time>, <last id>) ORDER BY created_at DESC, id DESC LIMIT 20`. Id phân định khi trùng time: hai đơn cùng mili giây được xếp theo id nên không đơn nào bị bỏ. Với index (chỉ mục) `(customer_id, created_at, id)` từ SD 4, mỗi trang đọc vài trang index và 20 row dù cuộn sâu đến đâu.

**Chi phí call chain.**

- **Latency (độ trễ) cộng dồn khi gọi lần lượt.** Nếu trang đơn gọi Restaurants (40 ms), rồi Drivers (30 ms), rồi Payments (50 ms), tổng là 40 + 30 + 50 = 120 ms. Nếu ba lời gọi không phụ thuộc nhau và chạy song song, thời gian bằng lời gọi chậm nhất: 50 ms.
- **Sự cố nhân lên.** Nếu request cần 5 service trong chuỗi, mỗi service khả dụng 99.9% thời gian và lỗi độc lập nhau, request hoạt động khoảng 0.999⁵ ≈ 99.5% thời gian. Trong 30 ngày, 0.1% là khoảng 43 phút lỗi, còn 0.5% là khoảng 3.6 giờ.

## [common-mistakes] Lỗi thường gặp

- **Động từ trong URL.** `POST /createOrder` và `GET /getOrder?id=123` che khuất resource. Dùng `POST /orders` và `GET /orders/123`.
- **200 OK cho mọi response.** Body nói `{"error": "not found"}` với status 200 gây nhầm cho client, cache và monitoring. Dùng status code phù hợp.
- **Gửi lại POST mù quáng.** Nếu mất response, gửi lại `POST /orders` có thể tạo đơn thứ hai. Gửi lại `GET`, `PUT` hoặc `DELETE` an toàn; để `POST` gửi lại an toàn cần idempotency key (SD 7).
- **Xóa hoặc đổi tên trường.** Ứng dụng điện thoại cập nhật chậm; một số người giữ bản cũ hàng tháng. Thêm trường mới, giữ trường cũ, và đặt thay đổi phá vỡ vào version (số phiên bản) mới.
- **Tách service quá sớm.** Nhóm nhỏ với nhiều service sẽ dành thời gian cho lời gọi mạng, deploy và sự cố giữa service thay vì sản phẩm.
- **Không có timeout cho lời gọi service khác.** Một service chậm giữ mọi request chờ nó, khiến chậm lan sang bên gọi.

## [edge-cases] Trường hợp đặc biệt

- **Mất response, không phải request.** Client không biết server đã làm việc chưa. Với method idempotent, gửi lại không gây hại; với `POST` có thể không vậy.
- **Gửi `DELETE` hai lần.** Lần thứ hai đơn đã hết, nên có thể trả 404 thay vì 204. Method vẫn idempotent: trạng thái server sau hai lần xóa giống sau một lần.
- **Danh sách đổi khi phân trang.** Với offset, mục mới ở đầu đẩy mọi mục xuống một vị trí khiến trang sau lặp một mục; xóa mục khiến bỏ sót một mục. Cursor xác định mục cuối đã thấy, nên mục mới không đẩy trang sau; chúng hiện khi refresh. Nhưng cursor không đóng băng danh sách: đơn sửa khiến nó vượt qua cursor vẫn có thể bị bỏ sót.
- **Kết nối dài bị ngắt.** Điện thoại đổi mạng hoặc mất sóng. Client SSE và WebSocket phải kết nối lại và lấy các sự kiện đã lỡ. Trình duyệt tự kết nối lại SSE.
- **Một service trong chuỗi chậm.** Với timeout và fallback (phương án dự phòng), trang vẫn có thể hiện phần đã có, chẳng hạn đơn hàng không có vị trí tài xế, thay vì hỏng hoàn toàn.

### Phần mở rộng (tùy chọn): API gateway và thay đổi backward-compatible

**API gateway** là điểm vào duy nhất trước mọi service. Ứng dụng chỉ gọi gateway; gateway kiểm tra đăng nhập một lần, áp dụng rate limit và định tuyến `/orders` đến Orders service, `/drivers` đến Drivers service. Ứng dụng không cần biết có bao nhiêu service nên nhóm có thể tách hoặc gộp về sau mà không đổi ứng dụng.

Thay đổi **backward-compatible** khi mọi client cũ vẫn hoạt động: thêm trường tùy chọn vào response, thêm tham số tùy chọn hoặc endpoint mới. Xóa trường, đổi tên, đổi kiểu hoặc bắt buộc tham số vốn tùy chọn sẽ làm hỏng client cũ. Những thay đổi đó vào version mới, chẳng hạn `/v2/orders`, và version cũ tiếp tục chạy đến khi đủ ít client còn dùng.

## [worked-example] Ví dụ có lời giải

**Bài toán:** Thiết kế API cho các màn hình đơn của ứng dụng giao đồ ăn. Khách xem đơn cũ (có người có hàng trăm), đặt đơn mới và xem trạng thái trực tiếp khi món đang đến. Vào bữa tối, 100,000 khách xem cùng lúc. Trang đơn hiện đơn, nhà hàng và tài xế. Nhóm dự định có Orders service, Restaurants service và Drivers service.

**Lời giải:**

1. **Resource và method.**
   - `GET /customers/{id}/orders`: lịch sử đơn.
   - `POST /orders`: đặt đơn; trả `201 Created` với địa chỉ của đơn mới.
   - `GET /orders/{id}`: một đơn.
   - `PATCH /orders/{id}`: sửa ghi chú giao khi còn nấu; trả `409 Conflict` nếu đơn đã rời nhà hàng.
2. **Lịch sử đơn.** Dùng cursor: `GET /customers/7/orders?limit=20&after=<cursor>`, chứa time và id của đơn cuối đã thấy. Đơn xếp theo time rồi id để đơn cùng time không lặp hoặc mất. Đơn mới ở đầu không đẩy trang sau và hiện khi khách refresh; mỗi trang đọc 20 row qua index `(customer_id, created_at, id)`.
3. **Trạng thái trực tiếp.** Polling mỗi 5 giây tốn 100,000 ÷ 5 = 20,000 request mỗi giây, khoảng 98% trả "không đổi". Khách chỉ nghe không gửi, nên dùng server-sent events: khoảng 333 sự kiện mỗi giây và 100,000 kết nối mở. WebSocket cũng hoạt động nhưng màn hình này không cần gửi từ điện thoại lên server.
4. **Trang đơn qua các service.** Gateway gửi `GET /orders/{id}` đến Orders service, cần nhà hàng (40 ms) và tài xế (30 ms). Hai lời gọi không phụ thuộc nên chạy song song: khoảng 40 ms thay vì 70 ms. Mỗi lời gọi có timeout. Nếu Drivers không trả kịp, trang hiện đơn và nhà hàng với "không có vị trí tài xế" thay vì lỗi.
5. **Thay đổi sau này.** Ứng dụng thêm trường như giờ đến dự kiến mà không cần version mới. Đổi tên `status` làm hỏng ứng dụng đã cài nên sẽ vào `/v2/`.

**Đáp án:** REST API có resource cho đơn của khách, cursor pagination cho lịch sử, server-sent events cho trạng thái và API gateway trước ba service. Trang gọi Restaurants và Drivers song song, mỗi bên có timeout, nên Drivers chậm khiến trang thiếu thông tin thay vì hỏng.
