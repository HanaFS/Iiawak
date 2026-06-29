// Cấu hình base URL - tự động chuyển đổi giữa dev và production
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Hàm lấy token từ sessionStorage
export const getToken = () => sessionStorage.getItem('adminToken') || localStorage.getItem('iiawak_admin_token');

// Hàm gọi API chung
export async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi kết nối API');
  return data;
}
