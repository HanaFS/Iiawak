package com.example.iiawak_mobile.data.model;

/**
 * Transaction — Model lịch sử giao dịch KCH.
 */
public class Transaction {
    public String id;
    public String txId;
    public String userId;
    public int    amountKch;
    public String type;      // "TOPUP" | "REWARD" | "GIFTCODE" | "SPEND"
    public String status;    // "success" | "failed" | "pending"
    public String createdAt;
}
