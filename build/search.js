"use strict";
Object.defineProperties(exports, {
  findSymbolDefinition: {get: function() {
      return findSymbolDefinition;
    }},
  __esModule: {value: true}
});
var $__parse__,
    $__util__,
    $__fs__,
    $__path__,
    $__resolve__;
'use strict';
var parseBuffer = ($__parse__ = require("./parse"), $__parse__ && $__parse__.__esModule && $__parse__ || {default: $__parse__}).parseBuffer;
var util = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var resolve = ($__resolve__ = require("resolve"), $__resolve__ && $__resolve__.__esModule && $__resolve__ || {default: $__resolve__}).default;
;
function findSymbolDefinition(symbol, path) {
  var namespace = arguments[2] !== (void 0) ? arguments[2] : null;
  var isRoot = arguments[3] !== (void 0) ? arguments[3] : true;
  var scope = arguments[4] !== (void 0) ? arguments[4] : null;
  if (!scope) {
    try {
      var buffer = fs.readFileSync(path);
      scope = parseBuffer(buffer)[0];
    } catch (error) {
      console.error("Couldn't read file at path: " + path);
      return null;
    }
  }
  if (isRoot) {
    if (!namespace) {
      for (var $__5 = scope.definedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__6; !($__6 = $__5.next()).done; ) {
        var sym = $__6.value;
        if (sym.localName == symbol)
          return {
            path: path,
            loc: sym.location
          };
      }
    }
    for (var $__7 = scope.importedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__8; !($__8 = $__7.next()).done; ) {
      var sym$__13 = $__8.value;
      {
        if (namespace) {
          if (sym$__13.localName == namespace)
            return findInModule(symbol, path, sym$__13.moduleRequest);
        } else {
          if (sym$__13.localName == symbol)
            return findInModule(sym$__13.importName, path, sym$__13.moduleRequest);
        }
      }
    }
  } else {
    for (var $__11 = scope.exportedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__12; !($__12 = $__11.next()).done; ) {
      var sym$__14 = $__12.value;
      {
        if (sym$__14.importName == "*") {
          var result = findInModule(symbol, path, sym$__14.moduleRequest);
          if (result)
            return result;
        }
        if (sym$__14.exportName == symbol) {
          if (sym$__14.type == "exportDeclaration")
            return {
              path: path,
              loc: sym$__14.location
            };
          if (sym$__14.moduleRequest) {
            return findInModule(symbol, path, sym$__14.moduleRequest);
          } else {
            for (var $__9 = scope.definedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
                $__10; !($__10 = $__9.next()).done; ) {
              var def = $__10.value;
              if (def.localName == symbol)
                return {
                  path: path,
                  loc: def.location
                };
            }
            console.error("Exported undefined symbol: " + symbol + " in " + path);
            return null;
          }
        }
      }
    }
  }
  console.error("Unable to resolve " + symbol + " in " + path);
  return null;
  function findInModule(symbol, basePath, moduleString) {
    var modulePath;
    try {
      modulePath = resolveModulePath(basePath, moduleString);
    } catch (error) {
      console.error("Couldn't resolve " + moduleString + " from " + basePath);
      return null;
    }
    try {
      return findSymbolDefinition(symbol, modulePath, null, false);
    } catch (error) {
      console.error("Couldn't find " + symbol + " in " + modulePath);
      return null;
    }
    return null;
  }
}
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
