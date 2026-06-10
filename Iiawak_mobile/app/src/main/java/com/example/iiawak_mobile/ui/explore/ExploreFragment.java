package com.example.iiawak_mobile.ui.explore;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.remote.CharacterApiService;
import com.example.iiawak_mobile.network.ApiClient;
import com.example.iiawak_mobile.data.model.CharacterCard;
import com.example.iiawak_mobile.ui.community.CharacterCardAdapter;
import com.google.android.material.textfield.TextInputEditText;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/**
 * ExploreFragment — Hiển thị danh sách nhân vật từ backend.
 * KHÔNG có dữ liệu mock: mọi dữ liệu đều từ GET /api/characters.
 */
public class ExploreFragment extends Fragment {

    private CharacterCardAdapter   adapter;
    private final List<CharacterCard> characters = new ArrayList<>();
    private String currentTag = null; // filter chip đang chọn

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_explore, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        androidx.recyclerview.widget.RecyclerView recycler = view.findViewById(R.id.explore_recycler);
        adapter = new CharacterCardAdapter(characters);
        recycler.setAdapter(adapter);

        // Nút random
        View btnRandom = view.findViewById(R.id.btn_random_char);
        if (btnRandom != null) {
            btnRandom.setOnClickListener(v -> {
                if (!characters.isEmpty()) {
                    int idx = (int)(Math.random() * characters.size());
                    openCharacterDetail(characters.get(idx));
                }
            });
        }

        // Filter chips
        setupChips(view);

        // Search box debounce
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

        // Load lần đầu
        fetchCharacters(null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Chip filter
    // ─────────────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────────────
    // Fetch từ backend thực
    // ─────────────────────────────────────────────────────────────────────────

    private void fetchCharacters(@Nullable String searchText) {
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
                    try {
                        JSONArray data = resp.getJSONArray("data");
                        characters.clear();
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);

                            // Lấy tên creator
                            String creatorName = "Iiawak";
                            JSONObject creatorObj = obj.optJSONObject("creatorId");
                            if (creatorObj != null) {
                                creatorName = creatorObj.optString("displayName", "Iiawak");
                            }

                            // Tags → lấy tag đầu tiên làm "thể loại" hiển thị
                            JSONArray tagsArr = obj.optJSONArray("tags");
                            String firstTag = (tagsArr != null && tagsArr.length() > 0)
                                    ? tagsArr.optString(0)
                                    : obj.optString("gender", "");

                            characters.add(new CharacterCard(
                                    obj.optString("_id",          ""),
                                    obj.optString("name",         ""),
                                    obj.optString("avatar",       ""),
                                    obj.optString("slogan",       ""),
                                    firstTag,
                                    creatorName,
                                    obj.optInt("totalChats",      0),
                                    obj.optInt("totalLikes",      0),
                                    obj.optString("ageRating",    "all").equals("adult"),
                                    obj.optString("privacy",      "public").equals("public"),
                                    obj.optString("chatMode",     "both")
                            ));
                        }
                        adapter.notifyDataSetChanged();
                    } catch (Exception e) {
                        showError("Lỗi phân tích dữ liệu nhân vật");
                    }
                }

                @Override
                public void onError(String errorMessage, int statusCode) {
                    showError("Không thể tải nhân vật: " + errorMessage);
                }
            }
        );
    }

    private void openCharacterDetail(CharacterCard character) {
        Bundle args = new Bundle();
        args.putString("characterId", character.id);
        try {
            androidx.navigation.Navigation.findNavController(requireView())
                    .navigate(R.id.characterDetailFragment, args);
        } catch (Exception ignored) {
            Toast.makeText(getContext(), "Nhân vật: " + character.name, Toast.LENGTH_SHORT).show();
        }
    }

    private void showError(String msg) {
        if (getContext() != null) {
            Toast.makeText(getContext(), msg, Toast.LENGTH_SHORT).show();
        }
    }
}
