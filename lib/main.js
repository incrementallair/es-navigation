import {
  toNextIdentifier,
  toPrevIdentifier,
  selectAllIdentifiers,
  toDefinition,
  createStatusBarView,
  clearStatusBar,
  clearHighlight,
  clearModuleHighlights,
  clearDefinitionStack
} from './view';

module.exports = {
  activate: function(state) {
    atom.packages.once('activated', createStatusBarView);

    //clear caches on es6support config change
    atom.workspaceView.command("es-navigation:next-symbol", toNextIdentifier);

    atom.workspaceView.command("es-navigation:previous-symbol", toPrevIdentifier);

    atom.workspaceView.command("es-navigation:select-all-id", selectAllIdentifiers);

    atom.workspaceView.command("es-navigation:jump-to-definition", toDefinition);

    atom.workspace.onDidChangeActivePaneItem(clearStatusBar);

    //When we move  panes, if nothing was chaned close it.
    var lastItem = null;
    atom.workspace.observePanes((pane) => {
      pane.onDidChangeActiveItem((item) => {
        if (lastItem && lastItem.closeOnDeactivate)
          lastItem.destroy();

        lastItem  = item;
      });
    });

    atom.workspace.observeTextEditors((editor) => {
      editor.onDidChangeCursorPosition(() => {
        clearStatusBar();
        clearHighlight();
        clearDefinitionStack();
        clearModuleHighlights(editor.getPath());

        //Now that editing has happened, don't close on tab change.
        editor.closeOnDeactivate = false;
      });
    });
  }
};
