import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Diamond, Clock, Gift, Search, RotateCcw, X, Check, Plus, Sliders, Edit2, Save } from 'lucide-react';
import './Economy.css';

const INIT_TXN = [
  { id:'GD-A1B2', username:'cattuong_pink', uid:'A1B2C3D4E5F6', qty:500, time:'2026-05-17 23:10', status:'success' },
  { id:'GD-X8Y9', username:'tuan_handsome',  uid:'X8Y9Z0W1V2U3', qty:1200, time:'2026-05-17 21:30', status:'pending' },
  { id:'GD-K4L5', username:'linh_kawaii',    uid:'K4L5M6N7P8Q9', qty:200,  time:'2026-05-16 18:00', status:'success' },
  { id:'GD-R2S3', username:'baochau_dev',    uid:'R2S3T4U5V6W7', qty:800,  time:'2026-05-16 10:20', status:'failed'  },
  { id:'GD-Z9W1', username:'cattuong_pink',  uid:'A1B2C3D4E5F6', qty:100,  time:'2026-05-15 09:05', status:'success' },
];

const INIT_PACKS = [
  { id:'P1', name:'Túi Nhỏ Tân Thủ',    price:9900,   kch:80   },
  { id:'P2', name:'Hộp Phổ Thông',      price:29900,  kch:250  },
  { id:'P3', name:'Túi Bạc',            price:49900,  kch:450  },
  { id:'P4', name:'Rương Vàng',         price:99900,  kch:1000 },
  { id:'P5', name:'Rương Bạch Kim',     price:199900, kch:2200 },
  { id:'P6', name:'Kho Kim Cương',      price:499900, kch:6000 },
];


const fmt = n => n?.toLocaleString('vi-VN');

// Biểu tượng Kim Cương Hồng — SVG pink diamond inline
function KCH({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }}>
      <polygon points="12,2 22,9 12,22 2,9" fill="#FF69B4" opacity="0.85"/>
      <polygon points="12,2 22,9 12,22 2,9" fill="url(#pkd)" opacity="0.5"/>
      <polygon points="12,2 17,9 12,14 7,9" fill="rgba(255,255,255,0.55)"/>
      <defs>
        <linearGradient id="pkd" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff9ee0"/>
          <stop offset="100%" stopColor="#c2185b"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function TrangThaiBadge({ s }) {
  const map = { success:['#22c55e','Thành công'], pending:['#f59e0b','Đang chờ'], failed:['#ef4444','Thất bại'], refunded:['#a78bfa','Đã hoàn'] };
  const [color, label] = map[s] || ['#aaa','—'];
  return <span style={{ background:color+'22', color, padding:'3px 10px', borderRadius:20, fontSize:'0.78rem', fontWeight:700 }}>{label}</span>;
}

function TheThongKe({ icon, nhan, gia_tri, color, phu }) {
  return (
    <div className="eco-stat-card glass" style={{ '--glow': color }}>
      <div className="eco-stat-icon" style={{ background:color+'22', color }}>{icon}</div>
      <div>
        <p className="eco-stat-value" style={{ color }}>{gia_tri}</p>
        <p className="eco-stat-label">{nhan}</p>
        {phu && <p className="eco-stat-sub">{phu}</p>}
      </div>
    </div>
  );
}

function ModalHoanTien({ gd, onXacNhan, onDong }) {
  const [lydo, setLydo] = useState('');
  const [loi, setLoi] = useState('');
  const gui = e => {
    e.preventDefault();
    if (!lydo.trim()) { setLoi('Vui lòng nhập lý do hoàn tiền!'); return; }
    onXacNhan(gd.id, lydo.trim()); onDong();
  };
  return (
    <div className="eco-overlay" onClick={onDong}>
      <div className="eco-modal glass" onClick={e => e.stopPropagation()}>
        <div className="eco-modal-hd">
          <h3><RotateCcw size={15}/> Xác nhận hoàn tiền</h3>
          <button onClick={onDong}><X size={16}/></button>
        </div>
        <div className="eco-refund-info">
          <p>Mã GD: <code>{gd.id}</code></p>
          <p>Người dùng: <strong>@{gd.username}</strong></p>
          <p>Số lượng: <strong style={{color:'#FF69B4', display:'flex', alignItems:'center', gap:4}}>{fmt(gd.qty)} <KCH size={15}/></strong></p>
        </div>
        <form onSubmit={gui}>
          <label className="eco-label">Lý do hoàn tiền</label>
          <textarea className="eco-input" value={lydo} rows={3} style={{resize:'none'}}
            placeholder="Nhập lý do xử lý hoàn tiền..." onChange={e=>{setLydo(e.target.value);setLoi('');}} />
          {loi && <p className="eco-err">{loi}</p>}
          <div className="eco-modal-ft">
            <button type="button" className="eco-btn-ghost" onClick={onDong}>Huỷ</button>
            <button type="submit" className="eco-btn-primary">Xác nhận hoàn tiền</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalChinhSuaGoi({ goi, onLuu, onDong }) {
  const [gia, setGia] = useState(goi.price);
  const [kch, setKch] = useState(goi.kch);
  return (
    <div className="eco-overlay" onClick={onDong}>
      <div className="eco-modal glass" onClick={e=>e.stopPropagation()}>
        <div className="eco-modal-hd">
          <h3><Edit2 size={15}/> Chỉnh sửa: {goi.name}</h3>
          <button onClick={onDong}><X size={16}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <label className="eco-label">Giá nạp (VNĐ)</label>
            <input className="eco-input" type="number" value={gia} onChange={e=>setGia(+e.target.value)}/>
          </div>
          <div>
            <label className="eco-label" style={{display:'flex',alignItems:'center',gap:5}}><KCH size={14}/> Số lượng nhận được</label>
            <input className="eco-input" type="number" value={kch} onChange={e=>setKch(+e.target.value)}/>
          </div>
        </div>
        <div className="eco-modal-ft">
          <button className="eco-btn-ghost" onClick={onDong}>Huỷ</button>
          <button className="eco-btn-primary" onClick={()=>{onLuu(goi.id,{price:gia,kch});onDong();}}>
            <Save size={14}/> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Economy() {
  const [gdList, setGdList] = useState(INIT_TXN);
  const [timKiem, setTimKiem] = useState('');
  const [locTrangThai, setLocTrangThai] = useState('all');
  const [gdHoan, setGdHoan] = useState(null);
  const [daHoanIds, setDaHoanIds] = useState([]);

  const [goiNap, setGoiNap] = useState(() => {
    const saved = localStorage.getItem('eco_packs');
    return saved ? JSON.parse(saved) : INIT_PACKS;
  });
  const [chinhSuaGoi, setChinhSuaGoi] = useState(null);
  const [suKienX2, setSuKienX2] = useState(false);
  const [packSource, setPackSource] = useState('local'); // 'local' | 'api'

  const [dieuChinh, setDieuChinh] = useState({ uid:'', qty:'', loai:'cap', lydo:'' });
  const [thongBaoDC, setThongBaoDC] = useState('');

  // Thử kết nối backend; nếu thành công thì ưu tiên dữ liệu API
  useEffect(() => {
    fetch('http://localhost:5000/api/economy/packages')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.length > 0) {
          setGoiNap(data.data.map(p => ({...p, id: p._id})));
          setPackSource('api');
        }
      })
      .catch(() => { /* backend chưa chạy — dùng dữ liệu local */ });
  }, []);

  const thongKe = useMemo(() => ({
    tongNap: gdList.filter(g=>g.status==='success').reduce((a,g)=>a+g.qty,0),
    choXuLy: gdList.filter(g=>g.status==='pending').length,
    tongGd:  gdList.length,
  }), [gdList]);

  const gdHienThi = useMemo(() => gdList.filter(g => {
    if (locTrangThai !== 'all' && g.status !== locTrangThai) return false;
    const q = timKiem.toLowerCase();
    return !q || g.id.toLowerCase().includes(q) || g.uid.toLowerCase().includes(q) || g.username.toLowerCase().includes(q);
  }), [gdList, timKiem, locTrangThai]);

  const xuLyHoan = (id) => {
    setDaHoanIds(p=>[...p,id]);
    setGdList(p=>p.map(g=>g.id===id?{...g,status:'refunded'}:g));
  };

  const luuGoiNap = (id, thayDoi) => {
    if (packSource === 'api') {
      // Cập nhật qua API khi backend đang chạy
      fetch(`http://localhost:5000/api/economy/packages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thayDoi)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) setGoiNap(p => p.map(g => g.id === id ? { ...g, ...thayDoi } : g));
      })
      .catch(() => {});
    } else {
      // Lưu local khi chưa có backend
      setGoiNap(p => {
        const updated = p.map(g => g.id === id ? { ...g, ...thayDoi } : g);
        localStorage.setItem('eco_packs', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const xuLyDieuChinh = e => {
    e.preventDefault();
    if (!dieuChinh.uid || !dieuChinh.qty || !dieuChinh.lydo) { setThongBaoDC('⚠️ Vui lòng điền đầy đủ thông tin!'); return; }
    setThongBaoDC(`✅ Đã ${dieuChinh.loai==='cap'?'cấp':'khấu trừ'} ${fmt(+dieuChinh.qty)} Kim Cương Hồng cho UID ${dieuChinh.uid}`);
    setDieuChinh({ uid:'', qty:'', loai:'cap', lydo:'' });
    setTimeout(()=>setThongBaoDC(''), 4000);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="eco-page-hd">
        <h1 className="page-title">Kinh tế &amp; Giao dịch</h1>
        <div className="eco-event-toggle">
          <span>Sự kiện X2 nạp</span>
          <button className={`eco-toggle ${suKienX2?'on':''}`} onClick={()=>setSuKienX2(v=>!v)}>
            <span className="eco-toggle-knob"/>
          </button>
        </div>
      </div>

      {/* Thống kê */}
      <div className="eco-stats-grid">
        <TheThongKe icon={<KCH size={20}/>} nhan="Tổng đã nạp" gia_tri={<span style={{display:'flex',alignItems:'center',gap:6}}>{fmt(thongKe.tongNap)} <KCH size={18}/></span>} color="#FF69B4" phu="Giao dịch thành công"/>
        <TheThongKe icon={<Diamond size={20}/>}    nhan="Tổng giao dịch" gia_tri={thongKe.tongGd} color="#a78bfa" phu="Tất cả trạng thái"/>
        <TheThongKe icon={<Clock size={20}/>}      nhan="Chờ xử lý" gia_tri={thongKe.choXuLy} color="#f59e0b" phu="Giao dịch đang chờ"/>
        <TheThongKe icon={<Gift size={20}/>} nhan="Đã hoàn tiền" gia_tri={daHoanIds.length} color="#22c55e" phu="Giao dịch đã hoàn"/>
      </div>

      {/* Giao dịch */}
      <section className="glass eco-section">
        <div className="eco-sec-hd">
          <h2 className="eco-sec-title">Quản lý Giao dịch &amp; Kiểm toán</h2>
          <div className="eco-toolbar">
            <div className="eco-search-wrap">
              <Search size={14} className="eco-search-ico"/>
              <input className="eco-search" value={timKiem} onChange={e=>setTimKiem(e.target.value)} placeholder="Tìm mã GD / ID / tên người dùng..."/>
            </div>
            <select className="eco-select" value={locTrangThai} onChange={e=>setLocTrangThai(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="success">Thành công</option>
              <option value="pending">Đang chờ</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
        </div>
        <div className="eco-table-wrap">
          <table className="eco-table">
            <thead><tr>
              <th>Mã GD</th><th>Tên người dùng</th><th>ID người dùng</th><th style={{display:'flex',alignItems:'center',gap:5}}>Nhận <KCH size={13}/></th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th>
            </tr></thead>
            <tbody>
              {gdHienThi.map(g => (
                <tr key={g.id}>
                  <td><code className="eco-code">{g.id}</code></td>
                  <td>@{g.username}</td>
                  <td><code className="eco-code eco-code-sm">{g.uid.slice(0,8)}…</code></td>
                  <td><span className="eco-kch-val" style={{display:'flex',alignItems:'center',gap:5}}>{fmt(g.qty)} <KCH size={15}/></span></td>
                  <td className="eco-muted">{g.time}</td>
                  <td><TrangThaiBadge s={daHoanIds.includes(g.id)?'refunded':g.status}/></td>
                  <td>
                    {g.status==='success' && !daHoanIds.includes(g.id) && (
                      <button className="eco-refund-btn" onClick={()=>setGdHoan(g)}>
                        <RotateCcw size={12}/> Hoàn tiền
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {gdHienThi.length===0 && <tr><td colSpan={7} className="eco-empty">Không tìm thấy giao dịch nào 😿</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gói nạp */}
      <section className="glass eco-section">
        <div className="eco-sec-hd">
          <h2 className="eco-sec-title" style={{display:'flex',alignItems:'center',gap:8}}><KCH size={20}/> Gói nạp</h2>
        </div>
        <div className="eco-packs-grid">
          {goiNap.map(goi => (
            <div key={goi.id} className={`eco-pack-card ${suKienX2?'x2':''}`}>
              {suKienX2 && <span className="eco-x2-badge">✨ X2</span>}
              <div className="eco-pack-icon"><KCH size={38}/></div>
              <p className="eco-pack-name">{goi.name}</p>
              <p className="eco-pack-kch" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>{fmt(suKienX2 ? goi.kch*2 : goi.kch)} <KCH size={18}/></p>
              <p className="eco-pack-price">{fmt(goi.price)}<span>₫</span></p>
              <button className="eco-pack-edit-btn" onClick={()=>setChinhSuaGoi(goi)}>
                <Edit2 size={12}/> Chỉnh sửa
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Điều chỉnh thủ công */}
      <section className="glass eco-section">
        <h2 className="eco-sec-title" style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><Sliders size={18}/> Điều chỉnh Thủ công <KCH size={16}/></h2>
        <form onSubmit={xuLyDieuChinh} className="eco-adj-form">
          <div className="eco-adj-grid">
            <div>
              <label className="eco-label">ID người dùng</label>
              <input className="eco-input" placeholder="Nhập ID người dùng..." value={dieuChinh.uid}
                onChange={e=>setDieuChinh(p=>({...p,uid:e.target.value}))}/>
            </div>
            <div>
              <label className="eco-label" style={{display:'flex',alignItems:'center',gap:5}}>Số lượng <KCH size={13}/></label>
              <input className="eco-input" type="number" placeholder="0" value={dieuChinh.qty}
                onChange={e=>setDieuChinh(p=>({...p,qty:e.target.value}))}/>
            </div>
            <div>
              <label className="eco-label">Thao tác</label>
              <select className="eco-input" value={dieuChinh.loai} onChange={e=>setDieuChinh(p=>({...p,loai:e.target.value}))}>
                <option value="cap">➕ Cấp phát <KCH/></option>
                <option value="tru">➖ Khấu trừ <KCH/></option>
              </select>
            </div>
            <div>
              <label className="eco-label">Lý do hỗ trợ</label>
              <input className="eco-input" placeholder="Mô tả lý do điều chỉnh..." value={dieuChinh.lydo}
                onChange={e=>setDieuChinh(p=>({...p,lydo:e.target.value}))}/>
            </div>
          </div>
          <button type="submit" className="eco-btn-primary eco-adj-submit">
            <Check size={15}/> Xác nhận điều chỉnh
          </button>
        </form>
        {thongBaoDC && <div className="eco-adj-msg">{thongBaoDC}</div>}
      </section>

      {gdHoan     && <ModalHoanTien    gd={gdHoan}       onXacNhan={xuLyHoan}  onDong={()=>setGdHoan(null)}/>}
      {chinhSuaGoi && <ModalChinhSuaGoi goi={chinhSuaGoi} onLuu={luuGoiNap}     onDong={()=>setChinhSuaGoi(null)}/>}
    </div>
  );
}
