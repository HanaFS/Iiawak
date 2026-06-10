package com.example.iiawak_mobile.data.remote;

import android.content.Context;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONObject;

/**
 * CharacterApiService — Các API liên quan đến Nhân vật AI.
 */
public class CharacterApiService {

    /** Lấy danh sách nhân vật công khai */
    public static void getPublicCharacters(Context context, String queryParams, ApiClient.ApiCallback callback) {
        String endpoint = "/characters";
        if (queryParams != null && !queryParams.isEmpty()) {
            endpoint += "?" + queryParams;
        }
        ApiClient.get(context, endpoint, callback);
    }

    /** Lấy chi tiết 1 nhân vật */
    public static void getCharacterDetail(Context context, String characterId, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/characters/" + characterId, callback);
    }

    /** Gửi tin nhắn chat với nhân vật AI */
    public static void chatWithCharacter(Context context, String characterId, String message, String mode, String userId, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("message", message);
            body.put("mode", mode);
            body.put("userId", userId);
            ApiClient.post(context, "/characters/" + characterId + "/chat", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    /** Lấy lịch sử chat với nhân vật AI */
    public static void getChatHistory(Context context, String characterId, String userId, String mode, ApiClient.ApiCallback callback) {
        String endpoint = "/characters/" + characterId + "/chat/history?userId=" + userId + "&mode=" + mode;
        ApiClient.get(context, endpoint, callback);
    }

    /** Tạo nhân vật mới */
    public static void createCharacter(Context context, JSONObject characterData, ApiClient.ApiCallback callback) {
        ApiClient.post(context, "/characters", characterData, callback);
    }
}
