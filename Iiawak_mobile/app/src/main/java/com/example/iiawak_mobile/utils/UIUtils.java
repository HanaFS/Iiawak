package com.example.iiawak_mobile.utils;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.style.ImageSpan;
import androidx.core.content.ContextCompat;
import com.example.iiawak_mobile.R;

public class UIUtils {

    /**
     */
    public static CharSequence withDiamond(Context context, String text) {
        if (text == null || !text.contains("💎"))
            return text;

        SpannableString ss = new SpannableString(text);
        int index = text.indexOf("💎");

        Drawable d = ContextCompat.getDrawable(context, R.drawable.ic_pink_diamond);
        if (d != null) {
            // Thay đổi kích thước icon cho vừa với chữ
            d.setBounds(0, 0, (int) (d.getIntrinsicWidth() * 0.7), (int) (d.getIntrinsicHeight() * 0.7));
        }

        while (index >= 0) {
            if (d != null) {
                ImageSpan span = new ImageSpan(d, ImageSpan.ALIGN_BOTTOM);
                ss.setSpan(span, index, index + 2, Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
            }
            index = text.indexOf("💎", index + 2);
        }

        return ss;
    }
}
