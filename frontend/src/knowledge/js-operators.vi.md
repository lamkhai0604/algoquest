# Lý thuyết

JavaScript tính vế trái trước và chỉ tính vế phải khi cần. Cách này gọi là **short-circuit**.

- `??` dùng vế phải khi vế trái là `null` hoặc `undefined`.
- `&&` dùng vế phải khi vế trái là truthy (được xem là đúng trong điều kiện).
- `||` dùng vế phải khi vế trái là falsy (được xem là sai trong điều kiện).

Trong các trường hợp còn lại, toán tử trả về nguyên giá trị vế trái. Ví dụ, `0`, `false` và `""` là falsy, còn chuỗi có nội dung là truthy.

# Ví dụ

```javascript
const score = 0;
const displayName = "";
const isLoggedIn = true;

console.log(score ?? 10); // 0
console.log(null ?? "Guest"); // "Guest"
console.log(isLoggedIn && "Welcome back!"); // "Welcome back!"
console.log(false && "Welcome back!"); // false
console.log(displayName || "Guest"); // "Guest"
console.log(score || 10); // 10
```

# Chỗ dễ nhầm

Dùng `??` khi số 0, `false` hoặc chuỗi rỗng là giá trị hợp lệ. Ví dụ, điểm 0 vẫn là một điểm số.

JavaScript yêu cầu dùng ngoặc khi kết hợp trực tiếp `??` với `&&` hoặc `||`. Đổi cách đặt ngoặc có thể làm đổi kết quả.

```javascript
console.log((0 ?? 10) || 20); // 20
console.log(0 ?? (10 || 20)); // 0
```
