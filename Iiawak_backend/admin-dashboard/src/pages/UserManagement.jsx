import React, { useState, useMemo, useEffect } from 'react';
import {
  Lock, Unlock, AlertTriangle, Search, X, Check, Copy,
  ChevronUp, ChevronDown, Trash2, RefreshCw,
  Users, ShieldOff, Shield, SlidersHorizontal,
  MapPin, Calendar, Mail, Hash, User, FileText
} from 'lucide-react';
import './UserManagement.css';

const INITIAL_USERS = [];
/* ─── Sub-components ─── */

function UserAvatar({ src, name, size = 36 }) {
  const [err, setErr] = useState(false);
  const initials = name ? name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() : '?';
  const palette = ['#FF69B4', '#a78bfa', '#34d399', '#60a5fa', '#fb923c'];
  const color = palette[name.charCodeAt(0) % palette.length];
  if (err || !src) {
    return (
      <div className="um-avatar-fallback" style={{ width: size, height: size, background: color + '22', color, fontSize: size * 0.36, border: `2px solid ${color}55` }}>
        {initials}
      </div>
    );
  }
  return <img src={src} alt={name} onError={() => setErr(true)} className="um-avatar-img" style={{ width: size, height: size }} />;
}

function StrikePips({ count }) {
  const color = count === 3 ? '#ef4444' : count === 2 ? '#f59e0b' : '#FF69B4';
  return (
    <div className="um-strike-pips">
      {[0, 1, 2].map(i => (
        <div key={i} className="um-pip" style={{ background: i < count ? color : 'rgba(255,105,180,0.15)', border: i < count ? 'none' : '1.5px solid rgba(255,105,180,0.3)' }} />
      ))}
      <span className="um-strike-label" style={{ color: count >= 3 ? '#ef4444' : 'inherit', fontWeight: count >= 3 ? 700 : 500 }}>{count}/3</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === 'Active';
  return (
    <span className={`um-badge ${active ? 'um-badge-active' : 'um-badge-locked'}`}>
      <span className="um-badge-dot" />
      {active ? 'Hoạt động' : 'Đã khóa'}
    </span>
  );
}

function ConfirmModal({ message, onConfirm, onCancel, danger }) {
  return (
    <div className="um-overlay" onClick={onCancel}>
      <div className="um-confirm-box glass" onClick={e => e.stopPropagation()}>
        <div className="um-confirm-icon">{danger ? '⚠️' : '❓'}</div>
        <p className="um-confirm-msg">{message}</p>
        <div className="um-confirm-actions">
          <button className="um-btn-ghost" onClick={onCancel}>Huỷ</button>
          <button className={`um-btn-solid ${danger ? 'um-btn-danger' : 'um-btn-pink'}`} onClick={onConfirm}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
}

// Modal xem xét báo cáo từ người dùng — Admin chỉ xem lý do và DUYỆT hoặc BỎ QUA
function ReviewReportsModal({ user, onApprove, onDismiss, onClose }) {
  const reports = user.pendingReports || [];

  return (
    <div className="um-overlay" onClick={onClose}>
      <div className="um-modal glass animate-fade-in" onClick={e => e.stopPropagation()} style={{ width: '460px' }}>
        <div className="um-modal-header">
          <h2 className="um-modal-title" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={18} /> Xem xét báo cáo vi phạm
          </h2>
          <button className="um-icon-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Thông tin người bị báo cáo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
          <UserAvatar src={user.avatar} name={user.name} size={40} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#333' }}>{user.name}</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#888' }}>
              @{user.username} &nbsp;·&nbsp; Cảnh cáo hiện tại:&nbsp;
              <strong style={{ color: user.strikes >= 3 ? '#ef4444' : user.strikes >= 2 ? '#f59e0b' : '#22c55e' }}>{user.strikes}/3</strong>
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#aaa', fontSize: '0.9rem' }}>
            ✅ Không có báo cáo nào đang chờ xét duyệt!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {reports.length} báo cáo đang chờ xét duyệt
            </p>
            {reports.map(r => (
              <div key={r.id} style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '12px', padding: '12px 14px' }}>
                {/* Header báo cáo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '2px 8px', borderRadius: '20px' }}>⚠️ {r.reason}</span>
                  <span style={{ fontSize: '0.68rem', color: '#bbb', fontFamily: 'monospace' }}>{r.date}</span>
                </div>
                {/* Người báo cáo */}
                <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: '#888' }}>
                  Người báo cáo: <code style={{ color: '#FF69B4' }}>@{r.reporter}</code>
                </p>
                {/* Nội dung báo cáo */}
                <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#444', lineHeight: 1.5, fontStyle: 'italic', background: 'rgba(0,0,0,0.02)', padding: '8px', borderRadius: '8px' }}>
                  "{r.detail}"
                </p>
                {/* Nút hành động */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onApprove(user.id, r)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontFamily: 'inherit' }}
                  >
                    <AlertTriangle size={13} /> Duyệt → Cảnh cáo (+1)
                  </button>
                  <button
                    onClick={() => onDismiss(user.id, r.id)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', background: 'transparent', color: '#999', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontFamily: 'inherit' }}
                  >
                    <X size={13} /> Bỏ qua báo cáo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <button className="um-btn-ghost" style={{ width: '100%' }} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ user, users, onClose, onToggleStatus, onAddStrikeClick, onResetStrikes, onSaveUsername, onDelete }) {
  const [editingUsername, setEditingUsername] = useState(user.username);
  const [usernameError, setUsernameError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const copyId = () => {
    navigator.clipboard?.writeText(user.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const saveUsername = () => {
    const clean = editingUsername.trim();
    if (!clean) { setUsernameError('Username không được trống!'); return; }
    if (users.some(u => u.username.toLowerCase() === clean.toLowerCase() && u.id !== user.id)) {
      setUsernameError('Username đã có người dùng!'); return;
    }
    onSaveUsername(user.id, clean);
    setUsernameError('');
  };

  const execConfirm = () => {
    if (confirmAction === 'toggle') onToggleStatus(user.id);
    if (confirmAction === 'delete') { onDelete(user.id); onClose(); }
    if (confirmAction === 'reset') onResetStrikes(user.id);
    setConfirmAction(null);
  };

  const confirmMsg = {
    toggle: `Bạn muốn ${user.status === 'Active' ? 'khóa' : 'mở khóa'} tài khoản của ${user.name}?`,
    delete: `Xóa vĩnh viễn tài khoản "${user.name}"? Hành động này không thể hoàn tác.`,
    reset: `Đặt lại toàn bộ số cảnh cáo và xoá lịch sử vi phạm của ${user.name} về 0?`
  };

  return (
    <div className="um-overlay" onClick={onClose}>
      {confirmAction && (
        <ConfirmModal
          danger={confirmAction === 'delete'}
          message={confirmMsg[confirmAction]}
          onConfirm={execConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      <div className="um-profile-modal glass" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="um-profile-header">
          <button className="um-icon-close" onClick={onClose}><X size={18} /></button>
          <div className="um-profile-avatar-wrap">
            <UserAvatar src={user.avatar} name={user.name} size={80} />
            <span className={`um-status-dot ${user.status === 'Active' ? 'dot-active' : 'dot-locked'}`} />
          </div>
          <h3 className="um-profile-name">{user.name}</h3>
          <p className="um-profile-sub">Người dùng Iiawak · Tham gia {user.joinedDate}</p>
          <StatusBadge status={user.status} />
        </div>

        {/* Body */}
        <div className="um-profile-body">
          {/* ID */}
          <div className="um-info-row um-id-row">
            <div>
              <p className="um-info-label">ID Người Dùng</p>
              <code className="um-id-code">{user.id}</code>
            </div>
            <button className={`um-copy-btn ${copied ? 'copied' : ''}`} onClick={copyId}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Đã sao chép!' : 'Sao chép'}
            </button>
          </div>

          {/* Username edit */}
          <div className="um-field">
            <p className="um-info-label">Username</p>
            <div className="um-username-row">
              <input
                className={`um-field-input ${usernameError ? 'um-field-input-err' : ''}`}
                value={editingUsername}
                onChange={e => { setEditingUsername(e.target.value); setUsernameError(''); }}
              />
              <button className="um-btn-solid um-btn-pink um-btn-sm" onClick={saveUsername}>
                <Check size={14} /> Lưu
              </button>
            </div>
            {usernameError && <span className="um-field-err">{usernameError}</span>}
          </div>

          {/* Info grid */}
          <div className="um-info-grid">
            {[
              { label: 'Email', value: user.email, icon: <Mail size={13} /> },
              { label: 'Khu vực', value: user.location || 'Chưa cập nhật', icon: <MapPin size={13} /> },
              { label: 'Ngày tham gia', value: user.joinedDate, icon: <Calendar size={13} /> },
              { label: 'Cảnh cáo', value: <StrikePips count={user.strikes} />, icon: <AlertTriangle size={13} /> }
            ].map(({ label, value, icon }) => (
              <div key={label} className="um-info-cell">
                <p className="um-info-label">{icon} {label}</p>
                <div className="um-info-value">{value}</div>
              </div>
            ))}
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="um-bio-box">
              <p className="um-info-label">Tiểu sử</p>
              <p className="um-bio-text">"{user.bio}"</p>
            </div>
          )}

          {/* Lịch sử cảnh cáo được ghi nhận bởi Admin */}
          <div className="um-warning-history-section" style={{ marginBottom: '18px' }}>
            <p className="um-info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={13} /> Lịch sử vi phạm (Xem xét bởi Admin)
            </p>
            <div className="um-warning-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              {!user.warnings || user.warnings.length === 0 ? (
                <p className="um-warn-empty-text" style={{ fontSize: '0.8rem', color: '#22c55e', fontStyle: 'italic', margin: '4px 0', textAlign: 'center' }}>
                  Tài khoản trong sạch, chưa có lịch sử cảnh cáo nào! 🌟
                </p>
              ) : (
                user.warnings.map(w => (
                  <div key={w.id} className="um-warn-record-card" style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.12)', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#ef4444', fontWeight: 700 }}>
                      <span>⚠️ {w.reason}</span>
                      <span style={{ color: '#aaa', fontFamily: 'monospace' }}>{w.date}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#555', lineHeight: 1.4 }}>
                      {w.detail}
                    </p>
                    <div style={{ marginTop: '4px', fontSize: '0.68rem', color: '#999', textAlign: 'right' }}>
                      Được duyệt bởi Admin: <code>{w.admin}</code>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="um-profile-actions">
            <button
              className={`um-action-btn ${user.status === 'Active' ? 'action-lock' : 'action-unlock'}`}
              onClick={() => setConfirmAction('toggle')}
            >
              {user.status === 'Active' ? <Lock size={14} /> : <Unlock size={14} />}
              {user.status === 'Active' ? 'Khoá' : 'Mở khoá'}
            </button>
            <button
              className="um-action-btn action-warn"
              style={{ background: 'rgba(245,158,11,0.09)', borderColor: 'rgba(245,158,11,0.25)', color: '#d97706' }}
              disabled={user.strikes >= 3}
              onClick={() => onAddStrikeClick(user)}
            >
              <AlertTriangle size={14} /> Cảnh cáo (+1)
            </button>
            <button
              className="um-action-btn action-reset"
              disabled={user.strikes === 0}
              onClick={() => setConfirmAction('reset')}
            >
              <RefreshCw size={14} /> Reset cảnh cáo
            </button>
          </div>
          <div style={{ marginTop: '8px' }}>
            <button className="um-action-btn action-delete" style={{ width: '100%' }} onClick={() => setConfirmAction('delete')}>
              <Trash2 size={14} /> Xoá tài khoản người dùng vĩnh viễn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
const UserManagement = () => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('username');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [reviewUser, setReviewUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5000/api/admin/users?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.map(u => ({
          id: u._id,
          name: u.displayName || u.username,
          username: u.username,
          email: u.email,
          avatar: u.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          status: u.status === 'active' ? 'Active' : 'Locked',
          strikes: u.strikeCount || 0,
          joinedDate: new Date(u.createdAt).toISOString().split('T')[0],
          bio: u.bio || 'Người dùng Iiawak',
          location: 'Chưa cập nhật',
          warnings: [],
          pendingReports: []
        }));
        setUsers(mapped);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const syncUser = (id, updater) => {
    setUsers(prev => prev.map(u => u.id === id ? updater(u) : u));
    setSelectedUser(prev => prev?.id === id ? updater(prev) : prev);
    setReviewUser(prev => prev?.id === id ? updater(prev) : prev);
  };

  const apiManageUser = async (id, action, reason) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reason })
      });
      const data = await res.json();
      if (!data.success) {
        alert('Lỗi: ' + data.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleToggleStatus = async id => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const action = user.status === 'Active' ? 'ban' : 'unban';
    const success = await apiManageUser(id, action, 'Thay đổi trạng thái bởi Admin');
    if (success) {
      syncUser(id, u => {
        const s = u.status === 'Active' ? 'Locked' : 'Active';
        return { ...u, status: s, strikes: s === 'Active' && u.strikes >= 3 ? 0 : u.strikes };
      });
    }
  };

  // Admin DUYỆT báo cáo → chuyển thành cảnh cáo chính thức + cộng strike
  const handleApproveReport = async (userId, report) => {
    const success = await apiManageUser(userId, 'warn', report.detail || report.reason);
    if (success) {
      syncUser(userId, u => {
        const newStrikes = Math.min(u.strikes + 1, 3);
        return {
          ...u,
          strikes: newStrikes,
          status: newStrikes >= 3 ? 'Locked' : u.status,
          warnings: [...(u.warnings || []), {
            id: report.id,
            reason: report.reason,
            detail: report.detail,
            date: new Date().toISOString().slice(0, 10),
            admin: 'Admin hệ thống'
          }],
          pendingReports: (u.pendingReports || []).filter(r => r.id !== report.id)
        };
      });
    }
  };

  // Admin BỎ QUA báo cáo → xoá khỏi danh sách chờ
  const handleDismissReport = (userId, reportId) => {
    syncUser(userId, u => ({
      ...u,
      pendingReports: (u.pendingReports || []).filter(r => r.id !== reportId)
    }));
  };

  const handleResetStrikes = async id => {
    const success = await apiManageUser(id, 'reset_strikes', 'Xoá lịch sử vi phạm');
    if (success) {
      syncUser(id, u => ({ ...u, strikes: 0, warnings: [], status: 'Active' }));
    }
  };

  const handleSaveUsername = async (id, username) => {
    const success = await apiManageUser(id, 'update_username', username);
    if (success) {
      syncUser(id, u => ({ ...u, username }));
    }
  };

  const handleDelete = async id => {
    const success = await apiManageUser(id, 'delete', 'Xoá tài khoản');
    if (success) {
      setUsers(p => p.filter(u => u.id !== id));
      setSelectedUser(null);
    }
  };

  const toggleSort = field => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = users.filter(u => {
      if (statusFilter !== 'All' && u.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return filterType === 'username'
        ? u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
        : u.id.toLowerCase().includes(q);
    });
    return [...list].sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [users, search, filterType, statusFilter, sortField, sortDir]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    locked: users.filter(u => u.status === 'Locked').length,
    strikes: users.reduce((s, u) => s + u.strikes, 0)
  }), [users]);

  const SortIcon = ({ field }) => sortField === field
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : <ChevronDown size={12} style={{ opacity: 0.3 }} />;

  return (
    <div className="page-container animate-fade-in">
      {/* Page Header */}
      <div className="um-page-header">
        <div>
          <h1 className="page-title">Quản lý Người dùng</h1>
          <p className="um-subtitle">Iiawak Admin · {users.length} người dùng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="um-stats-grid">
        {[
          { label: 'Tổng người dùng', value: stats.total, icon: <Users size={20} />, color: '#a78bfa' },
          { label: 'Đang hoạt động', value: stats.active, icon: <Shield size={20} />, color: '#22c55e' },
          { label: 'Đã khóa', value: stats.locked, icon: <ShieldOff size={20} />, color: '#ef4444' },
          { label: 'Tổng cảnh cáo', value: stats.strikes, icon: <AlertTriangle size={20} />, color: '#f59e0b' }
        ].map(s => (
          <div key={s.label} className="glass um-stat-card">
            <div className="um-stat-icon" style={{ background: s.color + '20', color: s.color }}>{s.icon}</div>
            <div>
              <p className="um-stat-value" style={{ color: s.color }}>{s.value}</p>
              <p className="um-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="glass um-toolbar">
        <div className="um-search-wrap">
          <Search size={16} className="um-search-icon" />
          <input
            className="um-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={filterType === 'username' ? 'Tìm theo tên hoặc username...' : 'Tìm theo ID...'}
          />
        </div>
        <div className="um-filter-wrap">
          <SlidersHorizontal size={14} className="um-filter-icon" />
          <select className="um-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="username">Theo tên / username</option>
            <option value="id">Theo ID</option>
          </select>
        </div>
        <div className="um-tabs">
          {['All', 'Active', 'Locked'].map(s => (
            <button
              key={s}
              className={`um-tab ${statusFilter === s ? 'um-tab-active' : ''}`}
              data-type={s}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'All' ? 'Tất cả' : s === 'Active' ? 'Hoạt động' : 'Đã khóa'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass um-table-wrap">
        <div className="um-table-scroll">
          <table className="glass-table um-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>ID Người dùng</th>
                <th>Trạng thái</th>
                <th className="um-th-sort" onClick={() => toggleSort('strikes')}>
                  Cảnh cáo <SortIcon field="strikes" />
                </th>
                <th className="um-th-sort" onClick={() => toggleSort('joinedDate')}>
                  Tham gia <SortIcon field="joinedDate" />
                </th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="um-empty">Không tìm thấy người dùng phù hợp</td>
                </tr>
              ) : filtered.map(user => (
                <tr key={user.id} className="um-row">
                  <td>
                    <div className="um-user-cell" onClick={() => setSelectedUser(user)}>
                      <UserAvatar src={user.avatar} name={user.name} size={38} />
                      <div>
                        <p className="um-user-name">{user.name}</p>
                        <code className="um-user-code">@{user.username}</code>
                      </div>
                    </div>
                  </td>
                  <td className="um-td-muted">{user.email}</td>
                  <td><code className="um-id-short">{user.id.slice(0, 8)}…</code></td>
                  <td><StatusBadge status={user.status} /></td>
                  <td><StrikePips count={user.strikes} /></td>
                  <td className="um-td-muted">{user.joinedDate}</td>
                  <td>
                    <div className="um-actions">
                      <button
                        className={`um-act ${user.status === 'Active' ? 'act-lock' : 'act-unlock'}`}
                        title={user.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa'}
                        onClick={() => handleToggleStatus(user.id)}
                      >
                        {user.status === 'Active' ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                      <button
                        className="um-act act-warn"
                        title={`Xem xét báo cáo${user.pendingReports?.length ? ` (${user.pendingReports.length} đang chờ)` : ''}`}
                        style={{ position: 'relative' }}
                        onClick={() => setReviewUser(user)}
                      >
                        <AlertTriangle size={14} />
                        {user.pendingReports?.length > 0 && (
                          <span style={{
                            position: 'absolute', top: -4, right: -4,
                            background: '#ef4444', color: '#fff',
                            fontSize: '9px', fontWeight: 700,
                            width: 14, height: 14, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1.5px solid white', lineHeight: 1
                          }}>{user.pendingReports.length}</span>
                        )}
                      </button>
                      <button
                        className="um-act act-reset"
                        title="Reset cảnh cáo & lịch sử"
                        disabled={user.strikes === 0}
                        onClick={() => handleResetStrikes(user.id)}
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        className="um-act act-profile"
                        title="Xem hồ sơ & lịch sử vi phạm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <User size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="um-table-footer">
          Hiển thị <strong>{filtered.length}</strong> / {users.length} người dùng
        </div>
      </div>

      {/* Modal xem xét báo cáo từ người dùng */}
      {reviewUser && (
        <ReviewReportsModal
          user={reviewUser}
          onClose={() => setReviewUser(null)}
          onApprove={handleApproveReport}
          onDismiss={handleDismissReport}
        />
      )}

      {/* Modal hồ sơ chi tiết */}
      {selectedUser && (
        <ProfileModal
          user={selectedUser}
          users={users}
          onClose={() => setSelectedUser(null)}
          onToggleStatus={handleToggleStatus}
          onAddStrikeClick={(u) => { setSelectedUser(null); setReviewUser(u); }}
          onResetStrikes={handleResetStrikes}
          onSaveUsername={handleSaveUsername}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default UserManagement;
