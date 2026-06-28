package com.example.iiawak_mobile.ui.community;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.Navigation;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.remote.CommunityApiService;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONObject;

import java.util.ArrayList;

public class CreatePostFragment extends Fragment {

    private ImageButton btnBack;
    private ImageButton btnPost;
    private EditText etPostContent;
    private View btnAddImageContainer;
    private View btnAddCharacterContainer;
    
    // Preview image/character
    private View llSelectedCharacter;
    private ImageButton btnRemoveCharacter;
    private View flImagePreview;
    private ImageButton btnRemoveImage;

    private String selectedCharacterTagId = null;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_create_post, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        btnBack = view.findViewById(R.id.btn_back);
        btnPost = view.findViewById(R.id.btn_post);
        etPostContent = view.findViewById(R.id.et_post_content);
        btnAddImageContainer = view.findViewById(R.id.btn_add_image_container);
        btnAddCharacterContainer = view.findViewById(R.id.btn_add_character_container);
        
        llSelectedCharacter = view.findViewById(R.id.ll_selected_character);
        btnRemoveCharacter = view.findViewById(R.id.btn_remove_character);
        flImagePreview = view.findViewById(R.id.fl_image_preview);
        btnRemoveImage = view.findViewById(R.id.btn_remove_image);

        // Nút Back
        btnBack.setOnClickListener(v -> {
            Navigation.findNavController(v).navigateUp();
        });

        // Theo dõi thay đổi text để kích hoạt nút Đăng
        etPostContent.addTextChangedListener(new android.text.TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                btnPost.setEnabled(s.toString().trim().length() > 0);
            }
            @Override public void afterTextChanged(android.text.Editable s) {}
        });

        // Tạm thời vô hiệu hoá chức năng Ảnh
        btnAddImageContainer.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Tính năng chọn ảnh đang phát triển", Toast.LENGTH_SHORT).show();
        });

        // Tạm thời vô hiệu hoá chức năng Thêm Nhân vật
        btnAddCharacterContainer.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Tính năng chọn nhân vật đang phát triển", Toast.LENGTH_SHORT).show();
        });

        btnRemoveCharacter.setOnClickListener(v -> {
            llSelectedCharacter.setVisibility(View.GONE);
            selectedCharacterTagId = null;
        });

        btnRemoveImage.setOnClickListener(v -> {
            flImagePreview.setVisibility(View.GONE);
        });

        // Nút Đăng
        btnPost.setOnClickListener(v -> {
            String content = etPostContent.getText().toString().trim();
            if (content.isEmpty()) return;

            btnPost.setEnabled(false);
            
            CommunityApiService.createPost(getContext(), content, new ArrayList<>(), selectedCharacterTagId, new ApiClient.ApiCallback() {
                @Override
                public void onSuccess(JSONObject response) {
                    Toast.makeText(getContext(), "Đăng bài thành công", Toast.LENGTH_SHORT).show();
                    requireActivity().getSupportFragmentManager().setFragmentResult("new_post_created", new Bundle());
                    Navigation.findNavController(v).navigateUp();
                }

                @Override
                public void onError(String errorMsg, int errorCode) {
                    btnPost.setEnabled(true);
                    Toast.makeText(getContext(), "Lỗi: " + errorMsg, Toast.LENGTH_SHORT).show();
                }
            });
        });
    }
}
