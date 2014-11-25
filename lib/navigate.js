'use strict';

import {positionIsInsideLocation, compareIdentifierLocations} from "./util";
import {parseBuffer} from './parse';

export {getReferencesAtPosition};
export {getNextReference};

//get references at position in the given buffer
function getReferencesAtPosition(buffer, path, position) {
  var scopes = parseBuffer(buffer,  path);

  if (scopes) {
    for (let scope of scopes) {
      let references = getReferencesAtPositionInScope(scope, position);
      if (references) {
        references.scope = scope;
        return references;
      }
    }
  }

  return null;
}

//gets the position of the identifier at the given position
// in the given scope, along with all its references
function getReferencesAtPositionInScope(scope, position) {
  var identifiers = scope.referencedSymbols;
  var id = identifiers.filter((node) => {
    return positionIsInsideLocation(position, node.loc);
  })[0];

  //found an identifier at the cursor
  if (id) {
    var references = identifiers.filter((node) => {
      return node.name == id.name;
    }).sort(compareIdentifierLocations);

    return {
      id: id,
      references: references,
    };
  }

  return null;
}

//gets the next reference of a given identifier in a list of references.
//returns null if identifier is not found in the references.
function getNextReference(id, references) {
  var index = references.indexOf(id);
  if (index >= 0)
    return references[(index + references.length) % references.length];
  return null;
}
