(function() {
  module.exports = {
    util: require('./util'),
    parse: require('./parse'),
    navigate: require('./navigate'),
    view: require('./view'),
    activate: function(state) {
      atom.packages.once('activated', (function(_this) {
        return function() {
          return _this.view.createStatusBarView();
        };
      })(this));
      atom.config.set("atom-symbol-navigation", {
        showScopeHighlights: true,
        es6Support: true
      });
      atom.workspaceView.subscribe(atom.config.observe('atom-symbol-navigation.es6Support', function() {}));
      atom.workspaceView.command("atom-symbol-navigation:jump-to-next-id", (function(_this) {
        return function() {
          return _this.view.toNextIdentifier(1);
        };
      })(this));
      atom.workspaceView.command("atom-symbol-navigation:jump-to-prev-id", (function(_this) {
        return function() {
          return _this.view.toNextIdentifier(-1);
        };
      })(this));
      atom.workspaceView.command("atom-symbol-navigation:select-all-id", (function(_this) {
        return function() {
          return _this.view.selectAllIdentifiers();
        };
      })(this));
      atom.workspaceView.command("atom-symbol-navigation:jump-to-id-def", (function(_this) {
        return function() {
          return _this.view.toDefinition();
        };
      })(this));
      atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {};
      })(this));
      return atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          editor.onDidChangeCursorPosition(function() {});
          return editor.onDidChange(function() {});
        };
      })(this));
    },
    createStatusBarView: function() {
      var StatusBarView, statusBar, symNavStatusBarView;
      statusBar = atom.workspaceView.statusBar;
      if (statusBar && !symNavStatusBarView) {
        StatusBarView = require('./status-bar');
        symNavStatusBarView = new StatusBarView();
        symNavStatusBarView.initialize(statusBar);
        return symNavStatusBarView.attach();
      }
    },
    updateStatusBar: function(text) {
      if (typeof symNavStatusBarView !== "undefined" && symNavStatusBarView !== null) {
        return symNavStatusBarView.updateText(text);
      }
    },
    clearStatusBar: function() {
      return this.updateStatusBar('');
    }
  };

}).call(this);
