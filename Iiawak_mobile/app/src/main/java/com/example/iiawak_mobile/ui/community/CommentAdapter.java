package com.example.iiawak_mobile.ui.community;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.Comment;
import de.hdodenhof.circleimageview.CircleImageView;

import java.util.List;

public class CommentAdapter extends RecyclerView.Adapter<CommentAdapter.CommentViewHolder> {

    public interface OnCommentLongClickListener {
        void onCommentLongClick(Comment comment);
    }

    private final List<Comment> comments;
    private final OnCommentLongClickListener longClickListener;

    public CommentAdapter(List<Comment> comments, OnCommentLongClickListener longClickListener) {
        this.comments = comments;
        this.longClickListener = longClickListener;
    }

    @NonNull
    @Override
    public CommentViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_comment, parent, false);
        return new CommentViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull CommentViewHolder holder, int position) {
        Comment comment = comments.get(position);
        holder.bind(comment);
        holder.itemView.setOnLongClickListener(v -> {
            if (longClickListener != null) {
                longClickListener.onCommentLongClick(comment);
                return true;
            }
            return false;
        });
    }

    @Override
    public int getItemCount() {
        return comments.size();
    }

    static class CommentViewHolder extends RecyclerView.ViewHolder {
        CircleImageView avatar;
        TextView tvName, tvTime, tvContent;

        CommentViewHolder(@NonNull View itemView) {
            super(itemView);
            avatar = itemView.findViewById(R.id.comment_author_avatar);
            tvName = itemView.findViewById(R.id.comment_author_name);
            tvTime = itemView.findViewById(R.id.comment_time);
            tvContent = itemView.findViewById(R.id.comment_content);
        }

        void bind(Comment comment) {
            if (tvName != null) tvName.setText(comment.authorName);
            if (tvTime != null) tvTime.setText(comment.timeAgo);
            if (tvContent != null) tvContent.setText(comment.content);

            if (avatar != null) {
                if (comment.authorAvatar != null && !comment.authorAvatar.isEmpty()) {
                    Glide.with(itemView.getContext())
                            .load(comment.authorAvatar)
                            .placeholder(R.drawable.ic_nav_profile)
                            .into(avatar);
                } else {
                    avatar.setImageResource(R.drawable.ic_nav_profile);
                }
            }
        }
    }
}
