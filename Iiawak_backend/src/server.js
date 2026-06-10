const config     = require('./config');
const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');

const db      = require('./3_DataAccess/Database/connection');
const Message = require('./3_DataAccess/Models/Message.model');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Kết nối MongoDB (từ 3_DataAccess/Database) ───────────────────────────────
db.connect().catch(err => {
  console.error('❌ MongoDB lỗi:', err.message);
  process.exit(1);
});

// ─── Socket.io: Real-time messaging ──────────────────────────────────────────
const onlineUsers = new Map(); // userId → socketId

io.on('connection', (socket) => {
  console.log('🔌 Kết nối mới:', socket.id);

  socket.on('user_online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit('user_status', { userId, online: true });
  });

  socket.on('join_char_room', (roomId) => {
    socket.join(`char_${roomId}`);
  });

  socket.on('send_direct_msg', async (data) => {
    try {
      const { senderId, receiverId, content } = data;
      const conversationId = [senderId, receiverId].sort().join('_');
      const msg = await new Message({ conversationId, senderId, receiverId, content }).save();

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) io.to(receiverSocketId).emit('receive_direct_msg', msg);
      socket.emit('msg_sent_status', { success: true, messageId: msg._id });
    } catch (err) {
      console.error('❌ Lỗi gửi tin nhắn:', err.message);
      socket.emit('msg_sent_status', { success: false, error: err.message });
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user_status', { userId, online: false });
        break;
      }
    }
  });
});

// ─── Routes (giữ nguyên paths để mobile không cần thay đổi) ──────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/user',       require('./routes/user'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api/community',  require('./routes/community'));
app.use('/api/upload',     require('./routes/upload'));     // ← multipart/form-data
app.use('/api/economy',    require('./routes/economy'));
app.use('/api/giftcodes',  require('./routes/giftcodes'));
app.use('/api/social',     require('./routes/social'));
app.use('/api/chat',       require('./routes/chat'));
app.use('/api/admin',      require('./routes/admin'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🚀 Iiawak API v3.0 — Kiến trúc 5 lớp', status: 'ok', timestamp: new Date() });
});

// ─── Khởi động ────────────────────────────────────────────────────────────────
const PORT = config.app.port;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server chạy tại port ${PORT}`);
  console.log('📐 Kiến trúc: Presentation → BusinessLogic → DataAccess → Core');
});
