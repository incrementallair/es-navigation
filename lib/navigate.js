'use strict';

import {positionIsInsideLocation, compareIdentifierLocations} from "./util";
import {parseBuffer} from './cache';
import {findSymbolDefinition} from './search';

export {getReferencesAtPosition};
export {getInFileDefinitionAtPosition};
export {getDefinitionAtPosition};
export {getNextReference};

//find definition of the symbol at position in the given buffer
function getDefinitionAtPosition(buffer, path, position) {
  var {id: id, scope: scope} =
    getReferencesAtPosition(buffer, path, position);

  if (id && scope) {
    //Are we looking at a namespace object, or normal definition?
    if (id.property && id.object)
      return findSymbolDefinition(id.property, path, id.object, true, scope);
    else
      return findSymbolDefinition(id.name, path, null, true, scope);
  }

  return null;
}

//find in-file definition of symbol at position in the given buffer
//usually an import statement or explicit definition
function getInFileDefinitionAtPosition(buffer, path, position) {
  var {id: id, imports: imports, definitions: definitions} =
    getReferencesAtPosition(buffer, path, position, {
      includeImports: true,
      includeDefinitions: true
    });

  if (id) {
    if (definitions.length > 0) return definitions[0].location;
    if (imports.length > 0) return imports[0].location;
  }

  return null;
}

//get references at position in the given buffer
function getReferencesAtPosition(buffer, path, position, params={}) {
  var scopes = parseBuffer(buffer,  path);

  if (scopes) {
    for (let scope of scopes) {
      let references = getReferencesAtPositionInScope(scope, position, params);
      if (references.id && references.references) {
        references.scope = scope;
        return references;
      }
    }
  }

  //TODO object code duplication, see below
  return { id: null, references: null, scope: null, relativePosition: null, imports: null };
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
