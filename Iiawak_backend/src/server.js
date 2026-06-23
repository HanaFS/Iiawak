const config     = require('./config');
const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
const helmet     = require('helmet');
const compression = require('compression');

const db      = require('./data-access/Database/connection');
const redis   = require('./data-access/Cache/redisClient');
const Message = require('./data-access/Models/Message.model');
const logger  = require('./core/Logger/logger');
const requestLogger = require('./presentation/Middlewares/requestLogger.middleware');
const webSocketManager = require('./presentation/Middlewares/websocket.middleware');
const { globalLimiter, authLimiter, apiLimiter, paymentLimiter, uploadLimiter, searchLimiter } = require('./presentation/Middlewares/rateLimiter.middleware');
const { sanitizeMiddleware, preventInjectionMiddleware } = require('./presentation/Middlewares/requestValidator.middleware');
const errorHandler = require('./core/Exceptions/ErrorHandler');
const errorMiddleware = require('./presentation/Middlewares/error.middleware');

// ─── Process Level Error Catching (Node Best Practices) ───────────────────────
process.on('uncaughtException', (error) => {
  errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(reason);
});

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

// Lưu trữ io vào express app để các controller/service có thể truy cập
app.set('io', io);

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

// ─── Kết nối MongoDB & Redis ───────────────────────────────────────────────
db.connect()
  .then(() => redis.connect())
  .catch(err => {
    logger.error('❌ Database connection error:', err.message);
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
app.use('/api', require('./Presentation/Routes/index.js'));

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
app.use(errorMiddleware);

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
