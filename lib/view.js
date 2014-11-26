'use strict';

import StatusBarView from './status-bar';
import {getActiveEditor, createRangeFromLocation} from './util';
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
export {createStatusBarView};

function toDefinition() {
  var editor = getActiveEditor();

  if (editor) {
    let cursor = editor.getCursorBufferPosition();
    let definition = getDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);
    let {relativePosition: relativePosition} =
      getReferencesAtPosition(editor.getText(), editor.getPath(), cursor, {relativePosition: true});

    if (definition && relativePosition) {
      let loc = definition.loc;
      let range = createRangeFromLocation(loc);
      let position = [loc.start.line - 1, loc.start.column];

      //if definition in our current file, jump there, else open new file
      if (definition.path == editor.getPath()) {
        editor.setCursorBufferPosition(position);
        editor.setSelectedBufferRange(range);
      } else {
        atom.workspace.open(definition.path, {
          activatePane: true,
          searchAllPanes:true
        }).then((openedEditor) => {
          openedEditor.setCursorBufferPosition(position);
          openedEditor.setSelectedBufferRange(range);
        });
      }
    }
  }
}

function toInFileDefinition() {
  var editor = getActiveEditor();

  if (editor) {
    let cursor = editor.getCursorBufferPosition();
    let definition = getInFileDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);

    if (definition) {
      let range = createRangeFromLocation(definition);
      let position = [definition.start.line - 1, definition.start.column];

      editor.setCursorBufferPosition(position);
      editor.setSelectedBufferRange(range);
    }
  }
}

//Jump to location in path from editor.
function jumpToLocationFrom(location, path, editor) {
  let range = createRangeFromLocation(location);
  let position = [location.start.line - 1, location.start.column];

  if (path == editor.getPath()) {
    editor.setCursorBufferPosition(position);
    editor.setSelectedBufferRange(range);
  } else {
    atom.workspace.open(path, {
      activatePane: true,
      searchAllPanes:true
    }).then((openedEditor) => {
      openedEditor.setCursorBufferPosition(position);
      openedEditor.setSelectedBufferRange(range);
    });
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
