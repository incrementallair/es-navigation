(function() {
  var parseScopesCache;

  parseScopesCache = new Map();

  module.exports = {
    util: require('./util'),
    parseScopesFromBuffer: function(buffer, path) {
      var error, es6Support, escope, esprima, parsedScopes, scopes, syntaxTree;
      if (path == null) {
        path = null;
      }
      if (path && parseScopesCache.has(path)) {
        return parseScopesCache.get(path);
      }
      try {
        esprima = require('esprima-fb');
        escope = require('escope');
        syntaxTree = esprima.parse(buffer, {
          loc: true
        });
        es6Support = atom.config.get("atom-symbol-navigation.es6Support");
        if (es6Support) {
          scopes = escope.analyze(syntaxTree, {
            ecmaVersion: 6
          }).scopes;
        } else {
          scopes = escope.analyze(syntaxTree, {
            ecmaVersion: 5
          }).scopes;
        }
      } catch (_error) {
        error = _error;
        console.error("atom-symbol-navigation: problem parsing  " + path + " : " + error);
        throw error;
      }
      parsedScopes = scopes.map((function(_this) {
        return function(scope) {
          return {
            scope: scope,
            identifiers: _this.parseIdentifiersFromScope(scope)
          };
        };
      })(this));
      if (path != null) {
        parseScopesCache.set(path, parsedScopes);
      }
      return parsedScopes;
    },
    parseIdentifiersFromScope: function(scope) {
      var estraverse, identifier, identifiers, ref, reference, variable, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
      estraverse = require('estraverse');
      identifiers = [];
      _ref = scope.through;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ref = _ref[_i];
        identifiers.push(ref.identifier);
      }
      _ref1 = scope.variables;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        variable = _ref1[_j];
        _ref2 = variable.references;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          reference = _ref2[_k];
          identifiers.push(reference.identifier);
        }
        _ref3 = variable.identifiers;
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          identifier = _ref3[_l];
          identifiers.push(identifier);
        }
      }
      estraverse.traverse(scope.block, {
        enter: (function(_this) {
          return function(node, parent) {
            if (node.type === 'MemberExpression') {
              identifier = Object.create(node.property);
              identifier.property = _this.util.getMemberExpressionString(node.property);
              identifier.object = _this.util.getMemberExpressionString(node.object);
              identifier.name = identifier.object + "." + identifier.property;
              return identifiers.push(identifier);
            }
          };
        })(this)
      });
      identifiers = identifiers.filter(function(item, index) {
        return identifiers.indexOf(item) === index;
      });
      identifiers = identifiers.sort(this.util.compareIdentifierLocations);
      return identifiers;
    },
    invalidateScopesCache: function(path) {
      if (path == null) {
        path = null;
      }
      if (path) {
        return parseScopesCache["delete"](path);
      } else {
        return parseScopesCache = new Map();
      }
    },
    getScopesCacheSize: function() {
      return parseScopesCache.size;
    }
  };

}).call(this);
