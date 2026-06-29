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
import androidx.navigation.Navigation;
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
 * - GET /api/user/profile → { success, data: UserDTO }
 * - POST /api/user/checkin → { success, earnedKch, kchBalance }
 * - POST /api/economy/redeem-giftcode → { success, message, newBalance? }
 *
 * UserDTO: { id, username, email, displayName, avatar, bio, kchBalance, role,
 * isCreator, checkedInDays[], following[], followers[], createdAt }
 */
public class ProfileFragment extends Fragment {

    // ── Views ─────────────────────────────────────────────────────────────────
    private com.google.android.material.imageview.ShapeableImageView profileAvatar;
    private TextView tvDisplayName, tvHandle, tvFreeHearts;
    private TextView tvFollowing, tvFollowers, tvStreak, tvConquest;
    private RecyclerView calendarRecycler;
    private TextView tvLevel;

    private UserSession session;
    private final Set<Integer> checkedDays = new HashSet<>();
    private int today;
    private View rootView;
    private boolean isCheckingIn = false;

    // ── Image Picker ──────────────────────────────────────────────────────────
    private final ActivityResultLauncher<Intent> imagePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri imageUri = result.getData().getData();
                    if (imageUri != null && profileAvatar != null) {
                        profileAvatar.setImageURI(imageUri);
                        Toast.makeText(getContext(), "Ảnh đại diện đã thay đổi ✅", Toast.LENGTH_SHORT).show();
                    }
                }
            });

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        rootView = inflater.inflate(R.layout.fragment_profile, container, false);
        return rootView;
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        session = UserSession.getInstance(requireContext());

        // ── Bind views ────────────────────────────────────────────────────────
        profileAvatar = view.findViewById(R.id.profile_avatar);
        tvDisplayName = view.findViewById(R.id.profile_display_name);
        tvHandle = view.findViewById(R.id.profile_handle);
        tvFreeHearts = view.findViewById(R.id.profile_free_hearts);
        tvFollowing = view.findViewById(R.id.profile_following_count);
        tvFollowers = view.findViewById(R.id.profile_followers_count);
        tvStreak = view.findViewById(R.id.tv_streak_count);
        tvConquest = view.findViewById(R.id.profile_conquest_count);
        tvLevel = view.findViewById(R.id.profile_level);
        calendarRecycler = view.findViewById(R.id.calendar_recycler);

        // ── Tính ngày hôm nay trước khi setup calendar ────────────────────────
        today = Calendar.getInstance().get(Calendar.DAY_OF_MONTH);

        // ── Hiển thị dữ liệu từ session (offline first) ───────────────────────
        populateFromSession();

        // ── Setup lịch ngay với data session (không chờ API) ─────────────────
        setupCalendarUI();

        // ── Fetch dữ liệu mới nhất từ backend ────────────────────────────────
        fetchProfileFromBackend(view);

        // ── Sự kiện UI ───────────────────────────────────────────────────────
        setupClickListeners(view);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Update data when returning to this fragment
        populateFromSession();
    }

    // ─── Hiển thị dữ liệu từ UserSession (hiển thị ngay, không chờ API) ──────

    private void populateFromSession() {
        if (tvDisplayName != null)
            tvDisplayName.setText(session.getDisplayName());
        if (tvHandle != null)
            tvHandle.setText("@" + session.getUsername());
        if (tvFreeHearts != null)
            tvFreeHearts.setText(formatNumber(session.getKchBalance()));

        // Load offline checked days
        Set<String> offlineDays = session.getCheckedInDays();
        Calendar todayCal = Calendar.getInstance();
        int curYear = todayCal.get(Calendar.YEAR);
        int curMonth = todayCal.get(Calendar.MONTH) + 1;

        checkedDays.clear(); // Clear existing to avoid duplicates if re-populated
        for (String d : offlineDays) {
            // Robust parsing: extract YYYY-MM-DD
            String cleanDate = d.length() >= 10 ? d.substring(0, 10) : d;
            String[] parts = cleanDate.split("-");
            if (parts.length == 3) {
                try {
                    int y = Integer.parseInt(parts[0]);
                    int m = Integer.parseInt(parts[1]);
                    int day = Integer.parseInt(parts[2]);
                    if (y == curYear && m == curMonth) {
                        checkedDays.add(day);
                    }
                } catch (NumberFormatException ignored) {
                }
            }
        }

        if (tvStreak != null)
            tvStreak.setText(session.getCheckInStreak() + " ngày");
    }

    // ─── Fetch Profile từ backend & cập nhật toàn bộ UI ─────────────────────

    private void fetchProfileFromBackend(View view) {
        UserApiService.getProfile(getContext(), new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                if (!json.optBoolean("success", false))
                    return;

                JSONObject data = json.optJSONObject("data");
                if (data == null)
                    return;

                // ── Cập nhật session với dữ liệu mới nhất ────────────────────
                String displayName = data.optString("displayName", session.getDisplayName());
                String username = data.optString("username", session.getUsername());
                String avatarUrl = data.optString("avatar", "");
                int kchBalance = data.optInt("kchBalance", session.getKchBalance());
                int following = getArrayLength(data, "following");
                int followers = getArrayLength(data, "followers");
                int strikeCount = data.optInt("strikeCount", 0);

                session.updateDisplayName(displayName);
                session.setKchBalance(kchBalance);

                // ── Cập nhật giao diện ────────────────────────────────────────
                if (tvDisplayName != null)
                    tvDisplayName.setText(displayName);
                if (tvHandle != null)
                    tvHandle.setText("@" + username);
                if (tvFreeHearts != null)
                    tvFreeHearts.setText(formatNumber(kchBalance));
                if (tvFollowing != null)
                    tvFollowing.setText(formatNumber(following));
                if (tvFollowers != null)
                    tvFollowers.setText(formatNumber(followers));
                if (tvConquest != null)
                    tvConquest.setText(formatNumber(strikeCount));
                if (tvLevel != null)
                    tvLevel.setText("Lv." + (1 + strikeCount / 5) + " Người chơi");

                // ── Load avatar từ URL ────────────────────────────────────────
                if (profileAvatar != null && !avatarUrl.isEmpty()) {
                    loadAvatarFromUrl(avatarUrl);
                }

                // ── Parse danh sách ngày đã điểm danh ────────────────────────
                Set<String> allDaysSet = new HashSet<>(session.getCheckedInDays());
                JSONArray daysArr = data.optJSONArray("checkedInDays");
                if (daysArr != null) {
                    for (int i = 0; i < daysArr.length(); i++) {
                        allDaysSet.add(daysArr.optString(i));
                    }
                }
                session.setCheckedInDays(allDaysSet);

                // Update local list for UI from the session's streak
                String currentDate = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
                        .format(new java.util.Date());

                // Tính toán lại lastCheckIn và streak dựa trên backend data nếu có
                int currentStreak = session.getCheckInStreak();
                
                // Cập nhật checkedDays để vẽ UI dựa trên dữ liệu backend trả về
                checkedDays.clear();
                // Nếu backend trả về ngày hôm nay đã checkin, ta ép UI hiển thị đúng
                if (allDaysSet.contains(currentDate)) {
                    session.setLastCheckInDate(currentDate);
                    // Dùng currentStreak hoặc tối thiểu 1
                    int streakToDisplay = currentStreak > 0 ? currentStreak : 1;
                    for (int i = 1; i <= streakToDisplay; i++) {
                        checkedDays.add(i);
                    }
                } else {
                    // Chưa điểm danh hôm nay
                    for (int i = 1; i <= currentStreak; i++) {
                        checkedDays.add(i);
                    }
                }

                // ── Cập nhật streak badge ─────────────────────────────────────
                if (tvStreak != null) {
                    tvStreak.setText(session.getCheckInStreak() + " ngày");
                }

                // ── Refresh lịch điểm danh ────────────────────────────────────
                setupCalendarUI();
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                // Dữ liệu session đã được hiển thị trước đó — không cần làm gì thêm
            }
        });
    }

    // ─── Setup lịch điểm danh ────────────────────────────────────────────────

    private void setupCalendarUI() {
        if (calendarRecycler == null || getContext() == null)
            return;

        String currentDate = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
                .format(new java.util.Date());
        String lastCheckIn = session.getLastCheckInDate();
        int streak = session.getCheckInStreak();

        // Fix logic tính today cho CalendarDayAdapter
        if (session.getCheckedInDays().contains(currentDate)) {
            today = Math.max(1, streak); // đã điểm danh hôm nay
        } else {
            today = streak + 1; // chưa điểm danh, trỏ tới ngày tiếp theo
        }

        int totalDays = 7;

        calendarRecycler.setLayoutManager(
                new LinearLayoutManager(getContext(), LinearLayoutManager.HORIZONTAL, false));
        calendarRecycler.setAdapter(new CalendarDayAdapter(totalDays, checkedDays, today,
                (day, reward) -> performCheckIn(day, reward)));

        // Scroll tới ngày hôm nay
        int scrollPos = Math.max(0, today - 2);
        calendarRecycler.scrollToPosition(scrollPos);
    }

    // ─── Gọi API điểm danh ───────────────────────────────────────────────────

    private void performCheckIn(int day, int reward) {
        if (isCheckingIn)
            return;

        String currentDate = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
                .format(new java.util.Date());

        // Kiểm tra xem backend/session đã có ghi nhận điểm danh ngày hôm nay chưa
        if (session.getCheckedInDays().contains(currentDate)) {
            Toast.makeText(getContext(), "Bạn đã điểm danh hôm nay rồi! 📅", Toast.LENGTH_SHORT).show();
            return;
        }

        isCheckingIn = true;

        UserApiService.checkIn(getContext(), currentDate, reward, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                isCheckingIn = false;
                if (json.optBoolean("success", false)) {
                    int newBalance = json.optInt("kchBalance", session.getKchBalance() + reward);
                    int earned = json.optInt("earnedKch", reward);

                    session.setKchBalance(newBalance);
                    if (tvFreeHearts != null)
                        tvFreeHearts.setText(formatNumber(newBalance));

                    // Cập nhật local state & session cache
                    checkedDays.add(day);
                    session.addCheckedInDay(currentDate);

                    int newStreak = session.getCheckInStreak() + 1;
                    session.setCheckInStreak(newStreak);
                    session.setLastCheckInDate(currentDate);

                    // Thêm vào lịch sử giao dịch
                    String txDateStr = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                            java.util.Locale.US).format(new java.util.Date());
                    session.addTransaction("Điểm danh ngày " + newStreak, reward, txDateStr);

                    if (tvStreak != null)
                        tvStreak.setText(session.getCheckInStreak() + " ngày");

                    Toast.makeText(getContext(),
                            com.example.iiawak_mobile.utils.UIUtils.withDiamond(getContext(), " Điểm danh thành công! +" + earned + " 💎"), Toast.LENGTH_SHORT).show();

                    // Refresh adapter để hiển thị overlay đã điểm
                    if (calendarRecycler != null && calendarRecycler.getAdapter() != null) {
                        calendarRecycler.getAdapter().notifyDataSetChanged();
                    }
                } else {
                    String msg = json.optString("message", "Lỗi điểm danh");
                    Toast.makeText(getContext(), msg, Toast.LENGTH_SHORT).show();
                }
            }

            public void onError(String errorMessage, int statusCode) {
                isCheckingIn = false;
                if (statusCode == 0) {
                    // Lỗi mạng — thử offline mode
                    checkedDays.add(day);
                    session.addCheckedInDay(currentDate); // Lưu lại vào session để không bị click nhiều lần
                    session.addKch(reward);
                    if (tvFreeHearts != null)
                        tvFreeHearts.setText(formatNumber(session.getKchBalance()));
                    if (tvStreak != null)
                        tvStreak.setText(session.getCheckInStreak() + " ngày");
                    if (calendarRecycler != null && calendarRecycler.getAdapter() != null) {
                        calendarRecycler.getAdapter().notifyDataSetChanged();
                    }
                    Toast.makeText(getContext(), "⚠️ Điểm danh offline (sẽ đồng bộ khi có mạng)", Toast.LENGTH_SHORT)
                            .show();
                } else {
                    Toast.makeText(getContext(), "Lỗi: " + errorMessage, Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    // ─── Setup click listeners ────────────────────────────────────────────────

    private void setupClickListeners(View view) {
        // ── Avatar → chọn ảnh ────────────────────────────────────────────────
        if (profileAvatar != null) {
            profileAvatar.setOnClickListener(v -> openImagePicker());
        }

        // ── Cài đặt ──────────────────────────────────────────────────────────
        View btnSettings = view.findViewById(R.id.btn_settings);
        if (btnSettings != null) {
            btnSettings.setOnClickListener(v -> Navigation.findNavController(view)
                    .navigate(R.id.action_profile_to_settings));
        }

        // ── Thông báo ─────────────────────────────────────────────────────────
        View btnNotifications = view.findViewById(R.id.btn_notifications);
        if (btnNotifications != null) {
            btnNotifications.setOnClickListener(
                    v -> Toast.makeText(getContext(), " Thông báo đang phát triển", Toast.LENGTH_SHORT).show());
        }

        // ── Nạp kim cương (Nạp ngay) ─────────────────────────────────────────
        View btnGetDiamonds = view.findViewById(R.id.btn_get_diamonds);
        if (btnGetDiamonds != null) {
            btnGetDiamonds.setOnClickListener(v -> Navigation.findNavController(view)
                    .navigate(R.id.action_profile_to_store));
        }

        // ── Ví ───────────────────────────────────────────────────────────────
        View walletCard = view.findViewById(R.id.wallet_card);
        if (walletCard != null) {
            walletCard.setOnClickListener(v -> Navigation.findNavController(view)
                    .navigate(R.id.action_profile_to_wallet));
        }



        // ── Nhân Vật ─────────────────────────────────────────────────────────
        View btnCharacters = view.findViewById(R.id.btn_characters);
        if (btnCharacters != null) {
            btnCharacters.setOnClickListener(v -> Navigation.findNavController(view)
                    .navigate(R.id.action_profile_to_creator));
        }

        // ── Ví Nhà Sáng Tạo ──────────────────────────────────────────────────
        View btnCreatorWallet = view.findViewById(R.id.btn_creator_wallet);
        if (btnCreatorWallet != null) {
            btnCreatorWallet.setOnClickListener(v -> Navigation.findNavController(view)
                    .navigate(R.id.action_profile_to_creator));
        }

        // ── Bạn Bè ───────────────────────────────────────────────────────────
        View btnFriends = view.findViewById(R.id.btn_friends);
        if (btnFriends != null) {
            btnFriends.setOnClickListener(v -> Navigation.findNavController(view)
                    .navigate(R.id.action_profile_to_friends));
        }

        // ── Gift Code ─────────────────────────────────────────────────────────
        View btnGiftcode = view.findViewById(R.id.btn_giftcode);
        if (btnGiftcode != null) {
            btnGiftcode.setOnClickListener(v -> showGiftcodeDialog());
        }

        // ── Mời bạn bè ───────────────────────────────────────────────────────
        View btnInvite = view.findViewById(R.id.btn_invite_friends);
        if (btnInvite != null) {
            btnInvite.setOnClickListener(v -> shareInviteLink());
        }

        // ── Chia sẻ nhận thưởng ──────────────────────────────────────────────
        View btnShare = view.findViewById(R.id.btn_share_rewards);
        if (btnShare != null) {
            btnShare.setOnClickListener(v -> shareRewards());
        }

        // ── Quản lý bài viết ─────────────────────────────────────────────────
        View btnManagePosts = view.findViewById(R.id.btn_manage_posts);
        if (btnManagePosts != null) {
            btnManagePosts.setOnClickListener(v -> Navigation.findNavController(view)
                    .navigate(R.id.action_profile_to_manage_posts));
        }
    }

    // ─── Chọn ảnh từ thư viện ────────────────────────────────────────────────

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        intent.setType("image/*");
        imagePickerLauncher.launch(intent);
    }

    // ─── Mời bạn bè qua link ─────────────────────────────────────────────────

    private void shareInviteLink() {
        String username = session.getUsername();
        String displayName = session.getDisplayName();
        String shareText = "🎮 Tham gia Iiawak cùng mình!\n"
                + displayName + " (" + username + ") đang mời bạn chơi Iiawak — ứng dụng nhập vai AI thú vị nhất!\n\n"
                + " Tải ngay tại: https://iiawak.app/invite?ref=" + username + "\n"
                + " Nhập mã mời để nhận thêm Kim Cương Hồng miễn phí!";

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, shareText);
        intent.putExtra(Intent.EXTRA_SUBJECT, "Mời bạn chơi Iiawak!");
        startActivity(Intent.createChooser(intent, "Mời bạn bè qua..."));
    }

    // ─── Chia sẻ nhận thưởng ─────────────────────────────────────────────────

    private void shareRewards() {
        String displayName = session.getDisplayName();
        int balance = session.getKchBalance();
        String shareText = "💎 Mình đang có " + formatNumber(balance) + " Kim Cương Hồng trên Iiawak!\n\n"
                + displayName + " đang chơi Iiawak — ứng dụng nhập vai AI thú vị nhất!\n"
                + " Tải ngay: https://iiawak.app\n"
                + " Cùng mình điểm danh hàng ngày để nhận thưởng!";

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, shareText);
        intent.putExtra(Intent.EXTRA_SUBJECT, "Tham gia Iiawak nhận thưởng!");
        startActivity(Intent.createChooser(intent, "Chia sẻ qua..."));
    }

    // ─── Giftcode Dialog ─────────────────────────────────────────────────────

    private void showGiftcodeDialog() {
        android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(requireContext());
        builder.setTitle(" Nhập Mã Quà Tặng");

        final android.widget.EditText input = new android.widget.EditText(requireContext());
        input.setHint("Nhập mã tại đây...");
        input.setInputType(android.text.InputType.TYPE_CLASS_TEXT
                | android.text.InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS);
        int pad = (int) (16 * getResources().getDisplayMetrics().density);
        input.setPadding(pad, pad, pad, pad);
        builder.setView(input);

        builder.setPositiveButton("Xác nhận", (dialog, which) -> {
            String code = input.getText().toString().trim().toUpperCase();
            if (!code.isEmpty()) {
                redeemGiftcode(code);
            } else {
                Toast.makeText(getContext(), "Vui lòng nhập mã quà tặng", Toast.LENGTH_SHORT).show();
            }
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
                    int newBalance = json.optInt("newBalance", -1);
                    if (newBalance >= 0) {
                        session.setKchBalance(newBalance);
                        if (tvFreeHearts != null)
                            tvFreeHearts.setText(formatNumber(newBalance));
                    } else {
                        // Fallback: fetch lại profile để lấy balance chính xác
                        fetchProfileFromBackend(rootView);
                    }
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                Toast.makeText(getContext(), " Lỗi đổi mã: " + errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }

    // ─── Load avatar bằng Glide ─────────────────────────────────────────────

    private void loadAvatarFromUrl(String url) {
        if (profileAvatar != null && isAdded() && url != null && !url.isEmpty()) {
            Glide.with(this)
                    .load(url)
                    .placeholder(R.drawable.ic_nav_profile)
                    .error(R.drawable.ic_nav_profile)
                    .circleCrop()
                    .into(profileAvatar);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String formatNumber(int n) {
        return java.text.NumberFormat.getInstance(java.util.Locale.US).format(n);
    }

    private int getArrayLength(JSONObject obj, String key) {
        JSONArray arr = obj.optJSONArray(key);
        return arr != null ? arr.length() : 0;
    }
}
