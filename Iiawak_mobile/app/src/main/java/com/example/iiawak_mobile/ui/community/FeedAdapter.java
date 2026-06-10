package com.example.iiawak_mobile.ui.community;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.FeedPost;
import java.util.List;

/**
 * FeedAdapter — Bind dữ liệu FeedPost thực từ backend lên item_feed_post.
 * Không còn dữ liệu mock. Hỗ trợ callback fire (like) từ Fragment.
 */
public class FeedAdapter extends RecyclerView.Adapter<FeedAdapter.FeedViewHolder> {

    public interface OnFireClickListener {
        void onFire(String postId);
    }

    private final List<FeedPost>    posts;
    private final OnFireClickListener fireListener;

    public FeedAdapter(List<FeedPost> posts, OnFireClickListener fireListener) {
        this.posts         = posts;
        this.fireListener  = fireListener;
    }

    @NonNull
    @Override
    public FeedViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_feed_post, parent, false);
        return new FeedViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull FeedViewHolder holder, int position) {
        FeedPost post = posts.get(position);
        holder.bind(post, fireListener);
    }

    @Override
    public int getItemCount() { return posts.size(); }

    // ─── ViewHolder ──────────────────────────────────────────────────────────

    static class FeedViewHolder extends RecyclerView.ViewHolder {
        TextView tvAuthorName, tvTimeAgo, tvContent, tvCharName, tvFireCount, tvCommentCount;
        View     charCard, btnFire, btnComment;

        FeedViewHolder(View v) {
            super(v);
            tvAuthorName   = v.findViewById(R.id.feed_author_name);
            tvTimeAgo      = v.findViewById(R.id.feed_time);
            tvContent      = v.findViewById(R.id.feed_content);
            charCard       = v.findViewById(R.id.feed_char_card);
            tvCharName     = v.findViewById(R.id.feed_char_name);
            tvFireCount    = v.findViewById(R.id.feed_reaction_count);
            // tvCommentCount = v.findViewById(R.id.feed_comment_count);
            // btnFire        = v.findViewById(R.id.btn_fire_post);
            btnComment     = v.findViewById(R.id.btn_comment);
        }

        void bind(FeedPost post, OnFireClickListener fireListener) {
            if (tvAuthorName != null) tvAuthorName.setText(post.authorName);
            if (tvTimeAgo    != null) tvTimeAgo.setText(post.timeAgo);
            if (tvContent    != null) tvContent.setText(post.content);

            // Đếm fire / comment
            if (tvFireCount    != null) tvFireCount.setText(formatCount(post.fireCount));
            if (tvCommentCount != null) tvCommentCount.setText(formatCount(post.commentCount));

            // Trạng thái đã fire
            if (btnFire != null) {
                btnFire.setAlpha(post.firedByMe ? 1f : 0.55f);
                btnFire.setOnClickListener(v -> {
                    if (fireListener != null) fireListener.onFire(post.postId);
                });
            }

            // Card gắn nhân vật
            if (charCard != null) {
                boolean hasChar = post.characterName != null && !post.characterName.isEmpty();
                charCard.setVisibility(hasChar ? View.VISIBLE : View.GONE);
                if (tvCharName != null && hasChar) {
                    tvCharName.setText("🎭 " + post.characterName);
                }
            }
        }

        private String formatCount(int n) {
            if (n >= 1_000_000) return String.format("%.1fM", n / 1_000_000f);
            if (n >= 1_000)     return String.format("%.1fK", n / 1_000f);
            return String.valueOf(n);
        }
    }
}
