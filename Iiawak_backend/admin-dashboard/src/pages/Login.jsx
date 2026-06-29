import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, ShieldOff, AlertTriangle } from 'lucide-react';
import './Login.css';

const MAX_ATTEMPTS = 3;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Kiểm tra trạng thái khoá tài khoản từ server.
 * Gọi API với identifier rỗng — server sẽ trả về ADMIN_LOCKED nếu tài khoản bị khoá.
 * Cờ khoá được lưu TRÊN SERVER (MongoDB), không thể bypass bằng localStorage/reload.
 */
const Login = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); // username hoặc email
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  // Trạng thái khoá và số lần thử — chỉ phản chiếu trạng thái từ SERVER
  const [locked, setLocked]     = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Khi component mount: kiểm tra nếu session đang có flag locked từ lần trước
  // (Không dùng localStorage — chỉ dùng sessionStorage để track trong tab hiện tại)
  useEffect(() => {
    const wasLocked = sessionStorage.getItem('admin_locked') === 'true';
    if (wasLocked) setLocked(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (locked || loading) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      // ── Tài khoản bị khoá vĩnh viễn (cờ từ MongoDB) ──────────────────────
      if (data.code === 'ADMIN_LOCKED') {
        // Đánh dấu vào sessionStorage để giữ trạng thái khi navigate lại /login
        sessionStorage.setItem('admin_locked', 'true');
        setLocked(true);
        setIdentifier('');
        setPassword('');
        setLoading(false);
        return;
      }

      if (res.ok && data.success) {
        // Đăng nhập thành công
        sessionStorage.removeItem('admin_locked');
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('adminToken', data.data.token);
        sessionStorage.setItem('adminUser', JSON.stringify(data.data.user));
        navigate('/users');
        return;
      }

      // ── Sai mật khẩu — còn lần thử ───────────────────────────────────────
      const newAttempts = MAX_ATTEMPTS - (data.remaining ?? 0);
      setAttempts(newAttempts);

      if (data.remaining === 0 || data.code === 'ADMIN_LOCKED') {
        // Server vừa khoá (remaining = 0 hoặc tới đây rồi mới trả LOCKED)
        sessionStorage.setItem('admin_locked', 'true');
        setLocked(true);
        setIdentifier('');
        setPassword('');
      } else {
        setError(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng!');
      }

    } catch {
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    }

    setLoading(false);
  };

  // ── Màn hình khoá vĩnh viễn ─────────────────────────────────────────────────
  if (locked) {
    return (
      <div className="login-container">
        <div className="login-card glass animate-fade-in">
          <div className="login-header">
            <div className="icon-wrapper">
              <Heart size={40} color="#FF1493" fill="#FF69B4" />
            </div>
            <h2>Iiawak Admin</h2>
            <p className="login-subtitle">Hệ thống quản trị nội bộ</p>
          </div>

          <div className="login-locked-box">
            <ShieldOff size={36} className="locked-icon" />
            <p className="locked-title">Tài khoản đã bị khoá</p>
            <p className="locked-sub">
              Bạn đã nhập sai mật khẩu quá <strong>{MAX_ATTEMPTS} lần</strong>.<br />
              Tài khoản bị khoá <strong>vĩnh viễn</strong> và không thể mở bằng bất kỳ phương thức nào.
            </p>
            <p className="locked-hint">
              Vui lòng liên hệ lập trình viên để được mở khoá.<br />
              <strong>hoaian.admin@iiawak.com</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form đăng nhập ───────────────────────────────────────────────────────────
  return (
    <div className="login-container">
      <div className="login-card glass animate-fade-in">
        <div className="login-header">
          <div className="icon-wrapper">
            <Heart size={40} color="#FF1493" fill="#FF69B4" />
          </div>
          <h2>Iiawak Admin</h2>
          <p className="login-subtitle">Hệ thống quản trị nội bộ</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="login-error-box">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              className="glass-input"
              placeholder="Nhập tên đăng nhập hoặc email..."
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="input-group">
            <label>Mật khẩu</label>
            <div className="password-input-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                className="glass-input"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-pass-btn"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Thanh cảnh báo số lần còn lại */}
          {attempts > 0 && (
            <div className="attempt-bar">
              {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                <div key={i} className={`attempt-dot ${i < attempts ? 'used' : ''}`} />
              ))}
              <span className="attempt-text">
                {MAX_ATTEMPTS - attempts} lần thử còn lại
              </span>
            </div>
          )}

          <button type="submit" className="glass-button login-btn" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
