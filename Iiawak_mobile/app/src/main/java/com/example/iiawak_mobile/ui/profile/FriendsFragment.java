package com.example.iiawak_mobile.ui.profile;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.remote.SocialApiService;
import com.example.iiawak_mobile.network.ApiClient;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.tabs.TabLayout;
import de.hdodenhof.circleimageview.CircleImageView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class FriendsFragment extends Fragment {

    private RecyclerView recyclerFriends;
    private ProgressBar progressBar;
    private TextView tvEmpty;
    private TabLayout tabLayout;
    private FriendsAdapter adapter;
    private List<FriendModel> friendList = new ArrayList<>();

    // 0: Following, 1: Followers, 2: Suggested
    private int currentTab = 0;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_friends, container, false);

        MaterialToolbar toolbar = view.findViewById(R.id.toolbar_friends);
        toolbar.setNavigationOnClickListener(v -> requireActivity().getOnBackPressedDispatcher().onBackPressed());

        recyclerFriends = view.findViewById(R.id.recycler_friends);
        progressBar = view.findViewById(R.id.progress_friends);
        tvEmpty = view.findViewById(R.id.tv_empty_friends);
        tabLayout = view.findViewById(R.id.tab_layout_friends);

        recyclerFriends.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new FriendsAdapter(friendList, this::onActionClick);
        recyclerFriends.setAdapter(adapter);

        tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                currentTab = tab.getPosition();
                loadFriendsData();
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {}

            @Override
            public void onTabReselected(TabLayout.Tab tab) {}
        });

        loadFriendsData();
        return view;
    }

    private void loadFriendsData() {
        progressBar.setVisibility(View.VISIBLE);
        recyclerFriends.setVisibility(View.GONE);
        tvEmpty.setVisibility(View.GONE);

        ApiClient.ApiCallback callback = new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject jsonResponse) {
                try {
                    if (jsonResponse.optBoolean("success", false)) {
                        JSONArray data = jsonResponse.optJSONArray("data");
                        friendList.clear();
                        if (data != null) {
                            for (int i = 0; i < data.length(); i++) {
                                JSONObject obj = data.getJSONObject(i);
                                friendList.add(new FriendModel(
                                        obj.optString("_id"),
                                        obj.optString("displayName", "Người dùng"),
                                        obj.optString("username", "user"),
                                        obj.optString("avatar", ""),
                                        currentTab == 0 // Theo dõi -> action Unfollow, else -> Follow
                                ));
                            }
                        }
                        adapter.notifyDataSetChanged();
                        
                        progressBar.setVisibility(View.GONE);
                        recyclerFriends.setVisibility(View.VISIBLE);
                        if (friendList.isEmpty()) {
                            tvEmpty.setVisibility(View.VISIBLE);
                        }
                    }
                } catch (Exception e) {
                    showError("Lỗi parse data: " + e.getMessage());
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                showError("Không thể tải danh sách: " + errorMessage);
                friendList.clear();
                adapter.notifyDataSetChanged();
                progressBar.setVisibility(View.GONE);
                tvEmpty.setVisibility(View.VISIBLE);
            }
        };

        if (currentTab == 0) {
            SocialApiService.getFollowing(getContext(), callback);
        } else if (currentTab == 1) {
            SocialApiService.getFollowers(getContext(), callback);
        } else {
            SocialApiService.getSuggestedFriends(getContext(), callback);
        }
    }

    private void onActionClick(FriendModel friend, int position) {
        SocialApiService.toggleFollow(getContext(), friend.id, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                if (response.optBoolean("success", false)) {
                    Toast.makeText(getContext(), "Đã thay đổi trạng thái", Toast.LENGTH_SHORT).show();
                    // Reload current tab to reflect changes
                    loadFriendsData();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                Toast.makeText(getContext(), "Lỗi: " + errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void showError(String msg) {
        new Handler(Looper.getMainLooper()).post(() -> Toast.makeText(getContext(), msg, Toast.LENGTH_SHORT).show());
    }

    // --- Models & Adapters ---
    
    static class FriendModel {
        String id, name, handle, avatar;
        boolean isFollowing;
        FriendModel(String id, String name, String handle, String avatar, boolean isFollowing) {
            this.id = id; this.name = name; this.handle = handle; this.avatar = avatar; this.isFollowing = isFollowing;
        }
    }

    interface OnActionClickListener {
        void onActionClick(FriendModel friend, int position);
    }

    class FriendsAdapter extends RecyclerView.Adapter<FriendsAdapter.ViewHolder> {
        private final List<FriendModel> list;
        private final OnActionClickListener listener;

        FriendsAdapter(List<FriendModel> list, OnActionClickListener listener) {
            this.list = list;
            this.listener = listener;
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_friend, parent, false);
            return new ViewHolder(v);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            FriendModel friend = list.get(position);
            holder.tvName.setText(friend.name);
            holder.tvHandle.setText("@" + friend.handle);
            
            if (friend.isFollowing) {
                holder.btnAction.setText("Đang theo dõi");
                holder.btnAction.setTextColor(getResources().getColor(R.color.text_tertiary, null));
                holder.btnAction.setStrokeColorResource(R.color.surface_divider);
            } else {
                holder.btnAction.setText("Theo dõi");
                holder.btnAction.setTextColor(getResources().getColor(R.color.brand_primary, null));
                holder.btnAction.setStrokeColorResource(R.color.brand_primary);
            }

            if (!friend.avatar.isEmpty()) {
                Glide.with(holder.itemView).load(friend.avatar).placeholder(R.drawable.ic_nav_profile).into(holder.imgAvatar);
            } else {
                holder.imgAvatar.setImageResource(R.drawable.ic_nav_profile);
            }

            holder.btnAction.setOnClickListener(v -> listener.onActionClick(friend, position));
        }

        @Override
        public int getItemCount() { return list.size(); }

        class ViewHolder extends RecyclerView.ViewHolder {
            CircleImageView imgAvatar;
            TextView tvName, tvHandle;
            MaterialButton btnAction;
            ViewHolder(View v) {
                super(v);
                imgAvatar = v.findViewById(R.id.img_friend_avatar);
                tvName = v.findViewById(R.id.tv_friend_name);
                tvHandle = v.findViewById(R.id.tv_friend_handle);
                btnAction = v.findViewById(R.id.btn_friend_action);
            }
        }
    }
}
