package com.example.iiawak_mobile.data.remote;

import android.content.Context;
import com.example.iiawak_mobile.network.ApiClient;

public class SocialApiService {

    public static void toggleFollow(Context context, String targetId, ApiClient.ApiCallback callback) {
        ApiClient.post(context, "/social/follow/" + targetId, null, callback);
    }
}
