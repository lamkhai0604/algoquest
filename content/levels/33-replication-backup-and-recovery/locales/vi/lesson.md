# Replication (sao chép dữ liệu sang nhiều máy chủ), backup (bản sao lưu) và khôi phục

## [objectives] Mục tiêu học tập

- Giải thích replication theo mô hình leader (máy chủ chính nhận mọi lệnh ghi) và follower (máy chủ bản sao áp dụng thay đổi từ leader), dùng read replica (bản sao dùng để phục vụ lệnh đọc) để phục vụ nhiều lệnh đọc hơn.
- Ước lượng số replica cần cho tải đọc, nhớ rằng mỗi replica cũng áp dụng mọi lệnh ghi.
- Phân biệt synchronous replication (sao chép đồng bộ) với asynchronous replication (sao chép bất đồng bộ), nêu chi phí về tốc độ và nguy cơ mất dữ liệu của mỗi cách.
- Giải thích replication lag (độ trễ sao chép) và tránh để người dùng thấy thay đổi của chính mình biến mất: read-your-writes (luôn thấy thay đổi của chính mình).
- Mô tả failover (chuyển sang máy chủ dự phòng), ước lượng số lệnh ghi có thể mất khi failover với asynchronous replication.
- Lập kế hoạch backup từ hai mục tiêu RPO (lượng dữ liệu tối đa được phép mất) và RTO (thời gian tối đa để hệ thống hoạt động lại), giải thích vì sao replication không phải backup.

### Thuật ngữ chính

- **Replication.** Giữ các bản sao của cùng một database (cơ sở dữ liệu) trên nhiều server (máy chủ), cập nhật chúng khi dữ liệu thay đổi.
- **Leader và follower.** **Leader** (còn gọi là primary) nhận mọi lệnh ghi rồi gửi từng thay đổi đến các **follower** (còn gọi là replica hoặc secondary), nơi áp dụng cùng các thay đổi theo cùng thứ tự.
- **Read replica.** Follower cũng trả lời query (truy vấn) đọc, nhờ đó phân phối lệnh đọc qua nhiều server.
- **Synchronous replication.** Leader chỉ xác nhận lệnh ghi với ứng dụng sau khi ít nhất một follower được chọn đã lưu bền vững lệnh đó trên đĩa, để dữ liệu còn sau sự cố. Nếu chỉ leader hỏng và follower đó được nâng lên làm leader, không lệnh ghi đã xác nhận nào bị mất; đổi lại, mỗi lệnh ghi phải chờ lâu hơn.
- **Asynchronous replication.** Leader xác nhận lệnh ghi ngay sau khi tự lưu xong, rồi mới gửi đến các follower. Ghi nhanh hơn, nhưng các lệnh ghi mới nhất có thể mất nếu leader hỏng.
- **Replication lag.** Mức follower chậm hơn leader, thường đo bằng thời gian. Thường dưới một giây, nhưng có thể tăng lên nhiều phút khi leader bận hoặc mạng chậm.
- **Read-your-writes.** Cam kết rằng sau khi bạn sửa dữ liệu, bạn thấy thay đổi đó, dù người khác có thể thấy muộn hơn một chút.
- **Failover.** Chuyển follower thành leader mới khi leader hỏng. Việc nâng follower lên gọi là **promotion (nâng follower thành leader)**.
- **Backup.** Bản sao dữ liệu giữ tách khỏi database đang chạy, thường ở nơi khác, để khôi phục khi dữ liệu mất hoặc hỏng.
- **Point-in-time recovery (khôi phục về một thời điểm).** Restore (khôi phục từ bản sao lưu) một full backup rồi phát lại nhật ký thay đổi của database đến thời điểm đã chọn, chẳng hạn một phút trước một thao tác nhầm.
- **RPO (recovery point objective).** Lượng dữ liệu lớn nhất, đo bằng thời gian, mà doanh nghiệp chấp nhận mất. RPO 5 phút nghĩa là mất nhiều nhất 5 phút thay đổi cuối.
- **RTO (recovery time objective).** Thời gian dài nhất mà doanh nghiệp chấp nhận chờ đến khi dịch vụ hoạt động lại.

## [problem-hook] Vấn đề mở đầu

Một cửa hàng trực tuyến chạy trên một database server. Trong đợt giảm giá, nó phục vụ 8,000 lệnh đọc và 800 lệnh ghi mỗi giây, database đã chạm giới hạn: trang tải chậm, còn thay server mạnh hơn cũng chỉ giúp cầm cự vài tháng.

Hai tuần sau, một kỹ sư chạy lệnh xóa trên nhầm bảng, xóa mọi đơn hàng của ngày trước. Nhóm vừa thêm hai server chứa bản sao database, nhưng lệnh xóa cũng đến các bản sao trong một giây. Các bản sao giúp cửa hàng nhanh hơn, nhưng không cứu được đơn hàng.

Bài này trình bày cả hai mục đích giữ bản sao: bản sao phục vụ nhiều lưu lượng hơn và giúp chịu được một server hỏng; backup giúp khôi phục sau thao tác nhầm.

## [intuition] Cách hiểu trực quan

Hãy tưởng tượng giáo viên viết lên bảng chính, còn các trợ giảng chép từng chữ sang ba bảng khác quanh một hội trường lớn. Học sinh đọc bảng gần mình nhất, nên nhiều học sinh hơn có thể đọc cùng lúc. Đó là replication với read replica.

Các bản sao chậm hơn một chút: học sinh vừa yêu cầu giáo viên sửa lỗi chính tả có thể nhìn bảng phụ và vẫn thấy lỗi cũ. Đó là replication lag. Nếu giáo viên bị ốm, một trợ giảng có thể tiếp quản bảng chính; những gì giáo viên vừa viết mà chưa trợ giảng nào chép kịp sẽ mất. Đó là failover với asynchronous replication.

Bây giờ giáo viên vô tình xóa nửa bảng. Các trợ giảng cũng chép đúng thao tác xóa ấy. Muốn lấy lại nội dung phải có ảnh chụp bảng từ trước, giữ ở nơi khác. Ảnh đó là backup.

**Liên hệ với SD 4.** Database giữ nhật ký mọi thay đổi. Follower phát lại nhật ký đó để theo kịp leader; point-in-time recovery cũng phát lại nhật ký ấy sau khi restore backup.

## [when-to-use] Khi nào nên dùng

- **Read replica:** đọc thường xuyên hơn ghi nhiều, và một số lần đọc chấp nhận dữ liệu chậm hơn một chút, như trang sản phẩm, bảng tin và kết quả tìm kiếm.
- **Đọc từ leader:** lần đọc phải thấy dữ liệu mới nhất, như thay đổi của chính người dùng ngay sau khi lưu, hoặc kiểm tra trước thanh toán.
- **Synchronous replication:** không được mất lệnh ghi đã xác nhận, như thanh toán, và follower đủ gần để thời gian chờ thêm ít.
- **Asynchronous replication:** tốc độ quan trọng hơn giây ghi cuối, hoặc follower ở xa, như trong region khác.
- **Failover:** dịch vụ phải tiếp tục hoạt động khi server của leader hỏng.
- **Backup với point-in-time recovery:** luôn cần. Mọi database chứa dữ liệu không thể tạo lại đều cần backup giữ riêng, bất kể dùng replication kiểu nào.

## [template-code] Khung thiết kế

Bài này không có code. Dùng **khung thiết kế** sau cho các bản sao dữ liệu:

```text
1. Load: reads per second and writes per second at peak.
   Replica read budget = safe limit per server - writes per second
   (every replica applies every write).
   Replicas = reads from replicas / replica read budget, rounded up.
2. Which reads must be fresh? Send those to the leader
   (for example, a user's own data for a short time after they change it).
3. Sync or async? What may be lost if the leader fails now?
4. Failover: who detects the failure, who is promoted, how long it takes.
5. Targets: RPO (data you may lose) and RTO (time until working again).
6. Backups: full backup how often, log archived how often, kept where.
   Restore time = data size / restore speed + log replay time.
   Test a restore regularly; an untested backup may not work.
```

## [complexity] Chi phí và ước lượng

**Năng lực đọc.** Replica tăng năng lực đọc, không tăng năng lực ghi. Trong mô hình đơn giản, chi phí áp dụng một lệnh ghi sao chép xấp xỉ trả lời một query:

1. Giới hạn an toàn của một server là 2,100 query mỗi giây (70% của 3,000).
2. Leader gửi 800 lệnh ghi mỗi giây đến mọi replica, nên mỗi replica còn 2,100 − 800 = 1,300 query mỗi giây dành cho đọc.
3. Nếu số lệnh ghi tăng đến 2,100 mỗi giây, replica không còn năng lực dành cho đọc: thêm replica không giải quyết được giới hạn ghi.

**Synchronous replication tốn một round trip (lượt đi và về).** Mỗi lệnh ghi đã xác nhận phải chờ follower trả lời: khoảng 0.5 ms trong cùng data center (trung tâm dữ liệu) (SD 1), nhưng 100 ms hoặc hơn nếu qua đại dương. Nếu follower synchronous duy nhất ngừng trả lời, lệnh ghi cũng phải chờ, trừ khi database được cấu hình dùng follower khác.

**Mất lệnh ghi khi failover với asynchronous replication.** Các lệnh ghi đã đến leader nhưng chưa đến follower sẽ mất khi follower được nâng lên. Với độ trễ 3 giây ở mức 200 lệnh ghi mỗi giây, có thể mất đến 3 × 200 = 600 lệnh ghi đã xác nhận.

**Thời gian restore.** Restore backup 400 GB ở tốc độ khoảng 200 MB mỗi giây mất 400,000 ÷ 200 = 2,000 giây, khoảng 33 phút, chưa tính phát lại nhật ký. Database lớn hơn cần lâu hơn, nên phải kiểm tra RTO bằng một lần restore thật thay vì đoán.

| Biện pháp bảo vệ | Chịu được một server hỏng | Khôi phục sau xóa nhầm | Dữ liệu thường có thể mất | Thời gian khôi phục thường gặp |
| --- | --- | --- | --- | --- |
| Asynchronous replica | Có, bằng failover | Không, lệnh xóa cũng được sao chép | Các lệnh ghi trong khoảng độ trễ | Vài giây đến vài phút |
| Synchronous replica | Có, bằng failover sang chính replica đó | Không, lệnh xóa cũng được sao chép | Không mất lệnh ghi đã xác nhận nếu nâng chính synchronous replica lên | Vài giây đến vài phút |
| Backup với log archiving (lưu trữ nhật ký thay đổi) | Có, bằng restore | Có, bằng restore về trước thao tác đó | Khi mất server: tối đa khoảng thời gian giữa các lần lưu nhật ký. Sau thao tác nhầm: mọi thay đổi sau thời điểm đã chọn, kể cả thay đổi hợp lệ | Vài phút đến vài giờ |

## [common-mistakes] Lỗi thường gặp

- **Coi replica là backup.** Lệnh xóa, một migration sai hoặc lỗi làm hỏng dữ liệu được sao chép đến mọi replica trong vài giây.
- **Gửi mọi lệnh đọc đến replica.** Người dùng lưu địa chỉ mới, tải lại trang nhưng replica vẫn hiện địa chỉ cũ. Lệnh đọc cần dữ liệu mới phải đến leader.
- **Thêm replica để sửa vấn đề ghi.** Mỗi replica áp dụng mọi lệnh ghi; replica chỉ tăng năng lực đọc.
- **Chưa từng restore backup.** Backup có thể thiếu, không đọc được hoặc restore lâu hơn RTO cho phép. Hãy restore theo lịch để phát hiện.
- **Giữ backup cùng nơi với database.** Hỏa hoạn, region ngừng hoạt động hoặc kẻ tấn công xóa database cũng có thể xóa các backup đó. Giữ một bản ở nơi khác, với quyền truy cập riêng.

## [edge-cases] Trường hợp đặc biệt

- **Độ trễ tăng khi tải cao.** Trong đợt giảm giá, leader bận và độ trễ có thể lên vài giây hoặc vài phút. Theo dõi độ trễ, ngừng gửi lệnh đọc đến replica chậm quá mức.
- **Leader cũ quay lại sau failover.** Nếu leader cũ vẫn nhận ghi sau khi follower được nâng lên, hai server cùng nhận ghi và dữ liệu phân nhánh (xem phần mở rộng).
- **Failover làm mất lệnh ghi đã báo thành công.** Với asynchronous replication, đơn hàng đã xác nhận có thể biến mất. Với dữ liệu không được phép mất, dùng synchronous replication đến ít nhất một follower và nâng chính follower đó lên: chỉ nó mới chắc chắn giữ mọi lệnh ghi đã xác nhận. Nếu nó ngừng trả lời, leader nên ngừng xác nhận lệnh ghi thay vì âm thầm chuyển sang asynchronous.
- **Restore về trước thao tác nhầm cũng hoàn tác các thay đổi hợp lệ sau đó.** Nếu phát hiện lệnh xóa sau ba giờ, restore về ngay trước nó cũng loại bỏ ba giờ đơn hàng hợp lệ đến sau. Nhóm phải chép lại chúng từ database bị ảnh hưởng hoặc nhập lại; riêng point-in-time recovery không tự hợp nhất hai lịch sử.
- **Phát hiện nhầm lẫn quá muộn.** Nếu sau ba ngày mới phát hiện thay đổi sai nhưng backup chỉ giữ hai ngày, không còn bản sạch. Giữ backup lâu hơn khoảng thời gian thường cần để phát hiện sai sót.

### Mở rộng (không bắt buộc): split brain và fencing

**Split brain (hai máy chủ cùng nghĩ mình là leader)** xảy ra khi hai server đều tin rằng mình là leader và đều nhận ghi, chẳng hạn khi sự cố mạng tạm thời tách leader cũ khỏi các server còn lại. Hai bản dữ liệu sau đó khác nhau, và hợp nhất về sau rất khó hoặc không thể.

**Fencing (chặn leader cũ ghi dữ liệu)** ngăn việc đó: trước hoặc khi nâng follower lên, chặn leader cũ nhận ghi, chẳng hạn cắt quyền truy cập storage hoặc mạng, hay gắn cho mỗi leader một số (epoch hoặc term) rồi từ chối lệnh ghi mang số cũ. Công cụ failover cũng chờ đa số server đồng ý rằng leader không còn hoạt động trước khi nâng server mới lên.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** Database của cửa hàng phục vụ 8,000 lệnh đọc và 800 lệnh ghi mỗi giây vào giờ cao điểm. Một database server xử lý khoảng 3,000 query mỗi giây, và nhóm giữ mỗi server ở mức không quá 70% số đó. Khoảng 5% lệnh đọc phải thấy dữ liệu mới nhất: giỏ hàng và đơn hàng của chính khách ngay sau khi họ thay đổi. Doanh nghiệp chấp nhận mất tối đa 1 phút đơn hàng sau thảm họa phá hủy database, muốn cửa hàng hoạt động lại trong 1 giờ. Database có 400 GB, restore chạy khoảng 200 MB mỗi giây. Hãy thiết kế replication và backup.

**Lời giải:**

1. **Lệnh đọc cần dữ liệu mới đến leader.** 5% của 8,000 là 400 lệnh đọc mỗi giây. Leader xử lý 800 lệnh ghi + 400 lệnh đọc = 1,200 query mỗi giây, dưới giới hạn an toàn 2,100.
2. **Các lệnh đọc khác đến replica.** 8,000 − 400 = 7,600 lệnh đọc mỗi giây. Mỗi replica áp dụng cả 800 lệnh ghi, còn 2,100 − 800 = 1,300 query mỗi giây dành cho đọc (mô hình đơn giản). 7,600 ÷ 1,300 ≈ 5.8, nên cần 6 replica; replica thứ 7 giữ được giới hạn khi một replica hỏng.
3. **Read-your-writes.** Nhóm ngừng sử dụng mọi replica chậm hơn 10 giây, nên replica được phục vụ không bao giờ cũ hơn 10 giây. Sau khi khách sửa giỏ hàng hoặc đặt đơn, các lần đọc giỏ hàng và đơn hàng của chính họ đến leader trong 30 giây tiếp theo, lâu hơn giới hạn ấy.
4. **Failover.** Một replica trong cùng data center dùng synchronous replication, nên không mất đơn hàng đã xác nhận khi leader hỏng; mỗi lệnh ghi tốn thêm khoảng 0.5 ms. Nếu leader hỏng, nâng chính replica đó lên trong một phút và dùng fencing chặn leader cũ.
5. **Backup.** Full backup mỗi đêm và lưu nhật ký database mỗi 30 giây, giữ cả hai ở region khác với quyền truy cập riêng. RPO khi mất database hoặc data center: khoảng tối đa 30 giây đơn hàng, trong giới hạn 1 phút. Sau xóa nhầm, cửa hàng restore về ngay trước thao tác đó rồi chép lại đơn hàng hợp lệ đến sau từ database bị ảnh hưởng.
6. **Thời gian restore.** 400,000 MB ÷ 200 MB/s = 2,000 s ≈ 33 phút, cộng phát lại tối đa một ngày nhật ký, đo được khoảng 15 phút: tổng khoảng 48 phút. Còn khoảng 12 phút trong RTO 1 giờ để khởi động server, kiểm tra và mở lại dịch vụ, khá sát. Mỗi tháng thử restore để đo toàn bộ quá trình; nếu vượt 1 giờ, nhóm làm full backup thường xuyên hơn để rút ngắn phát lại.

**Kết quả:** Một leader cho lệnh ghi và đọc cần dữ liệu mới, 6 read replica (7 nếu có dự phòng), trong đó một replica synchronous để failover, cùng backup hằng đêm và log archiving mỗi 30 giây ở region khác. Replica xử lý tải và sự cố server; chỉ backup mới có thể lấy lại những đơn hàng đã xóa.
