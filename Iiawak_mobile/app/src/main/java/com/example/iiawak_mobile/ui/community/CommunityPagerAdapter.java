package com.example.iiawak_mobile.ui.community;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.adapter.FragmentStateAdapter;

public class CommunityPagerAdapter extends FragmentStateAdapter {

    public CommunityPagerAdapter(@NonNull Fragment fragment) {
        super(fragment);
    }

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        return FeedTabFragment.newInstance(position);
    }

    @Override
    public int getItemCount() {
        return 3; // Thịnh hành + Đang theo dõi + Bạn bè
    }
}
