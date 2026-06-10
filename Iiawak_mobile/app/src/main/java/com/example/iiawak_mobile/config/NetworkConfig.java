package com.example.iiawak_mobile.config;

/**
 * NetworkConfig — Cấu hình tập trung cho các kết nối mạng.
 */
public class NetworkConfig {
    /**
     * IP của Backend Server.
     * - 10.0.2.2: Dùng cho Android Emulator để truy cập localhost máy tính.
     * - localhost/127.0.0.1: KHÔNG hoạt động trên emulator/device thật.
     * - Địa chỉ IP mạng LAN (vd: 192.168.1.x): Dùng khi test trên điện thoại thật.
     */
    public static final String BASE_URL = "http://10.0.2.2:5000/api";
}
