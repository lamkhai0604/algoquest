# Security cho System Design

## [objectives] Mục tiêu học tập

- Phân biệt authentication (xác thực (bạn là ai)) với authorization (phân quyền (bạn được làm gì)) và kiểm tra cả hai trên mọi request.
- Chọn giữa session (phiên đăng nhập) phía server (máy chủ) và token (mã thông báo) có chữ ký, kể cả tốc độ thu hồi từng loại.
- Giải thích “đăng nhập qua trang khác” (OAuth (chuẩn đăng nhập/ủy quyền qua bên thứ ba)) ở mức ai nhìn thấy gì.
- Dùng HTTPS (kết nối mã hóa) ở mọi nơi, lưu password và secret cẩn thận, áp dụng least privilege (quyền tối thiểu).
- Hạn chế lạm dụng như đoán password bằng rate limit (giới hạn) theo tài khoản và client (máy khách (chương trình gửi yêu cầu)).

### Thuật ngữ chính

- **Authentication.** Kiểm tra một người là ai, như bằng password, rồi cấp bằng chứng dùng cho request sau.
- **Authorization.** Kiểm tra người đã xác thực được làm gì, như “Alice được đọc đơn 124 không?”. Phải kiểm tra trên server cho mọi request.
- **Session.** Bản ghi trên server nói “session ID này thuộc Alice, đến thời điểm này”. Browser hoặc app chỉ gửi session ID ngẫu nhiên, thường trong cookie (dữ liệu nhỏ trình duyệt lưu và gửi lại).
- **Token.** Mẩu dữ liệu như “user Alice, có hiệu lực đến 10:15”, được server **ký** để mọi server kiểm tra mà không tra cứu. **Access token (token truy cập ngắn hạn)** tồn tại ngắn; **refresh token (token làm mới dài hạn)** sống lâu hơn, chỉ dùng lấy access token mới.
- **OAuth.** Chuẩn để một trang hành động thay người dùng ở trang khác, như “đăng nhập với Google”, mà trang đầu không bao giờ thấy password của người dùng. Quyền làm gì được giới hạn bởi **scope (phạm vi quyền)**, như “đọc địa chỉ email”.
- **HTTPS (TLS (lớp mã hóa của https)).** Mã hóa lưu lượng và chứng minh danh tính server để không ai trên mạng đọc hoặc đổi request. “Mọi nơi” gồm giữa service (dịch vụ) nội bộ, không chỉ từ người dùng tới load balancer (bộ cân bằng tải).
- **Password hash (băm mật khẩu).** Hàm một chiều cố ý chạy chậm, dùng **salt (chuỗi ngẫu nhiên thêm vào khi băm)** ngẫu nhiên cho từng người dùng để bảng password bị lấy cắp khó bị đoán.
- **Secret.** Password, key hoặc token service dùng, như password database (cơ sở dữ liệu). Secret nằm trong secret store (kho lưu bí mật), không trong code.
- **Least privilege.** Chỉ cấp cho mỗi người dùng, service và key quyền cần thiết, để key bị đánh cắp ít gây hại.
- **Rate limit.** Giới hạn tần suất một tài khoản hoặc client được làm việc gì, như đăng nhập thất bại (SD 11).

## [problem-hook] Vấn đề mở đầu

App điện thoại của cửa hàng có một triệu người dùng. Một sáng, khách đăng ảnh: chỉ đổi một con số trong request của app, họ thấy đơn của khách khác cùng tên và địa chỉ. Cùng tuần đó, nhóm tìm thấy password database trong commit cũ trên trang code công khai; log (dòng ghi sự kiện) đăng nhập ghi hàng nghìn lần đoán password mỗi phút vào vài tài khoản.

Không việc nào cần tấn công tinh vi. Mỗi việc là thiếu kiểm tra hoặc thiếu giới hạn trong thiết kế. Security cho system design chủ yếu là đặt kiểm tra và giới hạn đúng chỗ.

## [intuition] Cách hiểu trực quan

Hãy nghĩ về tòa nhà văn phòng. Ở quầy lễ tân, bảo vệ kiểm tra giấy tờ và cấp thẻ khách: đó là **authentication**. Mỗi cửa sau đó quyết định thẻ có mở được không: đó là **authorization**. Tòa nhà chỉ kiểm tra thẻ ở lễ tân sẽ cho mọi khách vào phòng server.

Thẻ có thể là số bảo vệ tra trong sổ mỗi lần (**session**), hoặc thẻ có chữ ký của bảo vệ để mỗi cửa tự kiểm tra (**token**). Thẻ ký nhanh hơn, nhưng nếu bị cấm lúc trưa thì thẻ hiệu lực đến 17:00 vẫn mở cửa đến 17:00. Người dọn vệ sinh có chìa hành lang, không có chìa két (**least privilege**). Cửa cho mọi người thử mã sẽ khóa một lúc sau năm lần sai (**rate limit**).

**Liên hệ với SD 2, SD 5 và SD 11.** Load balancer và server từ SD 2; API (giao diện lập trình ứng dụng) và phản hồi 401, 403 từ SD 5; rate limit từ SD 11.

## [when-to-use] Khi nào nên dùng

- **Authentication và authorization trên mọi request:** luôn cần. Nút bị ẩn trong app không phải quyền; server phải kiểm tra người dùng được làm việc này với object (đối tượng (một file trong kho)) này.
- **Session:** khi người dùng phải mất quyền ngay, như logout hoặc bị chặn, và có shared store nhanh để tra cứu.
- **Access token ngắn hạn với refresh token:** khi nhiều server hoặc service cần kiểm tra người dùng mà không tra mỗi lần, và chấp nhận vài phút trước khi việc chặn có hiệu lực.
- **OAuth:** cho “đăng nhập qua trang khác”, hoặc khi app phải dùng service khác thay người dùng mà không giữ password của họ.
- **HTTPS:** trên mọi kết nối, cả giữa service nội bộ và tới database.
- **Secret store:** cho mọi password, key và token service dùng, mỗi service chỉ được đọc secret riêng.
- **Rate limit:** trên đăng nhập, đặt lại password, đăng ký và mọi hành động tốn kém hoặc dễ bị lạm dụng, theo tài khoản và client.

## [template-code] Khung thiết kế

Bài này không có code. Dùng **khung thiết kế** sau để bảo vệ một tính năng:

```text
1. Who may call it? Authentication: how the caller proves who they are.
2. What may they do? Authorization on the server, for this action on this
   object, on every request: "does order 124 belong to Alice?"
3. Sessions or tokens? How fast must a block or logout take effect?
   Sessions: at once, one lookup per request. Tokens: after their lifetime.
4. Transport: HTTPS everywhere, inside the system too.
5. Stored secrets: passwords as slow salted hashes; service secrets in a
   secret store; least privilege for every service and key.
6. Abuse: rate limits per account and per client on logins and costly actions.
```

## [complexity] Chi phí và ước lượng

**Session tốn một lần tra mỗi request.** Với 5,000 request mỗi giây, session store trả lời khoảng 1 ms và xử lý 100,000 lần tra mỗi giây chỉ bận 5%. Logout hoặc chặn có hiệu lực ngay vì lần tra sau không còn session.

**Token không cần tra, nhưng không thu hồi được.** Server kiểm tra chữ ký và thời hạn trong vài microsecond. Nếu Alice bị chặn lúc 10:00, access token hiệu lực đến 10:15, cô ấy dùng tiếp đến 10:15. Thời hạn ngắn hơn nghĩa là làm mới nhiều hơn: 100,000 người dùng hoạt động cùng lúc với access token 1 phút tạo khoảng 100,000 ÷ 60 ≈ 1,700 lần làm mới mỗi giây, mỗi lần kiểm tra bản ghi refresh token trên server.

**Password hash chậm.** Password hash chỉnh ở khoảng 100 ms CPU (bộ xử lý) gần như không tạo độ chậm người dùng nhận thấy cho đăng nhập thật. Với 50 đăng nhập mỗi giây, nó giữ 50 × 0.1 = 5 CPU core bận. Nhưng người lấy cắp bảng chỉ thử khoảng 10 lần đoán mỗi giây mỗi core, thay vì hàng triệu với hash nhanh; salt riêng mỗi người buộc phải đoán từng tài khoản riêng.

**Rate limit trên đăng nhập.** Cho 5 lần thất bại mỗi tài khoản mỗi 15 phút, người đoán có 5 × 96 = 480 lần một ngày vào một tài khoản. Danh sách một triệu password phổ biến mất hơn 2,000 ngày. Chỉ giới hạn theo địa chỉ mạng không đạt điều này: người đoán có 1,000 địa chỉ được 1,000 lần số lượt.

| Lựa chọn | Kiểm tra mỗi request | Chặn có hiệu lực | Chi phí |
| --- | --- | --- | --- |
| Session trong shared store | Một lần tra, khoảng 1 ms | Ngay | Store phải nhanh và luôn hoạt động |
| Access token, 15 phút | Chỉ chữ ký | Tối đa 15 phút sau | Không có mỗi request |
| Access token, 1 phút, có làm mới | Chỉ chữ ký; tra làm mới mỗi phút | Trong 1 phút | Nhiều lần làm mới |

## [common-mistakes] Lỗi thường gặp

- **Chỉ kiểm tra đã đăng nhập.** Mọi người đã đăng nhập có thể đọc mọi đơn bằng cách đổi số. Kiểm tra người này được truy cập object này.
- **Tin app.** Ẩn nút không chặn request; người dùng có thể gửi bất kỳ request nào. Mọi kiểm tra quan trọng chạy trên server.
- **Token dài hạn không có cách thu hồi.** Access token 30 ngày bị đánh cắp dùng được 30 ngày. Giữ access token ngắn hạn, refresh token kiểm tra được trên server.
- **Secret trong code hoặc file config.** Code được sao chép, chia sẻ và đôi khi công bố. Giữ secret trong secret store, đổi mọi secret đã lộ.
- **Một user database toàn quyền.** Mọi service kết nối bằng quyền quản trị thì lỗi ở service báo cáo nhỏ cũng có thể xóa hết đơn hàng.
- **Hash nhanh cho password.** Hash đa dụng được làm để nhanh, giúp người đoán. Dùng password hash chậm có salt.

## [edge-cases] Trường hợp đặc biệt

- **Quyền người dùng thay đổi.** Người dùng mất quyền dự án, token liệt kê dự án của họ vẫn sai đến khi hết hạn. Giữ quyền trên server và kiểm tra tại đó, hoặc giữ token ngắn.
- **Lời gọi nội bộ.** Request từ bên trong mạng không tự nhiên được tin cậy. Các service cũng xác thực nhau qua HTTPS.
- **Thông báo lỗi.** “Không có tài khoản với email này” cho người đoán biết email nào tồn tại. Trả lời giống nhau cho email sai và password sai.
- **Rate limit khóa nhầm người thật.** Khóa tài khoản vĩnh viễn sau năm lần thất bại cho phép bất kỳ ai khóa người khác. Dùng thời gian chờ ngắn tự kết thúc, không kéo dài vì lần thử bị từ chối, và cho người thật lối vào khác, như link dùng một lần qua email, trong khi việc đoán tiếp diễn.

### Mở rộng (không bắt buộc): signed URL (đường dẫn có chữ ký) và multi-tenant isolation (cách ly giữa các tenant) (tính cô lập)

**Signed URL** cho người dùng tải file trực tiếp từ storage: app kiểm tra quyền rồi cấp link có thời hạn và chữ ký, ví dụ hiệu lực 10 phút. Storage kiểm tra chữ ký nên app server không gánh file, link cũ tự hết hiệu lực.

**Multi-tenant isolation** tách khách hàng của sản phẩm doanh nghiệp, gọi là **tenant (khách hàng thuê chung hệ thống)**, khi dùng chung hệ thống. Một cách là `tenant_id` trên mọi dòng và filter trên mọi query (truy vấn), thực thi ở một nơi chung để không query nào quên. Cách mạnh hơn là database riêng mỗi tenant, đắt hơn nhưng khó trộn dữ liệu hơn nhiều.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** App điện thoại cửa hàng có khoảng 1 triệu người dùng, tối đa 100,000 hoạt động cùng lúc, và tới 5,000 API request mỗi giây qua 12 server. Người bị chặn phải mất quyền trong 1 phút; người dùng giữ đăng nhập 30 ngày nếu chưa logout. Đăng nhập đạt 50 mỗi giây lúc cao điểm. Shared in-memory store (kho dữ liệu trong bộ nhớ (RAM)) trả lời khoảng 1 ms, xử lý 100,000 lần tra mỗi giây. Tuần trước, khách thấy đơn của khách khác bằng cách đổi số. Thiết kế authentication, authorization và bảo vệ trước đoán password.

**Lời giải:**

1. **Authorization trước.** Mọi request đơn kiểm tra trên server rằng `customer_id` của đơn là người đã đăng nhập. Một kiểm tra này sửa vấn đề tuần trước; chọn session hay token đều không tự sửa được.
2. **Session hay token.** Session: 5,000 lần tra mỗi giây là 5% store, chặn có hiệu lực ngay. Token 15 phút cho người bị chặn dùng tiếp tối đa 15 phút, quá lâu. Token 1 phút đạt quy tắc nhưng cần khoảng 100,000 ÷ 60 ≈ 1,700 lần làm mới mỗi giây. Nhóm chọn session: đơn giản hơn và trong khả năng store.
3. **Đăng nhập 30 ngày.** Session sống 30 ngày, được gia hạn khi người dùng hoạt động; logout xóa session của điện thoại đó, chặn xóa mọi session của người dùng.
4. **Password.** Slow salted hash chỉnh khoảng 100 ms: 50 đăng nhập mỗi giây × 0.1 s = 5 CPU core lúc cao điểm. Giới hạn tổng lượt kiểm tra password, áp dụng trước hash, ngăn đoán trên nhiều tài khoản chiếm thêm core.
5. **Đoán password.** Tối đa 5 đăng nhập thất bại mỗi tài khoản mỗi 15 phút (480 mỗi ngày), cộng giới hạn theo địa chỉ mạng. Mỗi khoảng chờ tự hết sau 15 phút, lần thử bị từ chối không kéo dài, nên không ai khóa người thật vĩnh viễn.
6. **Truyền dữ liệu và secret.** HTTPS từ app tới load balancer và giữa mọi service; password database nằm trong secret store, chỉ service cần mới đọc được, user database mỗi service chỉ có quyền cần thiết.

**Kết quả:** Sửa authorization bằng kiểm tra quyền sở hữu mỗi request. Dùng session trong shared store (5% khả năng), xóa khi logout hoặc chặn để chặn có hiệu lực ngay. Hash password chậm (khoảng 5 core cao điểm), giới hạn đăng nhập thất bại 5 mỗi tài khoản mỗi 15 phút, HTTPS mọi nơi, secret trong secret store với least privilege.
