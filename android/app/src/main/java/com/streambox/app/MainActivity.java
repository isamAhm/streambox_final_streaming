package com.streambox.app;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.FrameLayout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private FrameLayout fullscreenContainer;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Create fullscreen container for video
        fullscreenContainer = new FrameLayout(this);
        fullscreenContainer.setLayoutParams(
            new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        );
        fullscreenContainer.setVisibility(View.GONE);
        
        // Add to root view
        ((ViewGroup) getWindow().getDecorView()).addView(fullscreenContainer);
        
        // Configure WebView for video playback
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setDatabaseEnabled(true);
            
            // Enable hardware acceleration
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            
            // Custom WebChromeClient for fullscreen video
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onShowCustomView(View view, CustomViewCallback callback) {
                    if (customView != null) {
                        callback.onCustomViewHidden();
                        return;
                    }
                    
                    customView = view;
                    customViewCallback = callback;
                    
                    fullscreenContainer.addView(customView);
                    fullscreenContainer.setVisibility(View.VISIBLE);
                    fullscreenContainer.bringToFront();
                    
                    // Hide system UI for immersive fullscreen
                    getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_FULLSCREEN |
                        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    );
                }
                
                @Override
                public void onHideCustomView() {
                    if (customView == null) {
                        return;
                    }
                    
                    fullscreenContainer.removeView(customView);
                    fullscreenContainer.setVisibility(View.GONE);
                    customView = null;
                    
                    if (customViewCallback != null) {
                        customViewCallback.onCustomViewHidden();
                        customViewCallback = null;
                    }
                    
                    // Restore system UI
                    getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
                }
            });
        }
    }
    
    @Override
    public void onBackPressed() {
        // Exit fullscreen video first
        if (customView != null) {
            getBridge().getWebView().getWebChromeClient().onHideCustomView();
            return;
        }
        
        // Navigate back in WebView history
        WebView webView = getBridge().getWebView();
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            // At root page, exit app
            super.onBackPressed();
        }
    }
    
    @Override
    public void onDestroy() {
        if (customView != null && customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
        }
        super.onDestroy();
    }
}

