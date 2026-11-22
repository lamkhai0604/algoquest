# Theory

JavaScript evaluates the left operand first. It evaluates the right operand only when the operator needs it. This behavior is called **short-circuiting**.

- `??` uses the right operand when the left is `null` or `undefined`.
- `&&` uses the right operand when the left is truthy.
- `||` uses the right operand when the left is falsy.

Otherwise, each operator returns the left value as-is. For example, `0`, `false`, and `""` are falsy, and a non-empty string is truthy.

# Examples

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

# Common pitfalls

Use `??` when zero, false, or an empty string is a valid value. For example, a score of zero is still a score.

JavaScript requires parentheses when combining `??` directly with `&&` or `||`. The grouping can change the result.

```javascript
console.log((0 ?? 10) || 20); // 20
console.log(0 ?? (10 || 20)); // 0
```
