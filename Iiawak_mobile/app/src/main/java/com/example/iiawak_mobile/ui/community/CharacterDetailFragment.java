package com.example.iiawak_mobile.ui.community;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.bumptech.glide.Glide;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.remote.CharacterApiService;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * CharacterDetailFragment — Màn hình chi tiết nhân vật.
 * Nhận characterId qua Bundle và fetch dữ liệu thực từ GET /api/characters/:id.
 */
public class CharacterDetailFragment extends Fragment {

    private TextView tvName, tvSlogan, tvGender, tvBio, tvPersonality,
                     tvStatus, tvTotalChats, tvCreator, tvOpeningLine;
    private de.hdodenhof.circleimageview.CircleImageView ivAvatar;
    private View     btnChatNormal, btnChatStory;
    private String   characterId;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_character_detail, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Lấy characterId từ arguments
        if (getArguments() != null) {
            characterId = getArguments().getString("characterId");
        }

        // Bind views
        tvName         = view.findViewById(R.id.detail_char_name);
        tvSlogan       = view.findViewById(R.id.detail_char_slogan);
        tvGender       = view.findViewById(R.id.detail_char_gender);
        tvBio          = view.findViewById(R.id.detail_char_bio);
        tvPersonality  = view.findViewById(R.id.detail_char_personality);
        tvStatus       = view.findViewById(R.id.detail_char_status);
        tvTotalChats   = view.findViewById(R.id.detail_total_chats);
        tvCreator      = view.findViewById(R.id.detail_creator_name);
        tvOpeningLine  = view.findViewById(R.id.detail_opening_line);
        ivAvatar       = view.findViewById(R.id.detail_char_avatar);
        btnChatNormal  = view.findViewById(R.id.detail_btn_chat_normal);
        btnChatStory   = view.findViewById(R.id.detail_btn_chat_story);

        // Back button
        View btnBack = view.findViewById(R.id.btn_back_detail);
        if (btnBack != null) {
            btnBack.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(view).navigateUp());
        }

        // Fetch dữ liệu thực
        if (characterId != null && !characterId.isEmpty()) {
            fetchCharacterDetail();
        } else {
            Toast.makeText(getContext(), "Không tìm thấy nhân vật", Toast.LENGTH_SHORT).show();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    private void fetchCharacterDetail() {
        CharacterApiService.getCharacterDetail(getContext(), characterId, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject resp) {
                try {
                    JSONObject data = resp.getJSONObject("data");
                    bindData(data);
                } catch (Exception e) {
                    Toast.makeText(getContext(), "Lỗi tải dữ liệu nhân vật", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                Toast.makeText(getContext(),
                        statusCode == 404 ? "Nhân vật không tồn tại" : "Lỗi kết nối: " + errorMessage,
                        Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void bindData(JSONObject data) throws Exception {
        String name      = data.optString("name",        "");
        String slogan    = data.optString("slogan",      "");
        String gender    = data.optString("gender",      "");
        String bio       = data.optString("bio",         "");
        String personality = data.optString("personality", "");
        String status    = data.optString("status",      "");
        String openingLine = data.optString("openingLine", "");
        int    totalChats = data.optInt("totalChats",    0);
        String chatMode  = data.optString("chatMode",   "both");

        String creatorName = data.optString("creatorName", "Iiawak");
        JSONObject creator = data.optJSONObject("creatorId");
        if (creator != null) {
            // Fallback nếu DTO trả object thay vì string+creatorName riêng
            creatorName = creator.optString("displayName", creatorName);
        }

        // Tags
        JSONArray tagsArr = data.optJSONArray("tags");
        StringBuilder tags = new StringBuilder();
        if (tagsArr != null) {
            for (int i = 0; i < tagsArr.length(); i++) {
                if (i > 0) tags.append("  ");
                tags.append("#").append(tagsArr.optString(i));
            }
        }

        // Set UI
        if (tvName        != null) tvName.setText(name);
        if (tvSlogan      != null) tvSlogan.setText(slogan);
        if (tvGender      != null) tvGender.setText(gender + (tags.length() > 0 ? "  " + tags : ""));
        if (tvBio         != null) tvBio.setText(bio.isEmpty() ? "Chưa có thông tin" : bio);
        if (tvPersonality != null) tvPersonality.setText(personality.isEmpty() ? "Chưa có thông tin" : personality);
        if (tvStatus      != null) tvStatus.setText("● " + (status.isEmpty() ? "Công khai" : status));
        if (tvOpeningLine != null) tvOpeningLine.setText("\"" + (openingLine.isEmpty() ? "Xin chào!" : openingLine) + "\"");
        if (tvTotalChats  != null) tvTotalChats.setText("💬 " + formatCount(totalChats) + " lượt chat");
        if (tvCreator     != null) tvCreator.setText("Tạo bởi: " + creatorName);

        // Avatar
        String avatarUrl = data.optString("avatar", "");
        if (ivAvatar != null) {
            if (!avatarUrl.isEmpty()) {
                Glide.with(this)
                        .load(avatarUrl)
                        .placeholder(R.drawable.ic_pink_diamond)
                        .into(ivAvatar);
            } else {
                ivAvatar.setImageResource(R.drawable.ic_pink_diamond);
            }
        }

        // Chat buttons
        boolean hasNormal = "normal".equals(chatMode) || "both".equals(chatMode);
        boolean hasStory  = "story".equals(chatMode)  || "both".equals(chatMode);
        String finalName = name;
        String finalChatMode = chatMode;

        if (btnChatNormal != null) {
            btnChatNormal.setVisibility(hasNormal ? View.VISIBLE : View.GONE);
            btnChatNormal.setOnClickListener(v -> navigateToChat("normal", finalName, finalChatMode));
        }
        if (btnChatStory != null) {
            btnChatStory.setVisibility(hasStory ? View.VISIBLE : View.GONE);
            btnChatStory.setOnClickListener(v -> navigateToChat("story", finalName, finalChatMode));
        }
    }

    private void navigateToChat(String mode, String charName, String chatMode) {
        Bundle args = new Bundle();
        args.putString("characterId", characterId);
        args.putString("botName",     charName);
        args.putString("chatMode",    mode);
        try {
            androidx.navigation.Navigation.findNavController(requireView())
                    .navigate(R.id.chatFragment, args);
        } catch (Exception e) {
            Toast.makeText(getContext(), "Không thể mở chat", Toast.LENGTH_SHORT).show();
        }
    }

    private String formatCount(int n) {
        if (n >= 1_000_000) return String.format("%.1fM", n / 1_000_000f);
        if (n >= 1_000)     return String.format("%.1fK", n / 1_000f);
        return String.valueOf(n);
    }
}
