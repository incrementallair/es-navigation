"use strict";
Object.defineProperties(exports, {
  findSymbolDefinition: {get: function() {
      return findSymbolDefinition;
    }},
  __esModule: {value: true}
});
var $__es_45_parse_45_tools__,
    $__fs__,
    $__util__;
var tools = ($__es_45_parse_45_tools__ = require("es-parse-tools"), $__es_45_parse_45_tools__ && $__es_45_parse_45_tools__.__esModule && $__es_45_parse_45_tools__ || {default: $__es_45_parse_45_tools__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var asyncForEach = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}).asyncForEach;
function findSymbolDefinition(symbol, path, namespace, isRoot, _scope, callback) {
  if (path == "notFound")
    return null;
  tools.parseUri(path, (function(error, scopes) {
    var scope = _scope || scopes[0];
    if (isRoot) {
      if (!namespace) {
        for (var $__3 = scope.definedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
            $__4; !($__4 = $__3.next()).done; ) {
          var sym = $__4.value;
          if (sym.localName == symbol)
            return callback(null, {
              path: path,
              loc: sym.location
            });
        }
      }
      for (var $__5 = scope.importedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__6; !($__6 = $__5.next()).done; ) {
        var sym$__9 = $__6.value;
        {
          if (namespace) {
            if (sym$__9.localName == namespace)
              return findInModule(symbol, path, sym$__9.moduleRequest, callback);
          } else {
            if (sym$__9.localName == symbol)
              return findInModule(sym$__9.importName, path, sym$__9.moduleRequest, callback);
          }
        }
      }
    } else {
      asyncForEach(scope.exportedSymbols, callback, (function(sym, _callback) {
        ((function(cb) {
          if (sym.importName == "*") {
            findInModule(symbol, path, sym.moduleRequest, (function(error, result) {
              if (result)
                cb(null, result);
              return cb(null, null);
            }));
          }
          return cb(null, null);
        }))((function(error, result) {
          if (result)
            return _callback(null, result);
          if (sym.exportName == symbol) {
            if (sym.type == "exportDeclaration")
              return _callback(null, {
                path: path,
                loc: sym.location
              });
            if (sym.moduleRequest) {
              return findInModule(sym.localName, path, sym.moduleRequest, _callback);
            } else {
              for (var $__7 = scope.definedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
                  $__8; !($__8 = $__7.next()).done; ) {
                var def = $__8.value;
                {
                  if (def.localName == sym.localName)
                    return _callback(null, {
                      path: path,
                      loc: def.location
                    });
                }
              }
              console.warn("Exported undefined symbol: " + symbol + " in module " + path);
              return _callback(null, null);
            }
          }
          return _callback(null, null);
        }));
      }));
    }
  }));
  callback(null, null);
}
function findInModule(symbol, basePath, moduleRequest, callback) {
  findSymbolDefinition(symbol, moduleRequest, null, false, null, callback);
}
