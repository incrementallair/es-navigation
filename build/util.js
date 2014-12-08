"use strict";
Object.defineProperties(exports, {
  getMemberExpressionString: {get: function() {
      return getMemberExpressionString;
    }},
  positionIsInsideLocation: {get: function() {
      return positionIsInsideLocation;
    }},
  containedWithin: {get: function() {
      return containedWithin;
    }},
  compareIdentifierLocations: {get: function() {
      return compareIdentifierLocations;
    }},
  createRangeFromLocation: {get: function() {
      return createRangeFromLocation;
    }},
  getActiveEditor: {get: function() {
      return getActiveEditor;
    }},
  asyncForEach: {get: function() {
      return asyncForEach;
    }},
  __esModule: {value: true}
});
function getMemberExpressionString(node) {
  if (node.type === "Identifier")
    return node.name;
  if (node.type === "MemberExpression") {
    var left = getMemberExpressionString(node.object);
    var right = getMemberExpressionString(node.property);
    return left + "." + right;
  }
  return null;
}
function positionIsInsideLocation(pos, loc) {
  if (pos.row < loc.start.line - 1 || pos.row > loc.end.line - 1)
    return false;
  if (pos.row == loc.start.line - 1 && pos.column < loc.start.column)
    return false;
  if (pos.row == loc.end.line - 1 && pos.column > loc.end.column)
    return false;
  return true;
}
function containedWithin(a, b) {
  if (a.start.line < b.start.line || a.end.line > b.end.line)
    return false;
  if (a.start.line === b.start.line && a.start.column < b.start.column)
    return false;
  if (a.end.line === b.end.line && a.end.column > b.end.column)
    return false;
  return true;
}
function compareIdentifierLocations(a, b) {
  if (a.loc.start.line < b.loc.start.line)
    return -1;
  if (a.loc.start.line > b.loc.start.line)
    return 1;
  if (a.loc.start.column < b.loc.start.column)
    return -1;
  if (a.loc.start.column > b.loc.start.column)
    return 1;
  return 0;
}
function createRangeFromLocation(loc) {
  return [[loc.start.line - 1, loc.start.column], [loc.end.line - 1, loc.end.column]];
}
function getActiveEditor() {
  return atom.workspace.getActiveTextEditor();
}
function asyncForEach(arr, cb, func) {
  var ind = arguments[3] !== (void 0) ? arguments[3] : 0;
  if (arr.length <= ind)
    return cb(null, null);
  func(arr[ind], (function(err, res) {
    if (res)
      return cb(null, res);
    asyncForEach(arr, cb, func, ind + 1);
  }));
}
