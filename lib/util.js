import {highlightImport} from './view';

export function getMemberExpressionString(node) {
  if (node.type === "Identifier")
    return node.name;

  if (node.type === "MemberExpression") {
    let left = getMemberExpressionString(node.object);
    let right = getMemberExpressionString(node.property);
    return left + "." + right;
  }

  return null;
}

export function positionIsInsideLocation(pos, loc) {
  if (pos.row < loc.start.line - 1 || pos.row > loc.end.line - 1)
    return false;

  if (pos.row == loc.start.line - 1 && pos.column < loc.start.column)
    return false;

  if (pos.row == loc.end.line - 1 && pos.column > loc.end.column)
    return false;

  return true;
}

export function containedWithin(a, b) {
  if (a.start.line < b.start.line || a.end.line > b.end.line)
    return false;

  if (a.start.line === b.start.line && a.start.column < b.start.column)
    return false;

  if (a.end.line === b.end.line && a.end.column > b.end.column)
    return false;

  return true;
}

export function compareIdentifierLocations(a, b) {
  if (a.loc.start.line < b.loc.start.line)
    return -1;
  if (a.loc.start.line > b.loc.start.line)
    return 1;
  if (a.loc.start.column < b.loc.start.column)
    return -1;
  if (a.loc.start.column > b.loc.start.column)
    return 1;
  return 0;
}

export function createRangeFromLocation(loc) {
  return [
    [loc.start.line - 1, loc.start.column],
    [loc.end.line - 1, loc.end.column]
  ];
}

export function getActiveEditor() {
  return atom.workspace.getActiveTextEditor();
}

//Run func on each element of arr. If any resolve, return the resolution.
//Else, resolve to null Func must take arguments func(elem, callback).
export function asyncForEach(arr, cb, func, ind = 0) {
  if (arr.length <= ind) return cb(null, null);

  func(arr[ind], (err, res) => {
    if (res) return cb(null, res);
    asyncForEach(arr, cb, func, ind+1);
  });
}
