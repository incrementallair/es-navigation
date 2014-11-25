'use strict';

import {getActiveEditor, createRangeFromLocation} from './util';
import {getReferencesAtPosition} from './navigate';
import {getNextReference} from './navigate';
import {getDefinitionAtPosition} from './navigate';

export {selectAllIdentifiers};
export {toNextIdentifier};
export {toDefinition};

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
    let {id: id, references: references} = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor);

    if (references && id) {
      for (let reference of references) {
        let range = createRangeFromLocation(reference.loc);
        editor.addSelectionForBufferRange(range);
      }

      // @updateStatusBar "#{results.references.length} matches"
      highlightScope(id.scope, editor);
    }
  }
}

function toNextIdentifier(params) {
  var editor = getActiveEditor();

  if (editor) {
    let cursor = editor.getCursorBufferPosition();
    let {id: id, references: references} = getReferencesAtPosition(editor.getText(), editor.getPath(), cursor);

    if (id && references) {
      let next = getNextReference(id, references);

      let loc = next.id.loc;
      let nextPosition = [loc.start.line - 1, loc.start.column + next.pos];
      editor.setCursorBufferPosition(nextPosition);

      // #update status bar details and highlight scope
      // @updateStatusBar "#{next.index+1}/#{next.matches} matches"
      highlightScope(next.scope, editor);
    }
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
  let decor = editor.decorateMarker(marker, {type: 'highlight', class: 'soft-gray-highlight'});
  //symNavScopeHighlight = decor
}

//clear highlights
function clearHighlight() {
  if (currentHighlight) {
    currentHighlight.getMarker().destroy();
    currentHighlight = null;
  }
}
