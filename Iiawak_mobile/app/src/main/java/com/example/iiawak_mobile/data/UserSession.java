package com.example.iiawak_mobile.data;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * UserSession — Quản lý trạng thái đăng nhập bằng SharedPreferences.
 * Lưu JWT token để xác thực các API yêu cầu đăng nhập.
 */
public class UserSession {

    private static final String PREF_NAME = "iiawak_session";
    private static final String KEY_IS_LOGGED_IN   = "is_logged_in";
    private static final String KEY_TOKEN           = "jwt_token";
    private static final String KEY_USER_ID         = "user_id";
    private static final String KEY_USERNAME        = "username";
    private static final String KEY_DISPLAY_NAME    = "display_name";
    private static final String KEY_EMAIL           = "email";
    private static final String KEY_ROLE            = "role";
    private static final String KEY_KCH_BALANCE     = "kch_balance";
    private static final String KEY_CREATOR_BALANCE = "creator_balance";
    private static final String KEY_IS_CREATOR      = "is_creator";
    private static final String KEY_APP_LOCK_PIN    = "app_lock_pin";
    private static final String KEY_APP_LOCK_ENABLED = "app_lock_enabled";
    private static final String KEY_AVATAR          = "avatar_url";
    private static final String KEY_CHECKED_DAYS    = "checked_in_days";
    private static final String KEY_TRANSACTIONS    = "transactions";
    private static final String KEY_CHECKIN_STREAK  = "checkin_streak";
    private static final String KEY_LAST_CHECKIN_DATE = "last_checkin_date";

    private static UserSession instance;
    private final SharedPreferences prefs;

    private UserSession(Context context) {
        prefs = context.getApplicationContext()
                .getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public static synchronized UserSession getInstance(Context context) {
        if (instance == null) {
            instance = new UserSession(context);
        }
        return instance;
    }

    // ======================== Login / Logout ========================

    /**
     * Lưu thông tin đăng nhập sau khi nhận response từ API.
     * @param token    JWT token từ server
     * @param userId   _id của user trong MongoDB
     * @param username username
     * @param displayName tên hiển thị
     * @param email    email
     * @param role     "user" | "admin"
     * @param kchBalance số dư Kim Cương Hồng
     */
    public void login(String token, String userId, String username,
                      String displayName, String email, String role, int kchBalance) {
        prefs.edit()
                .putBoolean(KEY_IS_LOGGED_IN, true)
                .putString(KEY_TOKEN, token)
                .putString(KEY_USER_ID, userId)
                .putString(KEY_USERNAME, username)
                .putString(KEY_DISPLAY_NAME, displayName)
                .putString(KEY_EMAIL, email)
                .putString(KEY_ROLE, role != null ? role : "user")
                .putInt(KEY_KCH_BALANCE, kchBalance)
                .putBoolean(KEY_IS_CREATOR, false)
                .apply();
    }

    /** Overload giữ nguyên tương thích với code cũ (không có token/role) */
    public void login(String userId, String username, String displayName, String email) {
        prefs.edit()
                .putBoolean(KEY_IS_LOGGED_IN, true)
                .putString(KEY_USER_ID, userId)
                .putString(KEY_USERNAME, username)
                .putString(KEY_DISPLAY_NAME, displayName)
                .putString(KEY_EMAIL, email)
                .putString(KEY_ROLE, "user")
                .apply();
    }

    public void logout() {
        prefs.edit().clear().apply();
    }

    // ======================== Getters ========================

    public boolean isLoggedIn() {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false);
    }

    /** JWT token để đặt vào header: Authorization: Bearer <token> */
    public String getToken() {
        return prefs.getString(KEY_TOKEN, "");
    }

    /** Header giá trị cho Authorization */
    public String getAuthHeader() {
        String token = getToken();
        return token.isEmpty() ? "" : "Bearer " + token;
    }

    public String getUserId() {
        return prefs.getString(KEY_USER_ID, "");
    }

    public String getUsername() {
        return prefs.getString(KEY_USERNAME, "");
    }

    public String getDisplayName() {
        return prefs.getString(KEY_DISPLAY_NAME, "Người dùng");
    }

    public String getEmail() {
        return prefs.getString(KEY_EMAIL, "");
    }

    public String getRole() {
        return prefs.getString(KEY_ROLE, "user");
    }

    public boolean isAdmin() {
        return "admin".equals(getRole());
    }

    public int getKchBalance() {
        return prefs.getInt(KEY_KCH_BALANCE, 0);
    }

    /** Alias cho compatibility với các Fragment cũ */
    public int getFreeHearts() {
        return getKchBalance();
    }

    public boolean isCreator() {
        return prefs.getBoolean(KEY_IS_CREATOR, false);
    }

    // ======================== Updaters ========================

    public void setKchBalance(int amount) {
        prefs.edit().putInt(KEY_KCH_BALANCE, amount).apply();
    }

    public int getCreatorBalance() {
        return prefs.getInt(KEY_CREATOR_BALANCE, 0); // Default to 0
    }

    public void setCreatorBalance(int amount) {
        prefs.edit().putInt(KEY_CREATOR_BALANCE, amount).apply();
    }

    /** Alias cho compatibility với các Fragment cũ */
    public void setFreeHearts(int amount) {
        setKchBalance(amount);
    }

    public void addKch(int amount) {
        int current = getKchBalance();
        prefs.edit().putInt(KEY_KCH_BALANCE, current + amount).apply();
    }

    public void addFreeHearts(int amount) {
        addKch(amount);
    }

    public void spendKch(int amount) {
        int balance = getKchBalance();
        prefs.edit().putInt(KEY_KCH_BALANCE, Math.max(0, balance - amount)).apply();
    }

    public void updateDisplayName(String name) {
        prefs.edit().putString(KEY_DISPLAY_NAME, name).apply();
    }

    public void setDisplayName(String name) {
        prefs.edit().putString(KEY_DISPLAY_NAME, name).apply();
    }

    public void setUsername(String username) {
        prefs.edit().putString(KEY_USERNAME, username).apply();
    }

    public String getAvatarUrl() {
        return prefs.getString(KEY_AVATAR, "");
    }

    public void setAvatarUrl(String url) {
        prefs.edit().putString(KEY_AVATAR, url).apply();
    }

    public void setCreator(boolean isCreator) {
        prefs.edit().putBoolean(KEY_IS_CREATOR, isCreator).apply();
    }

    public void updateToken(String token) {
        prefs.edit().putString(KEY_TOKEN, token).apply();
    }

    // ======================== App Lock ========================

    public boolean isAppLockEnabled() {
        return prefs.getBoolean(KEY_APP_LOCK_ENABLED, false);
    }

    public void setAppLockEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_APP_LOCK_ENABLED, enabled).apply();
    }

    public String getAppLockPin() {
        return prefs.getString(KEY_APP_LOCK_PIN, "");
    }

    public void setAppLockPin(String pin) {
        prefs.edit().putString(KEY_APP_LOCK_PIN, pin).apply();
    }

    // ======================== Check-in Data ========================

    public java.util.Set<String> getCheckedInDays() {
        return prefs.getStringSet(KEY_CHECKED_DAYS, new java.util.HashSet<>());
    }

    public void setCheckedInDays(java.util.Set<String> days) {
        prefs.edit().putStringSet(KEY_CHECKED_DAYS, days).apply();
    }

    public void addCheckedInDay(String dateStr) {
        java.util.Set<String> days = new java.util.HashSet<>(getCheckedInDays());
        days.add(dateStr);
        setCheckedInDays(days);
    }

    public int getCheckInStreak() {
        return prefs.getInt(KEY_CHECKIN_STREAK, 0);
    }

    public void setCheckInStreak(int streak) {
        prefs.edit().putInt(KEY_CHECKIN_STREAK, streak).apply();
    }

    public String getLastCheckInDate() {
        return prefs.getString(KEY_LAST_CHECKIN_DATE, "");
    }

    public void setLastCheckInDate(String dateStr) {
        prefs.edit().putString(KEY_LAST_CHECKIN_DATE, dateStr).apply();
    }

    public void addTransaction(String title, int amount, String date) {
        try {
            org.json.JSONArray txs = getTransactions();
            org.json.JSONObject tx = new org.json.JSONObject();
            tx.put("description", title);
            tx.put("amount", amount);
            tx.put("date", date);
            txs.put(tx);
            prefs.edit().putString(KEY_TRANSACTIONS, txs.toString()).apply();
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
    }

    public org.json.JSONArray getTransactions() {
        String data = prefs.getString(KEY_TRANSACTIONS, "[]");
        try {
            return new org.json.JSONArray(data);
        } catch (org.json.JSONException e) {
            return new org.json.JSONArray();
        }
    }
}
