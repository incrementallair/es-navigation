"use strict";
Object.defineProperties(exports, {
  toNextIdentifier: {get: function() {
      return toNextIdentifier;
    }},
  selectAllIdentifiers: {get: function() {
      return selectAllIdentifiers;
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
  highlightModules: {get: function() {
      return highlightModules;
    }},
  clearModuleHighlights: {get: function() {
      return clearModuleHighlights;
    }},
  createStatusBarView: {get: function() {
      return createStatusBarView;
    }},
  __esModule: {value: true}
});
var $__status_45_bar__,
    $__cache__,
    $__util__,
    $__util__,
    $__navigate__,
    $__navigate__,
    $__navigate__,
    $__navigate__;
'use strict';
var StatusBarView = ($__status_45_bar__ = require("./status-bar"), $__status_45_bar__ && $__status_45_bar__.__esModule && $__status_45_bar__ || {default: $__status_45_bar__}).default;
var parseBuffer = ($__cache__ = require("./cache"), $__cache__ && $__cache__.__esModule && $__cache__ || {default: $__cache__}).parseBuffer;
var $__2 = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}),
    getActiveEditor = $__2.getActiveEditor,
    createRangeFromLocation = $__2.createRangeFromLocation;
var $__3 = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}),
    jumpToPositionFrom = $__3.jumpToPositionFrom,
    jumpToLocationFrom = $__3.jumpToLocationFrom;
var getReferencesAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getReferencesAtPosition;
var getNextReference = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getNextReference;
var getDefinitionAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getDefinitionAtPosition;
var getInFileDefinitionAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getInFileDefinitionAtPosition;
;
;
;
;
;
var toDefinitionToggle = {};
function toDefinition() {
  var editor = getActiveEditor();
  if (editor) {
    highlightModules(editor);
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
    highlightModules(editor);
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
    highlightModules(editor);
    var cursor = editor.getCursorBufferPosition();
    var $__10 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor),
        id = $__10.id,
        references = $__10.references,
        scope = $__10.scope;
    if (references && id) {
      for (var $__8 = references[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__9; !($__9 = $__8.next()).done; ) {
        var reference = $__9.value;
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
    highlightModules(editor);
    var cursor = editor.getCursorBufferPosition();
    var $__10 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor, {relativePosition: true}),
        id = $__10.id,
        references = $__10.references,
        scope = $__10.scope,
        relativePosition = $__10.relativePosition;
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
var moduleHighlights = [];
function highlightModules(editor) {
  var scopes = parseBuffer(editor.getText(), editor.getPath());
  if (scopes) {
    var scope = scopes[0];
    var highlightModule = (function(symbol) {
      if (symbol.moduleLocation) {
        var cssClass = "module-resolved";
        if (symbol.moduleRequest == "notFound")
          cssClass = "module-not-found";
        if (symbol.moduleRequest == "parseError")
          cssClass = "module-parse-error";
        var range = createRangeFromLocation(symbol.moduleLocation);
        var marker = editor.markBufferRange(range);
        var highlight = editor.decorateMarker(marker, {
          type: 'highlight',
          class: cssClass
        });
        moduleHighlights.push(highlight);
      }
    });
    scope.importedSymbols.map(highlightModule);
    scope.exportedSymbols.map(highlightModule);
  }
}
function clearModuleHighlights() {
  moduleHighlights.map((function(highlight) {
    highlight.getMarker().destroy();
  }));
  moduleHighlights = [];
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
