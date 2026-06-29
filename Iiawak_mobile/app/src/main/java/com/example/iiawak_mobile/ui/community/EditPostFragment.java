package com.example.iiawak_mobile.ui.community;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.remote.CommunityApiService;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONObject;

/**
 * EditPostFragment — Màn hình chỉnh sửa nội dung bài viết.
 *
 * Args (Bundle):
 *   - postId    (String): ID bài cần sửa
 *   - content   (String): Nội dung hiện tại
 *   - isHidden  (boolean): Bài có đang ẩn không (để hiện cảnh báo bỏ ẩn)
 */
public class EditPostFragment extends Fragment {

    private static final int MAX_CHARS = 2000;

    private String postId;
    private String originalContent;
    private boolean wasHidden;

    private EditText etContent;
    private ImageButton btnSave;
    private TextView tvCharCount;
    private View llHiddenWarning;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_edit_post, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Lấy args
        Bundle args = getArguments();
        if (args != null) {
            postId          = args.getString("postId", "");
            originalContent = args.getString("content", "");
            wasHidden       = args.getBoolean("isHidden", false);
        }

        // Bind views
        etContent       = view.findViewById(R.id.et_edit_content);
        btnSave         = view.findViewById(R.id.btn_save);
        tvCharCount     = view.findViewById(R.id.tv_char_count);
        llHiddenWarning = view.findViewById(R.id.ll_hidden_warning);

        // Điền nội dung cũ
        etContent.setText(originalContent);
        etContent.setSelection(originalContent.length()); // cursor cuối
        updateCharCount(originalContent.length());

        // Hiện cảnh báo nếu bài đang ẩn
        if (wasHidden && llHiddenWarning != null) {
            llHiddenWarning.setVisibility(View.VISIBLE);
        }

        // Theo dõi số ký tự
        etContent.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void afterTextChanged(Editable s) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                int len = s.toString().trim().length();
                updateCharCount(len);
                btnSave.setEnabled(len > 0 && len <= MAX_CHARS);
            }
        });

        // Nút quay lại
        view.findViewById(R.id.btn_back).setOnClickListener(v ->
                Navigation.findNavController(view).navigateUp());

        // Nút Lưu
        btnSave.setOnClickListener(v -> savePost(view));
    }

    private void savePost(View rootView) {
        String newContent = etContent.getText().toString().trim();
        if (newContent.isEmpty()) {
            Toast.makeText(getContext(), "Nội dung không được để trống", Toast.LENGTH_SHORT).show();
            return;
        }
        if (newContent.equals(originalContent) && !wasHidden) {
            Navigation.findNavController(rootView).navigateUp();
            return;
        }

        btnSave.setEnabled(false);

        CommunityApiService.updatePost(getContext(), postId, newContent, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                Toast.makeText(getContext(), "Đã lưu bài viết", Toast.LENGTH_SHORT).show();
                // Gửi result để Fragment cha tải lại Feed
                Bundle result = new Bundle();
                result.putString("editedPostId", postId);
                result.putString("editedContent", newContent);
                requireActivity().getSupportFragmentManager()
                        .setFragmentResult("post_edited", result);
                Navigation.findNavController(rootView).navigateUp();
            }

            @Override
            public void onError(String errorMsg, int errorCode) {
                btnSave.setEnabled(true);
                Toast.makeText(getContext(), "Lỗi: " + errorMsg, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void updateCharCount(int len) {
        if (tvCharCount != null) {
            tvCharCount.setText(len + " / " + MAX_CHARS);
            int color = len > MAX_CHARS
                    ? android.graphics.Color.parseColor("#FF5252")
                    : getResources().getColor(R.color.text_tertiary, null);
            tvCharCount.setTextColor(color);
        }
    }
}
