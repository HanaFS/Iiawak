package com.example.iiawak_mobile.ui.explore;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.AsyncTask;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.CharacterCard;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.lang.ref.WeakReference;
import java.util.List;

/**
 * ExploreCharacterAdapter — Adapter dành riêng cho ExploreFragment.
 * Inflate item_character_card.xml và bind đúng các View ID trong đó.
 * Hỗ trợ hai loại hành động: Chat Thường và Chat Chuyện.
 */
public class ExploreCharacterAdapter extends RecyclerView.Adapter<ExploreCharacterAdapter.ViewHolder> {

    public interface OnChatClickListener {
        void onChatNormal(CharacterCard card);
        void onChatStory(CharacterCard card);
    }

    private final List<CharacterCard> characters;
    private OnChatClickListener listener;

    public ExploreCharacterAdapter(List<CharacterCard> characters) {
        this.characters = characters;
    }

    public void setOnChatClickListener(OnChatClickListener listener) {
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_character_card, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder h, int position) {
        CharacterCard card = characters.get(position);

        // ── Tên nhân vật ──────────────────────────────────────────────────────
        if (h.tvName != null) h.tvName.setText(card.name);

        // ── Slogan ────────────────────────────────────────────────────────────
        if (h.tvSlogan != null) {
            h.tvSlogan.setText(card.slogan != null && !card.slogan.isEmpty()
                    ? card.slogan : "");
            h.tvSlogan.setVisibility(card.slogan != null && !card.slogan.isEmpty()
                    ? View.VISIBLE : View.GONE);
        }

        // ── Thể loại / Tag ────────────────────────────────────────────────────
        if (h.tvCategory != null) {
            h.tvCategory.setText(card.genre != null && !card.genre.isEmpty()
                    ? card.genre : "");
        }

        // ── Số lượt chat ──────────────────────────────────────────────────────
        if (h.tvChats != null) {
            h.tvChats.setText(formatCount(card.totalChats) + " chat");
        }

        // ── Số tim (likes) ────────────────────────────────────────────────────
        if (h.tvAffection != null) {
            h.tvAffection.setText("♥ " + formatCount(card.totalLikes));
        }

        // ── Badge người lớn ───────────────────────────────────────────────────
        if (h.tvBadge != null) {
            h.tvBadge.setVisibility(card.isAdult ? View.VISIBLE : View.GONE);
            if (card.isAdult) h.tvBadge.setText("18+");
        }

        // ── Avatar (load bằng Glide) ─────────────────────────────────
        if (h.ivAvatar != null) {
            if (card.avatar != null && !card.avatar.isEmpty()) {
                Glide.with(h.itemView.getContext())
                        .load(card.avatar)
                        .placeholder(R.color.brand_primary)
                        .centerCrop()
                        .into(h.ivAvatar);
            } else {
                h.ivAvatar.setImageResource(R.color.brand_primary);
            }
        }

        // ── Nút Chat Thường ───────────────────────────────────────────────────
        boolean canNormal = card.chatMode != null &&
                (card.chatMode.equals("normal") || card.chatMode.equals("both"));
        if (h.btnChatNormal != null) {
            h.btnChatNormal.setVisibility(canNormal ? View.VISIBLE : View.GONE);
            h.btnChatNormal.setOnClickListener(v -> {
                if (listener != null) listener.onChatNormal(card);
            });
        }

        // ── Nút Chat Chuyện (Story) ───────────────────────────────────────────
        boolean canStory = card.chatMode != null &&
                (card.chatMode.equals("story") || card.chatMode.equals("both"));
        if (h.btnChatStory != null) {
            h.btnChatStory.setVisibility(canStory ? View.VISIBLE : View.GONE);
            h.btnChatStory.setOnClickListener(v -> {
                if (listener != null) listener.onChatStory(card);
            });
        }
    }

    @Override
    public int getItemCount() {
        return characters.size();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String formatCount(int n) {
        if (n >= 1_000_000) return String.format("%.1fM", n / 1_000_000f);
        if (n >= 1_000)     return String.format("%.1fK", n / 1_000f);
        return String.valueOf(n);
    }

    // ── ViewHolder ────────────────────────────────────────────────────────────

    static class ViewHolder extends RecyclerView.ViewHolder {
        ImageView ivAvatar;
        TextView  tvName, tvSlogan, tvCategory, tvChats, tvAffection, tvBadge;
        View      btnChatNormal, btnChatStory;

        ViewHolder(View v) {
            super(v);
            ivAvatar      = v.findViewById(R.id.iv_char_avatar);
            tvName        = v.findViewById(R.id.tv_char_name);
            tvSlogan      = v.findViewById(R.id.tv_char_slogan);
            tvCategory    = v.findViewById(R.id.tv_char_category);
            tvChats       = v.findViewById(R.id.tv_char_chats);
            tvAffection   = v.findViewById(R.id.tv_char_affection);
            tvBadge       = v.findViewById(R.id.tv_char_badge);
            btnChatNormal = v.findViewById(R.id.btn_chat_normal);
            btnChatStory  = v.findViewById(R.id.btn_chat_story);
        }
    }
}
