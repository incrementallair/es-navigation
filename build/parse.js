"use strict";
Object.defineProperties(exports, {
  parseBuffer: {get: function() {
      return parseBuffer;
    }},
  __esModule: {value: true}
});
var $__esprima_45_fb__,
    $__escope__,
    $__estraverse__,
    $__util__;
'use strict';
var esprima = ($__esprima_45_fb__ = require("esprima-fb"), $__esprima_45_fb__ && $__esprima_45_fb__.__esModule && $__esprima_45_fb__ || {default: $__esprima_45_fb__}).default;
var escope = ($__escope__ = require("escope"), $__escope__ && $__escope__.__esModule && $__escope__ || {default: $__escope__}).default;
var estraverse = ($__estraverse__ = require("estraverse"), $__estraverse__ && $__estraverse__.__esModule && $__estraverse__ || {default: $__estraverse__}).default;
var util = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}).default;
;
function parseBuffer(buffer) {
  var scopes;
  try {
    var syntaxTree = esprima.parse(buffer, {loc: true});
    var es6Support = atom.config.get("atom-symbol-navigation.es6Support");
    if (es6Support)
      scopes = escope.analyze(syntaxTree, {ecmaVersion: 6}).scopes;
    else
      scopes = escope.analyze(syntaxTree, {ecmaVersion: 5}).scopes;
  } catch (error) {
    console.error("Error parsing AST/scopes: " + error);
    return null;
  }
  scopes.map((function(scope) {
    scope.referencedSymbols = [];
    scope.importedSymbols = [];
    scope.exportedSymbols = [];
    scope.definedSymbols = [];
  }));
  scopes.map(decorateReferencedSymbols);
  scopes.map(decorateImportedSymbols);
  scopes.map(decorateExportedSymbols);
  scopes.map(decorateDefinedSymbols);
  return scopes;
}
function decorateExportedSymbols(scope) {
  estraverse.traverse(scope.block, {enter: (function(node, parent) {
      if (node.type == "ExportDeclaration") {
        if (node.declaration) {
          var parsedDecl = parseExportDeclaration(node);
          if (parsedDecl)
            scope.exportedSymbols.push(parsedDecl);
        } else {
          for (var $__4 = node.specifiers[$traceurRuntime.toProperty(Symbol.iterator)](),
              $__5; !($__5 = $__4.next()).done; ) {
            var specifier = $__5.value;
            {
              var parsedSpec = parseExportSpecifier(specifier, node);
              if (parsedSpec)
                scope.exportedSymbols.push(parsedSpec);
            }
          }
        }
      }
    })});
  function parseExportDeclaration(decl) {
    var result = {
      localName: null,
      exportName: null,
      importName: null,
      moduleRequest: null,
      location: null,
      type: null
    };
    if (decl.declaration.type == "VariableDeclaration") {
      result.exportName = decl.declaration.declarations[0].id.name;
      result.localName = result.exportName;
    } else {
      if (decl.declaration.id) {
        result.exportName = decl.declaration.id.name;
        result.localName = result.exportName;
      } else
        result.localName = "*default*";
    }
    result.type = "exportDeclaration";
    result.location = decl.declaration.loc;
    if (decl.default)
      result.exportName = "default";
    return result;
  }
  function parseExportSpecifier(spec, node) {
    var result = {
      importName: null,
      exportName: null,
      localName: null,
      moduleRequest: null,
      type: "export"
    };
    switch (spec.type) {
      case "ExportSpecifier":
        if (node.source) {
          result.importName = spec.id.name;
          result.moduleRequest = node.source.value;
        } else
          result.localName = spec.id.name;
        result.exportName = spec.name ? spec.name.name : spec.id.name;
        break;
      case "ExportBatchSpecifier":
        if (!node.source) {
          console.error("Error: parsing export batch specifier without module source");
          return null;
        }
        result.importName = "*";
        result.moduleRequest = node.source.value;
        break;
      default:
        console.error("Unknown export specifier type: " + spec.type);
    }
    return result;
  }
}
function decorateDefinedSymbols(scope) {
  for (var $__6 = scope.variables[$traceurRuntime.toProperty(Symbol.iterator)](),
      $__7; !($__7 = $__6.next()).done; ) {
    var variable = $__7.value;
    {
      for (var $__4 = variable.defs[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__5; !($__5 = $__4.next()).done; ) {
        var definition = $__5.value;
        {
          scope.definedSymbols.push({
            localName: definition.name.name,
            location: definition.name.loc,
            type: "defined"
          });
        }
      }
    }
  }
}
function decorateImportedSymbols(scope) {
  estraverse.traverse(scope.block, {enter: (function(node, parent) {
      if (node.type == "ImportDeclaration") {
        for (var $__4 = node.specifiers[$traceurRuntime.toProperty(Symbol.iterator)](),
            $__5; !($__5 = $__4.next()).done; ) {
          var specifier = $__5.value;
          {
            var parsedSpec = parseImportSpecifier(specifier);
            if (parsedSpec) {
              parsedSpec.moduleRequest = node.source.value;
              scope.importedSymbols.push(parsedSpec);
            }
          }
        }
      }
    })});
  function parseImportSpecifier(spec) {
    var parsedSpec = {
      importName: null,
      localName: null,
      location: null,
      type: "import"
    };
    switch (spec.type) {
      case "ImportDefaultSpecifier":
        parsedSpec.importName = "default";
        parsedSpec.localName = spec.id.name;
        break;
      case "ImportSpecifier":
        parsedSpec.localName = spec.name ? spec.name.name : spec.id.name;
        parsedSpec.importName = spec.id.name;
        break;
      case "ImportNamespaceSpecifier":
        parsedSpec.importName = "*";
        parsedSpec.localName = spec.id.name;
        break;
      default:
        console.error("Unknown import specifier type: " + spec.type);
    }
    if (parsedSpec.importName && parsedSpec.localName) {
      parsedSpec.location = spec.id.loc;
      return parsedSpec;
    } else
      return null;
  }
}
function decorateReferencedSymbols(scope) {
  for (var $__4 = scope.through[$traceurRuntime.toProperty(Symbol.iterator)](),
      $__5; !($__5 = $__4.next()).done; ) {
    var reference = $__5.value;
    scope.referencedSymbols.push(reference.identifier);
  }
  for (var $__10 = scope.variables[$traceurRuntime.toProperty(Symbol.iterator)](),
      $__11; !($__11 = $__10.next()).done; ) {
    var variable = $__11.value;
    {
      for (var $__6 = variable.references[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__7; !($__7 = $__6.next()).done; ) {
        var reference$__12 = $__7.value;
        scope.referencedSymbols.push(reference$__12.identifier);
      }
      for (var $__8 = variable.identifiers[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__9; !($__9 = $__8.next()).done; ) {
        var identifier = $__9.value;
        scope.referencedSymbols.push(identifier);
      }
    }
  }
  estraverse.traverse(scope.block, {enter: (function(node, parent) {
      if (node.type == 'MemberExpression') {
        var identifier = Object.create(node.property);
        identifier.property = util.getMemberExpressionString(node.property);
        identifier.object = util.getMemberExpressionString(node.object);
        identifier.name = identifier.object + "." + identifier.property;
        scope.referencedSymbols.push(identifier);
      }
    })});
}
