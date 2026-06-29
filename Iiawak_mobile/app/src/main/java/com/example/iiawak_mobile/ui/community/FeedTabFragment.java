package com.example.iiawak_mobile.ui.community;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import android.widget.PopupMenu;
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
            public void onCommentClick(FeedPost post) {
                CommentsBottomSheetFragment bottomSheet = CommentsBottomSheetFragment.newInstance(post.postId, post.authorId);
                bottomSheet.show(getChildFragmentManager(), "CommentsBottomSheet");
            }

            @Override
            public void onPostOptionsClick(FeedPost post, View anchorView) {
                showPostOptions(post, anchorView);
            }

            @Override
            public void onAuthorClick(String authorId) {
                String currentUserId = com.example.iiawak_mobile.data.UserSession.getInstance(requireContext()).getUserId();
                if (authorId.equals(currentUserId)) {
                    // Nếu là mình, nhảy sang tab Hồ sơ
                    try {
                        com.google.android.material.bottomnavigation.BottomNavigationView nav =
                                getActivity().findViewById(R.id.bottom_nav);
                        if (nav != null) nav.setSelectedItemId(R.id.profileFragment);
                    } catch (Exception ignored) {}
                } else {
                    // Nếu là người khác, mở UserProfileFragment
                    Bundle args = new Bundle();
                    args.putString("userId", authorId);
                    androidx.navigation.Navigation.findNavController(requireView())
                            .navigate(R.id.userProfileFragment, args);
                }
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

        // Lắng nghe khi tạo bài mới
        requireActivity().getSupportFragmentManager().setFragmentResultListener("new_post_created", getViewLifecycleOwner(), (key, result) -> {
            loadFeed(true);
        });
        // Lắng nghe khi chỉnh sửa bài (cập nhật nội dung ngay trên list, không cần tải lại)
        requireActivity().getSupportFragmentManager().setFragmentResultListener("post_edited", getViewLifecycleOwner(), (key, result) -> {
            String editedPostId = result.getString("editedPostId", "");
            String editedContent = result.getString("editedContent", "");
            for (int i = 0; i < posts.size(); i++) {
                if (posts.get(i).postId.equals(editedPostId)) {
                    posts.get(i).content = editedContent;
                    adapter.notifyItemChanged(i);
                    break;
                }
            }
        });
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

                        // Bỏ qua bài đã ẩn khi hiển thị Feed chính
                        if (obj.optBoolean("isHidden", false)) continue;

                        // Character tag
                        String characterName  = null;
                        String characterTagId = null;
                        JSONObject charObj = obj.optJSONObject("characterTag");
                        if (charObj != null) {
                            characterName  = charObj.optString("name", null);
                            characterTagId = charObj.optString("id",   null);
                        }

                        posts.add(new FeedPost(
                                obj.optString("id",           ""),
                                obj.optString("authorId",     ""),
                                obj.optString("authorName",   "Iiawak User"),
                                obj.optString("authorAvatar", ""),
                                obj.optString("content",      ""),
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

    private void showPostOptions(FeedPost post, View anchor) {
        PopupMenu popup = new PopupMenu(requireContext(), anchor);
        String currentUserId = com.example.iiawak_mobile.data.UserSession.getInstance(requireContext()).getUserId();

        if (post.authorId.equals(currentUserId)) {
            // Bài của mình
            popup.getMenu().add(0, 1, 0, "Chỉnh sửa");
            popup.getMenu().add(0, 2, 0, post.isHidden ? "Bỏ ẩn" : "Ẩn bài viết");
            popup.getMenu().add(0, 3, 0, "Xóa bài viết");
        } else {
            // Bài của người khác
            popup.getMenu().add(0, 4, 0, "Báo cáo bài viết");
        }

        popup.setOnMenuItemClickListener(item -> {
            switch (item.getItemId()) {
                case 1:
                    openEditPost(post);
                    return true;
                case 2:
                    hidePost(post);
                    return true;
                case 3:
                    deletePost(post);
                    return true;
                case 4:
                    showError("Đã gửi báo cáo");
                    return true;
            }
            return false;
        });
        popup.show();
    }

    /** Mở màn hình chỉnh sửa bài viết */
    private void openEditPost(FeedPost post) {
        try {
            android.os.Bundle args = new android.os.Bundle();
            args.putString("postId", post.postId);
            args.putString("content", post.content);
            args.putBoolean("isHidden", post.isHidden);
            androidx.navigation.Navigation
                    .findNavController(requireView())
                    .navigate(R.id.action_community_to_edit_post, args);
        } catch (Exception e) {
            showError("Không thể mở chỉnh sửa: " + e.getMessage());
        }
    }

    private void deletePost(FeedPost post) {
        CommunityApiService.deletePost(requireContext(), post.postId, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                int index = posts.indexOf(post);
                if (index >= 0) {
                    posts.remove(index);
                    adapter.notifyItemRemoved(index);
                    showError("Đã xóa bài viết");
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                showError(errorMessage);
            }
        });
    }

    private void hidePost(FeedPost post) {
        CommunityApiService.hidePost(requireContext(), post.postId, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                int index = posts.indexOf(post);
                if (index >= 0) {
                    posts.remove(index);
                    adapter.notifyItemRemoved(index);
                    showError("Đã ẩn bài viết");
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                showError(errorMessage);
            }
        });
    }

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
