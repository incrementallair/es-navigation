module.exports =

#Returns location of a given symbol's definition,
# given a base path and symbol name.
#Params:
# namespace: are we looking for a namespace object?
#         i.e. if looking for ns.foo()   in  import * as np from "mod";
# scope: which scope to search,
# isRoot: are we in the root file
#returns {path, loc} / throws error
#need an option to pass  in a custom resolver, for now do naive
findSymbolDefinition: (symbol, path, params) ->
  parser = require './definition-parser'
  util = require './util'
  fs = require 'fs'

  #assume root if not given
  isRoot = if !params.isRoot? then true else params.isRoot

  #assume global scope if none given
  if params.scope?
    scope = params.scope
  else
    try
      buffer = fs.readFileSync path
      scope = util.getGlobalScope buffer
    catch error
      console.log "Error parsing module #{path} : #{error}"
      throw error

  #parse symbols
  try parsedScope = parser.parseSymbolsFromScope scope
  catch error then throw error

  #if in root, we check definitions and imports
  if isRoot
    #we can't check definitions if looking in a namespace, as definitions
    # might have same name as namespace variables.
    if !params.namespace?
      for sym in parsedScope.definedSymbols
        if sym.localName == symbol
          return path: path, loc: sym.location

    for sym in parsedScope.importedSymbols
      #if searching for a property, check namespace rather than symbol itself
      if params.namespace?
        if sym.localName == params.namespace
          return @findSymbolDefinitionInModule symbol, path, sym.moduleRequest
      else
        if sym.localName == symbol
          return @findSymbolDefinitionInModule sym.importName, path, sym.moduleRequest

  #not in root, so cannot check definitions directly
  #we need to check exports and map them to definitions, imports
  else
    for sym in parsedScope.exportedSymbols
      #batch export - attempt to recurse through
      if sym.importName == "*"
        result = @findSymbolDefinitionInModule symbol, path, sym.moduleRequest
        if !result.error?
          return result

      #one of the export symbols matches what we want
      if sym.exportName == symbol
        #found a match - if declared at export, just return that
        if sym.type == "exportDeclaration"
          return path: path, loc: sym.location

        #if defined in another module, find it there
        if sym.moduleRequest?
          return @findSymbolDefinitionInModule symbol, path, sym.moduleRequest
        else
          for def in parsedScope.definedSymbols
            if def.localName == symbol
              return path: path, loc: def.location
          return error: "Exported undefined symbol: #{symbol} in #{path}"

  #couldn't find symbol, die
  return error: "Unable to resolve #{symbol} in #{path}."

#If a symbol is traced to another module, try to resolve the module and recurse
findSymbolDefinitionInModule: (symbol, basePath, moduleString) ->
  modulePath = @resolveModulePath basePath, moduleString
  if modulePath?
    try
      return @findSymbolDefinition symbol, modulePath, isRoot: false
    catch error
      throw error
  else return error: "Couldn't resolve module: #{moduleString} in #{basePath}"

#Uses an implementation of the node resolver
resolveModulePath: (basePath, moduleString) ->
  resolve = require('resolve')
  path = require('path')

  basedir = path.dirname basePath
  try
    return resolve.sync(moduleString, basedir: basedir, extensions: ['.js', '.es6'])
  catch error then throw error
