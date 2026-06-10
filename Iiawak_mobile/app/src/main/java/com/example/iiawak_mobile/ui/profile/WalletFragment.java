package com.example.iiawak_mobile.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

public class WalletFragment extends Fragment {
    @Nullable @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        android.widget.LinearLayout layout = new android.widget.LinearLayout(getContext());
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setBackgroundColor(0xFF0D0A14);
        TextView tv = new TextView(getContext());
        tv.setText("💎 Ví Kim Cương Hồng\n\nKim Cương Hồng miễn phí: 85 💎\nKim Cương Hồng cao cấp: 65 💎\n\nTổng: 150 💎\n\n(Lịch sử giao dịch sẽ hiển thị ở đây)");
        tv.setTextColor(0xFFFFFFFF);
        tv.setTextSize(16f);
        tv.setGravity(android.view.Gravity.CENTER);
        layout.addView(tv);
        return layout;
    }
}
