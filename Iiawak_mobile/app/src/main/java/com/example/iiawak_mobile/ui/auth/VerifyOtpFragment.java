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

public class VerifyOtpFragment extends Fragment {

    private TextInputLayout tilOtp;
    private TextInputEditText etOtp;
    private MaterialButton btnVerify, btnResend;
    private android.widget.ImageButton btnBack;

    private String email = "";

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_verify_otp, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        if (getArguments() != null) {
            email = getArguments().getString("email", "");
        }

        tilOtp = view.findViewById(R.id.til_otp);
        etOtp = view.findViewById(R.id.et_otp);
        btnVerify = view.findViewById(R.id.btn_verify_otp);
        btnResend = view.findViewById(R.id.btn_resend_otp);
        btnBack = view.findViewById(R.id.btn_back);

        btnBack.setOnClickListener(v -> Navigation.findNavController(view).navigateUp());

        btnVerify.setOnClickListener(v -> verifyOtp(view));
        
        btnResend.setOnClickListener(v -> resendOtp(view));
    }

    private void verifyOtp(View view) {
        if (tilOtp != null) tilOtp.setError(null);

        String otp = etOtp != null && etOtp.getText() != null
                ? etOtp.getText().toString().trim() : "";

        if (TextUtils.isEmpty(otp)) {
            if (tilOtp != null) tilOtp.setError("Vui lòng nhập mã xác nhận");
            return;
        }
        if (otp.length() != 6) {
            if (tilOtp != null) tilOtp.setError("Mã xác nhận phải gồm 6 chữ số");
            return;
        }

        if (btnVerify != null) {
            btnVerify.setEnabled(false);
            btnVerify.setText("Đang xác nhận...");
        }

        com.example.iiawak_mobile.data.remote.AuthApiService.verifyResetOtp(getContext(), email, otp, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                if (getView() == null) return;

                boolean success = json.optBoolean("success", false);
                String message = json.optString("message", "");

                if (btnVerify != null) {
                    btnVerify.setEnabled(true);
                    btnVerify.setText("Xác nhận");
                }

                if (success) {
                    String resetToken = "";
                    JSONObject data = json.optJSONObject("data");
                    if (data != null) {
                        resetToken = data.optString("resetToken", "");
                    }
                    
                    Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
                    
                    Bundle bundle = new Bundle();
                    bundle.putString("email", email);
                    bundle.putString("resetToken", resetToken);
                    Navigation.findNavController(view).navigate(R.id.action_verify_otp_to_reset_password, bundle);
                } else {
                    if (tilOtp != null) tilOtp.setError(message);
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                if (getView() == null) return;

                if (btnVerify != null) {
                    btnVerify.setEnabled(true);
                    btnVerify.setText("Xác nhận");
                }
                if (tilOtp != null) tilOtp.setError(errorMessage);
            }
        });
    }

    private void resendOtp(View view) {
        if (btnResend != null) {
            btnResend.setEnabled(false);
        }
        
        com.example.iiawak_mobile.data.remote.AuthApiService.forgotPasswordOtp(getContext(), email, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                if (getView() == null) return;
                
                if (btnResend != null) btnResend.setEnabled(true);
                
                boolean success = json.optBoolean("success", false);
                String message = json.optString("message", "");
                
                Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                if (getView() == null) return;
                
                if (btnResend != null) btnResend.setEnabled(true);
                Toast.makeText(getContext(), errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
