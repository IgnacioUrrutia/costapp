import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.costapp.app',
  appName: 'CostApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "1082316027619-f2rjigcscd1afau0nh14k3s9sn6tr6hg.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
