"use strict";
var $__view__,
    $__view__;
'use strict';
var $__0 = ($__view__ = require("./view"), $__view__ && $__view__.__esModule && $__view__ || {default: $__view__}),
    toNextIdentifier = $__0.toNextIdentifier,
    selectAllIdentifiers = $__0.selectAllIdentifiers,
    toDefinition = $__0.toDefinition;
var $__1 = ($__view__ = require("./view"), $__view__ && $__view__.__esModule && $__view__ || {default: $__view__}),
    createStatusBarView = $__1.createStatusBarView,
    clearStatusBar = $__1.clearStatusBar,
    clearHighlight = $__1.clearHighlight;
module.exports = {activate: function(state) {
    atom.packages.once('activated', createStatusBarView);
    atom.config.set("atom-symbol-navigation", {
      showScopeHighlights: true,
      es6Support: true
    });
    atom.workspaceView.subscribe(atom.config.observe('atom-symbol-navigation.es6Support', function() {}));
    atom.workspaceView.command("atom-symbol-navigation:jump-to-next-id", (function() {
      toNextIdentifier(1);
    }));
    atom.workspaceView.command("atom-symbol-navigation:jump-to-prev-id", (function() {
      toNextIdentifier(-1);
    }));
    atom.workspaceView.command("atom-symbol-navigation:select-all-id", selectAllIdentifiers);
    atom.workspaceView.command("atom-symbol-navigation:jump-to-id-def", toDefinition);
    atom.workspace.onDidChangeActivePaneItem(clearStatusBar);
    atom.workspace.observeTextEditors((function(editor) {
      editor.onDidChangeCursorPosition((function() {
        clearStatusBar();
        clearHighlight();
      }));
    }));
  }};
