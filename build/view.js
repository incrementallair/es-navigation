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
  toInFileDefinition: {get: function() {
      return toInFileDefinition;
    }},
  clearHighlight: {get: function() {
      return clearHighlight;
    }},
  clearStatusBar: {get: function() {
      return clearStatusBar;
    }},
  clearToggles: {get: function() {
      return clearToggles;
    }},
  createStatusBarView: {get: function() {
      return createStatusBarView;
    }},
  __esModule: {value: true}
});
var $__status_45_bar__,
    $__util__,
    $__util__,
    $__navigate__,
    $__navigate__,
    $__navigate__,
    $__navigate__;
'use strict';
var StatusBarView = ($__status_45_bar__ = require("./status-bar"), $__status_45_bar__ && $__status_45_bar__.__esModule && $__status_45_bar__ || {default: $__status_45_bar__}).default;
var $__1 = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}),
    getActiveEditor = $__1.getActiveEditor,
    createRangeFromLocation = $__1.createRangeFromLocation;
var $__2 = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}),
    jumpToPositionFrom = $__2.jumpToPositionFrom,
    jumpToLocationFrom = $__2.jumpToLocationFrom;
var getReferencesAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getReferencesAtPosition;
var getNextReference = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getNextReference;
var getDefinitionAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getDefinitionAtPosition;
var getInFileDefinitionAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getInFileDefinitionAtPosition;
;
;
;
;
;
;
;
;
var toDefinitionToggle = {};
function toDefinition() {
  var editor = getActiveEditor();
  if (editor) {
    if (toDefinitionToggle.position && toDefinitionToggle.path) {
      jumpToPositionFrom(toDefinitionToggle.position, toDefinitionToggle.path, editor);
      toDefinitionToggle.position = null;
      return;
    }
    var cursor = editor.getCursorBufferPosition();
    var definition = getDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);
    if (definition)
      jumpToLocationFrom(definition.loc, definition.path, editor, toDefinitionToggle);
  }
}
var toInFileDefinitionToggle = {};
function toInFileDefinition() {
  var editor = getActiveEditor();
  if (editor) {
    if (toInFileDefinitionToggle.position && toInFileDefinitionToggle.path) {
      jumpToPositionFrom(toInFileDefinitionToggle.position, toInFileDefinitionToggle.path, editor);
      toInFileDefinitionToggle.position = null;
      return;
    }
    var cursor = editor.getCursorBufferPosition();
    var location = getInFileDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);
    if (location)
      jumpToLocationFrom(location, editor.getPath(), editor, toInFileDefinitionToggle);
  }
}
function selectAllIdentifiers() {
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    var $__9 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor),
        id = $__9.id,
        references = $__9.references,
        scope = $__9.scope;
    if (references && id) {
      for (var $__7 = references[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__8; !($__8 = $__7.next()).done; ) {
        var reference = $__8.value;
        {
          var range = createRangeFromLocation(reference.loc);
          editor.addSelectionForBufferRange(range);
        }
      }
      ourStatusBar.updateText(references.length + " matches");
      highlightScope(scope, editor);
    }
  }
}
function toNextIdentifier() {
  var skip = arguments[0] !== (void 0) ? arguments[0] : 1;
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    var $__9 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor, {relativePosition: true}),
        id = $__9.id,
        references = $__9.references,
        scope = $__9.scope,
        relativePosition = $__9.relativePosition;
    if (id && references) {
      var next = getNextReference(id, references, skip);
      var nextPosition = [next.loc.start.line - 1, next.loc.start.column + relativePosition];
      editor.setCursorBufferPosition(nextPosition);
      highlightScope(scope, editor);
    }
  }
}
var ourStatusBar = null;
function createStatusBarView() {
  var statusBar = atom.workspaceView.statusBar;
  if (statusBar && !ourStatusBar) {
    ourStatusBar = new StatusBarView();
    ourStatusBar.initialize(statusBar);
    ourStatusBar.attach();
  }
}
var currentHighlight = null;
function highlightScope(scope, editor) {
  clearHighlight();
  if (!atom.config.get("ecmascript-navigation.showScopeHighlights"))
    return;
  var location = scope.block.loc;
  var range = createRangeFromLocation(location);
  range[0][1] = 0;
  range[1][1] = 0;
  range[1][0]++;
  var marker = editor.markBufferRange(range);
  var highlight = editor.decorateMarker(marker, {
    type: 'highlight',
    class: 'soft-gray-highlight'
  });
  currentHighlight = highlight;
}
function clearHighlight() {
  if (currentHighlight) {
    currentHighlight.getMarker().destroy();
    currentHighlight = null;
  }
}
function clearStatusBar() {
  ourStatusBar.updateText('');
}
function clearToggles() {
  toInFileDefinitionToggle.position = null;
  toDefinitionToggle.position = null;
}
