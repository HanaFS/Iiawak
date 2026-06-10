import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, EyeOff, ShieldOff, AlertTriangle } from 'lucide-react';
import './Login.css';

const MAX_ATTEMPTS = 3;
const STORAGE_ATTEMPTS = 'admin_login_attempts';
const STORAGE_LOCKED   = 'admin_account_locked';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  // Đọc trạng thái từ localStorage — bền vững qua reload
  const [attempts, setAttempts] = useState(
    () => parseInt(localStorage.getItem(STORAGE_ATTEMPTS) || '0', 10)
  );
  const [locked, setLocked] = useState(
    () => localStorage.getItem(STORAGE_LOCKED) === 'true'
  );

  const handleLogin = (e) => {
    e.preventDefault();
    if (locked) return;

    const storedPassword = localStorage.getItem('admin_password') || 'admin123';

    if (username.trim() === 'admin' && password === storedPassword) {
      // Thành công → xoá lịch sử sai
      localStorage.removeItem(STORAGE_ATTEMPTS);
      localStorage.removeItem(STORAGE_LOCKED);
      sessionStorage.setItem('isAuthenticated', 'true');
      navigate('/users');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem(STORAGE_ATTEMPTS, String(newAttempts));

      if (newAttempts >= MAX_ATTEMPTS) {
        // Khoá vĩnh viễn
        localStorage.setItem(STORAGE_LOCKED, 'true');
        setLocked(true);
        setUsername('');
        setPassword('');
        setError('');
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(`Tài khoản hoặc mật khẩu không đúng! Còn ${remaining} lần thử.`);
      }
    }
  };

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

        {/* ── Màn hình khoá vĩnh viễn ── */}
        {locked ? (
          <div className="login-locked-box">
            <ShieldOff size={36} className="locked-icon" />
            <p className="locked-title">Tài khoản đã bị khoá</p>
            <p className="locked-sub">
              Bạn đã nhập sai mật khẩu quá <strong>{MAX_ATTEMPTS} lần</strong>.<br />
              Tài khoản bị khoá vĩnh viễn cho đến khi được mở khoá bởi quản trị viên cấp cao.
            </p>
            <p className="locked-hint">
              Vui lòng liên hệ: <strong>hoaian.admin@iiawak.com</strong>
            </p>
          </div>
        ) : (
          /* ── Form đăng nhập ── */
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
                placeholder="Nhập tên tài khoản..."
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                autoComplete="username"
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

            <button type="submit" className="glass-button login-btn">
              Đăng nhập
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
