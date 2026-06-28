package com.example.iiawak_mobile.network;

import android.content.Context;
import com.example.iiawak_mobile.config.NetworkConfig;
import com.example.iiawak_mobile.data.UserSession;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * ApiClient — HTTP client dùng chung cho toàn bộ app.
 * Tự động đính kèm Authorization header khi có token.
 * Dùng HttpURLConnection để không cần thư viện ngoài.
 *
 * Sử dụng:
 *   ApiClient.get(ctx, "/characters", callback);
 *   ApiClient.post(ctx, "/auth/login", body, callback);
 */
public class ApiClient {

    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final int READ_TIMEOUT_MS    = 60_000; // Gemini cần thêm thời gian

    // ─── Callback interface ───────────────────────────────────────────────────

    public interface ApiCallback {
        void onSuccess(JSONObject response);
        void onError(String errorMessage, int statusCode);
    }

    // ─── GET ──────────────────────────────────────────────────────────────────

    public static void get(Context context, String endpoint, ApiCallback callback) {
        executeAsync(() -> {
            try {
                HttpURLConnection conn = openConnection(context, endpoint, "GET");
                handleResponse(context, conn, callback);
            } catch (Exception e) {
                postError(callback, "Lỗi kết nối: " + e.getMessage(), 0);
            }
        });
    }

    // ─── POST ─────────────────────────────────────────────────────────────────

    public static void post(Context context, String endpoint, JSONObject body, ApiCallback callback) {
        executeAsync(() -> {
            try {
                HttpURLConnection conn = openConnection(context, endpoint, "POST");
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                if (body != null) {
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(body.toString().getBytes("UTF-8"));
                        os.flush();
                    }
                }
                handleResponse(context, conn, callback);
            } catch (Exception e) {
                postError(callback, "Lỗi kết nối: " + e.getMessage(), 0);
            }
        });
    }

    // ─── PUT ──────────────────────────────────────────────────────────────────

    public static void put(Context context, String endpoint, JSONObject body, ApiCallback callback) {
        executeAsync(() -> {
            try {
                HttpURLConnection conn = openConnection(context, endpoint, "PUT");
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                if (body != null) {
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(body.toString().getBytes("UTF-8"));
                        os.flush();
                    }
                }
                handleResponse(context, conn, callback);
            } catch (Exception e) {
                postError(callback, "Lỗi kết nối: " + e.getMessage(), 0);
            }
        });
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    public static void delete(Context context, String endpoint, ApiCallback callback) {
        executeAsync(() -> {
            try {
                HttpURLConnection conn = openConnection(context, endpoint, "DELETE");
                handleResponse(context, conn, callback);
            } catch (Exception e) {
                postError(callback, "Lỗi kết nối: " + e.getMessage(), 0);
            }
        });
    }

    // ─── Helpers nội bộ ───────────────────────────────────────────────────────

    private static HttpURLConnection openConnection(Context context, String endpoint, String method)
            throws Exception {
        String fullUrl = endpoint.startsWith("http")
                ? endpoint
                : NetworkConfig.BASE_URL + endpoint;
        URL url = new URL(fullUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(CONNECT_TIMEOUT_MS);
        conn.setReadTimeout(READ_TIMEOUT_MS);
        conn.setUseCaches(false); // Ngăn ngừa cache dữ liệu cũ
        conn.setRequestProperty("Accept", "application/json");

        // Đính kèm JWT token nếu có
        String authHeader = UserSession.getInstance(context).getAuthHeader();
        if (!authHeader.isEmpty()) {
            conn.setRequestProperty("Authorization", authHeader);
        }
        return conn;
    }

    private static void handleResponse(Context context, HttpURLConnection conn, ApiCallback callback) {
        try {
            int code = conn.getResponseCode();
            InputStream is = (code < 400) ? conn.getInputStream() : conn.getErrorStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();
            conn.disconnect();

            String responseBody = sb.toString().trim();
            if (responseBody.startsWith("<!DOCTYPE") || responseBody.startsWith("<html")) {
                postError(callback, "Server trả về HTML (lỗi 404 hoặc 500). Vui lòng kiểm tra Backend.", code);
                return;
            }

            JSONObject json = new JSONObject(responseBody);
            if (code < 400) {
                postSuccess(callback, json);
            } else {
                String msg = json.optString("message", "Lỗi server: " + code);
                
                if (code == 401 || (code == 403 && (msg.toLowerCase().contains("khóa") || msg.toLowerCase().contains("khoá")))) {
                    if (context != null) {
                        UserSession.getInstance(context).logout();
                        // Phát broadcast để Activity điều hướng về màn login
                        android.content.Intent intent = new android.content.Intent("com.example.iiawak_mobile.SESSION_EXPIRED");
                        if (code == 403) {
                            intent.putExtra("reason", "banned");
                            intent.putExtra("message", msg);
                        }
                        context.sendBroadcast(intent);
                    }
                }
                
                postError(callback, msg, code);
            }
        } catch (Exception e) {
            postError(callback, "Lỗi xử lý phản hồi: " + e.getMessage(), 0);
        }
    }

    private static void executeAsync(Runnable task) {
        new Thread(task).start();
    }

    private static void postSuccess(ApiCallback callback, JSONObject json) {
        new android.os.Handler(android.os.Looper.getMainLooper())
                .post(() -> callback.onSuccess(json));
    }

    private static void postError(ApiCallback callback, String msg, int code) {
        new android.os.Handler(android.os.Looper.getMainLooper())
                .post(() -> callback.onError(msg, code));
    }
}
