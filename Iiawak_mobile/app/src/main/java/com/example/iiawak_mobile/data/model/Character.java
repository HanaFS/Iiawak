package com.example.iiawak_mobile.data.model;

import java.util.List;

/**
 * Character — Model nhân vật AI, ánh xạ từ API /api/characters.
 */
public class Character {
    public String id;           // _id từ MongoDB
    public String name;
    public String avatar;       // URL ảnh đại diện
    public String gender;
    public List<String> tags;
    public String slogan;       // Slogan ngắn
    public String privacy;      // "public" | "private"
    public String ageRating;    // "all" | "adult"
    public String chatMode;     // "normal" | "story" | "both"
    public String publicInfo;
    public String personality;
    public String openingLine;
    public String bio;
    public String firstMessage;
    public String status;
    public int totalChats;
    public int totalLikes;
    public boolean isApproved;
    public boolean isBanned;
    public Creator creatorId;   // Populated từ User

    public static class Creator {
        public String _id;
        public String displayName;
        public String avatar;
    }

    /** Có hỗ trợ chế độ Câu Chuyện không */
    public boolean hasStoryMode() {
        return "story".equals(chatMode) || "both".equals(chatMode);
    }

    /** Có hỗ trợ Chat thường không */
    public boolean hasNormalMode() {
        return "normal".equals(chatMode) || "both".equals(chatMode);
    }
}
