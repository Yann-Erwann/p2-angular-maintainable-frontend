const config = require('./mobile.cjs');

module.exports = {
  ci: {
    ...config.ci,
    collect: {
      ...config.ci.collect,
      settings: { ...config.ci.collect.settings, preset: 'desktop' },
    },
  },
};
