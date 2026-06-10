package com.example.iiawak_mobile.data.model;

public class ChatMessage {
    public String text;
    public boolean isFromUser;
    public String time;

    public ChatMessage(String text, boolean isFromUser) {
        this.text = text;
        this.isFromUser = isFromUser;
        // Format current time HH:mm
        java.util.Calendar cal = java.util.Calendar.getInstance();
        this.time = String.format("%02d:%02d", cal.get(java.util.Calendar.HOUR_OF_DAY),
                cal.get(java.util.Calendar.MINUTE));
    }
}
