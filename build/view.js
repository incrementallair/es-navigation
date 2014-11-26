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
  createStatusBarView: {get: function() {
      return createStatusBarView;
    }},
  __esModule: {value: true}
});
var $__status_45_bar__,
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
function toDefinition() {
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    var definition = getDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);
    var relativePosition = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor, {relativePosition: true}).relativePosition;
    if (definition && relativePosition) {
      var loc = definition.loc;
      var range = createRangeFromLocation(loc);
      var position = [loc.start.line - 1, loc.start.column];
      if (definition.path == editor.getPath()) {
        editor.setCursorBufferPosition(position);
        editor.setSelectedBufferRange(range);
      } else {
        atom.workspace.open(definition.path, {
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
function toInFileDefinition() {
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    var definition = getInFileDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);
    if (definition) {
      var range = createRangeFromLocation(definition);
      var position = [definition.start.line - 1, definition.start.column];
      editor.setCursorBufferPosition(position);
      editor.setSelectedBufferRange(range);
    }
  }
}
function jumpToLocationFrom(location, path, editor) {
  var range = createRangeFromLocation(location);
  var position = [location.start.line - 1, location.start.column];
  if (path == editor.getPath()) {
    editor.setCursorBufferPosition(position);
    editor.setSelectedBufferRange(range);
  } else {
    atom.workspace.open(path, {
      activatePane: true,
      searchAllPanes: true
    }).then((function(openedEditor) {
      openedEditor.setCursorBufferPosition(position);
      openedEditor.setSelectedBufferRange(range);
    }));
  }
}
function selectAllIdentifiers() {
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    var $__8 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor),
        id = $__8.id,
        references = $__8.references,
        scope = $__8.scope;
    if (references && id) {
      for (var $__6 = references[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__7; !($__7 = $__6.next()).done; ) {
        var reference = $__7.value;
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
    var $__8 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor, {relativePosition: true}),
        id = $__8.id,
        references = $__8.references,
        scope = $__8.scope,
        relativePosition = $__8.relativePosition;
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
