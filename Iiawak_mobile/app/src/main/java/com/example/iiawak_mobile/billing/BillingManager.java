package com.example.iiawak_mobile.billing;

import android.app.Activity;
import android.util.Log;
import androidx.annotation.NonNull;
import com.android.billingclient.api.*;
import java.util.ArrayList;
import java.util.List;

public class BillingManager implements PurchasesUpdatedListener {

    private static final String TAG = "BillingManager";
    private final BillingClient billingClient;
    private final Activity activity;
    private final BillingListener listener;

    public interface BillingListener {
        void onBillingSetupFinished(boolean success);
        void onPurchaseSuccess(String purchaseToken, String productId);
        void onPurchaseError(String message);
    }

    public BillingManager(Activity activity, BillingListener listener) {
        this.activity = activity;
        this.listener = listener;

        billingClient = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases()
                .build();
    }

    public void startConnection() {
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Billing Setup Finished.");
                    if (listener != null) listener.onBillingSetupFinished(true);
                } else {
                    Log.e(TAG, "Billing Setup Failed: " + billingResult.getDebugMessage());
                    if (listener != null) listener.onBillingSetupFinished(false);
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "Billing Service Disconnected. Reconnecting...");
                // Handle retry logic here if needed
                startConnection();
            }
        });
    }

    public void purchasePackage(String productId) {
        if (!billingClient.isReady()) {
            if (listener != null) listener.onPurchaseError("BillingClient is not ready. Xin thử lại.");
            return;
        }

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        );

        QueryProductDetailsParams queryProductDetailsParams =
            QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(
            queryProductDetailsParams,
            (billingResult, productDetailsList) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && productDetailsList != null && !productDetailsList.isEmpty()) {
                    ProductDetails productDetails = productDetailsList.get(0);
                    launchBillingFlow(productDetails);
                } else {
                    Log.e(TAG, "onProductDetailsResponse error: " + billingResult.getDebugMessage());
                    if (listener != null) listener.onPurchaseError("Sản phẩm không khả dụng: " + productId);
                }
            }
        );
    }

    private void launchBillingFlow(ProductDetails productDetails) {
        List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
        productDetailsParamsList.add(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .build()
        );

        BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();

        billingClient.launchBillingFlow(activity, billingFlowParams);
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            Log.d(TAG, "onPurchasesUpdated: User canceled the purchase");
            if (listener != null) listener.onPurchaseError("Đã hủy thanh toán.");
        } else {
            Log.e(TAG, "onPurchasesUpdated error: " + billingResult.getDebugMessage());
            if (listener != null) listener.onPurchaseError("Lỗi thanh toán: " + billingResult.getDebugMessage());
        }
    }

    private void handlePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            if (!purchase.isAcknowledged()) {
                AcknowledgePurchaseParams acknowledgePurchaseParams =
                    AcknowledgePurchaseParams.newBuilder()
                        .setPurchaseToken(purchase.getPurchaseToken())
                        .build();

                billingClient.acknowledgePurchase(acknowledgePurchaseParams, billingResult -> {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        Log.d(TAG, "Purchase acknowledged");
                        String productId = purchase.getProducts().get(0);
                        if (listener != null) {
                            listener.onPurchaseSuccess(purchase.getPurchaseToken(), productId);
                        }
                    }
                });
            } else {
                // Đã acknowledge nhưng có thể chưa gửi lên server
                String productId = purchase.getProducts().get(0);
                if (listener != null) {
                    listener.onPurchaseSuccess(purchase.getPurchaseToken(), productId);
                }
            }
        }
    }

    public void destroy() {
        if (billingClient != null) {
            billingClient.endConnection();
        }
    }
}
