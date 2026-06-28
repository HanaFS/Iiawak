import React, { useState, useMemo } from 'react';
import { Ticket, Plus, Search, Trash2, Copy, Check, X, Gift, Globe, User, Sparkles, Clock, Hash, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { giftcodeApi } from '../api/giftcodeApi';
import './GiftCodes.css';

/* ── Pink Diamond icon ── */
function KCH({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }}>
      <polygon points="12,2 22,9 12,22 2,9" fill="#FF69B4" opacity="0.9"/>
      <polygon points="12,2 22,9 12,22 2,9" fill="url(#pkd2)" opacity="0.45"/>
      <polygon points="12,2 17,9 12,14 7,9" fill="rgba(255,255,255,0.6)"/>
      <defs>
        <linearGradient id="pkd2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff9ee0"/>
          <stop offset="100%" stopColor="#c2185b"/>
        </linearGradient>
      </defs>
    </svg>
  );
}



const EMPTY_FORM = { code:'', rewardQty:'', scope:'server', uid:'', unlimitedQty:false, total:100, noLimit:false, startDate:'', endDate:'' };

function StatusBadge({ m }) {
  const expired = !m.noLimit && m.endDate && new Date(m.endDate) < new Date();
  const full = !m.unlimitedQty && m.used >= m.total;
  if (!m.active || expired || full) return <span className="gc-badge gc-badge-off"><XCircle size={11}/> Hết hiệu lực</span>;
  return <span className="gc-badge gc-badge-on"><CheckCircle2 size={11}/> Đang hoạt động</span>;
}

function ScopeBadge({ scope }) {
  const map = { server:['🌐','Toàn máy chủ'], new:['🆕','Người mới'], user:['👤','Cá nhân'] };
  const [icon, label] = map[scope] || ['?',''];
  return <span className="gc-scope">{icon} {label}</span>;
}

/* ── Stats mini ── */
function MiniStat({ icon, value, label, color }) {
  return (
    <div className="gc-mini-stat glass" style={{'--gc':color}}>
      <span className="gc-mini-icon" style={{color}}>{icon}</span>
      <div>
        <p className="gc-mini-val" style={{color}}>{value}</p>
        <p className="gc-mini-lbl">{label}</p>
      </div>
    </div>
  );
}

export default function GiftCodes() {
  const [codes, setCodes] = React.useState([]);
  const [filter, setFilter] = useState('all'); // all | active | inactive
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copied, setCopied] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');

  const stats = useMemo(() => ({
    total:    codes.length,
    active:   codes.filter(c => c.active && (c.noLimit || (c.endDate && new Date(c.endDate) >= new Date()))).length,
    used:     codes.reduce((a, c) => a + (c.used || 0), 0),
    rewarded: codes.reduce((a, c) => a + ((c.used || 0) * (c.rewardQty || 0)), 0),
  }), [codes]);

  const filtered = useMemo(() => codes.filter(c => {
    const q = search.toLowerCase();
    const uidString = c.uid || '';
    const codeString = c.code || '';
    const matchQ = !q || codeString.toLowerCase().includes(q) || uidString.toLowerCase().includes(q);
    const isActive = c.active && (c.noLimit || (c.endDate && new Date(c.endDate) >= new Date()));
    if (filter === 'active' && !isActive) return false;
    if (filter === 'inactive' && isActive) return false;
    return matchQ;
  }), [codes, search, filter]);

  React.useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const res = await giftcodeApi.getAll();
      if (res.data) {
        // Map backend fields to UI fields
        const mapped = res.data.map(c => ({
          ...c,
          id: c._id || c.id,
          code: c.code || '',
          rewardQty: c.rewardKch || 0,
          total: c.maxUses || 1,
          used: c.usedCount || 0,
          uid: c.uid || '',
          scope: c.scope || 'server',
          active: c.active !== undefined ? c.active : true,
          noLimit: c.noLimit || false,
          unlimitedQty: c.unlimitedQty || false,
          startDate: c.startDate ? c.startDate.substring(0, 10) : '',
          endDate: c.endDate ? c.endDate.substring(0, 10) : '',
        }));
        setCodes(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleDelete = async (id) => {
    try {
      await giftcodeApi.delete(id);
      setCodes(p => p.filter(c => c.id !== id));
      setDeleteId(null);
    } catch (err) {
      alert(err.message || 'Lỗi xoá mã');
    }
  };

  const handleToggle = async (id) => {
    try {
      await giftcodeApi.toggle(id);
      setCodes(p => p.map(c => c.id === id ? {...c, active: !c.active} : c));
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.rewardQty) return;
    try {
      const newCodePayload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        rewardQty: +form.rewardQty,
        total: form.unlimitedQty ? 999999 : +form.total,
      };
      await giftcodeApi.create(newCodePayload);
      fetchCodes();
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Lỗi tạo mã');
    }
  };

  const fmt = n => n?.toLocaleString('vi-VN');

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="gc-page-hd">
        <div>
          <h1 className="page-title">Mã Quà Tặng</h1>
          <p className="gc-subtitle">Quản lý và phát hành giftcode cho người dùng</p>
        </div>
        <button className="gc-btn-primary" onClick={() => { setShowForm(v => !v); setForm(EMPTY_FORM); }}>
          <Plus size={15}/> {showForm ? 'Đóng form' : 'Tạo mã mới'}
        </button>
      </div>

      {/* Stats */}
      <div className="gc-stats-row">
        <MiniStat icon={<Ticket size={18}/>}  value={stats.total}           label="Tổng mã đã tạo"     color="#FF69B4"/>
        <MiniStat icon={<CheckCircle2 size={18}/>} value={stats.active}     label="Đang hoạt động"     color="#22c55e"/>
        <MiniStat icon={<Hash size={18}/>}    value={fmt(stats.used)}       label="Lượt nhập mã"        color="#a78bfa"/>
        <MiniStat icon={<KCH size={18}/>}     value={fmt(stats.rewarded)}   label="Kim Cương Hồng phát" color="#f59e0b"/>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass gc-form-panel animate-fade-in">
          <div className="gc-form-hd">
            <h3><Gift size={16}/> Tạo Giftcode mới</h3>
            <button className="gc-icon-close" onClick={() => setShowForm(false)}><X size={15}/></button>
          </div>
          <form onSubmit={handleCreate} className="gc-form-body">
            {/* Row 1 */}
            <div className="gc-form-grid">
              <div>
                <label className="gc-label">Mã Code <span className="gc-req">*</span></label>
                <input className="gc-input" placeholder="VD: SUMMER2026" value={form.code}
                  onChange={e => setForm(p => ({...p, code: e.target.value.toUpperCase()}))}/>
                <p className="gc-hint">Chỉ dùng chữ in hoa, số và dấu gạch ngang</p>
              </div>
              <div>
                <label className="gc-label">Phần thưởng <KCH size={13}/> <span className="gc-req">*</span></label>
                <input className="gc-input" type="number" placeholder="VD: 500" min={1} value={form.rewardQty}
                  onChange={e => setForm(p => ({...p, rewardQty: e.target.value}))}/>
                <p className="gc-hint">Số lượng Kim Cương Hồng người nhận</p>
              </div>
            </div>

            {/* Scope */}
            <div>
              <label className="gc-label">Phạm vi áp dụng</label>
              <div className="gc-scope-btns">
                {[['server','🌐 Toàn máy chủ'],['new','🆕 Người dùng mới'],['user','👤 Cá nhân / Nhóm']].map(([v,l]) => (
                  <button key={v} type="button"
                    className={`gc-scope-btn ${form.scope===v?'active':''}`}
                    onClick={() => setForm(p => ({...p, scope: v, uid:''}))}>{l}</button>
                ))}
              </div>
            </div>

            {form.scope === 'user' && (
              <div className="animate-fade-in">
                <label className="gc-label">ID người nhận (cách nhau bằng dấu phẩy)</label>
                <input className="gc-input" placeholder="VD: A1B2C3D4E5F6, X8Y9Z0W1V2U3" value={form.uid}
                  onChange={e => setForm(p => ({...p, uid: e.target.value}))}/>
              </div>
            )}

            {/* Quantity */}
            <div className="gc-form-grid">
              <div>
                <label className="gc-label">Số lượng mã phát hành</label>
                <div className="gc-inline-check">
                  <input className="gc-input" type="number" min={1}
                    placeholder="Nhập số lượng..."
                    value={form.unlimitedQty ? '' : form.total}
                    disabled={form.unlimitedQty}
                    onChange={e => setForm(p => ({...p, total: e.target.value}))}/>
                  <label className="gc-check-label">
                    <input type="checkbox" checked={form.unlimitedQty}
                      onChange={e => setForm(p => ({...p, unlimitedQty: e.target.checked}))}/>
                    Không giới hạn
                  </label>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="gc-label">Thời hạn sử dụng</label>
                <label className="gc-check-label" style={{marginBottom:8}}>
                  <input type="checkbox" checked={form.noLimit}
                    onChange={e => setForm(p => ({...p, noLimit: e.target.checked}))}/>
                  Không giới hạn thời gian
                </label>
                {!form.noLimit && (
                  <div className="gc-date-row">
                    <div>
                      <label className="gc-label-sm">Bắt đầu</label>
                      <input className="gc-input" type="date" value={form.startDate}
                        onChange={e => setForm(p => ({...p, startDate: e.target.value}))}/>
                    </div>
                    <div>
                      <label className="gc-label-sm">Kết thúc</label>
                      <input className="gc-input" type="date" value={form.endDate}
                        onChange={e => setForm(p => ({...p, endDate: e.target.value}))}/>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="gc-form-ft">
              <button type="button" className="gc-btn-ghost" onClick={() => setShowForm(false)}>Huỷ</button>
              <button type="submit" className="gc-btn-primary">
                <Ticket size={14}/> Phát hành mã
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar */}
      <div className="gc-toolbar">
        <div className="gc-search-wrap">
          <Search size={14} className="gc-search-ico"/>
          <input className="gc-search" placeholder="Tìm mã code, UID người nhận..."
            value={search} onChange={e => setSearch(e.target.value)}/>
          {search && <button className="gc-search-clear" onClick={() => setSearch('')}><X size={13}/></button>}
        </div>
        <div className="gc-filter-tabs">
          {[['all','Tất cả'],['active','Đang hoạt động'],['inactive','Hết hiệu lực']].map(([v,l]) => (
            <button key={v} className={`gc-filter-tab ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="gc-empty glass">
          <Sparkles size={32} style={{color:'#FFB6C1', marginBottom:8}}/>
          <p>Không tìm thấy mã nào 🌸</p>
        </div>
      ) : (
        <div className="gc-cards-grid">
          {filtered.map(c => {
            const expired = !c.noLimit && c.endDate && new Date(c.endDate) < new Date();
            const pct = c.unlimitedQty ? 20 : Math.min(100, (c.used / (c.total || 1)) * 100);
            return (
              <div key={c.id} className={`gc-card glass ${!c.active||expired?'gc-card-dim':''}`}>
                {/* Top row */}
                <div className="gc-card-top">
                  <div className="gc-card-code-wrap">
                    <code className="gc-card-code">{c.code}</code>
                    <button className="gc-copy-btn" onClick={() => handleCopy(c.code)}
                      title="Sao chép mã">
                      {copied === c.code ? <Check size={13}/> : <Copy size={13}/>}
                    </button>
                  </div>
                  <StatusBadge m={c}/>
                </div>

                {/* Reward */}
                <div className="gc-card-reward">
                  <KCH size={20}/>
                  <span className="gc-reward-val">{fmt(c.rewardQty)}</span>
                  <span className="gc-reward-lbl">Kim Cương Hồng</span>
                </div>

                {/* Meta */}
                <div className="gc-card-meta">
                  <span><ScopeBadge scope={c.scope}/></span>
                  <span className="gc-meta-date">
                    <Clock size={11}/>
                    {c.noLimit ? '♾️ Không giới hạn' : (c.endDate ? `→ ${c.endDate}` : 'Chưa đặt')}
                  </span>
                </div>

                {c.uid && <p className="gc-meta-uid">👤 UID: <code>{c.uid}</code></p>}

                {/* Usage bar */}
                <div className="gc-usage-wrap">
                  <div className="gc-usage-bar">
                    <div className="gc-usage-fill" style={{width:`${pct}%`}}/>
                  </div>
                  <span className="gc-usage-txt">{fmt(c.used)} / {c.unlimitedQty ? '∞' : fmt(c.total)} lượt</span>
                </div>

                {/* Actions */}
                <div className="gc-card-actions">
                  <button className={`gc-toggle-btn ${c.active?'off':'on'}`} onClick={() => handleToggle(c.id)}>
                    {c.active ? <><XCircle size={12}/> Vô hiệu hoá</> : <><CheckCircle2 size={12}/> Kích hoạt</>}
                  </button>
                  <button className="gc-del-btn" onClick={() => setDeleteId(c.id)}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="gc-overlay" onClick={() => setDeleteId(null)}>
          <div className="gc-confirm glass" onClick={e => e.stopPropagation()}>
            <AlertTriangle size={28} style={{color:'#f59e0b'}}/>
            <p className="gc-confirm-msg">Xác nhận xoá mã này?<br/><small>Hành động không thể hoàn tác.</small></p>
            <div className="gc-confirm-ft">
              <button className="gc-btn-ghost" onClick={() => setDeleteId(null)}>Huỷ</button>
              <button className="gc-btn-danger" onClick={() => handleDelete(deleteId)}>
                <Trash2 size={13}/> Xoá mã
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
