'use strict';

import {toNextIdentifier, selectAllIdentifiers, toDefinition} from './view';
import {createStatusBarView, clearStatusBar, clearHighlight} from './view';

module.exports = {
  activate: function(state) {
    atom.packages.once('activated', createStatusBarView);

    atom.config.set("atom-symbol-navigation", {
      showScopeHighlights: true,
      es6Support: true
    });

    //clear caches on es6support config change
    atom.workspaceView.subscribe(atom.config.observe('atom-symbol-navigation.es6Support', function() {}));

    atom.workspaceView.command("atom-symbol-navigation:jump-to-next-id", () => {
      toNextIdentifier(1);
    });

    atom.workspaceView.command("atom-symbol-navigation:jump-to-prev-id", () => {
      toNextIdentifier(-1);
    });

    atom.workspaceView.command("atom-symbol-navigation:select-all-id", selectAllIdentifiers);

    atom.workspaceView.command("atom-symbol-navigation:jump-to-id-def", toDefinition);

    atom.workspace.onDidChangeActivePaneItem(clearStatusBar);

    atom.workspace.observeTextEditors((editor) => {
        editor.onDidChangeCursorPosition(() => {
          clearStatusBar();
          clearHighlight();
        });

        //editor.onDidChange(function() {}); //Caching?
    });
  }
};
