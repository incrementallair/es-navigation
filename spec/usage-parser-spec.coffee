#Tests for the usage parser functions in usage-parser.coffee
fs = require('fs')
parser = require('../lib/usage-parser')

buffer = "var i;
for (i = 0; i < 3; i++) {
  function inc() {
    var tmp = 4;

    function test() {
      tmp = 3;
      i = 5;
    }
  }
}"

describe "parser :: parseIdentifiersFromScope", ->
  parsedScopes = parser.parseScopesFromBuffer buffer

  it "correctly parses identifiers from scope", ->
    #result depends on es6 support
    es6Support = atom.config.get "atom-symbol-navigation.es6Support"

    lengths = if es6Support then [5, 2, 4, 2] else [6, 4, 2]
    for index in [0 ... lengths.length]
      parsedIds = parser.parseIdentifiersFromScope parsedScopes[index].scope
      expect(parsedIds.length).toEqual lengths[index]

describe "parser :: parseScopesFromBuffer", ->
  parsedScopes = parser.parseScopesFromBuffer buffer

  it "correctly parses number of scopes", ->
    #result depends on es6 support:
    #number of scopes depends on whether block scopes are counted
    es6Support = atom.config.get "atom-symbol-navigation.es6Support"
    expect(parsedScopes.length).toEqual(if es6Support then 4 else 3)

  it "correctly parses scope identifiers", ->
    for index in [0 ... 3]
      parsedIds = parser.parseIdentifiersFromScope parsedScopes[index].scope
      expect(parsedScopes[index].identifiers).toEqual parsedIds

describe "parser :: invalidateScopesCache", ->
  it "correctly caches new parse", ->
    parsedScopes = parser.parseScopesFromBuffer buffer, "cacheKey"
    expect(parser.getScopesCacheSize()).toEqual 1

  it "correctly invalidates new parse cache", ->
    parser.invalidateScopesCache "cacheKey"
    expect(parser.getScopesCacheSize()).toEqual 0
