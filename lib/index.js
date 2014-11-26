//Bootstrap ES6 support.
require('traceur/bin/traceur-runtime');
var main = require('./main');
main.config = {
  showScopeHighlights: { default:  true, type: 'boolean'},
  es6Support: { default: true, type: 'boolean' },
  moduleResolver: { default: './resolve', type: 'string' }
};

module.exports = main;
