package com.example.iiawak_mobile.ui.auth;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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
import com.example.iiawak_mobile.config.NetworkConfig;
import com.example.iiawak_mobile.data.UserSession;
import com.google.android.material.button.MaterialButton;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

public class LoginFragment extends Fragment {

    private TextInputLayout tilEmail, tilPassword;
    private TextInputEditText etEmail, etPassword;
    private MaterialButton btnLogin, btnForgot, btnGoRegister, btnGoogle;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_login, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Bind views
        tilEmail = view.findViewById(R.id.til_email);
        tilPassword = view.findViewById(R.id.til_password);
        etEmail = view.findViewById(R.id.et_email);
        etPassword = view.findViewById(R.id.et_password);
        btnLogin = view.findViewById(R.id.btn_login);
        btnForgot = view.findViewById(R.id.btn_forgot_password);
        btnGoRegister = view.findViewById(R.id.btn_go_register);
        btnGoogle = view.findViewById(R.id.btn_google_login);

        // Login button
        btnLogin.setOnClickListener(v -> attemptLogin(view));

        // Forgot password
        if (btnForgot != null) {
            btnForgot.setOnClickListener(v ->
                    Navigation.findNavController(view).navigate(R.id.forgotPasswordFragment));
        }

        // Go to Register
        if (btnGoRegister != null) {
            btnGoRegister.setOnClickListener(v ->
                    Navigation.findNavController(view).navigate(R.id.registerFragment));
        }

        // Google login (mock)
        if (btnGoogle != null) {
            btnGoogle.setOnClickListener(v -> mockGoogleLogin(view));
        }

        // Enter key on password → submit
        if (etPassword != null) {
            etPassword.setOnEditorActionListener((textView, actionId, keyEvent) -> {
                attemptLogin(view);
                return true;
            });
        }
    }

    private void attemptLogin(View view) {
        // Clear errors
        if (tilEmail != null) tilEmail.setError(null);
        if (tilPassword != null) tilPassword.setError(null);

        String email = etEmail != null && etEmail.getText() != null
                ? etEmail.getText().toString().trim() : "";
        String password = etPassword != null && etPassword.getText() != null
                ? etPassword.getText().toString() : "";

        // Validate
        boolean valid = true;
        if (TextUtils.isEmpty(email)) {
            if (tilEmail != null) tilEmail.setError(getString(R.string.error_enter_email));
            valid = false;
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            if (tilEmail != null) tilEmail.setError(getString(R.string.error_invalid_email));
            valid = false;
        }
        if (TextUtils.isEmpty(password)) {
            if (tilPassword != null) tilPassword.setError(getString(R.string.error_enter_password));
            valid = false;
        } else if (password.length() < 6) {
            if (tilPassword != null) tilPassword.setError(getString(R.string.error_password_length));
            valid = false;
        }
        if (!valid) return;

        // Show loading
        setLoading(true);

        com.example.iiawak_mobile.data.remote.AuthApiService.login(getContext(), email, password, new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                setLoading(false);
                boolean success = json.optBoolean("success", false);
                String message = json.optString("message", "Lỗi đăng nhập");

                if (success) {
                    try {
                        // Backend: { success: true, data: { token, user } }
                        JSONObject data    = json.getJSONObject("data");
                        String token       = data.getString("token");
                        JSONObject userData = data.getJSONObject("user");

                        String userId      = userData.optString("id", userData.optString("_id", ""));
                        String username    = userData.getString("username");
                        String displayName = userData.optString("displayName", username);
                        String emailAddr   = userData.getString("email");
                        String role        = userData.optString("role", "user");
                        int kchBalance     = userData.optInt("kchBalance", 0);

                        UserSession.getInstance(requireContext())
                                .login(token, userId, username, displayName, emailAddr, role, kchBalance);

                        Toast.makeText(getContext(), getString(R.string.login_welcome_back, displayName), Toast.LENGTH_SHORT).show();
                        
                        // Đảm bảo navigate đúng action
                        Navigation.findNavController(view).navigate(R.id.action_login_to_main);
                    } catch (Exception e) {
                        Toast.makeText(getContext(), "Lỗi xử lý dữ liệu: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(getContext(), message, Toast.LENGTH_LONG).show();
                }

            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                setLoading(false);
                if (statusCode == 403 && errorMessage.toLowerCase().contains("bị khóa")) {
                    showBannedDialog(email);
                } else {
                    Toast.makeText(getContext(), errorMessage, Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    private void showBannedDialog(String identifier) {
        if (getContext() == null) return;
        new com.google.android.material.dialog.MaterialAlertDialogBuilder(getContext())
                .setTitle("Tài khoản bị khoá")
                .setMessage("Tài khoản của bạn đã bị khoá.\n\nNếu bạn muốn khiếu nại gỡ khoá, hãy gửi email cho Admin để được xem xét.\n\n📧 Email: admin@iiawak.com\n📝 Nhớ gửi kèm Username và Tên của bạn nhé!")
                .setPositiveButton("Đã hiểu", (dialog, which) -> dialog.dismiss())
                .show();
    }

    private void mockGoogleLogin(View view) {
        Toast.makeText(getContext(),
                "Đăng nhập Google chưa được hỗ trợ.\nVui lòng dùng Email & Mật khẩu.",
                Toast.LENGTH_LONG).show();
    }

    private void setLoading(boolean loading) {
        if (btnLogin == null) return;
        btnLogin.setEnabled(!loading);
        btnLogin.setText(loading ? getString(R.string.loading_login) : getString(R.string.btn_login));
        if (btnGoRegister != null) btnGoRegister.setEnabled(!loading);
        if (btnGoogle != null) btnGoogle.setEnabled(!loading);
    }
}
