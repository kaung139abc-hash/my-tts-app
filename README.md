# Recovery AI

Mobile-first assistant for legitimate Google/Gmail and Mobile Legends account recovery.

Included:
- React/Vite recovery UI
- Official recovery links
- Android Accessibility Service agent foundation
- Safe visible-page inspection
- GitHub Actions APK build
- Explicit credential safety boundary

Android agent:
The Android companion can inspect visible recovery-page UI after the user explicitly enables Accessibility Service. It is designed to assist with navigation and page-state recognition.

It does NOT read, store, transmit, or enter passwords, OTP/verification codes, passkeys, or backup codes.

Account ownership decisions remain with Google, Moonton/MLBB, or the relevant provider.

Build APK:
Open GitHub Actions and run Build Android agent manually. The workflow uploads recovery-ai-debug-apk as an artifact.

Use:
1. Install the debug APK on Android.
2. Open Recovery AI.
3. Enable Accessibility Service in Android Settings.
4. Open the official recovery page from the app.
5. Complete sensitive verification yourself on the official service.
6. Use the agent only for visible page-state assistance and safe navigation.

Never give recovery codes or passwords to a person or third-party recovery service.
