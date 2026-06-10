package com.example.iiawak_mobile.ui.chat;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import java.util.ArrayList;
import java.util.List;

/** Tab 2: Chat với bạn bè (cần follow nhau) */
public class FriendChatTabFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_friend_chat_tab, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Mock: chưa có bạn bè → hiện empty state
        // Thay bằng API call khi có backend: lấy danh sách mutual follows
        boolean hasFriends = false; // TODO: check từ API

        RecyclerView friendRecycler = view.findViewById(R.id.friend_chat_recycler);
        View emptyState = view.findViewById(R.id.friend_empty_state);

        if (hasFriends) {
            // Hiện danh sách
            friendRecycler.setVisibility(View.VISIBLE);
            if (emptyState != null) emptyState.setVisibility(View.GONE);
            friendRecycler.setLayoutManager(new LinearLayoutManager(getContext()));
            // TODO: friendRecycler.setAdapter(friendChatAdapter);
        } else {
            // Hiện empty state
            friendRecycler.setVisibility(View.GONE);
            if (emptyState != null) emptyState.setVisibility(View.VISIBLE);
        }

        // Nút "Tìm người dùng" → Explore
        View btnFind = view.findViewById(R.id.btn_find_friends);
        if (btnFind != null) {
            btnFind.setOnClickListener(v -> {
                // Chuyển sang tab Khám phá
                if (getActivity() != null) {
                    com.google.android.material.bottomnavigation.BottomNavigationView nav =
                            getActivity().findViewById(R.id.bottom_nav);
                    if (nav != null) nav.setSelectedItemId(R.id.exploreFragment);
                }
            });
        }
    }
}
