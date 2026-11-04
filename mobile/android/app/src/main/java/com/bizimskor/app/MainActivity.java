package com.bizimskor.app;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null || getBridge().getWebView() == null) {
                    delegateBack();
                    return;
                }
                getBridge().getWebView().evaluateJavascript(
                    "Boolean(window.BizimSkorAndroidUI && window.BizimSkorAndroidUI.closeRules())",
                    result -> { if (!"true".equals(result)) delegateBack(); }
                );
            }
            private void delegateBack() {
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });
    }
}
