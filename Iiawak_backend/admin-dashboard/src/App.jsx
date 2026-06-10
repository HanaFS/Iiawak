import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import Economy from './pages/Economy';
import GiftCodes from './pages/GiftCodes';
import Events from './pages/Events';
import Moderation from './pages/Moderation';
import SystemConfig from './pages/SystemConfig';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    // Chặn nút lùi trình duyệt khi chưa đăng nhập
    const handlePopState = () => {
      if (sessionStorage.getItem('isAuthenticated') !== 'true') {
        navigate('/login', { replace: true });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/users" replace />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="economy" element={<Economy />} />
          <Route path="giftcodes" element={<GiftCodes />} />
          <Route path="events" element={<Events />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="config" element={<SystemConfig />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
