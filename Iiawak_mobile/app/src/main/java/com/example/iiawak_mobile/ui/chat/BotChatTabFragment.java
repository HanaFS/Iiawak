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
import com.example.iiawak_mobile.data.remote.CharacterApiService;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/**
 * BotChatTabFragment — Danh sách nhân vật AI để bắt đầu chat.
 * KHÔNG có dữ liệu fallback cứng: toàn bộ từ GET /api/characters.
 * Nếu mạng lỗi → hiển thị thông báo và danh sách trống.
 */
public class BotChatTabFragment extends Fragment {

    private CharacterListAdapter      adapter;
    private final List<CharacterItem> characterList = new ArrayList<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_bot_chat_tab, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        RecyclerView recycler = view.findViewById(R.id.bot_chat_recycler);
        recycler.setLayoutManager(new LinearLayoutManager(getContext()));

        adapter = new CharacterListAdapter(characterList, (character, mode) -> {
            Bundle args = new Bundle();
            args.putString("characterId", character.id);
            args.putString("botName",     character.name);
            args.putString("botAvatar",   character.avatar);
            args.putString("chatMode",    mode);
            androidx.navigation.Navigation.findNavController(view)
                    .navigate(R.id.chatFragment, args);
        });
        recycler.setAdapter(adapter);

        fetchCharacters();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Load từ backend — không fallback về dữ liệu cứng
    // ─────────────────────────────────────────────────────────────────────────

    private void fetchCharacters() {
        CharacterApiService.getPublicCharacters(getContext(), null, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject resp) {
                try {
                    JSONArray data = resp.getJSONArray("data");
                    characterList.clear();
                    for (int i = 0; i < data.length(); i++) {
                        JSONObject obj = data.getJSONObject(i);
                        characterList.add(new CharacterItem(
                                obj.getString("_id"),
                                obj.optString("name",       ""),
                                obj.optString("avatar",     ""),
                                obj.optString("slogan",     ""),
                                obj.optString("chatMode",   "both"),
                                obj.optInt("totalChats",    0)
                        ));
                    }
                    adapter.notifyDataSetChanged();
                } catch (Exception e) {
                    showError("Lỗi phân tích dữ liệu");
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                showError("Không thể tải danh sách nhân vật. Kiểm tra kết nối mạng.");
            }
        });
    }

    private void showError(String msg) {
        if (getContext() != null) {
            Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
        }
    }

    // ─── Model ───────────────────────────────────────────────────────────────

    static class CharacterItem {
        String id, name, avatar, slogan, chatMode;
        int totalChats;
        CharacterItem(String id, String name, String avatar, String slogan,
                      String chatMode, int totalChats) {
            this.id = id; this.name = name; this.avatar = avatar;
            this.slogan = slogan; this.chatMode = chatMode; this.totalChats = totalChats;
        }
    }

    // ─── Callback ────────────────────────────────────────────────────────────

    interface OnCharacterClickListener {
        void onChatClick(CharacterItem character, String mode);
    }

    // ─── Adapter ─────────────────────────────────────────────────────────────

    static class CharacterListAdapter extends RecyclerView.Adapter<CharacterListAdapter.VH> {
        private final List<CharacterItem>    list;
        private final OnCharacterClickListener listener;

        CharacterListAdapter(List<CharacterItem> list, OnCharacterClickListener listener) {
            this.list = list;
            this.listener = listener;
        }

        @NonNull @Override
        public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_character_card, parent, false);
            return new VH(v);
        }

        @Override
        public void onBindViewHolder(@NonNull VH h, int position) {
            CharacterItem c = list.get(position);
            h.tvName.setText(c.name);
            h.tvSlogan.setText(c.slogan);
            h.tvChats.setText(formatCount(c.totalChats) + " lượt chat");

            boolean hasStory = "story".equals(c.chatMode) || "both".equals(c.chatMode);
            h.btnNormal.setVisibility(View.VISIBLE);
            h.btnStory.setVisibility(hasStory ? View.VISIBLE : View.GONE);

            h.btnNormal.setOnClickListener(v -> listener.onChatClick(c, "normal"));
            h.btnStory.setOnClickListener(v  -> listener.onChatClick(c, "story"));
        }

        @Override public int getItemCount() { return list.size(); }

        /** Format số lớn: 1200 → "1.2K" */
        private String formatCount(int n) {
            if (n >= 1_000_000) return String.format("%.1fM", n / 1_000_000f);
            if (n >= 1_000)     return String.format("%.1fK", n / 1_000f);
            return String.valueOf(n);
        }

        static class VH extends RecyclerView.ViewHolder {
            android.widget.TextView tvName, tvSlogan, tvChats;
            android.widget.Button   btnNormal, btnStory;
            VH(View v) {
                super(v);
                tvName   = v.findViewById(R.id.tv_char_name);
                tvSlogan = v.findViewById(R.id.tv_char_slogan);
                tvChats  = v.findViewById(R.id.tv_char_chats);
                btnNormal = v.findViewById(R.id.btn_chat_normal);
                btnStory  = v.findViewById(R.id.btn_chat_story);
            }
        }
    }
}
