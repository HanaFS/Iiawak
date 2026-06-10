package com.example.iiawak_mobile.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.UserSession;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;

public class AppLockFragment extends Fragment {

    private String currentPin = "";
    private String firstInputPin = "";
    private boolean isConfirming = false;
    private UserSession session;
    
    private final List<View> pinDots = new ArrayList<>();
    private TextView tvInstruction;
    private MaterialButton btnDisable;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_app_lock, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        session = UserSession.getInstance(requireContext());

        // Bind dots
        pinDots.clear();
        pinDots.add(view.findViewById(R.id.pin_dot_1));
        pinDots.add(view.findViewById(R.id.pin_dot_2));
        pinDots.add(view.findViewById(R.id.pin_dot_3));
        pinDots.add(view.findViewById(R.id.pin_dot_4));

        tvInstruction = view.findViewById(R.id.tv_lock_instruction);
        btnDisable = view.findViewById(R.id.btn_disable_lock);

        // Setup UI based on state
        if (session.isAppLockEnabled()) {
            tvInstruction.setText(R.string.lock_enter_current);
            btnDisable.setVisibility(View.VISIBLE);
        } else {
            tvInstruction.setText(R.string.lock_set_pin);
            btnDisable.setVisibility(View.GONE);
        }

        // Setup keypad
        setupKeypad(view);

        // Back button
        view.findViewById(R.id.btn_back_lock).setOnClickListener(v -> Navigation.findNavController(view).navigateUp());

        // Disable lock button
        btnDisable.setOnClickListener(v -> {
            session.setAppLockEnabled(false);
            session.setAppLockPin("");
            Toast.makeText(getContext(), R.string.lock_disabled, Toast.LENGTH_SHORT).show();
            Navigation.findNavController(view).navigateUp();
        });
    }

    private void setupKeypad(View view) {
        int[] ids = {
            R.id.btn_key_0, R.id.btn_key_1, R.id.btn_key_2, R.id.btn_key_3,
            R.id.btn_key_4, R.id.btn_key_5, R.id.btn_key_6, R.id.btn_key_7,
            R.id.btn_key_8, R.id.btn_key_9
        };

        for (int id : ids) {
            MaterialButton btn = view.findViewById(id);
            btn.setOnClickListener(v -> onKeyClick(btn.getText().toString()));
        }

        view.findViewById(R.id.btn_key_clear).setOnClickListener(v -> {
            currentPin = "";
            updateDots();
        });

        view.findViewById(R.id.btn_key_del).setOnClickListener(v -> {
            if (!currentPin.isEmpty()) {
                currentPin = currentPin.substring(0, currentPin.length() - 1);
                updateDots();
            }
        });
    }

    private void onKeyClick(String key) {
        if (currentPin.length() < 4) {
            currentPin += key;
            updateDots();
            
            if (currentPin.length() == 4) {
                processPin();
            }
        }
    }

    private void processPin() {
        if (session.isAppLockEnabled() && !isConfirming) {
            // Verify existing PIN
            if (currentPin.equals(session.getAppLockPin())) {
                Toast.makeText(getContext(), R.string.lock_verified, Toast.LENGTH_SHORT).show();
                // Entering correct PIN allows changing it
                session.setAppLockEnabled(false); 
                currentPin = "";
                firstInputPin = "";
                isConfirming = false;
                tvInstruction.setText(R.string.lock_enter_new);
                btnDisable.setVisibility(View.GONE);
                updateDots();
            } else {
                Toast.makeText(getContext(), R.string.lock_incorrect, Toast.LENGTH_SHORT).show();
                currentPin = "";
                updateDots();
            }
        } else {
            // Setting new PIN
            if (!isConfirming) {
                firstInputPin = currentPin;
                currentPin = "";
                isConfirming = true;
                tvInstruction.setText(R.string.lock_confirm_pin);
                updateDots();
            } else {
                if (currentPin.equals(firstInputPin)) {
                    session.setAppLockPin(currentPin);
                    session.setAppLockEnabled(true);
                    Toast.makeText(getContext(), R.string.lock_success, Toast.LENGTH_SHORT).show();
                    View v = getView();
                    if (v != null) Navigation.findNavController(v).navigateUp();
                } else {
                    Toast.makeText(getContext(), R.string.lock_mismatch, Toast.LENGTH_SHORT).show();
                    currentPin = "";
                    updateDots();
                }
            }
        }
    }

    private void updateDots() {
        for (int i = 0; i < pinDots.size(); i++) {
            if (i < currentPin.length()) {
                pinDots.get(i).setAlpha(1.0f);
            } else {
                pinDots.get(i).setAlpha(0.3f);
            }
        }
    }
}
