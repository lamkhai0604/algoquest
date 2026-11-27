# Observability và SLO (mục tiêu mức dịch vụ)

## [objectives] Mục tiêu học tập

- Mô tả log (dòng ghi sự kiện), metric (số đo theo thời gian) và trace (dấu vết một request qua các service (dịch vụ)) cho biết điều gì, và nên mở loại nào trước cho một câu hỏi cụ thể.
- Theo dõi một request qua nhiều service bằng request ID (mã định danh request) và trace.
- Đọc percentile (phân vị) p50, p95 và p99 latency (độ trễ), giải thích vì sao trung bình che giấu request chậm.
- Viết SLI (chỉ số mức dịch vụ) và SLO cho một tính năng, rồi đổi SLO thành error budget (ngân sách lỗi).
- Chọn alert dựa trên điều người dùng cảm nhận, và quyết định vấn đề phải diễn tiến nhanh đến đâu mới cần đánh thức người trực.

### Thuật ngữ chính

- **Log.** Dòng service ghi về một event, như “đơn 123 thất bại: thẻ bị từ chối”, kèm thời gian và chi tiết. Log cho biết điều xảy ra với một request.
- **Metric.** Con số đo theo thời gian, như request mỗi giây hoặc tỷ lệ thất bại. Metric ít tốn chi phí lưu và cho thấy xu hướng, nhưng không chỉ ra request bị ảnh hưởng.
- **Trace.** Đường đi của một request qua mọi service nó chạm đến, gồm các **span (một bước trong trace)**: mỗi bước một span, có thời điểm bắt đầu và thời lượng. Mọi span mang cùng **request ID**.
- **Percentile.** p95 latency là thời gian mà 95% request đạt hoặc nhanh hơn; p50 là request ở giữa, p99 là 1 request chậm nhất trong 100. Request chậm ở p99 trở lên gọi là **tail latency (độ trễ của nhóm request chậm nhất)**.
- **SLI (service level indicator).** Số đo điều người dùng cảm nhận, viết thành tỷ lệ event tốt, như tỷ lệ checkout thành công trong 2 giây.
- **SLO (service level objective).** Mục tiêu của SLI trong một khoảng thời gian, như 99.9% checkout tốt trong 30 ngày.
- **SLA (service level agreement) (cam kết mức dịch vụ trong hợp đồng).** Cam kết với khách trong hợp đồng, có hình phạt nếu không đạt. Thường lỏng hơn SLO để nhóm nhận ra vấn đề trước khi hợp đồng bị đe dọa.
- **Error budget.** Số event xấu SLO cho phép: với 99.9%, 0.1% request có thể xấu. Còn ngân sách thì nhóm có thể phát hành thay đổi; hết ngân sách thì ưu tiên reliability.
- **Burn rate (tốc độ tiêu ngân sách lỗi).** Tốc độ tiêu ngân sách so với tiêu đều trong khoảng thời gian. Burn rate 10 làm ngân sách 30 ngày hết trong 3 ngày.
- **Alerting on symptoms.** Đánh thức người trực vì điều người dùng cảm nhận, như checkout thất bại hoặc chậm, thay vì nguyên nhân như CPU (bộ xử lý) cao có thể gây hại hoặc không.

## [problem-hook] Vấn đề mở đầu

Cửa hàng trong SD 11 vượt qua đợt giảm giá, nhưng khách vẫn phản ánh checkout “đôi lúc rất chậm”. Dashboard cho thấy checkout trung bình 194 ms, có vẻ ổn. CPU ở 60%. Không có gì đỏ.

Nhóm không tái hiện được lỗi, không biết service nào trong sáu service gây ra, và tranh luận liệu có quan trọng không. Họ cần thấy request chậm bị trung bình che giấu, theo dõi một request qua các service và thống nhất thế nào là đủ tốt.

## [intuition] Cách hiểu trực quan

Hãy nghĩ về công ty giao hàng. **Metric** là báo cáo hằng ngày: 10,000 kiện, 98% đúng giờ. **Log** là sổ tài xế: “14:05, kiện 77, không ai ở nhà”. **Trace** là trang theo dõi một kiện: lấy hàng, trung tâm phân loại, xe tải, cửa nhà, kèm thời gian mỗi điểm. Khách phàn nàn thì mở trang theo dõi trước; báo cáo ngày chỉ cho biết có xu hướng hay không.

“98% đúng giờ” cũng giấu ai phải chờ. Nếu mọi kiện trễ đều tới một thị trấn, nơi ấy không hài lòng dù trung bình có vẻ tốt. Vì thế nhóm xem percentile, và công ty hứa “99% kiện trong 2 ngày” thay vì “trung bình 1.2 ngày”.

**Liên hệ với SD 5 và SD 11.** Request đi qua service và timeout (hết thời gian chờ) trong SD 5; availability (luôn trả lời được request) đo bằng nines (số chữ số 9 của độ sẵn sàng) ở SD 11 trở thành mục tiêu nhóm đo lường và sử dụng được.

## [when-to-use] Khi nào nên dùng

- **Metric:** xem xu hướng và alert: request rate, tỷ lệ lỗi, latency percentile, saturation như CPU hoặc độ dài queue (hàng đợi).
- **Trace:** tìm thời gian nằm ở đâu trong một request chậm qua nhiều service.
- **Log:** xem chi tiết một event, như thông báo lỗi, tìm bằng request ID từ trace.
- **Percentile thay vì trung bình:** khi latency quan trọng; xem p50 cho trải nghiệm thường gặp, p95 hoặc p99 cho nhóm chậm.
- **SLO và error budget:** cho từng tính năng người dùng phụ thuộc, để thống nhất mức đáng tin cậy và lúc cần giảm tốc thay đổi.
- **Page (cảnh báo gọi người trực):** chỉ khi người dùng đang bị ảnh hưởng và ngân sách sắp hết; vấn đề chậm hơn thành ticket trong giờ làm.

## [template-code] Khung thiết kế

Bài này không có code. Dùng **khung thiết kế** sau để quan sát một tính năng:

```text
1. What do users feel? Write the SLI as a share of good events, such as
   "checkout requests that succeed within 2 s", measured near the user.
2. Choose the SLO and window, such as 99.9% over 30 days.
   Error budget = (1 - SLO) x events in the window.
3. Metrics per service: rate, errors, p50 / p95 / p99 latency, saturation.
4. A request ID on every call; traces kept for every slow or failed
   request and a small share of the rest; logs that carry the request ID.
5. Alerts: page when the budget would be gone within hours or a day;
   a ticket when it would run out before the window ends.
6. Check the storage cost: events per second x bytes x seconds kept.
```

## [complexity] Chi phí và ước lượng

**Vì sao trung bình che giấu nhóm chậm.** Trong 100 checkout, 90 mất 100 ms, 8 mất 300 ms và 2 mất 4,000 ms. Trung bình là (90 × 100 + 8 × 300 + 2 × 4,000) ÷ 100 = 194 ms. Sắp xếp thì request thứ 50 mất 100 ms (p50), thứ 95 mất 300 ms (p95), thứ 99 mất 4,000 ms (p99). Trung bình không mô tả ai: đa số thấy 100 ms, còn 2 trong 100 chờ 4 giây.

**Vì sao nhóm chậm quan trọng hơn tưởng tượng.** Trang gọi 10 service, mỗi service chậm 1% thời gian, sẽ chậm khi bất kỳ service nào chậm: 1 − 0.99¹⁰ ≈ 0.096, khoảng 10% trang. Người dùng tải 100 trang gặp request chậm 1-trong-100 với xác suất 1 − 0.99¹⁰⁰ ≈ 63%.

**Error budget.** Trung bình 40 checkout mỗi giây, tháng 30 ngày có 40 × 2,592,000 ≈ 104 triệu checkout. SLO 99.9% cho phép 0.1% xấu: khoảng 104,000. Theo thời gian, 0.1% của 43,200 phút là khoảng 43 phút ngừng hoàn toàn.

**Burn rate.** Burn rate = tỷ lệ request xấu ÷ tỷ lệ SLO cho phép. Nếu 5% checkout xấu, burn rate là 5% ÷ 0.1% = 50; ngân sách 30 ngày tồn tại 30 ÷ 50 = 0.6 ngày, khoảng 14 giờ. Ngân sách hết trong 1 ngày khi burn rate từ 30 trở lên, tức từ 3% request xấu trở lên.

**Chi phí lưu.** Với 2,400 request mỗi giây, mỗi request một dòng log 1 KB tạo 2.4 MB mỗi giây, khoảng 207 GB một ngày. Trace lớn hơn nên nhóm giữ mọi trace chậm hoặc thất bại và phần nhỏ còn lại, như 1%. Metric nhỏ: một số cho mỗi phép đo vài giây một lần, bất kể lưu lượng.

| Tín hiệu | Trả lời | Chi phí | Điểm yếu |
| --- | --- | --- | --- |
| Metric | Có gì sai, từ khi nào? | Nhỏ, cố định | Không chỉ ra request nào |
| Trace | Request này tốn thời gian ở đâu? | Lớn; thường lấy mẫu | Trace lấy mẫu có thể bỏ lỡ trường hợp hiếm |
| Log | Chính xác điều gì xảy ra ở bước này? | Lớn; tăng theo lưu lượng | Khó tìm nếu thiếu request ID |

## [common-mistakes] Lỗi thường gặp

- **Chỉ xem trung bình.** Nó có thể đứng yên khi 1 trong 100 người dùng chờ nhiều giây. Hiện p50, p95 và p99 cạnh nhau.
- **Lấy trung bình percentile.** p99 của hai server (máy chủ) không phải trung bình p99 của chúng; tính từ mọi request hoặc số đếm gộp theo từng khoảng thời gian.
- **Alert theo nguyên nhân.** CPU ở 90% có thể nằm trong kế hoạch (SD 11) và không hại ai; đĩa đầy trên backup (bản sao lưu) server có thể quan trọng ngày mai nhưng chưa phải tối nay. Page theo triệu chứng người dùng cảm nhận; hiện nguyên nhân trên dashboard để giải thích.
- **SLO 100%.** Không còn ngân sách cho phát hành, lỗi dependency hoặc bảo trì; bản thân mạng của người dùng còn lỗi thường hơn mức đó.
- **Log không request ID.** Tìm dòng cho một request chậm qua sáu service thành đoán mò.

## [edge-cases] Trường hợp đặc biệt

- **Ít request.** Với 2 request mỗi phút, p99 của một giờ dựa trên khoảng một request. Dùng khoảng thời gian dài hơn hoặc đếm event xấu.
- **Đo sai chỗ.** Server ngừng hoạt động không báo gì nên metric riêng có vẻ sạch. Đo SLI ở nơi gần người dùng nhất, như load balancer (bộ cân bằng tải).
- **SLO của dependency.** Nếu checkout cần card provider có mục tiêu riêng 99.9%, SLO checkout 99.99% không thực tế nếu không có fallback (phương án dự phòng).
- **Lấy mẫu che giấu lỗi hiếm.** Giữ ngẫu nhiên 1% trace cũng chỉ giữ 1% nhóm chậm hiếm. Quyết định giữ trace sau khi thấy nó chậm hoặc thất bại.

### Mở rộng (không bắt buộc): thiết kế dashboard

Dashboard service tốt trả lời “có khỏe không, nếu không thì ở đâu?” trong vài giây. Đặt SLI trước: tỷ lệ request tốt và error budget còn lại. Sau đó là bốn **golden signals (bốn tín hiệu vàng)** cho mỗi service: **latency** (p50, p95, p99), **traffic** (request mỗi giây), **errors** (tỷ lệ thất bại), **saturation** (mức đầy tài nguyên bị giới hạn nhất, như CPU, worker (tiến trình xử lý công việc từ hàng đợi) hoặc queue). Dùng cùng khoảng thời gian cho mọi biểu đồ, đánh dấu lần phát hành trên trục thời gian và nối mỗi biểu đồ tới trace, log của service và thời gian đó.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** Checkout của cửa hàng nhận trung bình khoảng 40 request mỗi giây trong tháng, tối đa 100 lúc cao điểm. Nó gọi sáu service. Người dùng bỏ checkout mất hơn 2 giây. Tháng trước, 99.95% checkout thành công, và 99.8% vừa thành công vừa xong trong 2 giây. Khách nói checkout “đôi lúc rất chậm”, nhưng trung bình là 194 ms. Chọn SLI và SLO, tính error budget, chọn lúc page và tìm service chậm.

**Lời giải:**

1. **SLI.** “Tỷ lệ request checkout thành công trong 2 giây, đo ở load balancer.” Đếm cả thất bại và phản hồi chậm, hai điều người dùng cảm nhận, và đo gần họ.
2. **SLO.** Tháng trước 99.8% đạt SLI. Mục tiêu 99.9% trong 30 ngày đã bị trượt, nên nhóm bắt đầu ở 99.5%, mức đạt được và còn dư, rồi dự định siết sau khi sửa request chậm.
3. **Error budget.** 40 × 2,592,000 ≈ 104 triệu checkout mỗi tháng; 0.5% tương đương khoảng 518,000 checkout xấu. Tháng trước dùng 0.2%, nên 0.2 ÷ 0.5 = 40% ngân sách.
4. **Khi nào page.** Ngân sách hết trong 1 ngày ở burn rate 30: 30 × 0.5% = 15% checkout xấu. Page khi tỷ lệ xấu của giờ gần nhất trên 15%; tạo ticket khi tỷ lệ của ngày gần nhất trên 0.5%, mức sẽ tiêu hết ngân sách tháng trước khi tháng kết thúc.
5. **Tìm service chậm.** p50 checkout là 100 ms nhưng p99 là 4,000 ms. Trace giữ cho checkout chậm cho thấy thời gian nằm ở Payment service, chờ card provider; log cùng request ID cho thấy retry (thử lại) sau timeout. Cách sửa thuộc SD 11: timeout ngắn hơn và một retry có jitter (độ lệch ngẫu nhiên thêm vào thời gian chờ).

**Kết quả:** SLI: checkout thành công trong 2 giây, ở load balancer. SLO: tạm thời 99.5% trong 30 ngày, cho khoảng 518,000 checkout xấu, tháng trước dùng 40%. Page khi hơn 15% checkout trong một giờ xấu; tạo ticket khi tỷ lệ ngày vượt 0.5%. Trace checkout chậm chỉ ra lời gọi card provider trong Payment.
