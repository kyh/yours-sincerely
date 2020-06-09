package com.android.yourssincerely;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.location.Location;
import android.media.MediaPlayer;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import android.text.TextUtils;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.android.yourssincerely.util.LocalNotification;
import com.android.yourssincerely.util.Pref;
import com.android.yourssincerely.util.ProgressDialogHelper;
import com.android.yourssincerely.util.UrlHandler;
import com.android.yourssincerely.R;
import com.onesignal.OneSignal;

import org.json.JSONObject;

import fr.quentinklein.slt.LocationTracker;
import fr.quentinklein.slt.TrackerSettings;
import hotchemi.android.rate.AppRate;

/**
 * Created by dragank on 2/20/2017.
 */

public class WebAppInterface {
    private MainActivity mContext;
    private String productId;
    private WebView mWebview;
    private LocationTracker myTracker;
    private AdMob adMob;

    /** Instantiate the interface and set the context */
    WebAppInterface(MainActivity mContext, String productId, WebView mWebView, AdMob adMob) {
        this.mContext = mContext;
        this.productId = productId;
        this.mWebview = mWebView;
        this.adMob = adMob;
    }

    @JavascriptInterface
    public void QRCodeScanner() {
        mContext.showQRCode();
    }

    @JavascriptInterface
    public String getOneSignalRegisteredId() {
        return Pref.getValue(mContext, Pref.ONESIGNAL_REGISTERED_ID, "");
    }

    @JavascriptInterface
    public void getOneSignalTags() {
        OneSignal.getTags(new OneSignal.GetTagsHandler() {
            @Override
            public void tagsAvailable(final JSONObject tags) {
                mWebview.post(new Runnable() {
                    @Override
                    public void run() {
                        mWebview.loadUrl("javascript:oneSignalTags(" + tags.toString() +")");
                    }
                });
            }
        });
    }

    @JavascriptInterface
    public void downloadFile(String url, String extension) {
        UrlHandler.download(mContext, url, "", extension);
    }

    @JavascriptInterface
    public void setOneSignalTag(String key, String value) {
        OneSignal.sendTag(key, value);
    }

    @JavascriptInterface
    public String getFirebaseToken() {
        return  Pref.getValue(mContext, Pref.FIREBASE_TOKEN, "");
    }


    @JavascriptInterface
    public String getVersion() {
        String version = "";
        try {
            PackageInfo pInfo = mContext.getPackageManager().getPackageInfo(mContext.getPackageName(), 0);
            version = pInfo.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return version;
    }


    @JavascriptInterface
    public boolean isProductPurchased() {
        return Pref.getValue(mContext, productId, false);
    }


    @JavascriptInterface
    public void createNotification(String displayName, String message) {
        LocalNotification.createNotification(mContext, displayName, message);
    }

    @JavascriptInterface
    public void showLoader() {
        ProgressDialogHelper.showProgress(mContext);
    }

    @JavascriptInterface
    public void hideLoader() {
        ProgressDialogHelper.dismissProgress();
    }

    @JavascriptInterface
    public void fontSizeNormal() {
        mWebview.post(new Runnable() {
            @Override
            public void run() {
                WebSettings webSettings = mWebview.getSettings();
                webSettings.setTextSize(WebSettings.TextSize.NORMAL);
            }
        });
    }

    @JavascriptInterface
    public void fontSizeLarger() {
        mWebview.post(new Runnable() {
            @Override
            public void run() {
                WebSettings webSettings = mWebview.getSettings();
                webSettings.setTextSize(WebSettings.TextSize.LARGER);
            }
        });
    }

    @JavascriptInterface
    public void fontSizeLargest() {
        mWebview.post(new Runnable() {
            @Override
            public void run() {
                WebSettings webSettings = mWebview.getSettings();
                webSettings.setTextSize(WebSettings.TextSize.LARGEST);
            }
        });
    }

    @JavascriptInterface
    public void fontSizeSmaller() {
        mWebview.post(new Runnable() {
            @Override
            public void run() {
                WebSettings webSettings = mWebview.getSettings();
                webSettings.setTextSize(WebSettings.TextSize.SMALLER);
            }
        });

    }

    @JavascriptInterface
    public void fontSizeSmallest() {
        mWebview.post(new Runnable() {
            @Override
            public void run() {
                WebSettings webSettings = mWebview.getSettings();
                webSettings.setTextSize(WebSettings.TextSize.SMALLEST);
            }
        });
    }


    @JavascriptInterface
    public void requestBannerAds() {
        if (!isProductPurchased()) {
            if (adMob != null) {
                adMob.requestBannerAds();
            }
        }
    }

    @JavascriptInterface
    public void requestInterstitialAd() {
        if (!isProductPurchased()) {
            if (adMob != null) {
                adMob.requestInterstitialAd();
            }
        }
    }


    @JavascriptInterface
    public void rateApp() {
        AppRate.with(mContext).showRateDialog((MainActivity)mContext);
    }

    @JavascriptInterface
    public void playSound(String fname) {
        int resID = mContext.getResources().getIdentifier(fname, "raw", mContext.getPackageName());
        if (resID > 0) {
            MediaPlayer mediaPlayer = MediaPlayer.create(mContext, resID);
            mediaPlayer.start();
        }
    }

    public void startGoogleTracker() {
        if (!TextUtils.isEmpty(mContext.getString(R.string.enable_gps))) {
            if (ContextCompat.checkSelfPermission(mContext, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                    && ContextCompat.checkSelfPermission(mContext, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                // You need to ask the user to enable the permissions
            } else {
                if (myTracker != null) {
                    myTracker.startListening();
                    return;
                }

                TrackerSettings settings = new TrackerSettings()
                        .setUseGPS(true)
                        .setUseNetwork(true)
                        .setUsePassive(true)
                        .setTimeBetweenUpdates(10 * 1000)
                        .setMetersBetweenUpdates(10);

                myTracker = new LocationTracker(mContext, settings) {
                    @Override
                    public void onLocationFound(@NonNull Location location) {
                        mWebview.loadUrl("javascript:locationTracker(" + location.getLongitude() + ", " +  location.getLatitude()+ ")");
                    }

                    @Override
                    public void onTimeout() {
                    }
                };
                myTracker.startListening();
            }
        }

    }

    public void stopGoogleTracker() {
        if (myTracker != null) {
            myTracker.stopListening();
        }
    }
}

