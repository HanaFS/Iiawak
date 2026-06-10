package com.example.iiawak_mobile.data.model;

/**
 * User — Model dữ liệu người dùng, ánh xạ từ API response.
 */
public class User {
    public String id;
    public String username;
    public String displayName;
    public String email;
    public String avatar;
    public String bio;
    public String role;        // "user" | "admin"
    public String status;      // "active" | "banned"
    public int    kchBalance;
    public int    strikeCount;
    public int    followingCount;
    public int    followersCount;

    public User() {}

    public User(String id, String username, String displayName, String email,
                String avatar, String role, int kchBalance) {
        this.id          = id;
        this.username    = username;
        this.displayName = displayName;
        this.email       = email;
        this.avatar      = avatar;
        this.role        = role;
        this.kchBalance  = kchBalance;
    }

    /** Tên hiển thị ngắn cho UI */
    public String getShortDisplay() {
        return displayName != null ? displayName : username;
    }
}
