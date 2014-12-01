//Given a buffer, parses out the following information:
//Abstract Syntax Tree - via Esprima
//List of Scopes - via Escope
//For each scope, we decorate with further information:
// list of referenced, defined, imported, and exported symbols in this scope
//  to really make this work well, we need to include definitions such as
//  those within class, object, etc bodies.
//For each import/export, we attempt to resolve module string.
//For each identifier, we inject information:
// if the identifier is a member of an object, we inject the object identifier
//   this allows for quick lookup and searching of members
//Errors are propagated.
import esprima from 'esprima-fb';
import escope from 'escope';
import estraverse from 'estraverse';
import {getMemberExpressionString} from './util';

var resolverPath = atom.config.get("moduleResolver");
var resolver = require(resolverPath ? resolverPath : './resolve');

function doParse(buffer, path) {
  try {
    var syntaxTree = esprima.parse(buffer, {loc: true, tolerant: true});
    var scopes = escope.analyze(syntaxTree, {ecmaVersion: 6}).scopes;
  } catch(error) {
    console.warn("Error parsing AST/scopes: " + error + " in " + path +
    "\nPossibly not an ES6 module.");
    return null;
  }
  return { scopes, syntaxTree };
}

export function parseBuffer(buffer, path) {
  var  parsedBuffer = doParse(buffer, path);
  if (!parsedBuffer) return null;
  var { scopes, syntaxTree } = parsedBuffer;

  scopes.map((scope) => {
    scope.path = path;
    scope.referencedSymbols = [];
    scope.importedSymbols = [];
    scope.exportedSymbols = [];
    scope.definedSymbols = [];
  });

  scopes.map(decorateReferencedSymbols);
  scopes.map(decorateDefinedSymbols);
  decorateImportedSymbols(scopes[0]);
  decorateExportedSymbols(scopes[0]);

  scopes.map((scope) => {
    scope.referencedSymbols = removeDuplicates(scope.referencedSymbols);
    scope.definedSymbols = removeDuplicates(scope.definedSymbols);
    scope.importedSymbols = removeDuplicates(scope.importedSymbols);
    scope.exportedSymbols = removeDuplicates(scope.exportedSymbols);
  });

  return scopes;

  //parseBuffer INTERNAL
  function removeDuplicates(array) {
    return array.filter((value, ind) => array.indexOf(value) == ind);
  }
}

function decorateExportedSymbols(scope) {
  estraverse.traverse(scope.block, {
    enter: (node, parent) => {
      if (node.type == "ExportDeclaration") {
        //handle declaration export:
        //export function() {...} etc
        if (node.declaration) {
          let parsedDecl = parseExportDeclaration(node, scope);

          if (parsedDecl)
            scope.exportedSymbols.push(parsedDecl);
        } else {
          for (let specifier of node.specifiers) {
            let parsedSpec = parseExportSpecifier(specifier, node, scope);

            if (parsedSpec)
              scope.exportedSymbols.push(parsedSpec);
          }
        }
      }
    }
  });

  //decorateExportedSymbols INTERNAL
  //assumes we are given a declaration as input
  //TODO: pass declaration.declaration as input?
  function parseExportDeclaration(decl, scope) {
    let result = {
      localName: null,
      exportName: null,
      importName: null,
      moduleRequest: null,
      location: null, //esprima location
      type: null
    };

    if (decl.declaration.type == "VariableDeclaration") {
      result.exportName = decl.declaration.declarations[0].id.name;
      result.location = decl.declaration.declarations[0].id.loc;
      result.localName = result.exportName;

      scope.referencedSymbols.push(decl.declaration.declarations[0].id);
    } else {
      if (decl.declaration.id) {
        result.exportName = decl.declaration.id.name;
        result.location = decl.declaration.id.loc;
        result.localName = result.exportName;

        scope.referencedSymbols.push(decl.declaration.id);
      } else {
        result.localName = "*default*";
        result.location = decl.declaration.loc;
      }
    }

    result.type = "exportDeclaration";

    //if declaration is default, set exportName appropriately
    if (decl.default)
      result.exportName = "default";

    return result;
  }

  //decorateExportedSymbols INTERNAL
  //assumes we are given an export specifier as input
  function parseExportSpecifier(spec, node, scope) {
    let result = {
      importName: null,
      exportName: null,
      localName: null,
      importLocation: null,
      moduleRequest: null,
      moduleRequestCallback: null,
      moduleLocation: null,
      type: "export"
    };

    switch(spec.type) {
      case "ExportSpecifier":
        if (node.source) {
          result.importName = spec.id.name;
          result.moduleRequest = "unresolved";
          result.moduleRequestCallback = attemptModuleResolution(scope.path, node.source.value, result);
          result.moduleLocation = node.source.loc;
        } else {
          result.localName = spec.id.name;
          scope.referencedSymbols.push(spec.id);
        }

        result.importLocation = spec.id.loc;
        result.exportName = spec.name ? spec.name.name : spec.id.name;

        //if we are re-exporting from another file, don't treat this as a referencable symbol
        if (!result.moduleRequest)
          scope.referencedSymbols.push(spec.id);

        break;

      case "ExportBatchSpecifier":
        if (!node.source) {
          console.warn("Error: parsing export batch specifier without module source");
          return null;
        }

        result.importName = "*";
        result.moduleRequest = "unresolved";
        result.moduleRequestCallback = attemptModuleResolution(scope.path, node.source.value, result);
        result.moduleLocation = node.source.loc;
        break;

      default:
       console.warn("Unknown export specifier type: " + spec.type);
    }

    return result;
  }
}

function decorateDefinedSymbols(scope) {
  for (let variable of scope.variables) {
    for (let definition of variable.defs) {
      if (!definition.name) continue;

      scope.definedSymbols.push({
        localName: definition.name.name,
        location: definition.name.loc, //esprima location
        type: "defined"
      });
    }
  }
}

function decorateImportedSymbols(scope) {
  //Parse ES6 import statements. As per spec, returns:
  // importName, localName, moduleRequest
  estraverse.traverse(scope.block, {
    enter: (node, parent) => {
      if (node.type == "ImportDeclaration") {
        //No bindings imported handle, separately
        if (node.specifiers.length === 0) {
          let parsedSpec = {
            importName: "*emptyImport*",
            localName: "*emptyImport*",
            location: null,
            moduleLocation: null,
            moduleRequest: null,
            moduleRequestCallback: null,
            importLocation: node.loc,
            type: "import"
          };

          if (node.source) {
            parsedSpec.moduleLocation = node.source.loc;
            parsedSpec.moduleRequestCallback = attemptModuleResolution(scope.path, node.source.value, parsedSpec);
            parsedSpec.moduleRequest =  "unresolved";
          }

          scope.importedSymbols.push(parsedSpec);
        }

        //Otherwise add symbols for each binding
        for (let specifier of node.specifiers) {
          //parse name from import specification
          let parsedSpec = parseImportSpecifier(specifier, scope);

          if (parsedSpec) {
            parsedSpec.importLocation = node.loc;
            parsedSpec.moduleLocation = node.source.loc;

            //Asynchronously update resolved module path
            parsedSpec.moduleRequestCallback = attemptModuleResolution(scope.path, node.source.value, parsedSpec);

            scope.importedSymbols.push(parsedSpec);
          }
        }
      }
    }
  });

  //decorateImportedSymbols INTERNAL
  function parseImportSpecifier(spec, scope) {
    let parsedSpec = {
      importName: null,
      localName: null,
      location: null, //esprima location
      moduleRequest: "unresolved",
      moduleRequestCallback: null,
      type: "import"
    };

    switch(spec.type) {
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
        console.warn("Unknown import specifier type: "+ spec.type);
    }

    if (parsedSpec.importName &&  parsedSpec.localName) {
      parsedSpec.location = spec.name ? spec.name.loc : spec.id.loc;
      return parsedSpec;
    } else
      return null;
  }
}

function decorateReferencedSymbols(scope) {
  //add unresolved references
  for (let reference of scope.through)
    scope.referencedSymbols.push(reference.identifier);

  //add resolved references
  for (let variable of scope.variables) {
    for (let reference of variable.references)
      scope.referencedSymbols.push(reference.identifier);
    for (let identifier of variable.identifiers)
      scope.referencedSymbols.push(identifier);
  }

  //TODO: restrict symbols to inner scope and children
  //filling an escope hole : membership expressions are not recognised
  // as symbols in escope as scope is only dependant on base object
  //add references to membership expressions
  estraverse.traverse(scope.block, {
    enter: (node, parent) => {
      if (node.type == 'MemberExpression') {
        //create new identifier with prototype inheritance
        let identifier = Object.create(node.property);

        //attach additional member information as instance vars
        identifier.property = getMemberExpressionString(node.property);
        identifier.object = getMemberExpressionString(node.object);
        identifier.name = identifier.object + "." + identifier.property;

        scope.referencedSymbols.push(identifier);
      }
    }
  });
}

//Attempt to resolve a module name. If success, return path.
//Else, return "parseError" or "notFound".
function attemptModuleResolution(basePath, moduleString, spec) {
  return new Promise((resolve, reject) => {
    resolver.resolveModulePath(basePath, moduleString).then((resolved) => {
      spec.moduleRequest = resolved;

      resolve(resolved);
    }, (rejected) => {
      resolve("notFound");
    });
  });
}
