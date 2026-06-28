import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, LogOut, Bell, Shield, Key, Eye, EyeOff, Check, X,
  Award, Briefcase, Mail, User, Clock, AlertCircle, Info,
  ChevronRight, Lock
} from 'lucide-react';
import './Topbar.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Thông tin admin mặc định (sẽ được ghi đè bởi dữ liệu từ sessionStorage)
const DEFAULT_ADMIN = {
  name: 'Quản Trị Viên',
  code: 'NV-2026-IIAWAK-01',
  role: 'Tổng Quản Trị Viên',
  email: 'admin@iiawak.com',
  department: 'Ban Vận Hành & An Ninh Hệ Thống',
  joinedDate: '---',
  lastLogin: '---',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
};

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Tài khoản @linh_kawaii đã bị khóa tự động do đạt 3/3 cảnh cáo', time: '5 phút trước', read: false, type: 'danger' },
  { id: 2, text: '2 báo cáo mới đang chờ xét duyệt từ người dùng', time: '20 phút trước', read: false, type: 'warning' },
  { id: 3, text: '@cattuong_pink nạp thành công 500,000 xu vào ví', time: '1 giờ trước', read: true, type: 'success' },
  { id: 4, text: 'Yêu cầu hỗ trợ mới từ @tuan_handsome', time: '3 giờ trước', read: true, type: 'info' },
];

// ── Tách PasswordField ra ngoài ──
// Không định nghĩa component con bên trong component cha
// tránh React tạo lại (remount) mỗi lần render khi gõ phím
function PasswordField({ field, label, placeholder, showPass, passwords, onChangePass, onToggleShow }) {
  return (
    <div className="tb-pass-field">
      <label>{label}</label>
      <div className="tb-pass-input-wrap">
        <input
          type={showPass[field] ? 'text' : 'password'}
          value={passwords[field]}
          placeholder={placeholder}
          autoComplete="new-password"
          onChange={e => onChangePass(field, e.target.value)}
        />
        <button type="button" onClick={() => onToggleShow(field)}>
          {showPass[field] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function Topbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('info'); // 'info' | 'security'
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS);

  // Lấy thông tin admin từ sessionStorage (đã lưu sau khi đăng nhập)
  const adminUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('adminUser') || '{}'); } catch { return {}; }
  })();
  const ADMIN_INFO = {
    ...DEFAULT_ADMIN,
    name:  adminUser.displayName || DEFAULT_ADMIN.name,
    email: adminUser.email       || DEFAULT_ADMIN.email,
    role:  adminUser.role === 'admin' ? 'Tổng Quản Trị Viên' : DEFAULT_ADMIN.role,
  };

  // Password change state
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });
  const [passLoading, setPassLoading] = useState(false);

  const notifRef = useRef(null);
  const adminRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (adminRef.current && !adminRef.current.contains(e.target)) setShowAdmin(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, read: true })));
  const removeNotif = (id, e) => { e.stopPropagation(); setNotifs(p => p.filter(n => n.id !== id)); };

  const handleLogout = () => { sessionStorage.removeItem('isAuthenticated'); navigate('/login', { replace: true }); };

  const openAdmin = () => {
    setShowAdmin(true);
    setAdminTab('info');
    setPassMsg({ text: '', type: '' });
    setPasswords({ current: '', newPass: '', confirm: '' });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { current, newPass, confirm } = passwords;
    if (!current || !newPass || !confirm)
      return setPassMsg({ text: 'Vui lòng điền đầy đủ tất cả các trường!', type: 'error' });
    if (newPass.length < 6)
      return setPassMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự!', type: 'error' });
    if (newPass === current)
      return setPassMsg({ text: 'Mật khẩu mới không được trùng mật khẩu cũ!', type: 'error' });
    if (newPass !== confirm)
      return setPassMsg({ text: 'Xác nhận mật khẩu không khớp!', type: 'error' });

    setPassLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPassMsg({ text: 'Đổi mật khẩu thành công! Đang đăng xuất... ✨', type: 'success' });
        setPasswords({ current: '', newPass: '', confirm: '' });
        setTimeout(() => {
          sessionStorage.clear();
          navigate('/login', { replace: true });
        }, 1500);
      } else {
        setPassMsg({ text: data.message || 'Đổi mật khẩu thất bại!', type: 'error' });
      }
    } catch {
      setPassMsg({ text: 'Không thể kết nối đến máy chủ!', type: 'error' });
    }
    setPassLoading(false);
  };

  // Handler dùng trong PasswordField
  const handleChangePass = (field, value) => {
    setPasswords(p => ({ ...p, [field]: value }));
    setPassMsg({ text: '', type: '' });
  };
  const handleToggleShow = (field) => setShowPass(p => ({ ...p, [field]: !p[field] }));

  return (
    <header className="topbar glass">
      <div className="topbar-left">
        <button className="icon-btn" onClick={toggleSidebar} title="Mở/Đóng Menu">
          <Menu size={22} />
        </button>
      </div>

      <div className="topbar-right">

        {/* ── Bell Notifications ── */}
        <div className="tb-notif-wrap" ref={notifRef}>
          <button className={`icon-btn tb-bell ${unread > 0 ? 'tb-bell-pulse' : ''}`} onClick={() => setShowNotif(v => !v)}>
            <Bell size={20} />
            {unread > 0 && <span className="tb-badge">{unread}</span>}
          </button>

          {showNotif && (
            <div className="tb-notif-panel glass animate-fade-in">
              <div className="tb-notif-hd">
                <span className="tb-notif-title">🔔 Thông báo hệ thống</span>
                {unread > 0 && <button className="tb-text-btn" onClick={markAllRead}>Đánh dấu đã đọc</button>}
              </div>
              <div className="tb-notif-list">
                {notifs.length === 0
                  ? <p className="tb-notif-empty">Không có thông báo nào 🌟</p>
                  : notifs.map(n => (
                    <div key={n.id} className={`tb-notif-item ${!n.read ? 'tb-unread' : ''}`}>
                      <span className={`tb-notif-dot tb-dot-${n.type}`} />
                      <div className="tb-notif-body">
                        <p className="tb-notif-text">{n.text}</p>
                        <div className="tb-notif-row">
                          <span className="tb-notif-time"><Clock size={10} /> {n.time}</span>
                          <button className="tb-notif-del" onClick={e => removeNotif(n.id, e)}><X size={11} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* ── Admin Profile Trigger ── */}
        <div className="tb-admin-trigger" ref={adminRef}>
          <div className="tb-admin-pill" onClick={openAdmin} title="Thông tin quản trị viên">
            <div className="tb-admin-avatar">
              <img src={ADMIN_INFO.avatar} alt="Admin" />
              <span className="tb-online-dot" />
            </div>
            <div className="tb-admin-info">
              <span className="tb-admin-name">{ADMIN_INFO.name}</span>
              <span className="tb-admin-role"><Shield size={10} /> {ADMIN_INFO.role}</span>
            </div>
            <ChevronRight size={14} className="tb-chevron" />
          </div>

          {/* ── Admin Profile Modal ── */}
          {showAdmin && (
            <div className="tb-admin-modal glass animate-fade-in">
              {/* Modal Header */}
              <div className="tb-am-header">
                <button className="tb-am-close" onClick={() => setShowAdmin(false)}><X size={16} /></button>
                <div className="tb-am-avatar-wrap">
                  <img src={ADMIN_INFO.avatar} alt="Admin" className="tb-am-avatar" />
                  <span className="tb-am-shield"><Shield size={13} /></span>
                </div>
                <h3 className="tb-am-name">{ADMIN_INFO.name}</h3>
                <span className="tb-am-role-badge">{ADMIN_INFO.role}</span>
              </div>

              {/* Tab Switch */}
              <div className="tb-am-tabs">
                <button className={`tb-am-tab ${adminTab === 'info' ? 'active' : ''}`} onClick={() => setAdminTab('info')}>
                  <Info size={13} /> Thông tin
                </button>
                <button className={`tb-am-tab ${adminTab === 'security' ? 'active' : ''}`} onClick={() => setAdminTab('security')}>
                  <Lock size={13} /> Bảo mật
                </button>
              </div>

              {/* ─── TAB: Info ─── */}
              {adminTab === 'info' && (
                <div className="tb-am-body">
                  <div className="tb-info-grid">
                    <div className="tb-info-card">
                      <span className="tb-info-lbl"><Briefcase size={12} /> Tên đăng nhập</span>
                      <code className="tb-info-val tb-highlight">{adminUser.username || 'hongocgiahan'}</code>
                    </div>
                    <div className="tb-info-card">
                      <span className="tb-info-lbl"><Award size={12} /> Chức vụ</span>
                      <span className="tb-info-val">{ADMIN_INFO.role}</span>
                    </div>
                    <div className="tb-info-card tb-info-full">
                      <span className="tb-info-lbl"><User size={12} /> Bộ phận</span>
                      <span className="tb-info-val">{DEFAULT_ADMIN.department}</span>
                    </div>
                    <div className="tb-info-card tb-info-full">
                      <span className="tb-info-lbl"><Mail size={12} /> Email công vụ</span>
                      <span className="tb-info-val">{ADMIN_INFO.email}</span>
                    </div>
                    <div className="tb-info-card">
                      <span className="tb-info-lbl"><Clock size={12} /> Ngày tạo tài khoản</span>
                      <span className="tb-info-val">{adminUser.createdAt ? new Date(adminUser.createdAt).toLocaleDateString('vi-VN') : '---'}</span>
                    </div>
                    <div className="tb-info-card">
                      <span className="tb-info-lbl"><AlertCircle size={12} /> Trạng thái</span>
                      <span className="tb-info-val" style={{color: '#22c55e', fontWeight: 600}}>● Đang hoạt động</span>
                    </div>
                  </div>

                  <button className="tb-am-logout-btn" onClick={handleLogout}>
                    <LogOut size={15} /> Đăng xuất khỏi hệ thống
                  </button>
                </div>
              )}

              {/* ─── TAB: Security ─── */}
              {adminTab === 'security' && (
                <div className="tb-am-body">
                  <div className="tb-sec-intro">
                    <Key size={16} className="tb-sec-key-icon" />
                    <div>
                      <p className="tb-sec-title">Thay đổi mật khẩu</p>
                      <p className="tb-sec-sub">Mật khẩu phải có ít nhất 6 ký tự, không trùng mật khẩu cũ.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="tb-pass-form">
                    <PasswordField field="current" label="Mật khẩu hiện tại" placeholder="••••••••"
                      showPass={showPass} passwords={passwords}
                      onChangePass={handleChangePass} onToggleShow={handleToggleShow} />
                    <PasswordField field="newPass" label="Mật khẩu mới" placeholder="Tối thiểu 6 ký tự"
                      showPass={showPass} passwords={passwords}
                      onChangePass={handleChangePass} onToggleShow={handleToggleShow} />
                    <PasswordField field="confirm" label="Xác nhận mật khẩu mới" placeholder="Nhập lại mật khẩu mới"
                      showPass={showPass} passwords={passwords}
                      onChangePass={handleChangePass} onToggleShow={handleToggleShow} />

                    {passMsg.text && (
                      <div className={`tb-pass-msg ${passMsg.type === 'success' ? 'tb-msg-ok' : 'tb-msg-err'}`}>
                        {passMsg.type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
                        {passMsg.text}
                      </div>
                    )}

                    <button type="submit" className="glass-button tb-pass-submit" disabled={passLoading}>
                      {passLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
