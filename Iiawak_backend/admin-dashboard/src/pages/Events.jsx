import React, { useState, useMemo } from 'react';
import {
  CalendarPlus, Send, Bell, Clock, Users, Globe, User,
  Zap, Megaphone, CheckCircle2, XCircle, Trash2, Edit2,
  AlertTriangle, X, Plus, Eye, Sparkles, Tag
} from 'lucide-react';
import './Events.css';

/* ══════ Mock Data ══════ */
const INIT_EVENTS = [
  { id:'EV001', name:'Tuần Lễ Kim Cương Hồng', type:'bonus', desc:'Nạp bất kỳ gói nào nhận thêm 20% Kim Cương Hồng.', startDate:'2026-05-15', endDate:'2026-05-22', active:true, banner:'🌸', triggerType:'manual', triggerValue:'', rewardKCH:0, autoDistribute:false },
  { id:'EV002', name:'Sinh Nhật Iiawak 1 Tuổi', type:'special', desc:'Sự kiện kỷ niệm 1 năm thành lập với nhiều phần quà đặc biệt.', startDate:'2026-05-20', endDate:'2026-05-25', active:true, banner:'🎂', triggerType:'birthday', triggerValue:'', rewardKCH:100, autoDistribute:true },
  { id:'EV003', name:'Phúc Lợi Chơi Lâu Năm', type:'special', desc:'Tặng thưởng cho người chơi đã gắn bó từ 1 năm trở lên.', startDate:'2026-01-01', endDate:'2026-12-31', active:true, banner:'⏳', triggerType:'anniversary', triggerValue:'1', rewardKCH:200, autoDistribute:true },
  { id:'EV004', name:'Thử Thách Mùa Xuân', type:'challenge', desc:'Hoàn thành nhiệm vụ hằng ngày để nhận thưởng lớn.', startDate:'2026-04-01', endDate:'2026-04-30', active:false, banner:'🌷', triggerType:'login_streak', triggerValue:'7', rewardKCH:50, autoDistribute:true },
];

const INIT_NOTIFS = [
  { id:'NF001', title:'Bảo trì hệ thống', content:'Hệ thống sẽ bảo trì lúc 02:00 ngày 20/05/2026. Vui lòng hoàn thành giao dịch trước thời gian này.', target:'server', sentAt:'2026-05-17 22:00', type:'warning' },
  { id:'NF002', title:'Sự kiện Kim Cương mới!', content:'Tuần lễ Kim Cương Hồng đã bắt đầu. Nạp ngay để nhận thêm 20%!', target:'server', sentAt:'2026-05-15 10:00', type:'info' },
  { id:'NF003', title:'Phần thưởng VIP', content:'Cảm ơn bạn đã đồng hành cùng Iiawak. Phần thưởng đặc biệt đã được gửi vào tài khoản.', target:'user', sentAt:'2026-05-14 15:30', type:'success' },
];

const EVENT_TYPES = [
  { value:'bonus',     label:'🎁 Thưởng nạp',     color:'#FF69B4' },
  { value:'special',   label:'⭐ Đặc biệt',         color:'#f59e0b' },
  { value:'challenge', label:'🏆 Thử thách',        color:'#a78bfa' },
  { value:'maintenance', label:'🔧 Bảo trì',        color:'#6b7280' },
];

const NOTIF_TYPES = [
  { value:'info',    label:'💙 Thông tin', color:'#3b82f6' },
  { value:'success', label:'💚 Thành công', color:'#22c55e' },
  { value:'warning', label:'🧡 Cảnh báo',  color:'#f59e0b' },
  { value:'danger',  label:'❤️ Khẩn cấp', color:'#ef4444' },
];

const TRIGGER_TYPES = [
  { value:'birthday',    label:'🎂 Sinh nhật người chơi',  desc:'Tự động tặng vào đúng ngày sinh nhật' },
  { value:'anniversary', label:'⏳ Kỷ niệm tài khoản',     desc:'Tự động tặng theo số năm đã chơi' },
  { value:'login_streak',label:'🔥 Đăng nhập liên tiếp',    desc:'Thưởng khi đăng nhập đủ số ngày liên tiếp' },
  { value:'level',       label:'⭐ Đạt cấp độ',             desc:'Tự động khi người dùng đạt cấp độ yêu cầu' },
  { value:'manual',      label:'✋ Tầm điều kiện',          desc:'Admin phân phối thủ công' },
];

const EMPTY_EVENT = {
  name:'', type:'bonus', desc:'', startDate:'', endDate:'', banner:'🌟',
  triggerType:'manual', triggerValue:'', rewardKCH:'', autoDistribute:false,
};
const EMPTY_NOTIF = { title:'', content:'', target:'server', uid:'', type:'info' };

/* ── Helpers ── */
function statusEvent(e) {
  const now = new Date(); const s = new Date(e.startDate); const end = new Date(e.endDate);
  if (!e.active) return ['off','Đã tắt','#aaa'];
  if (now < s)   return ['upcoming','Sắp diễn ra','#a78bfa'];
  if (now > end) return ['ended','Đã kết thúc','#ef4444'];
  return ['active','Đang diễn ra','#22c55e'];
}

function EventCard({ ev, onToggle, onDelete }) {
  const [st, label, color] = statusEvent(ev);
  const eType = EVENT_TYPES.find(t => t.value === ev.type) || EVENT_TYPES[0];
  return (
    <div className={`ev-card glass ${st === 'ended' || st === 'off' ? 'ev-dim' : ''}`}
      style={{'--ev-color': eType.color}}>
      <div className="ev-card-top">
        <span className="ev-banner">{ev.banner}</span>
        <div className="ev-card-badges">
          <span className="ev-type-badge" style={{background: eType.color+'18', color: eType.color}}>{eType.label}</span>
          <span className="ev-status-badge" style={{background: color+'18', color}}>{label}</span>
        </div>
        <div className="ev-card-actions">
          <button className="ev-action-btn" title={ev.active?'Tắt sự kiện':'Bật sự kiện'} onClick={() => onToggle(ev.id)}>
            {ev.active ? <XCircle size={15}/> : <CheckCircle2 size={15}/>}
          </button>
          <button className="ev-action-btn ev-del" title="Xoá" onClick={() => onDelete(ev.id)}>
            <Trash2 size={14}/>
          </button>
        </div>
      </div>
      <h3 className="ev-card-name">{ev.name}</h3>
      <p className="ev-card-desc">{ev.desc}</p>
      {/* Điều kiện */}
      {ev.triggerType && ev.triggerType !== 'manual' && (
        <div className="ev-card-condition">
          <span className="ev-cond-trigger">
            {TRIGGER_TYPES.find(t=>t.value===ev.triggerType)?.label || ev.triggerType}
            {ev.triggerValue && ` (≥ ${ev.triggerValue}${ev.triggerType==='anniversary'?' năm':ev.triggerType==='login_streak'?' ngày':ev.triggerType==='level'?' cấp':''})`}
          </span>
          {ev.rewardKCH > 0 && (
            <span className="ev-cond-reward">
              💎 +{ev.rewardKCH?.toLocaleString('vi-VN')} KCH
              {ev.autoDistribute && <span className="ev-auto-badge">⚡ Tự động</span>}
            </span>
          )}
        </div>
      )}
      <div className="ev-card-dates">
        <Clock size={11}/> {ev.startDate} → {ev.endDate}
      </div>
    </div>
  );
}

function NotifRow({ n, onDelete }) {
  const t = NOTIF_TYPES.find(x => x.value === n.type) || NOTIF_TYPES[0];
  return (
    <div className="ev-notif-row">
      <span className="ev-notif-dot" style={{background: t.color, boxShadow:`0 0 6px ${t.color}`}}/>
      <div className="ev-notif-body">
        <div className="ev-notif-top">
          <span className="ev-notif-title">{n.title}</span>
          <span className="ev-notif-meta">
            <Clock size={10}/> {n.sentAt} &nbsp;|&nbsp;
            {n.target === 'server' ? '🌐 Toàn máy chủ' : '👤 Cá nhân'}
          </span>
        </div>
        <p className="ev-notif-content">{n.content}</p>
      </div>
      <button className="ev-del-btn" onClick={() => onDelete(n.id)}><Trash2 size={13}/></button>
    </div>
  );
}

/* ══════ MAIN ══════ */
export default function Events() {
  const [events, setEvents] = useState(INIT_EVENTS);
  const [notifs, setNotifs] = useState(INIT_NOTIFS);

  const [tab, setTab] = useState('events'); // 'events' | 'notify'
  const [showEventForm, setShowEventForm] = useState(false);
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [notifForm, setNotifForm] = useState(EMPTY_NOTIF);
  const [notifSent, setNotifSent] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [filterType, setFilterType] = useState('all');

  const stats = useMemo(() => ({
    total:    events.length,
    active:   events.filter(e => statusEvent(e)[0] === 'active').length,
    upcoming: events.filter(e => statusEvent(e)[0] === 'upcoming').length,
    notifs:   notifs.length,
  }), [events, notifs]);

  const filteredEvents = useMemo(() =>
    filterType === 'all' ? events : events.filter(e => e.type === filterType),
  [events, filterType]);

  const handleCreateEvent = e => {
    e.preventDefault();
    if (!eventForm.name || !eventForm.startDate || !eventForm.endDate) return;
    setEvents(p => [{ id:'EV'+Date.now(), ...eventForm, active:true }, ...p]);
    setEventForm(EMPTY_EVENT); setShowEventForm(false);
  };

  const handleToggleEvent = id => setEvents(p => p.map(e => e.id===id ? {...e,active:!e.active} : e));

  const handleSendNotif = e => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.content) return;
    const now = new Date().toLocaleString('vi-VN');
    setNotifs(p => [{ id:'NF'+Date.now(), ...notifForm, sentAt: now }, ...p]);
    setNotifSent(`✅ Đã gửi thông báo "${notifForm.title}" thành công!`);
    setNotifForm(EMPTY_NOTIF);
    setTimeout(() => setNotifSent(''), 4000);
  };

  const handleDelete = () => {
    if (deleteType === 'event') setEvents(p => p.filter(e => e.id !== deleteId));
    else setNotifs(p => p.filter(n => n.id !== deleteId));
    setDeleteId(null); setDeleteType('');
  };

  const confirmDelete = (id, type) => { setDeleteId(id); setDeleteType(type); };

  const evField = (key, val) => setEventForm(p => ({...p, [key]: val}));
  const nfField = (key, val) => setNotifForm(p => ({...p, [key]: val}));

  const BANNERS = ['🌸','🎂','🏆','💎','🎁','⭐','🌷','🎮','🎉','🔥','❤️','🌟'];

  return (
    <div className="page-container animate-fade-in">
      <div className="ev-page-hd">
        <h1 className="page-title">Sự kiện &amp; Thông báo</h1>
        <div className="ev-hd-actions">
          {tab === 'events' && (
            <button className="ev-btn-primary" onClick={() => setShowEventForm(v => !v)}>
              <Plus size={14}/> Tạo sự kiện
            </button>
          )}
          {tab === 'notify' && (
            <button className="ev-btn-primary" onClick={() => setShowNotifForm(v => !v)}>
              <Megaphone size={14}/> Gửi thông báo
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="ev-stats-row">
        {[
          [<Zap size={16}/>,      stats.active,   'Đang diễn ra',    '#22c55e'],
          [<Clock size={16}/>,    stats.upcoming, 'Sắp diễn ra',     '#a78bfa'],
          [<CalendarPlus size={16}/>, stats.total, 'Tổng sự kiện',   '#FF69B4'],
          [<Bell size={16}/>,     stats.notifs,   'Thông báo đã gửi','#f59e0b'],
        ].map(([icon, val, lbl, color], i) => (
          <div key={i} className="ev-stat glass" style={{'--stc': color}}>
            <span className="ev-stat-icon" style={{color, background:color+'18'}}>{icon}</span>
            <div><p className="ev-stat-val" style={{color}}>{val}</p><p className="ev-stat-lbl">{lbl}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="ev-tabs">
        <button className={`ev-tab ${tab==='events'?'active':''}`} onClick={() => setTab('events')}>
          <CalendarPlus size={14}/> Sự kiện
        </button>
        <button className={`ev-tab ${tab==='notify'?'active':''}`} onClick={() => setTab('notify')}>
          <Bell size={14}/> Thông báo
        </button>
      </div>

      {/* ══ TAB SỰ KIỆN ══ */}
      {tab === 'events' && (
        <>
          {showEventForm && (
            <form onSubmit={handleCreateEvent} className="glass ev-form animate-fade-in">
              <div className="ev-form-hd">
                <h3><CalendarPlus size={15}/> Tạo sự kiện mới</h3>
                <button type="button" className="ev-icon-close" onClick={() => setShowEventForm(false)}><X size={15}/></button>
              </div>
              <div className="ev-form-grid">
                <div className="ev-form-full">
                  <label className="ev-label">Tên sự kiện *</label>
                  <input className="ev-input" placeholder="Nhập tên sự kiện..." value={eventForm.name} onChange={e => evField('name', e.target.value)}/>
                </div>
                <div>
                  <label className="ev-label">Loại sự kiện</label>
                  <select className="ev-input" value={eventForm.type} onChange={e => evField('type', e.target.value)}>
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ev-label">Biểu tượng</label>
                  <div className="ev-banner-picker">
                    {BANNERS.map(b => (
                      <button type="button" key={b} className={`ev-banner-btn ${eventForm.banner===b?'active':''}`}
                        onClick={() => evField('banner', b)}>{b}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="ev-label">Ngày bắt đầu *</label>
                  <input className="ev-input" type="date" value={eventForm.startDate} onChange={e => evField('startDate', e.target.value)}/>
                </div>
                <div>
                  <label className="ev-label">Ngày kết thúc *</label>
                  <input className="ev-input" type="date" value={eventForm.endDate} onChange={e => evField('endDate', e.target.value)}/>
                </div>
                <div className="ev-form-full">
                  <label className="ev-label">Mô tả sự kiện</label>
                  <textarea className="ev-input ev-textarea" rows={3} placeholder="Mô tả nội dung sự kiện..."
                    value={eventForm.desc} onChange={e => evField('desc', e.target.value)}/>
                </div>

                {/* Điều kiện tham gia */}
                <div className="ev-form-full">
                  <div className="ev-cond-divider"><span>🎯 Điều kiện tham gia & Phần thưởng tự động</span></div>
                </div>

                <div className="ev-form-full">
                  <label className="ev-label">Loại điều kiện kích hoạt phát thưởng</label>
                  <div className="ev-trigger-grid">
                    {TRIGGER_TYPES.map(t => (
                      <button type="button" key={t.value}
                        className={`ev-trigger-btn ${eventForm.triggerType===t.value?'active':''}`}
                        onClick={() => evField('triggerType', t.value)}>
                        <span className="ev-trigger-icon">{t.label.split(' ')[0]}</span>
                        <span className="ev-trigger-text">
                          <strong>{t.label.slice(t.label.indexOf(' ')+1)}</strong>
                          <small>{t.desc}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {eventForm.triggerType !== 'manual' && (
                  <div>
                    <label className="ev-label">
                      {eventForm.triggerType==='birthday' ? 'Không cần giá trị (tự khớp ngày sinh)' :
                       eventForm.triggerType==='anniversary' ? 'Số năm tối thiểu' :
                       eventForm.triggerType==='login_streak' ? 'Số ngày đăng nhập liên tiếp' :
                       eventForm.triggerType==='level' ? 'Cấp độ tối thiểu' : 'Giá trị điều kiện'}
                    </label>
                    {eventForm.triggerType === 'birthday' ? (
                      <p className="ev-cond-note">🎂 Hệ thống sẽ tự động kiểm tra ngày sinh nhật trong profile và gửi thưởng đúng ngày.</p>
                    ) : (
                      <input className="ev-input" type="number" min={1} placeholder="Nhập số..."
                        value={eventForm.triggerValue} onChange={e => evField('triggerValue', e.target.value)}/>
                    )}
                  </div>
                )}

                <div>
                  <label className="ev-label">Phần thưởng Kim Cương Hồng 💎</label>
                  <input className="ev-input" type="number" min={0} placeholder="Số lượng KCH tặng (0 = không tặng)"
                    value={eventForm.rewardKCH} onChange={e => evField('rewardKCH', e.target.value)}/>
                </div>

                <div style={{display:'flex',alignItems:'center',gap:10,paddingTop:6}}>
                  <label className="ev-check-lbl">
                    <input type="checkbox" checked={eventForm.autoDistribute}
                      onChange={e => evField('autoDistribute', e.target.checked)}/>
                    <span>⚡ Phân phối tự động khi điều kiện được thoả</span>
                  </label>
                </div>
              </div>
              <div className="ev-form-ft">
                <button type="button" className="ev-btn-ghost" onClick={() => setShowEventForm(false)}>Huỷ</button>
                <button type="submit" className="ev-btn-primary"><CheckCircle2 size={13}/> Lưu sự kiện</button>
              </div>
            </form>
          )}

          {/* Filter by type */}
          <div className="ev-filter-row">
            <Tag size={13} style={{color:'#ccc'}}/>
            {[['all','Tất cả'], ...EVENT_TYPES.map(t => [t.value, t.label])].map(([v, l]) => (
              <button key={v} className={`ev-filter-btn ${filterType===v?'active':''}`} onClick={() => setFilterType(v)}>{l}</button>
            ))}
          </div>

          {filteredEvents.length === 0
            ? <div className="ev-empty glass"><Sparkles size={28} style={{color:'#FFB6C1'}}/><p>Chưa có sự kiện nào 🌸</p></div>
            : <div className="ev-cards-grid">
                {filteredEvents.map(ev => (
                  <EventCard key={ev.id} ev={ev}
                    onToggle={handleToggleEvent}
                    onDelete={id => confirmDelete(id, 'event')}/>
                ))}
              </div>
          }
        </>
      )}

      {/* ══ TAB THÔNG BÁO ══ */}
      {tab === 'notify' && (
        <>
          {showNotifForm && (
            <form onSubmit={handleSendNotif} className="glass ev-form animate-fade-in">
              <div className="ev-form-hd">
                <h3><Megaphone size={15}/> Gửi thông báo</h3>
                <button type="button" className="ev-icon-close" onClick={() => setShowNotifForm(false)}><X size={15}/></button>
              </div>
              <div className="ev-form-grid">
                <div className="ev-form-full">
                  <label className="ev-label">Tiêu đề thông báo *</label>
                  <input className="ev-input" placeholder="Nhập tiêu đề..." value={notifForm.title} onChange={e => nfField('title', e.target.value)}/>
                </div>
                <div>
                  <label className="ev-label">Loại thông báo</label>
                  <div className="ev-type-btns">
                    {NOTIF_TYPES.map(t => (
                      <button type="button" key={t.value}
                        className={`ev-type-btn ${notifForm.type===t.value?'active':''}`}
                        style={notifForm.type===t.value?{background:t.color+'20',color:t.color,borderColor:t.color}:{}}
                        onClick={() => nfField('type', t.value)}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="ev-label">Đối tượng nhận</label>
                  <div className="ev-type-btns">
                    {[['server','🌐 Toàn máy chủ'],['user','👤 Cá nhân / Nhóm']].map(([v,l]) => (
                      <button type="button" key={v}
                        className={`ev-type-btn ${notifForm.target===v?'active':''}`}
                        onClick={() => nfField('target', v)}>{l}</button>
                    ))}
                  </div>
                  {notifForm.target === 'user' && (
                    <input className="ev-input" style={{marginTop:8}} placeholder="Nhập UID (cách nhau bằng dấu phẩy)..." value={notifForm.uid} onChange={e => nfField('uid', e.target.value)}/>
                  )}
                </div>
                <div className="ev-form-full">
                  <label className="ev-label">Nội dung thông báo *</label>
                  <textarea className="ev-input ev-textarea" rows={4} placeholder="Nhập nội dung thông báo muốn gửi đến người dùng..."
                    value={notifForm.content} onChange={e => nfField('content', e.target.value)}/>
                </div>
              </div>
              {notifSent && <div className="ev-success-msg">{notifSent}</div>}
              <div className="ev-form-ft">
                <button type="button" className="ev-btn-ghost" onClick={() => setShowNotifForm(false)}>Huỷ</button>
                <button type="submit" className="ev-btn-primary"><Send size={13}/> Gửi ngay</button>
              </div>
            </form>
          )}

          {notifSent && !showNotifForm && <div className="ev-success-msg">{notifSent}</div>}

          <div className="glass ev-notif-list">
            <div className="ev-notif-hd">
              <h3 className="ev-section-title"><Bell size={15}/> Lịch sử thông báo đã gửi</h3>
            </div>
            {notifs.length === 0
              ? <p className="ev-notif-empty">Chưa có thông báo nào được gửi.</p>
              : notifs.map(n => <NotifRow key={n.id} n={n} onDelete={id => confirmDelete(id, 'notif')}/>)
            }
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="ev-overlay" onClick={() => setDeleteId(null)}>
          <div className="ev-confirm glass" onClick={e => e.stopPropagation()}>
            <AlertTriangle size={28} style={{color:'#f59e0b'}}/>
            <p className="ev-confirm-msg">Xác nhận xoá?<br/><small>Hành động không thể hoàn tác.</small></p>
            <div className="ev-confirm-ft">
              <button className="ev-btn-ghost" onClick={() => setDeleteId(null)}>Huỷ</button>
              <button className="ev-btn-danger" onClick={handleDelete}><Trash2 size={13}/> Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
