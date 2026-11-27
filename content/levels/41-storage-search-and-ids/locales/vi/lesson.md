# Storage, Search và ID

## [objectives] Mục tiêu học tập

Bài này có ba phần ngắn. Mỗi phần có các bước walkthrough riêng, một câu quick check và một challenge.

- **A. Object storage (kho lưu đối tượng (file)):** giải thích vì sao file lớn nằm trong object storage, chỉ thông tin mô tả nằm trong database (cơ sở dữ liệu), và thiết kế upload đi thẳng từ người dùng tới storage.
- **B. Full-text search:** giải thích vì sao `LIKE '%word%'` không mở rộng tốt, và inverted index (chỉ mục) (chỉ mục đảo) tìm tài liệu chứa các từ như thế nào.
- **C. Unique ID:** so sánh số auto-increment, UUID (định danh duy nhất 128 bit) ngẫu nhiên và time-ordered ID (ID sắp theo thời gian), chọn loại phù hợp cho hệ thống nhiều server (máy chủ).

### Thuật ngữ chính

- **Object storage.** Service (dịch vụ) giữ file, gọi là **object (đối tượng (một file trong kho))**, theo key trong **bucket (thùng chứa object)**, như `photos/9f3c.jpg`. Chi phí mỗi gigabyte thấp, giữ nhiều bản sao, đọc và ghi toàn bộ thay vì sửa tại chỗ.
- **Metadata (siêu dữ liệu (thông tin mô tả file)).** Thông tin về file như chủ sở hữu, kích thước, chú thích và storage key. Nằm trong database; byte nằm trong object storage.
- **Signed upload URL (đường dẫn tải lên có chữ ký).** Link app tạo để một người dùng upload một object tới một key đến khi hết hạn. Storage service kiểm tra chữ ký.
- **Multipart upload (tải lên theo từng phần).** Gửi file lớn thành các phần có thể gửi song song, retry (thử lại) riêng từng phần, rồi ghép thành một object.
- **Inverted index.** Với mỗi từ, giữ danh sách tài liệu chứa nó, như `red → [3, 8, 15, 21]`. Đây là index của search engine.
- **Tokenizing (tách từ).** Đổi văn bản thành từ index lưu: tách từ, chuyển chữ thường, thường đưa từ về dạng chung.
- **Auto-increment ID (ID tự tăng).** Số database tăng cho mỗi dòng mới: 1, 2, 3.
- **UUID.** ID 128-bit, thường viết thành 36 ký tự. UUID ngẫu nhiên (version 4) được tạo ở bất cứ đâu mà không hỏi ai, với xác suất trùng rất nhỏ.
- **Time-ordered ID.** ID bắt đầu bằng thời gian tạo, nên sắp theo thời gian, như ID 64-bit gồm thời gian, số máy và bộ đếm, hoặc UUID version 7, nối thời gian với bit ngẫu nhiên thay vì số máy.

## [problem-hook] Vấn đề mở đầu

App chia sẻ ảnh đang lớn dần. Server chuyển mọi ảnh upload vào database; database giờ chủ yếu chứa ảnh: backup (bản sao lưu) mất cả đêm. Tìm chú thích bằng `LIKE '%sunset%'` mất mười giây. Từ khi bảng ảnh tách thành shard (một phần dữ liệu nằm trên một máy chủ) (SD 8), hai shard đã cấp cùng số ảnh hai lần.

Ba vấn đề khác nhau, ba công cụ chuẩn: object storage cho byte, inverted index cho tìm kiếm và ID mà nhiều server tạo được không trùng nhau.

## [intuition] Cách hiểu trực quan

**A.** Thư viện để sách trên kệ trong kho và giữ thẻ mỗi cuốn trong danh mục. Thẻ cho biết sách ở đâu; không ai dán sách vào danh mục. Object storage là kho, database là danh mục.

**B.** Index cuối sách giáo khoa liệt kê mỗi từ cùng các trang có từ đó. Để tìm trang về “red shoes”, tra cả hai từ rồi lấy trang xuất hiện trong cả hai danh sách, thay vì đọc từng trang. Đó là inverted index.

**C.** Quầy đồ ăn phát vé số từ một máy: đơn giản, theo thứ tự, nhưng mọi người phải xếp hàng ở máy ấy. Nếu mỗi quầy có máy riêng, hai người có thể cùng nhận số 57. Viết thời gian, số quầy và số đếm trên vé giải quyết được: vé không trùng và vẫn sắp theo thời gian.

**Liên hệ.** Phần A dùng database và API (giao diện lập trình ứng dụng) trong SD 4, SD 5 cùng signed link trong SD 13. Phần B dựa trên hash map của Level 3 và database index trong SD 4. Phần C dựa trên SD 4 và shard trong SD 8.

## [when-to-use] Khi nào nên dùng

- **A. Object storage:** cho ảnh, video, tài liệu, backup và log (dòng ghi sự kiện), mọi thứ lớn và được ghi toàn bộ. Giữ metadata trong database kèm key của object.
- **A. Upload trực tiếp với signed URL (đường dẫn có chữ ký):** khi file lớn hoặc nhiều, để app server không gánh byte. Dùng multipart upload cho file lớn hơn khoảng 100 MB.
- **B. Inverted index:** khi người dùng tìm từ bên trong văn bản như mô tả sản phẩm hoặc message, qua hơn vài nghìn tài liệu.
- **B. Database index thông thường:** khi tra giá trị chính xác hoặc tiền tố, như email hay tên bắt đầu bằng “Ali” (SD 4); không cần search index.
- **C. Auto-increment:** một database, không cần giấu số dòng hiện có.
- **C. UUID ngẫu nhiên:** cần tạo ID ở nhiều nơi, như điện thoại offline, không cần sắp theo thời gian tạo.
- **C. Time-ordered ID:** tạo ID trên nhiều server, muốn dòng mới sắp theo thời gian và vào cuối index.

## [template-code] Khung thiết kế

Bài này không có code. Dùng **khung thiết kế** sau cho từng phần:

```text
A. Files: bytes in object storage under a key; metadata in the database.
   Upload: app checks rights -> signed upload URL -> client sends bytes
   to storage -> app saves the metadata. Large files: multipart.
B. Search: tokenize text into words; inverted index word -> sorted list
   of document IDs; a query looks up each word and intersects the lists.
   Keep the index updated from the database within seconds.
C. IDs: who makes them (one database or many servers)? Must they sort by
   time? Must they hide counts? Then: auto-increment, random UUID, or
   time-ordered ID (time + machine + counter, or UUID version 7).
```

## [complexity] Chi phí và ước lượng

**A. Byte qua app server.** Với 400 upload mỗi giây, mỗi file 3 MB, nếu chuyển tiếp ảnh thì 400 × 3 MB = 1.2 GB mỗi giây đi qua app server; signed upload URL giúp server chỉ xử lý request nhỏ mỗi upload. Với 1 triệu ảnh mỗi ngày, storage tăng 1,000,000 × 3 MB = 3 TB mỗi ngày, metadata khoảng 500 byte mỗi ảnh chỉ tăng 500 MB mỗi ngày.

**A. Retry file lớn.** Video 2 GB gửi một khối phải bắt đầu lại từ đầu nếu kết nối đứt gần cuối. Gửi thành 20 phần, mỗi phần 100 MB, lần lượt, một lỗi làm mất tối đa phần 100 MB đang truyền. Gửi nhiều phần cùng lúc nhanh hơn nhưng tăng lượng dữ liệu có rủi ro: 4 phần đang truyền thì tối đa 400 MB.

**B. Quét so với index.** `LIKE '%red%'` không dùng được index thông thường vì từ có thể ở bất cứ đâu trong văn bản, nên database đọc mọi mô tả: 10 triệu sản phẩm, mỗi mô tả khoảng 1 KB, là 10 GB mỗi tìm kiếm. Với inverted index, “red shoes” đọc hai danh sách, ví dụ 200,000 và 50,000 product ID. Hai danh sách đã sắp xếp nên một lượt đi chung mất khoảng 250,000 bước, vài mili giây.

**C. Bao nhiêu ID.** Time-ordered ID 64-bit có 41 bit mili giây dùng được khoảng 69 năm từ ngày bắt đầu; 10 bit đánh số tối đa 1,024 máy; 12 bit bộ đếm cho 4,096 ID mỗi mili giây mỗi máy, khoảng 4.1 triệu mỗi giây. UUID ngẫu nhiên có 122 bit ngẫu nhiên: sau một tỷ ID, xác suất có hai ID bằng nhau khoảng 1 trong 10¹⁹.

| Loại ID | Bên tạo | Sắp theo thời gian | Kích thước | Cần chú ý |
| --- | --- | --- | --- | --- |
| Auto-increment | Một database | Có | 4 hoặc 8 byte | Một bộ đếm cho mọi lần ghi; lộ số dòng |
| UUID ngẫu nhiên (v4) | Bất kỳ ai, ở đâu | Không | 16 byte | Dòng mới vào khắp nơi trong index |
| Time-ordered ID | Từng server | Có | 8 hoặc 16 byte | Số máy phải duy nhất; đồng hồ không được lùi |

## [common-mistakes] Lỗi thường gặp

- **A. Lưu file trong database.** Database phình to, backup và sao chép chậm, tốn bộ nhớ cho byte không bao giờ được query (truy vấn).
- **A. Lưu metadata trước khi upload xong.** App liệt kê ảnh chưa tồn tại. Lưu sau khi storage xác nhận hoặc đánh dấu “pending” đến lúc đó.
- **B. Coi search index là nguồn dữ liệu chuẩn.** Nó là bản sao dựng từ database, có thể chậm vài giây; mất thì dựng lại từ database.
- **B. Index mà không tokenizing.** “Shoes”, “shoes,” và “SHOES” phải thành cùng từ, nếu không tìm kiếm bỏ lỡ phần lớn kết quả.
- **C. Auto-increment qua các shard.** Mỗi shard đếm riêng, nên hai shard tạo cùng ID nếu không được cấp các khoảng riêng.
- **C. Auto-increment ID công khai.** Đối thủ thấy đơn 1,000 hôm nay, 1,500 ngày mai sẽ biết số đơn mỗi ngày; người dùng đoán được ID khác (SD 13 vẫn kiểm tra quyền).

## [edge-cases] Trường hợp đặc biệt

- **A. Upload bị bỏ dở.** Người nhận upload URL rồi không hoàn tất để lại metadata pending hoặc phần chưa xong. Job định kỳ xóa upload vẫn pending sau khoảng định sẵn từ lúc bắt đầu, như một ngày, cùng các phần. Hoàn tất và dọn dẹp chỉ được thay đổi ảnh còn pending để không cùng thắng.
- **B. Từ rất phổ biến.** “The” xuất hiện trong gần mọi tài liệu; danh sách dài bằng cả bộ sưu tập. Search engine bỏ hoặc xử lý riêng các từ đó.
- **B. Lỗi gõ và dạng từ.** “Shoe” và “shoes” nên khớp; đưa về dạng chung hoặc cho phép khác biệt chính tả nhỏ xử lý được nhưng tốn thêm chi phí.
- **C. Đồng hồ lùi.** Bộ tạo time-ordered ID có đồng hồ bị chỉnh lùi có thể tạo ID trùng; phải chờ đồng hồ qua thời điểm cuối đã dùng.

### Mở rộng (không bắt buộc): xếp hạng tìm kiếm

Tìm tài liệu khớp mới là nửa công việc: kết quả tốt nhất phải đứng đầu. Cách phổ biến chấm điểm từng tài liệu theo tần suất từ truy vấn, tăng trọng số cho từ hiếm: “suede” nói nhiều hơn về sản phẩm so với “shoes”. Từ trong tiêu đề có thể nặng hơn mô tả; nhóm thường thêm tín hiệu như mức phổ biến hoặc độ mới. Công thức quen thuộc theo ý này là TF-IDF và BM25.

## [worked-example] Ví dụ hoàn chỉnh

**Bài toán:** App ảnh nhận 1 triệu ảnh mỗi ngày, tối đa 400 mỗi giây lúc cao điểm, khoảng 3 MB mỗi ảnh. App server gánh được tổng khoảng 1 GB mỗi giây cho mọi việc. Người dùng tìm theo từ trong 50 triệu chú thích. Ảnh nằm trong 8 database shard, mỗi ảnh cần ID duy nhất qua mọi shard, cho phép liệt kê ảnh mới nhất trước. Thiết kế upload, search và ID.

**Lời giải:**

1. **A. Byte nằm ở đâu.** Ảnh vào object storage theo key như `photos/<photo id>.jpg`; database giữ chủ sở hữu, chú thích, kích thước và key, khoảng 500 byte. Storage tăng 3 TB mỗi ngày, database chỉ 500 MB.
2. **A. Upload.** Chuyển tiếp 400 × 3 MB = 1.2 GB mỗi giây vượt mức 1 GB mỗi giây của server. Thay vào đó, app kiểm tra quyền, lưu ảnh “pending”, trả signed upload URL hiệu lực 10 phút. Điện thoại gửi byte thẳng tới storage. Storage xác nhận thì app đánh dấu “ready”. Ảnh pending hơn một ngày được dọn.
3. **B. Search.** Mỗi chú thích được tokenizing và thêm vào inverted index: từ → danh sách photo ID đã sắp. Tìm “sunset beach” đọc hai danh sách và duyệt chung. Khi chú thích đổi, database gửi event và index cập nhật trong vài giây.
4. **C. ID.** Auto-increment trên 8 shard sẽ trùng số. UUID ngẫu nhiên có thể duy nhất, nhưng chỉ sắp theo chúng không liệt kê mới nhất trước; nhóm muốn một ID làm cả hai. Time-ordered ID 64-bit (thời gian mili giây, số máy, bộ đếm) duy nhất qua các server, sắp theo thời gian và cho khoảng 4.1 triệu ID mỗi giây mỗi máy, vượt xa 400.

**Kết quả:** Byte trong object storage, upload trực tiếp với signed URL (nếu không app server phải gánh 1.2 GB mỗi giây); metadata trong shard. Chú thích trong inverted index cập nhật trong vài giây từ database. Time-ordered ID 64-bit tạo ở mỗi server, duy nhất và sắp theo thời gian.
