package com.example.iiawak_mobile.ui.community;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.widget.ViewPager2;
import com.example.iiawak_mobile.R;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

public class CommunityFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_community, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        ViewPager2 viewPager = view.findViewById(R.id.community_viewpager);
        TabLayout tabLayout = view.findViewById(R.id.community_tabs);

        // Setup ViewPager2 with adapter
        CommunityPagerAdapter pagerAdapter = new CommunityPagerAdapter(this);
        viewPager.setAdapter(pagerAdapter);

        // Link TabLayout with ViewPager2
        new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
            if (position == 0) {
                tab.setText("🔥 Thịnh hành");
            } else {
                tab.setText("💫 Đang theo dõi");
            }
        }).attach();

        // Hearts balance display
        View heartsCard = view.findViewById(R.id.hearts_balance_card);
        if (heartsCard != null) {
            heartsCard.setOnClickListener(v -> {
                // Navigate to wallet
                androidx.navigation.Navigation.findNavController(view)
                        .navigate(R.id.walletFragment);
            });
        }
    }
}
