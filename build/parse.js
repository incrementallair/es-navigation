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
    $__resolve__,
    $__util__;
'use strict';
var esprima = ($__esprima_45_fb__ = require("esprima-fb"), $__esprima_45_fb__ && $__esprima_45_fb__.__esModule && $__esprima_45_fb__ || {default: $__esprima_45_fb__}).default;
var escope = ($__escope__ = require("escope"), $__escope__ && $__escope__.__esModule && $__escope__ || {default: $__escope__}).default;
var estraverse = ($__estraverse__ = require("estraverse"), $__estraverse__ && $__estraverse__.__esModule && $__estraverse__ || {default: $__estraverse__}).default;
var resolveModulePath = ($__resolve__ = require("./resolve"), $__resolve__ && $__resolve__.__esModule && $__resolve__ || {default: $__resolve__}).resolveModulePath;
var getMemberExpressionString = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}).getMemberExpressionString;
;
function parseBuffer(buffer, path) {
  var scopes;
  try {
    var syntaxTree = esprima.parse(buffer, {loc: true});
    if (atom.config.get("atom-symbol-navigation.es6Support"))
      scopes = escope.analyze(syntaxTree, {ecmaVersion: 6}).scopes;
    else
      scopes = escope.analyze(syntaxTree, {ecmaVersion: 5}).scopes;
  } catch (error) {
    console.error("Error parsing AST/scopes: " + error);
    return null;
  }
  scopes.map((function(scope) {
    scope.path = path;
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
          var parsedDecl = parseExportDeclaration(node, scope);
          if (parsedDecl)
            scope.exportedSymbols.push(parsedDecl);
        } else {
          for (var $__5 = node.specifiers[$traceurRuntime.toProperty(Symbol.iterator)](),
              $__6; !($__6 = $__5.next()).done; ) {
            var specifier = $__6.value;
            {
              var parsedSpec = parseExportSpecifier(specifier, node, scope);
              if (parsedSpec)
                scope.exportedSymbols.push(parsedSpec);
            }
          }
        }
      }
    })});
  function parseExportDeclaration(decl, scope) {
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
      scope.referencedSymbols.push(decl.declaration.declarations[0].id);
    } else {
      if (decl.declaration.id) {
        result.exportName = decl.declaration.id.name;
        result.localName = result.exportName;
        scope.referencedSymbols.push(decl.declaration.id);
      } else
        result.localName = "*default*";
    }
    result.type = "exportDeclaration";
    result.location = decl.declaration.loc;
    if (decl.default)
      result.exportName = "default";
    return result;
  }
  function parseExportSpecifier(spec, node, scope) {
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
        scope.referencedSymbols.push(spec.id);
        break;
      case "ExportBatchSpecifier":
        if (!node.source) {
          console.error("Error: parsing export batch specifier without module source");
          return null;
        }
        result.importName = "*";
        result.moduleRequest = attemptModuleResolution(scope.path, node.source.value);
        break;
      default:
        console.error("Unknown export specifier type: " + spec.type);
    }
    return result;
  }
}
function decorateDefinedSymbols(scope) {
  for (var $__7 = scope.variables[$traceurRuntime.toProperty(Symbol.iterator)](),
      $__8; !($__8 = $__7.next()).done; ) {
    var variable = $__8.value;
    {
      for (var $__5 = variable.defs[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__6; !($__6 = $__5.next()).done; ) {
        var definition = $__6.value;
        {
          if (!definition.name)
            continue;
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
        for (var $__5 = node.specifiers[$traceurRuntime.toProperty(Symbol.iterator)](),
            $__6; !($__6 = $__5.next()).done; ) {
          var specifier = $__6.value;
          {
            var parsedSpec = parseImportSpecifier(specifier, scope);
            if (parsedSpec) {
              parsedSpec.moduleRequest = attemptModuleResolution(scope.path, node.source.value);
              scope.importedSymbols.push(parsedSpec);
            }
          }
        }
      }
    })});
  function parseImportSpecifier(spec, scope) {
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
        scope.referencedSymbols.push(spec.id);
        break;
      case "ImportSpecifier":
        parsedSpec.importName = spec.id.name;
        parsedSpec.localName = spec.name ? spec.name.name : spec.id.name;
        scope.referencedSymbols.push(spec.name ? spec.name : spec.id);
        break;
      case "ImportNamespaceSpecifier":
        parsedSpec.importName = "*";
        parsedSpec.localName = spec.id.name;
        scope.referencedSymbols.push(spec.id);
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
  for (var $__5 = scope.through[$traceurRuntime.toProperty(Symbol.iterator)](),
      $__6; !($__6 = $__5.next()).done; ) {
    var reference = $__6.value;
    scope.referencedSymbols.push(reference.identifier);
  }
  for (var $__11 = scope.variables[$traceurRuntime.toProperty(Symbol.iterator)](),
      $__12; !($__12 = $__11.next()).done; ) {
    var variable = $__12.value;
    {
      for (var $__7 = variable.references[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__8; !($__8 = $__7.next()).done; ) {
        var reference$__13 = $__8.value;
        scope.referencedSymbols.push(reference$__13.identifier);
      }
      for (var $__9 = variable.identifiers[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__10; !($__10 = $__9.next()).done; ) {
        var identifier = $__10.value;
        scope.referencedSymbols.push(identifier);
      }
    }
  }
  estraverse.traverse(scope.block, {enter: (function(node, parent) {
      if (node.type == 'MemberExpression') {
        var identifier = Object.create(node.property);
        identifier.property = getMemberExpressionString(node.property);
        identifier.object = getMemberExpressionString(node.object);
        identifier.name = identifier.object + "." + identifier.property;
        scope.referencedSymbols.push(identifier);
      }
    })});
}
function attemptModuleResolution(basePath, moduleString) {
  try {
    return resolveModulePath(basePath, moduleString);
  } catch (error) {
    return "notFound";
  }
}
