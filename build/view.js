"use strict";
Object.defineProperties(exports, {
  selectAllIdentifiers: {get: function() {
      return selectAllIdentifiers;
    }},
  toNextIdentifier: {get: function() {
      return toNextIdentifier;
    }},
  toDefinition: {get: function() {
      return toDefinition;
    }},
  __esModule: {value: true}
});
var $__util__,
    $__navigate__,
    $__navigate__,
    $__navigate__;
'use strict';
var $__0 = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}),
    getActiveEditor = $__0.getActiveEditor,
    createRangeFromLocation = $__0.createRangeFromLocation;
var getReferencesAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getReferencesAtPosition;
var getNextReference = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getNextReference;
var getDefinitionAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getDefinitionAtPosition;
;
;
;
function toDefinition() {
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    var definition = getDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);
    if (definition) {
      var loc = definition.loc;
      var position = [loc.start.line - 1, loc.start.column];
      var range = createRangeFromLocation(loc);
      if (definition.path == editor.getPath()) {
        editor.setCursorBufferPosition(position);
        editor.setSelectedBufferRange(range);
      } else {
        atom.workspace.open(definition.path, {
          initialLine: position[0],
          initialColumn: position[1],
          activatePane: true,
          searchAllPanes: true
        }).then((function(openedEditor) {
          openedEditor.setCursorBufferPosition(position);
          openedEditor.setSelectedBufferRange(range);
        }));
      }
    }
  }
}
function selectAllIdentifiers() {
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    var $__6 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor),
        id = $__6.id,
        references = $__6.references;
    if (references && id) {
      for (var $__4 = references[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__5; !($__5 = $__4.next()).done; ) {
        var reference = $__5.value;
        {
          var range = createRangeFromLocation(reference.loc);
          editor.addSelectionForBufferRange(range);
        }
      }
      highlightScope(id.scope, editor);
    }
  }
}
function toNextIdentifier(params) {
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    var $__6 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor),
        id = $__6.id,
        references = $__6.references;
    if (id && references) {
      var next = getNextReference(id, references);
      var loc = next.id.loc;
      var nextPosition = [loc.start.line - 1, loc.start.column + next.pos];
      editor.setCursorBufferPosition(nextPosition);
      highlightScope(next.scope, editor);
    }
  }
}
var currentHighlight = null;
function highlightScope(scope, editor) {
  clearHighlight();
  if (!atom.config.get("atom-symbol-navigation.showScopeHighlights"))
    return;
  var location = scope.block.loc;
  var range = createRangeFromLocation(location);
  range[0][1] = 0;
  range[1][1] = 0;
  range[1][0]++;
  var marker = editor.markBufferRange(range);
  var decor = editor.decorateMarker(marker, {
    type: 'highlight',
    class: 'soft-gray-highlight'
  });
}
function clearHighlight() {
  if (currentHighlight) {
    currentHighlight.getMarker().destroy();
    currentHighlight = null;
  }
}
