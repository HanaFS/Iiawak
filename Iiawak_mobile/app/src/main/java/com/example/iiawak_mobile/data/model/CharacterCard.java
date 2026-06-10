package com.example.iiawak_mobile.data.model;

/**
 * CharacterCard — Model nhân vật hiển thị trong lưới Explore và Community.
 * Mọi trường được điền từ dữ liệu backend thực (GET /api/characters).
 */
public class CharacterCard {
    public String  id;           // MongoDB _id
    public String  name;         // Tên nhân vật
    public String  avatar;       // URL ảnh đại diện
    public String  slogan;       // Câu slogan ngắn
    public String  genre;        // Tag/thể loại đầu tiên
    public String  creatorName;  // Tên người tạo (populate từ creatorId.displayName)
    public int     totalChats;   // Tổng số lượt chat
    public int     totalLikes;   // Tổng số like
    public boolean isAdult;      // ageRating == "adult"
    public boolean isPublic;     // privacy == "public"
    public String  chatMode;     // "normal" | "story" | "both"

    public CharacterCard(String id, String name, String avatar, String slogan,
                         String genre, String creatorName,
                         int totalChats, int totalLikes,
                         boolean isAdult, boolean isPublic, String chatMode) {
        this.id          = id;
        this.name        = name;
        this.avatar      = avatar;
        this.slogan      = slogan;
        this.genre       = genre;
        this.creatorName = creatorName;
        this.totalChats  = totalChats;
        this.totalLikes  = totalLikes;
        this.isAdult     = isAdult;
        this.isPublic    = isPublic;
        this.chatMode    = chatMode != null ? chatMode : "both";
    }
}
