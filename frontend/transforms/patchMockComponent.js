'use strict';

/**
 * Jest transform that wraps babel-jest but patches react-native/jest/mockComponent.js
 * before Babel runs on it.
 *
 * React Native 0.81.5 introduced the `component()` syntax which Babel compiles to
 * arrow functions. Arrow functions have no `prototype`, so the line:
 *   RealComponent.prototype.constructor instanceof React.Component
 * in mockComponent.js throws TypeError for those components.
 *
 * This transform adds a null-guard so the check safely falls back to React.Component.
 */

const { createTransformer } = require('babel-jest').default;
// Create a standard babel-jest transformer with no extra options; it picks up babel.config.js
const transformer = createTransformer();

module.exports = {
  process(sourceCode, sourcePath, options) {
    let code = sourceCode;

    if (sourcePath.includes('react-native/jest/mockComponent')) {
      code = code.replace(
        'RealComponent.prototype.constructor instanceof React.Component',
        '(RealComponent.prototype != null && RealComponent.prototype.constructor instanceof React.Component)',
      );
    }

    return transformer.process(code, sourcePath, options);
  },

  getCacheKey(...args) {
    return typeof transformer.getCacheKey === 'function'
      ? transformer.getCacheKey(...args) + '-patchMockComponent'
      : String(args);
  },
};
