module.exports =
  util: require('./util')

  activate: (state) ->
    atom.workspaceView.command "atom-symbol-navigation:jump-to-next-id", =>
      @jumpToUsageOfIdentifier skip: 1

    atom.workspaceView.command "atom-symbol-navigation:jump-to-prev-id", =>
      @jumpToUsageOfIdentifier skip: -1

  #jumps to the position of the next identifier matching the one
  #at the current cursor. What next means depends on parameters:
  # skip: skip this many identifiers after the current
  #TODO: cache the results of scope lookups until buffer is changed.
  jumpToUsageOfIdentifier: (params) ->
    loc = @getNextUsageOfIdentifier params
    if loc
      nextUsage = [loc.start.line - 1, loc.start.column]
      @util.getActiveEditor().setCursorBufferPosition nextUsage

  #returns the actual position of the next parameter as defined above
  getNextUsageOfIdentifier: (params) ->
    esprima = require('esprima-fb')
    escope = require('escope')

    editor = @util.getActiveEditor()
    if editor
      syntaxTree = esprima.parse(editor.getText(), loc: true)
      scopes = escope.analyze(syntaxTree).scopes
      cursorPos = editor.getCursorBufferPosition()

      #run through scopes, get identifiers in each
      #if we find one at the cursor position, look
      #for the next identifier
      for scope in scopes
        identifiers = @getIdentifiersInScope scope
        cursorIds = identifiers.filter (node) =>
          @util.positionIsInsideLocation(cursorPos, node.loc)

        #found an identifier at the cursor
        if cursorIds.length != 0
          usages = identifiers.filter (node) ->
            #should possibly assert length is 1 here
            #if we find multiple ids at cursor this is an issue
            node.name == cursorIds[0].name

          #get next node from current
          index = usages.indexOf cursorIds[0]
          return usages[(usages.length + index + params.skip) %
                                        usages.length].loc
    #no identifier found at cursor
    return null

  #get list of identifiers in the given scope
  #returns the list sorted by position in buffer
  getIdentifiersInScope: (scope) ->
    estraverse = require('estraverse')
    identifiers = []

    #we want to include variables that aren't resolved in this scope
    #this would be the case, for instance, if we are referencing a
    #global from within a function.
    for ref in scope.through
      identifiers.push ref.identifier

    #for variables that are resolved in this scope, include
    #all references to them, including those in inner scopes
    for ref in scope.references
      if ref.resolved
        for varRef in ref.resolved.references
          identifiers.push varRef.identifier

    #get rid of duplicates, and sort by position
    identifiers = identifiers.filter (item, index) ->
      identifiers.indexOf(item) == index
    identifiers = identifiers.sort @util.compareIdentifierLocations

    return identifiers
