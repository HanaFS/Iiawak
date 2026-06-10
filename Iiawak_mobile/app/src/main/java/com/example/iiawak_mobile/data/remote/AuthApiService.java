package com.example.iiawak_mobile.data.remote;

import android.content.Context;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONObject;

/**
 * AuthApiService — Các API liên quan đến xác thực người dùng.
 *
 *  POST /api/auth/register
 *  POST /api/auth/login
 */
public class AuthApiService {

    /** Đăng ký tài khoản mới */
    public static void register(Context context,
                                String username,
                                String email,
                                String password,
                                String displayName,
                                ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("username", username);
            body.put("email", email);
            body.put("password", password);
            body.put("displayName", displayName);
            ApiClient.post(context, "/auth/register", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    /** Đăng nhập — trả về { success, token, user } */
    public static void login(Context context,
                             String email,
                             String password,
                             ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("email", email);
            body.put("password", password);
            ApiClient.post(context, "/auth/login", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }
}
