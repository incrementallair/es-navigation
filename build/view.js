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
  clearHighlight: {get: function() {
      return clearHighlight;
    }},
  clearStatusBar: {get: function() {
      return clearStatusBar;
    }},
  clearDefinitionStack: {get: function() {
      return clearDefinitionStack;
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
  updateStatusBar: {get: function() {
      return updateStatusBar;
    }},
  __esModule: {value: true}
});
var $__status_45_bar__,
    $__cache__,
    $__util__,
    $__util__,
    $__navigate__,
    $__navigate__,
    $__navigate__;
'use strict';
var StatusBarView = ($__status_45_bar__ = require("./status-bar"), $__status_45_bar__ && $__status_45_bar__.__esModule && $__status_45_bar__ || {default: $__status_45_bar__}).default;
var parseBuffer = ($__cache__ = require("./cache"), $__cache__ && $__cache__.__esModule && $__cache__ || {default: $__cache__}).parseBuffer;
var $__2 = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}),
    getActiveEditor = $__2.getActiveEditor,
    createRangeFromLocation = $__2.createRangeFromLocation;
var positionIsInsideLocation = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}).positionIsInsideLocation;
var getReferencesAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getReferencesAtPosition;
var getNextReference = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getNextReference;
var getDefinitionAtPosition = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}).getDefinitionAtPosition;
;
;
;
;
;
var definitionStack = [],
    definitionState = 0;
function toDefinition() {
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    var def = getDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);
    if (definitionState === 0)
      definitionStack = [{
        path: editor.getPath(),
        pos: cursor
      }];
    for (var $__7 = def.globalScope.importedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__8; !($__8 = $__7.next()).done; ) {
      var symbol = $__8.value;
      {
        if (positionIsInsideLocation(cursor, symbol.importLocation)) {
          if (def.definition) {
            var position = [def.definition.loc.start.line - 1, def.definition.loc.start.column + def.relativePosition];
            return jumpToLocationFrom(def.definition.loc, def.definition.path, editor, {
              state: 2,
              position: position
            });
          }
          clearModuleHighlights();
          highlightImport(editor, {position: editor.getCursorBufferPosition()});
          if (["unresolved", "notFound", "parseError"].indexOf(symbol.moduleRequest) == -1)
            return jumpToPositionFrom([0, 0], symbol.moduleRequest, editor, {state: 1});
        }
      }
    }
    if (def.import && definitionState === 0) {
      var position$__10 = [def.import.location.start.line - 1, def.import.location.start.column + def.relativePosition];
      return jumpToLocationFrom(def.import.location, editor.getPath(), editor, {
        state: 1,
        position: position$__10
      });
    }
    if (def.definition && definitionState < 2) {
      var position$__11 = [def.definition.loc.start.line - 1, def.definition.loc.start.column + def.relativePosition];
      return jumpToLocationFrom(def.definition.loc, def.definition.path, editor, {
        state: 2,
        position: position$__11
      });
    }
    if (definitionState > 0) {
      jumpToPositionFrom(definitionStack[0].pos, definitionStack[0].path, editor, {state: 0});
      clearDefinitionStack();
      return;
    }
  }
  updateStatusBar('ESNav: could not find binding');
  clearModuleHighlights();
  highlightImport(editor, {position: editor.getCursorBufferPosition()});
}
function clearDefinitionStack() {
  definitionState = 0;
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
      updateStatusBar(references.length + " matches");
      clearHighlight();
      highlightImport(editor, {symbol: id});
      if (scope.type != "global")
        highlightScope(scope, editor);
    } else
      updateStatusBar("ESNav: couldn't find symbol.");
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
      var position = [next.loc.start.line - 1, next.loc.start.column + relativePosition];
      jumpToLocationFrom(next.loc, editor.getPath(), editor, {position: position});
      ourStatusBar.updateText((references.indexOf(id) + 1) + "/" + references.length + " matches");
      if (scope.type != "global")
        highlightScope(scope, editor);
    } else
      updateStatusBar("ESNav: couldn't find symbol.");
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
  for (var $__7 = scope.importedSymbols.concat(scope.exportedSymbols)[$traceurRuntime.toProperty(Symbol.iterator)](),
      $__8; !($__8 = $__7.next()).done; ) {
    var symbol = $__8.value;
    {
      var match = false;
      if (params.symbol && symbol.localName == params.symbol.name)
        match = true;
      if (symbol.importLocation && params.position && positionIsInsideLocation(params.position, symbol.importLocation))
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
    var range = createRangeFromLocation(symbol.moduleLocation);
    var marker = editor.markBufferRange(range);
    var highlight = editor.decorateMarker(marker, {
      type: 'highlight',
      class: getClass(symbol.moduleRequest)
    });
    symbol.moduleRequestCallback.then((function(resolved) {
      highlight.properties.class = getClass(resolved);
    }));
    moduleHighlights.get(path).push(highlight);
  }
  function getClass(moduleRequest) {
    var cssClass = "module-resolved";
    if (moduleRequest == "unresolved")
      cssClass = "module-unresolved";
    if (moduleRequest == "notFound")
      cssClass = "module-not-found";
    if (moduleRequest == "parseError")
      cssClass = "module-parse-error";
    return cssClass;
  }
}
function clearModuleHighlights(path) {
  if (moduleHighlights.has(path)) {
    for (var $__7 = moduleHighlights.get(path)[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__8; !($__8 = $__7.next()).done; ) {
      var highlight = $__8.value;
      highlight.getMarker().destroy();
    }
    moduleHighlights[path] = [];
  }
}
var scopeHighlight = null,
    navHighlight = null;
function highlightScope(scope, editor) {
  if (!atom.config.get("es-navigation.showScopeHighlights"))
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
  if (navHighlight) {
    navHighlight.getMarker().destroy();
    navHighlight = null;
  }
}
function updateStatusBar(text) {
  if (ourStatusBar)
    ourStatusBar.updateText(text);
}
function clearStatusBar() {
  updateStatusBar('');
}
function jumpToLocationFrom(location, path, editor, params) {
  var range = createRangeFromLocation(location);
  var position = [range[0][0], range[0][1]];
  jumpToPositionFrom(params.position ? params.position : position, path, editor, params, range);
}
function jumpToPositionFrom(position, path, editor, params) {
  var range = arguments[4] !== (void 0) ? arguments[4] : null;
  var previousCursor = editor.getCursorBufferPosition();
  var previousPath = editor.getPath();
  if (path == editor.getPath()) {
    applyJump(editor);
  } else {
    atom.workspace.open(path, {
      activatePane: true,
      searchAllPanes: true
    }).then(applyJump);
  }
  function applyJump(editor) {
    editor.setCursorBufferPosition(position);
    if (range) {
      clearHighlight();
      var marker = editor.markBufferRange(range);
      var highlight = editor.decorateMarker(marker, {
        type: 'highlight',
        class: 'navigation-select'
      });
      navHighlight = highlight;
    }
    if (params.state)
      definitionState = params.state;
    highlightImport(editor, {position: editor.getCursorBufferPosition()});
  }
}
