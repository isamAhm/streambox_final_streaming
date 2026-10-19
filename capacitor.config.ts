import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.streambox.app',
  appName: 'Streambox',
  webDir: 'www',
  server: {
    url: process.env.CAP_SERVER_URL || 'https://streamboxx.duckdns.org',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      'streamboxx.duckdns.org',
      '*.clerk.accounts.dev',
      'clerk.com',
      '*.clerk.com',
      'image.tmdb.org',
      'img.youtube.com',
      'www.youtube.com',
      'youtube.com',
      '*.youtube.com',
      // Add video streaming hosts as needed
      '*' // Allow all for video hosts - can be restricted after testing
    ]
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    }
  }
};

export default config;
