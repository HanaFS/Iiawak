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
import com.example.iiawak_mobile.data.remote.ChatApiService;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/**
 * FriendChatTabFragment — Tab 2: Chat DM với người dùng khác.
 *
 * Gọi GET /api/chat/direct/conversations → { success, data: [ Conversation ] }
 * Nếu trống → hiển thị empty state + nút "Khám phá nhân vật".
 */
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

        RecyclerView friendRecycler = view.findViewById(R.id.friend_chat_recycler);
        View emptyState             = view.findViewById(R.id.friend_empty_state);
        View loadingView            = view.findViewById(R.id.friend_chat_loading);

        // Ẩn tất cả, chờ API
        if (friendRecycler != null) friendRecycler.setVisibility(View.GONE);
        if (emptyState     != null) emptyState.setVisibility(View.GONE);
        if (loadingView    != null) loadingView.setVisibility(View.VISIBLE);

        // ── Gọi API lấy Direct Conversations ─────────────────────────────────
        ChatApiService.getDirectConversations(getContext(), new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                if (loadingView != null) loadingView.setVisibility(View.GONE);

                JSONArray data = json.optJSONArray("data");
                boolean hasConvs = data != null && data.length() > 0;

                if (hasConvs) {
                    // ── Có hội thoại: hiện RecyclerView ──────────────────────
                    if (friendRecycler != null) {
                        friendRecycler.setVisibility(View.VISIBLE);
                        friendRecycler.setLayoutManager(new LinearLayoutManager(getContext()));
                        friendRecycler.setAdapter(
                                new DirectConversationAdapter(data, view));
                    }
                    if (emptyState != null) emptyState.setVisibility(View.GONE);
                } else {
                    // ── Chưa có hội thoại: hiện empty state ──────────────────
                    if (friendRecycler != null) friendRecycler.setVisibility(View.GONE);
                    if (emptyState     != null) emptyState.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                if (loadingView != null) loadingView.setVisibility(View.GONE);
                if (emptyState  != null) emptyState.setVisibility(View.VISIBLE);
                if (statusCode != 401) {
                    Toast.makeText(getContext(),
                            "Không thể tải hội thoại: " + errorMessage,
                            Toast.LENGTH_SHORT).show();
                }
            }
        });

        // ── Nút "Tìm người dùng" → chuyển sang tab Explore ───────────────────
        View btnFind = view.findViewById(R.id.btn_find_friends);
        if (btnFind != null) {
            btnFind.setOnClickListener(v -> {
                if (getActivity() != null) {
                    com.google.android.material.bottomnavigation.BottomNavigationView nav =
                            getActivity().findViewById(R.id.bottom_nav);
                    if (nav != null) nav.setSelectedItemId(R.id.exploreFragment);
                }
            });
        }
    }

    // ── Adapter đơn giản cho Direct Conversations ─────────────────────────────

    static class DirectConversationAdapter
            extends RecyclerView.Adapter<DirectConversationAdapter.VH> {

        private final JSONArray data;
        private final View      parentView;

        DirectConversationAdapter(JSONArray data, View parentView) {
            this.data       = data;
            this.parentView = parentView;
        }

        @NonNull
        @Override
        public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_chat_session, parent, false);
            return new VH(v);
        }

        @Override
        public void onBindViewHolder(@NonNull VH h, int position) {
            try {
                JSONObject conv = data.getJSONObject(position);

                // Partner info (cần backend populate)
                JSONObject partner = conv.optJSONObject("partnerId");
                String partnerName   = partner != null
                        ? partner.optString("displayName", "Người dùng") : "Người dùng";
                String partnerAvatar = partner != null
                        ? partner.optString("avatar", "") : "";

                // Tin nhắn cuối
                String lastMsg = "";
                JSONArray messages = conv.optJSONArray("messages");
                if (messages != null && messages.length() > 0) {
                    JSONObject last = messages.getJSONObject(messages.length() - 1);
                    lastMsg = last.optString("content", "");
                }

                if (h.tvName    != null) h.tvName.setText(partnerName);
                if (h.tvPreview != null) h.tvPreview.setText(
                        lastMsg.isEmpty() ? "Bắt đầu trò chuyện..." : lastMsg);

                String partnerId = partner != null
                        ? partner.optString("_id", "") : conv.optString("partnerId", "");
                h.itemView.setOnClickListener(v -> {
                    android.os.Bundle args = new android.os.Bundle();
                    args.putString("characterId", partnerId);
                    args.putString("botName", partnerName);
                    args.putString("chatMode", "dm");
                    androidx.navigation.Navigation.findNavController(v)
                            .navigate(R.id.chatFragment, args);
                });

            } catch (Exception e) {
                // Bỏ qua entry lỗi
            }
        }

        @Override
        public int getItemCount() { return data.length(); }

        static class VH extends RecyclerView.ViewHolder {
            android.widget.TextView tvName, tvPreview;
            VH(View v) {
                super(v);
                tvName    = v.findViewById(R.id.chat_bot_name);
                tvPreview = v.findViewById(R.id.chat_last_message);
            }
        }
    }
}
