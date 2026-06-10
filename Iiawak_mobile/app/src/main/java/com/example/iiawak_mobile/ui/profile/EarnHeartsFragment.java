package com.example.iiawak_mobile.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

public class EarnHeartsFragment extends Fragment {
    @Nullable @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        android.widget.LinearLayout layout = new android.widget.LinearLayout(getContext());
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setBackgroundColor(0xFF0D0A14);
        TextView tv = new TextView(getContext());
        tv.setText("💎 Nhận Kim Cương Hồng miễn phí\n\n✓ Điểm danh hàng ngày (+100 💎)\n▶ Xem quảng cáo (+5 💎)\n🎁 Nhập mã quà tặng\n🎮 Tham gia sự kiện cộng đồng");
        tv.setTextColor(0xFFE91E8C);
        tv.setTextSize(15f);
        tv.setGravity(android.view.Gravity.CENTER);
        layout.addView(tv);
        return layout;
    }
}
