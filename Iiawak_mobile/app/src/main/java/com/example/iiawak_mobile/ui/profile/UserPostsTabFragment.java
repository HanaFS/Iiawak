package com.example.iiawak_mobile.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.FeedPost;
import com.example.iiawak_mobile.data.remote.CommunityApiService;
import com.example.iiawak_mobile.network.ApiClient;
import com.example.iiawak_mobile.ui.community.CommentsBottomSheetFragment;
import com.example.iiawak_mobile.ui.community.FeedAdapter;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class UserPostsTabFragment extends Fragment {

    private String userId;
    private RecyclerView recyclerView;
    private FeedAdapter adapter;
    private List<FeedPost> posts = new ArrayList<>();
    private TextView tvEmpty;

    public static UserPostsTabFragment newInstance(String userId) {
        UserPostsTabFragment fragment = new UserPostsTabFragment();
        Bundle args = new Bundle();
        args.putString("userId", userId);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            userId = getArguments().getString("userId");
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_feed_tab, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        recyclerView = view.findViewById(R.id.feed_recycler);
        tvEmpty = view.findViewById(R.id.feed_empty_state); // Assuming this ID exists or similar

        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new FeedAdapter(posts, new FeedAdapter.FeedInteractionListener() {
            @Override
            public void onFireClick(String postId) {
                CommunityApiService.firePost(getContext(), postId, new ApiClient.ApiCallback() {
                    @Override public void onSuccess(JSONObject resp) {
                        loadPosts(); // Reload for simplicity
                    }
                    @Override public void onError(String msg, int code) {}
                });
            }

            @Override
            public void onCommentClick(FeedPost post) {
                CommentsBottomSheetFragment.newInstance(post.postId, post.authorId)
                        .show(getChildFragmentManager(), "Comments");
            }

            @Override
            public void onPostOptionsClick(FeedPost post, View anchorView) {
                // Usually options for other users' posts are just "Report"
            }

            @Override
            public void onAuthorClick(String authorId) {
                // Already on the author's profile
            }
        });
        recyclerView.setAdapter(adapter);

        loadPosts();
    }

    private void loadPosts() {
        CommunityApiService.getUserPosts(getContext(), userId, 30, 0, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                try {
                    posts.clear();
                    JSONArray data = response.optJSONArray("data");
                    if (data != null) {
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);
                            
                            String characterName  = null;
                            String characterTagId = null;
                            JSONObject charObj = obj.optJSONObject("characterTag");
                            if (charObj != null) {
                                characterName  = charObj.optString("name", null);
                                characterTagId = charObj.optString("id",   null);
                            }

                            posts.add(new FeedPost(
                                    obj.optString("id"),
                                    obj.optString("authorId"),
                                    obj.optString("authorName"),
                                    obj.optString("authorAvatar"),
                                    obj.optString("content"),
                                    characterName,
                                    characterTagId,
                                    formatTime(obj.optString("createdAt")),
                                    obj.optInt("fireCount"),
                                    obj.optInt("commentCount"),
                                    obj.optBoolean("firedByMe")
                            ));
                        }
                    }
                    adapter.notifyDataSetChanged();
                    if (tvEmpty != null) tvEmpty.setVisibility(posts.isEmpty() ? View.VISIBLE : View.GONE);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) { }
        });
    }

    private String formatTime(String isoDate) {
        try {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault());
            sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            java.util.Date date = sdf.parse(isoDate);
            long diffMs = System.currentTimeMillis() - date.getTime();
            long diffMins = diffMs / 60_000;
            if (diffMins < 60) return diffMins + " phút trước";
            long diffHrs = diffMins / 60;
            if (diffHrs < 24) return diffHrs + " giờ trước";
            return (diffHrs / 24) + " ngày trước";
        } catch (Exception ignored) {
            return "Vừa xong";
        }
    }
}
