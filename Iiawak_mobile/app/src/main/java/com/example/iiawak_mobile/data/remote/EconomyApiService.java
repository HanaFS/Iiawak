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

    /** Xác thực hóa đơn Google Play */
    public static void verifyGooglePlayPurchase(Context context, String productId, String purchaseToken, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("productId", productId);
            body.put("purchaseToken", purchaseToken);
            ApiClient.post(context, "/economy/verify-purchase", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    /** Đổi Giftcode — backend dùng req.user.id từ JWT, không cần gửi username */
    public static void redeemGiftcode(Context context, String code, String username, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("code", code);
            // username chỉ để tham khảo, backend lấy userId từ token
            ApiClient.post(context, "/giftcodes/redeem", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    /** Lấy lịch sử giao dịch của user hiện tại */
    public static void getTransactions(Context context, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/user/transactions", callback);
    }
}
