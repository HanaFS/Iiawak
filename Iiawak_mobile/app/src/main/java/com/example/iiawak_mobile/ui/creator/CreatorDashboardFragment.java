package com.example.iiawak_mobile.ui.creator;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.example.iiawak_mobile.R;

public class CreatorDashboardFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_creator_dashboard, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Back button
        View btnBack = view.findViewById(R.id.btn_back);
        if (btnBack != null) {
            btnBack.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(v).navigateUp());
        }

        // Create character button
        View btnCreate = view.findViewById(R.id.btn_create_character);
        if (btnCreate != null) {
            btnCreate.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(v)
                            .navigate(R.id.action_creator_to_create_character));
        }

        // Withdraw button
        View btnWithdraw = view.findViewById(R.id.btn_withdraw);
        if (btnWithdraw != null) {
            btnWithdraw.setOnClickListener(v -> {
                int amount = com.example.iiawak_mobile.data.UserSession.getInstance(requireContext()).getCreatorBalance();

                if (amount > 0) {
                    com.example.iiawak_mobile.data.UserSession.getInstance(requireContext()).addKch(amount);
                    com.example.iiawak_mobile.data.UserSession.getInstance(requireContext()).setCreatorBalance(0);
                    
                    String dateStr = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(new java.util.Date());
                    com.example.iiawak_mobile.data.UserSession.getInstance(requireContext()).addTransaction("Rút tiền từ Ví Sáng Tạo", amount, dateStr);
                    
                    android.widget.TextView tvReward = getView() != null ? getView().findViewById(R.id.tv_reward_amount) : null;
                    if (tvReward != null) {
                        tvReward.setText("0");
                    }
                    
                    android.widget.Toast.makeText(getContext(),
                            com.example.iiawak_mobile.utils.UIUtils.withDiamond(getContext(), "Rút " + java.text.NumberFormat.getInstance(java.util.Locale.US).format(amount) + " 💎 về ví chính thành công! 🎉"),
                            android.widget.Toast.LENGTH_SHORT).show();
                } else {
                    android.widget.Toast.makeText(getContext(),
                            "Bạn không có kim cương để rút!",
                            android.widget.Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getView() != null) {
            android.widget.TextView tvReward = getView().findViewById(R.id.tv_reward_amount);
            if (tvReward != null) {
                int creatorBalance = com.example.iiawak_mobile.data.UserSession.getInstance(requireContext()).getCreatorBalance();
                tvReward.setText(java.text.NumberFormat.getInstance(java.util.Locale.US).format(creatorBalance));
            }
        }
    }
}
