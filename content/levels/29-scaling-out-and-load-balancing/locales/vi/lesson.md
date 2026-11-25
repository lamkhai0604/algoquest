# Scaling Out và Load Balancing

## [objectives] Mục tiêu bài học

- So sánh vertical scaling (scale up) — mở rộng theo chiều dọc (thay máy mạnh hơn) — với horizontal scaling (scale out) — mở rộng theo chiều ngang (thêm máy).
- Giải thích vì sao stateless service (dịch vụ không lưu trạng thái) dễ mở rộng hơn: từng server (máy chủ) không giữ dữ liệu người dùng trong bộ nhớ riêng.
- Mô tả load balancer (bộ cân bằng tải) làm gì và nằm ở đâu trên đường đi của request.
- So sánh Layer 4 — tầng 4 (tầng vận chuyển) — với Layer 7 — tầng 7 (tầng ứng dụng) — của load balancer; đồng thời so sánh round robin (chia lần lượt) với least connections (ưu tiên máy ít kết nối nhất).
- Giải thích cách health check (kiểm tra tình trạng hoạt động) loại server bị lỗi khỏi danh sách nhận request.

### Thuật ngữ chính (Key terms)

- **CPU (bộ xử lý).** Bộ phận máy tính thực thi code. Khi CPU bận 100% thời gian, request mới phải chờ đến lượt.
- **Requests per second (số yêu cầu mỗi giây).** Số request một server hoàn thành mỗi giây. **Limit (giới hạn)** là mức mà server đã bận hết công suất.
- **Vertical scaling (scale up — mở rộng theo chiều dọc (thay máy mạnh hơn)).** Thay máy hiện tại bằng máy mạnh hơn, có nhiều CPU hoặc memory (bộ nhớ) hơn.
- **Horizontal scaling (scale out — mở rộng theo chiều ngang (thêm máy)).** Thêm các máy cùng chạy một chương trình và chia nhau xử lý công việc.
- **Session (phiên đăng nhập).** Thông tin server cần nhớ giữa các request của người dùng đã đăng nhập, như danh tính và giỏ hàng. Browser (trình duyệt) thường mang cookie (dữ liệu nhỏ trình duyệt lưu và gửi lại) chứa session id (mã phiên).
- **Stateful (có lưu trạng thái) và stateless (không lưu trạng thái).** Stateful server giữ session trong memory riêng, nên chỉ server đó biết cách phục vụ đúng người dùng. Stateless server (server không giữ trạng thái người dùng giữa các request) lấy dữ liệu cần thiết từ shared store (kho dữ liệu dùng chung), nên server nào cũng có thể trả lời.
- **Load balancer (bộ cân bằng tải).** Chương trình hoặc máy có một địa chỉ để người dùng kết nối. Nó chuyển từng request đến một trong nhiều server.
- **Layer 4 và Layer 7.** Thông điệp mạng có nhiều lớp, như phong bì nằm trong phong bì. Layer 4 balancer chỉ đọc lớp bên ngoài: IP address — địa chỉ IP (số định danh máy tính trên mạng) — và port (cổng), tức số chỉ chương trình nhận dữ liệu (chẳng hạn 443 cho https). Layer 7 balancer đọc cả HTTP request (yêu cầu HTTP): path (đường dẫn), headers (phần thông tin đi kèm) và cookies.
- **Health check (kiểm tra tình trạng hoạt động).** Một request nhỏ mà load balancer gửi đến từng server sau mỗi vài giây để hỏi: “Bạn còn phục vụ được không?”
- **In rotation (đang trong danh sách phân phối).** Tập hợp server mà load balancer hiện có thể gửi request đến.
- **Single point of failure (điểm lỗi duy nhất).** Một thành phần mà nếu hỏng sẽ khiến toàn bộ dịch vụ ngừng hoạt động. Có bản dự phòng (**redundant**, có bản dự phòng) giúp giảm rủi ro đó.
- **Bottleneck (điểm nghẽn).** Thành phần bận nhất, giới hạn tốc độ của toàn hệ thống.

## [problem-hook] Tình huống mở đầu

Một trang đặt vé chạy trên một server. Lúc 9 a.m. trong ngày đầu mở bán, server hết công suất CPU và mọi người dùng đều phải chờ. Nhóm kỹ thuật mua máy có CPU mạnh gấp đôi. Hai giờ sau, trang lại chậm. Cách sửa hiệu quả hôm qua không còn đủ hôm nay, vì lưu lượng tăng nhanh hơn khả năng của máy.

Scaling (mở rộng năng lực hệ thống) là kế hoạch để xử lý sự tăng trưởng đó. Câu hỏi không chỉ là “cần máy mạnh đến đâu?” mà còn là “làm sao thêm công suất mà người dùng không nhận thấy gián đoạn?”.

## [intuition] Hiểu bằng trực giác

Hãy tưởng tượng siêu thị đông khách vào thứ Bảy. Một thu ngân chỉ phục vụ được một số khách nhất định mỗi giờ. Bạn có thể giúp thu ngân làm việc nhanh hơn (vertical scaling), nhưng một người không thể nhanh mãi. Hoặc bạn mở thêm quầy tính tiền (horizontal scaling). Nhân viên ở cửa hướng mỗi khách đến quầy còn trống, giống công việc của load balancer.

Mở thêm quầy hiệu quả nhất khi thu ngân nào cũng phục vụ được mọi khách. Hãy tưởng tượng bạn để giỏ hàng ở quầy của một thu ngân rồi quay lại sau. Nếu nhân viên cửa hướng bạn đến quầy khác, giỏ hàng không có ở đó. Đó là cửa hàng stateful. Nếu giỏ hàng được giữ ở một quầy lưu trữ chung mà thu ngân nào cũng truy cập được, ai cũng phục vụ bạn được. Đó là cách hoạt động của stateless service.

## [when-to-use] Khi nào nên dùng?

Hãy cân nhắc horizontal scaling và load balancer khi:

- CPU, memory hoặc số kết nối của một máy gần chạm giới hạn trong giờ cao điểm.
- Dịch vụ cần tiếp tục hoạt động khi một máy bị hỏng.
- Các bản sao giống nhau của dịch vụ có thể xử lý request theo cùng một cách.

Với dịch vụ nhỏ, scaling up có thể là bước đầu hợp lý vì không cần thay đổi nhiều thứ. Hãy chuẩn bị scaling out trước khi chạm giới hạn của máy mạnh nhất có thể mua, hoặc khi lỗi của một máy có thể làm cả dịch vụ ngừng hoạt động.

## [template-code] Mẫu thiết kế

Level này không có code. Hãy dùng **design template (mẫu thiết kế)** sau cho dịch vụ đã mở rộng:

Trong sơ đồ, shared database (cơ sở dữ liệu dùng chung) lưu dữ liệu cho mọi server; cache (bộ nhớ đệm) giữ bản sao để truy cập nhanh.

```text
Users -> Load balancer -> Server 1
                       -> Server 2
                       -> Server 3
Servers -> shared database (và shared cache hoặc session store nếu cần)

Danh sách kiểm tra:
  1. Mỗi server có stateless không? (không giữ dữ liệu người dùng chỉ trong memory riêng)
  2. Thuật toán nào chọn server? (round robin, least connections)
  3. Health check kiểm tra điều gì? (chỉ trả OK khi server thực sự có thể phục vụ)
  4. Request đang xử lý sẽ ra sao khi một server bị loại khỏi danh sách?
```

## [complexity] Chi phí và giới hạn

**Cost and limits (chi phí và giới hạn)** ở level này gồm:

- **Vertical scaling:** dễ thiết lập, nhưng một máy luôn có giới hạn tối đa và nếu máy hỏng thì cả dịch vụ ngừng.
- **Horizontal scaling:** tăng công suất và khả năng chịu lỗi, nhưng load balancer và shared data store có thể trở thành bottleneck mới. Khả năng tiếp tục chạy khi một máy hỏng gọi là **fault tolerance (khả năng chịu lỗi)**.
- **Load balancer:** thêm một bước vào mỗi request (thường chỉ tăng ít độ trễ) và bản thân nó cũng cần dự phòng, nếu không sẽ trở thành single point of failure.
- **Health checks:** khoảng cách giữa các lần kiểm tra là một trade-off (sự đánh đổi). Kiểm tra thường xuyên phát hiện lỗi nhanh hơn nhưng tạo thêm tải; kiểm tra thưa hơn khiến nhiều request có thể đến server đã hỏng trước khi nó bị loại.

Load balancer Layer 4 và Layer 7 khác nhau ở thông tin chúng đọc:

| Loại | Đọc thông tin | Cách dùng thường gặp | Chi phí |
| --- | --- | --- | --- |
| Layer 4 | IP address và port | Phân phối TCP connections nhanh | Ít công việc cho mỗi request |
| Layer 7 | HTTP path, headers, cookies | Chuyển /api và /images đến các server khác nhau | Nhiều công việc hơn cho mỗi request |

## [common-mistakes] Lỗi thường gặp

- **Scaling out dịch vụ stateful mà không xử lý dữ liệu phiên.** Hai server giữ session khác nhau có thể khiến người dùng trông như bị đăng xuất ngẫu nhiên.
- **Quên shared database.** Thêm server phía trước một database duy nhất có thể chỉ chuyển bottleneck sang database.
- **Tin rằng round robin luôn tốt khi request nặng nhẹ khác nhau.** Nếu vài request mất thời gian gấp mười lần, một server có thể tích tụ request chậm trong khi server khác rảnh. Least connections thường phân phối tốt hơn khi kết nối đang mở đồng nghĩa với công việc đang xử lý. Nếu các request có thời gian gần giống nhau, round robin cũng tốt và đơn giản hơn.
- **Health check lúc nào cũng trả OK.** Chỉ kiểm tra chương trình còn chạy sẽ không phát hiện server đã mất kết nối với database.
- **Chỉ có một load balancer, không có dự phòng.** Thành phần chia tải không nên trở thành thành phần duy nhất có thể làm hệ thống ngừng hoạt động.

## [edge-cases] Trường hợp biên

- **Server hỏng giữa lúc xử lý request.** Request có thể lỗi hoặc timeout (hết thời gian chờ). Client — máy khách (chương trình gửi yêu cầu) — hoặc load balancer có thể retry (thử lại) trên server khác, nhưng chỉ khi thao tác an toàn để lặp lại: làm hai lần phải có tác dụng như làm một lần. Đặt tên hồ sơ hai lần là an toàn; tính tiền thẻ hai lần thì không. Level 34 sẽ học sâu hơn.
- **Mọi server đều unhealthy (không còn khả năng phục vụ).** Load balancer nên trả lỗi rõ ràng, không gửi traffic đến server mà nó biết đã hỏng.
- **Lưu lượng tăng đột ngột.** Server mới cần thời gian khởi động. Quy tắc mở rộng nên thêm công suất trước khi đợt tăng đến, nếu không người dùng đầu tiên phải chịu thời gian chờ.
- **Nhóm người dùng không đồng đều.** Một vài người dùng quá bận có thể làm một server quá tải nếu load balancer chọn server theo user ID.

## [worked-example] Ví dụ giải chi tiết

**Bài toán:** Load test (kiểm thử tải) cho thấy một server chạm giới hạn (CPU gần 100%) ở khoảng 300 requests mỗi giây. Peak — lúc cao điểm (peak traffic: lưu lượng cao điểm) — có 900 requests mỗi giây. Cần bao nhiêu server và tính thế nào?

**Cách giải:**

1. Server chạy ở giới hạn không còn chỗ cho lưu lượng tăng bất ngờ và sẽ chậm đi. Vì vậy, hãy đặt mục tiêu chỉ dùng khoảng 60–70% giới hạn vào giờ cao điểm. Đây là rule of thumb (quy tắc ước lượng) cho lưu lượng tăng đều; nếu traffic tăng đột ngột hoặc server cần nhiều phút để khởi động, nhóm kỹ thuật thường chừa nhiều khoảng trống hơn (40–50%). Ở đây chọn 65%.
2. Ở 65% giới hạn, mỗi server nên nhận khoảng 300 × 0.65 = 195 requests mỗi giây. Đây là target load (tải mục tiêu) cho một server.
3. Giờ cao điểm cần 900 requests mỗi giây, nên 900 ÷ 195 ≈ 4.6 servers. Không thể dùng một phần server, nên làm tròn lên thành 5 (làm tròn xuống 4 khiến mỗi server phải nhận 225, cao hơn mục tiêu).
4. Thêm một server dự phòng khi một máy hỏng, thành tổng cộng 6. Khi cả 6 hoạt động, mỗi máy nhận 900 ÷ 6 = 150 requests mỗi giây.
5. Kiểm tra trường hợp một server hỏng. Năm máy còn lại nhận 900 ÷ 5 = 180 requests mỗi giây. Con số này dưới **target** 195 (180 ÷ 195 ≈ 92% mức tải mục tiêu), nên kế hoạch vẫn đáp ứng.
6. So sánh cùng con số với **limit** 300. Mỗi server bận 180 ÷ 300 = 60% thời gian: đó là **utilization (mức sử dụng)**. **Headroom (công suất dự phòng)**, phần còn lại trước khi chạm giới hạn, là 300 − 180 = 120 requests mỗi giây, tức 40% giới hạn tối đa.

**Đáp án:** Dùng 5 servers cho giờ cao điểm và 6 để chịu được một lỗi server. Cần xác nhận bằng load test vì đây là các con số ước lượng.
