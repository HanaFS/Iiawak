package com.example.iiawak_mobile.data.remote;

import android.content.Context;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONObject;

/**
 * SocialApiService — Các API liên quan đến mạng xã hội (theo dõi, bạn bè).
 */
public class SocialApiService {

    /** Bật/tắt theo dõi một user */
    public static void toggleFollow(Context context, String targetId, ApiClient.ApiCallback callback) {
        ApiClient.post(context, "/social/follow/" + targetId, null, callback);
    }

    /** Lấy danh sách bạn bè / gợi ý theo dõi */
    public static void getSuggestedFriends(Context context, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/user/suggested-friends", callback);
    }

    /** Lấy danh sách người đang theo dõi của user hiện tại */
    public static void getFollowing(Context context, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/social/following", callback);
    }

    /** Lấy danh sách follower của user hiện tại */
    public static void getFollowers(Context context, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/social/followers", callback);
    }
}
