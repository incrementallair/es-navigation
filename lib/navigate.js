'use strict';

import {positionIsInsideLocation, compareIdentifierLocations} from "./util";
import {parseBuffer} from './cache';
import {findSymbolDefinition} from './search';

export {getReferencesAtPosition};
export {getNextReference};
export {getDefinitionAtPosition};

//find definition of the symbol at position in the given buffer
//returns the import statement of the symbol, and the actual
// definition location.
function getDefinitionAtPosition(buffer, path, position) {
  var result = {
    import: null,
    definition: null,
    relativePosition: null,
    globalScope: null
  };

  var {id: id, scope: scope, globalScope: globalScope, imports: imports, relativePosition: relativePosition} =
    getReferencesAtPosition(buffer, path, position, {includeImports: true, relativePosition: true});

  result.globalScope = globalScope;
  if (id && scope) {
    result.relativePosition = relativePosition;

    //get the import statement if it exists
    for (let symbol of imports) {
      if (symbol.localName == id.name)
        result.import = symbol;
    }

    //are we looking at a namespace object, or normal definition?
    if (id.property && id.object)
      result.definition = findSymbolDefinition(id.property, path, id.object, true, scope);
    else
      result.definition =  findSymbolDefinition(id.name, path, null, true, scope);
  } else {
    //Check if we are on a re-export. If so, search the re-export.
    for (let symbol of globalScope.exportedSymbols) {
      if (positionIsInsideLocation(position, symbol.location))
        if (symbol.moduleRequest)
          result.definition = findSymbolDefinition(symbol.importName, symbol.moduleRequest, null, true, scope);
    }
  }

  return result;
}

//get references at position in the given buffer
function getReferencesAtPosition(buffer, path, position, params={}) {
  var scopes = parseBuffer(buffer,  path);

  if (scopes) {
    for (let scope of scopes) {
      let references = getReferencesAtPositionInScope(scope, position, params);
      if (references.id && references.references) {
        references.scope = scope;
        references.globalScope = scopes[0];
        return references;
      }
    }
  }

  //TODO object code duplication, see below
  return { id: null, references: null, scope: null, relativePosition: null, imports: null, globalScope: scopes[0] };
}

//gets the position of the identifier at the given position
// in the given scope, along with all its references
//param values:
//  relativePosition: whether to include relative position in results
//  includeImports: whether to include imported refs of symbol
//  includeDefinitions: whether to include defined refs of symbol
function getReferencesAtPositionInScope(scope, position, params={}) {
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
    let isIdName = (node) => { return node.name == id.name; };
    let isIdLocalName = (node) => { return node.localName == id.name; };

    results.references = identifiers.filter(isIdName).sort(compareIdentifierLocations);
    if (params.includeImports)
      results.imports = imports.filter(isIdLocalName);

    if (params.includeDefinitions)
      results.definitions = defines.filter(isIdLocalName);

    if (params.relativePosition)
      results.relativePosition = position.column - id.loc.start.column;
  }

  return results;
}

//gets the next reference of a given identifier in a list of references.
//returns null if identifier is not found in the references.
function getNextReference(id, references, skip=1) {
  var index = references.indexOf(id);

  if (index >= 0)
    return references[(index + references.length + skip) % references.length];
  return null;
}
