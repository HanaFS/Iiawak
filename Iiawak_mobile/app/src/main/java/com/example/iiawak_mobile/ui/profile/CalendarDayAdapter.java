package com.example.iiawak_mobile.ui.profile;

import android.graphics.Color;
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

public class CalendarDayAdapter extends RecyclerView.Adapter<CalendarDayAdapter.DayViewHolder> {

    private final int totalDays;
    private final Set<Integer> checkedDays;
    private final int today;
    private final OnCheckInListener listener;

    public interface OnCheckInListener {
        void onCheckIn(int day, int rewardAmount);
    }

    public CalendarDayAdapter(int totalDays, Set<Integer> checkedDays, int today, OnCheckInListener listener) {
        this.totalDays = totalDays;
        this.checkedDays = (checkedDays != null) ? checkedDays : new java.util.HashSet<>();
        this.today = today;
        this.listener = listener;
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
        boolean isChecked = checkedDays.contains(day);
        boolean isToday = (day == today);
        boolean isMilestone = (day % 7 == 0); // Ngày thưởng lớn

        holder.txtDay.setText(holder.itemView.getContext().getString(R.string.day_format, day));

        // Số lượng kim cương
        int reward = 100;
        if (isMilestone) {
            reward = 200;
            holder.txtRewardAmount.setText(String.valueOf(reward));
            holder.txtRewardAmount.setTextColor(Color.parseColor("#FFD700")); // Gold
        } else {
            holder.txtRewardAmount.setText(String.valueOf(reward));
            holder.txtRewardAmount.setTextColor(Color.WHITE);
        }
        final int finalReward = reward;

        // Trạng thái đã nhận
        if (isChecked) {
            holder.overlayClaimed.setVisibility(View.VISIBLE);
            holder.cardReward.setStrokeColor(Color.parseColor("#E91E8C")); // Pink border
            holder.cardReward.setStrokeWidth(3);
            holder.txtDay.setTextColor(Color.parseColor("#E91E8C"));
            holder.txtDay.setTypeface(null, android.graphics.Typeface.BOLD);
        } else {
            holder.overlayClaimed.setVisibility(View.GONE);
            if (isToday) {
                // Viền phát sáng nhẹ cho ngày hôm nay để gợi ý bấm
                holder.cardReward.setStrokeColor(Color.parseColor("#FF69B4"));
                holder.cardReward.setStrokeWidth(5);
                holder.txtDay.setTextColor(Color.WHITE);
                holder.txtDay.setTypeface(null, android.graphics.Typeface.BOLD);
            } else {
                holder.cardReward.setStrokeColor(Color.parseColor("#33FFFFFF"));
                holder.cardReward.setStrokeWidth(2);
                holder.txtDay.setTextColor(Color.parseColor("#888888"));
                holder.txtDay.setTypeface(null, android.graphics.Typeface.NORMAL);
            }
        }

        holder.cardReward.setOnClickListener(v -> {
            if (!isChecked && isToday) {
                if (listener != null) {
                    listener.onCheckIn(day, finalReward);
                }
            }
        });
    }

    @Override
    public int getItemCount() {
        return totalDays;
    }

    public static class DayViewHolder extends RecyclerView.ViewHolder {
        com.google.android.material.card.MaterialCardView cardReward;
        ImageView imgReward;
        TextView txtRewardAmount;
        FrameLayout overlayClaimed;
        TextView txtDay;

        DayViewHolder(View v) {
            super(v);
            cardReward = v.findViewById(R.id.card_reward);
            imgReward = v.findViewById(R.id.img_reward);
            txtRewardAmount = v.findViewById(R.id.txt_reward_amount);
            overlayClaimed = v.findViewById(R.id.overlay_claimed);
            txtDay = v.findViewById(R.id.txt_day);
        }
    }
}
