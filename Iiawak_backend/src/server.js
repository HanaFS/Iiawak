const config     = require('./config');
const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
const helmet     = require('helmet');
const compression = require('compression');

const db      = require('./3_DataAccess/Database/connection');
const Message = require('./3_DataAccess/Models/Message.model');
const logger  = require('./4_Core/Logger/logger');
const requestLogger = require('./1_Presentation/Middlewares/requestLogger.middleware');
const webSocketManager = require('./1_Presentation/Middlewares/websocket.middleware');
const { globalLimiter, authLimiter, apiLimiter, paymentLimiter, uploadLimiter, searchLimiter } = require('./1_Presentation/Middlewares/rateLimiter.middleware');
const { sanitizeMiddleware, preventInjectionMiddleware } = require('./1_Presentation/Middlewares/requestValidator.middleware');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { 
    origin: process.env.ADMIN_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Enable compression
  transports: ['websocket', 'polling'],
});

// ─── Security Middlewares ─────────────────────────────────────────────────────
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression

// ─── CORS & Body Parser ───────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ADMIN_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─── Global Middleware Pipeline ───────────────────────────────────────────────
app.use(globalLimiter); // Global rate limit
app.use(requestLogger); // Request logging
app.use(sanitizeMiddleware); // Input sanitization
app.use(preventInjectionMiddleware); // Injection prevention

// ─── Kết nối MongoDB (từ 3_DataAccess/Database) ───────────────────────────────
db.connect().catch(err => {
  logger.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// ─── Socket.io: Real-time messaging with JWT Authentication ──────────────────
// Middleware: Authenticate all Socket.io connections with JWT
io.use((socket, next) => {
  webSocketManager.authenticateSocket(socket, next);
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  logger.info(`🔌 WebSocket connected: ${userId} (${socket.id})`);

  // Handle connection
  webSocketManager.handleUserConnect(socket, io);

  // ─── Direct Messaging ─────────────────────────────────────────────────────
  socket.on('send_direct_msg', async (data) => {
    try {
      const { receiverId, content } = data;
      if (!receiverId || !content) {
        socket.emit('error', { message: 'Missing receiverId or content' });
        return;
      }

      await webSocketManager.sendDirectMessage(io, userId, receiverId, content, Message);
      socket.emit('msg_sent_status', { success: true, timestamp: new Date() });
      logger.info(`📨 Message sent: ${userId} → ${receiverId}`);
    } catch (err) {
      logger.error(`❌ Error sending message: ${err.message}`);
      socket.emit('msg_sent_status', { success: false, error: err.message });
    }
  });

  socket.on('receive_direct_msg', async (data) => {
    try {
      const { messageId } = data;
      if (!messageId) return;

      webSocketManager.emitReadReceipt(io, messageId, userId, data.conversationId);
      logger.debug(`✅ Message read: ${messageId}`);
    } catch (err) {
      logger.error(`❌ Error marking message as read: ${err.message}`);
    }
  });

  // ─── Room Management ──────────────────────────────────────────────────────
  socket.on('join_char_room', (roomId) => {
    socket.join(`char_${roomId}`);
    logger.info(`👤 User ${userId} joined character room: ${roomId}`);
    io.to(`char_${roomId}`).emit('user:joined', { userId, timestamp: new Date() });
  });

  socket.on('leave_char_room', (roomId) => {
    socket.leave(`char_${roomId}`);
    logger.info(`👤 User ${userId} left character room: ${roomId}`);
    io.to(`char_${roomId}`).emit('user:left', { userId, timestamp: new Date() });
  });

  // ─── Typing Indicators (Throttled) ────────────────────────────────────────
  socket.on('typing', (data) => {
    webSocketManager.handleTypingIndicator(socket, io, data);
  });

  socket.on('stopTyping', (data) => {
    webSocketManager.handleStopTyping(socket, io, data);
  });

  // ─── WebSocket Statistics ───────────────────────────────────────────────────
  socket.on('request_stats', () => {
    socket.emit('stats', webSocketManager.getStats());
  });

  // ─── Disconnect Handler ──────────────────────────────────────────────────
  socket.on('disconnect', () => {
    webSocketManager.handleUserDisconnect(socket, io);
    logger.info(`🔌 WebSocket disconnected: ${userId}`);
  });

  // ─── Reconnection Handler ──────────────────────────────────────────────────
  socket.on('reconnect', () => {
    webSocketManager.handleReconnect(socket, io);
    logger.info(`🔄 WebSocket reconnected: ${userId}`);
  });
});

// Health check for WebSocket
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    websocket: {
      stats: webSocketManager.getStats(),
    },
  });
});

// ─── Routes with API versioning (/api/v1/) ──────────────────────────────────
// Auth routes (stricter rate limit)
app.use('/api/auth',       authLimiter, require('./routes/auth'));

// User routes (with API limiter)
app.use('/api/user',       apiLimiter, require('./routes/user'));

// Search routes (search-specific limiter)
app.use('/api/search',     searchLimiter, require('./routes/search'));

// Character routes
app.use('/api/characters', require('./routes/characters'));

// Community routes
app.use('/api/community',  require('./routes/community'));

// Upload routes (stricter upload limiter)
app.use('/api/upload',     uploadLimiter, require('./routes/upload'));

// Economy routes
app.use('/api/economy',    require('./routes/economy'));

// Payment routes (payment-specific limiter)
app.use('/api/payment',    paymentLimiter, require('./routes/payment'));

// Giftcode routes
app.use('/api/giftcodes',  require('./routes/giftcodes'));

// Social routes
app.use('/api/social',     require('./routes/social'));

// Chat routes
app.use('/api/chat',       require('./routes/chat'));

// Admin routes (stricter limit)
app.use('/api/admin',      apiLimiter, require('./routes/admin'));

// ─── Legacy routes (mobile compatibility) ────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Iiawak API v3.1 — Production Backend',
    status: 'ok',
    version: '3.1.0',
    features: ['VNPay payments', 'Redis caching', 'WebSocket JWT', 'Rate limiting', 'Request validation'],
    timestamp: new Date(),
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`[Error] ${err.message}`, { status: err.status, path: req.path });
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Server Startup ───────────────────────────────────────────────────────────
const PORT = config.app.port || 5000;

const shutdown = () => {
  logger.info('🛑 Shutting down gracefully...');
  server.close(() => {
    logger.info('✅ Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('❌ Force shutdown (timeout)');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📐 Architecture: Presentation → BusinessLogic → DataAccess → Core`);
  logger.info(`🔐 Features: VNPay, Redis, WebSocket JWT, Rate Limiting, Input Validation`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`✨ Version: 3.1.0 (Phase 5-7 Complete)`);
});
