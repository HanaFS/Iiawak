package com.example.iiawak_mobile;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.navigation.NavController;
import androidx.navigation.NavGraph;
import androidx.navigation.NavInflater;
import androidx.navigation.fragment.NavHostFragment;
import androidx.navigation.ui.NavigationUI;
import com.example.iiawak_mobile.data.UserSession;
import com.example.iiawak_mobile.network.SocketManager;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private NavController navController;
    private BottomNavigationView bottomNav;

    // ── Broadcast Receiver xử lý token hết hạn ────────────────────────────────
    private final BroadcastReceiver sessionExpiredReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("com.example.iiawak_mobile.SESSION_EXPIRED".equals(intent.getAction())) {
                String reason = intent.getStringExtra("reason");
                if ("banned".equals(reason)) {
                    showBannedDialog();
                } else {
                    Toast.makeText(MainActivity.this,
                            "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
                            Toast.LENGTH_SHORT).show();
                }
                
                SocketManager.getInstance().disconnect();
                if (navController != null && navController.getCurrentDestination() != null 
                        && navController.getCurrentDestination().getId() != R.id.loginFragment) {
                    navController.navigate(R.id.loginFragment);
                }
            }
        }
    };

    private void showBannedDialog() {
        new com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
                .setTitle("Tài khoản bị khoá")
                .setMessage("Tài khoản của bạn đã bị khoá.\n\nNếu bạn muốn khiếu nại gỡ khoá, hãy gửi email cho Admin để được xem xét.\n\n📧 Email: admin@iiawak.com\n📝 Nhớ gửi kèm Username và Tên của bạn nhé!")
                .setPositiveButton("Đã hiểu", null)
                .setCancelable(false)
                .show();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Setup NavHostFragment
        NavHostFragment navHostFragment = (NavHostFragment) getSupportFragmentManager()
                .findFragmentById(R.id.nav_host_fragment);
        if (navHostFragment == null) return;

        navController = navHostFragment.getNavController();

        // Đọc trạng thái đăng nhập trực tiếp từ UserSession (đáng tin cậy hơn Intent)
        boolean isLoggedIn = UserSession.getInstance(this).isLoggedIn();

        NavInflater inflater = navController.getNavInflater();
        NavGraph graph = inflater.inflate(R.navigation.nav_main);
        graph.setStartDestination(isLoggedIn ? R.id.communityFragment : R.id.loginFragment);
        navController.setGraph(graph);

        // Khởi tạo Socket global để nhận thông báo admin (nếu đã đăng nhập)
        if (isLoggedIn) {
            String authHeader = UserSession.getInstance(this).getAuthHeader();
            SocketManager.getInstance().connect(authHeader);
            setupGlobalSocketListeners();
        }

        // Setup Bottom Navigation
        bottomNav = findViewById(R.id.bottom_nav);
        if (bottomNav != null) {
            NavigationUI.setupWithNavController(bottomNav, navController);
        }

        // Ẩn/hiện bottom nav theo destination
        navController.addOnDestinationChangedListener((controller, destination, arguments) -> {
            int id = destination.getId();
            boolean showNav = (id == R.id.communityFragment
                    || id == R.id.exploreFragment
                    || id == R.id.chatListFragment
                    || id == R.id.creatorFragment
                    || id == R.id.profileFragment);

            if (bottomNav != null) {
                bottomNav.setVisibility(showNav
                        ? android.view.View.VISIBLE
                        : android.view.View.GONE);
            }
        });
    }

    @Override
    public boolean onSupportNavigateUp() {
        return navController != null && navController.navigateUp()
                || super.onSupportNavigateUp();
    }

    private void setupGlobalSocketListeners() {
        io.socket.client.Socket socket = SocketManager.getInstance().getSocket();
        if (socket == null) return;
        
        // Lắng nghe lỗi kết nối (Auth error)
        socket.off(io.socket.client.Socket.EVENT_CONNECT_ERROR);
        socket.on(io.socket.client.Socket.EVENT_CONNECT_ERROR, args -> {
            if (args.length > 0 && args[0] instanceof Exception) {
                String msg = ((Exception) args[0]).getMessage();
                Log.e(TAG, "Socket connect error: " + msg);
                
                // Nếu là lỗi Auth từ backend (token invalid/expired)
                if (msg != null && (msg.contains("token") || msg.contains("Authentication"))) {
                    runOnUiThread(() -> {
                        Toast.makeText(this, "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", Toast.LENGTH_SHORT).show();
                        UserSession.getInstance(this).logout();
                        SocketManager.getInstance().disconnect();
                        
                        Intent intent = new Intent(this, MainActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                        finish();
                    });
                }
            }
        });

        // Tránh bị duplicate listener nếu Activity recreate
        socket.off("admin:action");
        socket.on("admin:action", args -> {
            if (args.length == 0) return;
            try {
                JSONObject data = (JSONObject) args[0];
                String action = data.optString("action");
                
                runOnUiThread(() -> {
                    if ("ban".equals(action)) {
                        showBannedDialog();
                        UserSession.getInstance(this).logout();
                        SocketManager.getInstance().disconnect();
                        
                        // We shouldn't finish the activity immediately or the dialog disappears.
                        // Since we just logged out, we can navigate to login if not already there
                        if (navController != null && navController.getCurrentDestination() != null 
                                && navController.getCurrentDestination().getId() != R.id.loginFragment) {
                            navController.navigate(R.id.loginFragment);
                        }
                    } else if ("warn".equals(action)) {
                        String reason = data.optString("reason", "Vi phạm quy định");
                        new AlertDialog.Builder(this)
                            .setTitle("Cảnh báo từ Admin")
                            .setMessage(reason)
                            .setPositiveButton("Đã hiểu", null)
                            .show();
                    } else if ("kch_update".equals(action)) {
                        int newBalance = data.optInt("newBalance");
                        int amount = data.optInt("amount");
                        UserSession.getInstance(this).setKchBalance(newBalance);
                        String type = amount >= 0 ? "cộng" : "trừ";
                        Toast.makeText(this, "Admin vừa " + type + " " + Math.abs(amount) + " KCH. Số dư mới: " + newBalance, Toast.LENGTH_LONG).show();
                    }
                });
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        IntentFilter filter = new IntentFilter("com.example.iiawak_mobile.SESSION_EXPIRED");
        registerReceiver(sessionExpiredReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
    }

    @Override
    protected void onPause() {
        super.onPause();
        try { unregisterReceiver(sessionExpiredReceiver); } catch (Exception ignored) {}
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Optional: disconnect socket here or let it run in background
    }
}