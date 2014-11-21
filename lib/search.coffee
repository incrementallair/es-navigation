module.exports =

#search for definition of given symbol
# in a given scope and it's dependencies
#returns {path, loc} / {error}
#need an option to pass  in a custom resolver, for now do naive
findSymbolDefinition: (symbol, path, params) ->
  parser = require './definition-parser'
  util = require './util'
  fs = require 'fs'

  #assume root if not given
  isRoot = if !params.isRoot? then true else params.isRoot

  #assume global scope if none given
  if !params.scope?
    try
      buffer = fs.readFileSync path
      scope = util.getGlobalScope buffer
    catch then error: "Unable to parse file: #{path}"
  else
    scope = params.scope

  #parse symbols
  try parsedScope = parser.parseSymbolsFromScope scope
  catch then return error: "Unable to parse scope in: #{path}"

  #if in root, we check definitions and imports
  #else, we need to check exports and map them to definitions
  if isRoot
    #check symbols defined in scope directly
    for sym in parsedScope.definedSymbols
      if sym.name == symbol
        return path: path, loc: sym.loc

    #check imports
    for sym in parsedScope.importedSymbols
      if sym.name == symbol
        return @findSymbolDefinitionInModule symbol, path, sym.loc
  else
    #check exported symbols
    for sym in parsedScope.exportedSymbols
      if sym.name == symbol
        #found a match - if defined in this file, handle it
        if sym.type == "exportDefined"
          for sym in parsedScope.definedSymbols
            if sym.name == symbol
              return path: path, loc: sym.loc
          return error: "Exported undefined symbol: #{symbol} in #{path}"

        #if exporting something imported from another file
        if sym.type == "exportImported"
          return @findSymbolDefinitionInModule symbol, path, sym.loc

  #couldn't find symbol, die
  return error: "Unable to resolve #{symbol} in #{path}."

#If a symbol is traced to another module, find it
findSymbolDefinitionInModule: (symbol, basePath, moduleString) ->
  modulePath = @resolveModulePath basePath, moduleString

  if modulePath?
    return @findSymbolDefinition symbol, modulePath, isRoot: false
  else return error: "Couldn't resolve module: #{moduleString} in #{basePath}"

#Naive module path resolution, given a base file.
#returns path of module file if found, null if not
resolveModulePath: (basePath, moduleString) ->
  fs = require('fs')
  path = require('path')
  baseDir = path.dirname basePath

  #naive check of base directory
  naivePath = path.join baseDir, moduleString
  if !path.extname(naivePath) then naivePath += ".js"
  if fs.existsSync naivePath
    return naivePath

  return null
