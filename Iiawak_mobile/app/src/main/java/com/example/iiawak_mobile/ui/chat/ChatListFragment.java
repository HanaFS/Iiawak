package com.example.iiawak_mobile.ui.chat;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;
import com.example.iiawak_mobile.R;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

/** ChatListFragment — 2 tab: Nhân vật AI | Bạn bè */
public class ChatListFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_chat_list, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        ViewPager2 viewPager = view.findViewById(R.id.chat_viewpager);
        TabLayout tabLayout = view.findViewById(R.id.chat_tabs);

        viewPager.setAdapter(new ChatPagerAdapter(this));

        new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
            switch (position) {
                case 0: tab.setText("🤖 Nhân vật"); break;
                case 1: tab.setText("👥 Bạn bè"); break;
            }
        }).attach();

        View fabCreate = view.findViewById(R.id.fab_create_character);
        if (fabCreate != null) {
            fabCreate.setOnClickListener(v -> androidx.navigation.Navigation.findNavController(v).navigate(R.id.createCharacterFragment));
        }
    }

    /** Pager adapter cho 2 tab chat */
    private static class ChatPagerAdapter extends FragmentStateAdapter {

        ChatPagerAdapter(Fragment fragment) {
            super(fragment);
        }

        @NonNull
        @Override
        public Fragment createFragment(int position) {
            return position == 0 ? new BotChatTabFragment() : new FriendChatTabFragment();
        }

        @Override
        public int getItemCount() {
            return 2;
        }
    }
}
