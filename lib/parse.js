//Given a buffer, parses out the following information:
//Abstract Syntax Tree - via Esprima
//List of Scopes - via Escope
//For each scope, we decorate with further information:
// list of referenced, defined, imported, and exported symbols in this scope
//  to really make this work well, we need to include definitions such as
//  those within class, object, etc bodies.
//For each import, we attempt to resolve module string.
//For each identifier, we inject information:
// if the identifier is a member of an object, we inject the object identifier
//   this allows for quick lookup and searching of members
//Errors are propagated.
//TODO: perhaps add params to specify which parts you want
//TODO: perhaps we should introduce a "symbol" class: name and loc
//TODO: can also probably throw out the AST/escope stuff when we're done
import esprima from 'esprima-fb';
import escope from 'escope';
import estraverse from 'estraverse';
import util from './util';

export {parseBuffer};

function parseBuffer(buffer) {
  try {
    var syntaxTree = esprima.parse(buffer, {loc: true});

    //TODO check config for es6/es5 support
    var scopes = escope.analyze(syntaxTree).scopes;
  } catch(error) {
    console.error("Error parsing AST/scopes: #{error}");
    throw error;
  }

  scopes.map(decorateReferencedSymbols);
  scopes.map(decorateImportedSymbols);
  scopes.map(decorateExportedSymbols);
  scopes.map(decorateDefinedSymbols);

  return scopes;
}

function decorateExportedSymbols(scope) {
  scope.exportedSymbols = [];

  estraverse.traverse(scope.block, {
    enter: (node, parent) => {
      if (node.type == "ExportDeclaration") {
        //handle declaration export:
        //export function() {...} etc
        if (node.declaration) {
          let parsedDecl = parseExportDeclaration(node);

          if (parsedDecl)
            scope.exportedSymbols.push(parsedDecl);
        } else {
          for (let specifier of node.specifiers) {
            let parsedSpec = parseExportSpecifier(specifier, node);

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
  function parseExportDeclaration(decl) {
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

    //if declaration is default, set exportName appropriately
    if (decl.default)
      result.exportName = "default";

    return result;
  }

  //decorateExportedSymbols INTERNAL
  //assumes we are given an export specifier as input
  function parseExportSpecifier(spec, node) {
    let result = {
      importName: null,
      exportName: null,
      localName: null,
      moduleRequest: null,
      type: "export"
    };

    switch(spec.type) {
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
          console.log("Error: parsing export batch specifier without module source");
          return null;
        }

        result.importName = "*";
        result.moduleRequest = node.source.value;
        break;
      default:
       console.log("Unknown export specifier type: #{spec.type}");
    }

    return result
  }
}

function decorateDefinedSymbols(scope) {
  scope.definedSymbols = [];

  for (let variable of scope.variables) {
    for (let definition of variable.defs) {
      scope.definedSymbols.push({
        localName: definition.name.name,
        location: definition.name.loc, //esprima location
        type: "defined"
      });
    }
  }
}

function decorateImportedSymbols(scope) {
  scope.importedSymbols = [];

  //Parse ES6 import statements. As per spec, returns:
  // importName, localName, moduleRequest
  estraverse.traverse(scope.block, {
    enter: (node, parent) => {
      if (node.type == "ImportDeclaration") {
        for (let specifier of node.specifiers) {
          //parse name from import specification
          let parsedSpec = parseImportSpecifier(specifier);

          if (parsedSpec) {
            parsedSpec.moduleRequest = node.source.value;
            scope.importedSymbols.push(parsedSpec);
          }
        }
      }
    }
  });

  //decorateImportedSymbols INTERNAL
  function parseImportSpecifier(spec) {
    let parsedSpec = {
      importName: null,
      localName: null,
      location: null, //esprima location
      type: "import"
    };

    switch(spec.type) {
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
        console.error("Unknown import specifier type: #{spec.type}");
    }

    if (parsedSpec.importName &&  parsedSpec.localName) {
      parsedSpec.location = spec.id.loc;
      return parsedSpec;
    } else
      return null;
  }
}

function decorateReferencedSymbols(scope) {
  scope.referencedSymbols = [];

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
        identifier.property = util.getMemberExpressionString(node.property);
        identifier.object = util.getMemberExpressionString(node.object);
        identifier.name = identifier.object + "." + identifier.property;

        scope.referencedSymbols.push(identifier);
      }
    }
  });
}
