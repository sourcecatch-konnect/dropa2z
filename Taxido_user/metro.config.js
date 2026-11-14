
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const os = require('os');

if (typeof os.availableParallelism !== 'function') {
  os.availableParallelism = () => os.cpus().length;
}

const config = {
  resolver: {
    blockList: /[\\/]android[\\/](?:app[\\/])?(?:\.cxx|build)[\\/]/,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
