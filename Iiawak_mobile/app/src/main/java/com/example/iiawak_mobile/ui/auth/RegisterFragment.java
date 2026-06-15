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
import com.example.iiawak_mobile.data.UserSession;
import com.example.iiawak_mobile.data.remote.AuthApiService;
import com.example.iiawak_mobile.network.ApiClient;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import org.json.JSONObject;

/**
 * RegisterFragment — Màn hình đăng ký tài khoản mới.
 *
 * Flow:
 *  1. Validate form cục bộ (username, email, password, confirm)
 *  2. Gọi POST /api/auth/register  → { success, data: { token, user } }
 *  3. Lưu session (tự đăng nhập luôn — không cần đăng nhập lại)
 *  4. Navigate vào màn hình chính
 */
public class RegisterFragment extends Fragment {

    private TextInputLayout   tilUsername, tilEmail, tilPassword, tilConfirmPassword;
    private TextInputEditText etUsername, etEmail, etPassword, etConfirmPassword;
    private MaterialButton    btnRegister, btnGoLogin;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_register, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // ── Bind views ────────────────────────────────────────────────────────
        tilUsername        = view.findViewById(R.id.til_username);
        tilEmail           = view.findViewById(R.id.til_email);
        tilPassword        = view.findViewById(R.id.til_password);
        tilConfirmPassword = view.findViewById(R.id.til_confirm_password);
        etUsername         = view.findViewById(R.id.et_username);
        etEmail            = view.findViewById(R.id.et_email);
        etPassword         = view.findViewById(R.id.et_password);
        etConfirmPassword  = view.findViewById(R.id.et_confirm_password);
        btnRegister        = view.findViewById(R.id.btn_register);
        btnGoLogin         = view.findViewById(R.id.btn_go_login);

        // ── Nút Đăng ký ───────────────────────────────────────────────────────
        if (btnRegister != null) {
            btnRegister.setOnClickListener(v -> attemptRegister(view));
        }

        // ── Nút Back (←) và link "Đã có tài khoản?" ──────────────────────────
        View btnBack = view.findViewById(R.id.btn_back);
        if (btnBack != null) {
            btnBack.setOnClickListener(v -> Navigation.findNavController(view).navigateUp());
        }
        if (btnGoLogin != null) {
            btnGoLogin.setOnClickListener(v -> Navigation.findNavController(view).navigateUp());
        }
    }

    // ─── Xử lý đăng ký ───────────────────────────────────────────────────────

    private void attemptRegister(View view) {
        clearErrors();

        String username = getText(etUsername);
        String email    = getText(etEmail);
        String password = getText(etPassword);
        String confirm  = getText(etConfirmPassword);

        // ── Validation cục bộ ─────────────────────────────────────────────────
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

        // ── Gọi API Backend ───────────────────────────────────────────────────
        setLoading(true);

        // displayName = username (layout không có field displayName riêng)
        String displayName = username;

        AuthApiService.register(getContext(), username, email, password, displayName,
                new ApiClient.ApiCallback() {
                    @Override
                    public void onSuccess(JSONObject json) {
                        setLoading(false);
                        boolean success = json.optBoolean("success", false);

                        if (success) {
                            try {
                                // Backend: { success: true, data: { token, user } }
                                JSONObject data     = json.getJSONObject("data");
                                String     token    = data.getString("token");
                                JSONObject userData = data.getJSONObject("user");

                                String userId   = userData.optString("id", userData.optString("_id", ""));
                                String uname    = userData.getString("username");
                                String dName    = userData.optString("displayName", uname);
                                String emailStr = userData.getString("email");
                                String role     = userData.optString("role", "user");
                                int    kch      = userData.optInt("kchBalance", 0);

                                // Tự đăng nhập — không cần quay lại màn login
                                UserSession.getInstance(requireContext())
                                        .login(token, userId, uname, dName, emailStr, role, kch);

                                Toast.makeText(getContext(),
                                        "Chào mừng " + dName + " đến với Iiawak! 🎉",
                                        Toast.LENGTH_LONG).show();

                                // Navigate vào màn hình chính
                                Navigation.findNavController(view)
                                        .navigate(R.id.action_register_to_main);

                            } catch (Exception e) {
                                Toast.makeText(getContext(),
                                        "Lỗi xử lý phản hồi: " + e.getMessage(),
                                        Toast.LENGTH_SHORT).show();
                            }
                        } else {
                            // Server trả success=false với thông báo lỗi cụ thể
                            String msg = json.optString("message", "Đăng ký không thành công");
                            Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
                        }
                    }

                    @Override
                    public void onError(String errorMessage, int statusCode) {
                        setLoading(false);
                        // 409 Conflict = email/username đã tồn tại
                        String display = (statusCode == 409)
                                ? "Email hoặc tên người dùng đã tồn tại"
                                : errorMessage;
                        Toast.makeText(getContext(), display, Toast.LENGTH_SHORT).show();
                    }
                });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String getText(TextInputEditText et) {
        return et != null && et.getText() != null ? et.getText().toString().trim() : "";
    }

    private void setError(TextInputLayout til, String msg) {
        if (til != null) til.setError(msg);
    }

    private void clearErrors() {
        if (tilUsername        != null) tilUsername.setError(null);
        if (tilEmail           != null) tilEmail.setError(null);
        if (tilPassword        != null) tilPassword.setError(null);
        if (tilConfirmPassword != null) tilConfirmPassword.setError(null);
    }

    private void setLoading(boolean loading) {
        if (btnRegister == null) return;
        btnRegister.setEnabled(!loading);
        btnRegister.setText(loading ? "Đang đăng ký..." : getString(R.string.btn_register));
        if (btnGoLogin != null) btnGoLogin.setEnabled(!loading);
    }
}
