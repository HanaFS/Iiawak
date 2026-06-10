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
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class RegisterFragment extends Fragment {

    private TextInputLayout tilUsername, tilEmail, tilPassword, tilConfirmPassword;
    private TextInputEditText etUsername, etEmail, etPassword, etConfirmPassword;
    private MaterialButton btnRegister, btnGoLogin;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_register, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Bind views
        tilUsername = view.findViewById(R.id.til_username);
        tilEmail = view.findViewById(R.id.til_email);
        tilPassword = view.findViewById(R.id.til_password);
        tilConfirmPassword = view.findViewById(R.id.til_confirm_password);
        etUsername = view.findViewById(R.id.et_username);
        etEmail = view.findViewById(R.id.et_email);
        etPassword = view.findViewById(R.id.et_password);
        etConfirmPassword = view.findViewById(R.id.et_confirm_password);
        btnRegister = view.findViewById(R.id.btn_register);
        btnGoLogin = view.findViewById(R.id.btn_go_login);

        // Register button
        if (btnRegister != null) {
            btnRegister.setOnClickListener(v -> attemptRegister(view));
        }

        // Go to Login
        if (btnGoLogin != null) {
            btnGoLogin.setOnClickListener(v ->
                    Navigation.findNavController(view).navigateUp());
        }
    }

    private void attemptRegister(View view) {
        // Clear errors
        clearErrors();

        String username = getText(etUsername);
        String email = getText(etEmail);
        String password = getText(etPassword);
        String confirm = getText(etConfirmPassword);

        // Validate
        boolean valid = true;

        if (TextUtils.isEmpty(username)) {
            setError(tilUsername, "Vui lòng nhập tên người dùng");
            valid = false;
        } else if (username.length() < 3) {
            setError(tilUsername, "Tên người dùng ít nhất 3 ký tự");
            valid = false;
        } else if (!username.matches("[a-zA-Z0-9_]+")) {
            setError(tilUsername, "Chỉ dùng chữ cái, số và dấu _");
            valid = false;
        }

        if (TextUtils.isEmpty(email)) {
            setError(tilEmail, "Vui lòng nhập email");
            valid = false;
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            setError(tilEmail, "Email không hợp lệ");
            valid = false;
        }

        if (TextUtils.isEmpty(password)) {
            setError(tilPassword, "Vui lòng nhập mật khẩu");
            valid = false;
        } else if (password.length() < 6) {
            setError(tilPassword, "Mật khẩu ít nhất 6 ký tự");
            valid = false;
        }

        if (!TextUtils.isEmpty(password) && !password.equals(confirm)) {
            setError(tilConfirmPassword, "Mật khẩu xác nhận không khớp");
            valid = false;
        }

        if (!valid) return;

        // Show loading
        setLoading(true);

        com.example.iiawak_mobile.data.remote.AuthApiService.register(getContext(), username, email, password, username, new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                setLoading(false);
                boolean success = json.optBoolean("success", false);
                String msg = json.optString("message", "Lỗi đăng ký");

                if (success) {
                    Toast.makeText(getContext(), "Đăng ký thành công! Hãy đăng nhập nhé. ✅", Toast.LENGTH_LONG).show();
                    Navigation.findNavController(view).navigateUp();
                } else {
                    Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                setLoading(false);
                Toast.makeText(getContext(), errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }

    // Helpers
    private String getText(TextInputEditText et) {
        return et != null && et.getText() != null ? et.getText().toString().trim() : "";
    }

    private void setError(TextInputLayout til, String msg) {
        if (til != null) til.setError(msg);
    }

    private void clearErrors() {
        if (tilUsername != null) tilUsername.setError(null);
        if (tilEmail != null) tilEmail.setError(null);
        if (tilPassword != null) tilPassword.setError(null);
        if (tilConfirmPassword != null) tilConfirmPassword.setError(null);
    }

    private void setLoading(boolean loading) {
        if (btnRegister == null) return;
        btnRegister.setEnabled(!loading);
        btnRegister.setText(loading ? "Đang đăng ký..." : getString(R.string.btn_register));
        if (btnGoLogin != null) btnGoLogin.setEnabled(!loading);
    }
}
