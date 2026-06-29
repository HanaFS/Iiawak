package com.example.iiawak_mobile.ui.profile;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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
import com.example.iiawak_mobile.config.NetworkConfig;
import com.example.iiawak_mobile.data.UserSession;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import com.example.iiawak_mobile.billing.BillingManager;
import com.example.iiawak_mobile.data.remote.EconomyApiService;

public class StoreFragment extends Fragment implements BillingManager.BillingListener {

    private RecyclerView recyclerView;
    private StorePackageAdapter adapter;
    private List<StorePackage> packageList = new ArrayList<>();
    private TextView tvBalance;
    private UserSession session;
    private BillingManager billingManager;
    private boolean isX2Active = false;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_store, container, false);
        
        session = UserSession.getInstance(requireContext());
        tvBalance = view.findViewById(R.id.store_diamond_balance);
        updateBalance();

        view.findViewById(R.id.btn_back).setOnClickListener(v -> {
            androidx.navigation.Navigation.findNavController(requireView()).navigateUp();
        });

        recyclerView = view.findViewById(R.id.recycler_store_packages);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new StorePackageAdapter(packageList, this::buyPackage, false);
        recyclerView.setAdapter(adapter);

        billingManager = new BillingManager(getActivity(), this);
        billingManager.startConnection();

        fetchPackages();

        return view;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (billingManager != null) {
            billingManager.destroy();
        }
    }

    private void updateBalance() {
        if (tvBalance != null) {
            tvBalance.setText(String.valueOf(session.getFreeHearts()));
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        updateBalance();
    }

    private void buyPackage(StorePackage pkg) {
        if (pkg.playStoreProductId == null || pkg.playStoreProductId.isEmpty()) {
            showError("Gói nạp này chưa được cấu hình cho Google Play.");
            return;
        }
        billingManager.purchasePackage(pkg.playStoreProductId);
    }

    @Override
    public void onBillingSetupFinished(boolean success) {
        if (!success) {
            showError("Không thể kết nối đến hệ thống thanh toán Google Play.");
        }
    }

    @Override
    public void onPurchaseSuccess(String purchaseToken, String productId) {
        new Handler(Looper.getMainLooper()).post(() -> 
            Toast.makeText(getContext(), "Thanh toán CH Play thành công, đang xác thực...", Toast.LENGTH_SHORT).show()
        );

        EconomyApiService.verifyGooglePlayPurchase(getContext(), productId, purchaseToken, new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject json) {
                new Handler(Looper.getMainLooper()).post(() -> {
                    try {
                        JSONObject data = json.getJSONObject("data");
                        String status = data.optString("status", "");
                        if (status.equals("pending")) {
                            Toast.makeText(getContext(), "Thanh toán thành công! Giao dịch đang chờ Admin duyệt.", Toast.LENGTH_LONG).show();
                        } else {
                            int reward = data.getInt("rewardKch");
                            session.addFreeHearts(reward);
                            updateBalance();
                            Toast.makeText(getContext(), com.example.iiawak_mobile.utils.UIUtils.withDiamond(getContext(), "Xác thực thành công +" + reward + " 💎"), Toast.LENGTH_LONG).show();
                        }
                    } catch (Exception e) {
                        showError("Lỗi đọc dữ liệu xác thực.");
                    }
                });
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                showError("Xác thực thất bại: " + errorMessage);
            }
        });
    }

    @Override
    public void onPurchaseError(String message) {
        new Handler(Looper.getMainLooper()).post(() -> 
            Toast.makeText(getContext(), message, Toast.LENGTH_LONG).show()
        );
    }

    private void fetchPackages() {
        com.example.iiawak_mobile.data.remote.EconomyApiService.getTopupPackages(getContext(), new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject jsonResponse) {
                try {
                    if (jsonResponse.getBoolean("success")) {
                        isX2Active = jsonResponse.optBoolean("isX2Active", false);
                        adapter.setX2Active(isX2Active);
                        JSONArray data = jsonResponse.getJSONArray("data");
                        packageList.clear();
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);
                            packageList.add(new StorePackage(
                                    obj.optString("id", obj.optString("_id", "")),
                                    obj.getString("name"),
                                    obj.getInt("price"),
                                    obj.getInt("kch"),
                                    obj.optInt("bonus", 0),
                                    obj.optString("playStoreProductId", "")
                            ));
                        }
                        adapter.notifyDataSetChanged();
                    }
                } catch (Exception e) {
                    showError("Lỗi dữ liệu: " + e.getMessage());
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                showError("Không thể tải gói nạp: " + errorMessage);
            }
        });
    }

    private void showError(String msg) {
        new Handler(Looper.getMainLooper()).post(() -> Toast.makeText(getContext(), msg, Toast.LENGTH_SHORT).show());
    }

    // Models & Adapters
    static class StorePackage {
        String id;
        String name;
        int price;
        int kch;
        int bonus;
        String playStoreProductId;
        
        StorePackage(String id, String name, int price, int kch, int bonus, String playStoreProductId) {
            this.id = id; this.name = name; this.price = price; this.kch = kch; this.bonus = bonus;
            this.playStoreProductId = playStoreProductId;
        }
    }

    interface OnBuyClickListener {
        void onBuy(StorePackage pkg);
    }

    static class StorePackageAdapter extends RecyclerView.Adapter<StorePackageAdapter.ViewHolder> {
        private final List<StorePackage> list;
        private final OnBuyClickListener listener;
        private boolean isX2Active;

        StorePackageAdapter(List<StorePackage> list, OnBuyClickListener listener, boolean isX2Active) {
            this.list = list;
            this.listener = listener;
            this.isX2Active = isX2Active;
        }

        public void setX2Active(boolean x2Active) {
            this.isX2Active = x2Active;
            notifyDataSetChanged();
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_store_package, parent, false);
            return new ViewHolder(v);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            StorePackage pkg = list.get(position);
            holder.tvName.setText(pkg.name);
            
            int displayKch = isX2Active ? pkg.kch * 2 : pkg.kch;
            
            if (isX2Active) {
                holder.tvName.setText("✨ " + pkg.name + " (X2)");
            }
            
            if (pkg.bonus > 0) {
                holder.tvKch.setText("+" + displayKch + " KCH (Thưởng +" + pkg.bonus + ")");
            } else {
                holder.tvKch.setText("+" + displayKch + " Kim Cương Hồng");
            }
            holder.btnBuy.setText(String.format("%,dđ", pkg.price).replace(',', '.'));
            holder.btnBuy.setOnClickListener(v -> listener.onBuy(pkg));
        }

        @Override
        public int getItemCount() { return list.size(); }

        static class ViewHolder extends RecyclerView.ViewHolder {
            TextView tvName, tvKch;
            com.google.android.material.button.MaterialButton btnBuy;
            ViewHolder(View v) {
                super(v);
                tvName = v.findViewById(R.id.tv_package_name);
                tvKch = v.findViewById(R.id.tv_package_kch);
                btnBuy = v.findViewById(R.id.btn_buy);
            }
        }
    }
}
