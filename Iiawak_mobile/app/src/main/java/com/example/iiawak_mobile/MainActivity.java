package com.example.iiawak_mobile;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.navigation.NavController;
import androidx.navigation.NavGraph;
import androidx.navigation.NavInflater;
import androidx.navigation.fragment.NavHostFragment;
import androidx.navigation.ui.NavigationUI;
import com.example.iiawak_mobile.data.UserSession;
import com.google.android.material.bottomnavigation.BottomNavigationView;

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
}