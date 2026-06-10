package com.example.iiawak_mobile.ui.chat;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.ChatMessage;
import java.util.List;

public class MessageAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final int VIEW_TYPE_BOT = 0;
    private static final int VIEW_TYPE_USER = 1;

    private final List<ChatMessage> messages;

    public MessageAdapter(List<ChatMessage> messages) {
        this.messages = messages;
    }

    @Override
    public int getItemViewType(int position) {
        return messages.get(position).isFromUser ? VIEW_TYPE_USER : VIEW_TYPE_BOT;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        if (viewType == VIEW_TYPE_USER) {
            View v = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_message_user, parent, false);
            return new UserViewHolder(v);
        } else {
            View v = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_message_bot, parent, false);
            return new BotViewHolder(v);
        }
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        ChatMessage msg = messages.get(position);
        if (holder instanceof UserViewHolder) {
            ((UserViewHolder) holder).bind(msg);
        } else {
            ((BotViewHolder) holder).bind(msg);
        }
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    static class UserViewHolder extends RecyclerView.ViewHolder {
        TextView msgText, msgTime;
        UserViewHolder(View v) {
            super(v);
            msgText = v.findViewById(R.id.msg_user_text);
            msgTime = v.findViewById(R.id.msg_user_time);
        }
        void bind(ChatMessage msg) {
            if (msgText != null) msgText.setText(msg.text);
            if (msgTime != null) msgTime.setText(msg.time);
        }
    }

    static class BotViewHolder extends RecyclerView.ViewHolder {
        TextView msgText, msgTime;
        BotViewHolder(View v) {
            super(v);
            msgText = v.findViewById(R.id.msg_bot_text);
            msgTime = v.findViewById(R.id.msg_bot_time);
        }
        void bind(ChatMessage msg) {
            if (msgText != null) msgText.setText(msg.text);
            if (msgTime != null) msgTime.setText(msg.time);
        }
    }
}
