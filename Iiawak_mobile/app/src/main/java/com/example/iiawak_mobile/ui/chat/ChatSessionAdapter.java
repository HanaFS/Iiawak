package com.example.iiawak_mobile.ui.chat;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.AsyncTask;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.ChatSession;
import de.hdodenhof.circleimageview.CircleImageView;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;

/**
 * ChatSessionAdapter — Adapter hiển thị danh sách phiên chat AI.
 * Bind với item_chat_session.xml.
 * Load avatar từ URL bằng AsyncTask (không cần Glide).
 */
public class ChatSessionAdapter extends RecyclerView.Adapter<ChatSessionAdapter.ChatViewHolder> {

    public interface OnSessionClickListener {
        void onClick(ChatSession session);
    }

    private final List<ChatSession>       sessions;
    private final OnSessionClickListener  listener;

    public ChatSessionAdapter(List<ChatSession> sessions, OnSessionClickListener listener) {
        this.sessions = sessions;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ChatViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_chat_session, parent, false);
        return new ChatViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ChatViewHolder h, int position) {
        ChatSession session = sessions.get(position);
        h.bind(session);
        h.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onClick(session);
        });
    }

    @Override
    public int getItemCount() { return sessions.size(); }

    // ── ViewHolder ────────────────────────────────────────────────────────────

    static class ChatViewHolder extends RecyclerView.ViewHolder {
        CircleImageView avatar;
        TextView        botName, lastMessage, timeAgo, emotion, unreadBadge;
        ProgressBar     altegoMeter;

        ChatViewHolder(View v) {
            super(v);
            avatar      = v.findViewById(R.id.chat_bot_avatar);
            botName     = v.findViewById(R.id.chat_bot_name);
            lastMessage = v.findViewById(R.id.chat_last_message);
            timeAgo     = v.findViewById(R.id.chat_time);
            emotion     = v.findViewById(R.id.chat_bot_emotion);
            unreadBadge = v.findViewById(R.id.chat_unread_badge);
            altegoMeter = v.findViewById(R.id.altego_meter_mini);
        }

        void bind(ChatSession session) {
            if (botName     != null) botName.setText(session.botName);
            if (timeAgo     != null) timeAgo.setText(session.timeAgo);
            if (emotion     != null) emotion.setText(
                    session.emotion != null && !session.emotion.isEmpty()
                            ? session.emotion : "😊");
            if (altegoMeter != null) altegoMeter.setProgress(session.altegoLevel);

            // Tin nhắn cuối
            if (lastMessage != null) {
                String preview = session.lastMessage != null ? session.lastMessage : "Bắt đầu trò chuyện...";
                lastMessage.setText(preview);
            }

            // Unread badge
            if (unreadBadge != null) {
                unreadBadge.setVisibility(session.unreadCount > 0 ? View.VISIBLE : View.GONE);
                if (session.unreadCount > 0) {
                    unreadBadge.setText(String.valueOf(session.unreadCount));
                }
            }

            // Avatar
            if (avatar != null) {
                if (session.avatarUrl != null && !session.avatarUrl.isEmpty()) {
                    Glide.with(itemView.getContext())
                            .load(session.avatarUrl)
                            .placeholder(R.drawable.ic_diamond)
                            .into(avatar);
                } else {
                    avatar.setImageResource(R.drawable.ic_diamond);
                }
            }
        }
    }
}
