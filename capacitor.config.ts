import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.svenfran.divvyapp',
  appName: 'Divvy',
  webDir: 'www',
  server: {
    cleartext: true,
    androidScheme: "http"
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false
    }
  }
};

export default config;
