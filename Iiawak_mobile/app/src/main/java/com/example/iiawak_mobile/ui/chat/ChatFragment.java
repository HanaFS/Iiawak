package com.example.iiawak_mobile.ui.chat;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.config.NetworkConfig;
import com.example.iiawak_mobile.data.UserSession;
import com.example.iiawak_mobile.data.model.ChatMessage;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

/**
 * ChatFragment — Chat với Nhân vật AI (Normal / Story mode)
 * Kết nối trực tiếp với Backend API /api/characters/:id/chat
 */
public class ChatFragment extends Fragment {

    private static final String BASE_URL = NetworkConfig.BASE_URL;

    private RecyclerView messagesRecycler;
    private EditText inputField;
    private MessageAdapter messageAdapter;
    private List<ChatMessage> messages = new ArrayList<>();
    private int altegoLevel = 40;

    // Thông tin nhân vật từ args
    private String characterId;
    private String characterName;
    private String chatMode = "normal"; // "normal" hoặc "story"

    private UserSession session;
    private View loadingIndicator;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_chat, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        session = UserSession.getInstance(requireContext());

        // Lấy args từ navigation
        if (getArguments() != null) {
            characterId = getArguments().getString("characterId", "");
            characterName = getArguments().getString("botName", "Nhân vật");
            chatMode = getArguments().getString("chatMode", "normal");
        }

        // Setup header
        TextView headerName = view.findViewById(R.id.chat_header_bot_name);
        if (headerName != null) headerName.setText(characterName);

        // Hiển thị mode chat
        TextView modeLabel = view.findViewById(R.id.tv_chat_mode);
        if (modeLabel != null) {
            modeLabel.setText(chatMode.equals("story") ? "📖 Chế độ Câu Chuyện" : "💬 Chat Thường");
            modeLabel.setVisibility(View.VISIBLE);
        }

        // Setup RecyclerView
        messagesRecycler = view.findViewById(R.id.chat_messages_recycler);
        messagesRecycler.setLayoutManager(new LinearLayoutManager(getContext()));
        messageAdapter = new MessageAdapter(messages);
        messagesRecycler.setAdapter(messageAdapter);

        loadingIndicator = view.findViewById(R.id.chat_loading);

        // Tải lịch sử chat từ Backend
        loadChatHistory();

        // Send button
        View btnSend = view.findViewById(R.id.btn_send);
        inputField = view.findViewById(R.id.et_chat_input);
        if (btnSend != null) {
            btnSend.setOnClickListener(v -> sendMessageToAI());
        }

        // Back button
        View btnBack = view.findViewById(R.id.btn_back);
        if (btnBack != null) {
            btnBack.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(view).navigateUp());
        }

        // RP suggestions
        setupRpSuggestions(view);
    }

    // ─── Tải lịch sử chat ────────────────────────────────────────────────────
    private void loadChatHistory() {
        if (characterId == null || characterId.isEmpty()) return;
        String userId = session.getUserId().isEmpty() ? "demo_user" : session.getUserId();

        com.example.iiawak_mobile.data.remote.CharacterApiService.getChatHistory(getContext(), characterId, userId, chatMode, new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject resp) {
                try {
                    JSONArray historyArr = resp.getJSONArray("data");
                    messages.clear();
                    for (int i = 0; i < historyArr.length(); i++) {
                        JSONObject m = historyArr.getJSONObject(i);
                        boolean isUser = m.getString("role").equals("user");
                        messages.add(new ChatMessage(m.getString("content"), isUser));
                    }
                    if (messages.isEmpty()) {
                        messages.add(new ChatMessage("Xin chào! Tôi là " + characterName + " 🌙", false));
                    }
                    messageAdapter.notifyDataSetChanged();
                    messagesRecycler.scrollToPosition(messages.size() - 1);
                } catch (Exception e) {
                    fallbackLoadChat();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                fallbackLoadChat();
            }
        });
    }

    private void fallbackLoadChat() {
        messages.add(new ChatMessage("Xin chào! Tôi là " + characterName + " 🌙", false));
        messageAdapter.notifyDataSetChanged();
    }

    // ─── Gửi tin nhắn đến AI Backend ─────────────────────────────────────────
    private void sendMessageToAI() {
        if (inputField == null) return;
        String text = inputField.getText() != null ? inputField.getText().toString().trim() : "";
        if (text.isEmpty()) return;

        // Hiển thị tin nhắn người dùng ngay lập tức
        messages.add(new ChatMessage(text, true));
        messageAdapter.notifyItemInserted(messages.size() - 1);
        messagesRecycler.smoothScrollToPosition(messages.size() - 1);
        inputField.setText("");

        // Hiển thị loading
        if (loadingIndicator != null) loadingIndicator.setVisibility(View.VISIBLE);

        String userId = session.getUserId().isEmpty() ? "demo_user" : session.getUserId();

        com.example.iiawak_mobile.data.remote.CharacterApiService.chatWithCharacter(getContext(), characterId, text, chatMode, userId, new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject resp) {
                if (loadingIndicator != null) loadingIndicator.setVisibility(View.GONE);
                String reply = resp.optString("reply", "...");
                
                messages.add(new ChatMessage(reply, false));
                messageAdapter.notifyItemInserted(messages.size() - 1);
                messagesRecycler.smoothScrollToPosition(messages.size() - 1);
                
                // Cập nhật Altego meter nhẹ (logic mockup - UI đã ẩn)
                altegoLevel = Math.min(100, altegoLevel + (int)(Math.random() * 5));
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                if (loadingIndicator != null) loadingIndicator.setVisibility(View.GONE);
                String fallback = chatMode.equals("story")
                    ? "*" + characterName + " nhìn bạn với ánh mắt sâu thẳm...*\n\nBạn muốn tiếp tục câu chuyện như thế nào?"
                    : characterName + " đang suy nghĩ... 🌙";
                messages.add(new ChatMessage(fallback, false));
                messageAdapter.notifyItemInserted(messages.size() - 1);
                messagesRecycler.smoothScrollToPosition(messages.size() - 1);
            }
        });
    }

    private void setupRpSuggestions(View view) {
        View sug1 = view.findViewById(R.id.rp_suggestion_1);
        View sug2 = view.findViewById(R.id.rp_suggestion_2);
        View sug3 = view.findViewById(R.id.rp_suggestion_3);

        if (sug1 != null && inputField != null) {
            sug1.setOnClickListener(v -> { inputField.setText("*Mỉm cười nhẹ*"); sendMessageToAI(); });
        }
        if (sug2 != null && inputField != null) {
            sug2.setOnClickListener(v -> { inputField.setText("Kể cho mình nghe về bản thân bạn đi"); sendMessageToAI(); });
        }
        if (sug3 != null && inputField != null) {
            sug3.setOnClickListener(v -> { inputField.setText("*Thách thức bạn*"); sendMessageToAI(); });
        }
    }
}
