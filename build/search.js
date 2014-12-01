"use strict";
Object.defineProperties(exports, {
  findSymbolDefinition: {get: function() {
      return findSymbolDefinition;
    }},
  __esModule: {value: true}
});
var $__cache__,
    $__util__,
    $__fs__;
'use strict';
var parseBuffer = ($__cache__ = require("./cache"), $__cache__ && $__cache__.__esModule && $__cache__ || {default: $__cache__}).parseBuffer;
var util = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
;
function findSymbolDefinition(symbol, path) {
  var namespace = arguments[2] !== (void 0) ? arguments[2] : null;
  var isRoot = arguments[3] !== (void 0) ? arguments[3] : true;
  var scope = arguments[4] !== (void 0) ? arguments[4] : null;
  if (path == "unresolved")
    return null;
  if (path == "notFound") {
    console.warn("Module not resolved.");
    return null;
  }
  if (!scope) {
    var buffer;
    try {
      buffer = fs.readFileSync(path);
    } catch (error) {
      console.warn("Couldn't read module at path: " + path);
      return null;
    }
    try {
      scope = parseBuffer(buffer, path)[0];
    } catch (variable) {
      console.warn("Couldn't parse module at path: " + path);
      return null;
    }
  }
  if (isRoot) {
    if (!namespace) {
      for (var $__3 = scope.definedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__4; !($__4 = $__3.next()).done; ) {
        var sym = $__4.value;
        if (sym.localName == symbol)
          return {
            path: path,
            loc: sym.location
          };
      }
    }
    for (var $__5 = scope.importedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__6; !($__6 = $__5.next()).done; ) {
      var sym$__11 = $__6.value;
      {
        if (namespace) {
          if (sym$__11.localName == namespace)
            return findInModule(symbol, path, sym$__11.moduleRequest);
        } else {
          if (sym$__11.localName == symbol)
            return findInModule(sym$__11.importName, path, sym$__11.moduleRequest);
        }
      }
    }
  } else {
    for (var $__9 = scope.exportedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__10; !($__10 = $__9.next()).done; ) {
      var sym$__12 = $__10.value;
      {
        if (sym$__12.importName == "*") {
          var result = findInModule(symbol, path, sym$__12.moduleRequest);
          if (result)
            return result;
        }
        if (sym$__12.exportName == symbol) {
          if (sym$__12.type == "exportDeclaration")
            return {
              path: path,
              loc: sym$__12.location
            };
          if (sym$__12.moduleRequest) {
            return findInModule(sym$__12.localName, path, sym$__12.moduleRequest);
          } else {
            for (var $__7 = scope.definedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
                $__8; !($__8 = $__7.next()).done; ) {
              var def = $__8.value;
              {
                if (def.localName == sym$__12.localName)
                  return {
                    path: path,
                    loc: def.location
                  };
              }
            }
            console.warn("Exported undefined symbol: " + symbol + " in module " + path);
            return null;
          }
        }
      }
    }
  }
  console.warn("Unable to find definition of " + symbol + " in module " + path);
  return null;
  function findInModule(symbol, basePath, moduleRequest) {
    try {
      return findSymbolDefinition(symbol, moduleRequest, null, false);
    } catch (error) {
      console.warn("Unable to find definition of " + symbol + " in module " + moduleRequest);
      return null;
    }
  }
}
