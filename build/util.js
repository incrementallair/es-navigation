(function() {
  module.exports = {
    getMemberExpressionString: function(node) {
      var left, right;
      if (node.type === "Identifier") {
        return node.name;
      }
      if (node.type === "MemberExpression") {
        left = this.getMemberExpressionString(node.object);
        right = this.getMemberExpressionString(node.property);
        return "" + left + "." + right;
      }
      return null;
    },
    positionIsInsideLocation: function(pos, loc) {
      if (pos.row < loc.start.line - 1) {
        return false;
      }
      if (pos.row > loc.end.line - 1) {
        return false;
      }
      if (pos.column < loc.start.column) {
        return false;
      }
      if (pos.column > loc.end.column) {
        return false;
      }
      return true;
    },
    containedWithin: function(a, b) {
      if (a.start.line < b.start.line) {
        return false;
      }
      if (a.end.line > b.end.line) {
        return false;
      }
      if (a.start.line === b.start.line) {
        if (a.start.column < b.start.column) {
          return false;
        }
      }
      if (a.end.line === b.end.line) {
        if (a.end.column > b.end.column) {
          return false;
        }
      }
      return true;
    },
    compareIdentifierLocations: function(a, b) {
      if (a.loc.start.line < b.loc.start.line) {
        return -1;
      }
      if (a.loc.start.line > b.loc.start.line) {
        return 1;
      }
      if (a.loc.start.column < b.loc.start.column) {
        return -1;
      }
      if (a.loc.start.column > b.loc.start.column) {
        return 1;
      }
      return 0;
    },
    createRangeFromLocation: function(loc) {
      return [[loc.start.line - 1, loc.start.column], [loc.end.line - 1, loc.end.column]];
    },
    getActiveEditor: function() {
      return atom.workspace.getActiveTextEditor();
    }
  };

}).call(this);
