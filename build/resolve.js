"use strict";
Object.defineProperties(exports, {
  resolveModulePath: {get: function() {
      return resolveModulePath;
    }},
  __esModule: {value: true}
});
var $__path__,
    $__resolve__;
'use strict';
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var resolve = ($__resolve__ = require("resolve"), $__resolve__ && $__resolve__.__esModule && $__resolve__ || {default: $__resolve__}).default;
;
function resolveModulePath(basePath, moduleString) {
  var basedir = path.dirname(basePath);
  try {
    return resolve.sync(moduleString, {
      basedir: basedir,
      extensions: ['.js', '.es6']
    });
  } catch (error) {
    throw error;
  }
}
