server = 'http://www.entwickler-ecke.de/nusski/nuss.php'

class Position
  constructor: (@x, @y) ->

  add: (pos) -> new Position @x + pos.x, @y + pos.y
  isValid: -> 0 <= @x <= 8 and 0 <= @y <= 8

  @parse = (s) -> new Position s.charCodeAt(0) - 'a'.charCodeAt(0), s.charCodeAt(1) - '1'.charCodeAt(0)
  @surrounding = ((new Position x, y for x in [-1,0,1] when x != 0 or y != 0) for y in [-1,0,1])

class Board
  constructor: (@id) ->
    @div = $ '<div class="board" style="display: none"></div>'
    @board = (($ '<div class="field"></div>' for x in [0...9]) for y in [0...9])
    for row in @board
      div = $ '<div class="row"></div>'
      div.append field for field in row
      @div.append div

    @player = 'w'
    @set new Position(0, 8), 'b'
    @set new Position(8, 0), 'b'
    @set new Position(0, 0), 'w'
    @set new Position(8, 8), 'w'
    @parseMoves => @timer = window.setInterval (=> @move()), 400

  get: ({ x: x, y: y }) -> @board[y][x].attr("class").split(' ')[1]
  set: ({ x: x, y: y }, color) -> @board[y][x].attr "class", "field " + color

  parseMoves: (cont) -> $.get "#{server}?mode=getReplay&game=#{@id}", (data) =>
    @moves = data.split ';'
    cont()

  cancel: -> window.clearInterval @timer

  move: ->
    if @moves.length == 0
      @cancel()
      return

    @player = if @player == 'w' then 'b' else 'w'
    move = @moves.shift()
    return if move.length == 0

    [date, from, to] = move.split ','
    from = Position.parse from
    to = Position.parse to

    @set from, 'nil' if Math.abs(from.x - to.x) == 2 || Math.abs(from.y - to.y) == 2
    @set to, @player
    @set to.add dir, @player for dir in Position.surrounding when to.add(dir).isValid()

class Replay
  constructor: (data) ->
    [@id, @playerBlack, @playerWhite, @date] = data.split ','

  show: (parent) ->
    prettyDate = "#{@date[6..7]}.#{@date[4..5]}.#{@date[0..3]} #{@date[8..9]}:#{@date[10..11]}"
    li = $ "<li><a href='##{@id}'>#{prettyDate}: #{@playerBlack} - #{@playerWhite}</a></li>"
    li.click =>
      if not @board?
        @board = new Board @id
        li.append @board.div
        @board.div.slideToggle 'slow'
      else
        @board.div.slideToggle 'slow', =>
          @board.cancel()
          @board.div.detach()
          @board = null
      false

    parent.append li

$ -> $.get "#{server}?mode=listReplays", (data) ->
  (new Replay replayData).show $ "#list" for replayData in data.split(';').reverse()
