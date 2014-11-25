(function() {
  module.exports = {
    util: require('./util'),
    parseSymbolsFromScope: function(scope) {
      return {
        scope: scope,
        definedSymbols: this.parseDefinedSymbols(scope),
        importedSymbols: this.parseImportedSymbols(scope),
        exportedSymbols: this.parseExportedSymbols(scope)
      };
    },
    parseImportedSymbols: function(scope) {
      var estraverse, importedSymbols;
      estraverse = require('estraverse');
      importedSymbols = [];
      estraverse.traverse(scope.block, {
        enter: (function(_this) {
          return function(node, parent) {
            var parsedSpec, specifier, _i, _len, _ref, _results;
            if (node.type === "ImportDeclaration") {
              _ref = node.specifiers;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                specifier = _ref[_i];
                parsedSpec = _this.parseImportSpecifier(specifier);
                if (parsedSpec != null) {
                  parsedSpec.moduleRequest = node.source.value;
                  _results.push(importedSymbols.push(parsedSpec));
                } else {
                  _results.push(void 0);
                }
              }
              return _results;
            }
          };
        })(this)
      });
      return importedSymbols;
    },
    parseDefinedSymbols: function(scope) {
      var def, definedSymbols, variable, _i, _j, _len, _len1, _ref, _ref1;
      definedSymbols = [];
      _ref = scope.variables;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        variable = _ref[_i];
        _ref1 = variable.defs;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          def = _ref1[_j];
          definedSymbols.push({
            localName: def.name.name,
            location: def.name.loc,
            type: "defined"
          });
        }
      }
      return definedSymbols;
    },
    parseExportedSymbols: function(scope) {
      var estraverse, exportedSymbols;
      estraverse = require('estraverse');
      exportedSymbols = [];
      estraverse.traverse(scope.block, {
        enter: (function(_this) {
          return function(node, parent) {
            var parsedDecl, parsedSpec, specifier, _i, _len, _ref, _results;
            if (node.type === "ExportDeclaration") {
              if (node.declaration) {
                parsedDecl = _this.parseExportDeclaration(node);
                if (parsedDecl) {
                  return exportedSymbols.push(parsedDecl);
                }
              } else {
                _ref = node.specifiers;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  specifier = _ref[_i];
                  parsedSpec = _this.parseExportSpecifier(specifier, node);
                  if (parsedSpec) {
                    _results.push(exportedSymbols.push(parsedSpec));
                  } else {
                    _results.push(void 0);
                  }
                }
                return _results;
              }
            }
          };
        })(this)
      });
      return exportedSymbols;
    },
    parseExportDeclaration: function(decl) {
      var ret;
      ret = {
        exportName: null,
        importName: null,
        moduleRequest: null,
        location: null,
        localName: null,
        type: null
      };
      if (decl.declaration != null) {
        if (decl.declaration.type === "VariableDeclaration") {
          ret.exportName = decl.declaration.declarations[0].id.name;
          ret.localName = ret.exportName;
        } else {
          if (decl.declaration.id != null) {
            ret.exportName = decl.declaration.id.name;
            ret.localName = ret.exportName;
          } else {
            ret.localName = "*default*";
          }
        }
        ret.type = "exportDeclaration";
        ret.location = decl.declaration.loc;
      } else {
        console.log("Error: parseExportDeclaration called on non-declaration");
        return null;
      }
      if (decl["default"]) {
        ret.exportName = "default";
      }
      return ret;
    },
    parseExportSpecifier: function(spec, node) {
      var ret;
      ret = {
        importName: null,
        exportName: null,
        localName: null,
        moduleRequest: null,
        type: "export"
      };
      switch (spec.type) {
        case "ExportSpecifier":
          if (node.source != null) {
            ret.importName = spec.id.name;
            ret.moduleRequest = node.source.value;
          } else {
            ret.localName = spec.id.name;
          }
          ret.exportName = spec.name != null ? spec.name.name : spec.id.name;
          break;
        case "ExportBatchSpecifier":
          if (node.source == null) {
            console.log("Error: parsing export batch specifier without module source");
            return null;
          }
          ret.importName = "*";
          ret.moduleRequest = node.source.value;
          break;
        default:
          console.log("Unknown export specifier type: " + spec.type);
      }
      return ret;
    },
    parseImportSpecifier: function(spec) {
      var ret;
      ret = {
        importName: null,
        localName: null,
        location: null,
        type: "import"
      };
      switch (spec.type) {
        case "ImportDefaultSpecifier":
          ret.importName = "default";
          ret.localName = spec.id.name;
          break;
        case "ImportSpecifier":
          ret.localName = spec.name != null ? spec.name.name : spec.id.name;
          ret.importName = spec.id.name;
          break;
        case "ImportNamespaceSpecifier":
          ret.importName = "*";
          ret.localName = spec.id.name;
          break;
        default:
          console.log("Unknown specifier type: " + spec.type);
      }
      ret.location = spec.id.loc;
      if ((ret.importName != null) && (ret.localName != null)) {
        return ret;
      }
      return null;
    }
  };

}).call(this);
