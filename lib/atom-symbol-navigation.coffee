#notification references - scope highlighting and status bar
symNavStatusBarView = null
symNavScopeHighlight = null

#cache for editor parsing
#file path of editor is mapped to parsed buffer
symNavParserCache = new Map()

module.exports =
  util: require('./util')

  activate: (state) ->
    #attach statusbar view
    atom.packages.once 'activated', @createStatusBarView

    #attach commands
    atom.workspaceView.command "atom-symbol-navigation:jump-to-next-id", =>
      @jumpToUsageOfIdentifier skip: 1

    atom.workspaceView.command "atom-symbol-navigation:jump-to-prev-id", =>
      @jumpToUsageOfIdentifier skip: -1

    atom.workspaceView.command "atom-symbol-navigation:select-all-id", =>
      @selectAllIdentifiers()

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
        @invalidateEditorCache editor

  #invalidate cache for given editor
  invalidateEditorCache: (editor) ->
    symNavParserCache[editor.getPath()] = null

  #get parsed buffer data - from cache, if possible, else
  #we calculate it and cache it.
  parseEditor: (editor) ->
    if symNavParserCache[editor.getPath()]?
      return symNavParserCache[editor.getPath()]

    esprima = require('esprima-fb')
    escope = require('escope')

    try
      syntaxTree = esprima.parse(editor.getText(), loc: true)
      parsedBuffer = {
        syntaxTree: syntaxTree,
        scopes: escope.analyze(syntaxTree).scopes
      }
    catch
      console.error "atom-symbol-navigation: problem parsing  #{editor.getTitle()}"
      return null

    symNavParserCache[editor.getPath()] = parsedBuffer
    return parsedBuffer

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

  #jumps to the position of the next identifier matching the one
  #at the current cursor. What next means depends on parameters:
  # skip: skip this many identifiers after the current
  #TODO: cache the results of scope lookups until buffer is changed.
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

    location = scope.block.loc
    range = @util.createRangeFromLocation location
    marker = editor.markBufferRange range
    decor = editor.decorateMarker marker, type: 'highlight', class: 'soft-red-highlight'
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
      parsedBuffer = @parseEditor editor
      if !parsedBuffer?  then return null

      syntaxTree = parsedBuffer.syntaxTree
      scopes = parsedBuffer.scopes

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
            usages: usages,
            scope: scope
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

  #get list of identifiers in the given scope
  #returns the list sorted by position in buffer
  getIdentifiersInScope: (scope) ->
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
