#Tests for the parser functions in parser.coffee
fs = require('fs')
parser = require('../lib/parser')

describe "parser :: parseScopesFromBuffer", ->
  buffer = fs.readFileSync 'spec/code-examples/es5-1.js', encoding='utf8'
  parsedScopes = parser.parseScopesFromBuffer buffer

  it "correctly parses number of scopes", ->
    expect(parsedScopes.length).toEqual 3

  it "correctly parses scope identifiers", ->
    expect(parsedScopes[0].identifiers.length).toEqual 6
    expect(parsedScopes[1].identifiers.length).toEqual 4
    expect(parsedScopes[2].identifiers.length).toEqual 2

describe "parser :: invalidateScopesCache", ->
  it "correctly caches new parse", ->
    buffer = fs.readFileSync 'spec/code-examples/es5-1.js', encoding='utf8'
    parsedScopes = parser.parseScopesFromBuffer buffer, "cacheKey"
    expect(parser.getScopesCacheSize()).toEqual 1

  it "correctly invalidates new parse cache", ->
    parser.invalidateScopesCache "cacheKey"
    expect(parser.getScopesCacheSize()).toEqual 0
