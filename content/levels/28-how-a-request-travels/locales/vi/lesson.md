# Hành trình của một request

## [objectives] Mục tiêu bài học

- Theo dõi từng bước khi browser (trình duyệt) gửi request (yêu cầu) đến server (máy chủ) để tải trang web rồi nhận kết quả trở lại.
- Xác định thời gian nằm ở đâu: tìm server, mở kết nối, truyền dữ liệu qua mạng, xử lý trên server và truy vấn database.
- Phân biệt latency (độ trễ của một request) với throughput (số request hệ thống xử lý được mỗi giây).
- Ước lượng tải bằng các con số gần đúng và chỉ ra đâu là giả định.
- Biết nên kiểm tra bước nào trước khi một trang web chạy chậm.

### Thuật ngữ chính (Key terms)

- **Client và server.** Client (máy khách) là chương trình gửi yêu cầu, như browser hoặc ứng dụng điện thoại. Server (máy chủ) là máy tính trả lời. Hai bên trao đổi dữ liệu qua mạng.
- **IP address (địa chỉ IP).** Dãy số xác định một máy tính trên internet, giống địa chỉ nhà, ví dụ 142.250.72.14.
- **DNS (Domain Name System, hệ thống tên miền).** Giống danh bạ của internet: DNS đổi tên như shop.example thành IP address của server. **DNS resolver (máy chủ phân giải DNS)** giúp tra cứu địa chỉ, thường do nhà cung cấp internet vận hành. DNS là bước tra cứu trước request, không phải trạm mà request đi xuyên qua.
- **Round trip (lượt đi và về).** Một thông điệp đi đến phía bên kia rồi nhận câu trả lời trở lại. Thời gian đó gọi là round-trip time (RTT, thời gian khứ hồi), phụ thuộc nhiều vào khoảng cách.
- **TCP connection (kết nối TCP).** Kết nối giúp client và server trao đổi dữ liệu đáng tin cậy, đúng thứ tự và không thiếu phần. Mở kết nối tốn một round trip.
- **TLS.** Cơ chế mã hóa đứng sau https:// và biểu tượng ổ khóa trên browser. Thiết lập TLS cần thêm một round trip với TLS 1.3 hoặc hai round trips với TLS 1.2 cũ hơn.
- **HTTP request (yêu cầu HTTP).** Thông điệp browser gửi đi, gồm method (phương thức, như GET để đọc hoặc POST để gửi dữ liệu), path (đường dẫn, như /products/42) và headers (các dòng thông tin bổ sung, chẳng hạn ngôn ngữ người dùng muốn xem).
- **Cookie.** Một phần dữ liệu nhỏ mà server yêu cầu browser lưu lại và gửi kèm trong headers của những request sau, ví dụ để ghi nhớ người dùng đã đăng nhập.
- **Database (cơ sở dữ liệu).** Chương trình lưu dữ liệu trên ổ đĩa và trả lời truy vấn, chẳng hạn tìm sản phẩm có id 42.
- **Cache (bộ nhớ đệm).** Bản sao dữ liệu được giữ ở nơi truy cập nhanh, để không phải lấy lại từ nguồn gốc chậm hơn.
- **CDN (content delivery network, mạng phân phối nội dung).** Nhiều server ở các thành phố trên thế giới giữ bản sao tệp như hình ảnh. Người dùng tải tệp từ một thành phố gần mình. Mỗi server đó gọi là **edge server (máy chủ biên)**.
- **Bottleneck (điểm nghẽn).** Bước chậm nhất hoặc bận nhất, giới hạn tốc độ của cả hệ thống, giống cổ chai hẹp.
- **Index (chỉ mục).** Cấu trúc giúp database tìm dòng dữ liệu nhanh hơn, giống mục tra cứu ở cuối sách. Truy vấn trên cột không có index có thể phải đọc mọi dòng. Level 31 sẽ học kỹ hơn.
- **Latency (độ trễ).** Tổng thời gian một request cần để hoàn thành, kể cả lúc chờ trong hàng đợi.
- **Throughput (thông lượng).** Số request hệ thống hoàn thành trong mỗi giây.
- **Đơn vị thời gian.** 1 second (giây) = 1,000 milliseconds (ms, mili giây). 1 ms = 1,000 microseconds (µs, micro giây). 1 µs = 1,000 nanoseconds (ns, nano giây). Vậy 1 ms bằng một triệu ns.

## [problem-hook] Tình huống mở đầu

Một cửa hàng trực tuyến nhỏ hoạt động tốt khi có 200 khách vào giờ trưa. Đến ngày giảm giá, 20,000 người truy cập trong mười phút và trang sản phẩm mất tám giây mới tải xong. Cả nhóm đoán ngay: “Server quá yếu”. Nhưng trước khi mua server mạnh hơn, họ cần biết tám giây đó đã được dùng ở đâu.

Mỗi lần tải trang là một chuỗi bước. Bước nào cũng thêm thời gian và đều có thể gặp lỗi. Khi thiết kế hệ thống, trước tiên hãy vẽ chuỗi bước ấy và ước lượng thời gian của từng bước.

## [intuition] Hiểu bằng trực giác

Hãy tưởng tượng gọi món ở một nhà hàng đông khách. Bạn nói món muốn gọi với nhân viên phục vụ (request). Nhân viên đi vào bếp (network, mạng). Đầu bếp kiểm tra tủ lạnh (cache) hoặc lấy nguyên liệu từ kho (database), rồi món ăn được mang ra. Bạn có thể phải chờ lâu vì đường đi, hàng đợi trong bếp hoặc kho nguyên liệu quá xa. Thêm một nhân viên phục vụ không giúp ích nếu kho nguyên liệu mới là bottleneck.

Latency là thời gian bạn chờ một món ăn, kể cả lúc phiếu gọi món còn nằm trong hàng đợi. Throughput là số món nhà hàng phục vụ được mỗi giờ. Khi nhà hàng vắng khách, thêm nhân viên chủ yếu giúp tăng throughput. Khi đơn hàng ùn lại, thêm nhân viên hoặc đầu bếp cũng có thể giảm thời gian chờ, tức giảm latency.

**Liên hệ với Level 1.** Big-O cho biết lượng công việc của thuật toán tăng ra sao khi đầu vào lớn lên. System design (thiết kế hệ thống) đặt câu hỏi tương tự cho toàn bộ hệ thống: khi số người dùng tăng, bước nào tăng tải hoặc tăng thời gian nhanh nhất? Đó là nơi nên kiểm tra trước.

## [when-to-use] Khi nào nên dùng?

Hãy áp dụng cách suy nghĩ này khi người dùng nói “trang chạy chậm” hoặc “hệ thống bị lỗi khi đông người”:

- Ghi lại các bước của một request, từ thiết bị người dùng đến nơi lưu dữ liệu rồi quay về.
- Đánh dấu mọi bước request phải di chuyển hoặc chờ đợi.
- Ước lượng thời gian từng bước trước khi quyết định sửa chỗ nào.

## [template-code] Mẫu thiết kế

Level này không có code. Hãy dùng **design template (mẫu thiết kế)** sau cho một request bất kỳ. Đây là hình dung đơn giản: hệ thống thực tế có thể bỏ qua một số bước, thêm bước khác hoặc gửi câu trả lời về bằng đường khác.

```text
Setup (before the request, often reused later):
  DNS lookup: name -> IP address
  Open a connection: TCP, then TLS for https

Request and response:
  Client -> (load balancer) -> server -> (cache) -> (database)
  The answer comes back to the client.
  Steps in brackets appear only when the design has them.

For each step, write:
  1. What happens here?
  2. Rough time it adds (latency).
  3. What is the limit (requests per second, connections, memory)?
  4. What fails first when load grows?
```

## [complexity] Chi phí và giới hạn

Trong system design, “complexity” ở đây có nghĩa là **chi phí và giới hạn**. Với mỗi thành phần, hãy ghi:

- **Latency added (độ trễ tăng thêm):** thời gian request ở bước này, kể cả chờ đợi.
- **Throughput limit (giới hạn thông lượng):** số request tối đa bước này xử lý được mỗi giây.
- **Storage (lưu trữ):** dữ liệu cần giữ và thời gian giữ.
- **First failure (điểm lỗi đầu tiên):** điều gì hỏng trước khi tải tăng gấp đôi.

Các số gần đúng dưới đây giúp ước lượng theo bậc độ lớn. Mỗi hàng chậm hơn hàng trên, nhưng mức chênh lệch không giống nhau:

| Thao tác | Thời gian gần đúng |
| --- | --- |
| Đọc từ memory (bộ nhớ) | 100 ns |
| Đọc từ SSD (ổ lưu trữ thể rắn) | 100 µs (= 100,000 ns) |
| Một round trip trong cùng data center (trung tâm dữ liệu) | 0.5 ms (= 500 µs) |
| Một round trip xuyên đại dương | 100–150 ms |

So sánh các hàng: đọc SSD chậm hơn đọc memory khoảng 1,000 lần; một round trip trong data center chậm hơn đọc SSD khoảng 5 lần; còn round trip xuyên đại dương chậm hơn trong data center khoảng 200 đến 300 lần. Từ memory đến round trip xuyên đại dương là chênh lệch khoảng một triệu lần. Khoảng cách và thời gian chờ thường ảnh hưởng nhiều hơn tốc độ chạy code.

**Mẹo ước lượng.** Một ngày có 24 × 60 × 60 = 86,400 giây. Ta làm tròn thành 10⁵ (100,000) để phép chia dễ hơn; kết quả vẫn có độ lớn phù hợp.

Ví dụ: 10 million (10 triệu) người dùng, mỗi người gửi 10 requests mỗi ngày.

1. Viết số dưới dạng lũy thừa của 10: 10 million = 10⁷.
2. Requests mỗi ngày: 10⁷ × 10 = 10⁸.
3. Requests mỗi giây: 10⁸ ÷ 10⁵. Khi chia hai lũy thừa của 10, ta trừ số mũ: 8 − 5 = 3. Kết quả là 10³, tức trung bình khoảng 1,000 requests mỗi giây.

Peak traffic (lưu lượng cao điểm) thường lớn hơn mức trung bình nhiều lần. Vì vậy, hãy chuẩn bị cho giờ cao điểm, không chỉ mức trung bình.

## [common-mistakes] Lỗi thường gặp

- **Đoán bottleneck.** Hãy đo hoặc ước lượng từng bước trước. Database query (truy vấn cơ sở dữ liệu) chậm là vấn đề khác với network chậm.
- **Nhầm latency với throughput.** Server có thể trả lời từng request rất nhanh nhưng vẫn xử lý được quá ít request mỗi giây.
- **Quên round trips.** Kết nối mới cần một đến ba round trips trước khi byte đầu tiên của trang được truyền. Dùng lại kết nối đang mở giúp tránh chi phí này.
- **Chỉ tính tải trung bình.** Hệ thống thường gặp vấn đề ở giờ cao điểm, không phải lúc tải trung bình.
- **Bỏ qua khoảng cách.** Server ở bên kia thế giới tạo ra độ trễ cố định mà thêm phần cứng không thể xóa bỏ.

## [edge-cases] Trường hợp biên

- **Một bước quá chậm chi phối toàn bộ.** Nếu database mất 2 seconds còn mỗi bước khác chỉ mất 20 ms, tăng tốc network gần như không thay đổi kết quả.
- **Cached responses (phản hồi từ cache).** Nếu cache gần người dùng đã có dữ liệu, request bỏ qua phần lớn các bước. Vì vậy cùng một request có thể có thời gian rất khác nhau.
- **Timeouts (giới hạn thời gian chờ).** Request chờ quá lâu ở một bước nên dừng và báo lỗi, thay vì treo đến khi người dùng bỏ cuộc.
- **Retries (thử lại).** Retry tạo thêm tải đúng lúc hệ thống đang gặp khó khăn. Hãy giới hạn số lần thử và chờ một khoảng giữa các lần.

## [worked-example] Ví dụ giải chi tiết

**Bài toán:** Một người dùng ở Ho Chi Minh City nhận được HTML của trang sản phẩm sau 800 ms kể từ lúc nhấn Enter. Server ở Singapore, và đây là lần truy cập đầu tiên. Hãy giải thích những phần thời gian có thể tạo thành 800 ms và chọn phần cần đo trước. (Hình ảnh và scripts tải sau HTML, nên không nằm trong 800 ms này.)

**Ước lượng từng phần (gần đúng):**

1. **DNS lookup (tra cứu DNS):** lần đầu thường mất 20–100 ms, sau đó kết quả được cache nên những lần truy cập tiếp theo có thể bỏ qua bước này.
2. **Connection setup (thiết lập kết nối):** TCP cần một round trip, TLS cần thêm một (TLS 1.3) hoặc hai (TLS 1.2), tổng cộng hai hoặc ba round trips trước khi truyền dữ liệu trang. Singapore gần Ho Chi Minh City nên mỗi round trip khoảng 20–30 ms. Hai đến ba lượt × 20–30 ms = 40–90 ms.
3. **Sending the request (gửi yêu cầu):** thêm một round trip trước khi byte đầu tiên của phản hồi đến nơi, khoảng 30 ms.
4. **Server work (xử lý trên server):** gồm application code (code ứng dụng) và database queries. Tính từ các bước còn lại: bước 1, 2, 3 và 5 cộng lại tối đa khoảng 100 + 90 + 30 + 60 = 280 ms. Phần còn lại trong 800 ms, khoảng 520 ms hoặc hơn, nằm ở đây.
5. **Sending the page back (gửi trang về):** một trang nhỏ từ server gần đó có thể đến trong vài chục mili giây, giả sử khoảng 60 ms.

Sau khi HTML đến nơi, hình ảnh và scripts tạo ra các request riêng. Chúng làm cả trang tải chậm hơn nên cũng cần đếm, nhưng không nằm trong 800 ms đang xét.

**Nên đo gì trước:** thời gian xử lý trên server (bước 4), rồi đến số request riêng cho hình ảnh và scripts. Network chiếm ít thời gian hơn trong ví dụ này; về sau có thể giảm bằng data center gần người dùng hơn hoặc CDN.

**Đáp án:** Phần lớn 800 ms có lẽ nằm ở server work, không phải khoảng cách. Hãy đo thời gian server xử lý trước khi mua thêm phần cứng.
