package com.example.iiawak_mobile.ui.profile;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.UserSession;
import com.google.android.material.switchmaterial.SwitchMaterial;
import android.widget.TextView;

public class SettingsFragment extends Fragment {

    private UserSession session;
    private TextView tvLockStatus;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_settings, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Nút quay lại
        View btnBack = view.findViewById(R.id.btn_back_settings);
        if (btnBack != null) {
            btnBack.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(view).navigateUp());
        }

        // Chỉnh sửa hồ sơ
        View rowEditProfile = view.findViewById(R.id.row_edit_profile);
        if (rowEditProfile != null) {
            rowEditProfile.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(view)
                            .navigate(R.id.editProfileFragment));
        }

        // Đổi mật khẩu
        View rowChangePassword = view.findViewById(R.id.row_change_password);
        if (rowChangePassword != null) {
            rowChangePassword.setOnClickListener(v -> showChangePasswordDialog());
        }

        // Ngôn ngữ
        View rowLanguage = view.findViewById(R.id.row_language);
        if (rowLanguage != null) {
            rowLanguage.setOnClickListener(v ->
                    Toast.makeText(getContext(), "Ứng dụng hiện chỉ hỗ trợ Tiếng Việt", Toast.LENGTH_SHORT).show());
        }

        // Thông báo (switch)
        SwitchMaterial switchNotifications = view.findViewById(R.id.switch_notifications);
        if (switchNotifications != null) {
            switchNotifications.setOnCheckedChangeListener((btn, isChecked) -> {
                String msg = isChecked ? "Đã bật thông báo ✅" : "Đã tắt thông báo 🔕";
                Toast.makeText(getContext(), msg, Toast.LENGTH_SHORT).show();
            });
        }

        // Mức độ nội dung
        View rowContent = view.findViewById(R.id.row_content);
        if (rowContent != null) {
            rowContent.setOnClickListener(v -> showContentLevelDialog());
        }

        // Khóa ứng dụng
        View rowAppLock = view.findViewById(R.id.row_app_lock);
        if (rowAppLock != null) {
            rowAppLock.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(view)
                            .navigate(R.id.appLockFragment));
        }

        // Gửi phản hồi / Liên hệ
        View rowFeedback = view.findViewById(R.id.row_feedback);
        if (rowFeedback != null) {
            rowFeedback.setOnClickListener(v -> {
                Intent intent = new Intent(Intent.ACTION_SENDTO);
                intent.setData(Uri.parse("mailto:support@iiawak.app"));
                intent.putExtra(Intent.EXTRA_SUBJECT, "Phản hồi từ ứng dụng Iiawak");
                startActivity(Intent.createChooser(intent, "Gửi phản hồi"));
            });
        }

        // Đăng xuất
        View btnLogout = view.findViewById(R.id.btn_logout);
        if (btnLogout != null) {
            btnLogout.setOnClickListener(v -> showLogoutDialog());
        }
    }

    private void showChangePasswordDialog() {
        if (getContext() == null) return;
        View view = LayoutInflater.from(getContext()).inflate(R.layout.dialog_change_password, null);
        android.widget.EditText etOld = view.findViewById(R.id.et_old_password);
        android.widget.EditText etNew = view.findViewById(R.id.et_new_password);

        new AlertDialog.Builder(requireContext())
                .setTitle("Đổi mật khẩu")
                .setView(view)
                .setPositiveButton("Đổi mật khẩu", (dialog, which) -> {
                    String oldPass = etOld.getText().toString();
                    String newPass = etNew.getText().toString();
                    if (oldPass.isEmpty() || newPass.isEmpty()) {
                        Toast.makeText(getContext(), "Vui lòng nhập đầy đủ thông tin", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    com.example.iiawak_mobile.data.remote.UserApiService.changePassword(getContext(), oldPass, newPass, new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
                        @Override
                        public void onSuccess(org.json.JSONObject response) {
                            Toast.makeText(getContext(), "Đổi mật khẩu thành công ✅", Toast.LENGTH_LONG).show();
                        }

                        @Override
                        public void onError(String errorMessage, int statusCode) {
                            Toast.makeText(getContext(), "Lỗi: " + errorMessage, Toast.LENGTH_LONG).show();
                        }
                    });
                })
                .setNegativeButton("Hủy", null)
                .show();
    }

    private void showContentLevelDialog() {
        if (getContext() == null) return;
        String[] options = {"Thiếu niên (Teen)", "Trưởng thành (18+)"};
        new AlertDialog.Builder(requireContext())
                .setTitle("Mức độ nội dung")
                .setItems(options, (dialog, which) -> {
                    String selected = options[which];
                    Toast.makeText(getContext(), "Đã chọn: " + selected, Toast.LENGTH_SHORT).show();
                })
                .show();
    }

    private void showLogoutDialog() {
        if (getContext() == null) return;
        new AlertDialog.Builder(requireContext())
                .setTitle("Đăng xuất")
                .setMessage("Bạn có chắc muốn đăng xuất khỏi Iiawak không?")
                .setPositiveButton("Đăng xuất", (dialog, which) -> doLogout())
                .setNegativeButton("Hủy", null)
                .show();
    }

    private void doLogout() {
        if (getContext() == null) return;
        UserSession.getInstance(requireContext()).logout();
        androidx.navigation.Navigation.findNavController(requireView())
                .navigate(R.id.action_settings_to_login);
    }
}
