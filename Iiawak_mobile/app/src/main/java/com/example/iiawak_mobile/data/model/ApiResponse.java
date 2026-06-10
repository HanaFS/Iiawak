package com.example.iiawak_mobile.data.model;

/**
 * ApiResponse — Wrapper chung cho response từ server.
 * Tất cả API đều trả về dạng: { success: bool, data/message: ... }
 */
public class ApiResponse<T> {
    public boolean success;
    public String  message;
    public T       data;
    public String  token;       // Chỉ có trong login response

    public ApiResponse() {}
}
