#Tests for the parser functions in parser.coffee
fs = require('fs')
parser = require('../lib/parser')

describe "parser :: parseIdentifiersFromScope", ->
  buffer = fs.readFileSync 'spec/code-examples/es5-1.js', encoding='utf8'
  parsedScopes = parser.parseScopesFromBuffer buffer

  it "correctly parses identifiers from scope", ->
    #result depends on es6 support
    es6Support = atom.config.get "atom-symbol-navigation.es6Support"

    lengths = if es6Support then [5, 2, 4, 2] else [6, 4, 2]
    for index in [0 ... lengths.length]
      parsedIds = parser.parseIdentifiersFromScope parsedScopes[index].scope
      expect(parsedIds.length).toEqual lengths[index]

describe "parser :: parseScopesFromBuffer", ->
  buffer = fs.readFileSync 'spec/code-examples/es5-1.js', encoding='utf8'
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
    buffer = fs.readFileSync 'spec/code-examples/es5-1.js', encoding='utf8'
    parsedScopes = parser.parseScopesFromBuffer buffer, "cacheKey"
    expect(parser.getScopesCacheSize()).toEqual 1

  it "correctly invalidates new parse cache", ->
    parser.invalidateScopesCache "cacheKey"
    expect(parser.getScopesCacheSize()).toEqual 0
