package com.example.iiawak_mobile.ui.community;

import android.app.Dialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.Comment;
import com.example.iiawak_mobile.data.remote.CommunityApiService;
import com.example.iiawak_mobile.network.ApiClient;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class CommentsBottomSheetFragment extends BottomSheetDialogFragment {

    private static final String ARG_POST_ID = "post_id";
    private static final String ARG_POST_AUTHOR_ID = "post_author_id";
    
    private String postId;
    private String postAuthorId;

    private RecyclerView rvComments;
    private EditText etCommentInput;
    private ImageButton btnSendComment;
    
    private CommentAdapter adapter;
    private List<Comment> commentsList = new ArrayList<>();

    public static CommentsBottomSheetFragment newInstance(String postId, String postAuthorId) {
        CommentsBottomSheetFragment fragment = new CommentsBottomSheetFragment();
        Bundle args = new Bundle();
        args.putString(ARG_POST_ID, postId);
        args.putString(ARG_POST_AUTHOR_ID, postAuthorId);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            postId = getArguments().getString(ARG_POST_ID);
            postAuthorId = getArguments().getString(ARG_POST_AUTHOR_ID);
        }
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        BottomSheetDialog dialog = (BottomSheetDialog) super.onCreateDialog(savedInstanceState);
        // Đảm bảo bottom sheet có thể mở rộng
        dialog.setOnShowListener(dialogInterface -> {
            BottomSheetDialog d = (BottomSheetDialog) dialogInterface;
            View bottomSheetInternal = d.findViewById(com.google.android.material.R.id.design_bottom_sheet);
            if (bottomSheetInternal != null) {
                BottomSheetBehavior.from(bottomSheetInternal).setState(BottomSheetBehavior.STATE_EXPANDED);
            }
        });
        return dialog;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_comments_bottom_sheet, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        rvComments = view.findViewById(R.id.rv_comments);
        etCommentInput = view.findViewById(R.id.et_comment_input);
        btnSendComment = view.findViewById(R.id.btn_send_comment);

        adapter = new CommentAdapter(commentsList, comment -> {
            String currentUserId = com.example.iiawak_mobile.data.UserSession.getInstance(requireContext()).getUserId();
            if (comment.authorId.equals(currentUserId) || (postAuthorId != null && postAuthorId.equals(currentUserId))) {
                new AlertDialog.Builder(requireContext())
                        .setTitle("Xóa bình luận")
                        .setMessage("Bạn có chắc muốn xóa bình luận này không?")
                        .setPositiveButton("Xóa", (dialog, which) -> deleteComment(comment))
                        .setNegativeButton("Hủy", null)
                        .show();
            }
        });
        rvComments.setLayoutManager(new LinearLayoutManager(getContext()));
        rvComments.setAdapter(adapter);

        loadComments();

        btnSendComment.setOnClickListener(v -> {
            String content = etCommentInput.getText().toString().trim();
            if (!content.isEmpty()) {
                sendComment(content);
            }
        });
    }

    private void loadComments() {
        if (postId == null || postId.isEmpty()) {
            showError("Lỗi: ID bài viết không hợp lệ");
            return;
        }
        CommunityApiService.getComments(getContext(), postId, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                try {
                    commentsList.clear();
                    JSONArray data = response.optJSONArray("data");
                    if (data != null) {
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);
                            
                            commentsList.add(new Comment(
                                    obj.optString("id"),
                                    postId,
                                    obj.optString("authorId"),
                                    obj.optString("authorName"),
                                    obj.optString("authorAvatar"),
                                    obj.optString("content"),
                                    formatTime(obj.optString("createdAt")),
                                    0 // Like count (tuỳ chọn thêm)
                            ));
                        }
                    }
                    adapter.notifyDataSetChanged();
                    if (!commentsList.isEmpty()) {
                        rvComments.scrollToPosition(commentsList.size() - 1);
                    }
                } catch (Exception e) {
                    showError("Lỗi tải bình luận");
                }
            }

            @Override
            public void onError(String errorMsg, int errorCode) {
                showError("Lỗi: " + errorMsg);
            }
        });
    }

    private void sendComment(String content) {
        etCommentInput.setText("");
        etCommentInput.setEnabled(false);
        btnSendComment.setEnabled(false);

        CommunityApiService.addComment(getContext(), postId, content, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                etCommentInput.setEnabled(true);
                btnSendComment.setEnabled(true);
                // Sau khi gửi thành công thì tải lại danh sách
                loadComments();
            }

            @Override
            public void onError(String errorMsg, int errorCode) {
                etCommentInput.setEnabled(true);
                btnSendComment.setEnabled(true);
                showError("Lỗi: " + errorMsg);
            }
        });
    }

    private void deleteComment(Comment comment) {
        CommunityApiService.deleteComment(requireContext(), postId, comment.id, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                int index = commentsList.indexOf(comment);
                if (index >= 0) {
                    commentsList.remove(index);
                    adapter.notifyItemRemoved(index);
                    showError("Đã xóa bình luận");
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                showError("Lỗi: " + errorMessage);
            }
        });
    }

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
