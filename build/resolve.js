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
'use strict';
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var resolve = ($__resolve__ = require("resolve"), $__resolve__ && $__resolve__.__esModule && $__resolve__ || {default: $__resolve__}).default;
;
function resolveModulePath(basePath, moduleString) {
  return new Promise((function(resolve, reject) {
    try {
      var failsafeMax = 10;
      var basedir = path.dirname(basePath);
      if (path.extname(moduleString) === "")
        moduleString += ".js";
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
        for (var $__3 = ["", "lib/", "src/", "build/", "bin/"][$traceurRuntime.toProperty(Symbol.iterator)](),
            $__4; !($__4 = $__3.next()).done; ) {
          var dir = $__4.value;
          {
            var attempt = path.join(basedir, basemod, dir, remmod);
            if (fs.existsSync(attempt))
              return resolve(attempt);
          }
        }
        basedir = path.join(basedir, "..");
      }
    } catch (error) {
      return reject("notFound");
    }
    return reject("notFound");
  }));
}
