{View} = require('atom')

module.exports =
  class StatusBarView extends View
    @content: ->
      @div class: 'inline-block', =>
        @div outlet: "statusText"

    updateText: (text) ->
      @statusText.html text

    initialize: (@statusBar) ->
      null

    attach: ->
      @statusBar.appendLeft this

    destroy: ->
      @remove()
