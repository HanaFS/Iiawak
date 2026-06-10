package com.example.iiawak_mobile.ui.community;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.CharacterCard;
import java.util.List;

/**
 * CharacterCardAdapter — Hiển thị danh sách nhân vật dạng card.
 * Bind từ dữ liệu thực trong CharacterCard (id, avatar, slogan, totalChats v.v.)
 */
public class CharacterCardAdapter extends RecyclerView.Adapter<CharacterCardAdapter.CharViewHolder> {

    private final List<CharacterCard> characters;
    private OnCharacterClickListener  listener;

    public interface OnCharacterClickListener {
        void onStartChat(CharacterCard character);
    }

    public CharacterCardAdapter(List<CharacterCard> characters) {
        this.characters = characters;
    }

    public void setOnCharacterClickListener(OnCharacterClickListener listener) {
        this.listener = listener;
    }

    @NonNull
    @Override
    public CharViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_community_character_card, parent, false);
        return new CharViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull CharViewHolder holder, int position) {
        CharacterCard card = characters.get(position);
        holder.bind(card);
        holder.btnStartChat.setOnClickListener(v -> {
            if (listener != null) listener.onStartChat(card);
        });
    }

    @Override
    public int getItemCount() { return characters.size(); }

    // ─── ViewHolder ──────────────────────────────────────────────────────────

    static class CharViewHolder extends RecyclerView.ViewHolder {
        TextView tvName, tvSlogan, tvGenre, tvChats, tvCreator, tvAdultBadge;
        View btnStartChat;

        CharViewHolder(View v) {
            super(v);
            tvName      = v.findViewById(R.id.char_name);
            // tvSlogan    = v.findViewById(R.id.char_slogan);
            // tvGenre     = v.findViewById(R.id.char_genre);
            tvChats     = v.findViewById(R.id.char_users);   // reuse id tương thích
            // tvCreator   = v.findViewById(R.id.char_creator);
            tvAdultBadge = v.findViewById(R.id.char_badge);
            btnStartChat = v.findViewById(R.id.btn_start_chat);
        }

        void bind(CharacterCard card) {
            if (tvName   != null) tvName.setText(card.name);
            if (tvSlogan != null) {
                tvSlogan.setText(card.slogan != null && !card.slogan.isEmpty()
                        ? card.slogan : "");
            }
            if (tvGenre  != null) {
                tvGenre.setText(card.genre != null && !card.genre.isEmpty()
                        ? "#" + card.genre : "");
            }
            if (tvChats  != null) tvChats.setText("💬 " + formatCount(card.totalChats) + " lượt chat");
            if (tvCreator != null) {
                tvCreator.setText(card.creatorName != null && !card.creatorName.isEmpty()
                        ? "✦ " + card.creatorName : "");
            }
            if (tvAdultBadge != null) {
                tvAdultBadge.setVisibility(card.isAdult ? View.VISIBLE : View.GONE);
            }
        }

        private String formatCount(int n) {
            if (n >= 1_000_000) return String.format("%.1fM", n / 1_000_000f);
            if (n >= 1_000)     return String.format("%.1fK", n / 1_000f);
            return String.valueOf(n);
        }
    }
}
