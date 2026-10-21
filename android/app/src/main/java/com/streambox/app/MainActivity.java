package com.streambox.app;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.widget.FrameLayout;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "Streambox";
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private FrameLayout fullscreenContainer;
    
    // List of blocked ad domains
    private static final String[] BLOCKED_DOMAINS = {
        "1xbet",
        "meltbet",
        "betway",
        "ads",
        "adserver",
        "doubleclick",
        "googlesyndication",
        "advertising",
        "casino",
        "betting",
        "tracker",
        "analytics.google",
        "facebook.com/tr"
    };
    
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
            
            // Add WebViewClient to block ad redirects
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    String host = request.getUrl().getHost();
                    
                    // Check if URL contains blocked domains
                    for (String blockedDomain : BLOCKED_DOMAINS) {
                        if (url.toLowerCase().contains(blockedDomain.toLowerCase())) {
                            Log.d(TAG, "Blocked ad navigation: " + url);
                            // Prevent navigation to ad
                            return true;
                        }
                    }
                    
                    // Allow navigation to your domain
                    if (host != null && host.contains("streamboxx.duckdns.org")) {
                        return false; // Allow
                    }
                    
                    // Block external navigations (open in browser instead)
                    if (host != null && !host.contains("streamboxx.duckdns.org")) {
                        Log.d(TAG, "Blocked external navigation: " + url);
                        // Could open in external browser if needed:
                        // Intent intent = new Intent(Intent.ACTION_VIEW, request.getUrl());
                        // startActivity(intent);
                        return true; // Block
                    }
                    
                    return false;
                }
            });
            
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

