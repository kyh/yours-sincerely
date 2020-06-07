//
//  AppDelegate.swift
//

import UIKit
import SuperViewCore

#if canImport(SuperViewAdMob)
import SuperViewAdMob
#endif

#if canImport(SuperViewCardScan)
import SuperViewCardScan
#endif

#if canImport(SuperViewCardIO)
import SuperViewCardIO
#endif

#if canImport(SuperViewFacebook)
import SuperViewFacebook
#endif

#if canImport(SuperViewOneSignal)
import SuperViewOneSignal
#endif

#if canImport(SuperViewLocation)
import SuperViewLocation
#endif

#if canImport(SuperViewQR)
import SuperViewQR
#endif

#if canImport(SuperViewFirebase)
import SuperViewFirebase
#endif

#if canImport(SuperViewFreshchat)
import SuperViewFreshchat
#endif

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        SuperView.configure(application: application, launchOptions: launchOptions)
        
        if #available(iOS 13, *) {
            #if canImport(SuperViewAdMob)
            SuperView.configureAdMob()
            #endif
            
            #if canImport(SuperViewCardIO)
            SuperView.configureCardIO()
            #endif
            
            #if canImport(SuperViewCardScan)
            SuperView.configureCardScan()
            #endif
            
            #if canImport(SuperViewFacebook)
            SuperView.configureFacebook()
            #endif
            
            #if canImport(SuperViewFirebase)
            SuperView.configureFirebase()
            #endif
            
            #if canImport(SuperViewLocation)
            SuperView.configureLocation()
            #endif
            
            #if canImport(SuperViewOneSignal)
            SuperView.configureOneSignal()
            #endif
            
            #if canImport(SuperViewQR)
            SuperView.configureQR()
            #endif
            
            #if canImport(SuperViewFreshchat)
            SuperView.configureFreshchat()
            #endif
        }
        return true
    }

    func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return SuperView.handleURL(url: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {

        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb, let url = userActivity.webpageURL else {
            return false
        }
        application.open(url)
        return true
    }
}
