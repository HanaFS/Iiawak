package com.example.iiawak_mobile.ui.auth;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.network.ApiClient;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import org.json.JSONObject;

public class ResetPasswordFragment extends Fragment {

    private TextInputLayout tilPassword, tilConfirmPassword;
    private TextInputEditText etPassword, etConfirmPassword;
    private MaterialButton btnSave;
    private android.widget.ImageButton btnBack;

    private String email = "";
    private String resetToken = "";

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_reset_password, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        if (getArguments() != null) {
            email = getArguments().getString("email", "");
            resetToken = getArguments().getString("resetToken", "");
        }

        tilPassword = view.findViewById(R.id.til_password);
        tilConfirmPassword = view.findViewById(R.id.til_confirm_password);
        etPassword = view.findViewById(R.id.et_password);
        etConfirmPassword = view.findViewById(R.id.et_confirm_password);
        btnSave = view.findViewById(R.id.btn_save_password);
        btnBack = view.findViewById(R.id.btn_back);

        btnBack.setOnClickListener(v -> Navigation.findNavController(view).navigateUp());

        btnSave.setOnClickListener(v -> savePassword(view));
    }

    private void savePassword(View view) {
        if (tilPassword != null) tilPassword.setError(null);
        if (tilConfirmPassword != null) tilConfirmPassword.setError(null);

        String password = etPassword != null && etPassword.getText() != null
                ? etPassword.getText().toString() : "";
        String confirmPassword = etConfirmPassword != null && etConfirmPassword.getText() != null
                ? etConfirmPassword.getText().toString() : "";

        boolean valid = true;
        if (TextUtils.isEmpty(password)) {
            if (tilPassword != null) tilPassword.setError("Vui lòng nhập mật khẩu mới");
            valid = false;
        } else if (password.length() < 6) {
            if (tilPassword != null) tilPassword.setError("Mật khẩu phải từ 6 ký tự trở lên");
            valid = false;
        }

        if (TextUtils.isEmpty(confirmPassword)) {
            if (tilConfirmPassword != null) tilConfirmPassword.setError("Vui lòng xác nhận mật khẩu");
            valid = false;
        } else if (!password.equals(confirmPassword)) {
            if (tilConfirmPassword != null) tilConfirmPassword.setError("Mật khẩu không khớp");
            valid = false;
        }

        if (!valid) return;

        if (btnSave != null) {
            btnSave.setEnabled(false);
            btnSave.setText("Đang lưu...");
        }

        com.example.iiawak_mobile.data.remote.AuthApiService.resetPassword(getContext(), email, resetToken, password, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                if (getView() == null) return;

                boolean success = json.optBoolean("success", false);
                String message = json.optString("message", "");

                if (btnSave != null) {
                    btnSave.setEnabled(true);
                    btnSave.setText("Lưu mật khẩu mới");
                }

                if (success) {
                    Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
                    // Thành công thì quay về trang Login (xoá backstack)
                    Navigation.findNavController(view).navigate(R.id.action_reset_to_login);
                } else {
                    Toast.makeText(getContext(), message, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                if (getView() == null) return;

                if (btnSave != null) {
                    btnSave.setEnabled(true);
                    btnSave.setText("Lưu mật khẩu mới");
                }
                Toast.makeText(getContext(), errorMessage, Toast.LENGTH_LONG).show();
            }
        });
    }
}
