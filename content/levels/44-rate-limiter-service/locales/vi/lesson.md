# Service rate limiter (bộ giới hạn tần suất request)

## [objectives] Mục tiêu học tập

- Giải thích token bucket (thùng token) và sliding window (cửa sổ trượt), chọn theo yêu cầu burst hoặc window đã nêu.
- Giữ giới hạn chính xác khi nhiều server (máy chủ) đếm cùng lúc bằng atomic update (cập nhật nguyên tử) trong shared store.
- So sánh giới hạn trên từng server với một global limit (giới hạn toàn cục), nêu khi nào mỗi cách đủ tốt.
- Quyết định limiter fail-open (lỗi thì cho qua) hay fail-closed (lỗi thì chặn lại) khi store ngừng hoạt động, kèm lý do.
- Áp dụng đủ quy trình thiết kế cho rate limiter, ước lượng tải và bộ nhớ store.

### Thuật ngữ chính

- **Rate limiter.** Kiểm tra trước API, đếm request mỗi client (máy khách (chương trình gửi yêu cầu)) và từ chối phần dư, thường bằng **429 Too Many Requests (mã lỗi quá nhiều request)** cùng header (phần thông tin đi kèm) **Retry-After (header báo khi nào thử lại)** cho biết lúc thử lại (SD 11).
- **Fixed window (cửa sổ cố định).** Một counter mỗi client mỗi phút (hoặc giây). Đơn giản, nhưng client có thể gửi đủ giới hạn phút lúc 0:59 rồi lần nữa lúc 1:00.
- **Sliding window.** Giới hạn trên 60 giây gần nhất tính từ hiện tại, không từ đầu phút. **Sliding log** giữ thời gian từng request; **sliding counter** ước lượng từ số đếm phút hiện tại và trước đó.
- **Token bucket.** Mỗi client có thùng tối đa *B* token, nạp lại *r* token mỗi giây. Mỗi request lấy một token; hết token thì từ chối. Cho burst tối đa *B* sau thời gian yên và *r* mỗi giây về dài hạn.
- **Atomic update.** Đọc, quyết định và ghi trong một bước không request nào chen vào, như increment trong store hoặc script nhỏ chạy trong store.
- **Per-node limit (giới hạn riêng từng server).** Mỗi server tự thực thi phần giới hạn của mình, không shared store.
- **Global limit.** Mọi server kiểm tra chung một số đếm nên giới hạn giữ nguyên bất kể phân bố request.
- **Fail-open / fail-closed.** Không kiểm tra được thì limiter cho qua (open) hoặc từ chối (closed).

## [problem-hook] Vấn đề mở đầu

Công ty thanh toán mở API cho developer. Script một khách bị lỗi gửi 5,000 request mỗi giây; database (cơ sở dữ liệu) chậm cho mọi người. Nhóm thêm giới hạn 100 request mỗi phút mỗi API key, đếm trong bộ nhớ từng server. Tuần sau, khách lớn phàn nàn bị từ chối ở 25 request mỗi phút, trong khi kẻ tấn công lọt 400 mỗi phút. Rồi shared store giữ số đếm khởi động lại; trong hai phút nhóm phải chọn: cho mọi request qua hay từ chối tất cả?

Rate limiter trông như counter. Câu hỏi thật là quy tắc đếm nào khớp cam kết, số đếm ở đâu, nhiều server cập nhật an toàn thế nào và điều xảy ra khi không đếm được.

## [intuition] Cách hiểu trực quan

Hãy nghĩ về máy phát vé bảo tàng đông người. **Fixed window** phát 100 vé mỗi giờ, bắt đầu lại đầu giờ: 100 người vào lúc 10:59, thêm 100 lúc 11:00. **Token bucket** là lọ tối đa 20 vé, bảo vệ thêm một vé mỗi 36 giây: nhóm 20 người cùng vào sau lúc vắng, nhưng tính cả ngày thì không quá 100 mỗi giờ.

Bảo tàng có bốn cửa, mỗi cửa lọ riêng 5 vé (**per-node**), nhóm đến một cửa chỉ có 5 dù cửa khác còn nhiều. Lọ chung (**global**) công bằng, nhưng mỗi cửa phải tới đó; hai bảo vệ cùng nhìn lọ có thể cùng lấy vé cuối, trừ khi lấy vé là một hành động nhanh duy nhất (**atomic**). Lọ chung bị khóa thì bảo vệ phải chọn: cho mọi người vào (**open**) hay không ai (**closed**).

**Liên hệ bài trước.** Sliding window là kỹ thuật Level 13; shared in-memory store và replica từ SD 3, SD 6; atomic conditional update từ SD 4, SD 9; 429 và Retry-After từ SD 11.

## [when-to-use] Khi nào nên dùng

- **Token bucket:** khi client được burst sau lúc yên nhưng phải giữ tốc độ dài hạn; chỉ cần hai số mỗi client: token còn lại và thời điểm nạp cuối.
- **Sliding log:** khi cam kết chính xác, như “không quá 1,000 trong bất kỳ 60 phút”, và số client đủ ít để giữ timestamp từng request.
- **Sliding counter hoặc fixed window:** khi ước lượng đủ tốt, cần rất ít bộ nhớ; fixed window cho tối đa gấp đôi giới hạn qua ranh giới window.
- **Atomic update trong shared store:** khi nhiều server đếm cùng client và phải giữ giới hạn.
- **Per-node limit:** khi giới hạn gần đúng chấp nhận được, request phân bố đều, hoặc làm fallback (phương án dự phòng) lúc shared store ngừng hoạt động.
- **Fail-open:** cho giới hạn bảo vệ công bằng ở request rẻ, quan trọng như đọc trang sản phẩm, khi từ chối tất cả tệ hơn vài request dư.
- **Fail-closed:** cho hành động mà mỗi request dư tốn tiền hoặc gây hại, như gửi SMS trả phí, hoặc provider sẽ chặn toàn service.

## [template-code] Khung thiết kế

Bài này không có code. Áp dụng **quy trình** với câu hỏi sau cho rate limiter:

```text
1. Requirements: who is limited (key, user, address), the limit and
   window, bursts allowed or not, what a refused client is told.
2. Estimates: checks per second = requests per second; store memory =
   clients x bytes per client; extra time per request.
3. API: the limiter answers allow or refuse; refused requests get 429
   with Retry-After.
4. Data model: per client, a counter with an expiry, or tokens and the
   last refill time, or a list of timestamps.
5. High-level design: limiter in the servers or a gateway, shared store
   with a replica.
6. Deep dive: the counting rule; one atomic step in the store;
   per-node or global.
7. Failures: store down or slow: fail open or closed, and why; a local
   fallback limit.
8. Summary: each requirement and how it is met.
```

## [complexity] Chi phí và ước lượng

**Fixed window ở ranh giới.** Giới hạn 100 mỗi phút, client gửi 100 lúc 0:59.9, thêm 100 lúc 1:00.0: 200 request trong khoảng một giây, gấp đôi giới hạn.

**Token bucket.** Thùng chứa 20 token, nạp 100 mỗi phút (khoảng 1.67 mỗi giây), client đã yên gửi 20 cùng lúc, sau đó khoảng 1.67 mỗi giây. Trong bất kỳ phút nào, tối đa 20 + 100 = 120.

**Tải store.** Mọi request cần một kiểm tra: 50,000 request mỗi giây cần 50,000 thao tác store mỗi giây. Node xử lý khoảng 100,000 thao tác đơn giản mỗi giây đủ sức và còn dư, thêm replica để failover (chuyển sang máy chủ dự phòng).

**Bộ nhớ.** Token bucket cần khoảng 100 byte mỗi client kèm key: 1 triệu API key tốn khoảng 100 MB. Sliding log có tối đa 100 timestamp 16 byte mỗi client tốn khoảng 1.6 KB mỗi client, 1.6 GB cho một triệu.

**Race khi thiếu atomic update.** Hai server cùng đọc số đếm client là 99, cùng thấy còn chỗ một request rồi cùng ghi 100: đã có 101 request qua. Hàng nghìn server làm vượt nhiều hơn. Increment hoặc script trong store thực hiện đọc, kiểm tra, ghi trong một bước.

| Lựa chọn | Không bao giờ vượt giới hạn | Chi phí thêm mỗi request | Khi store ngừng hoạt động |
| --- | --- | --- | --- |
| Per-node limit (giới hạn ÷ số server mỗi bên) | Có, tổng các phần không vượt giới hạn; nhưng client dính một server chỉ dùng được phần ấy | Không | Không ảnh hưởng |
| Global limit trong shared store | Có | Một lời gọi store, khoảng 1 ms | Phải fail open, closed hoặc fallback về per-node |

## [common-mistakes] Lỗi thường gặp

- **Đọc rồi ghi.** Hai server cùng đọc một số đếm, cùng cho request qua; vượt giới hạn mà không có lỗi nào.
- **Per-node limit với client bám một server.** Client có mọi kết nối tới một server chỉ được phần giới hạn của server đó.
- **Fixed window cho cam kết nghiêm ngặt.** “Tối đa 100 mỗi phút” có thể thành 200 trong hai giây qua ranh giới window.
- **Không quyết định khi lỗi.** Store timeout (hết thời gian chờ) rồi code ném lỗi thì limiter vô tình fail closed, có thể làm API ngừng hoạt động.
- **Số đếm không hết hạn.** Mọi key từng thấy ở lại bộ nhớ; cho mỗi counter thời hạn dài hơn window một chút.

## [edge-cases] Trường hợp đặc biệt

- **Khách rất lớn.** Một key gửi 20,000 request mỗi giây làm key store nóng (SD 8); cho key ấy phần per-node hoặc chia số đếm qua nhiều key.
- **Đồng hồ.** Server lệch đồng hồ không thống nhất ranh giới window; để đồng hồ store hoặc thời gian trong script quyết định.
- **Nhiều giới hạn cùng lúc.** Request có thể qua giới hạn per-key và giới hạn toàn service; kiểm tra cả hai trong cùng atomic step hoặc kiểm tra cái rẻ hơn trước.
- **Retry (thử lại).** Client retry ngay sau 429 làm phí tài nguyên; Retry-After báo lúc quay lại, backoff có jitter (độ lệch ngẫu nhiên thêm vào thời gian chờ) dàn lượt retry ra (SD 11).

### Mở rộng (không bắt buộc): sliding window counter

Sliding counter chỉ giữ hai số mỗi client: số đếm phút này và phút trước. Qua 40% phút hiện tại, ước lượng 60 giây gần nhất là current + 60% × previous. Có 30 đến lúc này trong phút, 90 phút trước, ước lượng 30 + 0.6 × 90 = 84, dưới giới hạn 100. Giả định request phút trước phân bố đều nên gần đúng, không chính xác, dùng ít bộ nhớ như fixed window.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** Public API có 1 triệu API key, 20 server sau load balancer (bộ cân bằng tải), xử lý tối đa 50,000 request mỗi giây lúc cao điểm. Mỗi key được 100 request mỗi phút, tối đa 20 cùng lúc sau lúc yên. Request bị từ chối nhận 429 với Retry-After. Khi store hoạt động, limiter thêm tối đa 2 ms mỗi request. Khi store ngừng, chấp nhận vài request dư mỗi key nhưng API phải tiếp tục trả lời. Đo được: node shared in-memory store trả script nhỏ trong 1 ms, chạy khoảng 100,000 mỗi giây; có replica tiếp quản trong 2 giây. Thiết kế limiter, gồm khi store ngừng.

**Lời giải:**

1. **Yêu cầu.** (F1) 100 mỗi phút mỗi key, burst 20. (F2) 429 với Retry-After. (N1) 50,000 kiểm tra mỗi giây. (N2) Thêm tối đa 2 ms. (N3) Giữ giới hạn bất kể load balancer phân bố request. Ngoài phạm vi: giới hạn theo user bên trong key.
2. **Ước lượng.** 50,000 lời gọi store mỗi giây, nửa mức 100,000 của node. Bộ nhớ: 1 triệu key × khoảng 100 byte = 100 MB.
3. **API.** Mỗi server hỏi limiter `allow(key)` trước khi xử lý; từ chối trả 429 cùng `Retry-After` với số giây đến token tiếp theo.
4. **Data model (mô hình dữ liệu).** Mỗi key trong store: token còn và thời điểm nạp cuối, hết hạn vài phút sau request cuối.
5. **High-level design (thiết kế tổng quan).** Client → load balancer → API server, mỗi bên gọi chung store có replica.
6. **Deep dive (đi sâu vào một phần).** Token bucket chứa 20, nạp 100 mỗi phút khớp “burst 20, 100 mỗi phút về dài hạn”. Script trong store nạp theo thời gian đã qua, lấy token nếu còn, lưu kết quả trong một atomic step: hai server không cùng lấy token cuối. Số đếm global cho client chỉ tới một server vẫn đủ 100. Một lời gọi khoảng 1 ms, trong 2 ms.
7. **Lỗi.** Bản chính store lỗi, replica tiếp quản trong 2 giây; token vừa lấy có thể mất, cho thêm vài request qua. Store chưa trả lời trong 5 ms, server coi không kết nối được, nên request chờ thêm tối đa 5 ms khi sự cố. API fail open với per-node fallback: mỗi server cho 100 ÷ 20 = 5 mỗi phút mỗi key, thêm burst nhỏ, vì từ chối mọi request biến sự cố store ngắn thành ngừng cả API, còn vài request dư rẻ và yêu cầu cho phép. Store trở lại thì đếm tiếp từ store.
8. **Tổng kết.** F1 bằng token bucket; F2 bằng 429 với Retry-After; N1 ở nửa khả năng node; N2 bằng một lời gọi 1 ms; N3 bằng số đếm global, atomic; sự cố store xử lý bằng fail open về per-node limit.

**Kết quả:** Token bucket mỗi key (chứa 20, 100 mỗi phút) trong shared in-memory store, cập nhật bằng một atomic script mỗi request: 50,000 lời gọi mỗi giây, khoảng 100 MB, mỗi lần 1 ms. Số đếm global giữ giới hạn bất kể phân bố request. Store ngừng thì API fail open về per-node limit 5 mỗi phút mỗi key, vì sự cố ngắn không nên từ chối mọi client.
