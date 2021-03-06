"use strict";
Object.defineProperties(exports, {
  toDefinition: {get: function() {
      return toDefinition;
    }},
  clearDefinitionStack: {get: function() {
      return clearDefinitionStack;
    }},
  selectAllIdentifiers: {get: function() {
      return selectAllIdentifiers;
    }},
  toNextIdentifier: {get: function() {
      return toNextIdentifier;
    }},
  toPrevIdentifier: {get: function() {
      return toPrevIdentifier;
    }},
  createStatusBarView: {get: function() {
      return createStatusBarView;
    }},
  highlightImport: {get: function() {
      return highlightImport;
    }},
  clearModuleHighlights: {get: function() {
      return clearModuleHighlights;
    }},
  clearHighlight: {get: function() {
      return clearHighlight;
    }},
  updateStatusBar: {get: function() {
      return updateStatusBar;
    }},
  clearStatusBar: {get: function() {
      return clearStatusBar;
    }},
  __esModule: {value: true}
});
var $__status_45_bar__,
    $__util__,
    $__navigate__,
    $__es_45_parse_45_tools__;
var StatusBarView = ($__status_45_bar__ = require("./status-bar"), $__status_45_bar__ && $__status_45_bar__.__esModule && $__status_45_bar__ || {default: $__status_45_bar__}).default;
var $__1 = ($__util__ = require("./util"), $__util__ && $__util__.__esModule && $__util__ || {default: $__util__}),
    getActiveEditor = $__1.getActiveEditor,
    createRangeFromLocation = $__1.createRangeFromLocation,
    positionIsInsideLocation = $__1.positionIsInsideLocation;
var $__2 = ($__navigate__ = require("./navigate"), $__navigate__ && $__navigate__.__esModule && $__navigate__ || {default: $__navigate__}),
    getReferencesAtPosition = $__2.getReferencesAtPosition,
    getNextReference = $__2.getNextReference,
    getDefinitionAtPosition = $__2.getDefinitionAtPosition;
var tools = ($__es_45_parse_45_tools__ = require("es-parse-tools"), $__es_45_parse_45_tools__ && $__es_45_parse_45_tools__.__esModule && $__es_45_parse_45_tools__ || {default: $__es_45_parse_45_tools__}).default;
var definitionStack = null,
    definitionState = 0;
function toDefinition() {
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    getDefinitionAtPosition(editor.getPath(), cursor, (function(err, def) {
      if (err)
        return;
      if (definitionState === 0)
        definitionStack = {
          path: editor.getPath(),
          pos: cursor,
          range: null
        };
      if (def.globalScope) {
        for (var $__4 = def.globalScope.importedSymbols[$traceurRuntime.toProperty(Symbol.iterator)](),
            $__5; !($__5 = $__4.next()).done; ) {
          var symbol = $__5.value;
          {
            if (positionIsInsideLocation(cursor, symbol.importLocation)) {
              if (symbol.location)
                definitionStack.range = createRangeFromLocation(symbol.location);
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
      }
      if (def.import && definitionState === 0) {
        definitionStack.range = createRangeFromLocation(def.import.location);
        var position$__7 = [def.import.location.start.line - 1, def.import.location.start.column + def.relativePosition];
        return jumpToLocationFrom(def.import.location, editor.getPath(), editor, {
          state: 1,
          position: position$__7
        });
      }
      if (def.definition && definitionState < 2) {
        var position$__8 = [def.definition.loc.start.line - 1, def.definition.loc.start.column + def.relativePosition];
        return jumpToLocationFrom(def.definition.loc, def.definition.path, editor, {
          state: 2,
          position: position$__8
        });
      }
      if (definitionState > 0) {
        jumpToPositionFrom(definitionStack.pos, definitionStack.path, editor, {state: 0}, definitionStack.range);
        clearDefinitionStack();
        return;
      }
    }));
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
    getReferencesAtPosition(editor.getPath(), cursor, {}, (function(error, result) {
      if (error)
        return console.warn("Error in selectAllIdentifiers while getting references: " + error);
      if (!result)
        return;
      var $__6 = result,
          id = $__6.id,
          references = $__6.references,
          scope = $__6.scope;
      if (references && id) {
        for (var $__4 = references[$traceurRuntime.toProperty(Symbol.iterator)](),
            $__5; !($__5 = $__4.next()).done; ) {
          var reference = $__5.value;
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
      } else {
        updateStatusBar("ESNav: couldn't find symbol.");
      }
    }));
  }
}
function toNextIdentifier() {
  toIdentifier(1);
}
function toPrevIdentifier() {
  toIdentifier(-1);
}
function toIdentifier(skip) {
  var editor = getActiveEditor();
  if (editor) {
    var cursor = editor.getCursorBufferPosition();
    getReferencesAtPosition(editor.getPath(), cursor, {relativePosition: true}, (function(error, result) {
      if (error)
        return console.warn("Error in toIdentifier while getting references: " + error);
      if (result) {
        var $__6 = result,
            id = $__6.id,
            references = $__6.references,
            scope = $__6.scope,
            relativePosition = $__6.relativePosition;
        var next = getNextReference(id, references, skip);
        var position = [next.loc.start.line - 1, next.loc.start.column + relativePosition];
        jumpToLocationFrom(next.loc, editor.getPath(), editor, {position: position});
        ourStatusBar.updateText((references.indexOf(result.id) + 1) + "/" + references.length + " matches");
        if (scope.type != "global")
          highlightScope(scope, editor);
      } else {
        updateStatusBar("ESNav: couldn't find symbol.");
      }
    }));
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
  tools.parseURI(editor.getPath(), (function(error, scopes) {
    if (error)
      return;
    var scope = scopes[0];
    for (var $__4 = scope.importedSymbols.concat(scope.exportedSymbols)[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__5; !($__5 = $__4.next()).done; ) {
      var symbol = $__5.value;
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
  }));
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
    for (var $__4 = moduleHighlights.get(path)[$traceurRuntime.toProperty(Symbol.iterator)](),
        $__5; !($__5 = $__4.next()).done; ) {
      var highlight = $__5.value;
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
  var position = params.position || [range[0][0], range[0][1]];
  jumpToPositionFrom(position, path, editor, params, range);
}
function jumpToPositionFrom(position, path, editor, params) {
  var range = arguments[4] !== (void 0) ? arguments[4] : null;
  var previousCursor = editor.getCursorBufferPosition();
  var previousPath = editor.getPath();
  if (path == editor.getPath()) {
    applyJump(editor);
  } else {
    var closeOnDeactivate = atom.workspace.getActivePane().itemForUri(path) ? false : true;
    atom.workspace.open(path, {
      activatePane: true,
      searchAllPanes: true
    }).then((function(editor) {
      applyJump(editor);
      editor.closeOnDeactivate = closeOnDeactivate;
    }));
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
