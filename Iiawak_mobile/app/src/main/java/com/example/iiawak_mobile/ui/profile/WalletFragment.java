package com.example.iiawak_mobile.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.UserSession;
import com.example.iiawak_mobile.data.remote.UserApiService;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class WalletFragment extends Fragment {

    private TextView     tvTotalBalance;
    private RecyclerView recycler;
    private View         loadingView;
    private View         emptyView;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_wallet, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        tvTotalBalance = view.findViewById(R.id.tv_total_balance);
        recycler       = view.findViewById(R.id.transactions_recycler);
        loadingView    = view.findViewById(R.id.wallet_loading);
        emptyView      = view.findViewById(R.id.wallet_empty);

        // Load số dư offline từ session
        int balance = UserSession.getInstance(getContext()).getKchBalance();
        tvTotalBalance.setText(String.valueOf(balance));

        // Nút Back trên Toolbar
        com.google.android.material.appbar.MaterialToolbar toolbar = view.findViewById(R.id.wallet_toolbar);
        if (toolbar != null) {
            toolbar.setNavigationOnClickListener(v -> {
                androidx.navigation.Navigation.findNavController(requireView()).navigateUp();
            });
        }
        fetchTransactions();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (tvTotalBalance != null && getContext() != null) {
            int balance = UserSession.getInstance(getContext()).getKchBalance();
            tvTotalBalance.setText(String.valueOf(balance));
        }
    }

    private void fetchTransactions() {
        setLoading(true);
        // Load local mockup data
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (getContext() == null) return;
            setLoading(false);
            
            JSONArray data = UserSession.getInstance(getContext()).getTransactions();
            if (data == null || data.length() == 0) {
                setEmpty(true);
                return;
            }

            setEmpty(false);
            recycler.setLayoutManager(new LinearLayoutManager(getContext()));
            recycler.setAdapter(new TransactionAdapter(data));
        }, 300); // 300ms fake delay
    }

    private void setLoading(boolean loading) {
        if (loadingView != null) loadingView.setVisibility(loading ? View.VISIBLE : View.GONE);
        if (recycler    != null) recycler.setVisibility(loading ? View.GONE : View.VISIBLE);
        if (loading && emptyView != null) emptyView.setVisibility(View.GONE);
    }

    private void setEmpty(boolean empty) {
        if (emptyView != null) emptyView.setVisibility(empty ? View.VISIBLE : View.GONE);
        if (recycler  != null && !empty) recycler.setVisibility(View.VISIBLE);
    }

    // ─── Adapter Lịch sử giao dịch ───────────────────────────────────────────

    private static class TransactionAdapter extends RecyclerView.Adapter<TransactionAdapter.VH> {
        private final JSONArray data;

        TransactionAdapter(JSONArray data) {
            this.data = data;
        }

        @NonNull
        @Override
        public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_transaction, parent, false);
            return new VH(v);
        }

        @Override
        public void onBindViewHolder(@NonNull VH h, int position) {
            try {
                JSONObject tx = data.getJSONObject(position);

                // description
                String desc = tx.optString("description", "Giao dịch KCH");
                h.tvTitle.setText(desc);

                // amount
                int amount = tx.optInt("amount", 0);
                String formattedAmount = java.text.NumberFormat.getInstance(java.util.Locale.US).format(amount);
                String amountStr = (amount > 0 ? "+" : "") + formattedAmount + " 💎";
                h.tvAmount.setText(com.example.iiawak_mobile.utils.UIUtils.withDiamond(h.itemView.getContext(), amountStr));

                if (amount > 0) {
                    h.tvAmount.setTextColor(0xFF4CAF50); // Xanh lá
                } else {
                    h.tvAmount.setTextColor(0xFFF44336); // Đỏ
                }

                // createdAt or date
                String dateStr = tx.optString("createdAt", tx.optString("date", ""));
                h.tvTime.setText(formatDate(dateStr));

            } catch (Exception e) {
                // skip
            }
        }

        @Override
        public int getItemCount() {
            return data.length();
        }

        private String formatDate(String iso) {
            try {
                SimpleDateFormat in = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
                Date date = in.parse(iso);
                SimpleDateFormat out = new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());
                return out.format(date);
            } catch (Exception e) {
                return iso; // fallback
            }
        }

        static class VH extends RecyclerView.ViewHolder {
            TextView tvTitle, tvTime, tvAmount;
            VH(View v) {
                super(v);
                tvTitle  = v.findViewById(R.id.tx_title);
                tvTime   = v.findViewById(R.id.tx_time);
                tvAmount = v.findViewById(R.id.tx_amount);
            }
        }
    }
}
