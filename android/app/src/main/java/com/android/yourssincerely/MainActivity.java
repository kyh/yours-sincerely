package com.android.yourssincerely;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.ActionBar;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Message;
import android.os.Parcelable;
import android.provider.MediaStore;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.android.yourssincerely.util.IabBroadcastReceiver;
import com.android.yourssincerely.util.IabHelper;
import com.android.yourssincerely.util.IabResult;
import com.android.yourssincerely.util.Inventory;
import com.android.yourssincerely.util.NetworkHandler;
import com.android.yourssincerely.util.PermissionUtil;
import com.android.yourssincerely.util.Pref;
import com.android.yourssincerely.util.ProgressDialogHelper;
import com.android.yourssincerely.util.Purchase;
import com.android.yourssincerely.util.UrlHandler;
import com.android.yourssincerely.BuildConfig;
import com.android.yourssincerely.R;
import com.google.android.gms.ads.doubleclick.PublisherAdView;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

public class MainActivity extends AppCompatActivity implements View.OnClickListener, DownloadListener, IabBroadcastReceiver.IabBroadcastListener, SwipeRefreshLayout.OnRefreshListener {

    /* URL saved to be loaded after fb login */
    private static String target_url, target_url_prefix;

    private Context mContext;
    private WebView mWebview, mWebviewPop;
    private ValueCallback<Uri> mUploadMessage;
    public ValueCallback<Uri[]> uploadMessage;
    private String mCameraPhotoPath;
    private Uri mCapturedImageURI = null;
    private static final int FILE_CHOOSER_RESULT_CODE = 1;
    private static final int REQUEST_SELECT_FILE = 2;
    private static final int QRCODE_REQEST = 3;
    private FrameLayout mContainer;
    private ImageView mImageViewSplash;
    private ImageView mBack;
    private ImageView mForward;
    private ImageView mBilling;
    private SwipeRefreshLayout mSwipeToRefresh;
    private boolean show_content = true, showToolBar = true;

    private PublisherAdView mAdView;
    private String urlData, currentUrl, contentDisposition, mimeType;
    private AdMob admob;

    //PAYMENT
    IabHelper mHelper;
    // Provides purchase notification while this app is running
    IabBroadcastReceiver mBroadcastReceiver;

    private String ITEM_SKU = "";
    private boolean isPurchased = false;

    private WebAppInterface webAppInterface;
    private View rootView;

    //DATA FOR GEOLOCAION REQUEST
    String geoLocationOrigin;
    GeolocationPermissions.Callback geoLocationCallback;
    private String js = "javascript: var removeTargetBlank = (function(delay){setInterval(function(){Array.from(document.querySelectorAll('a[target=\"_blank\"]')).forEach(link => link.removeAttribute('target'));console.log('remove');}, delay);});removeTargetBlank(5000)";

    private boolean isServerStarted = false;

    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (TextUtils.isEmpty(getString(R.string.pullToRefresh))) {
            setContentView(R.layout.content_main);
        } else {
            setContentView(R.layout.content_main_pull_to_refresh);
        }
        checkURL(getIntent());
        initPayment();
        initComponents();
        initBrowser(savedInstanceState);

        if (savedInstanceState != null) {
            showContent();
        } else {
            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    showContent();
                }
            }, 5000);
        }
    }

    private void setTargetUrl(String url) {
        target_url = url;
        target_url_prefix = Uri.parse(target_url).getHost();
        currentUrl = target_url;
    }

    private void checkURL(Intent intent) {
        if (intent != null) {
            if (!TextUtils.isEmpty(intent.getStringExtra("URL"))) {
                setTargetUrl(intent.getStringExtra("URL"));
                return;
            }

            if ("text/plain".equals(intent.getType()) && intent.hasExtra(Intent.EXTRA_TEXT)) {
                setTargetUrl(intent.getStringExtra(Intent.EXTRA_TEXT));
                return;
            }

            Uri appLinkData = intent.getData();
            if (appLinkData != null && Intent.ACTION_VIEW.equals(intent.getAction())) {
                setTargetUrl(appLinkData.toString());
                return;
            }
        }

        setTargetUrl(getString(R.string.target_url));
        if (TextUtils.isEmpty(target_url)) {
            setTargetUrl(getLocalHostWithPort());
        }

        if (mWebview != null) {
            if (mWebviewPop != null) {
                mWebviewPop.setVisibility(View.GONE);
                mContainer.removeView(mWebviewPop);
                mWebviewPop = null;
            }
            mWebview.setVisibility(View.VISIBLE);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (webAppInterface != null) {
            webAppInterface.startGoogleTracker();
        }
        SuperViewWeb.activityResumed();
        hideStatusBar();
        checkURL(getIntent());
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                setCookies(mWebview);
                setCookies(mWebviewPop);
            }
        }, 1000);
    }

    private void setCookies(WebView webVew) {
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= 21) {
            if (webVew != null) {
                cookieManager.setAcceptThirdPartyCookies(mWebview, true);
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webAppInterface != null) {
            webAppInterface.stopGoogleTracker();
        }
        SuperViewWeb.activityPaused();

    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE || newConfig.orientation == Configuration.ORIENTATION_PORTRAIT) {
            if (admob != null) {
                admob.destroy();
            }
            initAdMob();
            if (admob != null) {
                admob.requestBannerAds();
                admob.requestInterstitialAd();
            }

        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        mWebview.saveState(outState);
    }

    private void removeAds() {
        mAdView.setVisibility(View.GONE);
        mBilling.setVisibility(View.GONE);
    }

    private void initPayment() {
        mBilling = findViewById(R.id.billing);
        isPurchased = Pref.getValue(this, ITEM_SKU, false);

        ITEM_SKU = getString(R.string.item_sku);
        String base64EncodedPublicKey = getString(R.string.public_key);
        if (!TextUtils.isEmpty(ITEM_SKU) && !TextUtils.isEmpty(base64EncodedPublicKey)) {
            mHelper = new IabHelper(this, base64EncodedPublicKey);
            mHelper.startSetup(new IabHelper.OnIabSetupFinishedListener() {
                @Override
                public void onIabSetupFinished(IabResult result) {
                    if (result.isFailure()) {
                        Log.v("Purches", "isFailure");
                    } else {
                        mBroadcastReceiver = new IabBroadcastReceiver(MainActivity.this);
                        IntentFilter broadcastFilter = new IntentFilter(IabBroadcastReceiver.ACTION);
                        registerReceiver(mBroadcastReceiver, broadcastFilter);
                        if (mHelper != null) {
                            mHelper.queryInventoryAsync(mGotInventoryListener);
                        }
                    }
                }
            });
        } else {
            mBilling.setVisibility(View.GONE);
        }
    }

    IabHelper.QueryInventoryFinishedListener mGotInventoryListener = new IabHelper.QueryInventoryFinishedListener() {
        public void onQueryInventoryFinished(IabResult result, Inventory inventory) {
            // Have we been disposed of in the meantime? If so, quit.
            if (mHelper == null) return;

            // Is it a failure?
            if (result.isFailure()) {
                return;
            }

            // Do we have the premium upgrade?
            Purchase premiumPurchase = inventory.getPurchase(ITEM_SKU);
            isPurchased = (premiumPurchase != null);
            Pref.setValue(MainActivity.this, ITEM_SKU, isPurchased);
            if (isPurchased) {
                removeAds();
            }
        }
    };

    IabHelper.OnIabPurchaseFinishedListener mPurchaseFinishedListener = new IabHelper.OnIabPurchaseFinishedListener() {
        @Override
        public void onIabPurchaseFinished(IabResult result, Purchase info) {
            if (result.isSuccess()) {
                Pref.setValue(MainActivity.this, ITEM_SKU, true);
                removeAds();
            }
        }
    };

    private void initComponents() {

        mContext = this.getApplicationContext();
        mSwipeToRefresh = findViewById(R.id.swipeToRefresh);
        rootView = findViewById(R.id.rootView);
        if (mSwipeToRefresh != null) {
            mSwipeToRefresh.setOnRefreshListener(this);
        }
        mImageViewSplash = findViewById(R.id.image_splash);
        mAdView = findViewById(R.id.adView);
        if (isPurchased) {
            mAdView.setVisibility(View.GONE);
        }

        if (TextUtils.isEmpty(getString(R.string.toolbar))) {
            showToolBar = false;
        }

        if (showToolBar) {
            mBack = findViewById(R.id.back);
            mForward = findViewById(R.id.forward);
            ImageView mRefresh = findViewById(R.id.refresh);

            mBack.setOnClickListener(this);
            mForward.setOnClickListener(this);
            mRefresh.setOnClickListener(this);
            //if app isn't buy
            if (!isPurchased) {
                mBilling.setOnClickListener(this);
            } else {
                mBilling.setVisibility(View.GONE);
            }
        } else {
            LinearLayout llToolbarContainer = findViewById(R.id.toolbar_footer);
            if (llToolbarContainer != null) {
                llToolbarContainer.setVisibility(View.GONE);
                RelativeLayout.LayoutParams lp = (RelativeLayout.LayoutParams) mAdView.getLayoutParams();
                lp.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM, RelativeLayout.TRUE);
            }
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        hideStatusBar();
    }


    private void hideStatusBar() {
        if (!TextUtils.isEmpty(getString(R.string.hide_status_bar))) {
            View decorView = getWindow().getDecorView();
            int uiOptions = View.SYSTEM_UI_FLAG_FULLSCREEN;
            decorView.setSystemUiVisibility(uiOptions);
            decorView.setOnSystemUiVisibilityChangeListener(new View.OnSystemUiVisibilityChangeListener() {
                @Override
                public void onSystemUiVisibilityChange(int visibility) {
                    // Note that system bars will only be "visible" if none of the
                    // LOW_PROFILE, HIDE_NAVIGATION, or FULLSCREEN flags are set.
                    if ((visibility & View.SYSTEM_UI_FLAG_FULLSCREEN) == 0) {
                        // other navigational controls.
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                hideStatusBar();
                            }
                        });
                    }
                }
            });
            ActionBar actionBar = getActionBar();
            if (actionBar != null) {
                actionBar.hide();
            }
        }
    }

    public void showContent() {
        if (show_content) {
            if (!TextUtils.isEmpty(getString(R.string.enable_gps))) {
                PermissionUtil.checkPermissions(this, new String[]{
                        android.Manifest.permission.INTERNET,
                });
            } else {
                PermissionUtil.checkPermissions(this, new String[]{
                        android.Manifest.permission.ACCESS_NETWORK_STATE,
                        android.Manifest.permission.INTERNET
                });
            }

            show_content = false;

            initAdMob();
            if (admob != null) {
                admob.requestBannerAds();
                admob.requestInterstitialAd();
            }

            mImageViewSplash.setVisibility(View.GONE);
            mContainer.setVisibility(View.VISIBLE);
            ProgressDialogHelper.dismissProgress();
        }
    }

    public void initAdMob() {
        if (!Pref.getValue(mContext, ITEM_SKU, false)) {
            if (admob == null) {
                admob = new AdMob(this, mAdView);
            }
        }
    }

    @SuppressLint({"AddJavascriptInterface", "SetJavaScriptEnabled"})
    private void initBrowser(Bundle savedInstanceState) {
        initAdMob();
        mWebview = findViewById(R.id.webview);
        webAppInterface = new WebAppInterface(this, ITEM_SKU, mWebview, admob);
        mContainer = findViewById(R.id.webview_frame);
        setWebViewSettings(mWebview);

        mWebview.setWebViewClient(new UriWebViewClient());
        mWebview.setWebChromeClient(new UriChromeClient());
        if (savedInstanceState != null) {
            mWebview.restoreState(savedInstanceState);
        } else {
            mWebview.loadUrl(target_url);
            evaluateJavascript(mWebview, js);
        }
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.back:
                if (mWebview.canGoBack()) {
                    onBackPressed();
                }
                break;
            case R.id.forward:
                if (mWebview.canGoForward()) {
                    mWebview.goForward();
                }
                break;
            case R.id.refresh:
                mWebview.loadUrl(target_url);
                evaluateJavascript(mWebview, js);
                if (!show_content) {
                    ProgressDialogHelper.showProgress(MainActivity.this);
                }
                break;
            case R.id.billing:
                if (mHelper != null) {
                    mHelper.launchPurchaseFlow(this, ITEM_SKU, 10001, mPurchaseFinishedListener, "");
                }
                break;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == QRCODE_REQEST) {
            if (resultCode == RESULT_OK) {
                qrCodeResult(data);
            }
        } else if (requestCode == FILE_CHOOSER_RESULT_CODE || requestCode == REQUEST_SELECT_FILE) {
            permissionSelectFile(requestCode, resultCode, data);
        } else {
            if (mHelper != null) {
                if (!mHelper.handleActivityResult(requestCode, resultCode, data)) {
                    super.onActivityResult(requestCode, resultCode, data);
                }
            } else {
                super.onActivityResult(requestCode, resultCode, data);
            }
        }
    }

    @Override
    public void receivedBroadcast() {
        try {
            if (mHelper != null) {
                mHelper.queryInventoryAsync(mGotInventoryListener);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (mWebview != null) {
            mWebview.destroy();
        }
        if (mWebviewPop != null) {
            mWebviewPop.destroy();
        }
        if (mBroadcastReceiver != null) {
            unregisterReceiver(mBroadcastReceiver);
        }
        if (mHelper != null) {
            try {
                mHelper.dispose();
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            mHelper = null;
        }
    }

    //This method will be called when the user will tap on allow or deny
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        //Checking the request code of our request
        if (requestCode == PermissionUtil.MY_PERMISSIONS_REQUEST_CALL) {
            //If permissionSelectFile is granted
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                UrlHandler.phoneLink(MainActivity.this, urlData);
            }
        } else if (requestCode == PermissionUtil.MY_PERMISSIONS_REQUEST_SMS) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                UrlHandler.smsLink(MainActivity.this, urlData);
            }
        } else if (requestCode == PermissionUtil.MY_PERMISSIONS_REQUEST_DOWNLOAD) {
            UrlHandler.download(MainActivity.this, urlData, contentDisposition, mimeType);
        } else if (requestCode == PermissionUtil.MY_PERMISSIONS_REQUEST_GEOLOCATION) {
            if (geoLocationCallback != null) {
                geoLocationCallback.invoke(geoLocationOrigin, true, false);
            }
        }
    }

    @Override
    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long l) {
        this.contentDisposition = contentDisposition;
        this.mimeType = mimeType;
        UrlHandler.downloadLink(this, url, contentDisposition, mimeType);
    }

    private void setToolbarButtonColor() {
        if (showToolBar) {
            if (mWebview.canGoBack()) {
                mBack.setColorFilter(ContextCompat.getColor(this, R.color.colorPrimary));
            } else {
                mBack.setColorFilter(ContextCompat.getColor(this, R.color.gray));
            }
            if (mWebview.canGoForward()) {
                mForward.setColorFilter(ContextCompat.getColor(this, R.color.colorPrimary));
            } else {
                mForward.setColorFilter(ContextCompat.getColor(this, R.color.gray));
            }
        }
    }

    @Override
    public void onRefresh() {
        mWebview.reload();
        mSwipeToRefresh.setRefreshing(false);
    }

    private class UriWebViewClient extends WebViewClient {
        @Deprecated
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            ProgressDialogHelper.showProgress(MainActivity.this);
            String host = Uri.parse(url).getHost();
            urlData = url;
            if (target_url_prefix.equals(host)) {
                if (mWebviewPop != null) {
                    mWebviewPop.setVisibility(View.GONE);
                    mContainer.removeView(mWebviewPop);
                    mWebviewPop = null;
                }
                evaluateJavascript(view, js);

                return false;
            }

            boolean result = UrlHandler.checkUrl(MainActivity.this, url);
            if (result) {
                ProgressDialogHelper.dismissProgress();
            } else {
                currentUrl = url;
                if (!show_content) {
                    ProgressDialogHelper.showProgress(MainActivity.this);
                }
            }
            evaluateJavascript(view, js);
            return result;
        }

        @TargetApi(Build.VERSION_CODES.N)
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            ProgressDialogHelper.showProgress(MainActivity.this);   //REMOVE THIS LINE
            String host = Uri.parse(request.getUrl().toString()).getHost();
            urlData = request.getUrl().toString();

            if (target_url_prefix.equals(host)) {
                if (mWebviewPop != null) {
                    mWebviewPop.setVisibility(View.GONE);
                    mContainer.removeView(mWebviewPop);
                    mWebviewPop = null;
                }
                evaluateJavascript(view, js);

                return false;
            }

            boolean result = UrlHandler.checkUrl(MainActivity.this, request.getUrl().toString());
            if (result) {
                ProgressDialogHelper.dismissProgress();

            } else {
                currentUrl = request.getUrl().toString();
                if (!show_content) {
                    ProgressDialogHelper.showProgress(MainActivity.this);
                }
            }
            evaluateJavascript(view, js);
            return result;
        }

        private void loadError(WebView view) {
            if (!NetworkHandler.isNetworkAvailable(view.getContext())) {
                view.loadUrl("file:///android_asset/www/NoInternet.html");
            }
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            if (url.endsWith(".pdf")) {
                UrlHandler.downloadLink(MainActivity.this, url, "", ".pdf");
            }
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            super.onReceivedSslError(view, handler, error);
            handler.proceed();
            loadError(view);
            hideStatusBar();
            ProgressDialogHelper.dismissProgress();
            evaluateJavascript(view, js);
        }


        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            super.onReceivedError(view, errorCode, description, failingUrl);
            loadError(view);
            hideStatusBar();
            ProgressDialogHelper.dismissProgress();
            evaluateJavascript(view, js);
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
            super.onReceivedHttpError(view, request, errorResponse);
            loadError(view);
            hideStatusBar();
            ProgressDialogHelper.dismissProgress();
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            showContent();
            setToolbarButtonColor();
            hideStatusBar();
            ProgressDialogHelper.dismissProgress();
            evaluateJavascript(view, js);

        }

        @Override
        public void onPageCommitVisible(WebView view, String url) {
            super.onPageCommitVisible(view, url);
            setToolbarButtonColor();
            hideStatusBar();
            ProgressDialogHelper.dismissProgress();
            evaluateJavascript(view, js);
        }
    }

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    public void setWebViewSettings(WebView webView) {
        setCookies(webView);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setSavePassword(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.getSettings().setSafeBrowsingEnabled(true);
        }
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
        webView.getSettings().setSupportMultipleWindows(true);
        webView.getSettings().setGeolocationEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setGeolocationEnabled(true);
        webView.getSettings().setGeolocationDatabasePath(getFilesDir().getPath());
        if (webAppInterface == null) {
            webAppInterface = new WebAppInterface(this, ITEM_SKU, webView, admob);
        }
        webView.addJavascriptInterface(webAppInterface, "android");
        webView.getSettings().setLoadWithOverviewMode(true);
        webView.getSettings().setAllowFileAccess(true);
//        webView.getSettings().setUserAgentString("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:61.0) Gecko/20100101 Firefox/61.0");
        //webView.getSettings().setUserAgentString("Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36");
        webView.getSettings().setUserAgentString("Mozilla/5.0 (Linux; <Android Version>; <Build Tag etc.>) AppleWebKit/<WebKit Rev> (KHTML, like Gecko) Chrome/<Chrome Rev> Mobile Safari/<WebKit Rev>");

        if (!TextUtils.isEmpty(getString(R.string.cache))) {
            webView.getSettings().setAppCacheEnabled(true);
            webView.getSettings().setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NORMAL);
            webView.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        } else {
            webView.getSettings().setAppCacheEnabled(false);
            webView.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
            webView.clearCache(true);
        }

        if (!TextUtils.isEmpty(getString(R.string.zoom))) {
            webView.getSettings().setSupportZoom(true);
            webView.getSettings().setBuiltInZoomControls(true);
            webView.getSettings().setDisplayZoomControls(false);
        }

        webView.setDownloadListener(MainActivity.this);

        evaluateJavascript(webView, js);
    }

    class UriChromeClient extends WebChromeClient {
        private View mCustomView;
        private WebChromeClient.CustomViewCallback mCustomViewCallback;
        protected FrameLayout mFullScreenContainer;
        private int mOriginalOrientation;
        private int mOriginalSystemUiVisibility;

        @Override
        public void onPermissionRequest(PermissionRequest request) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                request.grant(request.getResources());
            }
        }

        @Nullable
        @Override
        public Bitmap getDefaultVideoPoster() {
            if (mCustomView == null) {
                return null;
            }
            return BitmapFactory.decodeResource(getApplicationContext().getResources(), 213083767);
        }

        public void onHideCustomView() {
            ((FrameLayout) getWindow().getDecorView()).removeView(this.mCustomView);
            this.mCustomView = null;
            getWindow().getDecorView().setSystemUiVisibility(this.mOriginalSystemUiVisibility);
            this.mCustomViewCallback.onCustomViewHidden();
            this.mCustomViewCallback = null;
        }

        public void onShowCustomView(View paramView, WebChromeClient.CustomViewCallback paramCustomViewCallback) {
            if (this.mCustomView != null) {
                onHideCustomView();
                return;
            }
            this.mCustomView = paramView;
            this.mOriginalSystemUiVisibility = getWindow().getDecorView().getSystemUiVisibility();
            this.mOriginalOrientation = getRequestedOrientation();
            this.mCustomViewCallback = paramCustomViewCallback;
            ((FrameLayout) getWindow().getDecorView()).addView(this.mCustomView, new FrameLayout.LayoutParams(-1, -1));
            getWindow().getDecorView().setSystemUiVisibility(3846);
        }

        @SuppressLint({"AddJavascriptInterface", "SetJavaScriptEnabled"})
        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog,
                                      boolean isUserGesture, Message resultMsg) {

            Log.e("TEST", "onCreateWindow");
            mWebviewPop = new WebView(mContext);
            setWebViewSettings(mWebviewPop);
            mWebviewPop.setLayoutParams(new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT));
            mWebviewPop.setWebViewClient(new WebViewClient() {
                @Nullable
                @Override
                public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                    return super.shouldInterceptRequest(view, request);
                }

                @Override
                public void onPageFinished(WebView view, String url) {
                    Uri uri = Uri.parse(url);
                    if (target_url_prefix.equals(uri.getHost())) {
                        if (mWebviewPop != null) {
                            mWebviewPop.setVisibility(View.GONE);
                            mContainer.removeView(mWebviewPop);
                            mWebviewPop = null;
                            mWebview.setVisibility(View.VISIBLE);
                            mWebview.reload();
                            return;
                        }
                    }

                    super.onPageFinished(view, url);
                }
            });

            mContainer.addView(mWebviewPop);
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(mWebviewPop);
            resultMsg.sendToTarget();
            return true;
        }

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            super.onProgressChanged(view, newProgress);
        }

        @Override
        public void onCloseWindow(WebView window) {
            Log.v("TEST", "onCloseWindow");
            if (mWebviewPop != null) {
                mWebviewPop.setVisibility(View.GONE);
                mContainer.removeView(mWebviewPop);
                mWebviewPop = null;
                mWebview.setVisibility(View.VISIBLE);
                return;
            }
        }


        @Override
        public void onRequestFocus(WebView view) {
            Log.v("TEST", "onRequestFocus");
            super.onRequestFocus(view);
        }

        @Override
        public void onGeolocationPermissionsShowPrompt(final String origin,
                                                       final GeolocationPermissions.Callback callback) {
            // Always grant permissionSelectFile since the app itself requires location
            // permissionSelectFile and the user has therefore already granted it
            MainActivity.this.geoLocationOrigin = origin;
            MainActivity.this.geoLocationCallback = callback;
            PermissionUtil.geoLocationPermission(MainActivity.this, origin, callback);
        }

        // openFileChooser for Android 3.0+
        protected void openFileChooser(ValueCallback uploadMsg, String acceptType) {
            mUploadMessage = uploadMsg;
            File imageStorageDir = new File(
                    Environment.getExternalStoragePublicDirectory(
                            Environment.DIRECTORY_PICTURES)
                    , "AndroidExampleFolder");

            if (!imageStorageDir.exists()) {
                // Create AndroidExampleFolder at sdcard
                imageStorageDir.mkdirs();
            }

            // Create camera captured image file path and name
            File file = new File(
                    imageStorageDir + File.separator + "IMG_"
                            + String.valueOf(System.currentTimeMillis())
                            + ".jpg");
            mCapturedImageURI = FileProvider.getUriForFile(MainActivity.this, BuildConfig.APPLICATION_ID + ".fileprovider", file);

            // Camera capture image intent
            final Intent captureIntent = new Intent(
                    android.provider.MediaStore.ACTION_IMAGE_CAPTURE);

            captureIntent.putExtra(MediaStore.EXTRA_OUTPUT, mCapturedImageURI);

            Intent i = new Intent(Intent.ACTION_GET_CONTENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("*/*");

            // Create file chooser intent
            Intent chooserIntent = Intent.createChooser(i, "Image Chooser");

            // Set camera intent to file chooser
            chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Parcelable[]{captureIntent});

            // On select image call onActivityResult method of activity
            startActivityForResult(chooserIntent, FILE_CHOOSER_RESULT_CODE);


        }

        // For Lollipop 5.0+ Devices
        @TargetApi(Build.VERSION_CODES.LOLLIPOP)
        public boolean onShowFileChooser(WebView mWebView, ValueCallback<Uri[]> filePathCallback,
                                         WebChromeClient.FileChooserParams fileChooserParams) {
            if (uploadMessage != null) {
                uploadMessage.onReceiveValue(null);
                uploadMessage = null;
            }

            uploadMessage = filePathCallback;

            Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
                // Create the File where the photo should go
                File photoFile = null;
                try {
                    photoFile = createImageFile();
                    takePictureIntent.putExtra("PhotoPath", mCameraPhotoPath);
                } catch (IOException ex) {
                    // Error occurred while creating the File
                    Log.e("TEST", "Unable to create Image File", ex);
                }

                // Continue only if the File was successfully created
                if (photoFile != null) {
                    mCameraPhotoPath = "file:" + photoFile.getAbsolutePath();
                    takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT,
                            FileProvider.getUriForFile(MainActivity.this, BuildConfig.APPLICATION_ID + ".fileprovider", photoFile));
                } else {
                    takePictureIntent = null;
                }
            }

            Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
            contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
            contentSelectionIntent.setType("*/*");

            Intent[] intentArray;
            if (takePictureIntent != null) {
                intentArray = new Intent[]{takePictureIntent};
            } else {
                intentArray = new Intent[0];
            }

            Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
            chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
            chooserIntent.putExtra(Intent.EXTRA_TITLE, "Image Chooser");
            chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

            startActivityForResult(chooserIntent, FILE_CHOOSER_RESULT_CODE);

            return true;
        }

        private File createImageFile() throws IOException {
            // Create an image file name
            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String imageFileName = "JPEG_" + timeStamp + "_";
            File storageDir = Environment.getExternalStoragePublicDirectory(
                    Environment.DIRECTORY_PICTURES);
            File imageFile = File.createTempFile(
                    imageFileName,  /* prefix */
                    ".jpg",         /* suffix */
                    storageDir      /* directory */
            );
            return imageFile;
        }

        // openFileChooser for Android < 3.0
        public void openFileChooser(ValueCallback<Uri> uploadMsg) {
            openFileChooser(uploadMsg, "");
        }

        //For Android 4.1 only
        protected void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType, String capture) {
            openFileChooser(uploadMsg, acceptType);
        }
    }


    public void permissionSelectFile(int requestCode, int resultCode, Intent data) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {

            if (requestCode != FILE_CHOOSER_RESULT_CODE || uploadMessage == null) {
                super.onActivityResult(requestCode, resultCode, data);
                return;
            }

            Uri[] results = null;

            // Check that the response is a good one
            if (resultCode == Activity.RESULT_OK) {
                if (data == null) {
                    // If there is not data, then we may have taken a photo
                    if (mCameraPhotoPath != null) {
                        results = new Uri[]{Uri.parse(mCameraPhotoPath)};
                    }
                } else {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
            }

            uploadMessage.onReceiveValue(results);
            uploadMessage = null;

        } else if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.KITKAT) {
            if (requestCode != FILE_CHOOSER_RESULT_CODE || mUploadMessage == null) {
                super.onActivityResult(requestCode, resultCode, data);
                return;
            }

            if (requestCode == FILE_CHOOSER_RESULT_CODE) {

                if (null == this.mUploadMessage) {
                    return;

                }

                Uri result = null;

                try {
                    if (resultCode != RESULT_OK) {

                        result = null;

                    } else {

                        // retrieve from the private variable if the intent is null
                        result = data == null ? mCapturedImageURI : data.getData();
                    }
                } catch (Exception e) {
                    Toast.makeText(getApplicationContext(), "activity :" + e,
                            Toast.LENGTH_LONG).show();
                }

                mUploadMessage.onReceiveValue(result);
                mUploadMessage = null;

            }
        }
    }

    public void evaluateJavascript(WebView webView, String js) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            webView.evaluateJavascript(js, null);
        } else {
            webView.loadUrl("javascript:" + js);
        }
    }

    public void showQRCode() {
        if (PermissionUtil.isPermissionAllowed(this, android.Manifest.permission.CAMERA)) {
            startActivityForResult(new Intent(this, QRScanner.class), QRCODE_REQEST);
        } else {
            PermissionUtil.checkPermissions(this, new String[]{
                    android.Manifest.permission.CAMERA
            });
        }
    }

    public void qrCodeResult(Intent data) {
        String result = data.getStringExtra(QRScanner.RESULT_QRCODE);
        if (mWebview != null) {
            mWebview.loadUrl("javascript:QRCodeResult('" + result + "');");
        }
        if (mWebviewPop != null) {
            mWebviewPop.loadUrl("javascript:QRCodeResult(" + result + ");");
        }
    }

    private String getLocalHostWithPort() {
        return "file:///android_asset/web/index.html";
    }

    @Override
    public void onBackPressed() {
        if (mWebviewPop != null) {
            mWebviewPop.setVisibility(View.GONE);
            mContainer.removeView(mWebviewPop);
            mWebviewPop = null;
            mWebview.setVisibility(View.VISIBLE);
            return;
        }
        if (mWebview.canGoBack()) {
            mWebview.goBack();
        } else {
            super.onBackPressed();
        }
    }

}