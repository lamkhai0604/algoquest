# Hệ thống notification

## [objectives] Mục tiêu học tập

- Áp dụng đủ quy trình thiết kế cho hệ thống gửi notification qua push, email và SMS.
- Giữ trong provider quota (hạn mức của nhà cung cấp), để message (thông điệp) khẩn tiếp tục đi khi campaign (chiến dịch gửi hàng loạt) lớn đang gửi.
- Bảo đảm một event thông báo người dùng tối đa một lần mỗi channel (kênh gửi (push, email, SMS)), kể cả khi retry (thử lại) event và lượt gửi, nêu nơi chủ động chọn ngoại lệ.
- Tôn trọng preference (tùy chọn của người dùng) ngay lúc gửi, cả sau retry và khi chuyển sang channel khác.
- Nêu điều vẫn có thể sai, như crash giữa gửi và ghi nhận, chọn chấp nhận rủi ro về phía nào.

### Thuật ngữ chính

- **Channel.** Cách tới người dùng: push notification tới điện thoại, email hoặc SMS.
- **Provider.** Service (dịch vụ) ngoài chuyển phát một channel, như service email, SMS hoặc push của hãng điện thoại. Mỗi bên có **quota**: số message mỗi giây hoặc ngày chấp nhận từ bạn.
- **Transactional notification (thông báo giao dịch).** Thông báo người dùng chờ do hành động của họ, như “đơn đã giao đi” hoặc mã đăng nhập. Notification **promotional**, như giảm giá, gửi cho nhiều người cùng lúc trong **campaign**.
- **Deduplication (chống gửi trùng).** Bảo đảm cùng notification không được giao hai lần. **Notification ID (mã định danh thông báo)** như (event, user) định danh một notification; mỗi channel có một **attempt (lượt gửi)** bên dưới, key (notification ID, channel), được nhận quyền bằng unique constraint (ràng buộc duy nhất) trước hoặc cùng lúc gửi.
- **Preference.** Lựa chọn về nhận gì, bằng cách nào: không nhận quảng cáo, chỉ email, không message ban đêm (**quiet hours (giờ yên lặng)**).
- **Fallback channel (kênh dự phòng).** Channel thứ hai khi channel đầu thất bại, như email khi không giao được push.
- **Dead-letter queue (hàng đợi cho message lỗi nhiều lần).** Nơi giữ message lỗi quá nhiều lần để người xem xét (SD 7).

## [problem-hook] Vấn đề mở đầu

App mua sắm gửi email “giảm giá bắt đầu” tới 10 triệu người. Ba giờ tiếp theo không ai nhận “đơn đã giao đi”: campaign dùng hết quota email provider. Trong campaign ấy, worker (tiến trình xử lý công việc từ hàng đợi) crash rồi khởi động lại, 40,000 người nhận email giảm giá hai lần. Người hủy đăng ký lúc trưa vẫn nhận lúc 2 p.m. vì preference được kiểm tra khi campaign vào queue (hàng đợi) lúc 11 a.m.

Gửi message là một API (giao diện lập trình ứng dụng) call. Gửi hàng triệu message qua provider có giới hạn, không trùng và chỉ tới người còn muốn nhận, là bài toán thiết kế.

## [intuition] Cách hiểu trực quan

Hãy nghĩ về bưu điện gửi thư cho nhiều cửa hàng. Có một xe tới sân bay chở số bao cố định mỗi giờ (quota provider). Cửa hàng gửi một triệu thư quảng cáo không được chiếm mọi chuyến trong lúc thư khẩn bệnh viện chờ: thư khẩn lên trước. Mỗi thư có dấu số, nhân viên tra sổ trước gửi: số đã gửi thì bỏ bản sao (deduplication). Ngay trước thư rời đi, kiểm tra biển “không quảng cáo” trên hộp thư khách, không phải biển lúc cửa hàng mang thư tới (preference kiểm tra lúc gửi).

**Liên hệ bài trước.** Queue, retry và at-least-once delivery (giao ít nhất một lần) từ SD 7; idempotency key (khoá để lặp lại thao tác mà không đổi kết quả), unique constraint từ SD 4, SD 10; backoff, jitter (độ lệch ngẫu nhiên thêm vào thời gian chờ) và xử lý lỗi tốt từ SD 11; điều tiết gửi theo giới hạn provider từ SD 17.

## [when-to-use] Khi nào nên dùng

- **Queue riêng hoặc priority cho message transactional và promotional:** khi campaign dùng chung provider với message khẩn; message khẩn không nên chờ sau campaign.
- **Pacer (bộ điều tiết nhịp gửi) cho mỗi provider tại điểm gửi:** khi provider có quota; tính cả retry (SD 17).
- **Attempt key với unique constraint hoặc atomic “set if absent”:** khi event có thể tới hai lần hoặc lượt gửi có thể retry, điều luôn xảy ra với queue.
- **Idempotency key của provider:** khi provider nhận key, để request retry cùng key không được giao hai lần.
- **Kiểm tra preference lúc gửi:** trong sender (bên gửi thông báo), sau khi message chờ queue, trước mỗi attempt và retry; luôn cần cho quảng cáo có thể chờ hàng giờ; quiet hours trì hoãn chứ không bỏ message.
- **Fallback channel:** cho transactional message quan trọng, chỉ khi preference cho phép channel đó và provider báo channel đầu thất bại; fallback attempt được nhận quyền một lần như attempt khác.

## [template-code] Khung thiết kế

Bài này không có code. Áp dụng **quy trình** với câu hỏi sau cho notification system:

```text
1. Requirements: channels, transactional and promotional, how fast each
   must arrive, preferences, quiet hours, no duplicates.
2. Estimates: messages per day and at peak per channel, campaign size,
   how long a campaign takes at the provider's quota.
3. API: notify(event, user) from other services; preferences API.
4. Data model: preferences per user; attempts(notification ID,
   channel) with a unique key and a state; templates.
5. High-level design: event queue -> workers -> one queue per channel
   and priority -> senders (pacer, claim, preferences) -> provider.
6. Deep dive: quotas and priorities; deduplication across retries;
   preferences checked at send time, also for fallbacks.
7. Failures: provider down or slow, worker crash between send and
   record, a bad campaign; what users see.
8. Summary: each requirement and how it is met.
```

## [complexity] Chi phí và ước lượng

**Thời gian campaign.** 10 triệu email ở quota 1,000 mỗi giây cần 10,000,000 ÷ 1,000 = 10,000 giây, khoảng 2.8 giờ. Transactional email chung quota không priority thì mọi email “đơn đã giao đi” chờ sau campaign tối đa 2.8 giờ.

**Giữ phần tài nguyên.** Cho transactional email phần luôn dùng được, như 200 trong 1,000 mỗi giây, campaign dùng còn lại: campaign mất 10,000,000 ÷ 800 = 12,500 giây, khoảng 3.5 giờ, transactional email không chờ nó. Chỉ đúng nếu transactional email dưới phần được giữ: cao điểm khoảng 150 mỗi giây, gồm retry, queue không tích tụ và mỗi message được bàn giao provider trong vài giây. Retry cũng tính, nếu thêm 5% cho campaign thì khoảng 13,100 giây, khoảng 3.6 giờ. Transactional ít thì campaign dùng phần dư.

**Bản ghi deduplication.** 30 triệu notification mỗi ngày, bản ghi khoảng 100 byte mỗi attempt là khoảng 3 GB mỗi ngày. Event queue giao lại event tối đa 2 ngày, worker bỏ event cũ hơn, giữ attempt 7 ngày, lâu hơn mọi redelivery hoặc retry, tốn khoảng 21 GB; bản ghi cũ hết hạn và không event cũ đến mức đó được gửi. Idempotency key provider cũng cần chú ý: chỉ bảo vệ retry khi provider còn nhớ key.

**Nơi vẫn có thể trùng.** Sender gửi message rồi crash trước ghi “sent”. Khởi động lại không biết provider nhận request chưa. Gửi lại có thể tới hai lần; không gửi có thể người dùng không nhận gì. Có provider idempotency key thì request thứ hai cùng key bị provider bỏ. Không có thì nhóm chọn: at least once (có thể trùng, tốt cho mã đăng nhập) hoặc at most once (có thể bỏ lỡ, tốt cho quảng cáo).

| Thứ tự bước | Worker crash giữa các bước | Phù hợp |
| --- | --- | --- |
| Ghi “sending”, gửi, rồi ghi “sent” | Có thể bỏ lỡ; kiểm tra sau có thể gửi lại nếu provider báo chưa giao | Quảng cáo: bỏ lỡ ít hại hơn trùng |
| Gửi rồi ghi “sent” | Có thể gửi hai lần | Mã đăng nhập, cảnh báo: trùng ít hại hơn bỏ lỡ |
| Gửi với provider idempotency key rồi ghi | Provider bỏ bản lặp | Mọi message khi provider hỗ trợ key |

## [common-mistakes] Lỗi thường gặp

- **Một queue cho tất cả.** Campaign hàng triệu message chặn message khẩn hàng giờ.
- **Kiểm tra preference khi vào queue.** Quảng cáo vào queue lúc 11 a.m., gửi 2 p.m., bỏ qua hủy đăng ký lúc trưa.
- **Fallback không quy tắc trạng thái.** Push và email dự phòng là một notification, hai attempt. Chỉ nhận quyền email attempt sau khi provider báo push thất bại và email được phép; push đã giao hoặc chưa có báo cáo thì không email, fallback job thứ hai không nhận quyền được.
- **Retry không giới hạn.** Provider ngừng nhận dồn retry (SD 11); backoff có jitter, giới hạn số lần, rồi chuyển dead-letter queue.
- **Bỏ qua quiet hours qua múi giờ.** “Không message sau 10 p.m.” là 10 p.m. của người dùng; campaign gửi cùng lúc toàn cầu phải giữ message của một số người đến sáng.

## [edge-cases] Trường hợp đặc biệt

- **Device token không hợp lệ.** Push provider báo token điện thoại hết hiệu lực; xóa để tránh phí push sau, fallback nếu channel được phép.
- **Đổi preference trong retry.** Mỗi retry kiểm tra lại; người từ chối nhận sau attempt đầu không còn attempt tiếp.
- **Bounce và complaint.** Email provider báo địa chỉ không gửi được, phản ánh spam; dừng gửi để provider không chặn cả tài khoản.
- **Nhiều event cùng việc.** “Đơn đã đóng gói”, “đã giao đi”, “đang giao” trong một phút có thể gộp một message nếu sản phẩm ưu tiên ít notification.

### Mở rộng (không bắt buộc): delivery receipt (báo nhận từ nhà cung cấp)

Provider có thể callback kết quả message: delivered, opened, bounced. Lưu callback giúp biết có cần fallback, như gửi email khi push được báo chưa giao. Push service không phải lúc nào cũng báo giao tới điện thoại; thiếu báo cáo thì chính app có thể xác nhận từng push, fallback chờ một trong các tín hiệu này. Callback cũng at least once, có thể sai thứ tự nên cần cùng sự cẩn thận: key mỗi callback, trạng thái chỉ tiến (sent → delivered → opened).

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** App mua sắm có 50 triệu người dùng. Gửi khoảng 20 triệu transactional notification mỗi ngày (cập nhật đơn, mã đăng nhập), campaign tới 10 triệu promotional email. Provider: email nhận 1,000 mỗi giây, có idempotency key; SMS nhận 100 mỗi giây, không idempotency key; push nhận 10,000 mỗi giây. Cập nhật đơn phải bàn giao provider trong 1 phút, mã đăng nhập trong 30 giây. Transactional email cao điểm khoảng 150 mỗi giây, gồm retry. Event queue giao lại event tối đa 2 ngày, email provider nhớ idempotency key 24 giờ. Người dùng được từ chối quảng cáo mỗi channel và đặt quiet hours. Event tới queue với at-least-once delivery. Thiết kế notification system.

**Lời giải:**

1. **Yêu cầu.** (F1) Gửi push, email, SMS cho event. (F2) Campaign 10 triệu email. (F3) Tôn trọng opt-out và quiet hours lúc gửi, cả retry và fallback. (N1) Cập nhật đơn bàn giao provider trong 1 phút, mã đăng nhập trong 30 giây, kể cả khi campaign chạy. (N2) Không vượt quota provider. (N3) Notification tới người dùng tối đa một lần mỗi channel, qua fallback chỉ sau channel đầu chắc chắn thất bại; crash có thể gây bỏ lỡ hiếm. Ngoại lệ: mã SMS đăng nhập có thể hiếm gửi hai lần vì thiếu mã khiến người dùng không đăng nhập được. Ngoài phạm vi: thiết kế nội dung message.
2. **Ước lượng.** 20 triệu mỗi ngày khoảng 230 mỗi giây trung bình, có thể 1,000 cao điểm, chủ yếu push. Campaign ở 800 email mỗi giây mất khoảng 3.5 giờ. Bản ghi deduplication: khoảng 30 triệu mỗi ngày × 100 byte = 3 GB, 21 GB cho 7 ngày.
3. **API.** Service khác gọi `notify(eventId, userId, type)`; người dùng đổi cài đặt qua preferences API.
4. **Data model (mô hình dữ liệu).** `preferences(user_id, channel, category, allowed)`, quiet hours và múi giờ mỗi người; `attempts(notification_id, channel, state, created_at)` với (notification_id, channel) làm primary key (khóa chính), notification ID là (event, user), state là claimed, sent, delivered hoặc failed; device token, địa chỉ email mỗi người.
5. **High-level design (thiết kế tổng quan).** Event queue → worker bỏ event cũ hơn 2 ngày → queue mỗi channel và priority (transactional, promotional) → sender có pacer mỗi provider → provider.
6. **Deep dive (đi sâu vào một phần).** _Quota và priority:_ email pacer gửi tối đa 1,000 mỗi giây, tính retry, luôn lấy transactional trước, giữ 200 mỗi giây, cao hơn đỉnh 150; campaign dùng còn lại. _Deduplication:_ trước gửi, sender insert attempt (notification ID, channel) ở state “claimed”; primary key từ chối bản thứ hai từ event giao lại. Với email, attempt key chuyển cho provider làm idempotency key; sender crash, message giao lại trong 24 giờ thì retry cùng key bị provider bỏ. Push không có key đó nên push ở “claimed” không gửi lại: bỏ lỡ hiếm thay vì trùng. Với mã SMS đăng nhập, sender gửi rồi ghi “sent”, chọn mã trùng hiếm hơn thiếu, ngoại lệ đã nêu. Attempt giữ 7 ngày, lâu hơn giới hạn redelivery 2 ngày. _Preference:_ sender đọc ngay trước mỗi attempt và retry, sau khi message chờ queue; quảng cáo gặp quiet hours vào delay queue đến sáng, kiểm tra lại khi đó. _Fallback:_ push service báo push thất bại, người dùng cho phép email loại này, fallback nhận quyền (notification ID, email) một lần rồi gửi; push đã giao hoặc chưa có báo cáo thì không email.
7. **Lỗi.** Email provider ngừng, message backoff có jitter tối đa một giờ rồi dead-letter queue; transactional fallback sang push nếu được phép. Sender crash sau gửi mã SMS trước ghi nhận có thể gửi mã hai lần, do lựa chọn. Không tới được bảng attempts thì sender dừng, không gửi message chưa nhận quyền. Campaign gửi sai danh sách được dừng bằng kill switch làm rỗng promotional queue.
8. **Tổng kết.** F1, F2 bằng queue mỗi channel; F3 bằng sender kiểm tra preference mỗi attempt, cả retry, fallback; N1 bằng priority, phần giữ cao hơn đỉnh transactional; N2 bằng pacer tính retry; N3 bằng một attempt nhận quyền mỗi channel, fallback chỉ sau báo lỗi và provider key email, kèm bỏ lỡ hiếm của push và ngoại lệ mã SMS đã nêu.

**Kết quả:** Queue mỗi channel, priority, pacer mỗi provider tính retry, giữ 200 email mỗi giây cho transactional, trên đỉnh 150, nên campaign 10 triệu email mất khoảng 3.5 giờ không làm chậm cập nhật đơn. Notification ID chung, attempt được nhận quyền mỗi channel, fallback chỉ sau báo lỗi và attempt key chuyển email provider ngăn trùng. Sender kiểm tra preference, quiet hours ngay trước mỗi attempt, trên mọi retry.
