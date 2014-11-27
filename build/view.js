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
  clearModuleHighlights: {get: function() {
      return clearModuleHighlights;
    }},
  highlightImport: {get: function() {
      return highlightImport;
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
var positionIsInsideLocation = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}).positionIsInsideLocation;
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
    if (toDefinitionToggle.position && toDefinitionToggle.path) {
      jumpToPositionFrom(toDefinitionToggle.position, toDefinitionToggle.path, editor);
      toDefinitionToggle.position = null;
      return;
    }
    var cursor = editor.getCursorBufferPosition();
    var definition = getDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);
    if (definition) {
      jumpToLocationFrom(definition.loc, definition.path, editor, toDefinitionToggle);
    } else {
      toInFileDefinition();
    }
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
    var $__11 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor),
        id = $__11.id,
        references = $__11.references,
        scope = $__11.scope;
    if (references && id) {
      for (var $__9 = references[$traceurRuntime.toProperty(Symbol.iterator)](),
          $__10; !($__10 = $__9.next()).done; ) {
        var reference = $__10.value;
        {
          var range = createRangeFromLocation(reference.loc);
          editor.addSelectionForBufferRange(range);
        }
      }
      ourStatusBar.updateText(references.length + " matches");
      highlightScope(scope, editor);
      highlightImport(editor, {symbol: id});
    }
  }
}
function toNextIdentifier() {
  var skip = arguments[0] !== (void 0) ? arguments[0] : 1;
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    var $__11 = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor, {relativePosition: true}),
        id = $__11.id,
        references = $__11.references,
        scope = $__11.scope,
        relativePosition = $__11.relativePosition;
    if (id && references) {
      var next = getNextReference(id, references, skip);
      var nextPosition = [next.loc.start.line - 1, next.loc.start.column + relativePosition];
      editor.setCursorBufferPosition(nextPosition);
      highlightImport(editor, {
        symbol: id,
        position: editor.getCursorBufferPosition()
      });
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
function highlightImport(editor, params) {
  var scopes = parseBuffer(editor.getText(), editor.getPath());
  if (!scopes)
    return;
  var scope = scopes[0];
  for (var $__9 = scope.importedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
      $__10; !($__10 = $__9.next()).done; ) {
    var symbol = $__10.value;
    {
      var match = false;
      if (params.symbol && symbol.localName == params.symbol.name)
        match = true;
      if (params.position && positionIsInsideLocation(params.position, symbol.importLocation))
        match = true;
      if (match) {
        highlightModuleSymbol(editor, symbol);
        return;
      }
    }
  }
}
var moduleHighlights = new Map();
function highlightModuleSymbol(editor, symbol) {
  var path = editor.getPath();
  if (!moduleHighlights.has(path))
    moduleHighlights.set(path, []);
  clearModuleHighlights(path);
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
    moduleHighlights.get(path).push(highlight);
  }
}
function clearModuleHighlights(path) {
  if (moduleHighlights.has(path)) {
    for (var $__9 = moduleHighlights.get(path)[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__10; !($__10 = $__9.next()).done; ) {
      var highlight = $__10.value;
      highlight.getMarker().destroy();
    }
    moduleHighlights[path] = [];
  }
}
var scopeHighlight = null;
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
  scopeHighlight = highlight;
}
function clearHighlight() {
  if (scopeHighlight) {
    scopeHighlight.getMarker().destroy();
    scopeHighlight = null;
  }
}
function clearStatusBar() {
  ourStatusBar.updateText('');
}
function clearToggles() {
  toInFileDefinitionToggle.position = null;
  toDefinitionToggle.position = null;
}
