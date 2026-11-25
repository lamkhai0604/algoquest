# Database (cơ sở dữ liệu), index (chỉ mục) và ghi đồng thời

## [objectives] Mục tiêu học tập

- Giải thích cách relational database (cơ sở dữ liệu quan hệ) và document store (cơ sở dữ liệu dạng tài liệu) lưu dữ liệu, rồi chọn dựa trên cách đọc dữ liệu.
- Giải thích vì sao tra theo primary key (khóa chính) hoặc column (cột) có index nhanh, và vì sao query (truy vấn) trên column không có index phải đọc mọi row (dòng).
- Ước lượng chi phí ghi và lưu trữ của index.
- Giải thích transaction (giao dịch) và bốn thuộc tính ACID (bốn đảm bảo của giao dịch) bằng lời đơn giản.
- Chỉ ra cách hai người cùng mua ghế cuối và sửa bằng conditional update (cập nhật có điều kiện) hoặc unique constraint (ràng buộc duy nhất).
- Phân biệt khóa trước (pessimistic concurrency (khóa trước rồi mới ghi)) với kiểm tra version (số phiên bản) khi ghi (optimistic concurrency (kiểm tra phiên bản khi ghi)), và nói khi nào mỗi cách phù hợp.

### Thuật ngữ chính

- **Table, row, column (bảng, dòng, cột).** Relational database giữ dữ liệu trong table. Mỗi row là một bản ghi, chẳng hạn một người dùng; mỗi column là một trường, chẳng hạn `email`. **Schema (lược đồ dữ liệu)** liệt kê các column và kiểu dữ liệu của chúng.
- **Relational database (SQL (ngôn ngữ truy vấn SQL) database).** Database gồm các table có thể nối với nhau bằng giá trị khớp nhau, được query bằng ngôn ngữ SQL. PostgreSQL và MySQL là ví dụ.
- **Document store.** Database giữ mỗi bản ghi dưới dạng một document, thường là JSON (định dạng dữ liệu dạng văn bản), với các trường lồng nhau được giữ cùng nhau. MongoDB là ví dụ. Đây là một loại database **NoSQL (cơ sở dữ liệu phi quan hệ)**, tên gọi cho các database không phải dạng quan hệ.
- **Primary key.** Một column (hoặc vài column) có giá trị duy nhất và không bao giờ rỗng cho mỗi row, chẳng hạn `id`. Database tự tạo index cho nó.
- **Index.** Cấu trúc bổ sung ánh xạ giá trị của column đến các row chứa chúng, giúp database tìm row mà không đọc cả table, giống mục lục tra cứu cuối sách.
- **B-tree (cây B).** Hình dạng thông thường của index: cây cân bằng, có thứ tự, mỗi node giữ hàng trăm khóa. Đây là phiên bản rộng của cây tìm kiếm nhị phân ở Level 8.
- **Full table scan (quét toàn bộ bảng).** Đọc mọi row của table để trả lời query vì không có index hữu ích.
- **Transaction.** Nhóm thao tác đọc và ghi mà database xem như một đơn vị: hoặc lưu mọi thay đổi, hoặc không lưu thay đổi nào.
- **ACID.** Bốn cam kết của transaction: **atomicity (tính nguyên tử (tất cả hoặc không gì cả))** (tất cả hoặc không gì cả), **consistency** (các quy tắc của database, chẳng hạn khóa duy nhất, vẫn đúng sau đó), **isolation (tính cô lập)** (các transaction đồng thời không thấy thay đổi chưa hoàn tất của nhau), **durability (tính bền vững)** (khi đã lưu, thay đổi vẫn còn sau sự cố).
- **Race condition (tình trạng tranh chấp).** Lỗi mà kết quả phụ thuộc vào thao tác nào trong hai thao tác đồng thời diễn ra trước.
- **Conditional update.** Cập nhật chỉ thay đổi row nếu điều kiện vẫn đúng tại thời điểm ghi, chẳng hạn `WHERE seats_left > 0`.
- **Unique constraint.** Quy tắc từ chối row thứ hai có cùng giá trị ở một column, chẳng hạn cùng số ghế cho cùng chuyến bay.
- **Lock (khóa).** Dấu giữ chỗ ngăn transaction khác thay đổi row đến khi bên giữ khóa hoàn tất.
- **Pessimistic và optimistic concurrency.** Pessimistic: khóa row trước, trong transaction, để bên khác chờ đến khi commit. Optimistic: không khóa trước; khi ghi, kiểm tra row chưa đổi từ lúc đọc (chẳng hạn qua số **version**) và đổi version trong cùng lần ghi, rồi đọc lại và thử lại nếu có 0 row thay đổi.

## [problem-hook] Vấn đề mở đầu

Một website sự kiện lưu 10 triệu người dùng. Khi đăng nhập, server (máy chủ) tra người dùng theo email. Nếu không có hỗ trợ, database đọc cả 10 triệu row để tìm một email, và một lần đăng nhập mất khoảng một giây. Vào buổi tối đông người, vài trăm lần đăng nhập mỗi giây khiến database bận hết công suất.

Cũng tối đó, buổi hòa nhạc còn một ghế và hai người bấm Mua cùng lúc. Cả hai thấy "còn 1 ghế", cả hai trả tiền, và địa điểm có hai vé cho một ghế. Database có thể sửa cả hai vấn đề, nhưng thiết kế phải yêu cầu nó làm đúng việc.

## [intuition] Cách hiểu trực quan

Hãy nghĩ đến thư viện có một triệu cuốn sách. Để tìm sách theo tên, bạn có thể đi qua mọi kệ: đó là full table scan. Hoặc dùng danh mục: các ngăn xếp theo tên sách, mỗi nhãn thu hẹp tìm kiếm đến thẻ phù hợp, ghi kệ cần đến. Danh mục đó là index. Nó tiết kiệm rất nhiều bước đi, nhưng mỗi sách mới cũng cần thẻ mới.

Giờ tưởng tượng hai thủ thư đều thấy một bản sách trên kệ và mỗi người hứa cho một độc giả khác nhau. Mỗi người làm đúng khi đứng riêng; cùng nhau họ phá vỡ quy tắc. Transaction có điều kiện giống việc thủ thư lấy sách khỏi kệ ngay khi cho mượn: nếu sách đã hết, lần mượn thứ hai thất bại.

**Liên hệ với Level 8.** Index là cây tìm kiếm giống ở Level 8, nhưng mỗi node rất rộng nên tra cứu chỉ cần vài bước.

## [when-to-use] Khi nào nên dùng

- **Relational database:** dữ liệu có quan hệ và quy tắc phải luôn đúng, chẳng hạn đơn hàng, thanh toán, ghế và tồn kho; các query kết hợp table.
- **Document store:** mỗi bản ghi được đọc và ghi như một khối, trường khác nhau giữa bản ghi và hiếm khi kết hợp dữ liệu giữa các bản ghi, chẳng hạn danh mục sản phẩm hoặc hồ sơ.
- **Index:** query thường lọc hoặc sắp theo column trên table lớn. Không phải mọi column: mỗi index làm ghi chậm hơn.
- **Transaction:** nhiều thay đổi phải cùng xảy ra hoặc không xảy ra, chẳng hạn chuyển tiền giữa hai tài khoản.
- **Conditional update hoặc unique constraint:** nhiều người có thể thay đổi cùng thứ một lúc, chẳng hạn ghế cuối hoặc tên người dùng.

## [template-code] Mẫu thiết kế

Bài này không có mã chương trình. Dùng **mẫu thiết kế** sau khi thêm table:

```text
Với mỗi table:
  1. Một row là gì? Primary key là gì?
  2. Query nào đọc nó nhiều nhất? Lọc hoặc sắp theo column nào?
     -> thêm index cho mỗi điều kiện lọc thường dùng trên table lớn.
  3. Ghi thường xuyên không? Mỗi index thêm việc cho mỗi lần ghi.
  4. Quy tắc nào phải luôn đúng (email duy nhất, seats_left >= 0)?
     -> đặt vào database: unique constraint, conditional update.
  5. Hai người có thể đổi cùng row một lúc không?
     -> conditional update, khóa trước (pessimistic), hoặc kiểm tra version (optimistic).

Giành ghế cuối an toàn:
  UPDATE concerts SET seats_left = seats_left - 1
  WHERE id = 42 AND seats_left > 0;
  -> 1 row được cập nhật: ghế là của bạn.
  -> 0 row được cập nhật: người khác đã lấy trước.
```

## [complexity] Chi phí và giới hạn

**Chi phí và giới hạn** của các thành phần trong bài (gần đúng, cho một table khoảng 10 triệu row trên một PostgreSQL hoặc MySQL server):

| Thao tác | Khoảng | Lý do |
| --- | --- | --- |
| Tra theo primary key hoặc column có index, dữ liệu trong bộ nhớ | 0.1–1 ms | Vài bước xuống B-tree |
| Cùng phép tra, dữ liệu đọc từ SSD | 1–5 ms | Mỗi bước có thể chờ đĩa |
| Full table scan, dữ liệu trong bộ nhớ | 100–500 ms | Kiểm tra mọi row |
| Full table scan, dữ liệu đọc từ SSD | 1–5 s | Đọc hàng gigabyte từ đĩa |

**Vì sao chỉ vài bước.** Cây tìm kiếm nhị phân có 10 triệu khóa cần khoảng log₂(10,000,000) ≈ 23 bước. Một B-tree node giữ hàng trăm khóa, nên mỗi bước chọn giữa hàng trăm nhánh thay vì hai. Với khoảng 300 khóa mỗi node:

1. Một tầng đạt 300 mục.
2. Hai tầng đạt 300 × 300 = 90,000.
3. Ba tầng đạt 300 × 300 × 300 = 27,000,000, hơn 10 triệu.

Vì vậy tra cứu đọc khoảng 3 hoặc 4 trang dữ liệu, nên nhanh ngay cả trên đĩa.

**Chi phí của index.** Index không miễn phí khi ghi. Trong mô hình đơn giản của bài, chèn một row ghi row đó cộng một mục trong mỗi index, nên table có năm index làm khoảng sáu phần việc logic cho mỗi row mới. Xóa và cập nhật column có index cũng thay đổi index; công việc cụ thể phụ thuộc database. Index còn tốn lưu trữ, thường bằng một phần đáng kể của chính table.

## [common-mistakes] Lỗi thường gặp

- **Không có index trên column dùng tra cứu.** Đăng nhập theo email không có index gây full table scan mỗi lần.
- **Index mọi column.** Ghi chậm và lưu trữ tăng cho những query có thể không bao giờ chạy.
- **Kiểm tra rồi ghi bằng hai bước riêng.** "Đọc seats_left, thấy 1, rồi ghi 0" cho người mua khác đọc 1 xen vào. Đặt điều kiện trong chính lần ghi.
- **Chọn NoSQL vì nghe nhanh hơn.** Lựa chọn đúng phụ thuộc cách đọc dữ liệu và các quy tắc cần giữ, không phải tên gọi.
- **Chỉ giữ quy tắc trong mã ứng dụng.** Nếu hai server cùng kiểm tra "tên người dùng còn trống không?", cả hai có thể trả lời có. Unique constraint trong database không thể bị vượt qua theo cách này.

## [edge-cases] Trường hợp đặc biệt

- **Conditional update thay đổi 0 row.** Đây không phải lỗi database: điều kiện không còn đúng. Ứng dụng phải báo ghế đã hết.
- **Unique constraint từ chối lần ghi.** Database trả lỗi cho lần chèn thứ hai; ứng dụng nên chuyển thành thông báo rõ, chẳng hạn "tên người dùng đã được dùng".
- **Row bị khóa.** Với pessimistic locking, transaction thứ hai chờ. Nếu bên đầu chậm hoặc không hoàn tất, bên thứ hai có thể hết thời gian chờ; chỉ giữ lock trong thời gian ngắn.
- **Kiểm tra version kiểu optimistic thất bại thường xuyên.** Nhiều người cùng sửa row gây nhiều lần thử lại lãng phí; khóa trước có thể tốt hơn.
- **Query không dùng được index.** Index trên `email` không giúp tìm email kết thúc bằng `@gmail.com`, vì index sắp từ chữ đầu tiên.

### Phần mở rộng (tùy chọn): isolation level (mức cô lập)

Database cung cấp các **isolation level**, quy định các transaction đồng thời thấy dữ liệu của nhau đến đâu. Mức yếu hơn nhanh hơn nhưng cho phép bất thường, chẳng hạn **lost update (mất cập nhật)** (hai transaction đọc cùng giá trị và lần ghi thứ hai âm thầm thay lần ghi đầu). Mức mạnh hơn, đến **serializable**, khiến transaction hành xử như chạy lần lượt, đổi lại có thêm chờ đợi hoặc thử lại. Mức mặc định của PostgreSQL, read committed, đã khiến conditional update ở trên an toàn, vì lần cập nhật thứ hai kiểm tra lại điều kiện trên row mới nhất đã commit.

## [worked-example] Ví dụ có lời giải

**Bài toán:** Website bán vé hòa nhạc bán ghế đánh số. Table `seats(concert_id, seat_number, buyer_id)` có một row cho mỗi ghế đã bán. Khi mở bán, khoảng 2,000 lần mua mỗi giây, nhiều lần cho cùng ghế phổ biến; trang còn hiển thị "ghế còn lại" cho mỗi buổi. Thiết kế table và index để không ghế nào bị bán hai lần và tra ghế đã bán của một buổi nhanh.

**Lời giải:**

1. **Quy tắc cần bảo vệ.** Một ghế trong một buổi có tối đa một người mua. Đặt vào database: unique constraint trên `(concert_id, seat_number)`.
2. **Mua ghế.** Chèn row. Nếu người khác chèn cùng ghế trước, constraint từ chối và ứng dụng trả "ghế đã có người mua". Không có khoảng hở giữa kiểm tra và ghi vì database làm chúng trong một bước.
3. **Đọc ghế đã bán.** Trang hỏi mọi row có một `concert_id`. Unique constraint tạo index trên `(concert_id, seat_number)`, cũng phục vụ query này vì index sắp theo `concert_id` trước. Không cần index thêm.
4. **Chi phí ghi của index đó.** Mỗi lần mua thêm một table row và một index entry: hai phần việc thay vì một. Một server có theo kịp 2,000 lần thử mỗi giây không chưa được quyết định bởi con số thô hàng nghìn lần ghi đơn giản mỗi giây, vì nó quá gần 2,000. Phải load test với mô hình thực: nhiều người cho cùng buổi, các lần chèn trùng bị từ chối và thiết lập durability đã chọn.
5. **Đếm ghế còn lại.** Ghế còn lại = số ghế trong hội trường − số row đã bán cho buổi đó. Hội trường 1,500 ghế cần đếm tối đa 1,500 row qua index, đủ nhanh cho một request; có thể cache (bộ nhớ đệm) kết quả vài giây (SD 3) vì trang chỉ cho ước lượng. Giao dịch mua không bao giờ dựa vào số đếm cache.

**Đáp án:** Unique constraint trên `(concert_id, seat_number)` ngăn bán trùng và cung cấp index trang cần. Mua là các lần chèn thành công hoặc bị từ chối; số đếm hiển thị có thể cũ vài giây, nhưng database quyết định từng lần bán.
