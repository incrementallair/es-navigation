"use strict";
var $__view__,
    $__cache__,
    $__atom__;
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
var clearCache = ($__cache__ = require("./cache"), $__cache__ && $__cache__.__esModule && $__cache__ || {default: $__cache__}).clearCache;
var TextEditor = ($__atom__ = require("atom"), $__atom__ && $__atom__.__esModule && $__atom__ || {default: $__atom__}).default;
module.exports = {activate: function(state) {
    atom.packages.once('activated', createStatusBarView);
    atom.workspaceView.subscribe(atom.config.observe('es-navigation.es6Support', clearCache));
    atom.workspaceView.command("es-navigation:next-symbol", toNextIdentifier);
    atom.workspaceView.command("es-navigation:previous-symbol", toPrevIdentifier);
    atom.workspaceView.command("es-navigation:select-all-id", selectAllIdentifiers);
    atom.workspaceView.command("es-navigation:jump-to-definition", toDefinition);
    atom.workspace.onDidChangeActivePaneItem(clearStatusBar);
    var lastItem = null;
    atom.workspace.observePanes((function(pane) {
      pane.onDidChangeActiveItem((function(item) {
        if (lastItem && lastItem.closeOnDeactivate)
          pane.destroyItem(lastItem);
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
