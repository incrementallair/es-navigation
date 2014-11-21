#notification references - scope highlighting and status bar
symNavStatusBarView = null
symNavScopeHighlight = null

module.exports =
  util: require './util'
  usageParser: require './usage-parser'
  definitionParser: require './definition-parser'

  activate: (state) ->
    #attach status bar
    atom.packages.once 'activated', @createStatusBarView

    #set default config options
    atom.config.set "atom-symbol-navigation", {
      showScopeHighlights: true,
      es6Support: true
    }

    #when es6 config option changes, invalidate cache
    atom.workspaceView.subscribe atom.config.observe 'atom-symbol-navigation.es6Support', =>
      @usageParser.invalidateScopesCache()

    #attach commands
    atom.workspaceView.command "atom-symbol-navigation:jump-to-next-id", =>
      @jumpToUsageOfIdentifier skip: 1

    atom.workspaceView.command "atom-symbol-navigation:jump-to-prev-id", =>
      @jumpToUsageOfIdentifier skip: -1

    atom.workspaceView.command "atom-symbol-navigation:select-all-id", =>
      @selectAllIdentifiers()

    atom.workspaceView.command "atom-symbol-navigation:jump-to-id-def", =>
      @jumpToIdentifierDefinition()

    #when active panel changes, erase status text
    atom.workspace.onDidChangeActivePaneItem =>
      @clearStatusBar()

    #when text editors are edited, add
    #  status bar erasing when cursor moves
    #  cache invalidation when content changes
    atom.workspace.observeTextEditors (editor) =>
      editor.onDidChangeCursorPosition =>
        @clearStatusBar()
        @clearHighlight()
      editor.onDidChange =>
        @usageParser.invalidateScopesCache editor.getPath()

  #Create status bar view element. Have to wait for packages to load first
  createStatusBarView: ->
    statusBar = atom.workspaceView.statusBar
    if statusBar && !symNavStatusBarView
      StatusBarView = require './status-bar-view'

      symNavStatusBarView = new StatusBarView()
      symNavStatusBarView.initialize statusBar
      symNavStatusBarView.attach()

  #Multiselects all identifiers in scope matching cursor
  selectAllIdentifiers: ->
    editor = @util.getActiveEditor()
    cursorId = @getIdentifierAtCursor()

    if cursorId && editor
      #match exists, select all
      for id in cursorId.usages
        range = @util.createRangeFromLocation id.loc
        editor.addSelectionForBufferRange range

      #update status bar and highlight scope
      @updateStatusBar "#{cursorId.usages.length} matches"
      @highlightScope cursorId.scope, editor

  #jumps to definition of symbol, searching through
  #import/export tree if not found in root file
  jumpToIdentifierDefinition: ->
    search = require './search'
    editor = @util.getActiveEditor()
    cursorId = @getIdentifierAtCursor()

    if editor && cursorId
      symbol = cursorId.id.name
      path = editor.getPath()
      scope = cursorId.scope
      definition = search.findSymbolDefinition symbol, path, scope: scope

      #definition found - if in a different file, open and jump
      if !definition.error
        loc = definition.loc
        bufferPos = [loc.start.line - 1, loc.start.column]
        range = @util.createRangeFromLocation loc

        if definition.path == path
          editor.setCursorBufferPosition bufferPos
          opened.setSelectedBufferRange range
        else
          atom.workspace.open(definition.path,
                                              initialLine: bufferPos[0],
                                              initialColumn: bufferPos[1],
                                              activatePane: true,
                                              searchAllPanes:true)
                                    .then (opened) =>
                                      opened.setCursorBufferPosition bufferPos
                                      opened.setSelectedBufferRange range

    return null

  #jumps to the position of the next identifier matching the one
  #at the current cursor. What next means depends on parameters:
  # skip: skip this many identifiers after the current
  jumpToUsageOfIdentifier: (params) ->
    next = @getNextUsageOfIdentifier params
    editor = @util.getActiveEditor()

    if next && editor
      #move cursor to next identifier
      loc = next.id.loc
      nextUsage = [loc.start.line - 1, loc.start.column + next.pos]
      editor.setCursorBufferPosition nextUsage

      #update status bar details and highlight scope
      @updateStatusBar "#{next.index+1}/#{next.matches} matches"
      @highlightScope next.scope, editor

  #highlight a scope in a given editor
  highlightScope: (scope, editor) ->
    @clearHighlight()

    #check if scope highlighting is activated
    if !(atom.config.get "atom-symbol-navigation.showScopeHighlights")
      return

    location = scope.block.loc
    range = @util.createRangeFromLocation location
    marker = editor.markBufferRange range
    decor = editor.decorateMarker marker, type: 'highlight', class: 'soft-gray-highlight'
    symNavScopeHighlight = decor

  #Update out status bar reference
  updateStatusBar: (text) ->
    if symNavStatusBarView?
      symNavStatusBarView.updateText text

  #clears current (if any) highlights
  clearHighlight: ->
    if symNavScopeHighlight
      symNavScopeHighlight.getMarker().destroy()
      symNavScopeHighlight = null

  #clear status bar
  clearStatusBar: ->
    @updateStatusBar ''

  #returns all identifiers in scope that match the one at cursor,
  #  the identifier at cursor, and relative position of cursor to id
  #works top down from global scope
  getIdentifierAtCursor: ->
    editor = @util.getActiveEditor()

    if editor
      cursorPos = editor.getCursorBufferPosition()
      parsedScopes = @usageParser.parseScopesFromBuffer editor.getText(), editor.getPath()
      if !parsedScopes then return null

      #run through scopes, get identifiers in each
      #if we find one at the cursor position, look
      #for the next identifier
      for parsedScope in parsedScopes
        identifiers = parsedScope.identifiers
        cursorIds = identifiers.filter (node) =>
          @util.positionIsInsideLocation(cursorPos, node.loc)

        #found an identifier at the cursor
        if cursorIds.length != 0
          usages = identifiers.filter (node) ->
            node.name == cursorIds[0].name

          return {
            id: cursorIds[0],
            pos: cursorPos.column - cursorIds[0].loc.start.column,
            usages: usages,
            scope: parsedScope.scope
          }
    return null

  #returns the actual position of the next parameter as defined above,
  #along with relative position of cursor, and index/totalMatches
  getNextUsageOfIdentifier: (params) ->
    cursorId = @getIdentifierAtCursor()

    #if there are identifiers that match one at cursor, get next
    if cursorId
      index = cursorId.usages.indexOf cursorId.id
      index = (cursorId.usages.length + index + params.skip) %
                    cursorId.usages.length

      return {
        id: cursorId.usages[index],
        index: index,
        matches:  cursorId.usages.length,
        pos: cursorId.pos,
        scope: cursorId.scope
      }

    #no identifier found at cursor
    return null
