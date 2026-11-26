# Partitioning (chia dữ liệu thành nhiều phần trên nhiều máy chủ) và consistent hashing (hash nhất quán trên vòng)

## [objectives] Mục tiêu học tập

- Giải thích vì sao chia database (cơ sở dữ liệu) thành nhiều partition (một phần dữ liệu) khi một server (máy chủ) không chứa hết dữ liệu hoặc không chịu được tải ghi.
- Ước lượng số partition cần từ cả dung lượng lưu trữ và tải ghi.
- Phân biệt range partitioning (chia theo khoảng giá trị) với hash partitioning (chia theo giá trị hash), chọn partition key (trường quyết định dữ liệu thuộc phần nào) từ cách đọc và ghi dữ liệu.
- Nhận biết hot partition (phần dữ liệu bị dồn tải) và hot key (khóa được truy cập rất nhiều), phân tán tải của chúng.
- Giải thích vì sao thêm server với “hash mod N” làm phần lớn khóa di chuyển, còn consistent hashing với virtual node (nút ảo) chỉ di chuyển một phần nhỏ.

### Thuật ngữ chính

- **Partitioning, còn gọi là sharding (chia dữ liệu theo shard).** Chia tập dữ liệu lớn thành nhiều phần, mỗi phần lưu trên server khác. Mỗi phần là một **partition** hay **shard (một phần dữ liệu nằm trên một máy chủ)**. Khác replication (sao chép dữ liệu sang nhiều máy chủ) (SD 6), nơi mỗi server giữ toàn bộ dữ liệu, shard chỉ giữ phần của nó.
- **Partition key, còn gọi là shard key (khoá quyết định shard).** Trường quyết định dòng thuộc shard nào, như `customer_id`.
- **Range partitioning.** Mỗi shard giữ một khoảng giá trị khóa, như đơn tháng Một trên một shard, tháng Hai trên shard kế tiếp, hoặc khách A–F và G–M.
- **Hash partitioning.** Khóa đi qua hàm hash (Level 3), hash quyết định shard, nên các khóa kề nhau rơi vào các shard khác nhau và tải phân bố đều.
- **Hot partition và hot key.** Shard nhận nhiều lưu lượng hơn hẳn các shard khác gọi là **hot**; thường một khóa, như tài khoản rất bận, gây ra việc này.
- **Scatter-gather (hỏi mọi shard rồi gộp kết quả).** Query (truy vấn) không có partition key phải hỏi mọi shard rồi gộp câu trả lời.
- **Resharding (chia lại shard).** Di chuyển dữ liệu giữa các shard khi thêm hoặc bớt shard.
- **Consistent hashing.** Đặt server và khóa lên hash ring (vòng giá trị hash); mỗi khóa thuộc server kế tiếp theo chiều kim đồng hồ. Thêm hoặc bớt server chỉ di chuyển các khóa cạnh nó.
- **Virtual node.** Một trong nhiều điểm trên vòng thuộc cùng server. Có nhiều điểm mỗi server thì phần khóa mỗi server nhận, cũng như phần khóa di chuyển, gần đều nhau.

## [problem-hook] Vấn đề mở đầu

Sàn thương mại điện tử giữ mọi đơn hàng trong một database. Hiện dữ liệu có 5 TB và nhận 30,000 đơn mới hoặc cập nhật đơn mỗi giây vào giờ cao điểm. Nhóm thêm read replica (bản sao dùng để phục vụ lệnh đọc) (SD 6), nhưng không giúp: mỗi replica áp dụng mọi lệnh ghi, còn riêng leader (máy chủ chính nhận mọi lệnh ghi) không theo kịp 30,000 lệnh ghi mỗi giây. Đĩa cũng sắp đầy.

Phải chia dữ liệu trên nhiều server, mỗi server giữ một phần. Nhưng quyết định đơn nào đi đâu thế nào để mỗi server nhận phần tải công bằng, vẫn tìm nhanh đơn của một khách, và thêm server năm sau không phải di chuyển mọi thứ?

## [intuition] Cách hiểu trực quan

Hãy nghĩ về thư viện đã chật tòa nhà. Nó mở năm chi nhánh. Một cách chia sách là theo nhan đề: A–E ở chi nhánh đầu, F–J ở chi nhánh tiếp, v.v. Đó là range partitioning. Tìm “mọi sách từ A đến C” dễ, nhưng nếu một bộ sách mới nổi tiếng bắt đầu bằng “H” xuất hiện, một chi nhánh nhận mọi khách.

Cách khác là cho mỗi sách một số từ công thức cố định dựa trên nhan đề, gửi đến chi nhánh “số mod 5”. Đó là hash partitioning: sách phân bố đều, nhưng tìm “mọi sách từ A đến C” nay phải ghé mọi chi nhánh.

Bây giờ mở chi nhánh thứ sáu. Đổi “mod 5” thành “mod 6” làm phần lớn sách đổi chi nhánh và phải chuyển đi. Consistent hashing khéo hơn: chi nhánh mới chỉ nhận một phần sách từ các chi nhánh bên cạnh, mọi sách khác ở nguyên chỗ.

**Liên hệ với Level 3.** Hàm hash biến khóa thành số trông ngẫu nhiên nhưng luôn giống nhau với cùng khóa. Hash map dùng nó chọn bucket; partitioning dùng chọn server.

## [when-to-use] Khi nào nên dùng

- **Partitioning:** dữ liệu không vừa một server hoặc tải ghi vượt sức một leader. Nếu chỉ đọc là vấn đề, replica hoặc cache (bộ nhớ đệm) (SD 3, SD 6) đơn giản hơn.
- **Hash partitioning:** phần lớn query tra một khóa, như “đơn của khách 42”, và cần phân bố tải đều.
- **Range partitioning:** query đọc khoảng, như “số đo từ 9:00 đến 10:00”, và khóa không khiến mọi lệnh ghi mới dồn vào một khoảng.
- **Partition key:** trường gần như mọi query đều có, với nhiều giá trị khác nhau có lưu lượng tương tự.
- **Consistent hashing:** thường thêm hoặc bớt server, di chuyển dữ liệu tốn kém, như cache và kho key-value lớn.

## [template-code] Khung thiết kế

Bài này không có code. Dùng **khung thiết kế** sau cho partitioning:

```text
1. Do you need it? Storage per server and writes per leader are the limits.
   Shards = max(total data / data per shard, total writes / writes per shard),
   rounded up, plus room to grow.
2. Partition key: which field do almost all queries include?
   Does it have many values with similar traffic?
3. Range or hash? Range keeps ranges together but can make one shard hot;
   hash spreads load but scatters range queries.
4. Hot keys: can one key exceed a shard's limit? Split it (for example,
   key#0..key#3). Its own shard helps only if one server can take its
   whole load.
5. Queries without the key: scatter-gather to every shard, or keep a
   separate index (see the extension).
6. Growth: consistent hashing with virtual nodes, so adding a server moves
   about 1/(N+1) of the keys.
7. Each shard still needs replicas and backups (SD 6).
```

## [complexity] Chi phí và ước lượng

**Số shard cần.** Server của mỗi shard chứa thoải mái khoảng 1 TB và xử lý an toàn khoảng 5,000 lệnh ghi mỗi giây. Với 5 TB và 30,000 lệnh ghi mỗi giây:

1. Lưu trữ: 5 TB ÷ 1 TB = 5 shard.
2. Ghi: 30,000 ÷ 5,000 = 6 shard.
3. Chọn kết quả lớn hơn: 6 shard, thêm chỗ cho tăng trưởng.

**Di chuyển khóa khi thêm shard.** Với “hash mod N”, khóa chỉ ở nguyên khi hash cho cùng số dư với N và N + 1. Từ 6 lên 7 shard, khoảng 1 khóa trong 7 thỏa điều này, nên khoảng **6 trong 7, 86%** tổng khóa di chuyển. Với consistent hashing, server mới chỉ nhận khoảng 1 ÷ 7 ≈ **14%** khóa, các khóa khác ở nguyên chỗ.

**Hot key.** Nếu một người bán lớn tạo 20% tổng đơn hàng, đó là 0.2 × 30,000 = 6,000 lệnh ghi mỗi giây trên một khóa, hơn mức 5,000 của một shard, dù có bao nhiêu shard. Tách khóa thành 4 sub-key (`seller42#0` đến `seller42#3`) cho khoảng 1,500 lệnh ghi mỗi giây mỗi sub-key, phân tán trên nhiều shard; đọc đơn của người bán đó sau này phải đọc 4 sub-key.

| Cách partitioning | Tra theo khóa | Query theo khoảng | Phân bố tải | Thêm shard |
| --- | --- | --- | --- | --- |
| Range | Một shard | Vài shard | Không đều nếu khóa mới dồn một chỗ | Tách một khoảng |
| Hash mod N | Một shard | Mọi shard | Đều | Phần lớn khóa di chuyển |
| Consistent hashing với virtual node | Một shard | Mọi shard | Đều | Khoảng 1/(N+1) khóa di chuyển |

## [common-mistakes] Lỗi thường gặp

- **Partitioning theo khóa mà mọi lệnh ghi mới dùng chung.** Range partitioning theo ngày dồn mọi đơn mới lên shard mới nhất: một shard hot, các shard khác rảnh.
- **Chọn khóa mà query không dùng.** Nếu shard key là `order_id` nhưng trang liệt kê “đơn của tôi”, mỗi lần tải phải scatter-gather qua mọi shard.
- **Dùng hash mod N rồi thêm server.** Phần lớn dữ liệu di chuyển cùng lúc, thường khi hệ thống đang bận.
- **Quên hot key.** Phân bố khóa đều không giúp khi chỉ một khóa đã mang tải vượt sức một shard.
- **Partitioning quá sớm.** Shard khiến transaction (giao dịch) qua nhiều khóa, join và backup (bản sao lưu) khó hơn. Nếu một server cùng replica và cache đã đủ, hãy chờ.

## [edge-cases] Trường hợp đặc biệt

- **Transaction qua hai shard.** Chuyển tiền giữa hai khách trên các shard khác nhau không còn là một database transaction. Giữ dữ liệu thay đổi cùng nhau trên cùng shard, hoặc xem SD 10.
- **Giá trị khóa không đều.** Nếu vài khách sở hữu phần lớn đơn, kể cả hash partitioning theo khách vẫn làm vài shard nóng hơn; đo rồi tách các khóa nặng nhất.
- **Một shard hỏng.** Chỉ dữ liệu của shard đó không khả dụng, không phải toàn bộ, nên mỗi shard giữ replica riêng (SD 6).
- **Di chuyển dữ liệu trong lúc phục vụ.** Khi resharding, dữ liệu khóa được chép sang shard mới trong khi shard cũ vẫn phục vụ; đọc và ghi phải đến đúng bản đến khi chuyển xong.

### Mở rộng (không bắt buộc): secondary index trên shard

Query theo trường khác partition key, như “đơn theo trạng thái”, có hai lựa chọn. **Local index (chỉ mục trong từng shard)** chỉ đánh chỉ mục các dòng của shard đó: ghi ở một shard nhưng query hỏi mọi shard. **Global index (chỉ mục chung được chia theo trường được đánh chỉ mục)** tự chia theo trường được đánh chỉ mục, nên query hỏi một index shard; đổi lại mỗi lệnh ghi có thể phải cập nhật index entry trên shard khác, chậm hơn và khó giữ đồng bộ.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** Ứng dụng chat lưu mọi message (thông điệp). Hiện có 20 TB, tăng khoảng 1 TB mỗi tháng. Giờ cao điểm ghi 60,000 message mỗi giây. Gần như mọi lần đọc hỏi message mới nhất của một cuộc trò chuyện; vài nhóm chat lớn nhận tới 2,000 message mỗi giây. Server của một shard chứa thoải mái khoảng 2 TB và ghi an toàn khoảng 10,000 lần mỗi giây. Nhóm thêm server vài lần mỗi năm. Hãy thiết kế partitioning cho năm tới.

**Lời giải:**

1. **Số shard.** Trong một năm, dữ liệu đạt 20 + 12 = 32 TB: 32 ÷ 2 = 16 shard cho lưu trữ. Ghi: 60,000 ÷ 10,000 = 6 shard. Lưu trữ quyết định: dự kiến 16 shard cuối năm, bắt đầu với 10 hôm nay (20 ÷ 2) rồi thêm khi dữ liệu tăng.
2. **Partition key.** Đọc hỏi message mới nhất của một cuộc trò chuyện, nên dùng `conversation_id`. Trong shard, message lưu theo cuộc trò chuyện và thời gian, nên “50 message mới nhất của cuộc trò chuyện 7” đọc một shard và một phần index (chỉ mục).
3. **Hash thay vì range.** Hash `conversation_id` phân bố cuộc trò chuyện đều. Range partitioning theo thời gian dồn mọi message mới, 60,000 mỗi giây, lên shard mới nhất.
4. **Hot key.** Nhóm chat bận nhất ghi 2,000 message mỗi giây, bằng một phần năm mức 10,000 của shard, nên chưa cần tách; nhóm theo dõi cuộc trò chuyện vượt khoảng 5,000.
5. **Tăng trưởng.** Consistent hashing với khoảng 100 virtual node mỗi server: thêm server thứ 11 di chuyển khoảng 1 ÷ 11 ≈ 9% cuộc trò chuyện, lấy đều từ cả mười server, thay vì 10 trong 11 (khoảng 91%) mà “hash mod N” sẽ di chuyển.
6. **Mỗi shard** có synchronous follower và backup (SD 6). Tìm mọi message của một người dùng phải hỏi mọi shard; ứng dụng chưa cần chức năng này.

**Kết quả:** Hash-partition message theo `conversation_id` bằng consistent hashing và virtual node, bắt đầu 10 shard rồi tăng đến khoảng 16 trong năm vì lưu trữ, không phải tải ghi, quyết định số lượng. Message của một cuộc trò chuyện ở cùng shard, không cuộc trò chuyện riêng lẻ nào vượt giới hạn shard, và thêm một server chỉ di chuyển khoảng một khóa trong N + 1.
