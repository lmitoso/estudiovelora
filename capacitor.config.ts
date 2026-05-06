import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.660d267a7e7f43749410dd9bae4b4b2d',
  appName: 'estudiovelora',
  webDir: 'dist',
  server: {
    url: 'https://660d267a-7e7f-4374-9410-dd9bae4b4b2d.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#C9A96E',
    },
  },
};

export default config;
