package com.example.iiawak_mobile.ui.chat;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.ChatSession;
import java.util.List;

public class ChatSessionAdapter extends RecyclerView.Adapter<ChatSessionAdapter.ChatViewHolder> {

    public interface OnSessionClickListener {
        void onClick(ChatSession session);
    }

    private final List<ChatSession> sessions;
    private final OnSessionClickListener listener;

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
    public void onBindViewHolder(@NonNull ChatViewHolder holder, int position) {
        ChatSession session = sessions.get(position);
        holder.bind(session);
        holder.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onClick(session);
        });
    }

    @Override
    public int getItemCount() {
        return sessions.size();
    }

    static class ChatViewHolder extends RecyclerView.ViewHolder {
        TextView botName, lastMessage, timeAgo, emotion, unreadBadge;
        ProgressBar altegoMeter;

        ChatViewHolder(View v) {
            super(v);
            botName = v.findViewById(R.id.chat_bot_name);
            lastMessage = v.findViewById(R.id.chat_last_message);
            timeAgo = v.findViewById(R.id.chat_time);
            emotion = v.findViewById(R.id.chat_bot_emotion);
            unreadBadge = v.findViewById(R.id.chat_unread_badge);
            altegoMeter = v.findViewById(R.id.altego_meter_mini);
        }

        void bind(ChatSession session) {
            if (botName != null) botName.setText(session.botName);
            if (lastMessage != null) lastMessage.setText(session.lastMessage);
            if (timeAgo != null) timeAgo.setText(session.timeAgo);
            if (emotion != null) emotion.setText(session.emotion);
            if (altegoMeter != null) altegoMeter.setProgress(session.altegoLevel);
            if (unreadBadge != null) {
                if (session.unreadCount > 0) {
                    unreadBadge.setVisibility(View.VISIBLE);
                    unreadBadge.setText(String.valueOf(session.unreadCount));
                } else {
                    unreadBadge.setVisibility(View.GONE);
                }
            }
        }
    }
}
