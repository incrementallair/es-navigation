module.exports =

  #get full string of given esprima membership expression
  #eg "object.member.submember"
  getMemberExpressionString: (node) ->
    if node.type == "Identifier" then return node.name
    if node.type == "MemberExpression"
      left = @getMemberExpressionString(node.object)
      right = @getMemberExpressionString(node.property)
      return "#{left}.#{right}"
    return null

  #util for working with esprima locs
  #is the given position inside the given location?
  positionIsInsideLocation: (pos, loc) ->
    if (pos.row < loc.start.line-1) then return false
    if (pos.row > loc.end.line-1) then return false
    if (pos.column < loc.start.column) then return false
    if (pos.column > loc.end.column) then return false
    return true

  #util for working with esprima locs
  #comparator function for two identifiers by location
  #compares only start positions of the locations
  compareIdentifierLocations: (a, b) ->
    if a.loc.start.line < b.loc.start.line then return -1
    if a.loc.start.line > b.loc.start.line then return 1
    if a.loc.start.column < b.loc.start.column then return -1
    if a.loc.start.column > b.loc.start.column then return 1
    return 0

  #util for working with esprima locs
  #create atom range from location
  createRangeFromLocation: (loc) ->
    [
      [loc.start.line - 1, loc.start.column],
      [loc.end.line - 1, loc.end.column]
    ]

  #Parses global Escope object from buffer
  getGlobalScope: (buffer) ->
    esprima = require('esprima-fb')
    escope = require('escope')

    #parse AST and scope list
    syntaxTree = esprima.parse(buffer, loc: true)
    scopeList = escope.analyze(syntaxTree).scopes

    return scopeList[0]

  #get active text editor, or return null
  getActiveEditor: ->
    atom.workspace.getActiveTextEditor()
