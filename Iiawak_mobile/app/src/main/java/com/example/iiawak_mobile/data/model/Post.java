package com.example.iiawak_mobile.data.model;

/**
 * Post — Model bài đăng cộng đồng, ánh xạ từ API /api/community/feed.
 */
public class Post {
    public String id;           // _id từ MongoDB
    public String content;
    public String[] images;     // URLs ảnh đính kèm
    public int fireCount;
    public int viewCount;
    public int commentCount;
    public boolean isViral;
    public boolean isFired;     // User hiện tại đã thả lửa chưa
    public String createdAt;

    // Populated fields
    public Author authorId;
    public CharacterTag characterTag;

    public static class Author {
        public String _id;
        public String displayName;
        public String username;
        public String avatar;
    }

    public static class CharacterTag {
        public String _id;
        public String name;
        public String avatar;
    }
}
