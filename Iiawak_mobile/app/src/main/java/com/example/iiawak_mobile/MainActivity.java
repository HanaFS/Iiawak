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
import android.content.Intent;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {

    private NavController navController;
    private BottomNavigationView bottomNav;

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
        
        // Tránh bị duplicate listener nếu Activity recreate
        socket.off("admin:action");
        socket.on("admin:action", args -> {
            if (args.length == 0) return;
            try {
                JSONObject data = (JSONObject) args[0];
                String action = data.optString("action");
                
                runOnUiThread(() -> {
                    if ("ban".equals(action)) {
                        Toast.makeText(this, "Tài khoản của bạn đã bị khóa bởi Admin.", Toast.LENGTH_LONG).show();
                        UserSession.getInstance(this).logout();
                        SocketManager.getInstance().disconnect();
                        
                        Intent intent = new Intent(this, MainActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                        finish();
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
    protected void onDestroy() {
        super.onDestroy();
        // Optional: disconnect socket here or let it run in background
    }
}