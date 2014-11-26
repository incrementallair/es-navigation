'use strict';

import StatusBarView from './status-bar';
import {getActiveEditor, createRangeFromLocation} from './util';
import {jumpToPositionFrom, jumpToLocationFrom} from './util';
import {getReferencesAtPosition} from './navigate';
import {getNextReference} from './navigate';
import {getDefinitionAtPosition} from './navigate';
import {getInFileDefinitionAtPosition} from './navigate';

export {selectAllIdentifiers};
export {toNextIdentifier};
export {toDefinition};
export {toInFileDefinition};
export {clearHighlight};
export {clearStatusBar};
export {clearToggles};
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

      ourStatusBar.updateText(references.length + " matches");
      highlightScope(scope, editor);
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

      // #update status bar details and highlight scope
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

//highlight a scope in a given editor
var currentHighlight = null;
function highlightScope(scope, editor) {
  //check if scope highlighting is activated, and clear current highlights
  clearHighlight();
  if (!atom.config.get("ecmascript-navigation.showScopeHighlights")) return;

  let location = scope.block.loc;
  let range = createRangeFromLocation(location);
  range[0][1] = 0; //highlight whole block
  range[1][1] = 0;
  range[1][0]++;

  let marker = editor.markBufferRange(range);
  let highlight = editor.decorateMarker(marker, {type: 'highlight', class: 'soft-gray-highlight'});
  currentHighlight = highlight;
}

//clear highlights
function clearHighlight() {
  if (currentHighlight) {
    currentHighlight.getMarker().destroy();
    currentHighlight = null;
  }
}

//clear status bar
function clearStatusBar() {
  ourStatusBar.updateText('');
}

//clear toggles
function clearToggles() {
  toInFileDefinitionToggle.position = null;
  toDefinitionToggle.position = null;
}
