import React, { useState, useMemo } from 'react';
import {
  AlertOctagon, Search, Eye, Check, X, Ban, Clock,
  MessageSquare, Shield, User, Trash2, Filter, ChevronDown,
  AlertTriangle, CheckCircle2, XCircle, FileText, Sparkles
} from 'lucide-react';
import './Moderation.css';

/* ── Mock Data ── */
const INIT_REPORTS = [
  { id:'RP001', reporter:'linh_kawaii', reporterUid:'K4L5M6N7', target:'dark_user_99', targetUid:'X8Y9Z0W1', type:'user', category:'hate', reason:'Sử dụng ngôn từ kỳ thị, xúc phạm trong bình luận công khai.', evidence:'Screenshot bình luận ngày 17/05/2026', createdAt:'2026-05-17 20:15', status:'pending', priority:'high' },
  { id:'RP002', reporter:'baochau_dev', reporterUid:'R2S3T4U5', target:'Bot_Waifu_3', targetUid:'BOT-003', type:'bot', category:'inappropriate', reason:'Bot phản hồi nội dung không phù hợp lứa tuổi khi người dùng hỏi câu thông thường.', evidence:'Log hội thoại #45892', createdAt:'2026-05-17 18:40', status:'pending', priority:'medium' },
  { id:'RP003', reporter:'cattuong_pink', reporterUid:'A1B2C3D4', target:'spam_master_69', targetUid:'S9P8A7M6', type:'user', category:'spam', reason:'Gửi tin nhắn quảng cáo link lạ liên tục trong nhóm chat chung.', evidence:'20+ tin nhắn spam trong 10 phút', createdAt:'2026-05-16 14:20', status:'pending', priority:'high' },
  { id:'RP004', reporter:'tuan_handsome', reporterUid:'X8Y9Z0W1', target:'Post #8821', targetUid:'POST-8821', type:'content', category:'nsfw', reason:'Bài viết chứa hình ảnh nhạy cảm, vi phạm nội quy cộng đồng.', evidence:'Bài đăng ngày 15/05/2026', createdAt:'2026-05-15 09:30', status:'resolved', priority:'critical', action:'deleted', resolvedAt:'2026-05-15 10:00', resolvedNote:'Đã xoá bài viết và cảnh cáo người đăng.' },
  { id:'RP005', reporter:'hệ thống', reporterUid:'SYSTEM', target:'fake_admin_vip', targetUid:'F1A2K3E4', type:'user', category:'impersonation', reason:'Mạo danh Admin để lừa đảo người chơi khác.', evidence:'Tên hiển thị giả mạo + tin nhắn lừa đảo', createdAt:'2026-05-14 22:10', status:'resolved', priority:'critical', action:'banned', resolvedAt:'2026-05-14 22:30', resolvedNote:'Đã khoá vĩnh viễn tài khoản.' },
];

const CATEGORIES = [
  { value:'hate',          label:'🚫 Ngôn từ kỳ thị',       color:'#ef4444' },
  { value:'spam',          label:'📨 Spam / Quảng cáo',     color:'#f59e0b' },
  { value:'inappropriate', label:'⚠️ Nội dung không phù hợp', color:'#f97316' },
  { value:'nsfw',          label:'🔞 Nhạy cảm / NSFW',      color:'#dc2626' },
  { value:'impersonation', label:'🎭 Mạo danh',              color:'#8b5cf6' },
  { value:'other',         label:'📌 Khác',                  color:'#6b7280' },
];

const PRIORITIES = {
  critical: { label:'Nghiêm trọng', color:'#dc2626', bg:'rgba(220,38,38,0.1)' },
  high:     { label:'Cao',          color:'#f97316', bg:'rgba(249,115,22,0.1)' },
  medium:   { label:'Trung bình',   color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
  low:      { label:'Thấp',         color:'#22c55e', bg:'rgba(34,197,94,0.1)'  },
};

const ACTIONS = [
  { value:'warned',  label:'⚠️ Cảnh cáo',      desc:'Gửi cảnh cáo cho đối tượng vi phạm' },
  { value:'muted',   label:'🔇 Cấm chat',       desc:'Tạm khóa quyền nhắn tin' },
  { value:'banned',  label:'🚫 Khoá tài khoản', desc:'Khoá vĩnh viễn tài khoản vi phạm' },
  { value:'deleted', label:'🗑️ Xoá nội dung',   desc:'Xoá nội dung vi phạm khỏi hệ thống' },
  { value:'dismissed',label:'❌ Bỏ qua',         desc:'Báo cáo không hợp lệ, bỏ qua' },
];

/* ── Components ── */
function PriorityBadge({ p }) {
  const pr = PRIORITIES[p] || PRIORITIES.medium;
  return <span className="mod-priority" style={{background:pr.bg, color:pr.color}}>{pr.label}</span>;
}

function StatusBadge({ s }) {
  if (s === 'pending')  return <span className="mod-status mod-status-pending"><Clock size={11}/> Chờ xử lý</span>;
  return <span className="mod-status mod-status-done"><CheckCircle2 size={11}/> Đã xử lý</span>;
}

function TypeBadge({ t }) {
  const map = { user:['👤','Người dùng','#3b82f6'], bot:['🤖','Bot AI','#a78bfa'], content:['📝','Nội dung','#f59e0b'] };
  const [icon, label, color] = map[t] || map.user;
  return <span className="mod-type" style={{background:color+'15', color}}>{icon} {label}</span>;
}

/* ── Detail Modal ── */
function DetailModal({ report, onAction, onClose }) {
  const [action, setAction] = useState('');
  const [note, setNote] = useState('');
  const cat = CATEGORIES.find(c => c.value === report.category);

  const handleSubmit = () => {
    if (!action) return;
    onAction(report.id, action, note);
    onClose();
  };

  return (
    <div className="mod-overlay" onClick={onClose}>
      <div className="mod-modal glass" onClick={e => e.stopPropagation()}>
        <div className="mod-modal-hd">
          <h3><FileText size={16}/> Chi tiết báo cáo #{report.id}</h3>
          <button className="mod-close-btn" onClick={onClose}><X size={15}/></button>
        </div>

        {/* Info grid */}
        <div className="mod-detail-grid">
          <div className="mod-detail-item">
            <span className="mod-detail-label">Người báo cáo</span>
            <span className="mod-detail-val">@{report.reporter} <code className="mod-uid">{report.reporterUid}</code></span>
          </div>
          <div className="mod-detail-item">
            <span className="mod-detail-label">Đối tượng vi phạm</span>
            <span className="mod-detail-val mod-target-name">@{report.target} <code className="mod-uid">{report.targetUid}</code></span>
          </div>
          <div className="mod-detail-item">
            <span className="mod-detail-label">Phân loại</span>
            <span className="mod-detail-val"><TypeBadge t={report.type}/></span>
          </div>
          <div className="mod-detail-item">
            <span className="mod-detail-label">Danh mục</span>
            <span className="mod-detail-val" style={{color: cat?.color}}>{cat?.label || report.category}</span>
          </div>
          <div className="mod-detail-item">
            <span className="mod-detail-label">Mức độ</span>
            <span className="mod-detail-val"><PriorityBadge p={report.priority}/></span>
          </div>
          <div className="mod-detail-item">
            <span className="mod-detail-label">Thời gian</span>
            <span className="mod-detail-val">{report.createdAt}</span>
          </div>
        </div>

        <div className="mod-detail-section">
          <span className="mod-detail-label">Lý do báo cáo</span>
          <p className="mod-detail-reason">{report.reason}</p>
        </div>

        {report.evidence && (
          <div className="mod-detail-section">
            <span className="mod-detail-label">Bằng chứng</span>
            <p className="mod-detail-evidence">{report.evidence}</p>
          </div>
        )}

        {/* Already resolved */}
        {report.status === 'resolved' ? (
          <div className="mod-resolved-box">
            <CheckCircle2 size={14}/>
            <div>
              <strong>Đã xử lý lúc {report.resolvedAt}</strong>
              <p>Hành động: {ACTIONS.find(a=>a.value===report.action)?.label || report.action}</p>
              {report.resolvedNote && <p className="mod-resolved-note">{report.resolvedNote}</p>}
            </div>
          </div>
        ) : (
          /* Action form */
          <div className="mod-action-form">
            <label className="mod-label">Chọn hành động xử lý</label>
            <div className="mod-action-btns">
              {ACTIONS.map(a => (
                <button key={a.value} type="button"
                  className={`mod-action-btn ${action===a.value?'active':''} ${a.value==='banned'?'danger':''} ${a.value==='dismissed'?'ghost':''}`}
                  onClick={() => setAction(a.value)}>
                  <span>{a.label}</span>
                  <small>{a.desc}</small>
                </button>
              ))}
            </div>
            <label className="mod-label" style={{marginTop:12}}>Ghi chú xử lý</label>
            <textarea className="mod-input mod-textarea" rows={3} placeholder="Ghi chú cho hồ sơ xử lý..."
              value={note} onChange={e => setNote(e.target.value)}/>
            <div className="mod-modal-ft">
              <button className="mod-btn-ghost" onClick={onClose}>Huỷ</button>
              <button className="mod-btn-primary" disabled={!action} onClick={handleSubmit}>
                <Shield size={14}/> Xác nhận xử lý
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════ MAIN ══════ */
export default function Moderation() {
  const [reports, setReports] = useState(INIT_REPORTS);
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat]       = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);

  const stats = useMemo(() => ({
    total:    reports.length,
    pending:  reports.filter(r => r.status === 'pending').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    critical: reports.filter(r => r.priority === 'critical' && r.status === 'pending').length,
  }), [reports]);

  const filtered = useMemo(() => reports.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.id.toLowerCase().includes(q) || r.target.toLowerCase().includes(q) || r.reporter.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q);
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterCat !== 'all' && r.category !== filterCat) return false;
    return matchQ;
  }), [reports, search, filterStatus, filterCat]);

  const handleAction = (id, action, note) => {
    const now = new Date().toLocaleString('vi-VN');
    setReports(p => p.map(r => r.id === id ? {
      ...r, status:'resolved', action, resolvedAt: now, resolvedNote: note || ''
    } : r));
  };

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">Xử lý Vi phạm</h1>

      {/* Stats */}
      <div className="mod-stats-row">
        {[
          [<AlertOctagon size={17}/>, stats.total,    'Tổng báo cáo',  '#FF69B4'],
          [<Clock size={17}/>,        stats.pending,  'Chờ xử lý',     '#f59e0b'],
          [<CheckCircle2 size={17}/>, stats.resolved, 'Đã xử lý',     '#22c55e'],
          [<AlertTriangle size={17}/>,stats.critical, 'Nghiêm trọng',  '#ef4444'],
        ].map(([icon, val, lbl, color], i) => (
          <div key={i} className="mod-stat glass" style={{'--mc':color}}>
            <span className="mod-stat-icon" style={{color, background:color+'18'}}>{icon}</span>
            <div><p className="mod-stat-val" style={{color}}>{val}</p><p className="mod-stat-lbl">{lbl}</p></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mod-toolbar">
        <div className="mod-search-wrap">
          <Search size={14} className="mod-search-ico"/>
          <input className="mod-search" placeholder="Tìm mã BC, đối tượng, lý do..."
            value={search} onChange={e => setSearch(e.target.value)}/>
          {search && <button className="mod-search-clear" onClick={() => setSearch('')}><X size={12}/></button>}
        </div>
        <div className="mod-filter-group">
          <select className="mod-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">📋 Trạng thái</option>
            <option value="pending">⏳ Chờ xử lý</option>
            <option value="resolved">✅ Đã xử lý</option>
          </select>
          <select className="mod-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">📂 Danh mục</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Reports list */}
      {filtered.length === 0 ? (
        <div className="mod-empty glass">
          <Sparkles size={28} style={{color:'#FFB6C1'}}/>
          <p>Không tìm thấy báo cáo nào 🌸</p>
        </div>
      ) : (
        <div className="mod-list">
          {filtered.map(r => {
            const cat = CATEGORIES.find(c => c.value === r.category);
            return (
              <div key={r.id} className={`mod-report-card glass ${r.status==='resolved'?'mod-resolved':''}`}
                onClick={() => setSelectedReport(r)}>
                {/* Left accent */}
                <div className="mod-report-accent" style={{background: PRIORITIES[r.priority]?.color || '#aaa'}}/>

                <div className="mod-report-body">
                  {/* Row 1: header */}
                  <div className="mod-report-hd">
                    <div className="mod-report-hd-left">
                      <code className="mod-report-id">{r.id}</code>
                      <PriorityBadge p={r.priority}/>
                      <TypeBadge t={r.type}/>
                      <StatusBadge s={r.status}/>
                    </div>
                    <span className="mod-report-time"><Clock size={11}/> {r.createdAt}</span>
                  </div>

                  {/* Row 2: target + category */}
                  <div className="mod-report-mid">
                    <span className="mod-report-target">
                      <User size={13}/> <strong>@{r.target}</strong>
                    </span>
                    <span className="mod-cat-badge" style={{color: cat?.color, background:(cat?.color||'#aaa')+'15'}}>
                      {cat?.label || r.category}
                    </span>
                  </div>

                  {/* Row 3: reason */}
                  <p className="mod-report-reason">{r.reason}</p>

                  {/* Row 4: reporter */}
                  <div className="mod-report-ft">
                    <span className="mod-reporter">Báo cáo bởi @{r.reporter}</span>
                    {r.status === 'resolved' && (
                      <span className="mod-action-tag">
                        {ACTIONS.find(a => a.value === r.action)?.label || r.action}
                      </span>
                    )}
                    <button className="mod-view-btn" onClick={e => { e.stopPropagation(); setSelectedReport(r); }}>
                      <Eye size={13}/> Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <DetailModal report={selectedReport} onAction={handleAction} onClose={() => setSelectedReport(null)}/>
      )}
    </div>
  );
}
