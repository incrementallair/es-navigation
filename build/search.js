"use strict";
Object.defineProperties(exports, {
  findSymbolDefinition: {get: function() {
      return findSymbolDefinition;
    }},
  __esModule: {value: true}
});
var $__cache__,
    $__util__,
    $__fs__,
    $__resolve__;
'use strict';
var parseBuffer = ($__cache__ = require("./cache"), $__cache__ && $__cache__.__esModule && $__cache__ || {default: $__cache__}).parseBuffer;
var util = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var resolveModulePath = ($__resolve__ = require("./resolve"), $__resolve__ && $__resolve__.__esModule && $__resolve__ || {default: $__resolve__}).default;
;
function findSymbolDefinition(symbol, path) {
  var namespace = arguments[2] !== (void 0) ? arguments[2] : null;
  var isRoot = arguments[3] !== (void 0) ? arguments[3] : true;
  var scope = arguments[4] !== (void 0) ? arguments[4] : null;
  if (!scope) {
    try {
      var buffer = fs.readFileSync(path);
      scope = parseBuffer(buffer, path)[0];
    } catch (error) {
      console.error("Couldn't read file at path: " + path);
      return null;
    }
  }
  if (isRoot) {
    if (!namespace) {
      for (var $__4 = scope.definedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__5; !($__5 = $__4.next()).done; ) {
        var sym = $__5.value;
        if (sym.localName == symbol)
          return {
            path: path,
            loc: sym.location
          };
      }
    }
    for (var $__6 = scope.importedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__7; !($__7 = $__6.next()).done; ) {
      var sym$__12 = $__7.value;
      {
        if (namespace) {
          if (sym$__12.localName == namespace)
            return findInModule(symbol, path, sym$__12.moduleRequest);
        } else {
          if (sym$__12.localName == symbol)
            return findInModule(sym$__12.importName, path, sym$__12.moduleRequest);
        }
      }
    }
  } else {
    for (var $__10 = scope.exportedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__11; !($__11 = $__10.next()).done; ) {
      var sym$__13 = $__11.value;
      {
        if (sym$__13.importName == "*") {
          var result = findInModule(symbol, path, sym$__13.moduleRequest);
          if (result)
            return result;
        }
        if (sym$__13.exportName == symbol) {
          if (sym$__13.type == "exportDeclaration")
            return {
              path: path,
              loc: sym$__13.location
            };
          if (sym$__13.moduleRequest) {
            return findInModule(symbol, path, sym$__13.moduleRequest);
          } else {
            for (var $__8 = scope.definedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
                $__9; !($__9 = $__8.next()).done; ) {
              var def = $__9.value;
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
  function findInModule(symbol, basePath, moduleRequest) {
    try {
      return findSymbolDefinition(symbol, moduleRequest, null, false);
    } catch (error) {
      console.error("Couldn't find " + symbol + " in " + moduleRequest);
      return null;
    }
  }
}
