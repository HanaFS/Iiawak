package com.example.iiawak_mobile.ui.creator;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.example.iiawak_mobile.R;

public class CreatorDashboardFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_creator_dashboard, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Create character button
        View btnCreate = view.findViewById(R.id.btn_create_character);
        if (btnCreate != null) {
            btnCreate.setOnClickListener(v ->
                    androidx.navigation.Navigation.findNavController(view)
                            .navigate(R.id.createCharacterFragment));
        }

        // Withdraw button
        View btnWithdraw = view.findViewById(R.id.btn_withdraw);
        if (btnWithdraw != null) {
            btnWithdraw.setOnClickListener(v -> {
                // Show withdraw dialog (placeholder)
                android.widget.Toast.makeText(getContext(),
                        "Rút 3,450 💎 về ví chính thành công! 🎉",
                        android.widget.Toast.LENGTH_SHORT).show();
            });
        }
    }
}
