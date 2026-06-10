package com.example.iiawak_mobile.data.model;

public class ChatSession {
    public String botName;
    public String lastMessage;
    public String timeAgo;
    public String emotion; // emoji
    public int altegoLevel; // 0-100
    public int affectionLevel; // 0-100
    public int unreadCount;

    public ChatSession(String botName, String lastMessage, String timeAgo,
                        String emotion, int altegoLevel, int affectionLevel, int unreadCount) {
        this.botName = botName;
        this.lastMessage = lastMessage;
        this.timeAgo = timeAgo;
        this.emotion = emotion;
        this.altegoLevel = altegoLevel;
        this.affectionLevel = affectionLevel;
        this.unreadCount = unreadCount;
    }
}
