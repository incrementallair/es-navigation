'use strict';

import StatusBarView from './status-bar';
import {parseBuffer} from './cache';
import {getActiveEditor, createRangeFromLocation} from './util';
import {positionIsInsideLocation} from './util';
import {getReferencesAtPosition} from './navigate';
import {getNextReference} from './navigate';
import {getDefinitionAtPosition} from './navigate';

export {toNextIdentifier, selectAllIdentifiers};
export {toDefinition};
export {clearHighlight, clearStatusBar, clearDefinitionStack};
export {clearModuleHighlights, highlightImport};
export {createStatusBarView, updateStatusBar};

var definitionStack = [], definitionState=0;
function toDefinition() {
  var editor = getActiveEditor();

  if (editor) {
    let cursor = editor.getCursorBufferPosition();
    let def = getDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);

    if (definitionState === 0)
      definitionStack = [{path: editor.getPath(), pos: cursor}];

    if (def.import && definitionState === 0)
      return jumpToLocationFrom(def.import.location, editor.getPath(), editor, {state: 1});
    if (def.definition && definitionState < 2)
      return jumpToLocationFrom(def.definition.loc, def.definition.path, editor, {state:2});

    //jump to start of stack, discard the rest. (cycle rather than backtrack)
    jumpToPositionFrom(definitionStack[0].pos, definitionStack[0].path, editor, {state:0});
    clearDefinitionStack();
  }
}

function clearDefinitionStack() {
  definitionState = 0;
}

function selectAllIdentifiers() {
  var editor = getActiveEditor();

  if (editor) {
    let cursor = editor.getCursorBufferPosition();
    let {id: id, references: references, scope: scope} =
      getReferencesAtPosition(editor.getText(), editor.getPath(), cursor);

    if (references && id) {
      for (let reference of references) {
        let range = createRangeFromLocation(reference.loc);
        editor.addSelectionForBufferRange(range);
      }

      updateStatusBar(references.length + " matches");
      highlightScope(scope, editor);
      highlightImport(editor, { symbol: id });
    } else
      updateStatusBar("ESNav: couldn't find symbol.") ;
  }
}

function toNextIdentifier(skip=1) {
  var editor = getActiveEditor();

  if (editor) {
    let cursor = editor.getCursorBufferPosition();
    let {id: id, references: references, scope: scope, relativePosition: relativePosition} =
      getReferencesAtPosition(editor.getText(), editor.getPath(), cursor, {relativePosition: true});

    if (id && references) {
      let next = getNextReference(id, references, skip);

      let nextPosition = [next.loc.start.line - 1, next.loc.start.column + relativePosition];
      editor.setCursorBufferPosition(nextPosition);

      highlightImport(editor, { symbol: id, position: editor.getCursorBufferPosition() });

      // #update status bar details and highlight scope TODO
      ourStatusBar.updateText((references.indexOf(id)+1) + "/" + references.length + " matches");
      highlightScope(scope, editor);
    } else
      updateStatusBar("ESNav: couldn't find symbol.") ;
  }
}

//create status bar view
var ourStatusBar = null;
function createStatusBarView() {
  var statusBar = atom.workspaceView.statusBar;

  if (statusBar && !ourStatusBar) {
    ourStatusBar = new StatusBarView();
    ourStatusBar.initialize(statusBar);
    ourStatusBar.attach();
  }
}

//highlight import symbol at either given position or importing given symbol in scope
// position:  the position to look for an import statement
// symbol: look for an import of the given symbol
function highlightImport(editor, params) {
  var scopes = parseBuffer(editor.getText(), editor.getPath());
  if (!scopes) return;

  let scope = scopes[0];
  for (let symbol of scope.importedSymbols) {
    let match = false;
    if (params.symbol && symbol.localName == params.symbol.name) match = true;
    if (params.position && positionIsInsideLocation(params.position, symbol.importLocation)) match = true;

    if (match) {
      highlightModuleSymbol(editor, symbol);
      return;
    }
  }
}

//highlight our export/import statements depending on
// whether resolution was successful or not.
var moduleHighlights = new Map();
function highlightModuleSymbol(editor, symbol) {
  var path = editor.getPath();
  if (!moduleHighlights.has(path))
    moduleHighlights.set(path, []);
  clearModuleHighlights(path);

  if (symbol.moduleLocation) {
    let range = createRangeFromLocation(symbol.moduleLocation);
    let marker = editor.markBufferRange(range);
    let highlight = editor.decorateMarker(marker, {type: 'highlight', class: getClass(symbol.moduleRequest)});

    //Callback for if module gets resolved.
    symbol.moduleRequestCallback.then((resolved) => {
      highlight.properties.class = getClass(resolved);
    });

    moduleHighlights.get(path).push(highlight);
  }

  //internal highlightModuleeSymbol
  function getClass(moduleRequest) {
    let cssClass = "module-resolved";
    if (moduleRequest == "notFound") cssClass = "module-not-found";
    if (moduleRequest == "parseError") cssClass = "module-parse-error";
    return cssClass;
  }
}

function clearModuleHighlights(path) {
  if (moduleHighlights.has(path)) {
    for (let highlight of moduleHighlights.get(path))
      highlight.getMarker().destroy();

    moduleHighlights[path] = [];
  }
}

//highlight a scope in a given editor
var scopeHighlight = null;
function highlightScope(scope, editor) {
  //check if scope highlighting is activated, and clear current highlights
  clearHighlight();
  if (!atom.config.get("es-navigation.showScopeHighlights")) return;

  let location = scope.block.loc;
  let range = createRangeFromLocation(location);
  range[0][1] = 0; //highlight whole block
  range[1][1] = 0;
  range[1][0]++;

  let marker = editor.markBufferRange(range);
  let highlight = editor.decorateMarker(marker, {type: 'highlight', class: 'soft-gray-highlight'});
  scopeHighlight = highlight;
}

//clear highlights
function clearHighlight() {
  if (scopeHighlight) {
    scopeHighlight.getMarker().destroy();
    scopeHighlight = null;
  }
}

function updateStatusBar(text) {
  if (ourStatusBar)
    ourStatusBar.updateText(text);
}

//clear status bar
function clearStatusBar() {
  updateStatusBar('');
}

//Jumps to Esprima locations in a given buffer.
function jumpToLocationFrom(location, path, editor, params) {
  var range = createRangeFromLocation(location);
  var position = [location.start.line - 1, location.start.column];

  jumpToPositionFrom(position, path, editor, params, range);
}

//Jump to atom position in given path from editor, with option range to select.
function jumpToPositionFrom(position, path, editor, params, range=null) {
  var previousCursor = editor.getCursorBufferPosition();
  var previousPath = editor.getPath();

  if (path == editor.getPath()) {
    applyJump(editor);

    //Since we haven't jumped files, highlight import statement.
    highlightImport(editor, { position: editor.getCursorBufferPosition() });
  } else {
    atom.workspace.open(path, {
      activatePane: true,
      searchAllPanes:true
    }).then(applyJump);
  }

  //INTERNAL jumpToPositionFrom
  function applyJump(editor) {
    editor.setCursorBufferPosition(position);

    if (range)
      editor.setSelectedBufferRange(range);

    if (params.state)
      definitionState = params.state;
  }
}
