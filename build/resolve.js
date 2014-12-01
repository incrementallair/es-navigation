"use strict";
Object.defineProperties(exports, {
  resolveModulePath: {get: function() {
      return resolveModulePath;
    }},
  __esModule: {value: true}
});
var $__fs__,
    $__path__,
    $__resolve__;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var resolve = ($__resolve__ = require("resolve"), $__resolve__ && $__resolve__.__esModule && $__resolve__ || {default: $__resolve__}).default;
function resolveModulePath(basePath, moduleString) {
  var failsafeMax = 10;
  var basedir = path.dirname(basePath);
  var baseext = path.extname(basePath);
  if (path.extname(moduleString) != baseext)
    moduleString += baseext;
  var basemod,
      remmod;
  var splitModule = moduleString.split(path.sep);
  if (splitModule.length == 1 || splitModule[0] == '.') {
    if (splitModule[0] == '.')
      failsafeMax = 1;
    basemod = moduleString;
    remmod = "";
  } else {
    basemod = splitModule[0];
    remmod = splitModule.splice(1).join(path.sep);
  }
  var failsafe = 0;
  while (basedir != path.sep && failsafe++ <= failsafeMax) {
    var libs = [""];
    var packagePath = path.join(basedir, basemod, "package.json");
    var packageJson = JSON.parse(readFileIfExists(packagePath));
    if (packageJson && packageJson.directories) {
      if (packageJson.directories.dist)
        libs.push(packageJson.directories.dist);
      if (packageJson.directories.lib)
        libs.push(packageJson.directories.lib);
    }
    for (var $__3 = libs[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__4; !($__4 = $__3.next()).done; ) {
      var lib = $__4.value;
      {
        var attempt = path.join(basedir, basemod, lib, remmod);
        if (fs.existsSync(attempt))
          return Promise.resolve(attempt);
      }
    }
    basedir = path.join(basedir, "..");
  }
  return Promise.reject(moduleString + " not found from " + basePath + ".");
}
function readFileIfExists(path) {
  try {
    if (fs.existsSync(path))
      return fs.readFileSync(path);
    return null;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
