package com.example.iiawak_mobile.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;
import com.bumptech.glide.Glide;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.remote.SocialApiService;
import com.example.iiawak_mobile.data.remote.UserApiService;
import com.example.iiawak_mobile.network.ApiClient;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.imageview.ShapeableImageView;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import org.json.JSONObject;

public class UserProfileFragment extends Fragment {

    private String userId;
    private ShapeableImageView imgAvatar;
    private TextView tvDisplayName, tvHandle, tvBio, tvFollowingCount, tvFollowersCount;
    private MaterialButton btnFollow, btnMessage;
    private ViewPager2 viewPager;
    private TabLayout tabLayout;
    private Toolbar toolbar;

    private boolean isFollowing = false;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            userId = getArguments().getString("userId");
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_user_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        imgAvatar = view.findViewById(R.id.user_avatar);
        tvDisplayName = view.findViewById(R.id.user_display_name);
        tvHandle = view.findViewById(R.id.user_handle);
        tvBio = view.findViewById(R.id.user_bio);
        tvFollowingCount = view.findViewById(R.id.tv_following_count);
        tvFollowersCount = view.findViewById(R.id.tv_followers_count);
        btnFollow = view.findViewById(R.id.btn_follow);
        btnMessage = view.findViewById(R.id.btn_message);
        viewPager = view.findViewById(R.id.user_viewpager);
        tabLayout = view.findViewById(R.id.user_tabs);
        toolbar = view.findViewById(R.id.toolbar);

        toolbar.setNavigationOnClickListener(v -> Navigation.findNavController(v).navigateUp());

        btnFollow.setOnClickListener(v -> toggleFollow());
        btnMessage.setOnClickListener(v -> openChat());

        loadUserProfile();
        setupViewPager();
    }

    private void loadUserProfile() {
        UserApiService.getUserPublicProfile(getContext(), userId, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                try {
                    JSONObject data = response.optJSONObject("data");
                    if (data != null) {
                        String name = data.optString("displayName", "Người dùng");
                        tvDisplayName.setText(name);
                        toolbar.setTitle(name);
                        tvHandle.setText("@" + data.optString("username", "user"));
                        tvBio.setText(data.optString("bio", "Chưa có tiểu sử"));
                        tvFollowingCount.setText(String.valueOf(data.optInt("following", 0)));
                        tvFollowersCount.setText(String.valueOf(data.optInt("followers", 0)));
                        
                        isFollowing = data.optBoolean("isFollowing", false);
                        updateFollowButton();

                        String avatar = data.optString("avatar", "");
                        if (!avatar.isEmpty()) {
                            Glide.with(UserProfileFragment.this).load(avatar).placeholder(R.drawable.ic_nav_profile).into(imgAvatar);
                        }
                    }
                } catch (Exception e) {
                    Toast.makeText(getContext(), "Lỗi tải thông tin", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                Toast.makeText(getContext(), "Lỗi: " + errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void updateFollowButton() {
        if (isFollowing) {
            btnFollow.setText("Đang theo dõi");
            btnFollow.setBackgroundTintList(android.content.res.ColorStateList.valueOf(getResources().getColor(R.color.bg_card_elevated, null)));
            btnFollow.setTextColor(getResources().getColor(R.color.text_tertiary, null));
        } else {
            btnFollow.setText("Theo dõi");
            btnFollow.setBackgroundTintList(android.content.res.ColorStateList.valueOf(getResources().getColor(R.color.brand_primary, null)));
            btnFollow.setTextColor(getResources().getColor(R.color.white, null));
        }
    }

    private void toggleFollow() {
        SocialApiService.toggleFollow(getContext(), userId, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                isFollowing = response.optBoolean("isFollowing", !isFollowing);
                updateFollowButton();
                // Tải lại để cập nhật số lượng follower
                loadUserProfile();
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                Toast.makeText(getContext(), errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void openChat() {
        Bundle args = new Bundle();
        args.putString("characterId", userId);
        args.putString("botName", tvDisplayName.getText().toString());
        args.putString("chatMode", "dm");
        Navigation.findNavController(requireView()).navigate(R.id.chatFragment, args);
    }

    private void setupViewPager() {
        viewPager.setAdapter(new FragmentStateAdapter(this) {
            @NonNull
            @Override
            public Fragment createFragment(int position) {
                if (position == 0) {
                    return UserPostsTabFragment.newInstance(userId);
                } else {
                    return UserCharactersTabFragment.newInstance(userId);
                }
            }

            @Override
            public int getItemCount() {
                return 2;
            }
        });

        new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
            tab.setText(position == 0 ? "Bài đăng" : "Nhân vật");
        }).attach();
    }
}
