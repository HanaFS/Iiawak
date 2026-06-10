package com.example.iiawak_mobile.data.remote;

import android.content.Context;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.List;

/**
 * CommunityApiService — Các API liên quan đến cộng đồng (Post, Comment, Social).
 */
public class CommunityApiService {

    /** Lấy Feed bài đăng */
    public static void getFeed(Context context, String sort, int limit, int skip, ApiClient.ApiCallback callback) {
        String endpoint = "/community/feed?sort=" + sort + "&limit=" + limit + "&skip=" + skip;
        ApiClient.get(context, endpoint, callback);
    }

    /** Tạo bài đăng mới */
    public static void createPost(Context context, String content, List<String> images, String characterTagId, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("content", content);
            if (images != null && !images.isEmpty()) {
                JSONArray imgArr = new JSONArray(images);
                body.put("images", imgArr);
            }
            if (characterTagId != null) {
                body.put("characterTag", characterTagId);
            }
            ApiClient.post(context, "/community/posts", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }

    /** Thả "Lửa" (Like) bài đăng */
    public static void firePost(Context context, String postId, ApiClient.ApiCallback callback) {
        ApiClient.post(context, "/community/posts/" + postId + "/fire", null, callback);
    }
    
    /** Lấy bình luận của bài viết */
    public static void getComments(Context context, String postId, ApiClient.ApiCallback callback) {
        ApiClient.get(context, "/community/posts/" + postId + "/comments", callback);
    }
    
    /** Gửi bình luận */
    public static void addComment(Context context, String postId, String content, ApiClient.ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("content", content);
            ApiClient.post(context, "/community/posts/" + postId + "/comments", body, callback);
        } catch (Exception e) {
            callback.onError("Lỗi tạo request: " + e.getMessage(), 0);
        }
    }
}
