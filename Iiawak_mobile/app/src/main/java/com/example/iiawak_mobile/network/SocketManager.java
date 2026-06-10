package com.example.iiawak_mobile.network;

import android.util.Log;
import com.example.iiawak_mobile.config.NetworkConfig;
import io.socket.client.IO;
import io.socket.client.Socket;
import java.net.URISyntaxException;

public class SocketManager {
    private static SocketManager instance;
    private Socket mSocket;
    private static final String TAG = "SocketManager";

    private SocketManager() {
        try {
            IO.Options opts = new IO.Options();
            opts.reconnection = true;
            mSocket = IO.socket(NetworkConfig.BASE_URL, opts);
        } catch (URISyntaxException e) {
            Log.e(TAG, "Socket URL error: ", e);
        }
    }

    public static synchronized SocketManager getInstance() {
        if (instance == null) {
            instance = new SocketManager();
        }
        return instance;
    }

    public void connect(String authHeader) {
        if (mSocket != null && !mSocket.connected()) {
            // Update auth token if needed, socket.io 2.x doesn't support auth easily via options after init
            // But we can emit it immediately on connect.
            mSocket.connect();
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
