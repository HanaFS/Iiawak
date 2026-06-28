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
            switch (position) {
                case 0:
                    tab.setText("Thịnh hành");
                    break;
                case 1:
                    tab.setText("Theo dõi");
                    break;
                case 2:
                    tab.setText("Bạn bè");
                    break;
            }
        }).attach();

        // Hearts balance display
        View heartsCard = view.findViewById(R.id.hearts_balance_card);
        android.widget.TextView tvHeartsCount = view.findViewById(R.id.tv_hearts_count);
        if (tvHeartsCount != null) {
            com.example.iiawak_mobile.data.UserSession session = com.example.iiawak_mobile.data.UserSession.getInstance(requireContext());
            tvHeartsCount.setText(java.text.NumberFormat.getInstance(java.util.Locale.US).format(session.getKchBalance()));
        }
        
        if (heartsCard != null) {
            heartsCard.setOnClickListener(v -> {
                // Navigate to wallet
                androidx.navigation.Navigation.findNavController(view)
                        .navigate(R.id.walletFragment);
            });
        }
        
        // Setup FAB "Tạo bài viết"
        View fabCreatePost = view.findViewById(R.id.fab_create_post);
        if (fabCreatePost != null) {
            fabCreatePost.setOnClickListener(v -> {
                androidx.navigation.Navigation.findNavController(view)
                        .navigate(R.id.action_community_to_create_post);
            });
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getView() != null) {
            android.widget.TextView tvHeartsCount = getView().findViewById(R.id.tv_hearts_count);
            if (tvHeartsCount != null) {
                com.example.iiawak_mobile.data.UserSession session = com.example.iiawak_mobile.data.UserSession.getInstance(requireContext());
                tvHeartsCount.setText(java.text.NumberFormat.getInstance(java.util.Locale.US).format(session.getKchBalance()));
            }
        }
    }
}
