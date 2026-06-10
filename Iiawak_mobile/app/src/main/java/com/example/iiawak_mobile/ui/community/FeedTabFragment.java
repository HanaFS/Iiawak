package com.example.iiawak_mobile.ui.community;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.remote.CommunityApiService;
import com.example.iiawak_mobile.network.ApiClient;
import com.example.iiawak_mobile.data.model.FeedPost;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/**
 * FeedTabFragment — Hiển thị danh sách bài đăng cộng đồng từ backend.
 * KHÔNG còn dữ liệu mock: tất cả được lấy từ /api/community/feed.
 */
public class FeedTabFragment extends Fragment {

    private static final String ARG_TAB = "tab_type";
    public static final int TAB_TRENDING  = 0;
    public static final int TAB_FOLLOWING = 1;

    private int    tabType;
    private FeedAdapter           adapter;
    private final List<FeedPost>  posts = new ArrayList<>();

    public static FeedTabFragment newInstance(int tabType) {
        FeedTabFragment f = new FeedTabFragment();
        Bundle args = new Bundle();
        args.putInt(ARG_TAB, tabType);
        f.setArguments(args);
        return f;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            tabType = getArguments().getInt(ARG_TAB, TAB_TRENDING);
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_feed_tab, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        RecyclerView recyclerView = view.findViewById(R.id.feed_recycler);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));

        adapter = new FeedAdapter(posts, new FeedAdapter.FeedInteractionListener() {
            @Override
            public void onFireClick(String postId) {
                CommunityApiService.firePost(getContext(), postId, new ApiClient.ApiCallback() {
                    @Override public void onSuccess(JSONObject resp) {
                        if (resp.optBoolean("success", false)) {
                            for (FeedPost p : posts) {
                                if (p.postId.equals(postId)) {
                                    p.firedByMe = !p.firedByMe;
                                    p.fireCount += p.firedByMe ? 1 : -1;
                                }
                            }
                            adapter.notifyDataSetChanged();
                        }
                    }
                    @Override public void onError(String msg, int code) {}
                });
            }

            @Override
            public void onCommentClick(String postId) {
                // TODO: Điều hướng sang màn hình Chi tiết bài viết / Bình luận
                Toast.makeText(getContext(), "Tính năng bình luận đang phát triển", Toast.LENGTH_SHORT).show();
            }
        });
        recyclerView.setAdapter(adapter);

        // Load more (pagination)
        recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy) {
                if (dy > 0) { // Cuộn xuống
                    LinearLayoutManager layoutManager = (LinearLayoutManager) recyclerView.getLayoutManager();
                    if (layoutManager != null) {
                        int visibleItemCount = layoutManager.getChildCount();
                        int totalItemCount = layoutManager.getItemCount();
                        int pastVisibleItems = layoutManager.findFirstVisibleItemPosition();

                        if (!isLoading && !isLastPage) {
                            if ((visibleItemCount + pastVisibleItems) >= totalItemCount) {
                                loadFeed(false);
                            }
                        }
                    }
                }
            }
        });

        loadFeed(true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Load dữ liệu thật từ backend
    // ─────────────────────────────────────────────────────────────────────────

    private boolean isLoading = false;
    private boolean isLastPage = false;
    private int     currentPage = 0;
    private static final int LIMIT = 10;

    private void loadFeed(boolean isRefresh) {
        if (isLoading) return;
        isLoading = true;

        if (isRefresh) {
            currentPage = 0;
            isLastPage = false;
            posts.clear();
            adapter.notifyDataSetChanged();
        }

        String sort = (tabType == TAB_FOLLOWING) ? "following" : "viral";
        int skip = currentPage * LIMIT;

        CommunityApiService.getFeed(getContext(), sort, LIMIT, skip, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject resp) {
                isLoading = false;
                try {
                    JSONArray data = resp.getJSONArray("data");
                    if (data.length() < LIMIT) {
                        isLastPage = true;
                    }

                    for (int i = 0; i < data.length(); i++) {
                        JSONObject obj = data.getJSONObject(i);

                        // Author info (populated từ backend)
                        String authorName   = obj.optString("authorName",   "Iiawak User");
                        String authorId     = obj.optString("authorId",     "");
                        String authorAvatar = obj.optString("authorAvatar", "");

                        // Thử lấy từ nested object nếu backend populate
                        JSONObject authorObj = obj.optJSONObject("authorId");
                        if (authorObj != null) {
                            authorId     = authorObj.optString("_id",         authorId);
                            authorName   = authorObj.optString("displayName", authorName);
                            authorAvatar = authorObj.optString("avatar",      authorAvatar);
                        }

                        // Character tag
                        String characterName  = null;
                        String characterTagId = null;
                        JSONObject charObj = obj.optJSONObject("characterTag");
                        if (charObj != null) {
                            characterName  = charObj.optString("name", null);
                            characterTagId = charObj.optString("_id",  null);
                        }

                        posts.add(new FeedPost(
                                obj.optString("_id",       ""),
                                authorId,
                                authorName,
                                authorAvatar,
                                obj.optString("content",   ""),
                                characterName,
                                characterTagId,
                                formatTime(obj.optString("createdAt", "")),
                                obj.optInt("fireCount",    0),
                                obj.optInt("commentCount", 0),
                                obj.optBoolean("firedByMe", false)
                        ));
                    }
                    adapter.notifyDataSetChanged();
                    currentPage++;
                } catch (Exception e) {
                    showError("Không thể tải bài đăng");
                }
            }

            @Override
            public void onError(String msg, int code) {
                isLoading = false;
                showError("Lỗi kết nối: " + msg);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tiện ích
    // ─────────────────────────────────────────────────────────────────────────

    /** Chuyển ISO 8601 timestamp thành chuỗi "x giờ trước" đơn giản */
    private String formatTime(String isoDate) {
        try {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat(
                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault());
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

    private void showError(String msg) {
        if (getContext() != null) {
            Toast.makeText(getContext(), msg, Toast.LENGTH_SHORT).show();
        }
    }
}
