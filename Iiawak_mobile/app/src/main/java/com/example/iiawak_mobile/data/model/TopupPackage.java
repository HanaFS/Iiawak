package com.example.iiawak_mobile.data.model;

/**
 * TopupPackage — Model gói nạp KCH từ API /api/economy/packages.
 */
public class TopupPackage {
    public String id;
    public String name;
    public int    price;   // Giá VNĐ
    public int    kch;     // Số Kim Cương Hồng nhận được
    public int    bonus;   // KCH thưởng thêm
    public boolean isActive;

    /** Tổng KCH thực nhận */
    public int getTotalKch() {
        return kch + bonus;
    }

    /** Giá hiển thị dạng: 9.900đ */
    public String getFormattedPrice() {
        return String.format("%,dđ", price).replace(',', '.');
    }
}
