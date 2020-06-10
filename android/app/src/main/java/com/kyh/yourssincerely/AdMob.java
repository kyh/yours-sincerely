package com.kyh.yourssincerely;

import android.content.Context;
import android.text.TextUtils;
import android.view.View;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.doubleclick.PublisherAdRequest;
import com.google.android.gms.ads.doubleclick.PublisherAdView;
import com.google.android.gms.ads.doubleclick.PublisherInterstitialAd;

/**
 * Created by dragank on 10/1/2016.
 */
public class AdMob {
    private static final String TAG = "ADMOB";

    private PublisherInterstitialAd mInterstitialAd;
    private Context mContext;
    private PublisherAdView adView;

    public void destroy() {
        mInterstitialAd = null;
        adView = null;
    }

    public AdMob(Context mContext, PublisherAdView adView) {
        this.mContext = mContext;
        this.adView = adView;
        initBannerAds();
        initInterstitialAd();
    }

    public void initInterstitialAd() {
        String interstitialId = mContext.getString(R.string.interstitial_ad_unit_id);
        if (!TextUtils.isEmpty(interstitialId)) {
            mInterstitialAd = new PublisherInterstitialAd(mContext);
            mInterstitialAd.setAdUnitId(interstitialId);
            mInterstitialAd.setAdListener(new AdListener() {
                public void onAdLoaded() {
                    if (mInterstitialAd.isLoaded()) {
                        mInterstitialAd.show();
                    }
                }
            });
        }
    }

    public void initBannerAds() {
        MobileAds.initialize(mContext, mContext.getString(R.string.ad_app_id));
        if (adView != null) {
            String bannerId = mContext.getString(R.string.banner_ad_unit_id);
            if (!TextUtils.isEmpty(bannerId)) {
                adView.setVisibility(View.VISIBLE);
            } else {
                adView.setVisibility(View.GONE);
            }
        }
    }

    public void requestInterstitialAd() {
        ((MainActivity)mContext).runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (mInterstitialAd != null) {
                    String interstitialId = mContext.getString(R.string.interstitial_ad_unit_id);
                    if (!TextUtils.isEmpty(interstitialId)) {
                        if (SuperViewWeb.isActivityVisible()) {
                            mInterstitialAd.loadAd(getAdRequest());
                        }
                    }
                }
            }
        });

    }

    public void requestBannerAds() {
        ((MainActivity)mContext).runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (adView != null) {
                    String bannerId = mContext.getString(R.string.banner_ad_unit_id);
                    if (!TextUtils.isEmpty(bannerId)) {
                        adView.loadAd(getAdRequest());
                    }
                }
            }
        });

    }

    private PublisherAdRequest getAdRequest() {
        return new PublisherAdRequest.Builder()
                .addTestDevice(AdRequest.DEVICE_ID_EMULATOR)
                .build();
    }
}
