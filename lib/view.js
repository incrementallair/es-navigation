import StatusBarView from './status-bar';

import {
  getActiveEditor,
  createRangeFromLocation,
  positionIsInsideLocation
} from './util';
import {
  getReferencesAtPosition,
  getNextReference,
  getDefinitionAtPosition
} from './navigate';

import tools from 'es-parse-tools';

var definitionStack = null, definitionState = 0;
export function toDefinition() {
  var editor = getActiveEditor();

  if (editor) {
    let cursor = editor.getCursorBufferPosition();
    getDefinitionAtPosition(editor.getPath(), cursor, (err, def) => {
      if (err) return; //de nada found

      if (definitionState === 0)
        definitionStack = {path: editor.getPath(), pos: cursor, range: null};

      //Are we on an import statement statement? If so, just dive back into those files.
      //no definitions or the like found, so check import statements. If one found, just jump to that file.
      if (def.globalScope) {
        for (let symbol of def.globalScope.importedSymbols) {
          if (positionIsInsideLocation(cursor, symbol.importLocation)) {
            if (symbol.location)
              definitionStack.range = createRangeFromLocation(symbol.location);

            if (def.definition) {
              let position = [
                def.definition.loc.start.line - 1,
                def.definition.loc.start.column + def.relativePosition
              ];
              return jumpToLocationFrom(def.definition.loc, def.definition.path, editor, {
                state: 2,
                position: position
              });
            }

            clearModuleHighlights();
            highlightImport(editor, {position: editor.getCursorBufferPosition()});
            if (["unresolved", "notFound", "parseError"].indexOf(symbol.moduleRequest) == -1)
              return jumpToPositionFrom([0,0], symbol.moduleRequest, editor, {state: 1});
          }
        }
      }

      //If not, do we at least have an import statement to jump to?
      if (def.import && definitionState === 0) {
        definitionStack.range = createRangeFromLocation(def.import.location);
        let position = [
          def.import.location.start.line - 1,
          def.import.location.start.column + def.relativePosition
        ];
        return jumpToLocationFrom(def.import.location, editor.getPath(), editor, {
          state: 1,
          position: position
        });
      }

      //If not, a definition?
      if (def.definition && definitionState < 2) {
        let position = [
          def.definition.loc.start.line - 1,
          def.definition.loc.start.column + def.relativePosition
        ];
        return jumpToLocationFrom(def.definition.loc, def.definition.path, editor, {
          state: 2,
          position: position
        });
      }

      //if we have history, just jump back.
      if (definitionState > 0) {
        jumpToPositionFrom(definitionStack.pos, definitionStack.path, editor, {state: 0}, definitionStack.range);
        clearDefinitionStack();

        return;
      }
    });
  }

  updateStatusBar('ESNav: could not find binding');
  clearModuleHighlights();
  highlightImport(editor, {position: editor.getCursorBufferPosition()});
}

export function clearDefinitionStack() {
  definitionState = 0;
}

export function selectAllIdentifiers() {
  var editor = getActiveEditor();

  if (editor) {
    let cursor = editor.getCursorBufferPosition();

    getReferencesAtPosition(editor.getPath(), cursor, {}, (error, result) => {
      if (error) return console.warn("Error in selectAllIdentifiers while getting references: " + error);
      if (!result) return;

      let {id, references, scope} = result;
      if (references && id) {
        for (let reference of references) {
          let range = createRangeFromLocation(reference.loc);
          editor.addSelectionForBufferRange(range);
        }

        updateStatusBar(references.length + " matches");
        clearHighlight();
        highlightImport(editor, {symbol: id});

        //Looks ugly if we highlight the entire file, so don't for global scope.
        if (scope.type != "global") highlightScope(scope, editor);
      } else {
        updateStatusBar("ESNav: couldn't find symbol.") ;
      }
    });
  }
}

export function toNextIdentifier() {
  toIdentifier(1);
}

export function toPrevIdentifier() {
  toIdentifier(-1);
}

function toIdentifier(skip) {
  var editor = getActiveEditor();

  if (editor) {
    let cursor = editor.getCursorBufferPosition();
    // let {id, references, scope, relativePosition} =
    //     getReferencesAtPosition(editor.getText(), editor.getPath(), cursor, {relativePosition: true});

    getReferencesAtPosition(editor.getPath(), cursor, {relativePosition: true}, (error, result) => {
      if (error) return console.warn("Error in toIdentifier while getting references: " + error);

      if (result) {
        let {id, references, scope, relativePosition} = result;

        let next = getNextReference(id, references, skip);
        let position = [next.loc.start.line - 1, next.loc.start.column + relativePosition];
        jumpToLocationFrom(next.loc, editor.getPath(), editor, {position: position});

        // #update status bar details and highlight scope TODO
        ourStatusBar.updateText((references.indexOf(result.id) + 1) + "/" + references.length + " matches");
        if (scope.type != "global")
          highlightScope(scope, editor);
      }
      else {
        updateStatusBar("ESNav: couldn't find symbol.");
      }
    });
  }
}

//create status bar view
var ourStatusBar = null;
export function createStatusBarView() {
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
export function highlightImport(editor, params) {
  tools.parseURI(editor.getPath(), (error, scopes) => {
    if (error) return;

    let scope = scopes[0];
    for (let symbol of scope.importedSymbols.concat(scope.exportedSymbols)) {
      let match = false;
      if (params.symbol && symbol.localName == params.symbol.name) match = true;
      if (symbol.importLocation && params.position
          && positionIsInsideLocation(params.position, symbol.importLocation))
        match = true;

      if (match) {
        highlightModuleSymbol(editor, symbol);
        return;
      }
    }
  });
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
    let highlight = editor.decorateMarker(marker, {
      type: 'highlight',
      class: getClass(symbol.moduleRequest)
    });

    moduleHighlights.get(path).push(highlight);
  }

  //internal highlightModuleeSymbol
  function getClass(moduleRequest) {
    let cssClass = "module-resolved";
    if (moduleRequest == "unresolved")
      cssClass = "module-unresolved";
    if (moduleRequest == "notFound")
      cssClass = "module-not-found";
    if (moduleRequest == "parseError")
      cssClass = "module-parse-error";
    return cssClass;
  }
}

export function clearModuleHighlights(path) {
  if (moduleHighlights.has(path)) {
    for (let highlight of moduleHighlights.get(path))
      highlight.getMarker().destroy();

    moduleHighlights[path] = [];
  }
}

//highlight a scope in a given editor
var scopeHighlight = null, navHighlight = null;
function highlightScope(scope, editor) {
  if (!atom.config.get("es-navigation.showScopeHighlights")) return;

  let location = scope.block.loc;
  let range = createRangeFromLocation(location);
  range[0][1] = 0; //highlight whole block
  range[1][1] = 0;
  range[1][0]++;

  let marker = editor.markBufferRange(range);
  let highlight = editor.decorateMarker(marker, {
    type: 'highlight',
    class: 'soft-gray-highlight'
  });
  scopeHighlight = highlight;
}

//clear highlights
export function clearHighlight() {
  if (scopeHighlight) {
    scopeHighlight.getMarker().destroy();
    scopeHighlight = null;
  }

  if (navHighlight) {
    navHighlight.getMarker().destroy();
    navHighlight = null;
  }
}

export function updateStatusBar(text) {
  if (ourStatusBar)
    ourStatusBar.updateText(text);
}

//clear status bar
export function clearStatusBar() {
  updateStatusBar('');
}

//Jumps to Esprima locations in a given buffer.
function jumpToLocationFrom(location, path, editor, params) {
  var range = createRangeFromLocation(location);
  var position = params.position || [range[0][0], range[0][1]];

  jumpToPositionFrom(position, path, editor, params, range);
}

//Jump to atom position in given path from editor, with option range to select.
function jumpToPositionFrom(position, path, editor, params, range=null) {
  var previousCursor = editor.getCursorBufferPosition();
  var previousPath = editor.getPath();

  if (path == editor.getPath()) {
    applyJump(editor);
  } else {
    let closeOnDeactivate = atom.workspace.getActivePane().itemForUri(path) ? false : true;
    atom.workspace.open(path, {
      activatePane: true,
      searchAllPanes:true
    }).then((editor) => {
      applyJump(editor);
      editor.closeOnDeactivate = closeOnDeactivate;
    });
  }

  //INTERNAL jumpToPositionFrom
  function applyJump(editor) {
    editor.setCursorBufferPosition(position);

    if (range) {
      clearHighlight();
      let marker = editor.markBufferRange(range);
      let highlight = editor.decorateMarker(marker, {
        type: 'highlight',
        class: 'navigation-select'
      });
      navHighlight = highlight;
    }

    if (params.state)
      definitionState = params.state;

    highlightImport(editor, {
      position: editor.getCursorBufferPosition()
    });
  }
}
