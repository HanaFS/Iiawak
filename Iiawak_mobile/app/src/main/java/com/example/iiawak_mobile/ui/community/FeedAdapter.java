package com.example.iiawak_mobile.ui.community;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.AsyncTask;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.FeedPost;
import de.hdodenhof.circleimageview.CircleImageView;

import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;

/**
 * FeedAdapter — Bind dữ liệu FeedPost thực từ backend lên item_feed_post.
 */
public class FeedAdapter extends RecyclerView.Adapter<FeedAdapter.FeedViewHolder> {

    public interface FeedInteractionListener {
        void onFireClick(String postId);
        void onCommentClick(String postId);
    }

    private final List<FeedPost>          posts;
    private final FeedInteractionListener listener;

    public FeedAdapter(List<FeedPost> posts, FeedInteractionListener listener) {
        this.posts    = posts;
        this.listener = listener;
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
        holder.bind(post, listener);
    }

    @Override
    public int getItemCount() { return posts.size(); }

    // ─── ViewHolder ──────────────────────────────────────────────────────────

    static class FeedViewHolder extends RecyclerView.ViewHolder {
        CircleImageView authorAvatar;
        TextView tvAuthorName, tvTimeAgo, tvContent, tvCharName, tvFireCount;
        View     charCard, btnFire, btnComment;
        com.google.android.material.button.MaterialButton btnCommentView;

        FeedViewHolder(View v) {
            super(v);
            authorAvatar   = v.findViewById(R.id.feed_author_avatar);
            tvAuthorName   = v.findViewById(R.id.feed_author_name);
            tvTimeAgo      = v.findViewById(R.id.feed_time);
            tvContent      = v.findViewById(R.id.feed_content);
            charCard       = v.findViewById(R.id.feed_char_card);
            tvCharName     = v.findViewById(R.id.feed_char_name);
            tvFireCount    = v.findViewById(R.id.feed_reaction_count);
            btnFire        = v.findViewById(R.id.btn_fire_post);
            btnCommentView = v.findViewById(R.id.btn_comment);
        }

        void bind(FeedPost post, FeedInteractionListener listener) {
            if (tvAuthorName != null) tvAuthorName.setText(post.authorName);
            if (tvTimeAgo    != null) tvTimeAgo.setText(post.timeAgo);
            if (tvContent    != null) tvContent.setText(post.content);

            // Avatar 
            if (authorAvatar != null) {
                if (post.authorAvatar != null && !post.authorAvatar.isEmpty()) {
                    Glide.with(itemView.getContext())
                            .load(post.authorAvatar)
                            .placeholder(R.drawable.ic_nav_profile)
                            .into(authorAvatar);
                } else {
                    authorAvatar.setImageResource(R.drawable.ic_nav_profile);
                }
            }

            // Đếm fire / comment
            if (tvFireCount != null) {
                tvFireCount.setText(formatCount(post.fireCount));
            }
            if (btnCommentView != null) {
                btnCommentView.setText("💬 " + formatCount(post.commentCount));
            }

            // Trạng thái đã fire
            if (btnFire != null) {
                btnFire.setAlpha(post.firedByMe ? 1f : 0.55f);
                btnFire.setOnClickListener(v -> {
                    if (listener != null) listener.onFireClick(post.postId);
                });
            }

            // Nhấn comment
            if (btnCommentView != null) {
                btnCommentView.setOnClickListener(v -> {
                    if (listener != null) listener.onCommentClick(post.postId);
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
