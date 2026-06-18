package com.example.iiawak_mobile.ui.profile;

import android.graphics.Color;
import android.graphics.Typeface;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import java.util.Set;

/**
 * CalendarDayAdapter — Hiển thị lịch điểm danh tháng.
 *
 * Quy tắc hiển thị:
 *  - Ngày đã điểm danh: pink border + overlay ✓
 *  - Ngày hôm nay chưa điểm: viền sáng (glow), có thể bấm để điểm danh
 *  - Ngày tương lai: mờ, không thể bấm
 *  - Ngày quá khứ bỏ lỡ: xám, không thể bấm
 *  - Ngày milestone (7, 14, 21, 28): reward 200 💎, màu vàng
 */
public class CalendarDayAdapter extends RecyclerView.Adapter<CalendarDayAdapter.DayViewHolder> {

    private static final int REWARD_NORMAL    = 100;
    private static final int REWARD_MILESTONE = 200;

    // Màu sắc
    private static final String COLOR_PINK        = "#E91E8C";
    private static final String COLOR_PINK_BORDER = "#FF69B4";
    private static final String COLOR_GOLD        = "#FFD700";
    private static final String COLOR_WHITE       = "#FFFFFF";
    private static final String COLOR_GRAY        = "#555555";
    private static final String COLOR_GRAY_BORDER = "#33FFFFFF";
    private static final String COLOR_TODAY_GLOW  = "#FF69B4";

    private final int totalDays;
    private final Set<Integer> checkedDays;
    private final int today;
    private final OnCheckInListener listener;

    public interface OnCheckInListener {
        void onCheckIn(int day, int rewardAmount);
    }

    public CalendarDayAdapter(int totalDays, Set<Integer> checkedDays, int today, OnCheckInListener listener) {
        this.totalDays   = totalDays;
        this.checkedDays = (checkedDays != null) ? checkedDays : new java.util.HashSet<>();
        this.today       = today;
        this.listener    = listener;
    }

    @NonNull
    @Override
    public DayViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_calendar_day, parent, false);
        return new DayViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull DayViewHolder holder, int position) {
        int day = position + 1;

        boolean isChecked   = checkedDays.contains(day);
        boolean isToday     = (day == today);
        boolean isPast      = (day < today);
        boolean isFuture    = (day > today);
        boolean isMilestone = (day % 7 == 0); // ngày 7, 14, 21, 28

        // ── Tên ngày ──────────────────────────────────────────────────────────
        holder.txtDay.setText(
                holder.itemView.getContext().getString(R.string.day_format, day));

        // ── Phần thưởng ───────────────────────────────────────────────────────
        int reward = isMilestone ? REWARD_MILESTONE : REWARD_NORMAL;
        holder.txtRewardAmount.setText(String.valueOf(reward));

        // ── Trạng thái hiển thị ───────────────────────────────────────────────
        if (isChecked) {
            // Đã điểm danh: pink border + overlay ✓
            holder.overlayClaimed.setVisibility(View.VISIBLE);
            holder.cardReward.setStrokeColor(Color.parseColor(COLOR_PINK));
            holder.cardReward.setStrokeWidth(3);
            holder.txtDay.setTextColor(Color.parseColor(COLOR_PINK));
            holder.txtDay.setTypeface(null, Typeface.BOLD);
            holder.txtRewardAmount.setTextColor(
                    isMilestone ? Color.parseColor(COLOR_GOLD) : Color.parseColor(COLOR_PINK));

        } else if (isToday) {
            // Hôm nay chưa điểm: viền sáng, pulse animation nếu có
            holder.overlayClaimed.setVisibility(View.GONE);
            holder.cardReward.setStrokeColor(Color.parseColor(COLOR_TODAY_GLOW));
            holder.cardReward.setStrokeWidth(5);
            holder.txtDay.setTextColor(Color.WHITE);
            holder.txtDay.setTypeface(null, Typeface.BOLD);
            holder.txtRewardAmount.setTextColor(
                    isMilestone ? Color.parseColor(COLOR_GOLD) : Color.WHITE);

        } else if (isFuture) {
            // Ngày tương lai: mờ
            holder.overlayClaimed.setVisibility(View.GONE);
            holder.cardReward.setStrokeColor(Color.parseColor(COLOR_GRAY_BORDER));
            holder.cardReward.setStrokeWidth(1);
            holder.txtDay.setTextColor(Color.parseColor(COLOR_GRAY));
            holder.txtDay.setTypeface(null, Typeface.NORMAL);
            holder.txtRewardAmount.setTextColor(Color.parseColor(COLOR_GRAY));

        } else {
            // Ngày quá khứ đã bỏ lỡ: xám nhạt
            holder.overlayClaimed.setVisibility(View.GONE);
            holder.cardReward.setStrokeColor(Color.parseColor(COLOR_GRAY_BORDER));
            holder.cardReward.setStrokeWidth(1);
            holder.txtDay.setTextColor(Color.parseColor(COLOR_GRAY));
            holder.txtDay.setTypeface(null, Typeface.NORMAL);
            holder.txtRewardAmount.setTextColor(Color.parseColor(COLOR_GRAY));
        }

        // ── Alpha cho ngày không tương tác ────────────────────────────────────
        float alpha = (isToday || isChecked) ? 1.0f : (isFuture ? 0.5f : 0.35f);
        holder.cardReward.setAlpha(alpha);

        // ── Click listener: chỉ ngày hôm nay và chưa điểm mới được bấm ────────
        final int finalReward = reward;
        holder.cardReward.setOnClickListener(v -> {
            if (isToday && !isChecked && listener != null) {
                listener.onCheckIn(day, finalReward);
            } else if (isFuture) {
                // Hiển thị tooltip nhẹ
                android.widget.Toast.makeText(v.getContext(),
                        "Chưa đến ngày " + day + " 📅", android.widget.Toast.LENGTH_SHORT).show();
            } else if (isPast && !isChecked) {
                android.widget.Toast.makeText(v.getContext(),
                        "Đã bỏ lỡ ngày " + day + " 😢", android.widget.Toast.LENGTH_SHORT).show();
            }
            // isChecked → không làm gì
        });
    }

    @Override
    public int getItemCount() {
        return totalDays;
    }

    public static class DayViewHolder extends RecyclerView.ViewHolder {
        com.google.android.material.card.MaterialCardView cardReward;
        ImageView  imgReward;
        TextView   txtRewardAmount;
        FrameLayout overlayClaimed;
        TextView   txtDay;

        DayViewHolder(View v) {
            super(v);
            cardReward      = v.findViewById(R.id.card_reward);
            imgReward       = v.findViewById(R.id.img_reward);
            txtRewardAmount = v.findViewById(R.id.txt_reward_amount);
            overlayClaimed  = v.findViewById(R.id.overlay_claimed);
            txtDay          = v.findViewById(R.id.txt_day);
        }
    }
}
