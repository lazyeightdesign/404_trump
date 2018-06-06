(function () {
  "use strict";

  // General
  var canvas,
    screen,
    gameSize,
    game,
    steps,
    scoreSend;

  // Assets
  var invaderCanvas,
    invaderMultiplier,
    invaderSize = 50,
    initialOffsetInvader,
    invaderAttackRate,
    invaderSpeed,
    invaderSpawnDelay = 5;

  // Counter
  var i = 0,
    kills = 0,
    spawnDelayCounter = invaderSpawnDelay;

  var invaderDownTimer;

  // Text
  var blocks = [
    [3, 4, 8, 9, 10, 15, 16],
    [2, 4, 7, 11, 14, 16],
    [1, 4, 7, 11, 13, 16],
    [1, 2, 3, 4, 5, 7, 11, 13, 14, 15, 16, 17],
    [4, 7, 11, 16],
    [4, 8, 9, 10, 16]
  ];

  // Game Controller
  // ---------------
  var Game = function () {

    this.level = -1;
    this.lost = false;

    this.player = new Player();
    this.invaders = [];
    this.invaderShots = [];

    if (invaderDownTimer === undefined) {
      invaderDownTimer = setInterval(function () {
        for (i = 0; i < game.invaders.length; i++) game.invaders[i].move();
      }, 1000 - (this.level * 1.8));

    };

    $("#preloader").hide();
  }

  Game.prototype = {
    update: function () {

      // Next level
      if (game.invaders.length === 0) {

        // console.log('next level prev');
        spawnDelayCounter += 1;
        if (spawnDelayCounter < invaderSpawnDelay) return;

        this.level += 1;
        // console.log('next level go');
        invaderAttackRate -= 0.002;
        invaderSpeed += 10;

        game.invaders = createInvaders();

        spawnDelayCounter = 0;
      }

      if (!this.lost) {

        // Collision
        game.player.projectile.forEach(function (projectile) {
          game.invaders.forEach(function (invader) {
            if (collides(projectile, invader)) {
              invader.destroy();
              projectile.active = false;
            }
          });
        });

        this.invaderShots.forEach(function (invaderShots) {
          if (collides(invaderShots, game.player)) {
            game.player.destroy();
          }
        });

        for (i = 0; i < game.invaders.length; i++)
          game.invaders[i].update();

      }

      // Don't stop player & projectiles.. they look nice
      game.player.update();
      for (i = 0; i < game.invaderShots.length; i++)
        game.invaderShots[i].update();

      this.invaders = game.invaders.filter(function (invader) {
        return invader.active;
      });

    },

    draw: function () {

      if (!this.lost) {
        $("#point").text(kills)
        screen.clearRect(0, 0, gameSize.width, gameSize.height);
      }

      screen.beginPath();

      var i;
      this.player.draw();
      if (!this.lost)
        for (i = 0; i < this.invaders.length; i++)
          this.invaders[i].draw();

      for (i = 0; i < this.invaderShots.length; i++)
        this.invaderShots[i].draw();

      screen.fill();

    },

    invadersBelow: function (invader) {
      return this.invaders.filter(function (b) {
        return Math.abs(invader.coordinates.x - b.coordinates.x) === 0 &&
          b.coordinates.y > invader.coordinates.y;
      }).length > 0;
    }

  };

  // Invaders
  // --------
  var Invader = function (coordinates) {
    this.active = true;
    this.coordinates = coordinates;

    this.size = {
      width: invaderSize,
      height: invaderSize
    };

    this.patrolX = 0;
    this.speedX = invaderSpeed;

  };

  Invader.prototype = {
    update: function () {

      if (Math.random() > invaderAttackRate && !game.invadersBelow(this)) {
        var projectile = new Projectile({
          x: this.coordinates.x + this.size.width / 2,
          y: this.coordinates.y + this.size.height - 5
        }, {
          x: 0,
          y: 2
        });
        game.invaderShots[game.invaderShots.length] = projectile;
      }

    },
    draw: function () {

      if (this.active) {

        screen.drawImage(invaderCanvas, this.coordinates.x, this.coordinates.y);

      }
    },
    move: function () {
      if (this.patrolX < 0 || this.patrolX > steps) {
        this.speedX = -this.speedX;
        this.patrolX += this.speedX;
        this.coordinates.y += this.size.height;

        if (this.coordinates.y + this.size.height * 2 + 80 > gameSize.height) {
          gameFinish();
          game.lost = true;
          this.active = false;

        }

      } else {
        this.coordinates.x += this.speedX;
        this.patrolX += this.speedX;
      }

    },
    destroy: function () {
      this.active = false;
      kills += 1;

    }

  };

  // Player
  // ------
  var Player = function () {
    this.active = true;
    this.size = {
      width: 35,
      height: 10
    };

    this.shooterHeat = -3;
    this.coordinates = {
      x: gameSize.width / 2 - (this.size.width / 2) | 0,
      y: gameSize.height - this.size.height * 2 - 100
    };

    this.projectile = [];
    this.keyboarder = new KeyController();
  };

  Player.prototype = {
    update: function () {

      for (var i = 0; i < this.projectile.length; i++) this.projectile[i].update();

      this.projectile = this.projectile.filter(function (projectile) {
        return projectile.active;
      });

      if (!this.active) return;

      if ((this.keyboarder.isDown(this.keyboarder.KEYS.LEFT) || this.keyboarder.isDown(this.keyboarder.KEYS.SECOND_LEFT)) && this.coordinates.x > 0) this.coordinates.x -= 2;
      else if ((this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT) || this.keyboarder.isDown(this.keyboarder.KEYS.SECOND_RIGHT)) && this.coordinates.x < gameSize.width - this.size.width) this.coordinates.x += 2;

      if (this.keyboarder.isDown(this.keyboarder.KEYS.Space)) {
        this.shooterHeat += 1;
        if (this.shooterHeat < 0) {
          var projectile = new Projectile({
            x: this.coordinates.x + this.size.width / 2 - 1,
            y: this.coordinates.y - 1
          }, {
            x: 0,
            y: -7
          });
          this.projectile[this.projectile.length] = projectile;
        } else if (this.shooterHeat > 12) this.shooterHeat = -3;
      } else {
        this.shooterHeat = -3;
      }

    },
    draw: function () {
      if (this.active) {
        var player_img = new Image;
        player_img.src = 'img/game/brain.svg';
        screen.drawImage(player_img, this.coordinates.x, this.coordinates.y, 30, 30); // 35.35
      }
      for (var i = 0; i < this.projectile.length; i++) this.projectile[i].draw();
    },
    destroy: function () {
      this.active = false;
      game.lost = true;
      gameFinish();
    }
  };

  // Projectile
  // ------
  var gameFinish = function () {

    var kill = kills;
    $('.game__option').addClass('hide');
    $('.game__description').addClass('hide');
    $('.game').addClass('lost');

    $('.game_lose').removeClass('hide');

    $('.game').addClass('hide');
    $('.game_lose__point').text('Score ' + kill);

    playSound();

    $('#twitter').unbind('click').on('click', function () {
      var url = 'https://twitter.com/intent/tweet' +
        '?text=' + decodeURIComponent('@realDonaldTrump My common sense score: ' + kill) + '%20%7c' +
        '&url=' + decodeURIComponent('https://lazyeight.design/404');
      window.open(url);
    });

    var btn_restart = document.getElementById('restart_btn');
    btn_restart.addEventListener('click', function (e) {

      $('.game__option').removeClass('hide');
      $('.game__description').removeClass('hide');
      $('.game').removeClass('lost');
      $('#restart_btn').addClass('hide');
      $('#social__text').text('');

      initGameStart();
    });
  }
  var Projectile = function (coordinates, velocity) {
    this.active = true;
    this.coordinates = coordinates;
    this.size = {
      width: 3,
      height: 3
    };
    this.velocity = velocity;
  };

  Projectile.prototype = {
    update: function () {
      this.coordinates.x += this.velocity.x;
      this.coordinates.y += this.velocity.y;

      if (this.coordinates.y > gameSize.height || this.coordinates.y < 0) this.active = false;

    },
    draw: function () {
      if (this.active) {

        screen.fillStyle = '#fff';

        screen.rect(this.coordinates.x, this.coordinates.y, this.size.width, this.size.height);

      }
    }
  };

  // Keyboard input tracking
  // -----------------------
  var KeyController = function () {
    this.KEYS = {
      LEFT: 37,
      RIGHT: 39,
      Space: 32,
      SECOND_RIGHT: 68,
      SECOND_LEFT: 65
    };
    var keyCode = [37, 39, 32, 68, 65];
    var keyState = {};

    var counter;
    window.addEventListener('keydown', function (e) {
      for (counter = 0; counter < keyCode.length; counter++)
        if (keyCode[counter] == e.keyCode) {
          keyState[e.keyCode] = true;
          e.preventDefault();
        }

    });

    window.addEventListener('keyup', function (e) {
      for (counter = 0; counter < keyCode.length; counter++)
        if (keyCode[counter] == e.keyCode) {
          keyState[e.keyCode] = false;
          e.preventDefault();
        }
    });

    this.isDown = function (keyCode) {
      return keyState[keyCode] === true;
    };

  };

  // Other functions
  // ---------------
  function collides(a, b) {
    return a.coordinates.x < b.coordinates.x + b.size.width &&
      a.coordinates.x + a.size.width > b.coordinates.x &&
      a.coordinates.y < b.coordinates.y + b.size.height &&
      a.coordinates.y + a.size.height > b.coordinates.y;
  }

  function getPixelRow(rowRaw) {
    var textRow = [],
      placer = 0,
      row = Math.floor(rowRaw / invaderMultiplier);
    if (row >= blocks.length) return [];
    for (var i = 0; i < blocks[row].length; i++) {
      var tmpContent = blocks[row][i] * invaderMultiplier;
      for (var j = 0; j < invaderMultiplier; j++) textRow[placer + j] = tmpContent + j;
      placer += invaderMultiplier;
    }
    return textRow;
  }

  // Write Text
  // -----------
  function createInvaders() {
    var invaders = [];

    var i = blocks.length * invaderMultiplier;
    while (i--) {
      var j = getPixelRow(i);
      for (var k = 0; k < j.length; k++) {
        invaders[invaders.length] = new Invader({
          x: j[k] * invaderSize,
          y: i * invaderSize
        });
      }
    }
    return invaders;
  }

  // Start game
  // ----------
  window.addEventListener('load', function () {

    var invaderAsset = new Image;
    invaderAsset.onload = function () {

      invaderCanvas = document.createElement('canvas');
      invaderCanvas.width = invaderSize;
      invaderCanvas.height = invaderSize;
      invaderCanvas.getContext("2d").drawImage(invaderAsset, 0, 0);

      // Game Creation
      canvas = document.getElementById("space-invaders");
      screen = canvas.getContext('2d');

      if (window.innerWidth > 1050) {

        initGameStart();
        loop();

      } else {
        $('.desktop').addClass('hide');
        $('.mobile').removeClass('hide');
      }


    };

    if ($(window).width() > 1400)
      invaderAsset.src = "img/game/tramp.svg";
    else
      invaderAsset.src = "img/game/tramp.svg";

  });

  window.addEventListener('resize', function () {
    location.reload();

  });

  var soundPlayAlready = false;

  var playSound = function () {
    // if(soundPlayAlready)
    //   return false;

    // soundPlayAlready = true;
    // $("#audio_file").prop("currentTime",0);
    // $("#audio_file").trigger('play');
  }

  function initGameStart() {

    $('.game_lose').addClass('hide');
    $('.game').removeClass('hide');
    scoreSend = false;
    soundPlayAlready = false;
    screen.canvas.width = window.innerWidth;
    screen.canvas.height = window.innerHeight - 120;

    if ($(window).width() > 1400)
      invaderSize = 30;
    else
      invaderSize = 30;

    gameSize = {
      width: window.innerWidth,
      height: window.innerHeight - 45,
    };

    invaderMultiplier = 2;
    if (window.innerWidth >= 1200) {

      steps = 300;


      initialOffsetInvader = 660;
    } else if (window.innerWidth >= 800 && window.innerWidth < 1000) {
      steps = 100;
      initialOffsetInvader = 280;
    } else if (window.innerWidth < 1200 && window.innerWidth >= 1000) {
      steps = 200;
      initialOffsetInvader = 420;
    } else if (window.innerWidth < 800) {
      steps = 0;

      invaderSize = 20;
      initialOffsetInvader = 660;
    }

    kills = 0;
    invaderAttackRate = 0.999;
    invaderSpeed = 40;
    spawnDelayCounter = invaderSpawnDelay;

    game = new Game();
  }

  function loop() {
    game.update();
    game.draw();

    requestAnimationFrame(loop);
  }

})();

function restart() {
  location.reload();
}

$(document).ready(function () {
  var isClicked = false;
  $("#new__high__score__email").keyup(function (event) {
    if (isClicked) {
      return false;
    }

    if (event.keyCode === 13) {
      isClicked = true;
      $.get('/score-email', {
        'email': $('#new__high__score__email').val(),
        'score': $('#new__high_score_number').text()
      }, function (data) {
        isClicked = false;
        $('.new__high__score').addClass('hide');
        $('.game_lose').addClass('hide');
        $('#restart_btn').removeClass('hide');
        $('.game_lose').removeClass('hide');
      });
    }
  });

  $('.description__text').delay(5000).fadeOut();
  $('.description__icon').on('click', function () {
    $('.description__text').fadeIn(0).stop().delay(5000).fadeOut();
  });
});