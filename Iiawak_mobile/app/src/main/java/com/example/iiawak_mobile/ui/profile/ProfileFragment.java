package com.example.iiawak_mobile.ui.profile;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.config.NetworkConfig;
import com.example.iiawak_mobile.data.UserSession;
import de.hdodenhof.circleimageview.CircleImageView;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;

public class ProfileFragment extends Fragment {

    private CircleImageView profileAvatar;
    private TextView displayName, handle, freeHearts;
    private UserSession session;
    private Set<Integer> checkedDays = new HashSet<>();
    private int today;

    // Launcher chọn ảnh từ thư viện
    private final ActivityResultLauncher<Intent> imagePickerLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri imageUri = result.getData().getData();
                    if (imageUri != null && profileAvatar != null) {
                        profileAvatar.setImageURI(imageUri);
                        Toast.makeText(getContext(), "Ảnh đại diện đã cập nhật ✅", Toast.LENGTH_SHORT).show();
                    }
                }
            });

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        session = UserSession.getInstance(requireContext());

        // Bind views
        profileAvatar = view.findViewById(R.id.profile_avatar);
        displayName = view.findViewById(R.id.profile_display_name);
        handle = view.findViewById(R.id.profile_handle);
        freeHearts = view.findViewById(R.id.profile_free_hearts);

        // Điền thông tin người dùng
        loadUserData();

        // Bấm avatar → chọn ảnh
        View btnChangeAvatar = view.findViewById(R.id.btn_change_avatar);
        if (profileAvatar != null) profileAvatar.setOnClickListener(v -> openImagePicker());
        if (btnChangeAvatar != null) btnChangeAvatar.setOnClickListener(v -> openImagePicker());

        // Cài đặt
        View btnSettings = view.findViewById(R.id.btn_settings);
        if (btnSettings != null) {
            btnSettings.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(view)
                            .navigate(R.id.settingsFragment));
        }
        
        // Thông báo
        View btnNotifications = view.findViewById(R.id.btn_notifications);
        if (btnNotifications != null) {
            btnNotifications.setOnClickListener(v -> Toast.makeText(getContext(), "Thông báo", Toast.LENGTH_SHORT).show());
        }

        // Nhận kim cương hồng
        View btnGetDiamonds = view.findViewById(R.id.btn_get_diamonds);
        if (btnGetDiamonds != null) {
            btnGetDiamonds.setOnClickListener(v -> 
                androidx.navigation.Navigation.findNavController(view)
                    .navigate(R.id.storeFragment));
        }

        // Ví
        View walletCard = view.findViewById(R.id.wallet_card);
        if (walletCard != null) {
            walletCard.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(view)
                            .navigate(R.id.walletFragment));
        }
        
        // Nhân Vật
        View btnCharacters = view.findViewById(R.id.btn_characters);
        if (btnCharacters != null) {
            btnCharacters.setOnClickListener(v -> Toast.makeText(getContext(), "Tính năng Nhân Vật", Toast.LENGTH_SHORT).show());
        }
        
        // Bạn Bè
        View btnFriends = view.findViewById(R.id.btn_friends);
        if (btnFriends != null) {
            btnFriends.setOnClickListener(v -> Toast.makeText(getContext(), "Tính năng Bạn Bè", Toast.LENGTH_SHORT).show());
        }

        View btnGiftcode = view.findViewById(R.id.btn_giftcode);
        if (btnGiftcode != null) {
            btnGiftcode.setOnClickListener(v -> showGiftcodeDialog());
        }

        View btnInvite = view.findViewById(R.id.btn_invite_friends);
        if (btnInvite != null) {
            btnInvite.setOnClickListener(v -> Toast.makeText(getContext(), "Tính năng Mời bạn bè đang phát triển", Toast.LENGTH_SHORT).show());
        }

        View btnShare = view.findViewById(R.id.btn_share_rewards);
        if (btnShare != null) {
            btnShare.setOnClickListener(v -> Toast.makeText(getContext(), "Tính năng Chia sẻ nhận thưởng đang phát triển", Toast.LENGTH_SHORT).show());
        }

        // Setup lịch điểm danh
        fetchUserDataAndSetupCalendar(view);
    }

    private void loadUserData() {
        if (displayName != null) displayName.setText(session.getDisplayName());
        if (handle != null) handle.setText("@" + session.getUsername());
        if (freeHearts != null) freeHearts.setText(String.valueOf(session.getFreeHearts()));
    }

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        intent.setType("image/*");
        imagePickerLauncher.launch(intent);
    }

    private void fetchUserDataAndSetupCalendar(View view) {
        com.example.iiawak_mobile.data.remote.UserApiService.getProfile(getContext(), new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
            @Override
            public void onSuccess(org.json.JSONObject json) {
                if (json.optBoolean("success", false)) {
                    org.json.JSONObject data = json.optJSONObject("data");
                    if (data != null) {
                        session.setFreeHearts(data.optInt("kchBalance", session.getFreeHearts()));
                        org.json.JSONArray days = data.optJSONArray("checkedInDays");
                        checkedDays = new HashSet<>();
                        if (days != null) {
                            for (int i = 0; i < days.length(); i++) {
                                String d = days.optString(i);
                                String[] parts = d.split("-");
                                if (parts.length == 3) {
                                    checkedDays.add(Integer.parseInt(parts[2]));
                                }
                            }
                        }
                    }
                }
                loadUserData(); // Update UI with latest balance
                setupCalendarUI(view);
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                if (checkedDays == null) checkedDays = new HashSet<>();
                loadUserData();
                setupCalendarUI(view);
            }
        });
    }

    private void setupCalendarUI(View view) {
        RecyclerView calendarRecycler = view.findViewById(R.id.calendar_recycler);
        if (calendarRecycler == null) return;

        Calendar cal = Calendar.getInstance();
        today = cal.get(Calendar.DAY_OF_MONTH);
        cal.set(Calendar.DAY_OF_MONTH, 1);
        int totalDays = cal.getActualMaximum(Calendar.DAY_OF_MONTH);

        calendarRecycler.setLayoutManager(new androidx.recyclerview.widget.LinearLayoutManager(getContext(), androidx.recyclerview.widget.LinearLayoutManager.HORIZONTAL, false));
        calendarRecycler.setAdapter(new CalendarDayAdapter(totalDays, checkedDays, today, (day, reward) -> {
            // Gọi API điểm danh
            Calendar todayCal = Calendar.getInstance();
            String dateStr = String.format("%04d-%02d-%02d", todayCal.get(Calendar.YEAR), todayCal.get(Calendar.MONTH) + 1, day);
            
            com.example.iiawak_mobile.data.remote.UserApiService.checkIn(getContext(), dateStr, reward, new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
                @Override
                public void onSuccess(org.json.JSONObject json) {
                    if (json.optBoolean("success", false)) {
                        checkedDays.add(day);
                        session.addFreeHearts(reward);
                        if (freeHearts != null) freeHearts.setText(String.valueOf(session.getFreeHearts()));
                        Toast.makeText(getContext(), "Đã điểm danh! Nhận " + reward + " 💎", Toast.LENGTH_SHORT).show();
                        calendarRecycler.getAdapter().notifyDataSetChanged();
                    } else {
                        Toast.makeText(getContext(), json.optString("message", "Lỗi điểm danh"), Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onError(String errorMessage, int statusCode) {
                    Toast.makeText(getContext(), "Điểm danh lỗi: " + errorMessage, Toast.LENGTH_SHORT).show();
                }
            });
        }));
        calendarRecycler.scrollToPosition(Math.max(0, today - 3));
    }

    private void showGiftcodeDialog() {
        android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(getContext());
        builder.setTitle("Nhập Mã Quà Tặng");
        
        final android.widget.EditText input = new android.widget.EditText(getContext());
        input.setHint("Nhập mã tại đây");
        builder.setView(input);
        
        builder.setPositiveButton("Xác nhận", (dialog, which) -> {
            String code = input.getText().toString().trim();
            if (!code.isEmpty()) {
                redeemGiftcode(code);
            }
        });
        builder.setNegativeButton("Hủy", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    private void redeemGiftcode(String code) {
        String username = session.getUsername();
        if (username.isEmpty()) username = "demo_user"; // fallback for testing

        com.example.iiawak_mobile.data.remote.EconomyApiService.redeemGiftcode(getContext(), code, username, new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
            @Override
            public void onSuccess(org.json.JSONObject json) {
                final String msg = json.optString("message", "Đổi mã thành công");
                Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
                if (json.optBoolean("success", false)) {
                    session.setFreeHearts(json.optInt("newBalance", session.getFreeHearts()));
                    loadUserData();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                Toast.makeText(getContext(), "Lỗi đổi mã: " + errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
