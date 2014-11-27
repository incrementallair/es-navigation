'use strict';

import StatusBarView from './status-bar';
import {parseBuffer} from './cache';
import {getActiveEditor, createRangeFromLocation} from './util';
import {jumpToPositionFrom, jumpToLocationFrom} from './util';
import {positionIsInsideLocation} from './util';
import {getReferencesAtPosition} from './navigate';
import {getNextReference} from './navigate';
import {getDefinitionAtPosition} from './navigate';
import {getInFileDefinitionAtPosition} from './navigate';

export {toNextIdentifier, selectAllIdentifiers};
export {toDefinition, toInFileDefinition};
export {clearHighlight, clearStatusBar, clearToggles};
export {clearModuleHighlights, highlightImport};
export {createStatusBarView};

var toDefinitionToggle = {};
function toDefinition() {
  var editor = getActiveEditor();

  if (editor) {
    if (toDefinitionToggle.position && toDefinitionToggle.path) {
      jumpToPositionFrom(toDefinitionToggle.position, toDefinitionToggle.path, editor);
      toDefinitionToggle.position = null;
      return;
    }

    let cursor = editor.getCursorBufferPosition();
    let definition = getDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);

    if (definition) {
      jumpToLocationFrom(definition.loc, definition.path, editor, toDefinitionToggle);
    } else {
      //We couldn't find a definition or resolve/parse the import, so jump there instead
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

    let cursor = editor.getCursorBufferPosition();
    let location = getInFileDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);

    if (location)
      jumpToLocationFrom(location, editor.getPath(), editor, toInFileDefinitionToggle);
  }
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
    }
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
    //ourStatusBar.updateText((next.index+1) + "/" + next.matches + " matches");
      highlightScope(scope, editor);
    }
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
    let cssClass = "module-resolved";
    if (symbol.moduleRequest == "notFound") cssClass = "module-not-found";
    if (symbol.moduleRequest == "parseError") cssClass = "module-parse-error";

    let range = createRangeFromLocation(symbol.moduleLocation);
    let marker = editor.markBufferRange(range);
    let highlight = editor.decorateMarker(marker, {type: 'highlight', class: cssClass});

    moduleHighlights.get(path).push(highlight);
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

//clear toggles
function clearToggles() {
  toInFileDefinitionToggle.position = null;
  toDefinitionToggle.position = null;
}
