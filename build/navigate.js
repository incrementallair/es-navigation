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
var $__util__;
'use strict';
var util = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}).default;
;
;
function getReferencesAtPosition(scope, position) {
  var identifiers = scope.referencedSymbols;
  var id = identifiers.filter((function(node) {
    return util.positionIsInsideLocation(position, node.loc);
  }))[0];
  if (id) {
    var references = identifiers.filter((function(node) {
      return node.name == id.name;
    })).sort(util.compareIdentifierLocations);
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
