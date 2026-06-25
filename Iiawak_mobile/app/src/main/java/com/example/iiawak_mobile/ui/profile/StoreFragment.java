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

public class StoreFragment extends Fragment {

    private RecyclerView recyclerView;
    private StorePackageAdapter adapter;
    private List<StorePackage> packageList = new ArrayList<>();
    private TextView tvBalance;
    private UserSession session;

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
        adapter = new StorePackageAdapter(packageList, this::buyPackage);
        recyclerView.setAdapter(adapter);

        fetchPackages();

        return view;
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
        // Logic mô phỏng thanh toán
        Toast.makeText(getContext(), "Đang xử lý thanh toán cho: " + pkg.name, Toast.LENGTH_SHORT).show();
        
        // Giả lập thanh toán thành công sau 1s
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            session.addFreeHearts(pkg.kch);
            updateBalance();
            Toast.makeText(getContext(), com.example.iiawak_mobile.utils.UIUtils.withDiamond(getContext(), "Nạp thành công +" + pkg.kch + " 💎"), Toast.LENGTH_LONG).show();
        }, 1000);
    }

    private void fetchPackages() {
        com.example.iiawak_mobile.data.remote.EconomyApiService.getTopupPackages(getContext(), new com.example.iiawak_mobile.network.ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject jsonResponse) {
                try {
                    if (jsonResponse.getBoolean("success")) {
                        JSONArray data = jsonResponse.getJSONArray("data");
                        packageList.clear();
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);
                            packageList.add(new StorePackage(
                                    obj.getString("id"),
                                    obj.getString("name"),
                                    obj.getInt("price"),
                                    obj.getInt("kch")
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
        StorePackage(String id, String name, int price, int kch) {
            this.id = id; this.name = name; this.price = price; this.kch = kch;
        }
    }

    interface OnBuyClickListener {
        void onBuy(StorePackage pkg);
    }

    static class StorePackageAdapter extends RecyclerView.Adapter<StorePackageAdapter.ViewHolder> {
        private final List<StorePackage> list;
        private final OnBuyClickListener listener;

        StorePackageAdapter(List<StorePackage> list, OnBuyClickListener listener) {
            this.list = list;
            this.listener = listener;
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
            holder.tvKch.setText("+" + pkg.kch + " Kim Cương Hồng");
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
