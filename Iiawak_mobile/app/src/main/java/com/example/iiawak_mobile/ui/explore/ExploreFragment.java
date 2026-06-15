package com.example.iiawak_mobile.ui.explore;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.CharacterCard;
import com.example.iiawak_mobile.data.remote.CharacterApiService;
import com.example.iiawak_mobile.network.ApiClient;
import com.google.android.material.textfield.TextInputEditText;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/**
 * ExploreFragment — Hiển thị danh sách nhân vật từ backend.
 * Mọi dữ liệu đều từ GET /api/characters — không có mock data.
 * Kết nối đến ExploreCharacterAdapter (bind đúng item_character_card.xml).
 */
public class ExploreFragment extends Fragment {

    private ExploreCharacterAdapter adapter;
    private final List<CharacterCard> characters = new ArrayList<>();
    private String currentTag = null;

    // Views
    private View loadingView;
    private View emptyView;
    private TextView tvResultCount;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_explore, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // ── Views ─────────────────────────────────────────────────────────────
        loadingView   = view.findViewById(R.id.explore_loading);
        emptyView     = view.findViewById(R.id.explore_empty);
        tvResultCount = view.findViewById(R.id.tv_result_count);

        // ── RecyclerView ──────────────────────────────────────────────────────
        RecyclerView recycler = view.findViewById(R.id.explore_recycler);
        adapter = new ExploreCharacterAdapter(characters);

        // Kết nối nút Chat Thường và Chat Chuyện
        adapter.setOnChatClickListener(new ExploreCharacterAdapter.OnChatClickListener() {
            @Override
            public void onChatNormal(CharacterCard card) {
                navigateToChat(card, "normal");
            }
            @Override
            public void onChatStory(CharacterCard card) {
                navigateToChat(card, "story");
            }
        });
        recycler.setAdapter(adapter);

        // ── Nút Random ────────────────────────────────────────────────────────
        View btnRandom = view.findViewById(R.id.btn_random_char);
        if (btnRandom != null) {
            btnRandom.setOnClickListener(v -> {
                if (!characters.isEmpty()) {
                    int idx = (int)(Math.random() * characters.size());
                    navigateToChat(characters.get(idx), "normal");
                } else {
                    Toast.makeText(getContext(), "Chưa có nhân vật nào", Toast.LENGTH_SHORT).show();
                }
            });
        }

        // ── Filter Chips ──────────────────────────────────────────────────────
        setupChips(view);

        // ── Search Box với debounce 400ms ─────────────────────────────────────
        TextInputEditText etSearch = view.findViewById(R.id.et_search);
        if (etSearch != null) {
            etSearch.addTextChangedListener(new TextWatcher() {
                private final android.os.Handler h = new android.os.Handler(android.os.Looper.getMainLooper());
                private Runnable r;
                @Override public void beforeTextChanged(CharSequence s, int st, int c, int a) {}
                @Override public void onTextChanged(CharSequence s, int st, int b, int c) {
                    if (r != null) h.removeCallbacks(r);
                    r = () -> fetchCharacters(s.toString().trim());
                    h.postDelayed(r, 400);
                }
                @Override public void afterTextChanged(Editable s) {}
            });
        }

        // ── Tải lần đầu ───────────────────────────────────────────────────────
        fetchCharacters(null);
    }

    // ─── Filter Chips ─────────────────────────────────────────────────────────

    private void setupChips(View view) {
        int[] chipIds = {
            R.id.chip_all, R.id.chip_romance, R.id.chip_fantasy,
            R.id.chip_mystery, R.id.chip_action, R.id.chip_slice, R.id.chip_horror
        };
        String[] tagValues = {null, "lãng mạn", "fantasy", "bí ẩn", "hành động", "đời thường", "kinh dị"};

        for (int i = 0; i < chipIds.length; i++) {
            com.google.android.material.chip.Chip chip = view.findViewById(chipIds[i]);
            if (chip == null) continue;
            final String tagValue = tagValues[i];
            chip.setOnClickListener(v -> {
                currentTag = tagValue;
                fetchCharacters(null);
            });
        }
    }

    // ─── Fetch từ Backend ─────────────────────────────────────────────────────

    private void fetchCharacters(@Nullable String searchText) {
        // Hiển thị loading
        setLoading(true);

        StringBuilder query = new StringBuilder();
        if (currentTag != null && !currentTag.isEmpty()) {
            query.append("tag=").append(currentTag);
        }
        if (searchText != null && !searchText.isEmpty()) {
            if (query.length() > 0) query.append("&");
            query.append("search=").append(searchText);
        }

        CharacterApiService.getPublicCharacters(
            getContext(),
            query.length() > 0 ? query.toString() : null,
            new ApiClient.ApiCallback() {
                @Override
                public void onSuccess(JSONObject resp) {
                    setLoading(false);
                    try {
                        JSONArray data = resp.getJSONArray("data");
                        characters.clear();

                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);

                            // Lấy tên creator từ populated object
                            String creatorName = "Iiawak";
                            JSONObject creatorObj = obj.optJSONObject("creatorId");
                            if (creatorObj != null) {
                                creatorName = creatorObj.optString("displayName", "Iiawak");
                            }

                            // Tags → hiển thị tag đầu tiên làm thể loại
                            JSONArray tagsArr = obj.optJSONArray("tags");
                            String firstTag = (tagsArr != null && tagsArr.length() > 0)
                                    ? tagsArr.optString(0)
                                    : obj.optString("gender", "");

                            characters.add(new CharacterCard(
                                    obj.optString("_id",       ""),
                                    obj.optString("name",      ""),
                                    obj.optString("avatar",    ""),
                                    obj.optString("slogan",    ""),
                                    firstTag,
                                    creatorName,
                                    obj.optInt("totalChats",   0),
                                    obj.optInt("totalLikes",   0),
                                    obj.optString("ageRating", "all").equals("adult"),
                                    obj.optString("privacy",   "public").equals("public"),
                                    obj.optString("chatMode",  "both")
                            ));
                        }

                        adapter.notifyDataSetChanged();
                        updateResultCount(characters.size());
                        setEmptyState(characters.isEmpty());

                    } catch (Exception e) {
                        showError("Lỗi phân tích dữ liệu nhân vật");
                        setEmptyState(true);
                    }
                }

                @Override
                public void onError(String errorMessage, int statusCode) {
                    setLoading(false);
                    showError("Không thể tải nhân vật: " + errorMessage);
                    setEmptyState(characters.isEmpty());
                }
            }
        );
    }

    // ─── Navigate tới ChatFragment ────────────────────────────────────────────

    private void navigateToChat(CharacterCard card, String mode) {
        Bundle args = new Bundle();
        args.putString("characterId", card.id);
        args.putString("botName",     card.name);
        args.putString("chatMode",    mode);
        try {
            androidx.navigation.Navigation.findNavController(requireView())
                    .navigate(R.id.chatFragment, args);
        } catch (Exception e) {
            // Fallback nếu navigation graph chưa có action trực tiếp
            try {
                Bundle detailArgs = new Bundle();
                detailArgs.putString("characterId", card.id);
                androidx.navigation.Navigation.findNavController(requireView())
                        .navigate(R.id.characterDetailFragment, detailArgs);
            } catch (Exception ignored) {
                Toast.makeText(getContext(), "Mở chat: " + card.name, Toast.LENGTH_SHORT).show();
            }
        }
    }

    // ─── UI State Helpers ─────────────────────────────────────────────────────

    private void setLoading(boolean loading) {
        if (loadingView != null) {
            loadingView.setVisibility(loading ? View.VISIBLE : View.GONE);
        }
        if (loading && emptyView != null) {
            emptyView.setVisibility(View.GONE);
        }
    }

    private void setEmptyState(boolean isEmpty) {
        if (emptyView != null) {
            emptyView.setVisibility(isEmpty ? View.VISIBLE : View.GONE);
        }
    }

    private void updateResultCount(int count) {
        if (tvResultCount != null) {
            tvResultCount.setText(count + " nhân vật");
        }
    }

    private void showError(String msg) {
        if (getContext() != null) {
            Toast.makeText(getContext(), msg, Toast.LENGTH_SHORT).show();
        }
    }
}
