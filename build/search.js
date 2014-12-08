"use strict";
Object.defineProperties(exports, {
  findSymbolDefinition: {get: function() {
      return findSymbolDefinition;
    }},
  __esModule: {value: true}
});
var $__es_45_parse_45_tools__,
    $__fs__;
var tools = ($__es_45_parse_45_tools__ = require("es-parse-tools"), $__es_45_parse_45_tools__ && $__es_45_parse_45_tools__.__esModule && $__es_45_parse_45_tools__ || {default: $__es_45_parse_45_tools__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
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
      for (var $__2 = scope.definedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__3; !($__3 = $__2.next()).done; ) {
        var sym = $__3.value;
        if (sym.localName == symbol)
          return {
            path: path,
            loc: sym.location
          };
      }
    }
    for (var $__4 = scope.importedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__5; !($__5 = $__4.next()).done; ) {
      var sym$__10 = $__5.value;
      {
        if (namespace) {
          if (sym$__10.localName == namespace)
            return findInModule(symbol, path, sym$__10.moduleRequest);
        } else {
          if (sym$__10.localName == symbol)
            return findInModule(sym$__10.importName, path, sym$__10.moduleRequest);
        }
      }
    }
  } else {
    for (var $__8 = scope.exportedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__9; !($__9 = $__8.next()).done; ) {
      var sym$__11 = $__9.value;
      {
        if (sym$__11.importName == "*") {
          var result = findInModule(symbol, path, sym$__11.moduleRequest);
          if (result)
            return result;
        }
        if (sym$__11.exportName == symbol) {
          if (sym$__11.type == "exportDeclaration")
            return {
              path: path,
              loc: sym$__11.location
            };
          if (sym$__11.moduleRequest) {
            return findInModule(sym$__11.localName, path, sym$__11.moduleRequest);
          } else {
            for (var $__6 = scope.definedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
                $__7; !($__7 = $__6.next()).done; ) {
              var def = $__7.value;
              {
                if (def.localName == sym$__11.localName)
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
