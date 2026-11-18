# Big-O và nền tảng thuật toán

## [objectives] Mục tiêu bài học

- Mô tả lượng công việc của thuật toán tăng thế nào theo kích thước đầu vào bằng O(1), O(log n), O(n) và O(n²).
- Xác định Big-O của đoạn code đơn giản bằng cách đếm số lần vòng lặp thực hiện.
- Giải các bài tìm giá trị lớn nhất, nhỏ nhất, đếm hoặc tính tổng bằng cách duyệt một lần và lưu một ít trạng thái.
- Giải thích độ phức tạp thời gian và bộ nhớ phụ của lời giải, cùng lý do.

## [problem-hook] Tình huống mở đầu

Một trạm thời tiết có danh sách 100.000 nhiệt độ ghi nhận theo ngày và muốn tìm ngày nóng nhất.

Một cách là so sánh từng ngày với mọi ngày còn lại rồi giữ giá trị không có ngày nào nóng hơn. Cách này cần khoảng 100.000 × 100.000 = 10 tỷ phép so sánh, có thể tốn nhiều giây.

Cách tốt hơn là đọc danh sách **một lần** và nhớ nhiệt độ cao nhất từ đầu đến thời điểm hiện tại: khoảng 100.000 bước. Big-O giúp chúng ta mô tả sự khác biệt đó trước khi chạy code.

## [intuition] Hiểu bằng trực giác

Big-O mô tả lượng công việc tăng thế nào khi dữ liệu đầu vào tăng. Hãy tưởng tượng việc đọc sách:

- **O(1), hằng số (constant):** mở sách ngay trang đầu. Sách dày hơn vẫn mất khoảng thời gian như nhau.
- **O(n), tuyến tính (linear):** đọc mỗi trang đúng một lần. Số trang gấp đôi thì công việc cũng khoảng gấp đôi.
- **O(n²), bậc hai (quadratic):** với mỗi trang lại đọc toàn bộ sách. Số trang gấp đôi thì công việc tăng khoảng bốn lần.
- **O(log n), logarit (logarithmic):** tìm một số trang bằng cách mở gần giữa sách, rồi liên tục chia đôi vùng tìm kiếm.

Big-O bỏ qua hệ số hằng và các hạng nhỏ: 3n + 5 bước vẫn là O(n). Big-O cũng áp dụng cho bộ nhớ: lượng **bộ nhớ phụ** tăng ra sao theo đầu vào. Chỉ giữ một biến lưu giá trị tốt nhất là O(1) bộ nhớ; sao chép cả danh sách là O(n).

Kỹ thuật phổ biến nhất ở cấp độ này là **duyệt một lần (single pass)**: đi qua từng phần tử đúng một lần và lưu một ít trạng thái, chẳng hạn giá trị lớn nhất, bộ đếm hoặc đáp án tốt nhất cho đến lúc đó.

## [when-to-use] Khi nào nên dùng?

Hãy để ý những dấu hiệu sau trong đề bài:

- “Tìm giá trị lớn nhất, nhỏ nhất, đầu tiên hoặc tổng” trong danh sách.
- “Đếm xem có bao nhiêu” phần tử thỏa điều kiện.
- Đáp án chỉ phụ thuộc vào những gì đã xem và phần tử đang xét.
- Đầu vào rất lớn (từ 10^5 phần tử), nên cách O(n²) quá chậm.

Nếu đang định viết vòng lặp bên trong một vòng lặp khác trên cùng danh sách, hãy tự hỏi: *mình có thể nhớ điều gì từ các bước trước để chỉ cần một vòng lặp không?*

## [template-code] Code mẫu

Một lần duyệt danh sách, liên tục cập nhật đáp án đang giữ:

```javascript
function singlePass(items) {
  if (items.length === 0) return null; // handle the empty input first
  let best = items[0];                 // state carried across the loop
  for (let i = 1; i < items.length; i++) {
    if (items[i] > best) best = items[i]; // update the state with one item
  }
  return best;
}
```

```java
class Solution {
  public Integer singlePass(int[] items) {
    if (items.length == 0) return null; // handle the empty input first
    int best = items[0];                // state carried across the loop
    for (int i = 1; i < items.length; i++) {
      if (items[i] > best) best = items[i]; // update the state with one item
    }
    return best;
  }
}
```

## [complexity] Độ phức tạp

- **Thời gian: O(n).** Thân vòng lặp chạy một lần cho mỗi phần tử và mỗi lượt chỉ làm một lượng công việc cố định.
- **Bộ nhớ phụ: O(1).** Dù danh sách dài bao nhiêu, thuật toán chỉ giữ vài biến.

So sánh: sắp xếp toàn bộ danh sách rồi lấy phần tử cuối cần O(n log n) thời gian. Cách đó đúng, nhưng làm nhiều việc hơn yêu cầu.

### Cách tìm Big-O từ code

Đếm số lần dòng lệnh nằm sâu nhất được thực hiện theo n, sau đó chỉ giữ hạng tăng nhanh nhất:

- **Các bước chạy liên tiếp thì cộng lại.** Một vòng lặp n bước và một vòng lặp 1.000 bước cần n + 1.000 bước, tức O(n).
- **Các vòng lặp lồng nhau thì nhân số lần chạy.** Vòng ngoài n lần, vòng trong n / 2 lần thì tổng khoảng n × n / 2. Bỏ hệ số ½ còn O(n²).
- **Vòng lặp liên tục nhân đôi hoặc chia đôi biến đếm thường là O(log n).** Vòng `for (i = 1; i <= n; i *= 2)` có khoảng log₂ n lần lặp: 1, 2, 4, 8, ... cho đến n.

Các tốc độ tăng thường gặp, từ chậm nhất đến nhanh nhất: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ).

### Big-O dự đoán điều gì?

Big-O giúp ước lượng thời gian chạy thay đổi ra sao khi dữ liệu lớn lên. Nếu chương trình O(n²) mất 1 phút với 5.000 phần tử thì khi có 25.000 phần tử (gấp 5 lần), thời gian có thể vào khoảng 5² = 25 phút. Chương trình O(n) tương tự sẽ mất khoảng 5 phút.

Đây không phải thời gian chính xác. Hai chương trình cùng O(n) vẫn có tốc độ khác nhau tùy máy tính, ngôn ngữ hoặc cách dữ liệu được lưu trong bộ nhớ. Vì vậy chúng ta còn phải đo hiệu năng thực tế. Big-O giúp so sánh phương pháp trước khi viết code.

## [common-mistakes] Lỗi thường gặp

- **Đầu vào rỗng.** Đọc `items[0]` khi danh sách rỗng sẽ lỗi. Quyết định trước cần trả về gì (thường là null hoặc 0).
- **Khởi tạo sai giá trị.** Bắt đầu giá trị lớn nhất bằng 0 sẽ sai nếu mọi phần tử đều âm. Nên dùng phần tử đầu tiên hoặc âm vô cực.
- **Sai chỉ số biên (off-by-one).** Nếu đã khởi tạo từ `items[0]` thì vòng lặp có thể bắt đầu ở vị trí 1. Nếu so sánh hai phần tử liền nhau, phải dừng sớm một phần tử.
- **Giá trị trùng.** “Lớn thứ hai” thường là giá trị lớn thứ hai *phân biệt*. Cần so sánh chặt để tránh đếm trùng.
- **Nhầm vòng lặp lồng nhau là O(n).** Hai vòng lặp duyệt cùng danh sách, vòng này nằm trong vòng kia, thường là O(n²).

## [edge-cases] Trường hợp biên

- Danh sách rỗng: không có phần tử đầu để khởi tạo.
- Danh sách chỉ có một phần tử: thân vòng lặp có thể không chạy.
- Toàn giá trị âm hoặc tất cả giá trị bằng nhau.
- Dữ liệu cực lớn, khiến cách O(n²) chạy quá chậm.

## [worked-example] Ví dụ giải chi tiết

**Bài toán:** trả về điểm lớn thứ hai *phân biệt*, hoặc null nếu không có. Ví dụ: `[5, 5, 3]` cho kết quả `3`.

**Cách giải thích bằng lời:**

> Tôi duyệt danh sách điểm một lần, giữ hai giá trị: lớn nhất và lớn thứ hai từ đầu đến hiện tại, ban đầu đều chưa có. Với mỗi điểm: nếu nó lớn hơn giá trị lớn nhất, giá trị lớn nhất cũ chuyển xuống vị trí thứ hai và điểm mới trở thành lớn nhất. Nếu không, khi điểm nhỏ hơn lớn nhất và lớn hơn giá trị thứ hai, nó sẽ trở thành giá trị thứ hai. Những điểm bằng lớn nhất được bỏ qua để không đếm trùng. Cuối cùng tôi trả về giá trị thứ hai hoặc null nếu chưa tìm được. Thời gian O(n) vì mỗi điểm chỉ được duyệt một lần, và bộ nhớ O(1) vì chỉ giữ hai biến. Cần xét các trường hợp rỗng, mọi điểm bằng nhau và giá trị lớn nhất xuất hiện lặp lại như `[5, 5, 3]`.

**Code:**

```javascript
function secondLargest(scores) {
  let first = null;
  let second = null;
  for (const s of scores) {
    if (first === null || s > first) {
      second = first;
      first = s;
    } else if (s < first && (second === null || s > second)) {
      second = s;
    }
  }
  return second;
}
```

```java
class Solution {
  public Integer secondLargest(int[] scores) {
    Integer first = null;
    Integer second = null;
    for (int s : scores) {
      if (first == null || s > first) {
        second = first;
        first = s;
      } else if (s < first && (second == null || s > second)) {
        second = s;
      }
    }
    return second;
  }
}
```
