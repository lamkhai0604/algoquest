# URL Shortener

## [objectives] Mục tiêu học tập

- Áp dụng đủ quy trình thiết kế từ Level 42 cho URL shortener, từ yêu cầu đến tổng kết.
- Ước lượng số link tạo, redirect (chuyển hướng), storage và độ dài short code (mã rút gọn) từ yêu cầu.
- Chọn cách tạo short code và phát hiện collision (trùng mã) để hai link không bao giờ chung code.
- Chọn redirect status code, giải thích 301 và 302 có nghĩa gì với caching ở browser và CDN (mạng phân phối nội dung), analytics và thay đổi link.
- Giữ redirect nhanh bằng cache (bộ nhớ đệm) cho link phổ biến, nêu lỗi gì và khi nào xảy ra.

### Thuật ngữ chính

- **Short code.** Phần định danh của short link, như `aZ3kQ9x` trong `sho.rt/aZ3kQ9x`.
- **Base62 (hệ 62 ký tự).** Viết số bằng 62 ký hiệu: `0`–`9`, `a`–`z`, `A`–`Z`. Bảy ký tự base62 cho 62⁷ ≈ 3.5 nghìn tỷ code.
- **Collision.** Hai long link khác nhau nhận cùng short code. Không được để đến người dùng: một link sẽ mở trang của link kia.
- **Redirect.** Phản hồi HTTP đưa browser tới địa chỉ khác. Header (phần thông tin đi kèm) **Location** chứa long link.
- **301 Moved Permanently (chuyển hướng vĩnh viễn).** Redirect mà browser và shared cache có thể lưu, dùng lại không hỏi server (máy chủ), trừ khi được yêu cầu khác.
- **302 Found (chuyển hướng tạm thời).** Redirect tạm thời: browser hỏi server lần tiếp theo, trừ khi phản hồi cho biết giữ được bao lâu. **307** và **308** là phiên bản còn giữ nguyên request method.
- **Cache-Control (header điều khiển cache).** Response header nói ai được giữ phản hồi, trong bao lâu: `max-age=3600` cho mọi cache giữ một giờ, `s-maxage` đặt thời gian riêng cho shared cache như CDN.
- **Hot link (link được bấm rất nhiều).** Short link chiếm phần lớn lượt bấm, như link trong bài đăng lan truyền mạnh.

## [problem-hook] Vấn đề mở đầu

Nhóm marketing chia sẻ link trong bài đăng, email và tờ rơi in. Địa chỉ dài có tracking parameter bị ngắt trong message và xấu trên giấy, nên họ muốn short link không thay đổi, mở tức thì ở mọi nơi trên thế giới và biết bao nhiêu người đã bấm.

Thiết kế có vẻ nhỏ: lưu code và long link rồi redirect. Khó nằm ở chi tiết. Code quá ngắn sẽ hết; hai link chung code đưa người dùng sai trang; redirect code sai làm nhóm không thấy lượt bấm hoặc không sửa được link sau khi in.

## [intuition] Cách hiểu trực quan

Hãy nghĩ về quầy giữ áo. Bạn gửi áo dài và nhận vé nhỏ đánh số. Số phải duy nhất: hai khách có vé 57 sẽ tranh cùng áo. Quầy có thể phát vé lần lượt từ cuộn hoặc chọn số ngẫu nhiên, kiểm tra bảng trước khi phát.

Redirect code giống báo bạn bè áo ở đâu. “Đã chuyển hẳn sang phòng 4” (301) nghĩa là lần sau họ tới thẳng phòng 4 không hỏi, dù bạn chuyển tiếp. “Tạm ở phòng 4” (302) nghĩa là mỗi lần họ hỏi, nên bạn chuyển được và biết họ đến thường xuyên thế nào.

**Liên hệ bài trước.** Case study này dùng caching và CDN từ SD 3, database (cơ sở dữ liệu) và unique constraint (ràng buộc duy nhất) từ SD 4, ID từ SD 14 phần C, đặt trong quy trình SD 15.

## [when-to-use] Khi nào nên dùng

- **Code ngẫu nhiên có collision check:** khi code không nên đoán được hoặc lộ số link hiện có; unique constraint của database bắt bản trùng, server thử code khác.
- **Code từ counter hoặc ID generator (SD 14):** khi không muốn collision check và chấp nhận code tăng dần, đoán được, hoặc khi số được xáo trước khi viết bằng base62.
- **Hash của long link:** khi cùng long link luôn phải ra cùng code; hash rút ngắn vẫn có thể collision nên vẫn cần kiểm tra.
- **302 (hoặc 307) với Cache-Control ngắn:** khi nhóm muốn đếm lượt bấm hoặc có thể đổi đích link sau.
- **301 với thời gian cache dài:** khi link không bao giờ đổi, giảm request quan trọng hơn đếm lượt bấm.
- **Cache cho link phổ biến:** gần như luôn cần: phần nhỏ link nhận đa số lượt bấm.

## [template-code] Khung thiết kế

Bài này không có code. Áp dụng **quy trình** với các câu hỏi sau cho shortener:

```text
1. Requirements: create, redirect, custom names, expiry, click counts?
   Links per month, clicks per link, how long links are kept.
2. Estimates: creations and redirects per second, storage over the
   retention time, code length so codes never run out.
3. API: POST /links {longUrl} -> {code}; GET /{code} -> redirect.
4. Data model: links(code primary key, long_url, owner, created_at,
   expires_at); the primary key rejects a repeated code.
5. High-level design: CDN and cache in front of the redirect path.
6. Deep dive: how codes are made and collisions caught; which redirect
   code, with which Cache-Control.
7. Failures: database down, cache lost, a hot link.
8. Summary: each requirement and how it is met.
```

## [complexity] Chi phí và ước lượng

**Lưu lượng.** 100 triệu link mới mỗi tháng là khoảng 100,000,000 ÷ 2,600,000 giây ≈ 40 lần tạo mỗi giây. Mỗi link mở trung bình 100 lần cho 10 tỷ redirect mỗi tháng, khoảng 3,900 mỗi giây, có thể 20,000 lúc cao điểm.

**Storage.** Giữ link 5 năm: 100 triệu × 12 × 5 = 6 tỷ link. Khoảng 500 byte mỗi link là 3 TB, vừa sharded database (SD 8).

**Độ dài code.** Sáu ký tự base62 cho 62⁶ ≈ 57 tỷ code, bảy cho 62⁷ ≈ 3.5 nghìn tỷ. Với 6 tỷ link, bảy ký tự dùng dưới 0.2% không gian.

**Collision với code ngẫu nhiên.** Khi đã dùng 6 tỷ trong 3.5 nghìn tỷ code, code ngẫu nhiên mới trùng code cũ với xác suất 6 ÷ 3,500 ≈ 0.17%, khoảng 1 trong 580. Qua cả 6 tỷ lần tạo, có hàng triệu lần trùng, không thể bỏ qua: insert code mới dưới unique primary key (khóa chính) thất bại nếu trùng, server thử code mới. Gần như mọi lần tạo thành công ngay lần đầu.

**Chi phí redirect.** Redirect là lookup theo primary key. Bao nhiêu tải đến server và database phụ thuộc tần suất bấm lại cùng link, nên phải đo, không giả định: CDN trả 90% của 20,000 redirect mỗi giây thì server nhận 2,000, database chỉ nhận phần cache của server không có.

| Cách tạo code | Collision | Đoán được | Cùng long link, cùng code |
| --- | --- | --- | --- |
| Ngẫu nhiên 7 ký tự | Hiếm; unique key bắt và retry (thử lại) | Không | Không |
| Counter hoặc ID bằng base62 | Không | Có, trừ khi xáo số | Không |
| Hash long link, lấy 7 ký tự đầu | Hiếm; bắt và xử lý, như thêm salt (chuỗi ngẫu nhiên thêm vào khi băm) rồi hash lại | Không | Có |

| Redirect | Browser dùng lại không hỏi | Lượt bấm server thấy | Đổi được đích |
| --- | --- | --- | --- |
| 301 với max-age dài | Có, trong max-age | Chỉ lần đầu mỗi browser | Không với browser đã giữ |
| 302 với `max-age=0` (phải kiểm tra trước) hoặc `no-store` (không lưu) | Không | Mọi lượt bấm | Có, ngay |
| 302 với `max-age=0, s-maxage=60` | Không; CDN giữ 60 s | Lượt ở server cộng log (dòng ghi sự kiện) CDN | Có, trong 60 s tại CDN |

## [common-mistakes] Lỗi thường gặp

- **Bỏ collision check.** Hàng triệu link làm trùng “rất hiếm” xảy ra nhiều lần; không unique key thì một link âm thầm thay link khác.
- **Kiểm tra trước, insert sau.** “Code này còn trống không?” rồi insert riêng cho phép hai server lấy cùng code giữa hai bước. Để unique key từ chối insert thứ hai.
- **Dùng 301 khi cần đếm lượt bấm.** Browser giữ 301 nên khách quay lại không tới server.
- **Code quá ngắn.** Sáu ký tự trông đủ hôm nay nhưng hết hoặc trùng thường xuyên khi link tích tụ nhiều năm.
- **Counter làm lộ thông tin.** Code 1, 2, 3 cho mọi người liệt kê mọi link, cả link riêng tư.

## [edge-cases] Trường hợp đặc biệt

- **Tên tự chọn.** “sho.rt/summer-sale” không được trùng code sinh tự động; giữ chung bảng để unique key áp dụng cả hai, hoặc dùng dạng khác cho code tự sinh.
- **Link hết hạn hoặc bị xóa.** Đường redirect không được tiếp tục phục vụ từ cache; cho entry thời hạn không dài hơn yêu cầu cho phép, trả 404 hoặc 410 khi link không còn.
- **Đích độc hại.** Shortener có thể giấu đích; khi tạo long link, kiểm tra với danh sách site độc hại đã biết.
- **Cùng long link nhiều lần.** Code ngẫu nhiên cho mỗi request code mới, phù hợp chiến dịch riêng; nếu cần một code mỗi long link, tra long link trước bằng index (chỉ mục) trên nó.

### Mở rộng (không bắt buộc): đếm lượt bấm không làm chậm redirect

Ghi database mỗi redirect thêm việc vào đường nhanh nhất. Thay vào đó server gửi event “clicked” nhỏ vào queue (hàng đợi) (SD 7), trả redirect ngay; consumer (bên nhận và xử lý message) cộng số mỗi link theo batch. Nếu CDN tự trả một số redirect, log của nó cũng được đọc theo batch. Số đếm chậm vài giây hoặc phút, thường phù hợp dashboard marketing.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** Thiết kế URL shortener cho nhóm marketing. Tạo khoảng 100 triệu link mỗi tháng, mỗi link mở trung bình khoảng 100 lần, cao điểm 20,000 redirect mỗi giây. Giữ link 5 năm. Nhóm muốn số lượt bấm trong vài phút, đổi đích có hiệu lực trong 5 phút. Redirect dưới 50 ms bên trong hệ thống. Đo trên cấu hình thử: CDN trả khoảng 90% redirect cao điểm khi được giữ 60 giây; app server trả redirect từ cache trong 10 ms, từ database trong 30 ms; database có 4 shard, mỗi shard có replica, mỗi bản xử lý khoảng 5,000 lookup mỗi giây.

**Lời giải:**

1. **Yêu cầu.** (F1) Tạo short link cho long link. (F2) Redirect. (F3) Đổi đích có hiệu lực trong 5 phút. (F4) Đếm lượt bấm trong vài phút. (N1) 40 lần tạo, tối đa 20,000 redirect mỗi giây. (N2) Redirect trong 50 ms bên trong hệ thống. (N3) Hai link không bao giờ chung code. Ngoài phạm vi: tên tự chọn, kiểm tra link độc hại.
2. **Ước lượng.** 6 tỷ link qua 5 năm × 500 byte = 3 TB. Bảy ký tự base62 cho 3.5 nghìn tỷ code, không hết. Redirect lookup theo key.
3. **API.** `POST /links {longUrl}` → `{code}`; `PATCH /links/{code} {longUrl}`; `GET /{code}` → 302 với `Location`.
4. **Data model (mô hình dữ liệu).** `links(code primary key, long_url, owner, created_at)`; số lượt bấm riêng mỗi link mỗi ngày.
5. **High-level design (thiết kế tổng quan).** Người dùng → CDN → load balancer (bộ cân bằng tải) → app server → link cache → sharded database. Tạo link đi tới database; redirect đọc cache trước.
6. **Deep dive (đi sâu vào một phần): code và redirect.** Server chọn 7 ký tự base62 ngẫu nhiên, insert dòng; unique primary key từ chối bản trùng (khoảng 1 trong 580 gần cuối), server thử code mới. Trả 302 vì nhóm cần số lượt bấm và thay đổi: 301 được browser giữ, giấu lượt bấm và giữ đích cũ. Phản hồi có `Cache-Control: max-age=0, s-maxage=60`: browser phải kiểm tra lại trước khi dùng lại, CDN được giữ redirect 60 giây. Entry link cache của app hết hạn trong 4 phút nên đổi đích có hiệu lực trong 5 phút. CDN trả khoảng 90%, server nhận khoảng 2,000 redirect mỗi giây cao điểm, mỗi lần trong 30 ms dù cache miss, đạt mục tiêu 50 ms. Mỗi redirect tới server gửi click event vào queue; redirect CDN trả được đếm từ log, cả hai theo batch.
7. **Lỗi.** Bản chính shard lỗi, redirect tiếp từ cache và replica (SD 6), tạo link trên shard đó chờ failover (chuyển sang máy chủ dự phòng). Mất link cache của app, cả 2,000 redirect mỗi giây tới database đến khi cache đầy lại; chia 4 shard khoảng 500 mỗi shard, trong mức 5,000 mỗi bản. CDN ngừng trả thì 20,000 mỗi giây tới server: trong mức 4 × 2 × 5,000 = 40,000 lookup các bản xử lý được, nhưng chỉ khi app server cũng gánh được mức ấy, phải đo thêm. Hot link chủ yếu do CDN trả.
8. **Tổng kết.** F1 bằng code ngẫu nhiên; N3 bằng unique key; F2, N2 bằng redirect đã đo trong 30 ms với CDN trả đa số; F3 bằng 302 với cache time ngắn; F4 bằng click event đếm theo batch.

**Kết quả:** Code base62 ngẫu nhiên bảy ký tự, insert dưới unique primary key từ chối bản trùng hiếm và retry. Redirect dùng 302 với shared-cache time ngắn, để đếm lượt bấm và đổi đích trong 5 phút. CDN và link cache giữ redirect nhanh, database được shard cho 3 TB qua 5 năm.
