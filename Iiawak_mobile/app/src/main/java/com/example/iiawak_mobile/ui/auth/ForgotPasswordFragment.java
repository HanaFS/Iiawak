package com.example.iiawak_mobile.ui.auth;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import com.example.iiawak_mobile.R;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

public class ForgotPasswordFragment extends Fragment {

    private TextInputLayout tilEmail;
    private TextInputEditText etEmail;
    private MaterialButton btnSend, btnBack;
    private View successCard;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_forgot_password, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        tilEmail = view.findViewById(R.id.til_email);
        etEmail = view.findViewById(R.id.et_email);
        btnSend = view.findViewById(R.id.btn_send_reset);
        btnBack = view.findViewById(R.id.btn_back);
        successCard = view.findViewById(R.id.success_card);

        btnBack.setOnClickListener(v ->
                Navigation.findNavController(view).navigateUp());

        btnSend.setOnClickListener(v -> sendReset(view));
    }

    private void sendReset(View view) {
        if (tilEmail != null) tilEmail.setError(null);

        String email = etEmail != null && etEmail.getText() != null
                ? etEmail.getText().toString().trim() : "";

        if (TextUtils.isEmpty(email)) {
            if (tilEmail != null) tilEmail.setError("Vui lòng nhập email");
            return;
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            if (tilEmail != null) tilEmail.setError("Email không hợp lệ");
            return;
        }

        // Loading state
        if (btnSend != null) {
            btnSend.setEnabled(false);
            btnSend.setText("Đang gửi...");
        }

        // Mock API call
        view.postDelayed(() -> {
            if (getView() == null) return;

            if (btnSend != null) {
                btnSend.setEnabled(true);
                btnSend.setText("Gửi lại");
            }

            // Show success card
            if (successCard != null) {
                successCard.setVisibility(View.VISIBLE);
                successCard.setAlpha(0f);
                successCard.animate().alpha(1f).setDuration(400).start();
            }
        }, 1500);
    }
}
