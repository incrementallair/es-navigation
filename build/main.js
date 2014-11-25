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
    atom.config.set("ecmascript-navigation", {
      showScopeHighlights: true,
      es6Support: true
    });
    atom.workspaceView.subscribe(atom.config.observe('ecmascript-navigation.es6Support', function() {}));
    atom.workspaceView.command("ecmascript-navigation:next-symbol", (function() {
      toNextIdentifier(1);
    }));
    atom.workspaceView.command("ecmascript-navigation:previous-symbol", (function() {
      toNextIdentifier(-1);
    }));
    atom.workspaceView.command("ecmascript-navigation:select-all-id", selectAllIdentifiers);
    atom.workspaceView.command("ecmascript-navigation:jump-to-definition-file", toDefinition);
    atom.workspace.onDidChangeActivePaneItem(clearStatusBar);
    atom.workspace.observeTextEditors((function(editor) {
      editor.onDidChangeCursorPosition((function() {
        clearStatusBar();
        clearHighlight();
      }));
    }));
  }};
