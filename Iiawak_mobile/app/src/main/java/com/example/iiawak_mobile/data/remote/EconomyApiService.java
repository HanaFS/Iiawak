package com.example.iiawak_mobile.data.remote;

import android.content.Context;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONObject;

/**
 * EconomyApiService — Các API liên quan đến Nạp Kim Cương và Giftcode.
 */
public class EconomyApiService {

    /** Lấy danh sách gói nạp */
    public static void getTopupPackages(Context context, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/economy/packages", callback);
    }

    /** Đổi Giftcode */
    public static void redeemGiftcode(Context context, String code, String username, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("code", code);
            body.put("username", username);
            ApiClient.post(context, "/giftcodes/redeem", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }
}
