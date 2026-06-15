# IIAWAK PROJECT — TÀI LIỆU GIẢI THÍCH HOẠT ĐỘNG HỆ THỐNG

**Ngày tạo:** 16/06/2026  
**Phạm vi:** Backend (Node.js) & Mobile (Android Java)

---

## MỤC LỤC

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [PHẦN 1: Backend](#phần-1-backend-iiawak_backend)
   - 1.1 Kiến Trúc 4 Lớp
   - 1.2 Luồng Khởi Động Server
   - 1.3 Xác Thực & Bảo Mật
   - 1.4 Real-time với Socket.IO
   - 1.5 Các Tính Năng Nghiệp Vụ Chính
   - 1.6 Mô Hình Dữ Liệu MongoDB
   - 1.7 Danh Sách API Endpoints
   - 1.8 Admin Dashboard (Web)
3. [PHẦN 2: Mobile](#phần-2-mobile-iiawak_mobile--android-java)
   - 2.1 Cấu Trúc Package
   - 2.2 Luồng Khởi Động
   - 2.3 Giao Tiếp với Server (ApiClient)
   - 2.4 Remote API Services
   - 2.5 Quản Lý Phiên Đăng Nhập (UserSession)
   - 2.6 Real-time Chat (SocketManager)
   - 2.7 Điều Hướng (Navigation Component)
   - 2.8 Các Màn Hình Chính
4. [PHẦN 3: Luồng Tương Tác Đầu-Cuối](#phần-3-luồng-tương-tác-đầu-cuối-end-to-end-flows)

---

## 1. TỔNG QUAN DỰ ÁN

Iiawak là một ứng dụng mạng xã hội / chat AI trên nền tảng Android, cho phép người dùng tương tác với các nhân vật AI tùy biến, kết bạn, nhắn tin, đăng bài cộng đồng và thực hiện thanh toán nạp tiền qua VNPay. Hệ thống gồm hai thành phần chính:

### Backend (Iiawak_backend)
| Thành phần | Chi tiết |
|---|---|
| Ngôn ngữ | Node.js + Express.js |
| Cơ sở dữ liệu | MongoDB (Mongoose ODM) |
| Realtime | Socket.IO (WebSocket) |
| AI | Google Gemini API |
| Thanh toán | VNPay Payment Gateway |
| Kiến trúc | 4 lớp: Presentation → BusinessLogic → DataAccess → Core |

### Mobile (Iiawak_mobile)
| Thành phần | Chi tiết |
|---|---|
| Ngôn ngữ | Java (Android) |
| HTTP Client | HttpURLConnection (ApiClient tùy chỉnh) |
| Realtime | Socket.IO Client (io.socket) |
| Lưu trữ cục bộ | SharedPreferences (UserSession) |
| Điều hướng | Android Navigation Component |
| UI | Material Design 3, Fragment-based architecture |

---

# PHẦN 1: BACKEND (Iiawak_backend)

## 1.1. Kiến Trúc 4 Lớp (Layered Architecture)

Backend được tổ chức theo kiến trúc phân lớp rõ ràng, giúp tách biệt trách nhiệm và dễ bảo trì. **Luồng xử lý đi theo một chiều duy nhất:**

```
Client Request
     ↓
[1_Presentation]   → Controllers + Middlewares + DTOs
     ↓
[2_BusinessLogic]  → Services (nghiệp vụ, logic)
     ↓
[3_DataAccess]     → Repositories + Models + Database
     ↓
[4_Core]           → Utils, Constants, Exceptions, Logger
```

### Lớp 1 – Presentation (`1_Presentation/`)

**Vai trò:** Giao diện tiếp nhận request từ bên ngoài và trả về response.

- **`Controllers/`**: Nhận HTTP request, gọi Service tương ứng, format và trả về JSON response. Controller **không chứa logic nghiệp vụ**.
  - `AuthController.js` — đăng ký, đăng nhập
  - `CharacterController.js` — CRUD nhân vật, chat AI
  - `ChatController.js` — chat trực tiếp
  - `CommunityController.js` — bài đăng, bình luận
  - `PaymentController.js` — VNPay
  - `AdminController.js` — quản trị
  - ... (11 controllers tổng cộng)

- **`Middlewares/`**: Xử lý xuyên suốt trước/sau khi request đến Controller:
  - `auth.middleware.js` — xác thực JWT token
  - `rateLimiter.middleware.js` — giới hạn tốc độ request
  - `requestLogger.middleware.js` — ghi log request
  - `requestValidator.middleware.js` — sanitize input, chặn injection
  - `websocket.middleware.js` — xác thực & xử lý WebSocket
  - `upload.middleware.js` — xử lý upload file

- **`DTOs/`**: Data Transfer Objects — định nghĩa cấu trúc dữ liệu đầu vào/ra chuẩn hóa.

### Lớp 2 – BusinessLogic (`2_BusinessLogic/`)

**Vai trò:** Chứa toàn bộ logic nghiệp vụ (business rules). **KHÔNG query MongoDB trực tiếp** — ủy thác hoàn toàn cho Repository.

- **`Services/`**:
  - `AuthService.js` — nghiệp vụ đăng ký/đăng nhập
  - `CharacterService.js` — quản lý nhân vật + chat AI (gọi Gemini)
  - `ChatService.js` — chat AI sessions + direct messages
  - `VNPayService.js` — tích hợp VNPay payment gateway
  - `CommunityService.js` — bài đăng, cộng đồng
  - `EconomyService.js` — quản lý KCH, gói nạp
  - `NotificationService.js` — push notification qua FCM
  - `EmailService.js` — gửi email xác thực, reset password
  - `StorageService.js` — upload file lên cloud
  - `AiService.js` — wrapper gọi Gemini API
  - `AdminService.js` — quản trị hệ thống
  - `SocialService.js` — follow/unfollow
  - `UserService.js` — quản lý user profile

### Lớp 3 – DataAccess (`3_DataAccess/`)

**Vai trò:** Tương tác trực tiếp với cơ sở dữ liệu. Là tầng duy nhất biết đến MongoDB.

- **`Models/`**: Schema Mongoose (định nghĩa cấu trúc dữ liệu):
  - `User.model.js`, `Character.model.js`, `Message.model.js`
  - `ChatSession.model.js`, `Post.model.js`, `Comment.model.js`
  - `Transaction.model.js`, `Giftcode.model.js`, `Notification.model.js`
  - `TopupPackage.model.js`, `StrikeRecord.model.js`

- **`Repositories/`**: Các hàm truy vấn MongoDB, được gọi từ Services:
  - `UserRepository.js` — CRUD user, transactions
  - `CharacterRepository.js` — CRUD characters
  - `ChatRepository.js` — sessions, messages
  - `CommunityRepository.js` — posts, comments
  - `EconomyRepository.js` — packages, KCH

- **`Database/`**: Cấu hình kết nối MongoDB (`connection.js`).
- **`Cache/`**: Tích hợp Redis để cache dữ liệu thường dùng.

### Lớp 4 – Core (`4_Core/`)

**Vai trò:** Cơ sở hạ tầng dùng chung cho toàn hệ thống.

- **`Constants/`**: Hằng số:
  - `errorMessages.js` — các message lỗi chuẩn hóa
  - `appConstants.js` — GEMINI_MODEL, CHAT_SESSION_MAX_MESSAGES, TransactionType...
- **`Exceptions/`**: `AppError.js` — lớp lỗi tùy chỉnh:
  - `AppError.notFound()`, `.unauthorized()`, `.forbidden()`, `.conflict()`, `.badRequest()`
- **`Logger/`**: Cấu hình `winston` logger với nhiều level (info, error, debug).
- **`Utils/`**: Hàm tiện ích:
  - `jwtUtil.js` — `sign(payload)`, `verify(token)`
  - `formatUtil.js` — `txId(prefix)` tạo transaction ID

---

## 1.2. Luồng Khởi Động Server (`server.js`)

`server.js` là **entry point** của toàn bộ backend. Khi khởi động, nó thực hiện các bước theo thứ tự:

1. **Nạp cấu hình** từ `config/` (port, MongoDB URL, VNPay keys, Gemini API key, Redis URL...)
2. **Tạo Express app + HTTP server + Socket.IO server** trên cùng một cổng (không tốn thêm port).
3. **Đăng ký middleware bảo mật**:
   - `helmet()` — thêm HTTP security headers (XSS protection, CSP, HSTS...)
   - `compression()` — Gzip response để tiết kiệm bandwidth
   - `cors()` — chỉ chấp nhận request từ ADMIN_URL
   - `express.json()` — parse JSON body (limit 10MB)
4. **Đăng ký middleware pipeline toàn cục** (chạy trước MỌI request):
   ```
   globalLimiter → requestLogger → sanitizeMiddleware → preventInjectionMiddleware
   ```
5. **Kết nối MongoDB** qua `db.connect()`. Nếu fail → `process.exit(1)`.
6. **Cấu hình Socket.IO authentication**: Mọi kết nối WebSocket phải xác thực JWT qua `io.use(authenticateSocket)`.
7. **Đăng ký HTTP routes**: Mỗi route group có rate limiter riêng.
8. **Global error handler**: Bắt mọi lỗi chưa được xử lý, trả JSON có cấu trúc.
9. **Server lắng nghe** trên `PORT` (mặc định 5000), bind `0.0.0.0`.
10. **Graceful shutdown**: `SIGTERM`/`SIGINT` → đóng server sạch sẽ, timeout 10 giây.

---

## 1.3. Xác Thực & Bảo Mật

### 1.3.1. JWT Authentication (`auth.middleware.js`)

Hệ thống dùng **JSON Web Token (JWT)** để xác thực danh tính. Luồng hoạt động:

```
Người dùng đăng nhập
    → AuthService.login() kiểm tra email/password
    → jwtUtil.sign({ id, role }) → JWT token (thời hạn cấu hình)
    → Token trả về client, lưu vào SharedPreferences

Mỗi request tiếp theo:
    → Client gửi: Authorization: Bearer <token>
    → auth.middleware.js verify token
    → Gán req.user = { id, role }
    → Nếu hết hạn/sai → 401 Unauthorized
```

### 1.3.2. Rate Limiting (`rateLimiter.middleware.js`)

| Limiter | Áp dụng cho | Mục đích |
|---|---|---|
| `globalLimiter` | Tất cả request | Bảo vệ chung |
| `authLimiter` | `/api/auth` | Chống brute-force đăng nhập |
| `apiLimiter` | `/api/user`, `/api/admin` | Giới hạn API thông thường |
| `paymentLimiter` | `/api/payment` | Bảo vệ giao dịch |
| `uploadLimiter` | `/api/upload` | Chặn lạm dụng lưu trữ |
| `searchLimiter` | `/api/search` | Chống crawl dữ liệu |

### 1.3.3. Input Validation & Sanitization (`requestValidator.middleware.js`)

**Hai lớp bảo vệ đầu vào:**

- **`sanitizeMiddleware`**: Làm sạch input — xóa ký tự HTML/JavaScript nguy hiểm (chống XSS).
- **`preventInjectionMiddleware`**: Phát hiện và block các pattern SQL/NoSQL injection trong body/params/query.

---

## 1.4. Real-time với Socket.IO (`websocket.middleware.js`)

Socket.IO chạy trên **cùng port HTTP** (không cần port riêng). Mọi kết nối WebSocket phải qua xác thực JWT.

### Các sự kiện WebSocket chính

| Event | Chiều | Mô tả |
|---|---|---|
| `send_direct_msg` | Client → Server | Gửi tin nhắn trực tiếp. Server lưu MongoDB + emit đến receiverId. |
| `receive_direct_msg` | Server → Client | Nhận tin nhắn mới. Client báo đã đọc → Server emit read receipt. |
| `join_char_room` | Client → Server | Tham gia phòng nhân vật `char_{roomId}` để nhận notification. |
| `leave_char_room` | Client → Server | Rời phòng nhân vật. |
| `typing` | Client → Server | Chỉ báo đang gõ (có throttle). |
| `stopTyping` | Client → Server | Dừng chỉ báo gõ. |
| `request_stats` | Client → Server | Yêu cầu thống kê WebSocket. |
| `disconnect` | Tự động | Xử lý khi client ngắt kết nối. |
| `reconnect` | Tự động | Xử lý khi client kết nối lại. |

### Xử lý kết nối

```javascript
// Khi user connect:
io.on('connection', socket => {
    const userId = socket.userId; // đã được set bởi authenticateSocket
    webSocketManager.handleUserConnect(socket, io);
    // → Lưu userId ↔ socketId mapping để emit đến đúng user
    
    socket.on('send_direct_msg', async (data) => {
        const { receiverId, content } = data;
        await webSocketManager.sendDirectMessage(io, userId, receiverId, content, Message);
        // → Lưu Message vào MongoDB
        // → io.to(receiverSocketId).emit('receive_direct_msg', messageData)
        socket.emit('msg_sent_status', { success: true });
    });
});
```

---

## 1.5. Các Tính Năng Nghiệp Vụ Chính

### 1.5.1. Đăng Ký / Đăng Nhập (`AuthService.js`)

#### Luồng đăng ký:
```
Client → POST /api/auth/register → AuthController.register()
    → AuthService.register({ username, email, password, displayName })
    → UserRepository.findByEmailOrUsername() [kiểm tra trùng lặp]
    → Nếu trùng → AppError.conflict() → 409
    → UserRepository.create() [lưu user mới]
       ∟ Password tự động hash bằng bcrypt trong Mongoose pre-save hook
    → jwtUtil.sign({ id, role }) → JWT token
    → Response: { success: true, data: { user, token } }
```

#### Luồng đăng nhập:
```
Client → POST /api/auth/login → AuthController.login()
    → AuthService.login({ email, password })
    → UserRepository.findByEmail(email) [lấy cả field password]
    → user.comparePassword(password) [bcrypt.compare]
    → Nếu sai → AppError.unauthorized() → 401
    → Kiểm tra status: nếu 'banned' → AppError.forbidden() → 403
    → jwtUtil.sign({ id, role }) → JWT token
    → Response: { success: true, data: { user, token } }
```

### 1.5.2. Nhân Vật AI & Chat (`CharacterService.js`)

Creator tạo nhân vật với các thuộc tính phong phú. Khi người dùng chat:

```
CharacterService.chat(characterId, userId, message, mode)
    1. CharacterRepository.findById(charId)
       → Kiểm tra char tồn tại, không bị ban
    
    2. ChatRepository.findOrCreateSession(userId, charId, mode)
       → Tìm ChatSession trong MongoDB
       → Nếu chưa có → tạo mới
       → Nếu session mới + có firstMessage → thêm tin nhắn chào đầu tiên
    
    3. Thêm user message vào session.messages
    
    4. _buildSystemPrompt(character, mode)
       → Xây dựng system prompt từ profile nhân vật:
         "Bạn là [name]. Tính cách: [personality]. Tiểu sử: [bio]..."
       → Normal mode: "Phản hồi 2-5 câu, tự nhiên, dùng emoji"
       → Story mode: "Phản hồi 150-400 từ, phong cách tiểu thuyết"
    
    5. _callGeminiAI(prompt, last10Messages, mode)
       → POST generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
       → temperature: 0.8 (normal) hoặc 0.9 (story)
       → maxOutputTokens: 200 (normal) hoặc 600 (story)
       → Fallback nếu lỗi → _getFallbackResponse() trả openingLine
    
    6. Lưu [user msg + AI reply] vào ChatSession MongoDB
       → Nếu messages.length > MAX_MESSAGES → cắt bớt tin cũ
    
    7. CharacterRepository.incrementChats(charId) [tăng counter]
    
    8. Return: { reply: "...", sessionId }
```

**Hai chế độ chat:**

| Chế độ | Độ dài | Phong cách |
|---|---|---|
| **Normal** | 2-5 câu | Tự nhiên như chat, dùng emoji phù hợp tính cách nhân vật |
| **Story** | 150-400 từ | Tiểu thuyết, ngôi thứ nhất, mô tả hành động/cảm xúc/ngoại cảnh, kết thúc bằng câu hỏi kích thích |

### 1.5.3. Thanh Toán VNPay (`VNPayService.js`)

Tích hợp cổng thanh toán VNPay để người dùng nạp **KCH (Kim Cương Hồng)**.

```
1. createPaymentUrl({ userId, packageId, amount })
   → Xác thực user + package
   → Tạo Transaction { txId: 'VNP-xxx', status: 'pending' } trong MongoDB
   → Xây dựng VNPay params:
       vnp_Amount = amount * 100  (VNPay tính đơn vị nhỏ nhất)
       vnp_ExpireDate = now + 15 phút
       vnp_TxnRef = txId
       ...
   → Sắp xếp params theo alphabet
   → Ký HMAC-SHA512 với vnp_HashSecret
   → Trả URL: https://sandbox.vnpayment.vn/paygate?vnp_...=...&vnp_SecureHash=...

2. verifyWebhook(vnp_Params)  [khi VNPay gọi IPN]
   → Xóa vnp_SecureHash từ params
   → Sắp xếp params, tính lại HMAC-SHA512
   → So sánh với secureHash nhận được
   → Nếu không khớp → return { statusCode: 97, message: 'Invalid signature' }
   → Tìm Transaction theo txId
   → ResponseCode '00' = thành công:
       Transaction.status = 'success'
       User.kchBalance += amountKch  [MongoDB $inc operator]
   → Khác → Transaction.status = 'failed'
```

### 1.5.4. Các Dịch Vụ Khác

| Service | Chức năng |
|---|---|
| `CommunityService` | Tạo/xem/like/bình luận Post. Feed phân trang. |
| `SocialService` | Follow/unfollow người dùng. |
| `AdminService` | Ban/unban user, thống kê, quản lý giftcode. |
| `NotificationService` | Push notification qua Firebase Cloud Messaging (FCM). |
| `StorageService` | Upload ảnh/video lên cloud (Google Cloud Storage hoặc Cloudinary). |
| `EmailService` | Gửi email xác thực tài khoản và reset mật khẩu (NodeMailer/SendGrid). |
| `EconomyService` | Quản lý gói nạp KCH, trừ KCH cho tính năng premium. |

---

## 1.6. Mô Hình Dữ Liệu MongoDB (Models)

### User (`User.model.js`)
```
_id, username, email, password (bcrypt hash), displayName, avatar
role: "user" | "admin"
kchBalance: Number (số dư Kim Cương Hồng)
status: "active" | "banned"
followers: [ObjectId], following: [ObjectId]
isCreator: Boolean
createdAt, updatedAt
```

### Character (`Character.model.js`)
```
_id, name, avatar, gender
personality, bio, publicInfo
openingLine, firstMessage
tags: [String]
privacy: "public" | "private"
ageRating: "all" | "teen" | "adult"
chatMode: "normal" | "story" | "both"
advancedSettings: {
    speakingStyle, userIdentity, lifeExperience
}
creatorId: ObjectId (ref User)
totalChats: Number
isBanned: Boolean
```

### ChatSession (`ChatSession.model.js`)
```
_id
userId: ObjectId
characterId: ObjectId
mode: "normal" | "story"
messages: [{
    role: "user" | "assistant",
    content: String,
    timestamp: Date
}]
updatedAt
```

### Message (`Message.model.js`)
```
_id
senderId: ObjectId
receiverId: ObjectId
conversationId: String  ← sort([senderId, receiverId]).join('_')
content: String
isRead: Boolean
createdAt
```

### Transaction (`Transaction.model.js`)
```
_id
txId: String  ← 'VNP-' + timestamp
userId: ObjectId
amountKch: Number
priceVnd: Number
type: "topup" | "spend"
status: "pending" | "success" | "failed" | "refunded"
paymentMethod: "VNPAY"
packageId: ObjectId
vnp_TransactionNo, vnp_BankCode, vnp_BankTranNo, vnp_PayDate
refundReason, refundedAt
createdAt
```

### Các Model khác
| Model | Trường chính |
|---|---|
| `Post` | authorId, content, images[], likes[], commentsCount |
| `Comment` | postId, authorId, content |
| `Giftcode` | code, kchAmount, maxUses, usedCount, expiredAt, isActive |
| `Notification` | userId, type, title, body, isRead, data (FCM payload) |
| `TopupPackage` | name, kch, bonus, priceVnd, isActive |
| `StrikeRecord` | userId, reason, adminId |

---

## 1.7. Danh Sách API Endpoints Chính

| Method | Endpoint | Mô tả | Rate Limit |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản | authLimiter |
| POST | `/api/auth/login` | Đăng nhập → JWT token | authLimiter |
| POST | `/api/auth/forgot-password` | Gửi email reset | authLimiter |
| GET | `/api/user/profile` | Xem profile (JWT required) | apiLimiter |
| PUT | `/api/user/profile` | Cập nhật profile | apiLimiter |
| GET | `/api/search` | Tìm kiếm nhân vật/user | searchLimiter |
| GET | `/api/characters` | Danh sách nhân vật công khai | — |
| POST | `/api/characters` | Tạo nhân vật (Creator role) | — |
| GET | `/api/characters/:id` | Chi tiết nhân vật | — |
| POST | `/api/characters/:id/chat` | Chat với nhân vật AI | — |
| GET | `/api/characters/:id/history` | Lịch sử chat | — |
| GET | `/api/community/feed` | Feed bài đăng | — |
| POST | `/api/community/posts` | Tạo bài đăng | — |
| POST | `/api/community/posts/:id/like` | Like bài | — |
| GET | `/api/chat/conversations` | Danh sách hội thoại | — |
| GET | `/api/chat/history/:userId` | Lịch sử chat với user | — |
| POST | `/api/social/follow/:userId` | Follow user | — |
| POST | `/api/upload/image` | Upload ảnh | uploadLimiter |
| GET | `/api/economy/packages` | Danh sách gói nạp | — |
| POST | `/api/payment/create` | Tạo URL thanh toán VNPay | paymentLimiter |
| GET | `/api/payment/ipn` | VNPay webhook (IPN) | paymentLimiter |
| POST | `/api/giftcodes/redeem` | Nhập mã giftcode | — |
| GET | `/api/admin/stats` | Thống kê (admin only) | apiLimiter |
| GET | `/health` | Kiểm tra server & WebSocket | — |

---

## 1.8. Admin Dashboard (Web ReactJS)

Nằm trong thư mục `Iiawak_backend/admin-dashboard/`, đây là một ứng dụng Web Front-end dành riêng cho ban quản trị (Admin).

### Công nghệ sử dụng
| Thành phần | Chi tiết |
|---|---|
| Core Framework | React.js (v18) |
| Build Tool | Vite |
| Routing | React Router DOM (v6) |
| UI Icons | Lucide React |

### Các Chức Năng Chính (Pages)
- **Đăng Nhập (`Login.jsx`)**: Trang xác thực dành cho admin.
- **Quản Lý Người Dùng (`UserManagement.jsx`)**: Xem danh sách, tìm kiếm, khóa/mở khóa (ban/unban) tài khoản người dùng, xem thống kê nạp/tiêu Kim Cương Hồng.
- **Kiểm Duyệt (`Moderation.jsx`)**: Kiểm duyệt các nội dung vi phạm, xử lý các báo cáo về nhân vật AI hoặc bài đăng cộng đồng.
- **Kinh Tế (`Economy.jsx`)**: Quản lý các gói nạp Kim Cương Hồng, thiết lập giá trị, mức thưởng (bonus).
- **Mã Quà Tặng (`GiftCodes.jsx`)**: Tạo và quản lý Giftcode (mã, số lượng KCH, giới hạn lượt dùng, thời hạn).
- **Sự Kiện (`Events.jsx`)**: Quản lý các sự kiện trong ứng dụng.
- **Cấu Hình Hệ Thống (`SystemConfig.jsx`)**: Thiết lập các thông số hoạt động chung của server.

Admin Dashboard tương tác trực tiếp với các API thuộc nhóm `/api/admin` và yêu cầu tài khoản phải có `role: "admin"` mới có thể thao tác.

### Đồng Bộ Real-time Xuống App (Admin -> App)
Khi admin thực hiện một số thao tác trực tiếp lên tài khoản người dùng (như Khóa tài khoản, Cảnh cáo, hoặc Điều chỉnh Kim Cương Hồng), hệ thống sẽ gửi ngay tín hiệu Real-time qua **Socket.IO**:
- **Backend**: `AdminController` lấy Socket.IO instance và sử dụng `NotificationService.emitToUser` để phát đi sự kiện `admin:action` đến ID tài khoản tương ứng.
- **Mobile**: `MainActivity` lắng nghe sự kiện `admin:action` toàn cục. Nhờ đó, nếu bị khóa (`ban`), app sẽ lập tức xóa session và đẩy người dùng ra trang Login. Nếu bị điều chỉnh số dư, app sẽ cập nhật lại `UserSession` và hiện thông báo thay đổi KCH trong thời gian thực.

---

# PHẦN 2: MOBILE (Iiawak_mobile – Android Java)

## 2.1. Cấu Trúc Package

```
com.example.iiawak_mobile/
├── MainActivity.java         ← Entry point: BottomNavigationView + NavHostFragment
├── SplashActivity.java       ← Màn hình khởi động, kiểm tra session → điều hướng
│
├── config/
│   └── NetworkConfig.java    ← BASE_URL (địa chỉ server backend)
│
├── data/
│   ├── UserSession.java      ← Singleton: JWT token + thông tin user (SharedPreferences)
│   ├── model/                ← POJO data classes
│   │   ├── User.java
│   │   ├── Character.java
│   │   ├── CharacterCard.java
│   │   ├── ChatMessage.java
│   │   ├── ChatSession.java
│   │   ├── FeedPost.java
│   │   ├── Post.java
│   │   ├── TopupPackage.java
│   │   ├── Transaction.java
│   │   └── ApiResponse.java
│   ├── remote/               ← API Service classes (gọi backend REST API)
│   │   ├── AuthApiService.java
│   │   ├── CharacterApiService.java
│   │   ├── ChatApiService.java
│   │   ├── CommunityApiService.java
│   │   ├── EconomyApiService.java
│   │   ├── SocialApiService.java
│   │   └── UserApiService.java
│   └── repository/           ← Repository pattern (chuẩn bị)
│
├── network/
│   ├── ApiClient.java        ← HTTP client dùng chung (GET/POST/PUT/DELETE)
│   └── SocketManager.java    ← Socket.IO client singleton
│
├── ui/
│   ├── auth/                 ← LoginFragment, RegisterFragment, ForgotPasswordFragment
│   ├── chat/                 ← ChatFragment, BotChatTabFragment, FriendChatTabFragment,
│   │                            ChatListFragment, ChatSessionAdapter, MessageAdapter,
│   │                            ConquestFragment, MemoryMapFragment
│   ├── community/            ← Feed, Post detail, Comment
│   ├── creator/              ← Tạo/quản lý nhân vật AI
│   ├── explore/              ← Khám phá nhân vật
│   └── profile/              ← Trang cá nhân, nạp KCH
│
├── services/                 ← Background services (notification, etc.)
├── di/                       ← Dependency injection setup
└── utils/                    ← Hàm tiện ích
```

---

## 2.2. Luồng Khởi Động Ứng Dụng

```
App khởi động
    ↓
SplashActivity
    ↓
UserSession.isLoggedIn()
    ↓
[CÓ token]                    [CHƯA token]
    ↓                              ↓
MainActivity                 Auth flow
(Bottom Navigation)          (LoginFragment)
```

**Chi tiết:**
1. `SplashActivity` khởi chạy, hiển thị logo + animation ngắn (~1-2 giây).
2. `UserSession.isLoggedIn()` — kiểm tra `SharedPreferences` key `is_logged_in`.
3. **Nếu đã đăng nhập** → `startActivity(MainActivity)`, `finish()`.
4. **Nếu chưa** → `startActivity(AuthActivity)` hoặc navigate đến `LoginFragment`.
5. `MainActivity` có `BottomNavigationView` với 5 tab: **Chat, Explore, Community, Profile, Creator**.
6. **Android Navigation Component** (`NavHostFragment` + `nav_graph.xml`) quản lý Fragment stack — nút Back hoạt động đúng.

---

## 2.3. Giao Tiếp với Server (`ApiClient.java`)

`ApiClient` là HTTP client tùy chỉnh dùng `HttpURLConnection` (không cần Retrofit/Volley/OkHttp).

### Thiết kế

```java
public class ApiClient {
    // Callback interface
    public interface ApiCallback {
        void onSuccess(JSONObject response);
        void onError(String errorMessage, int statusCode);
    }
    
    // 4 phương thức static
    public static void get(Context context, String endpoint, ApiCallback callback)
    public static void post(Context context, String endpoint, JSONObject body, ApiCallback callback)
    public static void put(Context context, String endpoint, JSONObject body, ApiCallback callback)
    public static void delete(Context context, String endpoint, ApiCallback callback)
}
```

### Cách hoạt động

```
Fragment gọi ApiClient.post(ctx, "/api/auth/login", body, callback)
    ↓
executeAsync(() -> ...) → new Thread(task).start()
    ↓  [Thread mới - không block UI]
openConnection(context, endpoint, "POST")
    → fullUrl = BASE_URL + endpoint
    → conn.setRequestMethod("POST")
    → conn.setConnectTimeout(10_000)
    → conn.setReadTimeout(30_000)
    → authHeader = UserSession.getInstance(ctx).getAuthHeader()
    → conn.setRequestProperty("Authorization", authHeader)  ← JWT tự động
    ↓
Gửi body (nếu POST/PUT):
    conn.setDoOutput(true)
    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
    os.write(body.toString().getBytes("UTF-8"))
    ↓
handleResponse(context, conn, callback)
    → code = conn.getResponseCode()
    → Đọc response body
    → JSONObject json = new JSONObject(responseBody)
    → Nếu code < 400:
        postSuccess(callback, json)  ← Main Thread
    → Nếu code == 401:
        UserSession.logout()  ← Tự xóa token
        postError(callback, msg, 401)
    → Nếu code >= 400:
        postError(callback, msg, code)
    ↓
postSuccess/postError:
    new Handler(Looper.getMainLooper()).post(() -> callback.onSuccess/onError(...))
    ↓  [Main Thread - an toàn update UI]
```

**Ví dụ sử dụng trong Fragment:**
```java
JSONObject body = new JSONObject();
body.put("email", email);
body.put("password", password);

ApiClient.post(getContext(), "/api/auth/login", body, new ApiClient.ApiCallback() {
    @Override
    public void onSuccess(JSONObject response) {
        // Chạy trên Main Thread → safe to update UI
        boolean success = response.optBoolean("success", false);
        if (success) {
            JSONObject data = response.getJSONObject("data");
            String token = data.getString("token");
            // Lưu session...
        }
    }
    
    @Override
    public void onError(String errorMessage, int statusCode) {
        Toast.makeText(getContext(), errorMessage, Toast.LENGTH_SHORT).show();
    }
});
```

---

## 2.4. Remote API Services (`data/remote/`)

Mỗi tính năng có một class riêng đóng gói việc xây dựng request body và gọi `ApiClient`. Fragment không cần biết chi tiết HTTP.

| Class | Các phương thức chính |
|---|---|
| `AuthApiService` | `login(email, pwd, cb)`, `register(username, email, pwd, name, cb)`, `forgotPassword(email, cb)` |
| `UserApiService` | `getProfile(userId, cb)`, `updateProfile(data, cb)`, `changePassword(old, new, cb)`, `getTransactions(cb)` |
| `CharacterApiService` | `getCharacters(filters, cb)`, `getCharacterById(id, cb)`, `createCharacter(data, cb)`, `updateCharacter(id, data, cb)`, `sendMessage(charId, msg, mode, cb)` |
| `ChatApiService` | `getDirectConversations(cb)`, `getDirectChatHistory(otherUserId, cb)` |
| `CommunityApiService` | `getFeed(page, cb)`, `createPost(content, images, cb)`, `likePost(postId, cb)`, `getComments(postId, cb)`, `addComment(postId, content, cb)` |
| `EconomyApiService` | `getTopupPackages(cb)`, `createPayment(packageId, amount, cb)`, `getTransactionStatus(txId, cb)` |
| `SocialApiService` | `followUser(userId, cb)`, `unfollowUser(userId, cb)` |

---

## 2.5. Quản Lý Phiên Đăng Nhập (`UserSession.java`)

`UserSession` là **Singleton** lưu trữ bền vững vào `SharedPreferences` (file: `"iiawak_session"`). Dữ liệu tồn tại kể cả khi app bị tắt.

### Dữ liệu lưu trữ

| Key | Type | Mô tả |
|---|---|---|
| `is_logged_in` | Boolean | Đã đăng nhập hay chưa |
| `jwt_token` | String | JWT token để xác thực API |
| `user_id` | String | MongoDB `_id` của user |
| `username` | String | Username |
| `display_name` | String | Tên hiển thị |
| `email` | String | Email |
| `role` | String | `"user"` hoặc `"admin"` |
| `kch_balance` | Int | Số dư Kim Cương Hồng |
| `is_creator` | Boolean | Có quyền tạo nhân vật không |
| `app_lock_pin` | String | PIN khóa app |
| `app_lock_enabled` | Boolean | Bật/tắt khóa PIN |

### Phương thức quan trọng

```java
// Lưu toàn bộ thông tin sau đăng nhập thành công
void login(String token, String userId, String username,
           String displayName, String email, String role, int kchBalance)

// Xóa sạch mọi dữ liệu (đăng xuất)
void logout()  // → prefs.edit().clear().apply()

// Lấy header Authorization để gửi kèm request
String getAuthHeader()  // → "Bearer <token>" hoặc ""

// Kiểm tra quyền admin
boolean isAdmin()  // → role.equals("admin")

// Quản lý số dư KCH
void spendKch(int amount)   // trừ KCH (không âm)
void addKch(int amount)     // cộng KCH
void setKchBalance(int n)   // đặt lại số dư
```

---

## 2.6. Real-time Chat (`SocketManager.java`)

`SocketManager` là **Singleton** quản lý kết nối Socket.IO với backend.

```java
public class SocketManager {
    private static SocketManager instance;
    private Socket mSocket;
    
    private SocketManager() {
        IO.Options opts = new IO.Options();
        opts.reconnection = true;  // Tự kết nối lại
        mSocket = IO.socket(NetworkConfig.BASE_URL, opts);
    }
    
    // Connect khi cần (ví dụ: mở màn hình chat)
    void connect(String authHeader) { mSocket.connect(); }
    
    // Disconnect khi không cần (ví dụ: logout)
    void disconnect() { mSocket.disconnect(); }
    
    // Lấy socket để đăng ký event listener
    Socket getSocket() { return mSocket; }
}
```

### Sử dụng trong `FriendChatTabFragment`

```java
Socket socket = SocketManager.getInstance().getSocket();

// Gửi tin nhắn
JSONObject msg = new JSONObject();
msg.put("receiverId", otherUserId);
msg.put("content", messageText);
socket.emit("send_direct_msg", msg);

// Nhận tin nhắn mới
socket.on("receive_direct_msg", args -> {
    JSONObject data = (JSONObject) args[0];
    // Cập nhật RecyclerView trên Main Thread
    runOnUiThread(() -> messageAdapter.addMessage(data));
});

// Chỉ báo đang gõ
socket.on("typing", args -> {
    runOnUiThread(() -> showTypingIndicator());
});
socket.on("stopTyping", args -> {
    runOnUiThread(() -> hideTypingIndicator());
});
```

---

## 2.7. Điều Hướng (Navigation Component)

App dùng **Android Jetpack Navigation Component** để quản lý Fragment stack an toàn.

### Cấu trúc điều hướng

```
AuthGraph (khi chưa đăng nhập):
    LoginFragment
        ├── → RegisterFragment
        ├── → ForgotPasswordFragment
        └── → [action_login_to_main] → MainActivity

MainGraph (khi đã đăng nhập):
    MainActivity
        ├── Tab Chat → ChatListFragment → ChatFragment
        ├── Tab Explore → ExploreFragment → CharacterDetailFragment
        ├── Tab Community → FeedFragment → PostDetailFragment
        ├── Tab Profile → ProfileFragment → EditProfileFragment
        └── Tab Creator → CreatorFragment → CreateCharacterFragment
```

### Cách điều hướng trong code

```java
// Từ LoginFragment, sau khi login thành công:
Navigation.findNavController(view).navigate(R.id.action_login_to_main);

// Từ LoginFragment sang RegisterFragment:
Navigation.findNavController(view).navigate(R.id.registerFragment);

// Từ bất kỳ Fragment nào, quay lại:
Navigation.findNavController(view).navigateUp();
```

---

## 2.8. Các Màn Hình Chính

### Auth (`ui/auth/`)

#### `LoginFragment`
**Luồng:**
1. Validate email (format) + password (tối thiểu 6 ký tự).
2. `AuthApiService.login(email, password, callback)`.
3. `onSuccess`:
   - Parse response `{ success, data: { token, user } }`.
   - `UserSession.getInstance(ctx).login(token, userId, username, displayName, email, role, kchBalance)`.
   - Hiển thị Toast "Chào mừng lại, [displayName]!".
   - `Navigation.navigate(R.id.action_login_to_main)`.
4. `onError`: Hiển thị Toast lỗi.

#### `RegisterFragment`
- Validate: email format, password >= 6 ký tự, confirm password match.
- `AuthApiService.register(username, email, password, displayName, callback)`.
- Thành công → tự động đăng nhập + navigate Main.

#### `ForgotPasswordFragment`
- Nhập email → `AuthApiService.forgotPassword(email, callback)`.
- Thông báo: "Email hướng dẫn đã được gửi."

---

### Chat (`ui/chat/`)

#### `ChatListFragment`
- Hiển thị danh sách phiên chat: AI sessions + direct conversations.
- Dùng `ChatSessionAdapter` với RecyclerView.
- Mỗi item: avatar nhân vật/user, tên, tin nhắn cuối, thời gian.

#### `ChatFragment`
**Tab structure:**
- Tab 1 (`BotChatTabFragment`): Chat với nhân vật AI.
- Tab 2 (`FriendChatTabFragment`): Chat trực tiếp với bạn bè.

#### `BotChatTabFragment` — Chat AI
1. Tải lịch sử chat: `CharacterApiService.sendMessage(charId, "", mode, callback)` hoặc GET history.
2. Hiển thị trong RecyclerView (tin user bên phải, AI bên trái).
3. Khi gửi tin nhắn:
   - Hiển thị tin user ngay (optimistic UI).
   - Hiển thị loading indicator (animation "đang gõ...").
   - Gọi API → nhận AI reply → ẩn loading, hiển thị reply.
4. Hỗ trợ chuyển đổi **Normal ↔ Story mode**.

#### `FriendChatTabFragment` — Direct Chat
1. Kết nối Socket.IO: `SocketManager.getInstance().connect(authHeader)`.
2. Tải lịch sử: `ChatApiService.getDirectChatHistory(otherUserId, callback)`.
3. Đăng ký event `receive_direct_msg` để nhận tin real-time.
4. Khi gửi: `socket.emit("send_direct_msg", { receiverId, content })`.

---

### Explore (`ui/explore/`)
- Hiển thị grid/list nhân vật công khai.
- **Bộ lọc**: tag, giới tính, ageRating, từ khóa tìm kiếm.
- Nhấn vào nhân vật → màn hình detail → thông tin + nút "Bắt đầu chat".
- Gọi `CharacterApiService.getCharacters(filters)` với phân trang.

---

### Community (`ui/community/`)
- **Feed**: Danh sách bài đăng từ người đang theo dõi (phân trang).
- **Tạo bài**: Text + tối đa N ảnh (gọi upload API trước, lấy URL).
- **Like**: `CommunityApiService.likePost(postId, callback)`.
- **Comment**: Danh sách + form thêm bình luận.
- **Profile người khác**: Nhấn avatar → xem profile + follow/unfollow.

---

### Profile (`ui/profile/`)
- Hiển thị avatar, display name, username, số dư KCH.
- **Chỉnh sửa**: Avatar (ImagePicker + upload), display name, bio.
- **Nạp KCH**:
  1. Hiển thị danh sách gói nạp (`EconomyApiService.getTopupPackages()`).
  2. Chọn gói → `createPayment(packageId, amount)` → nhận `vnp_Url`.
  3. Mở `WebView` hoặc `Custom Tab` với URL VNPay.
  4. Sau thanh toán → refresh số dư.
- **Lịch sử giao dịch**: Danh sách các Transaction.
- **Giftcode**: Nhập mã → nhận KCH.

---

### Creator (`ui/creator/`)
- **Form tạo nhân vật**: Basic info (name, avatar, gender, tags, slogan, privacy, ageRating) + Advanced (personality, bio, publicInfo, openingLine, firstMessage, speakingStyle...).
- **Upload ảnh đại diện**: ImagePicker → `UploadApiService.uploadImage()` → lấy URL.
- **Danh sách nhân vật**: Đã tạo, thống kê lượt chat.
- **Quyền truy cập**: Chỉ user có `isCreator=true` (set từ server) mới thấy tab Creator.

---

# PHẦN 3: LUỒNG TƯƠNG TÁC ĐẦU-CUỐI (End-to-End Flows)

## 3.1. Luồng Đăng Nhập

```
[Mobile] LoginFragment
    ↓ validate email + password (local)
    ↓ AuthApiService.login(email, password, callback)
    ↓ ApiClient.post("/api/auth/login", body)  [Thread mới]
─── HTTP POST → authLimiter → sanitize → validate ──────────────
[Backend] AuthController.login(req, res)
    ↓ AuthService.login({ email, password })
    ↓ UserRepository.findByEmail(email)
    ↓ user.comparePassword(password)  [bcrypt.compare]
    ↓ Kiểm tra status != 'banned'
    ↓ jwtUtil.sign({ id, role }) → JWT token
    ↓ Response: { success: true, data: { token, user } }
─── HTTP Response ───────────────────────────────────────────────
[Mobile] ApiCallback.onSuccess(json)  [Main Thread]
    ↓ UserSession.getInstance(ctx).login(token, userId, ...)
    ↓ Toast "Chào mừng lại, [displayName]!"
    ↓ Navigation.navigate(R.id.action_login_to_main)
    ↓ MainActivity hiển thị với Bottom Navigation
```

---

## 3.2. Luồng Chat với Nhân Vật AI

```
[Mobile] ChatFragment → BotChatTabFragment
    ↓ User nhập tin nhắn → nhấn Send
    ↓ Hiển thị tin user ngay (optimistic UI)
    ↓ Hiển thị loading indicator "Đang nhập..."
    ↓ CharacterApiService.sendMessage(charId, text, "normal", callback)
    ↓ ApiClient.post("/api/characters/{id}/chat", body)  [JWT header]
─── HTTP POST → auth.middleware → CharacterController.chat() ────
[Backend] CharacterService.chat(characterId, userId, message, mode)
    ↓ CharacterRepository.findById(charId)  [verify tồn tại, không bị ban]
    ↓ ChatRepository.findOrCreateSession(userId, charId, "normal")
    ↓ [session mới] → thêm character.firstMessage vào messages
    ↓ session.messages.push({ role: 'user', content: message })
    ↓ _buildSystemPrompt(character, "normal")
      → "Bạn là [name], tính cách: [personality]..."
      → "Phản hồi 2-5 câu, tự nhiên, dùng emoji"
    ↓ _callGeminiAI(prompt, last10messages)
      → POST generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
      → { temperature: 0.8, maxOutputTokens: 200 }
      → Gemini phân tích context → sinh AI reply
    ↓ session.messages.push({ role: 'assistant', content: aiReply })
    ↓ [vượt MAX_MESSAGES] → session.messages = messages.slice(-MAX)
    ↓ chatRepository.saveSession(session)
    ↓ characterRepository.incrementChats(charId)
    ↓ Response: { reply: "...", sessionId }
─── HTTP Response ───────────────────────────────────────────────
[Mobile] ApiCallback.onSuccess()  [Main Thread]
    ↓ Ẩn loading indicator
    ↓ Thêm AI reply vào RecyclerView
    ↓ Scroll xuống cuối
```

---

## 3.3. Luồng Nhắn Tin Trực Tiếp (Real-time WebSocket)

```
[Mobile A] FriendChatTabFragment.onViewCreated()
    ↓ SocketManager.getInstance().connect(authHeader)
─── WebSocket Handshake ─────────────────────────────────────────
[Backend] io.use(authenticateSocket)
    ↓ Verify JWT từ handshake.auth.token hoặc headers
    ↓ socket.userId = user._id
    ↓ handleUserConnect(socket, io)
      → Lưu userSocketMap[userId] = socket.id
─── Connection Established ──────────────────────────────────────

[Mobile A] Gõ tin nhắn → nhấn Send
    ↓ socket.emit("send_direct_msg", { receiverId: B_id, content: "Hi!" })

[Backend] socket.on("send_direct_msg")
    ↓ webSocketManager.sendDirectMessage(io, userId_A, userId_B, "Hi!", Message)
      → Tạo Message { senderId: A, receiverId: B, conversationId: "A_B", content: "Hi!" }
      → Message.save() → MongoDB
      → receiverSocketId = userSocketMap[userId_B]
      → io.to(receiverSocketId).emit("receive_direct_msg", messageData)
    ↓ socket.emit("msg_sent_status", { success: true, timestamp })

[Mobile A] socket.on("msg_sent_status") → ✓ xác nhận đã gửi

[Mobile B] socket.on("receive_direct_msg") 
    ↓ [Main Thread] messageAdapter.addMessage(messageData)
    ↓ recyclerView.scrollToPosition(last)
    ↓ Hiển thị notification nếu app ở background
```

---

## 3.4. Luồng Nạp Tiền VNPay

```
[Mobile] ProfileFragment → chọn gói nạp (ví dụ: 100 KCH = 20,000đ)
    ↓ EconomyApiService.createPayment(packageId, 20000, callback)
    ↓ ApiClient.post("/api/payment/create", body)  [JWT]
─── HTTP POST → paymentLimiter → PaymentController ─────────────
[Backend] VNPayService.createPaymentUrl({ userId, packageId, amount: 20000 })
    ↓ userRepository.findById(userId)  [xác thực user]
    ↓ economyRepository.findPackageById(packageId)  [xác thực gói]
    ↓ txId = formatUtil.txId('VNP')  → "VNP-1718000000000"
    ↓ Transaction.create({ txId, userId, amountKch: 100, priceVnd: 20000,
                          type: 'topup', status: 'pending', paymentMethod: 'VNPAY' })
    ↓ Xây dựng VNPay params:
      vnp_Amount = 20000 * 100 = 2000000
      vnp_ExpireDate = now + 15 phút
      vnp_TxnRef = txId
      vnp_OrderInfo = "Nap 100 KCH + 0 Bonus"
      ...
    ↓ sortObject(params) [sắp xếp alphabet]
    ↓ HMAC-SHA512(queryString, vnp_HashSecret) → secureHash
    ↓ Response: { vnp_Url: "https://sandbox.vnpayment.vn/paygate?...", txId, amountKch: 100 }
─── HTTP Response ───────────────────────────────────────────────
[Mobile] Mở WebView / Custom Chrome Tab với vnp_Url
    ↓ Người dùng chọn ngân hàng → nhập thông tin → xác thực OTP
    ↓ VNPay xử lý thanh toán
─── VNPay → POST /api/payment/ipn (webhook) ─────────────────────
[Backend] VNPayService.verifyWebhook(vnp_Params)
    ↓ secureHash = vnp_Params["vnp_SecureHash"]
    ↓ Xóa secureHash khỏi params
    ↓ sortObject(params) → tính lại HMAC-SHA512
    ↓ Nếu secureHash !== calculated → return { statusCode: 97, "Invalid signature" }
    ↓ transactionId = vnp_Params["vnp_TxnRef"]  → tìm Transaction
    ↓ vnp_ResponseCode === "00" (thành công):
      ↓ handlePaymentSuccess(transaction, vnp_Params)
        → updateTransaction(id, { status: 'success', vnp_TransactionNo, ... })
        → User.findByIdAndUpdate(userId, { $inc: { kchBalance: 100 } })
        → Console: "✅ Payment success: ... (+100 KCH)"
    ↓ Khác → updateTransaction(id, { status: 'failed' })
    ↓ Return { statusCode: 0, "Confirm Success" }  ← VNPay yêu cầu response này
─────────────────────────────────────────────────────────────────
[Mobile] Người dùng quay lại app
    ↓ ProfileFragment.onResume() → refresh profile
    ↓ UserApiService.getProfile() → cập nhật kchBalance mới
    ↓ Hiển thị: "Số dư KCH: 100"
```

---

# KẾT LUẬN

Hệ thống Iiawak được thiết kế theo kiến trúc phân tầng rõ ràng ở cả backend lẫn mobile:

| Khía cạnh | Điểm nổi bật |
|---|---|
| **Kiến trúc Backend** | 4 lớp tách biệt hoàn toàn trách nhiệm. Dễ test, dễ thay thế từng lớp. |
| **Bảo mật** | JWT + Rate Limiting + Input Sanitization + Helmet. Đa lớp bảo vệ. |
| **Kiến trúc Mobile** | Fragment-based + ApiClient dùng chung + UserSession singleton. Code tái sử dụng cao. |
| **AI Integration** | Gemini API tại tầng BusinessLogic. System prompt linh hoạt theo nhân vật. 2 chế độ chat. |
| **Thanh toán** | VNPay với HMAC-SHA512 hai chiều (tạo URL + verify webhook). An toàn giao dịch. |
| **Real-time** | Socket.IO + JWT authentication. Typing indicator, read receipt, room management. |
| **Scalability** | Kiến trúc phân tầng cho phép thay thế DB, AI provider mà không ảnh hưởng các lớp khác. |

---

> **Ghi chú để tạo file DOCX:** Chạy lệnh sau trong thư mục dự án để tạo file DOCX từ Markdown này:
> ```bash
> # Nếu có Pandoc:
> pandoc "Giải Thích Hoạt Động Hệ Thống.md" -o "Giải Thích Hoạt Động Hệ Thống.docx" --toc
>
> # Hoặc chạy script Python có sẵn:
> python3 gen_doc.py
> # (Cần thêm quyền ghi file, hoặc dùng: python3 gen_doc.py > output.b64 rồi decode)
> ```
