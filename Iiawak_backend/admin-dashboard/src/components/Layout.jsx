import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './Layout.css'; // Will be created next

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="layout-container">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="content-area animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
