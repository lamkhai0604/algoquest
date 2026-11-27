# Reliability, overload (quá tải) và autoscaling (tự động thêm bớt server)

## [objectives] Mục tiêu học tập

- Đổi mục tiêu availability (luôn trả lời được request) thành thời gian ngừng hoạt động cho phép, và tính availability của các bộ phận đều cần hoạt động hoặc dự phòng cho nhau.
- Bảo vệ server (máy chủ) trước dependency chậm bằng timeout (hết thời gian chờ), và retry (thử lại) mà không làm lỗi nặng thêm: ít lần thử, backoff có jitter (độ lệch ngẫu nhiên thêm vào thời gian chờ) và retry budget (ngân sách thử lại).
- Giải thích điều xảy ra khi số request đến nhiều hơn số server xử lý xong, và chọn giữa load shedding (chủ động từ chối bớt tải) và graceful degradation (giảm chức năng có kiểm soát).
- Lập kế hoạch autoscaling: điều kiện kích hoạt, độ trễ trước khi server mới giúp được và số tối đa ngân sách cho phép.
- Mô tả rate limiting (giới hạn số request) như cách ngăn một client (máy khách (chương trình gửi yêu cầu)) dùng hết tài nguyên chung.

### Thuật ngữ chính

- **Availability.** Tỷ lệ thời gian service (dịch vụ) trả lời đúng. Thường viết bằng số **nines (số chữ số 9 của độ sẵn sàng)**: 99.9% (“ba số chín”) cho phép ngừng hoạt động khoảng 43 phút trong tháng 30 ngày.
- **Redundancy (dự phòng bằng nhiều bản sao).** Chạy hai bản sao trở lên của một bộ phận để một bản có thể lỗi trong khi bản khác tiếp tục phục vụ, như nhiều server sau load balancer (bộ cân bằng tải) (SD 2).
- **Timeout.** Thời gian tối đa bên gọi chờ câu trả lời trước khi bỏ cuộc (SD 5).
- **Backoff và jitter.** Chờ lâu hơn trước mỗi lần retry mới (backoff), cộng khoảng ngẫu nhiên vào mỗi lần chờ (jitter) để nhiều client không retry cùng lúc.
- **Retry storm (bão thử lại).** Retry từ nhiều bên gọi, hoặc từ nhiều tầng cùng lúc, làm tăng tải lên service vốn đang lỗi.
- **Retry budget.** Giới hạn retry theo tỷ lệ request bình thường, như tối đa 10%, để retry không nhân tải lên service đang gặp khó khăn.
- **Overload.** Request đến nhiều hơn số server xử lý xong nên request chờ tích tụ.
- **Load shedding.** Từ chối nhanh một số request với lời nhắn “thử lại sau ít phút”, để server hoàn tất phần còn lại đúng hạn.
- **Graceful degradation.** Tắt công việc không bắt buộc, như gợi ý, để mỗi request tốn ít tài nguyên hơn và tính năng quan trọng vẫn chạy.
- **Autoscaling.** Tự động thêm hoặc bớt server khi chỉ số như CPU (bộ xử lý) trung bình vượt mục tiêu.
- **Scale-out delay (độ trễ khi thêm server).** Thời gian từ lúc quyết định thêm server đến khi server ấy nhận request: phát hiện tải tăng, khởi động server và vượt qua health check (kiểm tra tình trạng hoạt động).
- **Rate limiting.** Giới hạn số request một client được gửi trong một khoảng thời gian, từ chối phần dư với “quá nhiều request”.

## [problem-hook] Vấn đề mở đầu

Cửa hàng trong SD 2 chạy sáu server sau load balancer. Mỗi server xử lý xong khoảng 300 request mỗi giây, và nhóm giữ tải gần 65% mức đó.

Tối giảm giá, card provider chậm đi, rồi lưu lượng tăng lên 2,400 request mỗi giây. Trong một phút, mọi server đều bận, trang mất mười giây, và điện thoại retry mỗi lần nhấn thất bại ba lần, khiến tình hình nặng hơn. Autoscaler khởi động server mới, nhưng cần bốn phút chúng mới tới. Không có gì hỏng, cửa hàng vẫn ngừng phục vụ: không có kế hoạch cho dependency chậm hoặc tải vượt khả năng.

## [intuition] Cách hiểu trực quan

Hãy nghĩ đến nhà hàng đông khách. Bếp nấu được số món cố định mỗi giờ. Khi khách đến nhiều hơn khả năng phục vụ, xếp chỗ cho tất cả chỉ làm mọi bàn chờ lâu hơn, đến khi khách bỏ đi trước lúc món ăn tới. Người đón khách giỏi làm ba việc. Đưa thực đơn ngắn hơn, nấu nhanh hơn (graceful degradation). Báo đúng thời gian chờ hoặc mời khách mới quay lại sau thay vì xếp chỗ (load shedding). Gọi thêm đầu bếp, biết người đó cần 45 phút để tới (scale-out delay).

Khách hỏi phục vụ “xong chưa?” mỗi phút không làm bếp nhanh hơn mà làm chậm đi. Retry cũng vậy: một lần retry có thể cứu request, nhưng nhiều retry từ nhiều bên cùng lúc tạo thêm tải lên hệ thống vốn đang khó khăn.

**Liên hệ với SD 2, SD 5 và SD 7.** Server, load balancer và health check từ SD 2; timeout từ SD 5; retry có backoff từ SD 7. Bài này nói về điều xảy ra khi các bộ phận ấy chịu áp lực.

## [when-to-use] Khi nào nên dùng

- **Redundancy:** cho mọi bộ phận mà lỗi của nó làm service ngừng hoạt động, như server và load balancer, miễn các bản sao lỗi độc lập.
- **Timeout cho mọi lời gọi service khác:** luôn cần. Đặt cao hơn một chút so với phản hồi bình thường chậm nhất, nhưng thấp hơn thời gian bên gọi có thể chờ.
- **Retry:** chỉ cho lỗi có thể thành công ngay sau đó, chỉ với request lặp lại an toàn (SD 7), ở một tầng, vài lần, có backoff và jitter.
- **Graceful degradation:** khi một phần request không bắt buộc và chiếm phần đáng kể công việc, như gợi ý hoặc bộ đếm trực tiếp.
- **Load shedding:** khi server vẫn không theo kịp sau khi giảm chức năng; từ chối phần dư sớm, ít tốn kém, bắt đầu từ request ít quan trọng nhất.
- **Autoscaling:** khi tải thay đổi theo phút hoặc giờ; với bước nhảy đột ngột, cần thêm tài nguyên dự phòng hoặc scale trước sự kiện biết trước, vì server mới tới muộn.
- **Rate limiting:** khi một client hoặc lỗi trong một client có thể lấy tài nguyên người khác cần.

## [template-code] Khung thiết kế

Bài này không có code. Dùng **khung thiết kế** sau để duy trì reliability dưới áp lực:

```text
1. Availability: which parts must all work? Multiply their availability.
   Which have a copy? 1 - (chance one copy is down) x (chance the other is).
   Add copies where one part limits the whole.
2. Every call to another service: a timeout a little above the slowest
   normal answer. Busy workers = requests per second x seconds each waits.
3. Retries: one layer only, a few attempts, backoff with jitter, a retry
   budget (such as 10% of requests), and only for safe requests.
4. Capacity: servers x limit per server. If more arrives, decide what to
   turn off first (degrade), then what to refuse quickly (shed).
5. Autoscaling: the trigger, the delay until new servers help, the
   maximum number of servers that cost allows, and what covers the gap.
6. Rate limits: per client, so one client cannot use up shared capacity.
```

## [complexity] Chi phí và ước lượng

**Nines dưới dạng thời gian ngừng hoạt động.** Tháng 30 ngày có 30 × 24 × 60 = 43,200 phút. Ở 99%, service được ngừng 1% khoảng đó, 432 phút (khoảng 7 giờ); ở 99.9%, 43.2 phút; ở 99.99%, khoảng 4.3 phút. Mỗi số chín thêm vào giảm thời gian ngừng cho phép mười lần.

**Bộ phận đều phải hoạt động (nối tiếp).** Nếu request cần tầng server và database (cơ sở dữ liệu) thì cả hai phải hoạt động: nhân với nhau. Một server ở 99.9% và database ở 99.9% cho toàn hệ thống 0.999 × 0.999 ≈ 0.998, hay 99.8%: khoảng 86 phút ngừng mỗi tháng, gấp đôi từng bộ phận.

**Bộ phận dự phòng cho nhau (song song).** Hai server, mỗi cái ở 99.9%, chỉ cùng ngừng khi cả hai lỗi: 0.001 × 0.001 = 0.000001, nên tầng hoạt động 99.9999% thời gian. Điều này chỉ đúng nếu các bản sao lỗi độc lập và load balancer chuyển lưu lượng trong vài giây; hai bản trên cùng máy hoặc cùng bản phát hành lỗi sẽ hỏng cùng nhau.

**Request giữ worker (tiến trình xử lý công việc từ hàng đợi) bao lâu.** Số worker bận xấp xỉ request mỗi giây × số giây mỗi request mất. Với 50 request thanh toán mỗi giây, lời gọi treo 30 giây cần 50 × 30 = 1,500 worker; timeout 300 ms chỉ cần tối đa 50 × 0.3 = 15.

**Retry nhân lên thế nào.** Ba tầng, mỗi tầng thử tối đa 3 lần, có thể làm một hành động người dùng tới tầng cuối 3 × 3 × 3 = 27 lần lúc lỗi. Retry budget 10% giữ tải tăng thêm ở khoảng 1.1 lần bình thường.

**Queue (hàng đợi) tăng khi overload.** Nếu 2,400 request mỗi giây tới, server xử lý xong 1,800, hàng chờ tăng 600 mỗi giây. Sau 10 giây có 6,000 đang chờ, request mới chờ khoảng 6,000 ÷ 1,800 ≈ 3.3 giây trước khi bắt đầu.

| Phản ứng khi quá nhiều tải | Ai bị ảnh hưởng | Chi phí | Giới hạn |
| --- | --- | --- | --- |
| Graceful degradation | Mọi người, nhẹ (không có gợi ý) | Trang ít chức năng hơn tạm thời | Chỉ tiết kiệm được phần công việc không bắt buộc |
| Load shedding | Phần bị từ chối, mạnh | Những người đó phải thử lại | Phải từ chối sớm, ít tốn kém |
| Autoscaling | Không ai, khi server đã tới | Tiền cho từng server thêm | Scale-out delay và số server tối đa |
| Đưa tất cả vào queue | Mọi người, ngày càng nhiều | Chờ tăng đến khi request timeout | Chỉ dành cho đợt tăng ngắn |

## [common-mistakes] Lỗi thường gặp

- **Không timeout hoặc timeout rất dài.** Dependency chậm giữ mọi worker, và cả trang không gọi nó cũng ngừng hoạt động.
- **Retry ở mọi tầng.** Ba tầng với ba lần thử mỗi tầng biến một request lỗi thành 27. Retry ở một tầng và để các tầng khác fail fast (báo lỗi ngay).
- **Retry vào thời điểm cố định.** Một nghìn client lỗi cùng lúc và cùng retry sau đúng 100 ms sẽ lại tới cùng lúc. Thêm jitter.
- **Để queue hấp thụ overload.** Hàng chờ tăng vô hạn làm mọi request trễ; khi request bắt đầu, người dùng đã bỏ cuộc.
- **Mong autoscaling bắt kịp tải tăng đột ngột.** Server mới tới sau vài phút. Giữ tài nguyên dự phòng, scale trước sự kiện biết trước, giảm chức năng hoặc từ chối bớt đến khi chúng tới.
- **Autoscaling không có mức tối đa.** Lỗi hoặc tấn công có thể thêm server đến khi hóa đơn, chứ không phải người dùng, trở thành vấn đề.

## [edge-cases] Trường hợp đặc biệt

- **Dependency vẫn hoạt động nhưng chậm.** Trả lời chậm còn tệ hơn báo lỗi: lỗi trả ngay, lời gọi chậm giữ worker. Coi timeout là thất bại cho bên gọi, nhưng nhớ công việc có thể đã xảy ra (SD 7).
- **Health check đánh lừa.** Server có health check chỉ hỏi “tiến trình còn chạy không?” vẫn được nhận lưu lượng trong khi mọi lời gọi database đều timeout. Health check nên thử thứ server cần để làm việc thật, nhưng bản thân không phụ thuộc mọi service khác.
- **Scale nhầm bộ phận.** Nếu database là giới hạn, thêm server gửi thêm query (truy vấn) vào nó và làm tình hình nặng hơn. Tìm phần đã đầy trước khi thêm bản sao.
- **Từ chối không miễn phí.** Request bị từ chối vẫn tốn chút công việc; từ chối ở load balancer hoặc ngay đầu request giữ chi phí nhỏ.

### Mở rộng (không bắt buộc): circuit breaker (cầu dao ngắt cuộc gọi)

**Circuit breaker** đứng trước lời gọi tới một dependency và có ba trạng thái. **Closed:** cho lời gọi đi qua và đếm lỗi. Khi lỗi vượt ngưỡng, như nửa trong 20 lời gọi gần nhất, nó chuyển sang **open:** trong thời gian định sẵn, như 30 giây, báo lỗi ngay mọi lời gọi mà không gọi dependency, để bên gọi không chờ và dependency được nghỉ. Sau đó chuyển sang **half-open (trạng thái nửa mở):** cho vài lời gọi thử qua. Thành công thì đóng lại; thất bại thì mở thêm một khoảng. Breaker là timeout và retry budget có trí nhớ: sau nhiều lỗi, nó ngừng thử một lúc.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** Cửa hàng trong SD 2: giới hạn một server khoảng 300 request mỗi giây, mục tiêu là 65% mức đó (195), và 6 server gánh cao điểm bình thường 900. Đợt giảm giá dự kiến tăng tới 2,400 request mỗi giây trong một phút và giữ 30 phút. Autoscaler thêm server khi CPU trung bình giữ trên 65% trong 1 phút; server mới cần 4 phút để khởi động và vượt health check. Ngân sách cho tối đa 10 server. Hiện gợi ý chiếm một phần ba công việc mỗi request: tắt đi làm giới hạn server tăng lên khoảng 450 request mỗi giây. Điện thoại bỏ cuộc sau khi người dùng chờ 2 giây. Lập kế hoạch đợt giảm giá.

**Lời giải:**

1. **Khả năng hiện tại.** 6 server × 300 = 1,800 request mỗi giây ở giới hạn, so với 2,400 thì thiếu 600 mỗi giây.
2. **Nếu không làm gì.** Hàng chờ tăng 600 mỗi giây; sau khoảng 6 giây, request mới đã chờ 3,600 ÷ 1,800 = 2 giây, nên phần lớn người dùng bỏ cuộc trong khi server vẫn xử lý request của họ. Điện thoại lại retry, tăng tải.
3. **Khoảng trống.** Autoscaling khởi động sau 1 phút trên mục tiêu, server mới tới 4 phút sau: khoảng 5 phút chỉ có 6 server.
4. **Giảm chức năng trong khoảng trống.** Tắt gợi ý tăng giới hạn lên 6 × 450 = 2,700 mỗi giây, cao hơn 2,400: mỗi server chạy ở 2,400 ÷ 6 = 400, hay 89% của 450. Không cần từ chối ai.
5. **Sau scale.** Ở mục tiêu 65%, 2,400 ÷ 195 ≈ 12.3 nên cần 13 server, nhưng ngân sách cho 10. Với 10 server, mỗi cái nhận 240 request mỗi giây, 80% của 300: trên mục tiêu nhưng dưới giới hạn, nên có thể bật gợi ý lại.
6. **Vượt kế hoạch.** Nếu lưu lượng vượt khả năng 10 server, từ chối phần dư ở load balancer với “thử lại sau một phút”, ưu tiên checkout trước xem hàng. Điện thoại retry với backoff và jitter, tối đa hai lần.
7. **Tốt hơn nữa.** Biết trước thời gian giảm giá nên nhóm có thể scale lên 10 server trước khi bắt đầu 10 phút và tránh hoàn toàn khoảng trống.

**Kết quả:** Scale lên mức ngân sách 10 server trước giảm giá; nếu tải tăng bất ngờ, tắt gợi ý trong 5 phút chờ server mới (6 × 450 = 2,700 ≥ 2,400). Sau scale, 10 server chạy ở 80% giới hạn. Phần vượt mức bị từ chối sớm, client retry vài lần có jitter.
