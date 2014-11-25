(function() {
  module.exports = {
    findSymbolDefinition: function(symbol, path, params) {
      var buffer, def, error, fs, isRoot, parsedScope, parser, result, scope, sym, util, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
      parser = require('./definition-parser');
      util = require('./util');
      fs = require('fs');
      isRoot = params.isRoot == null ? true : params.isRoot;
      if (params.scope != null) {
        scope = params.scope;
      } else {
        try {
          buffer = fs.readFileSync(path);
          scope = util.getGlobalScope(buffer);
        } catch (_error) {
          error = _error;
          console.log("Error parsing module " + path + " : " + error);
          throw error;
        }
      }
      try {
        parsedScope = parser.parseSymbolsFromScope(scope);
      } catch (_error) {
        error = _error;
        throw error;
      }
      if (isRoot) {
        if (params.namespace == null) {
          _ref = parsedScope.definedSymbols;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            sym = _ref[_i];
            if (sym.localName === symbol) {
              return {
                path: path,
                loc: sym.location
              };
            }
          }
        }
        _ref1 = parsedScope.importedSymbols;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          sym = _ref1[_j];
          if (params.namespace != null) {
            if (sym.localName === params.namespace) {
              return this.findSymbolDefinitionInModule(symbol, path, sym.moduleRequest);
            }
          } else {
            if (sym.localName === symbol) {
              return this.findSymbolDefinitionInModule(sym.importName, path, sym.moduleRequest);
            }
          }
        }
      } else {
        _ref2 = parsedScope.exportedSymbols;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          sym = _ref2[_k];
          if (sym.importName === "*") {
            result = this.findSymbolDefinitionInModule(symbol, path, sym.moduleRequest);
            if (result.error == null) {
              return result;
            }
          }
          if (sym.exportName === symbol) {
            if (sym.type === "exportDeclaration") {
              return {
                path: path,
                loc: sym.location
              };
            }
            if (sym.moduleRequest != null) {
              return this.findSymbolDefinitionInModule(symbol, path, sym.moduleRequest);
            } else {
              _ref3 = parsedScope.definedSymbols;
              for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
                def = _ref3[_l];
                if (def.localName === symbol) {
                  return {
                    path: path,
                    loc: def.location
                  };
                }
              }
              return {
                error: "Exported undefined symbol: " + symbol + " in " + path
              };
            }
          }
        }
      }
      return {
        error: "Unable to resolve " + symbol + " in " + path + "."
      };
    },
    findSymbolDefinitionInModule: function(symbol, basePath, moduleString) {
      var error, modulePath;
      modulePath = this.resolveModulePath(basePath, moduleString);
      if (modulePath != null) {
        try {
          return this.findSymbolDefinition(symbol, modulePath, {
            isRoot: false
          });
        } catch (_error) {
          error = _error;
          throw error;
        }
      } else {
        return {
          error: "Couldn't resolve module: " + moduleString + " in " + basePath
        };
      }
    },
    resolveModulePath: function(basePath, moduleString) {
      var basedir, error, path, resolve;
      resolve = require('resolve');
      path = require('path');
      basedir = path.dirname(basePath);
      try {
        return resolve.sync(moduleString, {
          basedir: basedir,
          extensions: ['.js', '.es6']
        });
      } catch (_error) {
        error = _error;
        throw error;
      }
    }
  };

}).call(this);
