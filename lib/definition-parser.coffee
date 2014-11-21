module.exports =
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
    estraverse.traverse(scope.block, {
      enter: (node, parent) =>
        if node.type == "ImportDeclaration"
          for specifier in node.specifiers
            #parse name from import specification
            parsedSpec = @parseImportSpecifier specifier
            if parsedSpec.originalName?
              originalName = parsedSpec.originalName
            else
              originalName = parsedSpec.name
            if parsedSpec then importedSymbols.push {
              name: parsedSpec.name,
              originalName: originalName,
              loc: node.source.value,
              type: "imported"
            }
    })

    return importedSymbols

  #Get defined symbols in a scope
  #Grabs Function, Variable, Parameter definitions in scope.
  parseDefinedSymbols: (scope) ->
    definedSymbols = []
    for variable in scope.variables
      for def in variable.defs
        definedSymbols.push {
          name: def.name.name,
          loc: def.name.loc,
          type: "defined"
        }

    return definedSymbols

  #Get exported functions in a scope
  parseExportedSymbols: (scope) ->
    estraverse = require('estraverse')

    exportedSymbols = []
    estraverse.traverse(scope.block, {
      enter: (node, parent) =>
        if node.type == "ExportDeclaration"
          #export of direct declarations
          if node.declaration
            switch node.declaration.type
              when "VariableDeclaration"
                for declaration in node.declaration.declarations
                  exportedSymbols.push {
                    name: declaration.id.name,
                    loc: declaration.id.loc,
                    type: "exportDefined"
                  }
              when "FunctionDeclaration"
                exportedSymbols.push {
                  name: node.declaration.id.name,
                  loc: node.declaration.id.loc,
                  type: "exportDefined"
                }
              when "FunctionExpression "
                #a direct function declaration
                #export function () {}
                null
          else
            for specifier in node.specifiers
              parsedSpec = @parseExportSpecifier specifier
              if parsedSpec
                exportedSymbols.push {
                  name: parsedSpec,
                  loc: if node.source then node.source.value else null,
                  type: if node.source then "exportImported" else "exportDefined"
                }
    })

    return exportedSymbols

  #Parse export specifier, return name of exported  object
  #TODO: Similarly to below, we might need to keep some kind
  # of context object or whatnot. Will see later.
  parseExportSpecifier: (spec) ->
    switch spec.type
      when "ExportSpecifier"
        if spec.name then return spec.name.name
        else return spec.id.name
      when "ExportBatchSpecifier"
        null
        #this is again going to be tricky - gets everything from another module.
        #actually, this could just be implemented as a wormhole =P

  #Parse a given import specifier, return name of imported object
  # as {name, [originalName]}
  parseImportSpecifier: (spec) ->
    switch spec.type
      when "ImportDefaultSpecifier" then return name: spec.id.name
      when "ImportSpecifier"
        if spec.name? then return name: spec.name.name, originalName: spec.id.name
        else return name: spec.id.name
      when "ImportNamespaceSpecifier" then return name: (spec.id.name + ".*")
      else return null
