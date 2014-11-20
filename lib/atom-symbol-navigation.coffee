module.exports =
  activate: (state) ->
    atom.workspaceView.command "atom-symbol-navigation:jump-to-next-id", =>
      @jumpToUsageOfIdentifier skip: 1

    atom.workspaceView.command "atom-symbol-navigation:jump-to-prev-id", =>
      @jumpToUsageOfIdentifier skip: -1

  #jumps to the position of the next identifier matching the one
  #at the current cursor. What next means depends on parameters:
  # skip: skip this many identifiers after the current
  jumpToUsageOfIdentifier: (params) ->
    loc = @getNextUsageOfIdentifier params
    if loc
      @getActiveEditor().setCursorBufferPosition [loc.start.line-1, loc.start.column]

  #returns the actual position of the next parameter as defined above
  getNextUsageOfIdentifier: (params) ->
    esprima = require('esprima-fb')
    escope = require('escope')

    editor = @getActiveEditor()
    if editor
      syntaxTree = esprima.parse(editor.getText(), loc: true)
      scopes = escope.analyze(syntaxTree).scopes
      cursorPos = editor.getCursorBufferPosition()

      #run through scopes, grab identifier list in each
      for scope in scopes
        identifiers = @getIdentifiersInScope scope
        cursorIds = identifiers.filter (node) =>
          @positionIsInsideLocation(cursorPos, node.loc)

        #found an identifier at the cursor, so return pos of next
        if cursorIds.length != 0
          usages = identifiers.filter (node) ->
            node.name == cursorIds[0].name

          index = usages.indexOf cursorIds[0]
          return usages[(usages.length + index + params.skip) %
                                        usages.length].loc
    return null

  #get list of identifiers in the given scope
  getIdentifiersInScope: (scope) ->
    estraverse = require('estraverse')
    identifiers = []

    #we want to include variables that aren't resolved in this scope
    #this would be the case, for instance, if we are referencing a
    #global from within a function.
    for ref in scope.through
      identifiers.push ref.identifier

    #we include both references and definitions of the identifiers
    #TODO: really need to cache this call, pretty inefficient.
    for ref in scope.references
      identifiers.push ref.identifier

      if ref.resolved
        for varRef in ref.resolved.references
          identifiers.push varRef.identifier

    #get rid of duplicates, and sort by position
    identifiers = identifiers.filter (item, index) ->
      identifiers.indexOf(item) == index
    identifiers = identifiers.sort @compareIdentifierLocations

    return identifiers

  #is the given position inside the given location?
  positionIsInsideLocation: (pos, loc) ->
    if (pos.row < loc.start.line-1) then return false
    if (pos.row > loc.end.line-1) then return false
    if (pos.column < loc.start.column) then return false
    if (pos.column > loc.end.column) then return false
    return true

  #comparator function for two identifiers by location
  #compares only start positions of the locations
  compareIdentifierLocations: (a, b) ->
    if a.loc.start.line < b.loc.start.line then return -1
    if a.loc.start.line > b.loc.start.line then return 1
    if a.loc.start.column < b.loc.start.column then return -1
    if a.loc.start.column > b.loc.start.column then return 1
    return 0

  #get active text editor, or return null
  getActiveEditor: ->
    atom.workspace.getActiveTextEditor()
