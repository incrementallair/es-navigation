#Tests for the parser functions in parser.coffee
fs = require('fs')
parser = require('../lib/parser')

describe "parser :: parseIdentifiersFromScope", ->
  buffer = fs.readFileSync 'spec/code-examples/es5-1.js', encoding='utf8'
  parsedScopes = parser.parseScopesFromBuffer buffer

  it "correctly parses identifiers from scope", ->
    lengths = [5, 2, 4, 2]
    for index in [0 ... 4]
      parsedIds = parser.parseIdentifiersFromScope parsedScopes[index].scope
      expect(parsedIds.length).toEqual lengths[index]

describe "parser :: parseScopesFromBuffer", ->
  buffer = fs.readFileSync 'spec/code-examples/es5-1.js', encoding='utf8'
  parsedScopes = parser.parseScopesFromBuffer buffer

  it "correctly parses number of scopes", ->
    #we expect 4 scopes as the ES6 parser will treat for loop
    # as a block scope
    expect(parsedScopes.length).toEqual 4

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
