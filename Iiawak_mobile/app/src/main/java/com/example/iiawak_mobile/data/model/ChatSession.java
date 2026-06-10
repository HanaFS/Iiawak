package com.example.iiawak_mobile.data.model;

/**
 * ChatSession — Model phiên chat AI (user ↔ nhân vật).
 * Được populate từ GET /api/chat/sessions.
 */
public class ChatSession {
    public String sessionId;     // MongoDB _id của ChatSession
    public String characterId;   // _id của nhân vật
    public String botName;       // Tên nhân vật
    public String avatarUrl;     // URL ảnh đại diện nhân vật
    public String lastMessage;   // Nội dung tin nhắn cuối
    public String timeAgo;       // Thời gian tương đối (tính ở client)
    public String emotion;       // Emoji cảm xúc
    public String chatMode;      // "normal" | "story"
    public int    altegoLevel;   // 0-100
    public int    affectionLevel;// 0-100
    public int    unreadCount;   // Số tin chưa đọc

    public ChatSession(String sessionId, String characterId,
                       String botName, String avatarUrl,
                       String lastMessage, String timeAgo,
                       String emotion, String chatMode,
                       int altegoLevel, int affectionLevel, int unreadCount) {
        this.sessionId      = sessionId;
        this.characterId    = characterId;
        this.botName        = botName;
        this.avatarUrl      = avatarUrl;
        this.lastMessage    = lastMessage;
        this.timeAgo        = timeAgo;
        this.emotion        = emotion;
        this.chatMode       = chatMode != null ? chatMode : "normal";
        this.altegoLevel    = altegoLevel;
        this.affectionLevel = affectionLevel;
        this.unreadCount    = unreadCount;
    }
}
