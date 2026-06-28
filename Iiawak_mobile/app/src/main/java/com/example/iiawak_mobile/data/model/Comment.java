package com.example.iiawak_mobile.data.model;

/**
 * Comment — Model bình luận bài đăng cộng đồng.
 */
public class Comment {
    public String id;
    public String postId;
    public String authorId;
    public String authorName;
    public String authorAvatar;
    public String content;
    public String timeAgo;
    public int likeCount;

    public Comment(String id, String postId, String authorId, String authorName,
                   String authorAvatar, String content, String timeAgo, int likeCount) {
        this.id = id;
        this.postId = postId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorAvatar = authorAvatar;
        this.content = content;
        this.timeAgo = timeAgo;
        this.likeCount = likeCount;
    }
}
