"use strict";
Object.defineProperties(exports, {
  getReferencesAtPosition: {get: function() {
      return getReferencesAtPosition;
    }},
  getNextReference: {get: function() {
      return getNextReference;
    }},
  __esModule: {value: true}
});
var $__util__,
    $__parse__;
'use strict';
var $__0 = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}),
    positionIsInsideLocation = $__0.positionIsInsideLocation,
    compareIdentifierLocations = $__0.compareIdentifierLocations;
var parseBuffer = ($__parse__ = require("./parse"), $__parse__ && $__parse__.__esModule && $__parse__ || {default: $__parse__}).parseBuffer;
;
;
function getReferencesAtPosition(buffer, path, position) {
  var scopes = parseBuffer(buffer, path);
  if (scopes) {
    for (var $__2 = scopes[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__3; !($__3 = $__2.next()).done; ) {
      var scope = $__3.value;
      {
        var references = getReferencesAtPositionInScope(scope, position);
        if (references)
          return references;
      }
    }
  }
  return null;
}
function getReferencesAtPositionInScope(scope, position) {
  var identifiers = scope.referencedSymbols;
  var id = identifiers.filter((function(node) {
    return positionIsInsideLocation(position, node.loc);
  }))[0];
  if (id) {
    var references = identifiers.filter((function(node) {
      return node.name == id.name;
    })).sort(compareIdentifierLocations);
    return {
      id: id,
      references: references
    };
  }
  return null;
}
function getNextReference(id, references) {
  var index = references.indexOf(id);
  if (index >= 0)
    return references[(index + references.length) % references.length];
  return null;
}
