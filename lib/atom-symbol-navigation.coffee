module.exports =
  util: require('./util')

  activate: (state) ->
    atom.workspaceView.command "atom-symbol-navigation:jump-to-next-id", =>
      @jumpToUsageOfIdentifier skip: 1

    atom.workspaceView.command "atom-symbol-navigation:jump-to-prev-id", =>
      @jumpToUsageOfIdentifier skip: -1

    atom.workspaceView.command "atom-symbol-navigation:select-all-id", =>
      @selectAllIdentifier()

  #Multiselects all identifiers in scope matching cursor
  selectAllIdentifier: ->
    editor = @util.getActiveEditor()
    cursorId = @getIdentifierAtCursor()

    if cursorId && editor
      for id in cursorId.usages
        range = @util.createRangeFromLocation id.loc
        editor.addSelectionForBufferRange range

  #jumps to the position of the next identifier matching the one
  #at the current cursor. What next means depends on parameters:
  # skip: skip this many identifiers after the current
  #TODO: cache the results of scope lookups until buffer is changed.
  jumpToUsageOfIdentifier: (params) ->
    next = @getNextUsageOfIdentifier params
    if next
      loc = next.id.loc
      nextUsage = [loc.start.line - 1, loc.start.column + next.pos]
      @util.getActiveEditor().setCursorBufferPosition nextUsage

  #returns all identifiers in scope that match the one at cursor,
  #  the identifier at cursor, and relative position of cursor to id
  #works top down from global scope
  getIdentifierAtCursor: ->
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
            node.name == cursorIds[0].name

          return {
            id: cursorIds[0],
            pos: cursorPos.column - cursorIds[0].loc.start.column,
            usages: usages
          }
    return null

  #returns the actual position of the next parameter as defined above,
  #along with relative position of cursor
  getNextUsageOfIdentifier: (params) ->
    cursorId = @getIdentifierAtCursor()

    #if there are identifiers that match one at cursor, get next
    if cursorId
      index = cursorId.usages.indexOf cursorId.id
      index = (cursorId.usages.length + index + params.skip) %
                    cursorId.usages.length

      return {
        id: cursorId.usages[index],
        pos: cursorId.pos
      }

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
