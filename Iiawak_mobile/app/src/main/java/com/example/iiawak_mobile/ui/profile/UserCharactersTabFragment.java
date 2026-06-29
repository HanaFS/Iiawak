package com.example.iiawak_mobile.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.model.CharacterCard;
import com.example.iiawak_mobile.data.remote.CharacterApiService;
import com.example.iiawak_mobile.network.ApiClient;
import com.example.iiawak_mobile.ui.explore.ExploreCharacterAdapter;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class UserCharactersTabFragment extends Fragment {

    private String userId;
    private RecyclerView recyclerView;
    private ExploreCharacterAdapter adapter;
    private List<CharacterCard> characters = new ArrayList<>();

    public static UserCharactersTabFragment newInstance(String userId) {
        UserCharactersTabFragment fragment = new UserCharactersTabFragment();
        Bundle args = new Bundle();
        args.putString("userId", userId);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            userId = getArguments().getString("userId");
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_user_profile_tab, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        recyclerView = view.findViewById(R.id.rv_tab_content);
        recyclerView.setLayoutManager(new GridLayoutManager(getContext(), 2));
        adapter = new ExploreCharacterAdapter(characters);
        adapter.setOnChatClickListener(new ExploreCharacterAdapter.OnChatClickListener() {
            @Override
            public void onChatNormal(CharacterCard card) {
                Bundle args = new Bundle();
                args.putString("characterId", card.id);
                args.putString("botName", card.name);
                args.putString("chatMode", "normal");
                Navigation.findNavController(requireView()).navigate(R.id.chatFragment, args);
            }

            @Override
            public void onChatStory(CharacterCard card) {
                Bundle args = new Bundle();
                args.putString("characterId", card.id);
                args.putString("botName", card.name);
                args.putString("chatMode", "story");
                Navigation.findNavController(requireView()).navigate(R.id.chatFragment, args);
            }
        });
        recyclerView.setAdapter(adapter);

        loadCharacters();
    }

    private void loadCharacters() {
        CharacterApiService.getUserCharacters(getContext(), userId, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                try {
                    characters.clear();
                    JSONArray data = response.optJSONArray("data");
                    if (data != null) {
                        for (int i = 0; i < data.length(); i++) {
                            JSONObject obj = data.getJSONObject(i);
                            characters.add(new CharacterCard(
                                    obj.optString("id"),
                                    obj.optString("name"),
                                    obj.optString("avatar"),
                                    obj.optString("slogan"),
                                    obj.optJSONArray("tags") != null ? obj.optJSONArray("tags").optString(0) : "",
                                    obj.optString("creatorName"),
                                    obj.optInt("totalChats"),
                                    obj.optInt("totalLikes"),
                                    obj.optString("ageRating").equals("adult"),
                                    obj.optString("privacy").equals("public"),
                                    obj.optString("chatMode")
                            ));
                        }
                    }
                    adapter.notifyDataSetChanged();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(String errorMessage, int statusCode) {
                Toast.makeText(getContext(), errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
