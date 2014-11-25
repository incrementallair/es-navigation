(function() {
  var StatusBarView, View,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('atom').View;

  module.exports = StatusBarView = (function(_super) {
    __extends(StatusBarView, _super);

    function StatusBarView() {
      return StatusBarView.__super__.constructor.apply(this, arguments);
    }

    StatusBarView.content = function() {
      return this.div({
        "class": 'inline-block'
      }, (function(_this) {
        return function() {
          return _this.div({
            outlet: "statusText"
          });
        };
      })(this));
    };

    StatusBarView.prototype.updateText = function(text) {
      return this.statusText.html(text);
    };

    StatusBarView.prototype.initialize = function(statusBar) {
      this.statusBar = statusBar;
      return null;
    };

    StatusBarView.prototype.attach = function() {
      return this.statusBar.appendLeft(this);
    };

    StatusBarView.prototype.destroy = function() {
      return this.remove();
    };

    return StatusBarView;

  })(View);

}).call(this);
