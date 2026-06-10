package com.example.iiawak_mobile.ui.community;

/**
 * FeedPost — Model bài đăng trong cộng đồng.
 * Mọi trường đều được điền từ dữ liệu backend thực.
 */
public class FeedPost {
    public String postId;
    public String authorId;
    public String authorName;
    public String authorAvatar;
    public String content;
    public String characterName;   // null nếu không gắn nhân vật
    public String characterTagId;  // _id của nhân vật được gắn tag
    public String timeAgo;
    public int    fireCount;       // số "Lửa" (like)
    public int    commentCount;
    public boolean firedByMe;      // người dùng hiện tại đã like chưa

    /** Constructor đầy đủ từ API response */
    public FeedPost(String postId, String authorId, String authorName,
                    String authorAvatar, String content,
                    String characterName, String characterTagId,
                    String timeAgo, int fireCount, int commentCount,
                    boolean firedByMe) {
        this.postId        = postId;
        this.authorId      = authorId;
        this.authorName    = authorName;
        this.authorAvatar  = authorAvatar;
        this.content       = content;
        this.characterName = characterName;
        this.characterTagId = characterTagId;
        this.timeAgo       = timeAgo;
        this.fireCount     = fireCount;
        this.commentCount  = commentCount;
        this.firedByMe     = firedByMe;
    }
}
