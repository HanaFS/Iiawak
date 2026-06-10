import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Coins, Gift, Calendar, ShieldAlert, Settings } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { path: '/users', icon: <Users size={20} />, label: 'Quản lý Người dùng' },
    { path: '/economy', icon: <Coins size={20} />, label: 'Kinh tế & Giao dịch' },
    { path: '/giftcodes', icon: <Gift size={20} />, label: 'Mã Quà Tặng' },
    { path: '/events', icon: <Calendar size={20} />, label: 'Sự kiện & Thông báo' },
    { path: '/moderation', icon: <ShieldAlert size={20} />, label: 'Xử lý Vi phạm' },
    { path: '/config', icon: <Settings size={20} />, label: 'Cấu hình Hệ thống' },
  ];

  return (
    <aside className={`sidebar glass ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h1 className="logo-text">{isOpen ? 'Iiawak Admin' : 'IA'}</h1>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={!isOpen ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {isOpen && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
