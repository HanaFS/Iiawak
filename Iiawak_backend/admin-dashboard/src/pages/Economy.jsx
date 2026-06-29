import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Diamond, Clock, Gift, Search, RotateCcw, X, Check, Plus, Sliders, Edit2, Save, Trash2 } from 'lucide-react';
import './Economy.css';

import { transactionApi } from '../api/transactionApi';
import { configApi } from '../api/configApi';
import { economyApi } from '../api/economyApi';

const INIT_TXN = [];
const fmt = n => n?.toLocaleString('vi-VN');

// Biểu tượng Kim Cương Hồng — SVG pink diamond (Đồng bộ theo ic_diamond.xml)
function KCH({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d="M12,2L2,9l10,13L22,9L12,2z" fill="url(#pkd)" />
      <path d="M12,4.8l5.8,5.2H6.2L12,4.8z" fill="rgba(255,255,255,0.45)" />
      <path d="M3.8,10.5h16.4l-8.2,10.7L3.8,10.5z" fill="rgba(0,0,0,0.08)" />
      <defs>
        <linearGradient id="pkd" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff9ee0" />
          <stop offset="100%" stopColor="#c2185b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function TrangThaiBadge({ s }) {
  const map = { success: ['#22c55e', 'Thành công'], pending: ['#f59e0b', 'Đang chờ'], failed: ['#ef4444', 'Thất bại'], refunded: ['#a78bfa', 'Đã hoàn'] };
  const [color, label] = map[s] || ['#aaa', '—'];
  return <span style={{ background: color + '22', color, padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>{label}</span>;
}

function TheThongKe({ icon, nhan, gia_tri, color, phu }) {
  return (
    <div className="eco-stat-card glass" style={{ '--glow': color }}>
      <div className="eco-stat-icon" style={{ background: color + '22', color }}>{icon}</div>
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
          <h3><RotateCcw size={15} /> Xác nhận hoàn tiền</h3>
          <button onClick={onDong}><X size={16} /></button>
        </div>
        <div className="eco-refund-info">
          <p>Mã GD: <code>{gd.id}</code></p>
          <p>Người dùng: <strong>@{gd.username}</strong></p>
          <p>Số lượng: <strong style={{ color: '#FF69B4', display: 'flex', alignItems: 'center', gap: 4 }}>{fmt(gd.qty)} <KCH size={15} /></strong></p>
        </div>
        <form onSubmit={gui}>
          <label className="eco-label">Lý do hoàn tiền</label>
          <textarea className="eco-input" value={lydo} rows={3} style={{ resize: 'none' }}
            placeholder="Nhập lý do xử lý hoàn tiền..." onChange={e => { setLydo(e.target.value); setLoi(''); }} />
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
  const [name, setName] = useState(goi.name || '');
  const [gia, setGia] = useState(goi.price);
  const [kch, setKch] = useState(goi.kch);
  const [playStoreId, setPlayStoreId] = useState(goi.playStoreProductId || '');
  return (
    <div className="eco-overlay" onClick={onDong}>
      <div className="eco-modal glass" onClick={e => e.stopPropagation()}>
        <div className="eco-modal-hd">
          <h3><Edit2 size={15} /> Chỉnh sửa: {goi.name}</h3>
          <button onClick={onDong}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="eco-label">Tên gói nạp</label>
            <input className="eco-input" type="text" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="eco-label">Giá nạp (VNĐ)</label>
            <input className="eco-input" type="number" value={gia} onChange={e => setGia(+e.target.value)} />
          </div>
          <div>
            <label className="eco-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><KCH size={14} /> Số lượng nhận được</label>
            <input className="eco-input" type="number" value={kch} onChange={e => setKch(+e.target.value)} />
          </div>
          <div>
            <label className="eco-label">Mã CH Play (Product ID)</label>
            <input className="eco-input" type="text" placeholder="Ví dụ: kch_pack_9900" value={playStoreId} onChange={e => setPlayStoreId(e.target.value)} />
          </div>
        </div>
        <div className="eco-modal-ft">
          <button className="eco-btn-ghost" onClick={onDong}>Huỷ</button>
          <button className="eco-btn-primary" onClick={() => { onLuu(goi.id, { name, price: gia, kch, playStoreProductId: playStoreId }); onDong(); }}>
            <Save size={14} /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalTaoGoi({ onLuu, onDong }) {
  const [name, setName] = useState('');
  const [gia, setGia] = useState('');
  const [kch, setKch] = useState('');
  const [playStoreId, setPlayStoreId] = useState('');

  const handleLuu = () => {
    if (!name || !gia || !kch) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc!');
      return;
    }
    onLuu({ name, price: +gia, kch: +kch, playStoreProductId: playStoreId });
  };

  return (
    <div className="eco-overlay" onClick={onDong}>
      <div className="eco-modal glass" onClick={e => e.stopPropagation()}>
        <div className="eco-modal-hd">
          <h3><Plus size={15} /> Tạo gói nạp mới</h3>
          <button onClick={onDong}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="eco-label">Tên gói nạp</label>
            <input className="eco-input" type="text" placeholder="Nhập tên gói..." value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="eco-label">Giá nạp (VNĐ)</label>
            <input className="eco-input" type="number" placeholder="Ví dụ: 9900" value={gia} onChange={e => setGia(e.target.value)} />
          </div>
          <div>
            <label className="eco-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><KCH size={14} /> Số lượng nhận được</label>
            <input className="eco-input" type="number" placeholder="Ví dụ: 80" value={kch} onChange={e => setKch(e.target.value)} />
          </div>
          <div>
            <label className="eco-label">Mã CH Play (Product ID)</label>
            <input className="eco-input" type="text" placeholder="Ví dụ: kch_pack_9900" value={playStoreId} onChange={e => setPlayStoreId(e.target.value)} />
          </div>
        </div>
        <div className="eco-modal-ft">
          <button className="eco-btn-ghost" onClick={onDong}>Huỷ</button>
          <button className="eco-btn-primary" onClick={handleLuu}>
            <Save size={14} /> Tạo gói ngay
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

  const [goiNap, setGoiNap] = useState([]);
  const [chinhSuaGoi, setChinhSuaGoi] = useState(null);
  const [hienTaoGoi, setHienTaoGoi] = useState(false);
  const [suKienX2, setSuKienX2] = useState(false);

  const [dieuChinh, setDieuChinh] = useState({ uid: '', qty: '', loai: 'cap', lydo: '' });
  const [thongBaoDC, setThongBaoDC] = useState('');

  const fetchRealTransactions = () => {
    transactionApi.getTransactions('', 'TOPUP').then(res => {
      if (res.data) {
        const formatted = res.data.map(tx => ({
          id: tx.txId,
          _id: tx._id,
          username: tx.userId?.username || 'Unknown',
          uid: tx.userId?._id ? tx.userId._id.substring(0, 8) + '...' : '---',
          qty: tx.amountKch,
          time: new Date(tx.createdAt).toLocaleTimeString() + ' ' + new Date(tx.createdAt).toLocaleDateString(),
          status: tx.status
        }));
        setGdList(formatted);
      }
    }).catch(err => console.error("Lỗi tải giao dịch:", err));
  };

  const fetchPackages = () => {
    economyApi.getPackages()
      .then(res => {
        if (res.success && res.data) {
          setGoiNap(res.data.map(p => ({ ...p, id: p.id || p._id })));
        }
      })
      .catch(err => console.error("Lỗi tải gói nạp:", err));
  };

  useEffect(() => {
    fetchRealTransactions();
    fetchPackages();

    // Load config from backend
    configApi.getConfig('suKienX2')
      .then(res => setSuKienX2(res.data?.value || false))
      .catch(() => { });
  }, []);

  const thongKe = useMemo(() => ({
    tongNap: gdList.filter(g => g.status === 'success').reduce((a, g) => a + g.qty, 0),
    choXuLy: gdList.filter(g => g.status === 'pending').length,
    tongGd: gdList.length,
  }), [gdList]);

  const gdHienThi = useMemo(() => gdList.filter(g => {
    if (locTrangThai !== 'all' && g.status !== locTrangThai) return false;
    const q = timKiem.toLowerCase();
    return !q || g.id.toLowerCase().includes(q) || g.uid.toLowerCase().includes(q) || g.username.toLowerCase().includes(q);
  }), [gdList, timKiem, locTrangThai]);

  const xuLyHoan = (id) => {
    setDaHoanIds(p => [...p, id]);
    setGdList(p => p.map(g => g.id === id ? { ...g, status: 'refunded' } : g));
  };

  const handleApprove = async (id, _id) => {
    if (!window.confirm('Bạn có chắc chắn muốn DUYỆT giao dịch này? Kim cương sẽ được cộng cho người dùng.')) return;
    try {
      await transactionApi.approveTransaction(_id);
      fetchRealTransactions();
    } catch (error) {
      alert(error.message || 'Lỗi khi duyệt');
    }
  };

  const handleReject = async (id, _id) => {
    if (!window.confirm('Bạn có chắc chắn muốn TỪ CHỐI giao dịch này?')) return;
    try {
      await transactionApi.rejectTransaction(_id);
      fetchRealTransactions();
    } catch (error) {
      alert(error.message || 'Lỗi khi từ chối');
    }
  };

  const luuGoiNap = (id, thayDoi) => {
    economyApi.updatePackage(id, thayDoi)
      .then(res => {
        if (res.success) {
          fetchPackages();
          alert('Cập nhật gói nạp thành công!');
        }
      })
      .catch(err => alert('Lỗi khi cập nhật: ' + err.message));
  };

  const taoGoiNap = (data) => {
    economyApi.createPackage(data)
      .then(res => {
        if (res.success) {
          fetchPackages();
          setHienTaoGoi(false);
          alert('Tạo gói nạp mới thành công!');
        }
      })
      .catch(err => alert('Lỗi khi tạo gói: ' + err.message));
  };

  const xoaGoiNap = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn XOÁ gói nạp này?')) return;
    economyApi.deletePackage(id)
      .then(res => {
        if (res.success) {
          fetchPackages();
          alert('Đã xoá gói nạp.');
        }
      })
      .catch(err => alert('Lỗi khi xoá: ' + err.message));
  };

  const xuLyDieuChinh = e => {
    e.preventDefault();
    if (!dieuChinh.uid || !dieuChinh.qty || !dieuChinh.lydo) { setThongBaoDC(' Vui lòng điền đầy đủ thông tin!'); return; }
    setThongBaoDC(` Đã ${dieuChinh.loai === 'cap' ? 'cấp' : 'khấu trừ'} ${fmt(+dieuChinh.qty)} Kim Cương Hồng cho UID ${dieuChinh.uid}`);
    setDieuChinh({ uid: '', qty: '', loai: 'cap', lydo: '' });
    setTimeout(() => setThongBaoDC(''), 4000);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="eco-page-hd">
        <h1 className="page-title">Kinh tế &amp; Giao dịch</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <button className="eco-btn-primary" onClick={() => setHienTaoGoi(true)} style={{ padding: '8px 15px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Tạo gói nạp mới
          </button>
          <div className="eco-event-toggle">
            <span>Sự kiện X2 nạp</span>
            <button className={`eco-toggle ${suKienX2 ? 'on' : ''}`} onClick={() => {
              const newVal = !suKienX2;
              setSuKienX2(newVal);
              configApi.updateConfig('suKienX2', newVal).catch((err) => {
                alert('Lỗi cập nhật cấu hình: ' + (err.message || 'Lỗi không xác định'));
                setSuKienX2(!newVal);
              });
            }}>
              <span className="eco-toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      {/* Thống kê */}
      <div className="eco-stats-grid">
        <TheThongKe icon={<KCH size={20} />} nhan="Tổng đã nạp" gia_tri={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{fmt(thongKe.tongNap)} <KCH size={18} /></span>} color="#FF69B4" phu="Giao dịch thành công" />
        <TheThongKe icon={<Diamond size={20} />} nhan="Tổng giao dịch" gia_tri={thongKe.tongGd} color="#a78bfa" phu="Tất cả trạng thái" />
        <TheThongKe icon={<Clock size={20} />} nhan="Chờ xử lý" gia_tri={thongKe.choXuLy} color="#f59e0b" phu="Giao dịch đang chờ" />
        <TheThongKe icon={<Gift size={20} />} nhan="Đã hoàn tiền" gia_tri={daHoanIds.length} color="#22c55e" phu="Giao dịch đã hoàn" />
      </div>

      {/* Giao dịch */}
      <section className="glass eco-section">
        <div className="eco-sec-hd">
          <h2 className="eco-sec-title">Quản lý Giao dịch &amp; Kiểm toán</h2>
          <div className="eco-toolbar">
            <div className="eco-search-wrap">
              <Search size={14} className="eco-search-ico" />
              <input className="eco-search" value={timKiem} onChange={e => setTimKiem(e.target.value)} placeholder="Tìm mã GD / ID / tên người dùng..." />
            </div>
            <select className="eco-select" value={locTrangThai} onChange={e => setLocTrangThai(e.target.value)}>
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
              <th>Mã GD</th><th>Tên người dùng</th><th>ID người dùng</th><th style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Nhận <KCH size={13} /></th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th>
            </tr></thead>
            <tbody>
              {gdHienThi.map(g => (
                <tr key={g.id}>
                  <td><code className="eco-code">{g.id}</code></td>
                  <td>@{g.username}</td>
                  <td><code className="eco-code eco-code-sm">{g.uid}</code></td>
                  <td><span className="eco-kch-val" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{fmt(g.qty)} <KCH size={15} /></span></td>
                  <td className="eco-muted">{g.time}</td>
                  <td><TrangThaiBadge s={daHoanIds.includes(g.id) ? 'refunded' : g.status} /></td>
                  <td>
                    {g.status === 'success' && !daHoanIds.includes(g.id) && (
                      <button className="eco-refund-btn" onClick={() => setGdHoan(g)}>
                        <RotateCcw size={12} /> Hoàn tiền
                      </button>
                    )}
                    {g.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ background: '#22c55e', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '12px' }} onClick={() => handleApprove(g.id, g._id)}>Duyệt</button>
                        <button style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '12px' }} onClick={() => handleReject(g.id, g._id)}>Từ chối</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {gdHienThi.length === 0 && <tr><td colSpan={7} className="eco-empty">Không tìm thấy giao dịch nào</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gói nạp */}
      <section className="glass eco-section">
        <div className="eco-sec-hd">
          <h2 className="eco-sec-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><KCH size={20} /> Gói nạp</h2>
        </div>
        <div className="eco-packs-grid">
          {goiNap.map(goi => (
            <div key={goi.id} className={`eco-pack-card ${suKienX2 ? 'x2' : ''}`}>
              {suKienX2 && <span className="eco-x2-badge">✨ X2</span>}
              <div className="eco-pack-icon"><KCH size={38} /></div>
              <p className="eco-pack-name">{goi.name}</p>
              <p className="eco-pack-kch" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{fmt(suKienX2 ? goi.kch * 2 : goi.kch)} <KCH size={18} /></p>
              <p className="eco-pack-price">{fmt(goi.price)}<span>₫</span></p>
              <div className="eco-pack-actions" style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="eco-pack-edit-btn" onClick={() => setChinhSuaGoi(goi)} style={{ flex: 1 }}>
                  <Edit2 size={12} /> Sửa
                </button>
                <button className="eco-pack-delete-btn" onClick={() => xoaGoiNap(goi.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {goiNap.length === 0 && <div className="eco-empty" style={{ gridColumn: '1/-1' }}>Chưa có gói nạp nào. Hãy tạo gói nạp đầu tiên!</div>}
        </div>
      </section>

      {/* Điều chỉnh thủ công */}
      <section className="glass eco-section">
        <h2 className="eco-sec-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Sliders size={18} /> Điều chỉnh Thủ công <KCH size={16} /></h2>
        <form onSubmit={xuLyDieuChinh} className="eco-adj-form">
          <div className="eco-adj-grid">
            <div>
              <label className="eco-label">ID người dùng</label>
              <input className="eco-input" placeholder="Nhập ID người dùng..." value={dieuChinh.uid}
                onChange={e => setDieuChinh(p => ({ ...p, uid: e.target.value }))} />
            </div>
            <div>
              <label className="eco-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Số lượng <KCH size={13} /></label>
              <input className="eco-input" type="number" placeholder="0" value={dieuChinh.qty}
                onChange={e => setDieuChinh(p => ({ ...p, qty: e.target.value }))} />
            </div>
            <div>
              <label className="eco-label">Thao tác</label>
              <select className="eco-input" value={dieuChinh.loai} onChange={e => setDieuChinh(p => ({ ...p, loai: e.target.value }))}>
                <option value="cap">➕ Cấp phát <KCH /></option>
                <option value="tru">➖ Khấu trừ <KCH /></option>
              </select>
            </div>
            <div>
              <label className="eco-label">Lý do hỗ trợ</label>
              <input className="eco-input" placeholder="Mô tả lý do điều chỉnh..." value={dieuChinh.lydo}
                onChange={e => setDieuChinh(p => ({ ...p, lydo: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className="eco-btn-primary eco-adj-submit">
            <Check size={15} /> Xác nhận điều chỉnh
          </button>
        </form>
        {thongBaoDC && <div className="eco-adj-msg">{thongBaoDC}</div>}
      </section>

      {gdHoan && <ModalHoanTien gd={gdHoan} onXacNhan={xuLyHoan} onDong={() => setGdHoan(null)} />}
      {chinhSuaGoi && <ModalChinhSuaGoi goi={chinhSuaGoi} onLuu={luuGoiNap} onDong={() => setChinhSuaGoi(null)} />}
      {hienTaoGoi && <ModalTaoGoi onLuu={taoGoiNap} onDong={() => setHienTaoGoi(false)} />}
    </div>
  );
}
