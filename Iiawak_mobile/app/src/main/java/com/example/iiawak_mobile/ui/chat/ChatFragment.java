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
        
        com.example.iiawak_mobile.network.SocketManager.getInstance().connect(session.getAuthHeader());

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
            if (chatMode.equals("dm")) {
                modeLabel.setText("💬 Tin nhắn riêng");
            } else {
                modeLabel.setText(chatMode.equals("story") ? "📖 Chế độ Câu Chuyện" : "💬 Chat Thường");
            }
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

        View btnSend = view.findViewById(R.id.btn_send);
        inputField = view.findViewById(R.id.et_chat_input);
        if (btnSend != null) {
            btnSend.setOnClickListener(v -> sendMessage());
        }

        // Back button
        View btnBack = view.findViewById(R.id.btn_back);
        if (btnBack != null) {
            btnBack.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(view).navigateUp());
        }

        // Tùy chọn chat -> Bản đồ ký ức
        View btnOptions = view.findViewById(R.id.btn_chat_options);
        if (btnOptions != null) {
            btnOptions.setOnClickListener(v -> {
                try {
                    androidx.navigation.Navigation.findNavController(view).navigate(R.id.action_chat_to_memory_map);
                } catch (Exception e) {}
            });
        }

        // Thanh thiện cảm -> Chinh phục
        View affectionMeter = view.findViewById(R.id.affection_meter);
        if (affectionMeter != null) {
            affectionMeter.setOnClickListener(v -> {
                try {
                    androidx.navigation.Navigation.findNavController(view).navigate(R.id.action_chat_to_conquest);
                } catch (Exception e) {}
            });
        }

        // RP suggestions
        if (!chatMode.equals("dm")) {
            setupRpSuggestions(view);
        } else {
            View sugContainer = view.findViewById(R.id.rp_suggestions_container); // Assuming it has a container, or we just don't setup
            // Actually, setupRpSuggestions just sets listeners. We can just hide them.
            view.findViewById(R.id.rp_suggestion_1).setVisibility(View.GONE);
            view.findViewById(R.id.rp_suggestion_2).setVisibility(View.GONE);
            view.findViewById(R.id.rp_suggestion_3).setVisibility(View.GONE);
        }
        
        if (chatMode.equals("dm")) {
            setupSocketListeners();
        }
    }
    
    private void setupSocketListeners() {
        io.socket.client.Socket socket = com.example.iiawak_mobile.network.SocketManager.getInstance().getSocket();
        if (socket != null) {
            socket.on("receive_direct_msg", args -> {
                if (args.length > 0) {
                    try {
                        JSONObject msg = (JSONObject) args[0];
                        String senderId = msg.optString("senderId");
                        String content = msg.optString("content");
                        if (senderId.equals(characterId)) { // Message from partner
                            new Handler(Looper.getMainLooper()).post(() -> {
                                messages.add(new ChatMessage(content, false));
                                messageAdapter.notifyItemInserted(messages.size() - 1);
                                messagesRecycler.smoothScrollToPosition(messages.size() - 1);
                            });
                        }
                    } catch (Exception e) {}
                }
            });
        }
    }
    
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (chatMode.equals("dm")) {
            io.socket.client.Socket socket = com.example.iiawak_mobile.network.SocketManager.getInstance().getSocket();
            if (socket != null) {
                socket.off("receive_direct_msg");
            }
        }
    }

    // ─── Tải lịch sử chat ────────────────────────────────────────────────────
    private void loadChatHistory() {
        if (characterId == null || characterId.isEmpty()) return;
        String userId = session.getUserId().isEmpty() ? "demo_user" : session.getUserId();

        if (chatMode.equals("dm")) {
            com.example.iiawak_mobile.data.remote.ChatApiService.getDirectMessages(getContext(), characterId, new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
                @Override
                public void onSuccess(JSONObject resp) {
                    try {
                        JSONArray historyArr = resp.getJSONArray("data");
                        messages.clear();
                        for (int i = 0; i < historyArr.length(); i++) {
                            JSONObject m = historyArr.getJSONObject(i);
                            boolean isUser = m.optString("senderId").equals(session.getUserId());
                            messages.add(new ChatMessage(m.getString("content"), isUser));
                        }
                        if (messages.isEmpty()) {
                            messages.add(new ChatMessage("Bắt đầu trò chuyện với " + characterName, false));
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
            return;
        }

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

    // ─── Gửi tin nhắn ─────────────────────────────────────────
    private void sendMessage() {
        if (inputField == null) return;
        String text = inputField.getText() != null ? inputField.getText().toString().trim() : "";
        if (text.isEmpty()) return;

        // Hiển thị tin nhắn người dùng ngay lập tức
        messages.add(new ChatMessage(text, true));
        messageAdapter.notifyItemInserted(messages.size() - 1);
        messagesRecycler.smoothScrollToPosition(messages.size() - 1);
        inputField.setText("");

        if (chatMode.equals("dm")) {
            io.socket.client.Socket socket = com.example.iiawak_mobile.network.SocketManager.getInstance().getSocket();
            if (socket != null && socket.connected()) {
                try {
                    JSONObject payload = new JSONObject();
                    payload.put("receiverId", characterId);
                    payload.put("content", text);
                    socket.emit("send_direct_msg", payload);
                } catch (Exception e) {}
            } else {
                Toast.makeText(getContext(), "Đang mất kết nối mạng", Toast.LENGTH_SHORT).show();
            }
            return;
        }

        // Hiển thị loading (chỉ cho AI)
        if (loadingIndicator != null) loadingIndicator.setVisibility(View.VISIBLE);

        // Gọi POST /api/chat/ai/send — Backend dùng SDK @google/genai tự quản lý lịch sử
        try {
            JSONObject body = new JSONObject();
            body.put("characterId", characterId);
            body.put("content", text);
            body.put("mode", chatMode);
            com.example.iiawak_mobile.network.ApiClient.post(getContext(), "/chat/ai/send", body,
                new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
                    @Override
                    public void onSuccess(JSONObject resp) {
                        if (loadingIndicator != null) loadingIndicator.setVisibility(View.GONE);
                        // Response: { success: true, data: { response: '...' } }
                        JSONObject data = resp.optJSONObject("data");
                        String reply = data != null
                                ? data.optString("response", "...")
                                : resp.optString("reply", "...");
                        messages.add(new ChatMessage(reply, false));
                        messageAdapter.notifyItemInserted(messages.size() - 1);
                        messagesRecycler.smoothScrollToPosition(messages.size() - 1);

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
        } catch (Exception e) {
            if (loadingIndicator != null) loadingIndicator.setVisibility(View.GONE);
        }
    }

    private void setupRpSuggestions(View view) {
        View sug1 = view.findViewById(R.id.rp_suggestion_1);
        View sug2 = view.findViewById(R.id.rp_suggestion_2);
        View sug3 = view.findViewById(R.id.rp_suggestion_3);

        if (sug1 != null && inputField != null) {
            sug1.setOnClickListener(v -> { inputField.setText("*Mỉm cười nhẹ*"); sendMessage(); });
        }
        if (sug2 != null && inputField != null) {
            sug2.setOnClickListener(v -> { inputField.setText("Kể cho mình nghe về bản thân bạn đi"); sendMessage(); });
        }
        if (sug3 != null && inputField != null) {
            sug3.setOnClickListener(v -> { inputField.setText("*Thách thức bạn*"); sendMessage(); });
        }
    }
}
