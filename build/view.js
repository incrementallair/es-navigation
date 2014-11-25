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
  clearHighlight: {get: function() {
      return clearHighlight;
    }},
  clearStatusBar: {get: function() {
      return clearStatusBar;
    }},
  createStatusBarView: {get: function() {
      return createStatusBarView;
    }},
  __esModule: {value: true}
});
var $__status_45_bar__,
    $__util__,
    $__navigate__,
    $__navigate__,
    $__navigate__;
'use strict';
var StatusBarView = ($__status_45_bar__ = require("./status-bar"), $__status_45_bar__ && $__status_45_bar__.__esModule && $__status_45_bar__ || {default: $__status_45_bar__}).default;
var $__1 = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}),
    getActiveEditor = $__1.getActiveEditor,
    createRangeFromLocation = $__1.createRangeFromLocation;
var getReferencesAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getReferencesAtPosition;
var getNextReference = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getNextReference;
var getDefinitionAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getDefinitionAtPosition;
;
;
;
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
    var $__7 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor),
        id = $__7.id,
        references = $__7.references,
        scope = $__7.scope;
    if (references && id) {
      for (var $__5 = references[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__6; !($__6 = $__5.next()).done; ) {
        var reference = $__6.value;
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
    var $__7 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor),
        id = $__7.id,
        references = $__7.references,
        scope = $__7.scope;
    if (id && references) {
      var next = getNextReference(id, references, skip);
      var nextPosition = [next.loc.start.line - 1, next.loc.start.column];
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
  if (!atom.config.get("atom-symbol-navigation.showScopeHighlights"))
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
