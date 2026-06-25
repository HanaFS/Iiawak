package com.example.iiawak_mobile.ui.creator;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.example.iiawak_mobile.R;
import com.example.iiawak_mobile.data.UserSession;
import com.example.iiawak_mobile.data.remote.CharacterApiService;
import com.example.iiawak_mobile.network.ApiClient;
import org.json.JSONObject;

public class CreateCharacterFragment extends Fragment {

    private ImageView ivAvatar;
    private Uri selectedImageUri;
    private EditText etName, etTags, etSlogan, etCreatorNotes, etPublicInfo, etPersonality, etOpeningLine, etBio, etFirstMsg, etStatus, etNpcName;
    private Spinner spinnerGender, spinnerPrivacy, spinnerAge;

    private final ActivityResultLauncher<Intent> imagePickerLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    selectedImageUri = result.getData().getData();
                    if (selectedImageUri != null && ivAvatar != null) {
                        ivAvatar.setImageURI(selectedImageUri);
                    }
                }
            });

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_create_character, container, false);

        // Bind views
        ivAvatar = view.findViewById(R.id.iv_avatar);
        etName = view.findViewById(R.id.et_name);
        etTags = view.findViewById(R.id.et_tags);
        etSlogan = view.findViewById(R.id.et_slogan);
        etCreatorNotes = view.findViewById(R.id.et_creator_notes);
        etPublicInfo = view.findViewById(R.id.et_public_info);
        etPersonality = view.findViewById(R.id.et_personality);
        etOpeningLine = view.findViewById(R.id.et_opening_line);
        etBio = view.findViewById(R.id.et_bio);
        etFirstMsg = view.findViewById(R.id.et_first_msg);
        etStatus = view.findViewById(R.id.et_status);
        etNpcName = view.findViewById(R.id.et_npc_name);

        // Setup Spinners
        spinnerGender = view.findViewById(R.id.spinner_gender);
        ArrayAdapter<String> genderAdapter = new ArrayAdapter<>(requireContext(),
                android.R.layout.simple_spinner_item, new String[]{"Nam", "Nữ", "Khác", "Không xác định"});
        genderAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        if (spinnerGender != null) spinnerGender.setAdapter(genderAdapter);

        spinnerPrivacy = view.findViewById(R.id.spinner_privacy);
        ArrayAdapter<String> privacyAdapter = new ArrayAdapter<>(requireContext(),
                android.R.layout.simple_spinner_item, new String[]{"Công khai (Ai cũng có thể trò chuyện)", "Riêng tư (Chỉ mình tôi)"});
        privacyAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        if (spinnerPrivacy != null) spinnerPrivacy.setAdapter(privacyAdapter);

        spinnerAge = view.findViewById(R.id.spinner_age);
        ArrayAdapter<String> ageAdapter = new ArrayAdapter<>(requireContext(),
                android.R.layout.simple_spinner_item, new String[]{"Mọi lứa tuổi", "Người lớn (18+)"});
        ageAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        if (spinnerAge != null) spinnerAge.setAdapter(ageAdapter);

        // Avatar click listener
        if (ivAvatar != null) {
            ivAvatar.setOnClickListener(v -> {
                Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
                intent.setType("image/*");
                imagePickerLauncher.launch(intent);
            });
        }

        // Nút Back
        View btnBack = view.findViewById(R.id.btn_back);
        if (btnBack != null) {
            btnBack.setOnClickListener(v -> {
                androidx.navigation.Navigation.findNavController(requireView()).navigateUp();
            });
        }

        // Nút Lưu
        View btnSave = view.findViewById(R.id.btn_save);
        if (btnSave != null) {
            btnSave.setOnClickListener(v -> saveCharacter());
        }

        // Nút Thêm NPC
        View btnAddNpc = view.findViewById(R.id.btn_add_sibling_npc);
        if (btnAddNpc != null) {
            btnAddNpc.setOnClickListener(v -> {
                String npcName = etNpcName.getText().toString().trim();
                if (!npcName.isEmpty()) {
                    Toast.makeText(getContext(), "Đã thêm NPC: " + npcName, Toast.LENGTH_SHORT).show();
                    // Thêm logic lưu danh sách NPC nếu cần
                }
            });
        }

        formatRequiredLabels(view);

        return view;
    }

    private void formatRequiredLabels(View view) {
        if (view instanceof ViewGroup) {
            ViewGroup vg = (ViewGroup) view;
            for (int i = 0; i < vg.getChildCount(); i++) {
                formatRequiredLabels(vg.getChildAt(i));
            }
        } else if (view instanceof TextView && !(view instanceof EditText)) {
            TextView tv = (TextView) view;
            String text = tv.getText().toString();
            if (text.trim().endsWith("*") && !text.contains("Vui lòng")) {
                int starIndex = text.lastIndexOf('*');
                android.text.SpannableString spannable = new android.text.SpannableString(text);
                spannable.setSpan(new android.text.style.ForegroundColorSpan(
                        androidx.core.content.ContextCompat.getColor(requireContext(), R.color.brand_primary)),
                        starIndex, starIndex + 1, android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
                tv.setText(spannable);
            }
        }
    }

    private void saveCharacter() {
        String name = etName.getText().toString().trim();
        String tags = etTags.getText().toString().trim();
        String slogan = etSlogan.getText().toString().trim();
        String creatorNotes = etCreatorNotes.getText().toString().trim();
        String publicInfo = etPublicInfo.getText().toString().trim();
        String personality = etPersonality.getText().toString().trim();
        String openingLine = etOpeningLine.getText().toString().trim();
        String bio = etBio.getText().toString().trim();
        String firstMsg = etFirstMsg.getText().toString().trim();
        String status = etStatus.getText().toString().trim();
        String npcName = etNpcName != null ? etNpcName.getText().toString().trim() : "";

        // Validate các trường bắt buộc
        if (name.isEmpty() || tags.isEmpty() || slogan.isEmpty() || publicInfo.isEmpty() || personality.isEmpty() ||
                openingLine.isEmpty() || bio.isEmpty() || firstMsg.isEmpty() || status.isEmpty()) {
            Toast.makeText(getContext(), "Vui lòng điền đầy đủ các thông tin bắt buộc (*)", Toast.LENGTH_SHORT).show();
            return;
        }

        String avatarUrl = selectedImageUri != null ? selectedImageUri.toString() : "https://iiawak.com/avatars/default.png";
        String gender = spinnerGender.getSelectedItem().toString();
        String privacy = spinnerPrivacy.getSelectedItemPosition() == 0 ? "public" : "private";
        String ageRating = spinnerAge.getSelectedItemPosition() == 0 ? "all" : "adult";

        try {
            JSONObject payload = new JSONObject();
            payload.put("name", name);
            payload.put("avatar", avatarUrl);
            payload.put("gender", gender);
            payload.put("tags", tags);
            payload.put("slogan", slogan);
            payload.put("creatorNotes", creatorNotes);
            payload.put("privacy", privacy);
            payload.put("ageRating", ageRating);
            payload.put("publicInfo", publicInfo);
            payload.put("personality", personality);
            payload.put("openingLine", openingLine);
            payload.put("bio", bio);
            payload.put("firstMessage", firstMsg);
            payload.put("status", status);

            // Thêm creatorId từ UserSession
            UserSession session = UserSession.getInstance(requireContext());
            if (session.isLoggedIn()) {
                payload.put("creatorId", session.getUserId());
            }

            JSONObject advObj = new JSONObject();
            advObj.put("npcs", npcName);
            payload.put("advancedSettings", advObj);

            CharacterApiService.createCharacter(getContext(), payload, new ApiClient.ApiCallback() {
                @Override
                public void onSuccess(JSONObject json) {
                    Toast.makeText(getContext(), "Tạo nhân vật thành công! ✅", Toast.LENGTH_SHORT).show();
                    androidx.navigation.Navigation.findNavController(requireView()).navigateUp();
                }

                @Override
                public void onError(String errorMessage, int statusCode) {
                    Toast.makeText(getContext(), "Lỗi khi lưu nhân vật: " + errorMessage, Toast.LENGTH_SHORT).show();
                }
            });

        } catch (Exception e) {
            Toast.makeText(getContext(), "Lỗi xử lý dữ liệu: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
}
