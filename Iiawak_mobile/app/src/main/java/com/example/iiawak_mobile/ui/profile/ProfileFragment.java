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
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.UserSession;
import com.example.iiawak_mobile.data.remote.EconomyApiService;
import com.example.iiawak_mobile.data.remote.UserApiService;
import com.example.iiawak_mobile.network.ApiClient;
import de.hdodenhof.circleimageview.CircleImageView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;

/**
 * ProfileFragment — Trang cá nhân của người dùng.
 *
 * Dữ liệu từ backend:
 *  - GET /api/user/profile  → { success, data: UserDTO }
 *  - POST /api/user/checkin → { success, earnedKch, kchBalance }
 *  - POST /api/economy/redeem-giftcode → { success, message, newBalance? }
 *
 * UserDTO: { id, username, email, displayName, avatar, bio, kchBalance, role,
 *            isCreator, checkedInDays[], following[], followers[], createdAt }
 */
public class ProfileFragment extends Fragment {

    // ── Views ─────────────────────────────────────────────────────────────────
    private CircleImageView profileAvatar;
    private TextView        tvDisplayName, tvHandle, tvFreeHearts;
    private TextView        tvFollowing, tvFollowers, tvStreak;
    private RecyclerView    calendarRecycler;

    private UserSession session;
    private Set<Integer> checkedDays = new HashSet<>();
    private int today;

    // ── Image Picker ──────────────────────────────────────────────────────────
    private final ActivityResultLauncher<Intent> imagePickerLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri imageUri = result.getData().getData();
                    if (imageUri != null && profileAvatar != null) {
                        profileAvatar.setImageURI(imageUri);
                        // TODO: upload avatar lên server (T-08 hoặc tính năng sau)
                        Toast.makeText(getContext(), "Ảnh đại diện đã thay đổi ✅", Toast.LENGTH_SHORT).show();
                    }
                }
            });

    // ── Lifecycle ─────────────────────────────────────────────────────────────

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

        // ── Bind views ────────────────────────────────────────────────────────
        profileAvatar    = view.findViewById(R.id.profile_avatar);
        tvDisplayName    = view.findViewById(R.id.profile_display_name);
        tvHandle         = view.findViewById(R.id.profile_handle);
        tvFreeHearts     = view.findViewById(R.id.profile_free_hearts);
        tvFollowing      = view.findViewById(R.id.profile_following_count);
        tvFollowers      = view.findViewById(R.id.profile_followers_count);
        tvStreak         = view.findViewById(R.id.tv_streak_count);
        calendarRecycler = view.findViewById(R.id.calendar_recycler);

        // ── Hiển thị dữ liệu từ session (offline first) ───────────────────────
        populateFromSession();

        // ── Fetch dữ liệu mới nhất từ backend ────────────────────────────────
        fetchProfileFromBackend(view);

        // ── Sự kiện UI ───────────────────────────────────────────────────────
        setupClickListeners(view);
    }

    // ─── Hiển thị dữ liệu từ UserSession (hiển thị ngay, không chờ API) ──────

    private void populateFromSession() {
        if (tvDisplayName != null) tvDisplayName.setText(session.getDisplayName());
        if (tvHandle      != null) tvHandle.setText("@" + session.getUsername());
        if (tvFreeHearts  != null) tvFreeHearts.setText(formatNumber(session.getKchBalance()));
    }

    // ─── Fetch Profile từ backend & cập nhật toàn bộ UI ─────────────────────

    private void fetchProfileFromBackend(View view) {
        UserApiService.getProfile(getContext(), new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                if (!json.optBoolean("success", false)) return;

                JSONObject data = json.optJSONObject("data");
                if (data == null) return;

                // ── Cập nhật session với dữ liệu mới nhất ────────────────────
                String displayName = data.optString("displayName", session.getDisplayName());
                String username    = data.optString("username",    session.getUsername());
                String avatarUrl   = data.optString("avatar",      "");
                int    kchBalance  = data.optInt("kchBalance",     session.getKchBalance());
                int    following   = getArrayLength(data, "following");
                int    followers   = getArrayLength(data, "followers");

                session.updateDisplayName(displayName);
                session.setKchBalance(kchBalance);

                // ── Cập nhật giao diện ────────────────────────────────────────
                if (tvDisplayName != null) tvDisplayName.setText(displayName);
                if (tvHandle      != null) tvHandle.setText("@" + username);
                if (tvFreeHearts  != null) tvFreeHearts.setText(formatNumber(kchBalance));
                if (tvFollowing   != null) tvFollowing.setText(formatNumber(following));
                if (tvFollowers   != null) tvFollowers.setText(formatNumber(followers));

                // ── Load avatar từ URL ────────────────────────────────────────
                if (profileAvatar != null && !avatarUrl.isEmpty()) {
                    loadAvatarFromUrl(avatarUrl);
                }

                // ── Lấy danh sách ngày đã điểm danh ──────────────────────────
                checkedDays = new HashSet<>();
                JSONArray days = data.optJSONArray("checkedInDays");
                int streakCount = 0;
                if (days != null) {
                    Calendar todayCal = Calendar.getInstance();
                    int curYear  = todayCal.get(Calendar.YEAR);
                    int curMonth = todayCal.get(Calendar.MONTH) + 1;

                    for (int i = 0; i < days.length(); i++) {
                        String d = days.optString(i); // "2026-06-11"
                        String[] parts = d.split("-");
                        if (parts.length == 3) {
                            try {
                                int y = Integer.parseInt(parts[0]);
                                int m = Integer.parseInt(parts[1]);
                                int day = Integer.parseInt(parts[2]);
                                if (y == curYear && m == curMonth) {
                                    checkedDays.add(day);
                                    if (day == todayCal.get(Calendar.DAY_OF_MONTH)) {
                                        streakCount++; // đơn giản, sẽ cải thiện sau
                                    }
                                }
                            } catch (NumberFormatException ignored) {}
                        }
                    }
                    streakCount = checkedDays.size(); // số ngày đã điểm trong tháng
                }

                // ── Cập nhật streak badge ─────────────────────────────────────
                final int finalStreak = streakCount;
                if (tvStreak != null) {
                    tvStreak.setText(finalStreak + " ngày 🔥");
                }

                // ── Setup lịch điểm danh ──────────────────────────────────────
                setupCalendarUI();
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                // Dùng dữ liệu từ session (đã set ở populateFromSession)
                setupCalendarUI();
            }
        });
    }

    // ─── Setup lịch điểm danh ────────────────────────────────────────────────

    private void setupCalendarUI() {
        if (calendarRecycler == null) return;

        Calendar cal = Calendar.getInstance();
        today = cal.get(Calendar.DAY_OF_MONTH);
        int totalDays = cal.getActualMaximum(Calendar.DAY_OF_MONTH);

        calendarRecycler.setLayoutManager(
                new LinearLayoutManager(getContext(), LinearLayoutManager.HORIZONTAL, false));
        calendarRecycler.setAdapter(new CalendarDayAdapter(totalDays, checkedDays, today,
                (day, reward) -> performCheckIn(day, reward)));
        calendarRecycler.scrollToPosition(Math.max(0, today - 3));
    }

    // ─── Gọi API điểm danh ───────────────────────────────────────────────────

    private void performCheckIn(int day, int reward) {
        Calendar todayCal = Calendar.getInstance();
        String dateStr = String.format("%04d-%02d-%02d",
                todayCal.get(Calendar.YEAR),
                todayCal.get(Calendar.MONTH) + 1,
                day);

        UserApiService.checkIn(getContext(), dateStr, reward, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                if (json.optBoolean("success", false)) {
                    // Backend trả: { success, earnedKch, kchBalance }
                    int newBalance = json.optInt("kchBalance", session.getKchBalance() + reward);
                    int earned     = json.optInt("earnedKch", reward);

                    session.setKchBalance(newBalance);
                    if (tvFreeHearts != null) tvFreeHearts.setText(formatNumber(newBalance));

                    checkedDays.add(day);
                    if (tvStreak != null) tvStreak.setText(checkedDays.size() + " ngày 🔥");

                    Toast.makeText(getContext(),
                            "Điểm danh thành công! +" + earned + " 💎", Toast.LENGTH_SHORT).show();

                    if (calendarRecycler != null && calendarRecycler.getAdapter() != null) {
                        calendarRecycler.getAdapter().notifyDataSetChanged();
                    }
                } else {
                    String msg = json.optString("message", "Lỗi điểm danh");
                    Toast.makeText(getContext(), msg, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                Toast.makeText(getContext(), "Điểm danh lỗi: " + errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }

    // ─── Setup click listeners ────────────────────────────────────────────────

    private void setupClickListeners(View view) {
        // Avatar → chọn ảnh
        if (profileAvatar != null) profileAvatar.setOnClickListener(v -> openImagePicker());
        View btnChangeAvatar = view.findViewById(R.id.btn_change_avatar);
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
            btnNotifications.setOnClickListener(v ->
                    Toast.makeText(getContext(), "Thông báo đang phát triển", Toast.LENGTH_SHORT).show());
        }

        // Nạp kim cương
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

        // Nhân Vật của tôi
        View btnCharacters = view.findViewById(R.id.btn_characters);
        if (btnCharacters != null) {
            btnCharacters.setOnClickListener(v ->
                    Toast.makeText(getContext(), "Tính năng Nhân Vật đang phát triển", Toast.LENGTH_SHORT).show());
        }

        // Bạn Bè
        View btnFriends = view.findViewById(R.id.btn_friends);
        if (btnFriends != null) {
            btnFriends.setOnClickListener(v ->
                    Toast.makeText(getContext(), "Tính năng Bạn Bè đang phát triển", Toast.LENGTH_SHORT).show());
        }

        // Gift Code
        View btnGiftcode = view.findViewById(R.id.btn_giftcode);
        if (btnGiftcode != null) {
            btnGiftcode.setOnClickListener(v -> showGiftcodeDialog());
        }

        // Mời bạn bè
        View btnInvite = view.findViewById(R.id.btn_invite_friends);
        if (btnInvite != null) {
            btnInvite.setOnClickListener(v ->
                    Toast.makeText(getContext(), "Tính năng Mời bạn bè đang phát triển", Toast.LENGTH_SHORT).show());
        }

        // Chia sẻ nhận thưởng
        View btnShare = view.findViewById(R.id.btn_share_rewards);
        if (btnShare != null) {
            btnShare.setOnClickListener(v ->
                    Toast.makeText(getContext(), "Tính năng Chia sẻ nhận thưởng đang phát triển", Toast.LENGTH_SHORT).show());
        }
    }

    // ─── Chọn ảnh từ thư viện ────────────────────────────────────────────────

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        intent.setType("image/*");
        imagePickerLauncher.launch(intent);
    }

    // ─── Giftcode Dialog ─────────────────────────────────────────────────────

    private void showGiftcodeDialog() {
        android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(requireContext());
        builder.setTitle("🎁 Nhập Mã Quà Tặng");

        final android.widget.EditText input = new android.widget.EditText(requireContext());
        input.setHint("Nhập mã tại đây...");
        int pad = (int)(16 * getResources().getDisplayMetrics().density);
        builder.setView(input);
        input.setPadding(pad, pad, pad, pad);

        builder.setPositiveButton("Xác nhận", (dialog, which) -> {
            String code = input.getText().toString().trim();
            if (!code.isEmpty()) redeemGiftcode(code);
        });
        builder.setNegativeButton("Hủy", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    private void redeemGiftcode(String code) {
        String username = session.getUsername();
        EconomyApiService.redeemGiftcode(getContext(), code, username, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                String msg = json.optString("message", "Đổi mã thành công");
                Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();

                if (json.optBoolean("success", false)) {
                    // Backend có thể trả newBalance hoặc không
                    int newBalance = json.optInt("newBalance", -1);
                    if (newBalance >= 0) {
                        session.setKchBalance(newBalance);
                        if (tvFreeHearts != null) tvFreeHearts.setText(formatNumber(newBalance));
                    } else {
                        // Fallback: fetch lại profile để lấy balance chính xác
                        fetchProfileFromBackend(getView());
                    }
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                Toast.makeText(getContext(), "Lỗi đổi mã: " + errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }

    // ─── Load avatar bằng Glide ─────────────────────────────────────────────

    private void loadAvatarFromUrl(String url) {
        if (profileAvatar != null && url != null && !url.isEmpty()) {
            Glide.with(this)
                    .load(url)
                    .placeholder(R.drawable.ic_nav_profile)
                    .into(profileAvatar);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String formatNumber(int n) {
        if (n >= 1_000_000) return String.format("%.1fM", n / 1_000_000f);
        if (n >= 1_000)     return String.format("%.1fK", n / 1_000f);
        return String.valueOf(n);
    }

    private int getArrayLength(JSONObject obj, String key) {
        JSONArray arr = obj.optJSONArray(key);
        return arr != null ? arr.length() : 0;
    }
}
