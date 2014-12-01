"use strict";
Object.defineProperties(exports, {
  parseBuffer: {get: function() {
      return parseBuffer;
    }},
  clearCache: {get: function() {
      return clearCache;
    }},
  __esModule: {value: true}
});
var $__parse__,
    $__ys_45_hash__;
var _parseBuffer = ($__parse__ = require("./parse"), $__parse__ && $__parse__.__esModule && $__parse__ || {default: $__parse__}).parseBuffer;
var yshash = ($__ys_45_hash__ = require("ys-hash"), $__ys_45_hash__ && $__ys_45_hash__.__esModule && $__ys_45_hash__ || {default: $__ys_45_hash__}).default;
var parseCache = new Map();
function parseBuffer(buffer, path) {
  var hash = hashBuffer(buffer);
  if (parseCache.has(path)) {
    var cache = parseCache.get(path);
    if (cache.hash == hash)
      return cache.data;
  }
  var parsedBuffer = _parseBuffer(buffer, path);
  if (parsedBuffer) {
    parseCache.set(path, {
      data: parsedBuffer,
      hash: hash
    });
    return parsedBuffer;
  }
  return null;
  function hashBuffer(buffer) {
    return yshash.hash(buffer);
  }
}
function clearCache() {
  parseCache.clear();
}
