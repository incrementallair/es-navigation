'use strict';

import {toNextIdentifier, selectAllIdentifiers} from './view';
import {toDefinition} from './view';
import {createStatusBarView, clearStatusBar, clearHighlight} from './view';
import {clearModuleHighlights, clearDefinitionStack} from './view';
import {clearCache} from './cache';

module.exports = {
  activate: function(state) {
    atom.packages.once('activated', createStatusBarView);

    //clear caches on es6support config change
    atom.workspaceView.subscribe(atom.config.observe('es-navigation.es6Support', clearCache));

    atom.workspaceView.command("es-navigation:next-symbol", () => {
      toNextIdentifier(1);
    });

    atom.workspaceView.command("es-navigation:previous-symbol", () => {
      toNextIdentifier(-1);
    });

    atom.workspaceView.command("es-navigation:select-all-id", selectAllIdentifiers);

    atom.workspaceView.command("es-navigation:jump-to-definition", toDefinition);

    atom.workspace.onDidChangeActivePaneItem(clearStatusBar);

    atom.workspace.observeTextEditors((editor) => {
      editor.onDidChangeCursorPosition(() => {
        clearStatusBar();
        clearHighlight();
        clearDefinitionStack();
        clearModuleHighlights(editor.getPath());
      });
    });
  }
};
