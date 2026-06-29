package com.example.iiawak_mobile.data.remote;

import android.content.Context;
import com.example.iiawak_mobile.network.ApiClient;

/**
 * ChatApiService — Các API liên quan đến hội thoại User-User và Sessions AI.
 */
public class ChatApiService {

    /** Lấy danh sách các phiên chat AI của user */
    public static void getAiChatSessions(Context context, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/chat/ai/sessions", callback);
    }

    /** Lấy danh sách hội thoại DM giữa các User */
    public static void getDirectConversations(Context context, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/chat/direct/conversations", callback);
    }

    /** Lấy lịch sử tin nhắn với 1 user khác */
    public static void getDirectMessages(Context context, String otherUserId, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/chat/direct/" + otherUserId, callback);
    }
}
