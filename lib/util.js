'use strict';

import {highlightImport} from './view';

export {getMemberExpressionString};
export {positionIsInsideLocation};
export {containedWithin};
export {compareIdentifierLocations};
export {createRangeFromLocation};
export {getActiveEditor};
export {jumpToPositionFrom, jumpToLocationFrom};

function getMemberExpressionString(node) {
  if (node.type === "Identifier")
    return node.name;

  if (node.type === "MemberExpression") {
    let left = getMemberExpressionString(node.object);
    let right = getMemberExpressionString(node.property);
    return left + "." + right;
  }

  return null;
}

function positionIsInsideLocation(pos, loc) {
  if (pos.row < loc.start.line - 1) return false;
  if (pos.row > loc.end.line - 1) return false;
  if (pos.row == loc.start.line-1)
    if (pos.column < loc.start.column) return false;
  if (pos.row == loc.end.line-1)
    if (pos.column > loc.end.column) return false;

  return true;
}

function containedWithin(a, b) {
  if (a.start.line < b.start.line) return false;
  if (a.end.line > b.end.line) return false;
  if (a.start.line === b.start.line)
    if (a.start.column < b.start.column)
      return false;
  if (a.end.line === b.end.line)
    if (a.end.column > b.end.column)
      return false;

  return true;
}

function compareIdentifierLocations(a, b) {
  if (a.loc.start.line < b.loc.start.line) return -1;
  if (a.loc.start.line > b.loc.start.line) return 1;
  if (a.loc.start.column < b.loc.start.column) return -1;
  if (a.loc.start.column > b.loc.start.column) return 1;
  return 0;
}

function createRangeFromLocation(loc) {
  return [
    [loc.start.line - 1, loc.start.column],
    [loc.end.line - 1, loc.end.column]
  ];
}

function getActiveEditor() {
  return atom.workspace.getActiveTextEditor();
}

//Jumps to Esprima locations in a given buffer.
function jumpToLocationFrom(location, path, editor, toggle=null) {
  var range = createRangeFromLocation(location);
  var position = [location.start.line - 1, location.start.column];

  jumpToPositionFrom(position, path, editor, range, toggle);
}

//Jump to atom position in given path from editor, with option range to select.
function jumpToPositionFrom(position, path, editor, range=null, toggle=null) {
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

    if (toggle) {
      toggle.position = previousCursor;
      toggle.path = previousPath;
    }
  }
}
