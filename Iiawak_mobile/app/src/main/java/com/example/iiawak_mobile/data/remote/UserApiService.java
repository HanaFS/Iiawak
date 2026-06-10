package com.example.iiawak_mobile.data.remote;

import android.content.Context;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONObject;

/**
 * UserApiService — Các API liên quan đến User Profile, Check-in, Wallet.
 */
public class UserApiService {

    /** Lấy thông tin profile user hiện tại */
    public static void getProfile(Context context, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/user/profile", callback);
    }

    /** Cập nhật profile */
    public static void updateProfile(Context context, String displayName, String bio, String avatar, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            if (displayName != null) body.put("displayName", displayName);
            if (bio != null) body.put("bio", bio);
            if (avatar != null) body.put("avatar", avatar);
            ApiClient.put(context, "/user/profile", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    /** Điểm danh hàng ngày */
    public static void checkIn(Context context, String date, int reward, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("date", date);
            body.put("reward", reward);
            ApiClient.post(context, "/user/checkin", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    /** Lấy lịch sử giao dịch KCH */
    public static void getTransactions(Context context, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/user/transactions", callback);
    }

    /** Gợi ý bạn bè */
    public static void getSuggestedFriends(Context context, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/user/suggested-friends", callback);
    }

    /** Đổi mật khẩu */
    public static void changePassword(Context context, String oldPassword, String newPassword, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("oldPassword", oldPassword);
            body.put("newPassword", newPassword);
            ApiClient.put(context, "/user/change-password", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }
}
