"use strict";
var $__view__,
    $__view__,
    $__view__,
    $__view__,
    $__cache__;
'use strict';
var $__0 = ($__view__ = require("./view"), $__view__ && $__view__.__esModule && $__view__ || {default: $__view__}),
    toNextIdentifier = $__0.toNextIdentifier,
    selectAllIdentifiers = $__0.selectAllIdentifiers;
var $__1 = ($__view__ = require("./view"), $__view__ && $__view__.__esModule && $__view__ || {default: $__view__}),
    toDefinition = $__1.toDefinition,
    toInFileDefinition = $__1.toInFileDefinition;
var $__2 = ($__view__ = require("./view"), $__view__ && $__view__.__esModule && $__view__ || {default: $__view__}),
    createStatusBarView = $__2.createStatusBarView,
    clearStatusBar = $__2.clearStatusBar,
    clearHighlight = $__2.clearHighlight,
    clearToggles = $__2.clearToggles;
var $__3 = ($__view__ = require("./view"), $__view__ && $__view__.__esModule && $__view__ || {default: $__view__}),
    highlightModules = $__3.highlightModules,
    clearModuleHighlights = $__3.clearModuleHighlights;
var clearCache = ($__cache__ = require("./cache"), $__cache__ && $__cache__.__esModule && $__cache__ || {default: $__cache__}).clearCache;
module.exports = {activate: function(state) {
    atom.packages.once('activated', createStatusBarView);
    atom.config.set("ecmascript-navigation", {
      showScopeHighlights: true,
      es6Support: true
    });
    atom.workspaceView.subscribe(atom.config.observe('ecmascript-navigation.es6Support', clearCache));
    atom.workspaceView.command("ecmascript-navigation:next-symbol", (function() {
      toNextIdentifier(1);
    }));
    atom.workspaceView.command("ecmascript-navigation:previous-symbol", (function() {
      toNextIdentifier(-1);
    }));
    atom.workspaceView.command("ecmascript-navigation:select-all-id", selectAllIdentifiers);
    atom.workspaceView.command("ecmascript-navigation:jump-to-definition-file", toDefinition);
    atom.workspaceView.command("ecmascript-navigation:jump-to-definition", toInFileDefinition);
    atom.workspace.onDidChangeActivePaneItem(clearStatusBar);
    atom.workspace.observeTextEditors((function(editor) {
      if (editor.getGrammar().name == "JavaScript")
        highlightModules(editor);
      editor.onDidChangeCursorPosition((function() {
        clearStatusBar();
        clearHighlight();
        clearToggles();
      }));
      editor.onDidChange((function() {
        clearModuleHighlights();
      }));
    }));
  }};
