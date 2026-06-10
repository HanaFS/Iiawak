package com.example.iiawak_mobile;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.animation.ScaleAnimation;
import android.widget.LinearLayout;
import androidx.appcompat.app.AppCompatActivity;
import com.example.iiawak_mobile.data.UserSession;

public class SplashActivity extends AppCompatActivity {

    private static final int SPLASH_DURATION = 2000;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        // Animate logo
        LinearLayout logoContainer = findViewById(R.id.splash_logo_container);
        if (logoContainer != null) {
            AnimationSet animSet = new AnimationSet(true);
            AlphaAnimation fadeIn = new AlphaAnimation(0f, 1f);
            fadeIn.setDuration(700);
            ScaleAnimation scaleIn = new ScaleAnimation(
                    0.8f, 1f, 0.8f, 1f,
                    Animation.RELATIVE_TO_SELF, 0.5f,
                    Animation.RELATIVE_TO_SELF, 0.5f);
            scaleIn.setDuration(700);
            animSet.addAnimation(fadeIn);
            animSet.addAnimation(scaleIn);
            animSet.setFillAfter(true);
            logoContainer.startAnimation(animSet);
        }

        // Navigate sau delay
        new Handler().postDelayed(() -> {
            Intent intent = new Intent(SplashActivity.this, MainActivity.class);

            // Truyền trạng thái đăng nhập để MainActivity set đúng startDestination
            boolean isLoggedIn = UserSession.getInstance(this).isLoggedIn();
            intent.putExtra("is_logged_in", isLoggedIn);

            startActivity(intent);
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            finish();
        }, SPLASH_DURATION);
    }
}
