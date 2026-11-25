# Cache và CDN

## [objectives] Mục tiêu học tập

- Giải thích vì sao cache (bộ nhớ đệm) giúp đọc nhanh hơn và giảm tải cho database (cơ sở dữ liệu).
- Theo dõi từng bước của cache-aside (đọc bộ nhớ đệm trước, thiếu thì lấy từ cơ sở dữ liệu): điều gì xảy ra khi cache hit / cache miss (tìm thấy / không tìm thấy trong bộ nhớ đệm).
- Tính thời gian đọc trung bình và tải database từ hit rate (tỉ lệ tìm thấy trong bộ nhớ đệm).
- Chọn TTL (time to live) (thời gian sống của dữ liệu trong bộ nhớ đệm), giải thích stale data (dữ liệu cũ) và cách xóa mục cache khi ghi để xử lý dữ liệu cũ.
- Giải thích CDN (mạng phân phối nội dung) làm gì và khi nào hữu ích.

### Thuật ngữ chính

- **Database (giới thiệu ban đầu).** Chương trình lưu dữ liệu trên đĩa và trả lời các câu hỏi về dữ liệu, chẳng hạn "sản phẩm có id 42". Nó giữ dữ liệu an toàn, nhưng mỗi lần đọc mất vài mili giây. SD 4 dạy đầy đủ về database.
- **Cache.** Bản sao dữ liệu có thể truy cập nhanh, được giữ gần nơi cần dùng, thường trong bộ nhớ, để không phải đọc lại bản gốc chậm hơn.
- **In-memory store (kho dữ liệu trong bộ nhớ (RAM)).** Chương trình giữ dữ liệu trong RAM và trả lời yêu cầu đọc trong thời gian ngắn hơn nhiều so với một mili giây trên cùng máy; nếu chạy trên server (máy chủ) khác thì cộng thêm một round trip (lượt đi và về) qua mạng. Cache dùng chung thường là in-memory store.
- **Cache key (khóa của bộ nhớ đệm).** Tên dùng để lưu một giá trị, chẳng hạn `product:42`. Cache hoạt động giống hash map ở Level 3: tra khóa, lấy giá trị.
- **Cache hit và cache miss.** Hit nghĩa là khóa có trong cache. Miss nghĩa là không có, nên phải đọc dữ liệu từ database.
- **Hit rate.** Tỉ lệ các lần đọc là hit. Hit rate 90% nghĩa là 9 trong mỗi 10 lần đọc được cache phục vụ.
- **Cache-aside.** Cách dùng cache phổ biến nhất: server kiểm tra cache trước; khi miss, server đọc database rồi đưa kết quả vào cache cho lần sau.
- **TTL (time to live).** Thời gian một mục có thể ở trong cache trước khi bị loại bỏ, tính từ lúc mục được lưu. Sau TTL, lần đọc tiếp theo là miss và lấy dữ liệu mới.
- **Stale data.** Giá trị trong cache cũ hơn giá trị trong database.
- **Invalidation (xóa hoặc làm mới dữ liệu đệm).** Xóa hoặc thay thế mục cache vì bản gốc đã thay đổi.
- **CDN (content delivery network).** Các server ở nhiều thành phố giữ bản sao tệp, chẳng hạn ảnh, để người dùng tải từ thành phố gần mình. Mỗi server như vậy là một **edge server (máy chủ biên (máy chủ CDN gần người dùng))**. Khi bản sao ở edge hết hạn, edge hỏi origin server (máy chủ gốc) vào lần yêu cầu tệp tiếp theo; nếu tệp không đổi, origin có thể chỉ xác nhận và edge giữ bản sao hiện có.
- **Origin server.** Server giữ các tệp gốc; CDN hỏi nó khi edge server không có bản sao.

## [problem-hook] Vấn đề mở đầu

Trang sản phẩm của một cửa hàng trực tuyến được đọc 5,000 lần mỗi giây vào peak (lúc cao điểm (peak traffic: lưu lượng cao điểm)). Mỗi lần đọc đều hỏi database về tên, giá và số lượng tồn kho của sản phẩm. Database có thể trả lời khoảng 1,000 lần đọc mỗi giây trước khi chậm đi, nên vào giờ cao điểm, yêu cầu phải xếp hàng và trang mất vài giây mới tải xong.

Phần lớn trong 5,000 lần đọc này hỏi về cùng vài trăm sản phẩm phổ biến, trong khi thông tin sản phẩm chỉ thay đổi vài lần mỗi ngày. Đọc đi đọc lại dữ liệu không đổi từ database chính là phần công việc lãng phí mà cache loại bỏ.

## [intuition] Cách hiểu trực quan

Quay lại nhà hàng ở SD 1. Kho (database) giữ mọi thứ, nhưng nằm ở phía sau và đầu bếp phải xếp hàng tại cửa kho. Phần lớn món ăn dùng cùng một vài nguyên liệu, nên bếp đặt chúng trên quầy cạnh bếp nấu (cache). Đầu bếp nhìn trên quầy trước. Có nguyên liệu thì là hit: nhanh. Không có thì là miss: đầu bếp đi đến kho rồi đặt một ít nguyên liệu lên quầy cho đơn tiếp theo.

Quầy nhỏ, và thức ăn trên quầy có thể bị cũ. Vì vậy, bếp ghi thời gian được giữ cho mỗi món (TTL); khi kho nhận một đợt nguyên liệu mới, phần cũ trên quầy được bỏ đi (invalidation).

**Liên hệ với Level 3.** Cache là một hash map rất lớn được nhiều server dùng chung: đưa khóa vào, lấy giá trị ra, với thời gian gần như không đổi.

## [when-to-use] Khi nào nên dùng

Cache hữu ích khi:

- Cùng một dữ liệu được đọc thường xuyên hơn nhiều so với số lần thay đổi (nhiều lần đọc cho mỗi lần ghi).
- Một nhóm nhỏ mục nhận phần lớn yêu cầu đọc, nên cache nhỏ vẫn giữ được phần lớn dữ liệu được hỏi đến.
- Có thể chấp nhận dữ liệu hơi cũ trong một khoảng thời gian ngắn, xác định trước, hoặc mỗi thay đổi đều có thể xóa bản sao trong cache.

CDN hữu ích khi nhiều người dùng ở xa origin server tải cùng các tệp (ảnh, video, script).

### Đặt cache ở đâu

| Vị trí | Giữ dữ liệu gì | Dùng chung bởi |
| --- | --- | --- |
| Trình duyệt | Tệp và phản hồi người dùng đã tải, cho những lần truy cập lại | Một người dùng |
| CDN edge server | Tệp giống nhau cho mọi người, được đặt gần người dùng | Mọi người gần edge đó |
| Cache của ứng dụng | Dữ liệu server đọc hoặc tính toán, chẳng hạn thông tin sản phẩm; nằm trong bộ nhớ riêng của từng server hoặc trong in-memory store dùng chung | Một server, hoặc mọi server |
| Cache bên trong database | Các trang dữ liệu vừa đọc, ở bên trong database (SD 4) | Mọi query (truy vấn) |

Các phép tính trong bài này áp dụng cho cache dùng chung của ứng dụng.

### Thay tệp phía sau CDN: tên tệp có phiên bản

CDN lưu tệp theo URL. Nếu ảnh thay đổi nhưng giữ nguyên URL, edge server giữ bản sao cũ đến khi hết hạn. Một cách sửa phổ biến là **versioned file name (tên tệp có phiên bản)**: ảnh mới có tên mới, chẳng hạn `photo-42-v1.jpg` thành `photo-42-v2.jpg`. Với CDN, đây là khóa mới nên không edge nào có bản sao cũ của nó. Trang phải liên kết đến tên mới: người dùng thấy ảnh mới ngay khi trang hoặc dữ liệu sản phẩm họ tải chứa liên kết mới, nên độ mới của trang quyết định thay đổi đến với người dùng nhanh đến đâu.

Hãy cẩn thận khi một giá trị phải luôn chính xác ngay lúc nó thay đổi, chẳng hạn số dư tài khoản ngay sau khi chuyển tiền; những lần đọc này thường đi đến database.

## [template-code] Mẫu thiết kế

Bài này không có mã chương trình. Dùng **mẫu thiết kế** sau cho cache-aside:

```text
Đọc giá trị với khóa K:
  1. Tra K trong cache.
  2. Hit: trả về giá trị trong cache.
  3. Miss: đọc giá trị từ database,
           lưu vào cache dưới khóa K với một TTL,
           trả về giá trị.

Thay đổi giá trị với khóa K:
  1. Ghi giá trị mới vào database.
  2. Xóa K khỏi cache để lần đọc tiếp theo lấy giá trị mới.

Với mỗi mục được lưu trong cache, ghi lại:
  - Khóa và TTL của mục đó.
  - Dữ liệu được phép cũ bao lâu, và điều gì xóa mục khi nó thay đổi.
  - Điều gì xảy ra với database nếu cache rỗng.
```

## [complexity] Chi phí và giới hạn

**Chi phí và giới hạn** của cache:

- **Latency (độ trễ).** Một hit mất khoảng thời gian của một round trip đến cache server (khoảng 1 ms trong cùng data center (trung tâm dữ liệu), số gần đúng). Một miss mất thời gian tra cache cộng với thời gian đọc database.
- **Tải database.** Chỉ miss mới đến database. Với R lần đọc mỗi giây và hit rate h, database nhận R × (1 − h) lần đọc mỗi giây.
- **Bộ nhớ.** Cache phải giữ các mục được truy cập nhiều. Bộ nhớ đắt hơn đĩa, nên cache giữ một phần dữ liệu thay vì toàn bộ.
- **Độ mới.** TTL dài hơn cho nhiều hit hơn nhưng dữ liệu cũ hơn; TTL ngắn hơn cho dữ liệu mới hơn nhưng nhiều miss hơn.

**Thời gian đọc trung bình.** Nếu một hit mất c ms, một miss mất c + d ms (tra cache cộng đọc database), và hit rate là h:

average = h × c + (1 − h) × (c + d)

Ví dụ với c = 1 ms, d = 20 ms và h = 90% (0.9):

1. Hit: 0.9 × 1 = 0.9 ms.
2. Miss: 0.1 × (1 + 20) = 0.1 × 21 = 2.1 ms.
3. Trung bình: 0.9 + 2.1 = 3.0 ms, so với 20 ms khi mọi lần đọc đều đến database.

## [common-mistakes] Lỗi thường gặp

- **Lưu cache mà không có kế hoạch xử lý thay đổi.** Không có TTL và invalidation, giá đã thay đổi có thể sai trong cache mãi mãi.
- **Lưu cache cho dữ liệu phải chính xác.** Số dư tài khoản hoặc ghế cuối cùng của buổi hòa nhạc không nên được đọc từ cache có thể cũ.
- **Cập nhật cache trước database.** Nếu sau đó ghi database thất bại, cache sẽ hiển thị giá trị chưa từng được lưu. Ghi database trước rồi xóa mục cache.
- **Quên trường hợp cache rỗng.** Sau khi khởi động lại, cache rỗng và mọi lần đọc đều miss. Hoặc database chịu được toàn bộ tải đọc, hoặc dịch vụ phải giới hạn số lần đọc đến database trong lúc cache đầy trở lại.
- **Đặt CDN trước trang cá nhân.** Trang khác nhau cho từng người dùng (chẳng hạn "đơn hàng của tôi") không được lưu cache rồi hiển thị cho người khác.

## [edge-cases] Trường hợp đặc biệt

- **Lệnh xóa bị mất.** Nếu server gặp sự cố sau khi ghi database nhưng trước khi xóa mục cache, giá trị cũ còn lại đến khi TTL kết thúc. Đây là lý do TTL vẫn hữu ích dù mỗi lần ghi đều xóa mục cache.
- **Đọc và ghi cùng lúc.** Một lần đọc có thể miss và lấy giá trị cũ từ database ngay trước khi một lần ghi thay đổi nó. Lần ghi sau đó xóa mục cache, rồi lần đọc chậm mới lưu giá trị cũ với TTL mới. TTL tính từ lúc mục được lưu, không phải lúc giá trị được đọc, nên giá trị cũ có thể tồn tại trong khoảng TTL cộng thời gian lần đọc đã mất. Để giữ cam kết về độ mới, chọn TTL + thời gian đọc dài nhất ≤ độ cũ cho phép.
- **Khóa không tồn tại.** Yêu cầu cho id sản phẩm không tồn tại luôn miss. Lưu "không tìm thấy" trong cache với TTL ngắn giúp bảo vệ database.
- **Cache server ngừng hoạt động.** Các lần đọc chuyển sang database. Nếu database không chịu được toàn bộ tải, dịch vụ phải từ chối bớt yêu cầu hoặc cung cấp ít tính năng hơn đến khi cache hoạt động lại.

### Phần mở rộng (tùy chọn): các chiến lược khác

- **Write-through (ghi đồng thời vào bộ nhớ đệm và cơ sở dữ liệu).** Mỗi lần ghi cập nhật cả cache lẫn database, nên cache giữ dữ liệu mới miễn là cả hai cập nhật thành công; thiết kế phải nói rõ điều gì xảy ra khi một cập nhật thất bại. Ghi trở nên chậm hơn.
- **Write-back (ghi vào bộ nhớ đệm trước, cơ sở dữ liệu sau).** Ghi vào cache trước rồi đến database sau. Ghi nhanh, nhưng có thể mất dữ liệu nếu cache hỏng trước khi lưu.
- **Eviction (loại bỏ dữ liệu khỏi bộ nhớ đệm) và LRU (least recently used) (loại bỏ mục lâu nhất chưa được truy cập).** Khi cache đầy, nó loại bỏ các mục; LRU loại bỏ mục được sử dụng (đọc hoặc ghi) cách đây lâu nhất.
- **Hot key (khóa được truy cập rất nhiều) và thundering herd (nhiều yêu cầu cùng dồn về một lúc).** Một khóa rất phổ biến có thể làm một cache server quá tải. Khi khóa đó hết hạn, hàng nghìn yêu cầu có thể miss cùng lúc và cùng đến database; chỉ cho một yêu cầu nạp lại khóa sẽ ngăn điều này.

## [worked-example] Ví dụ có lời giải

**Bài toán:** Trang sản phẩm nhận 5,000 lần đọc mỗi giây vào giờ cao điểm. Database phục vụ được khoảng 1,000 lần đọc mỗi giây, và nhóm muốn nó chạy không quá khoảng hai phần ba mức đó vào giờ cao điểm (ý tưởng headroom (công suất dự phòng) từ SD 2). Giá thay đổi vài lần mỗi ngày, và doanh nghiệp chấp nhận giá cũ tối đa 60 giây. Đo đạc cho thấy một lần đọc database, tính cả lưu kết quả vào cache, luôn hoàn thành trong 2 giây. Thiết kế đường đọc và cho biết hit rate cần đạt.

**Lời giải:**

1. **Ngân sách database.** Hai phần ba của 1,000 là 1,000 × 2 ÷ 3 ≈ 667 lần đọc mỗi giây; làm tròn xuống 650 để giữ thêm một ít dự phòng.
2. **Số miss cho phép.** Chỉ miss đến database, nên số miss phải tối đa 650 trong 5,000 lần đọc mỗi giây: 650 ÷ 5,000 = 0.13, hay 13%.
3. **Hit rate cần đạt.** 100% − 13% = 87%. Trang sản phẩm với vài trăm sản phẩm phổ biến thường có hit rate cao hơn mức này, nhưng phải đo để xác nhận.
4. **Chọn TTL.** TTL tính từ khi mục được lưu, và một lần đọc chậm có thể lưu giá trị đã được đọc từ 2 giây trước (xem Trường hợp đặc biệt). Vì vậy, độ cũ lớn nhất của giá người dùng có thể thấy là TTL + 2 giây. TTL + 2 ≤ 60 cho TTL ≤ 58; chọn 55 giây.
5. **Xử lý thay đổi.** Khi giá thay đổi, ghi database rồi xóa cache key của sản phẩm. Người dùng sau đó thường thấy giá mới ngay; trong trường hợp hiếm khi có lần đọc chậm chạy đồng thời, họ thấy giá cũ tối đa 55 + 2 = 57 giây.
6. **Kiểm tra cache rỗng.** Sau khi cache khởi động lại, cả 5,000 lần đọc mỗi giây đều miss, gấp năm lần giới hạn database. Lên kế hoạch: giữ cache server thứ hai có bản sao cùng dữ liệu và chuyển sang nó; nếu cả hai rỗng, chỉ cho khoảng 650 lần đọc mỗi giây đến database (phần còn lại nhận trang "thử lại" ngắn) đến khi các sản phẩm phổ biến được đưa vào cache trở lại.

**Đáp án:** Cache-aside với khóa `product:<id>`, TTL 55 giây, và xóa mục sau mỗi lần thay đổi giá. Database ở trong ngân sách nếu hit rate ít nhất 87%; cache rỗng được xử lý bằng bản sao trên cache server thứ hai và bằng cách giới hạn số lần đọc database trong lúc nạp lại.
