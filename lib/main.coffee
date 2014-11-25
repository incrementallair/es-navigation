#notification references - scope highlighting and status bar
symNavStatusBarView = null
symNavScopeHighlight = null

module.exports =
  util: require './util'
  parse: require './parse'
  navigate: require './navigate'
  view: require './view'

  activate: (state) ->
    #attach status bar
    atom.packages.once 'activated', @createStatusBarView

    #set default config options
    atom.config.set "atom-symbol-navigation", {
      showScopeHighlights: true,
      es6Support: true
    }

    #when es6 config option changes, invalidate cache
    atom.workspaceView.subscribe atom.config.observe 'atom-symbol-navigation.es6Support', ->
      #TODO: Caching mechanism

    #attach commands
    atom.workspaceView.command "atom-symbol-navigation:jump-to-next-id", =>
      @view.toNextIdentifier(1)

    atom.workspaceView.command "atom-symbol-navigation:jump-to-prev-id", =>
      @view.toNextIdentifier(-1)

    atom.workspaceView.command "atom-symbol-navigation:select-all-id", =>
      @view.selectAllIdentifiers()

    atom.workspaceView.command "atom-symbol-navigation:jump-to-id-def", =>
      @view.toDefinition()

    #when active panel changes, erase status text
    atom.workspace.onDidChangeActivePaneItem =>
      @clearStatusBar()

    #when text editors are edited, add
    #  status bar erasing when cursor moves
    #  cache invalidation when content changes
    atom.workspace.observeTextEditors (editor) =>
      editor.onDidChangeCursorPosition =>
        @clearStatusBar()
        #clearHighlight()
      editor.onDidChange ->
        #TODO caching mechanism

  #Create status bar view element. Have to wait for packages to load first
  createStatusBarView: ->
    statusBar = atom.workspaceView.statusBar
    if statusBar && !symNavStatusBarView
      StatusBarView = require './status-bar'

      symNavStatusBarView = new StatusBarView()
      symNavStatusBarView.initialize statusBar
      symNavStatusBarView.attach()

  #Update out status bar reference
  updateStatusBar: (text) ->
    if symNavStatusBarView?
      symNavStatusBarView.updateText text

  #clear status bar
  clearStatusBar: ->
    @updateStatusBar ''
