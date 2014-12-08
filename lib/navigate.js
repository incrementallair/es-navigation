import {positionIsInsideLocation, compareIdentifierLocations} from "./util";
import {findSymbolDefinition} from './search';
import tools from 'es-parse-tools';

//find definition of the symbol at position in the given buffer
//returns the import statement of the symbol, and the actual
// definition location.
export function getDefinitionAtPosition(path, position, callback) {
  var result = {
    import: null,
    definition: null,
    relativePosition: null,
    globalScope: null
  };

  //var {id, scope, globalScope, imports, relativePosition} =
  getReferencesAtPosition(path, position, {
      includeImports: true,
      relativePosition: true
    }, (error, refs) => {
      if (error) return callback(error);

      let {id, scope, globalScope, imports, relativePosition} = refs;
      result.globalScope = globalScope;
      if (id && scope) {
        result.relativePosition = relativePosition;

        //get the import statement if it exists
        for (let symbol of imports) {
          if (symbol.localName == id.name)
            result.import = symbol;
        }

        //THe bug is here
        //are we looking at a namespace object, or normal definition?
        if (id.property && id.object) {
          findSymbolDefinition(id.property, path, id.object, true, scope, (err, res) => {
            if (!res) return checkGlobalScope();
            result.definition = res;
            return callback(null, result);
          });
        } else {
          findSymbolDefinition(id.name, path, null, true, scope, (err, res) => {
            if (!res) return checkGlobalScope();
            result.definition = res;
            return callback(null, result);
          });
        }
      } else checkGlobalScope();

      function checkGlobalScope() {
        if (globalScope) {
          //Check if we are on a re-export. If so, search the re-export.
          for (let symbol of globalScope.exportedSymbols) {
            if (symbol.importLocation && positionIsInsideLocation(position, symbol.importLocation)) {
              if (symbol.moduleRequest)
                return findSymbolDefinition(symbol.importName, symbol.moduleRequest, null, false, scope, (err, res) => {
                  result.definition = res;
                  return callback(null, result);
                });
            }
          }

          return callback(null, result);
        }
      }
  });
}

//get references at position in the given buffer
export function getReferencesAtPosition(path, position, params, callback) {
  tools.parseURI(path, (error, scopes) => {
    if (error) {
      console.warn("Error in getReferencesAtPosition while parsing URI: " + error);
      return callback(error);
    }

    for (let scope of scopes) {
      let references = getReferencesAtPositionInScope(scope, position, params);

      if (references) {
        references.scope = scope;
        references.globalScope = scopes[0];
        return callback(null, references);
      }
    }

    var globalScope = scopes ? scopes[0] : null;
    return callback(null, {
      id: null,
      references: null,
      scope: null,
      relativePosition: null,
      imports: null,
      globalScope: globalScope
    });
  });
}

//gets the position of the identifier at the given position
// in the given scope, along with all its references
//param values:
//  relativePosition: whether to include relative position in results
//  includeImports: whether to include imported refs of symbol
//  includeDefinitions: whether to include defined refs of symbol
function getReferencesAtPositionInScope(scope, position, params = {}) {
  var results = {
    id: null,
    references: null,
    imports: null,
    definitions: null,
    relativePosition: null,
  };

  var identifiers = scope.referencedSymbols;
  var imports = scope.importedSymbols;
  var defines = scope.definedSymbols;

  var id = identifiers.filter((node) => {
    return positionIsInsideLocation(position, node.loc);
  })[0];

  //found an identifier at the cursor
  if (id) {
    results.id = id;
    let isIdName = (node) => node.name == id.name;
    let isIdLocalName = (node) => node.localName == id.name;

    results.references = identifiers.filter(isIdName).sort(compareIdentifierLocations);
    if (params.includeImports)
      results.imports = imports.filter(isIdLocalName);

    if (params.includeDefinitions)
      results.definitions = defines.filter(isIdLocalName);

    if (params.relativePosition)
      results.relativePosition = position.column - id.loc.start.column;

    return results;
  }

  return null;
}

//gets the next reference of a given identifier in a list of references.
//returns null if identifier is not found in the references.
export function getNextReference(id, references, skip=1) {
  var index = references.indexOf(id);

  if (index >= 0)
    return references[(index + references.length + skip) % references.length];
  return null;
}
