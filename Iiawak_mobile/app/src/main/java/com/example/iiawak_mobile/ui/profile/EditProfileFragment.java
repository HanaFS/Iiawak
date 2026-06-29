package com.example.iiawak_mobile.ui.profile;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.UserSession;
import com.example.iiawak_mobile.data.remote.UserApiService;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONObject;
import com.google.android.material.textfield.TextInputEditText;
import de.hdodenhof.circleimageview.CircleImageView;

public class EditProfileFragment extends Fragment {

    private CircleImageView editAvatar;
    private TextInputEditText editDisplayName, editUsername, editBio;
    private UserSession session;

    private final ActivityResultLauncher<Intent> imagePickerLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri imageUri = result.getData().getData();
                    if (imageUri != null && editAvatar != null) {
                        editAvatar.setImageURI(imageUri);
                        Toast.makeText(getContext(), "Ảnh đại diện đã cập nhật ✅", Toast.LENGTH_SHORT).show();
                    }
                }
            });

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_edit_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        session = UserSession.getInstance(requireContext());

        // Bind views
        editAvatar = view.findViewById(R.id.edit_avatar);
        editDisplayName = view.findViewById(R.id.edit_display_name);
        editUsername = view.findViewById(R.id.edit_username);
        editBio = view.findViewById(R.id.edit_bio);

        // Điền dữ liệu hiện tại
        if (editDisplayName != null) editDisplayName.setText(session.getDisplayName());
        if (editUsername != null) editUsername.setText(session.getUsername());

        // Bấm avatar để đổi ảnh
        View btnEditAvatar = view.findViewById(R.id.btn_edit_avatar);
        if (editAvatar != null) editAvatar.setOnClickListener(v -> openImagePicker());
        if (btnEditAvatar != null) btnEditAvatar.setOnClickListener(v -> openImagePicker());

        // Nút quay lại
        View btnBack = view.findViewById(R.id.btn_back_edit);
        if (btnBack != null) {
            btnBack.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(view).navigateUp());
        }

        // Nút lưu
        View btnSave = view.findViewById(R.id.btn_save_profile);
        if (btnSave != null) {
            btnSave.setOnClickListener(v -> saveProfile(view));
        }
    }

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        intent.setType("image/*");
        imagePickerLauncher.launch(intent);
    }

    private void saveProfile(View view) {
        String name = editDisplayName != null && editDisplayName.getText() != null
                ? editDisplayName.getText().toString().trim() : "";
        String username = editUsername != null && editUsername.getText() != null
                ? editUsername.getText().toString().trim() : "";

        String bio = editBio != null && editBio.getText() != null
                ? editBio.getText().toString().trim() : "";

        if (name.isEmpty()) {
            Toast.makeText(getContext(), "Vui lòng nhập tên hiển thị", Toast.LENGTH_SHORT).show();
            return;
        }

        // Không gửi avatar rỗng để tránh xóa avatar cũ trên server
        String avatarUrl = null;

        UserApiService.updateProfile(getContext(), name, username, bio, avatarUrl, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                if (response.optBoolean("success", false)) {
                    // Lưu vào session
                    session.setDisplayName(name);
                    session.setUsername(username);

                    // Cập nhật avatar từ response nếu có
                    JSONObject data = response.optJSONObject("data");
                    if (data != null) {
                        String newAvatar = data.optString("avatar", "");
                        if (!newAvatar.isEmpty()) session.setAvatarUrl(newAvatar);
                    }

                    Toast.makeText(getContext(), "Hồ sơ đã được cập nhật ✅", Toast.LENGTH_SHORT).show();
                    androidx.navigation.Navigation.findNavController(view).navigateUp();
                } else {
                    Toast.makeText(getContext(), "Lỗi: " + response.optString("message"), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                Toast.makeText(getContext(), "Lỗi kết nối: " + errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
