//set variables to allow access to the canvas
let canvas = document.getElementById('board');
//let canvas = document.querySelector('canvas');
let ctx = canvas.getContext('2d');
//set the canvas size
//console.log(window.innerWidth);
//console.log(window.innerHeight);
let cWidth = Math.round((window.innerWidth - 100) / 100) * 100;
//console.log(width);
let cHeight = cWidth * 9 / 16;
//console.log(height);
canvas.width = cWidth;
canvas.height = cHeight;

//set variables to access the sound effects
const soundEffects = {
  paddleBounce: document.getElementById('paddleBounce'),
  wallBounce: document.getElementById('wallBounce'),
  blaster1: document.getElementById('blaster1'),
  blaster2: document.getElementById('blaster2'),
  injury: document.getElementById('injury')
}
//reduce the volume of all the sound effects
for (const item in soundEffects) {
  soundEffects[item].volume = 0.5;
}

//create a page number variable to navigate
let page = 1;

//create the ball object
const ball = {
  xInitial: cWidth / 2,
  yInitial: cHeight / 2,
  r: cWidth / 80,
  x: cWidth / 2,
  y: cHeight / 2,
  dx: null,
  dy: null,
  color: 'rgb(250, 160, 60)',
  drawBall(ctx) {
    let x = this.x;
    let y = this.y;
    let r = this.r;
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
  logSpeed() {
    console.log('dx = ' + this.dx + '\n dy = ' + this.dy + '\n Speed = ' + Math.round(10000 * Math.hypot(this.dx, this.dy)) / 10000);
  },
  changePosition() {
    this.x += this.dx;
    this.y += this.dy;
  },
  resetPosition() {
    this.x = this.xInitial;
    this.y = this.yInitial;
  },
  randomSpeed() {
    let dxDirection = Math.floor(Math.random() * 2);
    if (dxDirection === 0) {
      dxDirection = -1;
    }
    this.dx = 3 * dxDirection * this.r / 10;

    let dyScalar = Math.random() * 2 - 1;
    this.dy = dyScalar * this.r / 10;
  }
}
ball.randomSpeed();

//create the paddle objects
class paddle {
  constructor(cWidth, cHeight, xInitial, yInitial, upKey, downKey, fireKey, direction) {
    this.xInitial = xInitial;
    this.yInitial = yInitial;
    this.x = xInitial;
    this.y = yInitial;
    this.height = cHeight * 12 / 55;
    this.width = cWidth * 3 / 160;
    this.dy = this.height / 30;
    this.color = 'rgb(60, 160, 215)';
    this.upKey = upKey;
    this.upKeyPressed = false;
    this.downKey = downKey;
    this.downKeyPressed = false;
    this.fireKey = fireKey;
    this.fireKeyPressed = false;
    if (direction > 0) {
      this.direction = 1;
    }
    else {
      this.direction = -1;
    }
    this.blasterCooldown = 0;
  }
  drawPaddle(ctx) {
    let x = this.x;
    let y = this.y;
    let width = this.width;
    let height = this.height;
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.rect(x - width / 2, y - height / 2, width, height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  travelDirection() {
    if (this.upKeyPressed === this.downKeyPressed) {
      return 'none';
    }
    else if (this.upKeyPressed) {
      return 'up';
    }
    else if (this.downKeyPressed) {
      return 'down';
    }
  }
  changePosition(cHeight) {
    if (this.travelDirection() === 'up') {
      this.y -= this.dy;
      if (this.y <= this.height / 2) {
        this.y = this.height / 2;
      }
    }
    else if (this.travelDirection() === 'down') {
      this.y += this.dy;
      if (this.y >= cHeight - this.height / 2) {
        this.y = cHeight - this.height / 2;
      }
    }
  }
  resetPosition() {
    this.x = this.xInitial;
    this.y = this.yInitial;
    this.blasterCooldown = 0;
  }
  checkCollision(xObject, yObject) {
    let x = this.x;
    let y = this.y;
    let width = this.width;
    let height = this.height;
    if (xObject >= x - width / 2 && xObject <= x + width / 2 && yObject >= y - height / 2 && yObject <= y + height / 2) {
      return true;
    }
    else {
      return false;
    }
  }
  bounceBall(ball) {
    ball.dx *= -1;
    let dxAdjustment = (ball.r / 10) / 5;
    if (ball.dx < 0) {
      ball.dx -= dxAdjustment;
    }
    else {
      ball.dx += dxAdjustment;
    }
    //round dx to 4 decimal places
    ball.dx = Math.round(ball.dx * 10000) / 10000;

    let dyAdjustment = ((ball.y - this.y) * 2 / this.height) * 2 * (ball.r / 10);
    ball.dy += dyAdjustment;

    //round dy to 4 decimal places
    ball.dy = Math.round(ball.dy * 10000) / 10000;
  }
  updateBlasterCooldown() {
    if (this.blasterCooldown >= paddle.blasterCooldownGoal) {
      this.blasterCooldown = paddle.blasterCooldownGoal;
    }
    else {
      this.blasterCooldown++;
    }
  }
  createBlast(cWidth) {
    let blast = {};
    blast.color = '#6432aa';
    blast.length = cWidth / 20;
    blast.direction = this.direction;
    blast.x = this.x + blast.direction * blast.length;
    blast.y = this.y;
    blast.dx = blast.length / 4;

    blast.drawBlast = function (ctx) {
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.length * 0.3);
      ctx.lineTo(this.x + this.length / 2, this.y);
      ctx.lineTo(this.x, this.y - this.length * 0.3);
      ctx.lineTo(this.x - this.length / 2, this.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };
    blast.changePosition = function () {
      this.x += this.direction * this.dx;
    };
    return blast;
  }
  fireBlast() {
    if (this.blasterCooldown >= paddle.blasterCooldownGoal && this.fireKeyPressed) {
      paddle.blastArr.push(this.createBlast(cWidth));
      this.blasterCooldown = 0;
      return true;
    }
    return false;
  }
  static blastArr = [];
  static blasterCooldownGoal = 500;
}
const paddle1 = new paddle(cWidth, cHeight, cWidth * 3 / 160, cHeight / 2, 'KeyW', 'KeyS', 'KeyD', 1);
const paddle2 = new paddle(cWidth, cHeight, cWidth - cWidth * 3 / 160, cHeight / 2, 'ArrowUp', 'ArrowDown', 'ArrowLeft', -1);

//create the object to hold the pausing variables
const pause = {
  status: true,
  able: true,
  disabled: false,
  toggle() {
    if (this.able) {
      if (this.status) {
        this.status = false;
      }
      else {
        this.status = true;
      }
      this.able = false;
    }
  },
  drawPauseCover(ctx, cWidth, cHeight) {
    ctx.save();
    ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
    ctx.beginPath();
    ctx.fillRect(0, 0, cWidth, cHeight);
    ctx.fillStyle = 'rgb(210, 210, 220)';
    let miniRecWidth = cWidth / 4;
    ctx.fillRect((cWidth - miniRecWidth) / 2, (cHeight - miniRecWidth) / 2, miniRecWidth, miniRecWidth);
    ctx.fillStyle = 'rgb(110, 110, 120)';
    ctx.fillRect(cWidth / 2 - miniRecWidth / 2 + miniRecWidth / 8, cHeight / 2 - miniRecWidth / 2 + miniRecWidth / 8, miniRecWidth / 4, miniRecWidth * 3 / 4);
    ctx.fillRect(cWidth / 2 - miniRecWidth / 2 + 5 * miniRecWidth / 8, cHeight / 2 - miniRecWidth / 2 + miniRecWidth / 8, miniRecWidth / 4, miniRecWidth * 3 / 4)
    ctx.restore();
  },
  drawRoundOverCover(ctx, cWidth, cHeight) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, 0, cWidth, cHeight);
    ctx.restore();
  },
  endRound() {
    this.status = true;
    this.able = true;
    this.disabled = true;
  }
}

//create the object to hold the score and lives variables
const gameValues = {
  p1: {
    score: 0,
    lives: 2
  },
  p2: {
    score: 0,
    lives: 2
  },
  scoreColor: '#000000',
  livesColor: /*'#eb4034'*/ '#000000',
  resetScore() {
    this.p1.score = 0;
    this.p2.score = 0;
  },
  resetLives() {
    this.p1.lives = 2;
    this.p2.lives = 2;
  },
  drawScore(ctx, cWidth) {
    ctx.save();
    let size = cWidth / 18;
    ctx.font = `${size}px Courier New`;
    ctx.fillStyle = this.scoreColor;
    ctx.textAlign = 'center';
    let x = cWidth / 2;
    let y = size * 5 / 6;
    ctx.fillText(`${this.p1.score}-${this.p2.score}`, x, y);
    ctx.restore();
  },
  drawMidLine(ctx, cWidth, cHeight) {
    ctx.save();
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = cWidth / 60;
    ctx.setLineDash([cHeight / 11, cHeight / 11]);
    ctx.beginPath();
    ctx.moveTo(cWidth / 2, 0);
    ctx.lineTo(cWidth / 2, cHeight);
    ctx.stroke();
    ctx.restore();
  },
  drawLives(ctx, cWidth) {
    let size = cWidth / 30;
    ctx.save();
    ctx.font = `${size}px Courier New`;
    ctx.fillStyle = this.livesColor;
    ctx.textAlign = 'center';
    let x = cWidth / 4;
    let y = cWidth / 25;
    ctx.fillText(this.p1.lives + '\u2661', x, y); //other hearts: ❤,
    x += cWidth / 2;
    ctx.fillText(this.p2.lives + '\u2661', x, y);
    ctx.restore();
  },
  drawWinnerText(ctx, cWidth, cHeight) {
    const winningScore = 5;
    if (this.p1.score >= winningScore || this.p2.score >= winningScore) {
      let side;
      if (this.p1.score >= winningScore) {
        side = 'Left';
      }
      else {
        side = 'Right';
      }

      ctx.save();
      const size = cWidth / 18;
      ctx.font = `${size}px Courier New`;
      ctx.fillStyle = '#50dce6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const x = cWidth / 2;
      const y = cHeight / 2;
      ctx.fillText(`✨The ${side} Player Wins✨`, x, y);
      ctx.restore();

      this.resetScore();
    }
  }
}

const mainMenu = {
  drawTitle(ctx, cWidth) {
    ctx.save();
    let size = cWidth / 10;
    ctx.font = `${size}px Courier New`;
    ctx.fillStyle = '#50dce6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let x = cWidth / 2;
    let y = size * 3 / 2;
    ctx.fillText('Blaster Pong', x, y);
    ctx.restore();
  },
  playButton: {
    getDimensions(cWidth, cHeight) {
      const dim = {};
      dim.size = cWidth / 18;
      dim.width = dim.size * 4 * 0.7;
      dim.height = dim.size;
      dim.x = cWidth / 2;
      dim.y = cHeight - 4 * dim.height;
      return dim;
    },
    drawPlayButton(ctx, cWidth, cHeight) {
      ctx.save();
      const dim = this.getDimensions(cWidth, cHeight);
      const { x, y, width, height, size } = dim;
      ctx.font = `${size}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - width / 2, y - height / 2, width, height);
      ctx.fillStyle = '#000000';
      ctx.fillText('Play', x, y);
      ctx.restore();
    }
  },
  infoButton: {
    getDimensions(cwidth, cHeight) {
      const dim = {};
      dim.size = cWidth / 18;
      dim.r = dim.size / 2;
      dim.x = 2 * dim.r;
      dim.y = cHeight - 2 * dim.r;
      return dim;
    },
    getInfo() {
      let info = 'Imagine Pong, but you get a blaster.'
      info += '\nW and S control the left paddle. D is used to fire.';
      info += '\nUpArrow and DownArrow control the right paddle. LeftArrow is used to fire.';
      info += '\nAs of now, you have to control both paddles or get a friend; no CPU.';
      info += '\nPress Space to start the round and reset it after it ends. You can also press Space to pause and unpause the game mid round.';
      info += '\nThe blaster has a five second cooldown. If you hit your opponent twice, you get a point for that round. If you get the ball past your opponent, you get a point for that round, regardless of lives.';
      info += '\nThe first player to reach 5 points wins the match.';
      info += '\nHave fun! :)';
      info += '\n-Vincent Edwards';
      return info;
    },
    drawInfoButton(ctx, cWidth, cHeight) {
      ctx.save();
      const dim = { size, r, x, y } = this.getDimensions(cWidth, cHeight);
      ctx.font = `${size}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillText('?', x, y);
      ctx.restore();
    }
  },
  drawMainMenu(ctx, cWidth, cHeight) {
    ctx.clearRect(0, 0, cWidth, cHeight);
    this.drawTitle(ctx, cWidth);
    this.playButton.drawPlayButton(ctx, cWidth, cHeight);
    this.infoButton.drawInfoButton(ctx, cWidth, cHeight);
  }
}

//add the eventlisteners to keep track of key/mouse presses
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
canvas.addEventListener('click', clickHandler, false);
function keyDownHandler(e) {
  //console.log(e.key + ' is down' + ' with ' + e.code);
  if (page === 2) {
    if (e.code === 'Space') {
      if (!pause.disabled) {
        if (pause.able) {
          pause.toggle();
          if (!pause.status) {
            animateGame(ctx, cWidth, cHeight);
          }
        }
      }
      else {
        pause.disabled = false;
        ball.resetPosition();
        ball.randomSpeed();
        paddle1.resetPosition();
        paddle2.resetPosition();
        paddle.blastArr.splice(0);
        gameValues.resetLives();
        drawEverything(ctx, cWidth, cHeight);
      }
    }
    else if (e.code === paddle1.upKey) {
      paddle1.upKeyPressed = true;
    }
    else if (e.code === paddle1.downKey) {
      paddle1.downKeyPressed = true;
    }
    else if (e.code === paddle1.fireKey) {
      paddle1.fireKeyPressed = true;
    }
    else if (e.code === paddle2.upKey) {
      paddle2.upKeyPressed = true;
    }
    else if (e.code === paddle2.downKey) {
      paddle2.downKeyPressed = true;
    }
    else if (e.code === paddle2.fireKey) {
      paddle2.fireKeyPressed = true;
    }
  }

}
function keyUpHandler(e) {
  //console.log(e.key + ' is up' + ' with ' + e.code);
  if (page === 1) {
    if (e.code === 'Space') {
      page = 2;
      drawEverything(ctx, cWidth, cHeight);
    }
  }
  else if (page === 2) {
    if (e.code === 'Space') {
      if (!pause.disabled) {
        if (!pause.able) {
          pause.able = true;
        }
      }
    }
    else if (e.code === paddle1.upKey) {
      paddle1.upKeyPressed = false;
    }
    else if (e.code === paddle1.downKey) {
      paddle1.downKeyPressed = false;
    }
    else if (e.code === paddle1.fireKey) {
      paddle1.fireKeyPressed = false;
    }
    else if (e.code === paddle2.upKey) {
      paddle2.upKeyPressed = false;
    }
    else if (e.code === paddle2.downKey) {
      paddle2.downKeyPressed = false;
    }
    else if (e.code === paddle2.fireKey) {
      paddle2.fireKeyPressed = false;
    }
  }

}
function clickHandler(e) {
  pos = {
    x: e.clientX - canvas.offsetLeft,
    y: e.clientY - canvas.offsetTop
  }
  //console.log(`x:${pos.x}, y:${pos.y}`);

  if (page === 1) {
    const playButtonDim = mainMenu.playButton.getDimensions(cWidth, cHeight);
    const infoButtonDim = mainMenu.infoButton.getDimensions(cWidth, cHeight);

    if (pos.x < playButtonDim.x + playButtonDim.width / 2 && pos.x > playButtonDim.x - playButtonDim.width / 2 && pos.y < playButtonDim.y + playButtonDim.height / 2 && pos.y > playButtonDim.y - playButtonDim.height / 2) {
      page = 2;
      drawEverything(ctx, cWidth, cHeight);
    }
    else if (Math.hypot(pos.x - infoButtonDim.x, pos.y - infoButtonDim.y) < infoButtonDim.r) {
      const info = mainMenu.infoButton.getInfo();
      alert(info);
    }
  }
}

//this draws the game components
function drawEverything(ctx, cWidth, cHeight) {
  ctx.clearRect(0, 0, cWidth, cHeight);
  if (page === 1) {
    mainMenu.drawMainMenu(ctx, cWidth, cHeight);
  }
  else if (page === 2) {
    gameValues.drawMidLine(ctx, cWidth, cHeight);
    ball.drawBall(ctx);
    paddle1.drawPaddle(ctx);
    paddle2.drawPaddle(ctx);
    for (let i = paddle.blastArr.length - 1; i >= 0; i--) {
      paddle.blastArr[i].drawBlast(ctx);
    }
    if (paddle1.blasterCooldown >= paddle.blasterCooldownGoal) {
      paddle1.createBlast(cWidth).drawBlast(ctx);
    }
    if (paddle2.blasterCooldown >= paddle.blasterCooldownGoal) {
      paddle2.createBlast(cWidth).drawBlast(ctx);
    }
    gameValues.drawScore(ctx, cWidth);
    gameValues.drawLives(ctx, cWidth);
  }

}

//this draws the current state of the game whenever it is called
function animateGame(ctx, cWidth, cHeight) {
  drawEverything(ctx, cWidth, cHeight);
  if (page === 2) {
    if (!pause.status) {
      //bounce the ball off of the paddles if there is a collision
      if (paddle1.checkCollision(ball.x, ball.y) || paddle1.checkCollision(ball.x + ball.r, ball.y) || paddle1.checkCollision(ball.x - ball.r, ball.y)) {
        paddle1.bounceBall(ball);
        soundEffects.paddleBounce.play();
        //ball.logSpeed();
      }
      if (paddle2.checkCollision(ball.x, ball.y) || paddle2.checkCollision(ball.x + ball.r, ball.y) || paddle2.checkCollision(ball.x - ball.r, ball.y)) {
        paddle2.bounceBall(ball);
        soundEffects.paddleBounce.play();
        //ball.logSpeed();
      }

      //bounce the ball off of the top and bottom walls
      if (ball.y + ball.r >= cHeight || ball.y - ball.r <= 0) {
        ball.dy *= -1;
        soundEffects.wallBounce.play();
      }

      //stop the ball when it hits the left or right wall and award the point
      if (ball.x >= cWidth || ball.x <= 0) {
        if (ball.x >= cWidth) {
          gameValues.p1.score++;
        }
        else {
          gameValues.p2.score++;
        }
        pause.endRound();
      }

      //check if a blast collides with either paddle, remove a life, and award the point if a player's lives go to zero
      for (let i = paddle.blastArr.length - 1; i >= 0; i--) {
        let blast = paddle.blastArr[i];
        if (paddle1.checkCollision(blast.x, blast.y) || paddle1.checkCollision(blast.x + blast.length / 2, blast.y) || paddle1.checkCollision(blast.x - blast.length / 2, blast.y)) {
          gameValues.p1.lives--;
          soundEffects.injury.play();
          paddle.blastArr.splice(i, 1);
        }
        else if (paddle2.checkCollision(blast.x, blast.y) || paddle2.checkCollision(blast.x + blast.length / 2, blast.y) || paddle2.checkCollision(blast.x - blast.length / 2, blast.y)) {
          gameValues.p2.lives--;
          soundEffects.injury.play();
          paddle.blastArr.splice(i, 1);
        }
        if (gameValues.p1.lives <= 0) {
          gameValues.p2.score++;
          pause.endRound();
        }
        if (gameValues.p2.lives <= 0) {
          gameValues.p1.score++;
          pause.endRound();
        }
      }

      //attempt to create new blasts; only works if the fire key is pressed and the cooldown is over
      if (paddle1.fireBlast()) {
        soundEffects.blaster1.play();
      }
      if (paddle2.fireBlast()) {
        soundEffects.blaster2.play();
      }

      //remove blasts that are out of bounds and update the position of the blasts that are still propogating
      for (let i = paddle.blastArr.length - 1; i >= 0; i--) {
        let blast = paddle.blastArr[i];
        if (blast.x - blast.length / 2 >= cWidth || blast.x + blast.length / 2 <= 0) {
          paddle.blastArr.splice(i, 1);
        }
        else {
          blast.changePosition();
        }
      }

      //update the position of the paddles for the next frame
      paddle1.changePosition(cHeight);
      paddle2.changePosition(cHeight);

      //update the positon of the ball for the next frame
      ball.changePosition();

      //update the blaster cooldowns
      paddle1.updateBlasterCooldown();
      paddle2.updateBlasterCooldown();

      setTimeout(animateGame, 10, ctx, cWidth, cHeight);
    }
    else if (!pause.disabled) {
      pause.drawPauseCover(ctx, cWidth, cHeight);
    }
    else {
      pause.drawRoundOverCover(ctx, cWidth, cHeight);
      soundEffects.injury.play();
      //if one of the players has a score of 7, say that they won and reset the score for the next game
      gameValues.drawWinnerText(ctx, cWidth, cHeight);
    }
  }

}

drawEverything(ctx, cWidth, cHeight);
