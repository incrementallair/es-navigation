(function() {
  var symNavScopeHighlight, symNavStatusBarView;

  symNavStatusBarView = null;

  symNavScopeHighlight = null;

  module.exports = {
    util: require('./util'),
    parse: require('./parse'),
    navigate: require('./navigate'),
    view: require('./view'),
    activate: function(state) {
      atom.packages.once('activated', this.createStatusBarView);
      atom.config.set("atom-symbol-navigation", {
        showScopeHighlights: true,
        es6Support: true
      });
      atom.workspaceView.subscribe(atom.config.observe('atom-symbol-navigation.es6Support', function() {}));
      atom.workspaceView.command("atom-symbol-navigation:jump-to-next-id", (function(_this) {
        return function() {
          return _this.jumpToUsageOfIdentifier({
            skip: 1
          });
        };
      })(this));
      atom.workspaceView.command("atom-symbol-navigation:jump-to-prev-id", (function(_this) {
        return function() {
          return _this.jumpToUsageOfIdentifier({
            skip: -1
          });
        };
      })(this));
      atom.workspaceView.command("atom-symbol-navigation:select-all-id", (function(_this) {
        return function() {
          return _this.selectAllIdentifiers();
        };
      })(this));
      atom.workspaceView.command("atom-symbol-navigation:jump-to-id-def", (function(_this) {
        return function() {
          return _this.jumpToIdentifierDefinition();
        };
      })(this));
      atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          return _this.clearStatusBar();
        };
      })(this));
      return atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          editor.onDidChangeCursorPosition(function() {
            _this.clearStatusBar();
            return _this.clearHighlight();
          });
          return editor.onDidChange(function() {});
        };
      })(this));
    },
    createStatusBarView: function() {
      var StatusBarView, statusBar;
      statusBar = atom.workspaceView.statusBar;
      if (statusBar && !symNavStatusBarView) {
        StatusBarView = require('./status-bar');
        symNavStatusBarView = new StatusBarView();
        symNavStatusBarView.initialize(statusBar);
        return symNavStatusBarView.attach();
      }
    },
    selectAllIdentifiers: function() {
      var cursor, editor, range, reference, results, _i, _len, _ref;
      editor = this.util.getActiveEditor();
      if (editor != null) {
        cursor = editor.getCursorBufferPosition();
        results = this.navigate.getReferencesAtPosition(editor.getText(), editor.getPath(), cursor);
        if (results != null) {
          _ref = results.references;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            reference = _ref[_i];
            range = this.util.createRangeFromLocation(reference.loc);
            editor.addSelectionForBufferRange(range);
          }
          this.updateStatusBar("" + results.references.length + " matches");
          return this.highlightScope(results.scope, editor);
        }
      }
    },
    jumpToIdentifierDefinition: function() {
      var bufferPos, cursor, definition, editor, loc, ns, path, range, results, search, symbol;
      search = require('./search');
      editor = this.util.getActiveEditor();
      if (editor) {
        path = editor.getPath();
        cursor = editor.getCursorBufferPosition();
        results = this.navigate.getReferencesAtPosition(editor.getText(), path, cursor);
        if (results.id.property != null) {
          symbol = results.id.property;
          ns = results.id.object;
          definition = search.findSymbolDefinition(symbol, path, ns, true, results.scope);
        } else {
          symbol = results.id.name;
          definition = search.findSymbolDefinition(symbol, path, null, true, results.scope);
        }
        if (definition) {
          loc = definition.loc;
          bufferPos = [loc.start.line - 1, loc.start.column];
          range = this.util.createRangeFromLocation(loc);
          if (definition.path === path) {
            editor.setCursorBufferPosition(bufferPos);
            editor.setSelectedBufferRange(range);
          } else {
            atom.workspace.open(definition.path, {
              initialLine: bufferPos[0],
              initialColumn: bufferPos[1],
              activatePane: true,
              searchAllPanes: true
            }).then((function(_this) {
              return function(opened) {
                opened.setCursorBufferPosition(bufferPos);
                return opened.setSelectedBufferRange(range);
              };
            })(this));
          }
        }
      }
      return null;
    },
    jumpToUsageOfIdentifier: function(params) {
      var editor, loc, next, nextUsage;
      next = this.getNextUsageOfIdentifier(params);
      editor = this.util.getActiveEditor();
      if (next && editor) {
        loc = next.id.loc;
        nextUsage = [loc.start.line - 1, loc.start.column + next.pos];
        editor.setCursorBufferPosition(nextUsage);
        this.updateStatusBar("" + (next.index + 1) + "/" + next.matches + " matches");
        return this.highlightScope(next.scope, editor);
      }
    },
    highlightScope: function(scope, editor) {
      var decor, location, marker, range;
      this.clearHighlight();
      if (!(atom.config.get("atom-symbol-navigation.showScopeHighlights"))) {
        return;
      }
      location = scope.block.loc;
      range = this.util.createRangeFromLocation(location);
      marker = editor.markBufferRange(range);
      decor = editor.decorateMarker(marker, {
        type: 'highlight',
        "class": 'soft-gray-highlight'
      });
      return symNavScopeHighlight = decor;
    },
    updateStatusBar: function(text) {
      if (symNavStatusBarView != null) {
        return symNavStatusBarView.updateText(text);
      }
    },
    clearHighlight: function() {
      if (symNavScopeHighlight) {
        symNavScopeHighlight.getMarker().destroy();
        return symNavScopeHighlight = null;
      }
    },
    clearStatusBar: function() {
      return this.updateStatusBar('');
    },
    getIdentifierAtCursor: function() {
      var cursorIds, cursorPos, editor, identifiers, parsedScope, parsedScopes, usages, _i, _len;
      editor = this.util.getActiveEditor();
      if (editor) {
        cursorPos = editor.getCursorBufferPosition();
        parsedScopes = this.parse.parseBuffer(editor.getText(), editor.getPath());
        if (!parsedScopes) {
          return null;
        }
        for (_i = 0, _len = parsedScopes.length; _i < _len; _i++) {
          parsedScope = parsedScopes[_i];
          identifiers = parsedScope.referencedSymbols;
          cursorIds = identifiers.filter((function(_this) {
            return function(node) {
              return _this.util.positionIsInsideLocation(cursorPos, node.loc);
            };
          })(this));
          if (cursorIds.length !== 0) {
            usages = identifiers.filter(function(node) {
              return node.name === cursorIds[0].name;
            });
            return {
              id: cursorIds[0],
              pos: cursorPos.column - cursorIds[0].loc.start.column,
              usages: usages,
              scope: parsedScope
            };
          }
        }
      }
      return null;
    },
    getNextUsageOfIdentifier: function(params) {
      var cursorId, index;
      cursorId = this.getIdentifierAtCursor();
      if (cursorId) {
        index = cursorId.usages.indexOf(cursorId.id);
        index = (cursorId.usages.length + index + params.skip) % cursorId.usages.length;
        return {
          id: cursorId.usages[index],
          index: index,
          matches: cursorId.usages.length,
          pos: cursorId.pos,
          scope: cursorId.scope
        };
      }
      return null;
    }
  };

}).call(this);
