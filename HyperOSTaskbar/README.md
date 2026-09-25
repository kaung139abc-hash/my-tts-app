# HyperOS Taskbar

Android prototype for Redmi/HyperOS.

## What it does
- Floating bottom taskbar using Android overlay permission
- Shows up to 4 launchable installed apps
- One-tap app launching
- Start/stop taskbar from the app

## Important HyperOS limitation
A third-party app cannot force arbitrary other apps to become independently resizable windows. HyperOS controls its Floating Window behavior. This project launches apps and lets HyperOS handle their window mode.

## Build
Open the `HyperOSTaskbar` folder in Android Studio and build the APK.

On the phone:
1. Install the APK.
2. Open HyperOS Taskbar.
3. Allow **Display over other apps**.
4. Tap **Start Taskbar**.
