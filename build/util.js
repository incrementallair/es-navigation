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
  jumpToPositionFrom: {get: function() {
      return jumpToPositionFrom;
    }},
  jumpToLocationFrom: {get: function() {
      return jumpToLocationFrom;
    }},
  __esModule: {value: true}
});
var $__view__;
'use strict';
var highlightImport = ($__view__ = require("./view"), $__view__ && $__view__.__esModule && $__view__ || {default: $__view__}).highlightImport;
;
;
;
;
;
;
;
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
  if (pos.row < loc.start.line - 1)
    return false;
  if (pos.row > loc.end.line - 1)
    return false;
  if (pos.row == loc.start.line - 1)
    if (pos.column < loc.start.column)
      return false;
  if (pos.row == loc.end.line - 1)
    if (pos.column > loc.end.column)
      return false;
  return true;
}
function containedWithin(a, b) {
  if (a.start.line < b.start.line)
    return false;
  if (a.end.line > b.end.line)
    return false;
  if (a.start.line === b.start.line)
    if (a.start.column < b.start.column)
      return false;
  if (a.end.line === b.end.line)
    if (a.end.column > b.end.column)
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
function jumpToLocationFrom(location, path, editor) {
  var toggle = arguments[3] !== (void 0) ? arguments[3] : null;
  var range = createRangeFromLocation(location);
  var position = [location.start.line - 1, location.start.column];
  jumpToPositionFrom(position, path, editor, range, toggle);
}
function jumpToPositionFrom(position, path, editor) {
  var range = arguments[3] !== (void 0) ? arguments[3] : null;
  var toggle = arguments[4] !== (void 0) ? arguments[4] : null;
  var previousCursor = editor.getCursorBufferPosition();
  var previousPath = editor.getPath();
  if (path == editor.getPath()) {
    editor.setCursorBufferPosition(position);
    if (range)
      editor.setSelectedBufferRange(range);
    if (toggle) {
      toggle.position = previousCursor;
      toggle.path = previousPath;
    }
    highlightImport(editor, {position: editor.getCursorBufferPosition()});
  } else {
    atom.workspace.open(path, {
      activatePane: true,
      searchAllPanes: true
    }).then((function(openedEditor) {
      openedEditor.setCursorBufferPosition(position);
      if (range)
        openedEditor.setSelectedBufferRange(range);
      if (toggle) {
        toggle.position = previousCursor;
        toggle.path = previousPath;
      }
    }));
  }
}
