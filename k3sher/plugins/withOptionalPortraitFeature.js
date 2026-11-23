const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withOptionalPortraitFeature(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest['uses-feature']) {
      manifest['uses-feature'] = [];
    }

    const features = manifest['uses-feature'];
    const featureName = 'android.hardware.screen.portrait';

    const existingFeature = features.find(
      (feature) => feature.$?.['android:name'] === featureName
    );

    if (existingFeature) {
      existingFeature.$['android:required'] = 'false';
    } else {
      features.push({
        $: {
          'android:name': featureName,
          'android:required': 'false',
        },
      });
    }

    return config;
  });
};