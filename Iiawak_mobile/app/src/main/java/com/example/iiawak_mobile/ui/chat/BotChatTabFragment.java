package com.example.iiawak_mobile.ui.chat;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.ChatSession;
import com.example.iiawak_mobile.data.remote.ChatApiService;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * BotChatTabFragment — Tab 1: Danh sách phiên chat AI của người dùng.
 *
 * Gọi GET /api/chat/sessions → { success, data: [ ChatSession ] }
 * Mỗi session có: _id, characterId{ name, avatar }, messages[], mode, updatedAt
 *
 * Khi nhấn vào một session → navigate ChatFragment với characterId + chatMode.
 */
public class BotChatTabFragment extends Fragment {

    private ChatSessionAdapter          adapter;
    private final List<ChatSession>     sessions = new ArrayList<>();
    private View                        loadingView, emptyView;
    private RecyclerView                recycler;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_bot_chat_tab, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // ── Views ─────────────────────────────────────────────────────────────
        recycler    = view.findViewById(R.id.bot_chat_recycler);
        loadingView = view.findViewById(R.id.bot_chat_loading);
        emptyView   = view.findViewById(R.id.bot_chat_empty);

        // ── Adapter ───────────────────────────────────────────────────────────
        recycler.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new ChatSessionAdapter(sessions, session -> {
            // Mở lại cuộc trò chuyện với nhân vật
            Bundle args = new Bundle();
            args.putString("characterId", session.characterId);
            args.putString("botName",     session.botName);
            args.putString("botAvatar",   session.avatarUrl);
            args.putString("chatMode",    session.chatMode);
            try {
                androidx.navigation.Navigation.findNavController(view)
                        .navigate(R.id.chatFragment, args);
            } catch (Exception e) {
                Toast.makeText(getContext(), "Mở chat: " + session.botName, Toast.LENGTH_SHORT).show();
            }
        });
        recycler.setAdapter(adapter);

        // ── Fetch sessions từ backend ─────────────────────────────────────────
        fetchSessions();
    }

    // ─── Gọi API lấy sessions đã chat ────────────────────────────────────────

    private void fetchSessions() {
        setLoading(true);

        ChatApiService.getAiChatSessions(getContext(), new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                setLoading(false);
                if (!json.optBoolean("success", false)) {
                    setEmpty(true);
                    return;
                }

                JSONArray data = json.optJSONArray("data");
                sessions.clear();

                if (data != null) {
                    for (int i = 0; i < data.length(); i++) {
                        try {
                            JSONObject s = data.getJSONObject(i);

                            // characterId là object (populated) hoặc string
                            String charId   = "";
                            String charName = "";
                            String avatar   = "";
                            Object charObj  = s.opt("characterId");
                            if (charObj instanceof JSONObject) {
                                JSONObject c = (JSONObject) charObj;
                                charId   = c.optString("_id", "");
                                charName = c.optString("name", "Nhân vật");
                                avatar   = c.optString("avatar", "");
                            } else if (charObj instanceof String) {
                                charId = (String) charObj;
                            }

                            // Lấy tin nhắn cuối từ messages[]
                            String lastMsg = "";
                            JSONArray messages = s.optJSONArray("messages");
                            if (messages != null && messages.length() > 0) {
                                JSONObject lastMsgObj = messages.getJSONObject(messages.length() - 1);
                                lastMsg = lastMsgObj.optString("content", "");
                                // Cắt ngắn nếu quá dài
                                if (lastMsg.length() > 60) lastMsg = lastMsg.substring(0, 60) + "…";
                            }

                            // Thời gian tương đối từ updatedAt
                            String timeAgo = formatTimeAgo(s.optString("updatedAt", ""));

                            // chatMode
                            String mode = s.optString("mode", "normal");

                            sessions.add(new ChatSession(
                                    s.optString("_id", ""),
                                    charId,
                                    charName,
                                    avatar,
                                    lastMsg,
                                    timeAgo,
                                    "😊",   // emotion default
                                    mode,
                                    0,       // altegoLevel
                                    0,       // affectionLevel
                                    0        // unreadCount
                            ));
                        } catch (Exception e) {
                            // Skip malformed entry
                        }
                    }
                }

                adapter.notifyDataSetChanged();
                setEmpty(sessions.isEmpty());
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                setLoading(false);
                setEmpty(sessions.isEmpty());
                if (statusCode != 401) { // Không hiện lỗi nếu chưa đăng nhập
                    Toast.makeText(getContext(),
                            "Không thể tải lịch sử chat: " + errorMessage,
                            Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void setLoading(boolean loading) {
        if (loadingView != null) loadingView.setVisibility(loading ? View.VISIBLE : View.GONE);
        if (recycler    != null) recycler.setVisibility(loading ? View.GONE : View.VISIBLE);
        if (loading && emptyView != null) emptyView.setVisibility(View.GONE);
    }

    private void setEmpty(boolean empty) {
        if (emptyView != null) emptyView.setVisibility(empty ? View.VISIBLE : View.GONE);
        if (recycler  != null && !empty) recycler.setVisibility(View.VISIBLE);
    }

    /**
     * Chuyển ISO 8601 timestamp thành chuỗi thời gian tương đối.
     * Ví dụ: "2p trước", "3h trước", "2 ngày trước"
     */
    private String formatTimeAgo(String isoTimestamp) {
        if (isoTimestamp == null || isoTimestamp.isEmpty()) return "";
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
            Date past    = sdf.parse(isoTimestamp);
            long diffMs  = System.currentTimeMillis() - past.getTime();
            long diffMin = diffMs / 60_000;
            if (diffMin < 1)   return "Vừa xong";
            if (diffMin < 60)  return diffMin + "p";
            long diffH = diffMin / 60;
            if (diffH < 24)    return diffH + "h";
            long diffD = diffH / 24;
            return diffD + " ngày";
        } catch (Exception e) {
            return "";
        }
    }
}
