(function() {
  var Board, Position, Replay, server;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  server = 'http://www.entwickler-ecke.de/nusski/nuss.php';
  Position = (function() {
    var x, y;
    function Position(x, y) {
      this.x = x;
      this.y = y;
    }
    Position.prototype.add = function(pos) {
      return new Position(this.x + pos.x, this.y + pos.y);
    };
    Position.prototype.isValid = function() {
      var _ref, _ref2;
      return (0 <= (_ref = this.x) && _ref <= 8) && (0 <= (_ref2 = this.y) && _ref2 <= 8);
    };
    Position.parse = function(s) {
      return new Position(s.charCodeAt(0) - 'a'.charCodeAt(0), s.charCodeAt(1) - '1'.charCodeAt(0));
    };
    Position.surrounding = (function() {
      var _i, _len, _ref, _ref2, _results;
      _ref = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], x = _ref2[0], y = _ref2[1];
        _results.push(new Position(x, y));
      }
      return _results;
    })();
    return Position;
  })();
  Board = (function() {
    function Board(id) {
      var div, field, row, x, y, _i, _j, _len, _len2, _ref;
      this.id = id;
      this.div = $('<div class="board" style="display: none"></div>');
      this.board = (function() {
        var _results;
        _results = [];
        for (y = 0; y < 9; y++) {
          _results.push((function() {
            var _results;
            _results = [];
            for (x = 0; x < 9; x++) {
              _results.push($('<div class="field"></div>'));
            }
            return _results;
          })());
        }
        return _results;
      })();
      _ref = this.board;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        div = $('<div class="row"></div>');
        for (_j = 0, _len2 = row.length; _j < _len2; _j++) {
          field = row[_j];
          div.append(field);
        }
        this.div.append(div);
      }
      this.player = 'w';
      this.set(new Position(0, 8), 'b');
      this.set(new Position(8, 0), 'b');
      this.set(new Position(0, 0), 'w');
      this.set(new Position(8, 8), 'w');
      this.parseMoves(__bind(function() {
        return this.timer = window.setInterval((__bind(function() {
          return this.move();
        }, this)), 400);
      }, this));
    }
    Board.prototype.get = function(_arg) {
      var x, y;
      x = _arg.x, y = _arg.y;
      return this.board[y][x].attr("class").split(' ')[1];
    };
    Board.prototype.set = function(_arg, color) {
      var x, y;
      x = _arg.x, y = _arg.y;
      return this.board[y][x].attr("class", "field " + color);
    };
    Board.prototype.parseMoves = function(cont) {
      return $.get("" + server + "?mode=getReplay&game=" + this.id, __bind(function(data) {
        var blocked, moves, pos, _i, _len, _ref, _ref2;
        _ref = data.split(';'), blocked = _ref[0], moves = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
        this.moves = moves;
        _ref2 = blocked.split(',');
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          pos = _ref2[_i];
          this.set(Position.parse(pos), 'blocked');
        }
        return cont();
      }, this));
    };
    Board.prototype.cancel = function() {
      return window.clearInterval(this.timer);
    };
    Board.prototype.getOpposing = function() {
      if (this.player === 'w') {
        return 'b';
      } else {
        return 'w';
      }
    };
    Board.prototype.move = function() {
      var date, dir, from, move, to, _i, _len, _ref, _ref2, _results;
      if (this.moves.length === 0) {
        this.cancel();
        return;
      }
      this.player = this.getOpposing();
      move = this.moves.shift();
      if (move.length === 0) {
        return;
      }
      _ref = move.split(','), date = _ref[0], from = _ref[1], to = _ref[2];
      from = Position.parse(from);
      to = Position.parse(to);
      if (Math.abs(from.x - to.x) === 2 || Math.abs(from.y - to.y) === 2) {
        this.set(from, 'nil');
      }
      this.set(to, this.player);
      _ref2 = Position.surrounding;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        dir = _ref2[_i];
        if (to.add(dir).isValid() && this.get(to.add(dir)) === this.getOpposing()) {
          _results.push(this.set(to.add(dir), this.player));
        }
      }
      return _results;
    };
    return Board;
  })();
  Replay = (function() {
    function Replay(data) {
      var _ref;
      _ref = data.split(','), this.id = _ref[0], this.playerBlack = _ref[1], this.playerWhite = _ref[2], this.date = _ref[3];
    }
    Replay.prototype.show = function(parent) {
      var li, prettyDate;
      prettyDate = "" + this.date.slice(6, 8) + "." + this.date.slice(4, 6) + "." + this.date.slice(0, 4) + " " + this.date.slice(8, 10) + ":" + this.date.slice(10, 12);
      li = $("<li><a href='#" + this.id + "'>" + prettyDate + ": " + this.playerBlack + " - " + this.playerWhite + "</a></li>");
      li.click(__bind(function() {
        if (!(this.board != null)) {
          this.board = new Board(this.id);
          li.append(this.board.div);
          return this.board.div.slideToggle('slow');
        } else {
          return this.board.div.slideToggle('slow', __bind(function() {
            this.board.cancel();
            this.board.div.detach();
            return this.board = null;
          }, this));
        }
      }, this));
      return parent.append(li);
    };
    return Replay;
  })();
  $(function() {
    return $.get("" + server + "?mode=listReplays", function(data) {
      var replayData, _i, _len, _ref, _results;
      _ref = data.split(';').reverse();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        replayData = _ref[_i];
        _results.push((new Replay(replayData)).show($("#list")));
      }
      return _results;
    });
  });
}).call(this);
