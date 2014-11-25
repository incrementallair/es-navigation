'use strict';

import StatusBarView from './status-bar';
import {getActiveEditor, createRangeFromLocation} from './util';
import {getReferencesAtPosition} from './navigate';
import {getNextReference} from './navigate';
import {getDefinitionAtPosition} from './navigate';

export {selectAllIdentifiers};
export {toNextIdentifier};
export {toDefinition};
export {clearHighlight};
export {createStatusBarView};

function toDefinition() {
  var editor = getActiveEditor();

  if (editor) {
    let cursor = editor.getCursorBufferPosition();
    let definition = getDefinitionAtPosition(editor.getText(), editor.getPath(), cursor);

    if (definition) {
      let loc = definition.loc;
      let position = [loc.start.line - 1, loc.start.column];
      let range = createRangeFromLocation(loc);

      //if definition in our current file, jump there, else open new file
      if (definition.path == editor.getPath()) {
        editor.setCursorBufferPosition(position);
        editor.setSelectedBufferRange(range);
      } else {
        atom.workspace.open(definition.path, {
          initialLine: position[0],
          initialColumn: position[1],
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
    let {id: id, references: references, scope: scope} =
      getReferencesAtPosition(editor.getText(), editor.getPath(), cursor);

    if (id && references) {
      let next = getNextReference(id, references, skip);

      let nextPosition = [next.loc.start.line - 1, next.loc.start.column];
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
  if (!atom.config.get("atom-symbol-navigation.showScopeHighlights")) return;

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
