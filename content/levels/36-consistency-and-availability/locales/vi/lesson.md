# Consistency và availability (luôn trả lời được request)

## [objectives] Mục tiêu học tập

- Giải thích network partition (mạng bị chia cắt), vì sao khác với server (máy chủ) hỏng.
- Phân biệt strong consistency (nhất quán mạnh) với eventual consistency (nhất quán sau cùng), lấy ví dụ từ ứng dụng thường ngày.
- Giải thích lựa chọn của hệ thống có replica khi mạng chia cắt: trả lời bằng dữ liệu có thể cũ hoặc xung đột, hay từ chối trả lời — CAP (khi mạng bị chia cắt, chọn nhất quán hoặc sẵn sàng).
- Ước lượng chi phí thời gian của strong consistency qua nhiều region (vùng địa lý gồm các trung tâm dữ liệu), và số request bị từ chối khi chia cắt.
- Chọn consistency hoặc availability riêng cho mỗi tính năng, dựa trên hậu quả của câu trả lời sai.

### Thuật ngữ chính

- **Region.** Nhóm data center (trung tâm dữ liệu) ở một phần thế giới, như Mỹ hoặc châu Âu. Bản sao dữ liệu ở các region khác nhau cách xa nhau: một round trip (lượt đi và về) tốn hàng chục đến hàng trăm mili giây.
- **Network partition.** Sự cố mạng chia server thành các nhóm không liên lạc được với nhau, nhưng mỗi nhóm vẫn chạy và phục vụ người dùng riêng. Không phải crash: cả hai bên còn hoạt động và nhận request.
- **Strong consistency.** Mỗi lần đọc trả kết quả của lần ghi mới nhất đã hoàn tất, như chỉ có một bản dữ liệu. Còn gọi là linearizability (mọi lần đọc thấy lần ghi mới nhất).
- **Eventual consistency.** Các bản sao có thể khác nhau một lúc, nhưng khi ngừng ghi, mọi bản sao sẽ giống nhau. Một lần đọc có thể trả giá trị cũ.
- **Availability (theo nghĩa ở đây).** Mọi request đến server đang hoạt động đều nhận được câu trả lời, không phải lỗi, kể cả khi mạng chia cắt.
- **CAP.** Khi network partition xảy ra, hệ thống có replica phải chọn consistency (từ chối một số request để tránh câu trả lời cũ hoặc xung đột) hoặc availability (trả lời mọi request, chấp nhận dữ liệu cũ hoặc xung đột). Không có partition thì có thể có cả hai.
- **Conflict (xung đột dữ liệu).** Hai bản sao nhận các lệnh ghi khác nhau cho cùng dữ liệu khi không liên lạc được, như hai người mua ghế cuối, mỗi người ở một bên.
- **Home region (vùng duy nhất nhận lệnh ghi cho một dữ liệu).** Region duy nhất nhận ghi cho một phần dữ liệu, nên mọi lệnh ghi đến đó qua một nơi.

## [problem-hook] Vấn đề mở đầu

Ứng dụng bán vé chạy ở hai region, Mỹ và châu Âu, để mỗi người dùng liên lạc với data center gần mình. Mỗi region giữ bản đầy đủ dữ liệu; thay đổi được gửi sang region kia trong một phần giây.

Một chiều nọ, đường cáp biển giữa hai region hỏng trong 20 phút. Cả hai region vẫn hoạt động, đông người dùng; chỉ không liên lạc được với nhau. Buổi hòa nhạc còn một ghế. Người mua ở New York và Berlin cùng nhấn “Mua” khi mất kết nối. Cả hai region có nên bán? Chỉ một, hay không bên nào? Còn bộ đếm “1,203 người quan tâm” trên cùng trang, cũng không cập nhật qua đường đứt được, thì sao?

## [intuition] Cách hiểu trực quan

Hãy nghĩ về cửa hàng có hai chi nhánh dùng điện thoại chia sẻ một danh sách tồn kho. Bình thường, mỗi lần một chi nhánh bán hàng, nó gọi cho bên kia và hai danh sách khớp nhau.

Rồi đường điện thoại hỏng. Khách ở chi nhánh A hỏi áo khoác cuối. A có thể bán ngay và hy vọng B không bán cùng áo: vẫn available nhưng cả hai có thể bán cùng một chiếc. Hoặc A nói “chưa thể xác nhận đến khi đường dây hoạt động lại”: không bán trùng, nhưng khách rời đi mà không có áo. Không có lựa chọn thứ ba khi đường dây đứt.

Với áp phích “1,200 khách hàng hài lòng” ở cửa sổ, hai chi nhánh hiện số hơi khác nhau một lúc không sao. Mỗi bên tiếp tục đếm, rồi cộng phần đếm khi đường dây trở lại. Các phần khác nhau trong cùng cửa hàng nên chọn khác nhau.

**Liên hệ với SD 6.** Replication lag (độ trễ sao chép) đã cho thấy replica trả giá trị cũ. Eventual consistency chấp nhận chính hành vi ấy; strong consistency cam kết nó không xảy ra.

## [when-to-use] Khi nào nên dùng

- **Strong consistency:** câu trả lời sai hoặc cũ gây hại thực tế hoặc không thể hoàn tác: thanh toán và số dư, ghế hoặc sản phẩm cuối, username duy nhất, quyền truy cập sau khi thu hồi.
- **Eventual consistency:** giá trị cũ trong chốc lát không hại, duy trì hoạt động quan trọng hơn: số lượt thích/xem, bảng tin, đánh giá sản phẩm, bộ đếm người quan tâm, gợi ý.
- **Read-your-writes (luôn thấy thay đổi của chính mình) (SD 6):** người dùng phải thấy thay đổi của mình, người khác có thể thấy muộn hơn chút, như sửa hồ sơ.
- **Home region theo từng mục:** strong consistency cho nhiều mục mà không phải mọi lệnh ghi đều vượt đại dương, khi đa số người dùng của mục ở một region, như vé sự kiện bán tại nơi diễn ra.

## [template-code] Khung thiết kế

Bài này không có code. Dùng **khung thiết kế** sau cho từng tính năng:

```text
For each feature:
  1. What does a stale read cost? What does a conflicting write cost?
     (two sales of one seat vs a like count off by a few)
  2. During a partition: refuse (consistency) or answer (availability)?
  3. If consistency: where is the single place that decides?
     (one leader, or a home region per item) Who is refused during a partition?
     Cost without a partition: + one cross-region round trip per write,
     unless the deciding place is near the user.
  4. If availability: how do copies agree afterwards?
     (counts add up; last write wins only where losing a write is acceptable)
  5. Estimate: extra time per write, requests refused during a partition.
```

## [complexity] Chi phí và ước lượng

**Chi phí thời gian của strong consistency.** Lệnh ghi cần region kia xác nhận phải chờ ít nhất một round trip. Với round trip 90 ms giữa Mỹ và châu Âu và 5 ms xử lý cục bộ, lệnh ghi strongly consistent mất khoảng 5 + 90 = 95 ms; lệnh ghi eventually consistent chỉ do region cục bộ xác nhận mất khoảng 5 ms, region kia nhận muộn hơn một chút.

**Chi phí availability khi chia cắt.** Giả sử mọi vé có home ở Mỹ, 40% trong 200 lượt mua mỗi giây đến từ châu Âu. Trong partition 20 phút, châu Âu không đến được home region nên bị từ chối: 0.4 × 200 = 80 mỗi giây × 1,200 giây = **96,000** lượt bị từ chối. Nếu có home region theo sự kiện, chỉ người mua sự kiện có home ở bên kia bị từ chối.

**Chọn availability cũng có giá.** Nếu cả hai region tiếp tục bán khi chia cắt, mọi ghế cả hai cùng bán trở thành conflict phải sửa về sau, như hoàn tiền và xin lỗi.

| Tính năng | Hậu quả dữ liệu cũ hoặc xung đột | Chọn khi chia cắt | Thiết kế thường gặp |
| --- | --- | --- | --- |
| Ghế cuối, thanh toán, số dư | Bán trùng, mất tiền | Consistency | Một home region hoặc leader quyết định |
| Đăng ký username | Hai người cùng tên | Consistency | Một nơi kiểm tra duy nhất |
| Số lượt thích/xem | Số hơi sai | Availability | Đếm từng region rồi cộng |
| Bảng tin, đánh giá | Phiên bản cũ một lúc | Availability | Replicate asynchronously |

## [common-mistakes] Lỗi thường gặp

- **Nghĩ CAP luôn là “chọn hai trong ba”.** Không có partition thì hệ thống có thể vừa consistent vừa available; chỉ buộc chọn khi mạng chia cắt.
- **Một lựa chọn cho cả ứng dụng.** Làm lượt thích strongly consistent khiến mỗi lượt thêm một round trip mà không có lợi; làm thanh toán eventually consistent có thể mất tiền.
- **Coi partition như crash.** Server crash ngừng trả lời; khi partition, cả hai bên vẫn trả lời người dùng riêng, chính đó tạo conflict.
- **Dùng last write wins (lần ghi sau cùng thắng) cho mọi thứ.** Khi hai region đổi cùng dữ liệu, chỉ giữ lần ghi mới nhất âm thầm bỏ lần kia. Chấp nhận được với ảnh hồ sơ, không phù hợp với giỏ hàng hay số dư.
- **Quên thay đổi của chính người dùng.** Eventual consistency ổn với lượt thích của người khác, nhưng người vừa sửa bài mà thấy nội dung cũ sẽ nghĩ sửa thất bại (read-your-writes, SD 6).

## [edge-cases] Trường hợp đặc biệt

- **Partition trong một region.** Chia cắt cũng xảy ra giữa các data center hoặc rack cùng region; vẫn lựa chọn ấy, chỉ round trip ngắn hơn.
- **Đường truyền chậm trông như partition.** Nếu message mất 30 giây, hệ thống chờ bên kia thực tế không available; timeout quyết định lúc coi chậm là chia cắt.
- **Khôi phục kết nối sau partition.** Khi đường truyền trở lại, các bản sao trao đổi phần đã bỏ lỡ. Bộ đếm cộng lại; ghi xung đột vào cùng mục cần quy tắc hoặc người xử lý.
- **Đồng hồ không khớp.** “Lần ghi mới nhất” theo timestamp phụ thuộc đồng hồ các region, có thể lệch mili giây hoặc hơn, nên lần “mới nhất” có thể không phải lần thực sự xảy ra sau cùng.

### Mở rộng (không bắt buộc): PACELC, quorum và xử lý conflict

**PACELC (mở rộng của CAP: lúc bình thường chọn độ trễ hoặc nhất quán)** mở rộng CAP: nếu có **P**artition, chọn **A**vailability hoặc **C**onsistency; **E**lse (bình thường), chọn **L**atency thấp hoặc **C**onsistency. Nó gọi tên chi phí hằng ngày của strong consistency — round trip thêm — không chỉ partition hiếm gặp.

**Quorum (số bản sao tối thiểu phải đồng ý).** Với N bản sao, ghi chờ W bản và đọc hỏi R bản. Nếu W + R > N, mỗi lần đọc gặp ít nhất một bản có lần ghi mới nhất. Với N = 3, W = 2 và R = 2 cho 2 + 2 = 4 > 3; W = 1 và R = 1 nhanh hơn, nhưng 1 + 1 = 2 không lớn hơn 3, nên đọc có thể bỏ lỡ lần ghi mới nhất.

**Xử lý conflict.** Ngoài last write wins, một số dữ liệu gộp mà không mất gì: tập mục trong giỏ hàng có thể lấy hợp của hai bên, bộ đếm cộng phần tăng mỗi bên. Kiểu dữ liệu được thiết kế gộp như vậy gọi là CRDT (kiểu dữ liệu tự gộp được không mất thay đổi).

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** Ứng dụng bán vé cho sự kiện ở Mỹ và châu Âu, hiện bộ đếm “người quan tâm” trên mỗi trang sự kiện. 200 lượt mua đến mỗi giây, 40% từ châu Âu; khoảng 90% người mua chọn sự kiện trong region của mình. Lượt mua phải xác nhận trong 500 ms và không bao giờ bán một ghế hai lần. Khi các region kết nối, bộ đếm có thể cũ tối đa một phút; khi chia cắt có thể giữ dữ liệu cũ đến khi đường truyền trở lại. Round trip giữa region khoảng 90 ms; xử lý cục bộ khoảng 5 ms. Partition giữa region xảy ra vài lần mỗi năm, kéo dài tới 20 phút. Thiết kế hành vi từng tính năng khi bình thường và khi chia cắt.

**Lời giải:**

1. **Vé cần consistency.** Cần tránh bán một ghế hai lần, nên lúc chia cắt phải từ chối một số lượt mua thay vì mạo hiểm bán trùng.
2. **Home region theo sự kiện.** Ghế của mỗi sự kiện do region nơi diễn ra quyết định. Người mua cục bộ mất khoảng 5 ms; người ở bên kia đại dương chờ khoảng 5 + 90 = 95 ms. Cả hai trong 500 ms.
3. **Khi chia cắt.** Chỉ người mua có home của sự kiện ở bên kia bị từ chối: khoảng 10% của 200 = 20 lượt mỗi giây, 20 × 1,200 = 24,000 trong 20 phút, thay vì 96,000 nếu mọi home ở Mỹ. Họ thấy “chưa thể xác nhận lượt mua này, vui lòng thử lại sau ít phút”.
4. **Bộ đếm cần availability.** Mỗi region đếm lượt “quan tâm” cho mọi sự kiện, gửi phần đếm sang bên kia mỗi vài giây; trang hiện tổng. Khi chia cắt, mỗi region tiếp tục đếm rồi theo kịp khi kết nối lại. Bình thường bộ đếm cũ tối đa một phút; khi chia cắt có thể chậm hơn, không gây hại.
5. **Vé của chính người mua.** “Vé của tôi” đọc từ home region của sự kiện, nên khi đến được region đó, khách thấy lượt mua vừa thực hiện. Khi chia cắt, khách ở bên kia được báo “vui lòng thử lại” thay vì danh sách cũ.

**Kết quả:** Vé strongly consistent qua home region theo sự kiện, tốn tối đa một round trip 90 ms, từ chối khoảng 24,000 lượt trong partition 20 phút; bộ đếm người quan tâm eventually consistent, đếm hai region rồi cộng. Cùng trang dùng hai lựa chọn, một cho mỗi tính năng.
