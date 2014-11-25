#Tests for util.coffee
util = require('../build/util')

posA = { row: 1, column: 1 }

posB = { row: 1, column: 6 }

locA = {
  start: { line: 2, column: 0 },
  end: { line: 2, column: 4 }
}

locB = {
  start: { line: 2, column: 1 },
  end: { line: 2, column: 3 }
}

idA = { loc: locA }
idB = { loc: locB }

describe "util :: positionIsInsideLocation", ->
  it "correctly describes position inside location", ->
    expect(util.positionIsInsideLocation posA, locA).toEqual true

  it "correctly describes position outside location", ->
    expect(util.positionIsInsideLocation posB, locA).toEqual false

describe "util :: compareIdentifierLocations", ->
  it "correctly compares locations when a > b", ->
    expect(util.compareIdentifierLocations idA, idB).toEqual -1

  it "correctly compares locations when a < b", ->
    expect(util.compareIdentifierLocations idB, idA).toEqual 1

  it "correctly compares locations when a == b", ->
    expect(util.compareIdentifierLocations idA, idA).toEqual 0

describe "util :: createRangeFromLocation", ->
  it "correctly converts location into range", ->
    range = util.createRangeFromLocation locA
    expect(range).toEqual [[1, 0], [1, 4]]

    range = util.createRangeFromLocation locB
    expect(range).toEqual [[1,1], [1,3]]
