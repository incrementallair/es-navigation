module.exports =
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

  #get active text editor, or return null
  getActiveEditor: ->
    atom.workspace.getActiveTextEditor()
