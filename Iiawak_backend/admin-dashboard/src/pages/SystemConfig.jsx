import React, { useState, useMemo } from 'react';
import {
  Settings, Database, Server, Key, Shield, Globe, Bell, Clock,
  Save, RefreshCw, Eye, EyeOff, Check, AlertTriangle, Zap,
  HardDrive, Wifi, Users, MessageSquare, Bot, Sparkles, X, Copy
} from 'lucide-react';
import './SystemConfig.css';

/* ── Toggle Switch ── */
function Toggle({ checked, onChange, label }) {
  return (
    <label className="sc-toggle-wrap">
      <div className={`sc-toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
        <div className="sc-toggle-knob"/>
      </div>
      {label && <span className="sc-toggle-label">{label}</span>}
    </label>
  );
}

/* ── Slider Control ── */
function SliderRow({ label, value, min, max, step, unit, onChange, hint }) {
  return (
    <div className="sc-slider-row">
      <div className="sc-slider-hd">
        <label className="sc-field-label">{label}</label>
        <span className="sc-slider-val">{value?.toLocaleString('vi-VN')}<small>{unit}</small></span>
      </div>
      <input type="range" className="sc-slider" min={min} max={max} step={step||1}
        value={value} onChange={e => onChange(+e.target.value)}/>
      <div className="sc-slider-range">
        <span>{min?.toLocaleString('vi-VN')}{unit}</span>
        <span>{max?.toLocaleString('vi-VN')}{unit}</span>
      </div>
      {hint && <p className="sc-hint">{hint}</p>}
    </div>
  );
}

/* ── API Key Field ── */
function ApiKeyField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sc-api-field">
      <label className="sc-field-label">{label}</label>
      <div className="sc-api-input-wrap">
        <input className="sc-input sc-api-input"
          type={show ? 'text' : 'password'} value={value}
          onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
        <button type="button" className="sc-api-icon" onClick={() => setShow(v => !v)} title={show?'Ẩn':'Hiện'}>
          {show ? <EyeOff size={14}/> : <Eye size={14}/>}
        </button>
        <button type="button" className="sc-api-icon" onClick={handleCopy} title="Sao chép">
          {copied ? <Check size={14} style={{color:'#22c55e'}}/> : <Copy size={14}/>}
        </button>
      </div>
    </div>
  );
}

/* ══════ MAIN ══════ */
export default function SystemConfig() {
  /* API Keys */
  const [keys, setKeys] = useState({
    openai: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    payment: 'pk_test_xxxxxxxxxxxxxxxxxxxx',
    firebase: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx',
  });

  /* Server config */
  const [server, setServer] = useState({
    rateLimit: 100,
    maxUpload: 10,
    sessionTimeout: 30,
    aiMemory: 2048,
  });

  /* Feature toggles */
  const [features, setFeatures] = useState({
    maintenance: false,
    registration: true,
    chatbot: true,
    notifications: true,
    aiModeration: true,
    giftcodes: true,
  });

  /* Notification settings */
  const [notif, setNotif] = useState({
    email: true,
    push: true,
    sms: false,
    inApp: true,
    digest: 'realtime', // realtime | daily | weekly
  });

  /* Backup */
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [lastBackup] = useState('2026-05-17 22:00:00');

  /* Save toast */
  const [saved, setSaved] = useState('');

  const handleSave = (section) => {
    setSaved(`✅ Đã lưu ${section} thành công!`);
    setTimeout(() => setSaved(''), 3000);
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    setBackupMsg('');
    setTimeout(() => {
      setIsBackingUp(false);
      setBackupMsg('✅ Sao lưu thành công! Kích thước: 245 MB');
      setTimeout(() => setBackupMsg(''), 5000);
    }, 2500);
  };

  const sField = (key, val) => setServer(p => ({...p, [key]: val}));
  const fToggle = (key) => setFeatures(p => ({...p, [key]: !p[key]}));
  const nField = (key, val) => setNotif(p => ({...p, [key]: val}));

  const activeFeatures = Object.values(features).filter(Boolean).length;

  return (
    <div className="page-container animate-fade-in">
      <div className="sc-page-hd">
        <div>
          <h1 className="page-title">Cấu hình Hệ thống</h1>
          <p className="sc-subtitle">Quản lý API, Server, tính năng và bảo trì hệ thống</p>
        </div>
      </div>

      {/* Save toast */}
      {saved && <div className="sc-toast animate-fade-in">{saved}</div>}

      {/* Stats */}
      <div className="sc-stats-row">
        {[
          [<Server size={16}/>,  'Máy chủ',          features.maintenance ? '🔧 Bảo trì' : '🟢 Hoạt động', features.maintenance ? '#f59e0b' : '#22c55e'],
          [<Key size={16}/>,     'API Keys',          `${Object.keys(keys).length} khoá`,   '#a78bfa'],
          [<Zap size={16}/>,     'Tính năng',         `${activeFeatures}/6 bật`,              '#FF69B4'],
          [<Database size={16}/>, 'Sao lưu gần nhất', lastBackup.split(' ')[0],             '#3b82f6'],
        ].map(([icon, lbl, val, color], i) => (
          <div key={i} className="sc-stat glass" style={{'--sc':color}}>
            <span className="sc-stat-icon" style={{color, background:color+'18'}}>{icon}</span>
            <div>
              <p className="sc-stat-lbl">{lbl}</p>
              <p className="sc-stat-val" style={{color}}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="sc-grid">
        {/* ── API Keys ── */}
        <div className="glass sc-card">
          <div className="sc-card-hd">
            <h2 className="sc-card-title"><Key size={17}/> Quản lý API Keys</h2>
          </div>
          <div className="sc-card-body">
            <ApiKeyField label="OpenAI API Key" value={keys.openai}
              onChange={v => setKeys(p => ({...p, openai:v}))} placeholder="sk-..."/>
            <ApiKeyField label="Cổng thanh toán (Payment Gateway)" value={keys.payment}
              onChange={v => setKeys(p => ({...p, payment:v}))} placeholder="pk_..."/>
            <ApiKeyField label="Firebase / FCM Key" value={keys.firebase}
              onChange={v => setKeys(p => ({...p, firebase:v}))} placeholder="AIza..."/>
            <p className="sc-warning"><AlertTriangle size={12}/> Không chia sẻ API Key với bất kỳ ai. Key chỉ hiển thị cho Admin chính.</p>
          </div>
          <div className="sc-card-ft">
            <button className="sc-btn-primary" onClick={() => handleSave('API Keys')}>
              <Save size={13}/> Lưu API Keys
            </button>
          </div>
        </div>

        {/* ── Server & AI ── */}
        <div className="glass sc-card">
          <div className="sc-card-hd">
            <h2 className="sc-card-title"><Server size={17}/> Cấu hình Server & AI</h2>
          </div>
          <div className="sc-card-body">
            <SliderRow label="Giới hạn Rate Limit" value={server.rateLimit}
              min={10} max={500} unit=" req/s" onChange={v => sField('rateLimit', v)}
              hint="Số lượng yêu cầu API tối đa mỗi giây trên mỗi người dùng"/>
            <SliderRow label="Dung lượng tải lên tối đa" value={server.maxUpload}
              min={1} max={50} unit=" MB" onChange={v => sField('maxUpload', v)}
              hint="Giới hạn kích thước file upload (hình ảnh, avatar...)"/>
            <SliderRow label="Thời gian hết phiên" value={server.sessionTimeout}
              min={5} max={120} step={5} unit=" phút" onChange={v => sField('sessionTimeout', v)}
              hint="Tự động đăng xuất sau thời gian không hoạt động"/>
            <SliderRow label="Bộ nhớ AI tối đa" value={server.aiMemory}
              min={512} max={8192} step={512} unit=" MB" onChange={v => sField('aiMemory', v)}
              hint="RAM tối đa cấp cho mô hình AI chatbot"/>
          </div>
          <div className="sc-card-ft">
            <button className="sc-btn-primary" onClick={() => handleSave('Server & AI')}>
              <Save size={13}/> Lưu cấu hình
            </button>
          </div>
        </div>

        {/* ── Feature Toggles ── */}
        <div className="glass sc-card">
          <div className="sc-card-hd">
            <h2 className="sc-card-title"><Zap size={17}/> Quản lý Tính năng</h2>
          </div>
          <div className="sc-card-body">
            <div className="sc-toggle-list">
              {[
                ['maintenance', '🔧 Chế độ Bảo trì', 'Tạm ngưng truy cập, hiện trang bảo trì cho người dùng', true],
                ['registration', '📝 Đăng ký tài khoản', 'Cho phép người mới tạo tài khoản', false],
                ['chatbot', '🤖 Chatbot AI', 'Bật/tắt tính năng trò chuyện với AI', false],
                ['notifications', '🔔 Thông báo đẩy', 'Gửi push notification đến thiết bị người dùng', false],
                ['aiModeration', '🛡️ Kiểm duyệt AI', 'Tự động phát hiện và cảnh cáo nội dung vi phạm', false],
                ['giftcodes', '🎁 Hệ thống Giftcode', 'Cho phép người dùng nhập mã quà tặng', false],
              ].map(([key, label, desc, isDanger]) => (
                <div key={key} className={`sc-toggle-item ${isDanger && features[key] ? 'sc-danger-on' : ''}`}>
                  <div className="sc-toggle-info">
                    <span className="sc-toggle-name">{label}</span>
                    <span className="sc-toggle-desc">{desc}</span>
                  </div>
                  <Toggle checked={features[key]} onChange={() => fToggle(key)}/>
                </div>
              ))}
            </div>
            {features.maintenance && (
              <div className="sc-maint-warn animate-fade-in">
                <AlertTriangle size={14}/>
                <span>Chế độ Bảo trì đang <strong>BẬT</strong> — Người dùng không thể truy cập ứng dụng!</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Notification Config ── */}
        <div className="glass sc-card">
          <div className="sc-card-hd">
            <h2 className="sc-card-title"><Bell size={17}/> Cấu hình Thông báo</h2>
          </div>
          <div className="sc-card-body">
            <div className="sc-notif-channels">
              {[
                ['email', '📧 Email', 'Gửi thông báo qua email'],
                ['push', '📱 Push Notification', 'Thông báo đẩy trên thiết bị'],
                ['sms', '💬 SMS', 'Tin nhắn SMS (tốn phí)'],
                ['inApp', '🔔 Trong ứng dụng', 'Thông báo nội bộ trong app'],
              ].map(([key, label, desc]) => (
                <div key={key} className="sc-notif-ch">
                  <Toggle checked={notif[key]} onChange={v => nField(key, v)}/>
                  <div>
                    <span className="sc-notif-ch-name">{label}</span>
                    <span className="sc-notif-ch-desc">{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="sc-digest-section">
              <label className="sc-field-label">Tần suất gửi thông báo tổng hợp</label>
              <div className="sc-digest-btns">
                {[['realtime','⚡ Thời gian thực'],['daily','📅 Hằng ngày'],['weekly','📆 Hằng tuần']].map(([v,l]) => (
                  <button key={v} type="button"
                    className={`sc-digest-btn ${notif.digest===v?'active':''}`}
                    onClick={() => nField('digest', v)}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="sc-card-ft">
            <button className="sc-btn-primary" onClick={() => handleSave('Thông báo')}>
              <Save size={13}/> Lưu cài đặt
            </button>
          </div>
        </div>

        {/* ── Backup ── */}
        <div className="glass sc-card sc-card-full">
          <div className="sc-card-hd">
            <h2 className="sc-card-title"><Database size={17}/> Sao lưu & Phục hồi</h2>
          </div>
          <div className="sc-backup-body">
            <div className="sc-backup-info">
              <div className="sc-backup-stat">
                <HardDrive size={28} style={{color:'#3b82f6'}}/>
                <div>
                  <p className="sc-backup-big">245 MB</p>
                  <p className="sc-backup-lbl">Kích thước dữ liệu</p>
                </div>
              </div>
              <div className="sc-backup-stat">
                <Clock size={28} style={{color:'#a78bfa'}}/>
                <div>
                  <p className="sc-backup-big">{lastBackup}</p>
                  <p className="sc-backup-lbl">Sao lưu gần nhất</p>
                </div>
              </div>
              <div className="sc-backup-stat">
                <RefreshCw size={28} style={{color:'#22c55e'}}/>
                <div>
                  <p className="sc-backup-big">Hằng ngày</p>
                  <p className="sc-backup-lbl">Tần suất tự động</p>
                </div>
              </div>
            </div>

            {backupMsg && <div className="sc-backup-msg animate-fade-in">{backupMsg}</div>}

            <div className="sc-backup-actions">
              <button className={`sc-btn-backup ${isBackingUp?'pulsing':''}`}
                onClick={handleBackup} disabled={isBackingUp}>
                <Database size={16}/>
                {isBackingUp ? 'Đang sao lưu...' : 'Sao lưu ngay'}
              </button>
              <button className="sc-btn-ghost">
                <RefreshCw size={14}/> Phục hồi từ bản sao lưu
              </button>
            </div>

            <p className="sc-backup-note">
              💡 Hệ thống tự động sao lưu vào 02:00 mỗi ngày. Dữ liệu lưu trữ trong 30 ngày.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
