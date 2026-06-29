package com.example.iiawak_mobile.network;

import android.util.Log;
import com.example.iiawak_mobile.config.NetworkConfig;
import io.socket.client.IO;
import io.socket.client.Socket;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

public class SocketManager {
    private static SocketManager instance;
    private Socket mSocket;
    private static final String TAG = "SocketManager";

    private SocketManager() {}

    public static synchronized SocketManager getInstance() {
        if (instance == null) {
            instance = new SocketManager();
        }
        return instance;
    }

    public void connect(String authHeader) {
        if (authHeader == null || authHeader.isEmpty()) return;

        // Extract token from Bearer header
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

        try {
            if (mSocket != null) {
                mSocket.disconnect();
                mSocket.off();
            }

            IO.Options opts = new IO.Options();
            opts.reconnection = true;
            
            // Set auth token for handshake
            Map<String, String> auth = new HashMap<>();
            auth.put("token", token);
            opts.auth = auth;

            mSocket = IO.socket(NetworkConfig.BASE_URL, opts);
            mSocket.connect();
            Log.d(TAG, "Socket connecting with token...");

        } catch (URISyntaxException e) {
            Log.e(TAG, "Socket URL error: ", e);
        }
    }

    public void disconnect() {
        if (mSocket != null && mSocket.connected()) {
            mSocket.disconnect();
        }
    }

    public Socket getSocket() {
        return mSocket;
    }
}
