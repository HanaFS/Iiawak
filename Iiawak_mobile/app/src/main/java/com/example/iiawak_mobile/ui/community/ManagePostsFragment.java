package com.example.iiawak_mobile.ui.community;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.FeedPost;
import com.example.iiawak_mobile.data.remote.CommunityApiService;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * ManagePostsFragment — Hiển thị TOÀN BỘ bài viết của người dùng (kể cả bài đã ẩn).
 *
 * Bài bị ẩn vẫn hiện trong danh sách này với badge "🙈 Đã ẩn" cạnh tên tác giả.
 * Menu 3 chấm cho phép: Chỉnh sửa, Ẩn/Bỏ ẩn, Xoá.
 */
public class ManagePostsFragment extends Fragment {

    private ImageButton btnBack;
    private RecyclerView rvPosts;
    private FeedAdapter adapter;
    private List<FeedPost> postsList = new ArrayList<>();
    private TextView tvEmptyState;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_manage_posts, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        btnBack    = view.findViewById(R.id.btn_back);
        rvPosts    = view.findViewById(R.id.rv_posts);
        tvEmptyState = view.findViewById(R.id.tv_empty_state);

        btnBack.setOnClickListener(v -> Navigation.findNavController(v).navigateUp());

        adapter = new FeedAdapter(postsList, new FeedAdapter.FeedInteractionListener() {
            @Override
            public void onFireClick(String postId) {
                // Like cũng hoạt động trên trang quản lý
                CommunityApiService.firePost(getContext(), postId, new ApiClient.ApiCallback() {
                    @Override public void onSuccess(JSONObject response) {}
                    @Override public void onError(String errorMsg, int errorCode) {}
                });
            }

            @Override
            public void onCommentClick(FeedPost post) {
                CommentsBottomSheetFragment bottomSheet =
                        CommentsBottomSheetFragment.newInstance(post.postId, post.authorId);
                bottomSheet.show(getChildFragmentManager(), "CommentsBottomSheet");
            }

            @Override
            public void onPostOptionsClick(FeedPost post, View anchorView) {
                showManageMenu(post, anchorView);
            }

            @Override
            public void onAuthorClick(String authorId) {
                // Trên trang quản lý của mình thì không cần nhảy đi đâu,
                // hoặc nhảy sang Profile tab.
            }
        });

        rvPosts.setLayoutManager(new LinearLayoutManager(getContext()));
        rvPosts.setAdapter(adapter);

        // Lắng nghe kết quả chỉnh sửa từ EditPostFragment
        requireActivity().getSupportFragmentManager()
                .setFragmentResultListener("post_edited", getViewLifecycleOwner(), (key, result) -> {
                    String editedId      = result.getString("editedPostId", "");
                    String editedContent = result.getString("editedContent", "");
                    for (int i = 0; i < postsList.size(); i++) {
                        if (postsList.get(i).postId.equals(editedId)) {
                            postsList.get(i).content  = editedContent;
                            postsList.get(i).isHidden = false; // updatePost bỏ ẩn trên backend
                            adapter.notifyItemChanged(i);
                            break;
                        }
                    }
                });

        loadMyPosts();
    }

    // ─── Menu tùy chọn bài viết ──────────────────────────────────────────────

    private void showManageMenu(FeedPost post, View anchor) {
        android.widget.PopupMenu popup = new android.widget.PopupMenu(requireContext(), anchor);

        popup.getMenu().add(0, 1, 0, "Chỉnh sửa");
        // Hiển thị "Bỏ ẩn" nếu bài đang ẩn, ngược lại hiển thị "Ẩn"
        popup.getMenu().add(0, 2, 0, post.isHidden ? "Bỏ ẩn bài viết" : "Ẩn bài viết");
        popup.getMenu().add(0, 3, 0, "Xóa bài viết");

        popup.setOnMenuItemClickListener(item -> {
            int id = item.getItemId();
            if (id == 1) {
                openEditPost(post);
                return true;
            } else if (id == 2) {
                toggleHidePost(post);
                return true;
            } else if (id == 3) {
                confirmDelete(post);
                return true;
            }
            return false;
        });
        popup.show();
    }

    /** Mở màn hình chỉnh sửa bài viết */
    private void openEditPost(FeedPost post) {
        try {
            Bundle args = new Bundle();
            args.putString("postId", post.postId);
            args.putString("content", post.content);
            args.putBoolean("isHidden", post.isHidden);
            Navigation.findNavController(requireView())
                    .navigate(R.id.action_manage_posts_to_edit_post, args);
        } catch (Exception e) {
            Toast.makeText(getContext(), "Không thể mở chỉnh sửa", Toast.LENGTH_SHORT).show();
        }
    }

    /** Ẩn hoặc bỏ ẩn bài viết — không xóa khỏi list, chỉ đổi trạng thái + badge */
    private void toggleHidePost(FeedPost post) {
        if (post.isHidden) {
            // Bỏ ẩn: gọi PUT /posts/:id với isHidden=false qua updatePost (giả lập bỏ ẩn)
            // Backend: khi updatePost, server tự đặt isHidden=false nếu có nội dung mới.
            // Ở đây ta gọi endpoint riêng nếu muốn chỉ bỏ ẩn mà không sửa nội dung:
            CommunityApiService.unhidePost(getContext(), post.postId, new ApiClient.ApiCallback() {
                @Override
                public void onSuccess(JSONObject response) {
                    post.isHidden = false;
                    int idx = postsList.indexOf(post);
                    if (idx >= 0) adapter.notifyItemChanged(idx);
                    Toast.makeText(getContext(), "Đã bỏ ẩn bài viết", Toast.LENGTH_SHORT).show();
                }
                @Override
                public void onError(String errorMsg, int errorCode) {
                    Toast.makeText(getContext(), "Lỗi: " + errorMsg, Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            // Ẩn bài viết — vẫn giữ trong list, chỉ đổi badge
            CommunityApiService.hidePost(getContext(), post.postId, new ApiClient.ApiCallback() {
                @Override
                public void onSuccess(JSONObject response) {
                    post.isHidden = true;
                    int idx = postsList.indexOf(post);
                    if (idx >= 0) adapter.notifyItemChanged(idx);
                    Toast.makeText(getContext(), "Đã ẩn bài viết", Toast.LENGTH_SHORT).show();
                }
                @Override
                public void onError(String errorMsg, int errorCode) {
                    Toast.makeText(getContext(), "Lỗi: " + errorMsg, Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    private void confirmDelete(FeedPost post) {
        new androidx.appcompat.app.AlertDialog.Builder(requireContext())
                .setTitle("Xóa bài viết")
                .setMessage("Bạn có chắc muốn xóa bài viết này không? Hành động này không thể hoàn tác.")
                .setPositiveButton("Xóa", (d, w) -> deletePost(post))
                .setNegativeButton("Hủy", null)
                .show();
    }

    private void deletePost(FeedPost post) {
        CommunityApiService.deletePost(getContext(), post.postId, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                Toast.makeText(getContext(), "Đã xóa bài viết", Toast.LENGTH_SHORT).show();
                int index = postsList.indexOf(post);
                if (index >= 0) {
                    postsList.remove(index);
                    adapter.notifyItemRemoved(index);
                }
                if (postsList.isEmpty()) tvEmptyState.setVisibility(View.VISIBLE);
            }
            @Override
            public void onError(String errorMsg, int errorCode) {
                Toast.makeText(getContext(), "Lỗi: " + errorMsg, Toast.LENGTH_SHORT).show();
            }
        });
    }

    // ─── Tải bài viết của tôi ────────────────────────────────────────────────

    private void loadMyPosts() {
        CommunityApiService.getMyPosts(getContext(), 50, 0, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                try {
                    postsList.clear();
                    JSONArray data = response.optJSONArray("data");
                    if (data != null && data.length() > 0) {
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);

                            // Character tag
                            String characterName  = null;
                            String characterTagId = null;
                            JSONObject charObj = obj.optJSONObject("characterTag");
                            if (charObj != null) {
                                characterName  = charObj.optString("name", null);
                                characterTagId = charObj.optString("id",   null);
                            }

                            boolean isHidden = obj.optBoolean("isHidden", false);

                            FeedPost post = new FeedPost(
                                    obj.optString("id", obj.optString("_id")),
                                    obj.optString("authorId"),
                                    obj.optString("authorName"),
                                    obj.optString("authorAvatar"),
                                    obj.optString("content"),
                                    characterName,
                                    characterTagId,
                                    formatTime(obj.optString("createdAt")),
                                    obj.optInt("fireCount", 0),
                                    obj.optInt("commentCount", 0),
                                    obj.optBoolean("firedByMe", false),
                                    isHidden
                            );
                            postsList.add(post);
                        }
                        tvEmptyState.setVisibility(View.GONE);
                    } else {
                        tvEmptyState.setVisibility(View.VISIBLE);
                    }
                    adapter.notifyDataSetChanged();
                } catch (Exception e) {
                    Toast.makeText(getContext(), "Lỗi parse dữ liệu: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onError(String errorMsg, int errorCode) {
                Toast.makeText(getContext(), "Lỗi tải bài viết: " + errorMsg, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private String formatTime(String isoDate) {
        try {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat(
                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault());
            sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            java.util.Date date = sdf.parse(isoDate);
            long diffMs   = System.currentTimeMillis() - date.getTime();
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
