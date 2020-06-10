package com.kyh.yourssincerely.util;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.webkit.GeolocationPermissions;

/**
 * Created by dragank on 10/1/2016.
 */
public class PermissionUtil {

    public static final int MY_PERMISSIONS_REQUEST_CALL = 10;
    public static final int MY_PERMISSIONS_REQUEST_SMS = 11;
    public static final int MY_PERMISSIONS_REQUEST_DOWNLOAD = 12;
    public static final int MY_PERMISSIONS_REQUEST_GEOLOCATION= 13;

    //We are calling this method to check the permissionSelectFile status
    public static boolean isPermissionAllowed(Context mContext, String permission) {
        //Getting the permissionSelectFile status
        int result = ContextCompat.checkSelfPermission(mContext, permission);

        //If permissionSelectFile is granted returning true
        if (result == PackageManager.PERMISSION_GRANTED)
            return true;

        //If permissionSelectFile is not granted returning false
        return false;
    }

    //Requesting permissionSelectFile
    public static void requestPermission(Activity mActivity, String permision, int permisionNumer) {

        if (ActivityCompat.shouldShowRequestPermissionRationale(mActivity, permision)) {
            //If the user has denied the permissionSelectFile previously your code will come to this block
            //Here you can explain why you need this permissionSelectFile
            //Explain here why you need this permissionSelectFile
        }

        //And finally ask for the permissionSelectFile
        ActivityCompat.requestPermissions(mActivity, new String[]{permision}, permisionNumer);
    }

    public static void geoLocationPermission(Activity mActivity, String origin, GeolocationPermissions.Callback callback) {
        if (PermissionUtil.isPermissionAllowed(mActivity, android.Manifest.permission.ACCESS_FINE_LOCATION)) {
            callback.invoke(origin, true, false);
        }
        PermissionUtil.requestPermission(mActivity, android.Manifest.permission.ACCESS_FINE_LOCATION,
                PermissionUtil.MY_PERMISSIONS_REQUEST_GEOLOCATION);
    }

    public static void checkPermissions(Activity mActivity, String[] permissions) {
        boolean needsPermission = false;
        for (String permission : permissions) {
            int permissionCheck = ContextCompat.checkSelfPermission(mActivity, permission);
            if (PackageManager.PERMISSION_GRANTED != permissionCheck) {
                needsPermission = true;
                break;
            }
        }

        if (needsPermission) {
            ActivityCompat.requestPermissions(mActivity, permissions, 0);
        }
    }
}
