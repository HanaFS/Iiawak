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
            body.put("identifier", email);
            body.put("password", password);
            ApiClient.post(context, "/auth/login", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    /** Đăng nhập Google — gửi idToken lên server */
    public static void loginGoogle(Context context, String idToken, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("idToken", idToken);
            ApiClient.post(context, "/auth/google", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    // --- Quên mật khẩu ---

    public static void forgotPasswordOtp(Context context, String email, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("email", email);
            ApiClient.post(context, "/auth/forgot-password-otp", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    public static void verifyResetOtp(Context context, String email, String otp, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("email", email);
            body.put("otp", otp);
            ApiClient.post(context, "/auth/verify-reset-otp", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    public static void resetPassword(Context context, String email, String resetToken, String newPassword, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("email", email);
            body.put("resetToken", resetToken);
            body.put("newPassword", newPassword);
            ApiClient.post(context, "/auth/reset-password", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }
}
