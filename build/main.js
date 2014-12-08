"use strict";
var $__view__;
var $__0 = ($__view__ = require("./view"), $__view__ && $__view__.__esModule && $__view__ || {default: $__view__}),
    toNextIdentifier = $__0.toNextIdentifier,
    toPrevIdentifier = $__0.toPrevIdentifier,
    selectAllIdentifiers = $__0.selectAllIdentifiers,
    toDefinition = $__0.toDefinition,
    createStatusBarView = $__0.createStatusBarView,
    clearStatusBar = $__0.clearStatusBar,
    clearHighlight = $__0.clearHighlight,
    clearModuleHighlights = $__0.clearModuleHighlights,
    clearDefinitionStack = $__0.clearDefinitionStack;
module.exports = {activate: function(state) {
    atom.packages.once('activated', createStatusBarView);
    atom.workspaceView.command("es-navigation:next-symbol", toNextIdentifier);
    atom.workspaceView.command("es-navigation:previous-symbol", toPrevIdentifier);
    atom.workspaceView.command("es-navigation:select-all-id", selectAllIdentifiers);
    atom.workspaceView.command("es-navigation:jump-to-definition", toDefinition);
    atom.workspace.onDidChangeActivePaneItem(clearStatusBar);
    var lastItem = null;
    atom.workspace.observePanes((function(pane) {
      pane.onDidChangeActiveItem((function(item) {
        if (lastItem && lastItem.closeOnDeactivate)
          lastItem.destroy();
        lastItem = item;
      }));
    }));
    atom.workspace.observeTextEditors((function(editor) {
      editor.onDidChangeCursorPosition((function() {
        clearStatusBar();
        clearHighlight();
        clearDefinitionStack();
        clearModuleHighlights(editor.getPath());
        editor.closeOnDeactivate = false;
      }));
    }));
  }};
