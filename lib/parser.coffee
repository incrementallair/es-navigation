#Cache for the parseScopesAndIdentifiers function.
parseScopesCache = new Map()

module.exports =
util: require('./util')

#parse buffer, return a list of parsed scopes and
# the identifiers attached to each of them.
#path is the file path of the buffer, as a key to the
# cache.
parseScopesFromBuffer: (buffer, path=null) ->
  #check cache first
  if path && parseScopesCache.has path
    return parseScopesCache.get path

  #parse out AST and scopes
  try
    esprima = require('esprima-fb')
    escope = require('escope')
    syntaxTree = esprima.parse(buffer, loc: true)

    #check whether es6 is supported
    es6Support = atom.config.get "atom-symbol-navigation.es6Support"
    if es6Support
      scopes = escope.analyze(syntaxTree, ecmaVersion: 6).scopes
    else
      scopes = escope.analyze(syntaxTree, ecmaVersion: 5).scopes
  catch
    console.error "atom-symbol-navigation: problem parsing  #{path}"
    return null

  #parse out identifiers in each scope
  parsedScopes = scopes.map (scope) =>
    {
      scope: scope,
      identifiers: @parseIdentifiersFromScope scope
    }

  #if we are given a path, cache results
  if path?
    parseScopesCache.set path, parsedScopes
  return parsedScopes

#parse a list of identifiers local to a given scope
parseIdentifiersFromScope: (scope) ->
  identifiers = []

  #we want to include refs to variables that aren't resolved in this scope
  #this would be the case, for instance, if we are referencing a global
  #from within a function.
  for ref in scope.through
    identifiers.push ref.identifier

  #we also want to include resolved variables along with their
  #references. This include function parameters etc.
  for variable in scope.variables
    for reference in variable.references
      identifiers.push reference.identifier
    for identifier in variable.identifiers
      identifiers.push identifier

  #get rid of duplicates, and sort by position
  identifiers = identifiers.filter (item, index) ->
    identifiers.indexOf(item) == index
  identifiers = identifiers.sort @util.compareIdentifierLocations

  return identifiers

#invalidate scopes cache for a given path
#if path is not given, invalidate entire cache
invalidateScopesCache: (path=null) ->
  if path
    parseScopesCache.delete path
  else
    parseScopesCache = new Map()

#get scopes cache size
getScopesCacheSize: ->
  parseScopesCache.size
