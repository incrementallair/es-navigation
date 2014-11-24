module.exports =
  util: require './util'

  #Parse out imported, exported and defined symbols
  # in the given scope
  parseSymbolsFromScope: (scope) ->
    return {
      scope: scope,
      definedSymbols: @parseDefinedSymbols(scope),
      importedSymbols: @parseImportedSymbols(scope),
      exportedSymbols: @parseExportedSymbols(scope)
    }

  #Get imported functions in a scope
  #Currently supports all ES6 import formats listed in spec
  parseImportedSymbols: (scope) ->
    estraverse = require('estraverse')
    importedSymbols = []

    #Parse ES6 import statements. As per spec, returns:
    # importName, localName, moduleRequest
    estraverse.traverse(scope.block, {
      enter: (node, parent) =>
        if node.type == "ImportDeclaration"
          for specifier in node.specifiers
            #parse name from import specification
            parsedSpec = @parseImportSpecifier specifier

            if parsedSpec?
              parsedSpec.moduleRequest = node.source.value
              importedSymbols.push parsedSpec
    })

    return importedSymbols

  #Get defined symbols in a scope
  #Grabs Function, Variable, Parameter definitions in scope.
  parseDefinedSymbols: (scope) ->
    definedSymbols = []
    for variable in scope.variables
      for def in variable.defs
        definedSymbols.push {
          localName: def.name.name,
          location: def.name.loc, #esprima loc
          type: "defined"
        }

    return definedSymbols

  #Get exported functions in a scope
  parseExportedSymbols: (scope) ->
    estraverse = require('estraverse')
    exportedSymbols = []

    #Parse ES6 export statements
    estraverse.traverse(scope.block, {
      enter: (node, parent) =>
        if node.type == "ExportDeclaration"
          #if we have a declaration export, handle it
          if node.declaration
            parsedDecl = @parseExportDeclaration node
            if parsedDecl then exportedSymbols.push parsedDecl
          else
            for specifier in node.specifiers
              parsedSpec = @parseExportSpecifier specifier, node
              if parsedSpec then exportedSymbols.push parsedSpec
    })

    return exportedSymbols

  #Parse export declaration statement, returns:
  # exportName, importName, localName
  #as per ES6 Specs
  parseExportDeclaration: (decl) ->
    ret = {
      exportName: null,
      importName: null,
      moduleRequest: null,
      location: null, #definition esprima loc
      localName: null,
      type: null
    }

    #if declaration is declared at export point
    if decl.declaration?
      if decl.declaration.type == "VariableDeclaration"
        ret.exportName = decl.declaration.declarations[0].id.name
        ret.localName = ret.exportName
      else
        if decl.declaration.id?
          ret.exportName = decl.declaration.id.name
          ret.localName = ret.exportName
        else
          ret.localName = "*default*"
      ret.type = "exportDeclaration"
      ret.location = decl.declaration.loc
    else
      console.log("Error: parseExportDeclaration called on non-declaration")
      return null

    #if declaration is default, set exportName appropriately
    if decl.default
      ret.exportName = "default"

    return ret

  #Parse an export specifier, returns
  # importName, exportName, localName
  #as per ES6 specs
  parseExportSpecifier: (spec, node) ->
    ret = {
      importName: null,
      exportName: null,
      localName: null,
      moduleRequest: null,
      type: "export"
    }

    switch spec.type
      when "ExportSpecifier"
        if node.source?
          ret.importName = spec.id.name
          ret.moduleRequest = node.source.value
        else
          ret.localName = spec.id.name
        ret.exportName = if spec.name? then spec.name.name else spec.id.name
      when "ExportBatchSpecifier"
        if !node.source?
          console.log("Error: parsing export batch specifier without module source")
          return null
        ret.importName = "*"
        ret.moduleRequest = node.source.value
      else console.log "Unknown export specifier type: #{spec.type}"

    return ret

  #Parse a given import specifier, returns:
  # importName, localName
  #as per ES6 specs
  parseImportSpecifier: (spec) ->
    ret = {
      importName: null,
      localName: null,
      location: null, #esprima loc
      type: "import"
    }

    switch spec.type
      when "ImportDefaultSpecifier"
        ret.importName = "default"
        ret.localName = spec.id.name
      when "ImportSpecifier"
        ret.localName = if spec.name? then spec.name.name else spec.id.name
        ret.importName = spec.id.name
      when "ImportNamespaceSpecifier"
        ret.importName = "*"
        ret.localName = spec.id.name
      else console.log "Unknown specifier type: #{spec.type}"
    ret.location = spec.id.loc

    if ret.importName? &&  ret.localName?
      return ret
    return null
