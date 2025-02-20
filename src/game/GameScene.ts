import Phaser from 'phaser'

interface GameSceneData {
  level?: number
  score?: number
  lives?: number
}

export default class GameScene extends Phaser.Scene {
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup
  private enemyGroup!: Phaser.Physics.Arcade.Group
  private coinGroup!: Phaser.Physics.Arcade.Group
  private bulletGroup!: Phaser.Physics.Arcade.Group;

  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  private score = 0
  private lives = 3
  private gameOver = false
  private remainingEnemies = 0;

  private nextLifeScoreThreshold = 100;
  private scoreThresholdIncrement = 100;

  private scoreText!: Phaser.GameObjects.Text
  private livesText!: Phaser.GameObjects.Text

  private currentLevel = 1
  private readonly sceneWidth = 800
  private readonly sceneHeight = 600

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: GameSceneData) {
    if (data.level !== undefined) {
      this.currentLevel = data.level
    }
    if (data.score !== undefined) {
      this.score = data.score
    }
    if (data.lives !== undefined) {
      this.lives = data.lives
    }
  }

  create() {
    // const isMapSaved = !!localStorage.getItem('myGameMap');
    // if (isMapSaved) {
    //   this.loadMap();
    // } else {
    this.platformGroup = this.physics.add.staticGroup()
    this.enemyGroup = this.physics.add.group()
    this.coinGroup = this.physics.add.group()
    this.bulletGroup = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true,
    });
    this.generateLevel()
    // }
    this.player = this.physics.add.sprite(100, 100, 'player')
    this.player.setCollideWorldBounds(true, true, true, false)

    this.physics.add.collider(this.player, this.platformGroup)

    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
      frameRate: 8,
      repeat: -1
    })
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 20
    })
    this.physics.add.overlap(
      this.bulletGroup,
      this.enemyGroup,
      this.hitEnemyWithBullet,
      undefined,
      this
    );
    
    this.cursors = this.input.keyboard.createCursorKeys()

    this.physics.add.collider(this.enemyGroup, this.platformGroup)
    this.physics.add.collider(this.coinGroup, this.platformGroup)
    this.physics.add.overlap(this.player, this.enemyGroup, this.hitEnemy, undefined, this)
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, undefined, this)

    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, { fontSize: '18px' })
    this.livesText = this.add.text(16, 36, `Lives: ${this.lives}`, { fontSize: '18px' })

    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
  }

  update() {
    if (this.gameOver) return;
  
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play('run', true);
      this.player.setFlipX(true);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play('run', true);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play('idle');
    }
  
    if (this.cursors.up?.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-400);
    }
  
    if (this.player.y > this.sceneHeight - 40) {
      this.loseLife();
    }
  
    if (this.player.x > this.sceneWidth - 40) {
      this.nextLevel();
    }
    
    if (this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE), 200)) {
      if (this.lives > 2) {
        this.shootBullet();
      }
    }
    const keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    const keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    if (Phaser.Input.Keyboard.JustDown(keyS)) {
      this.saveMap();
    }

    if (Phaser.Input.Keyboard.JustDown(keyL)) {
      this.loadMap();
      // Po wczytaniu możesz ewentualnie ustawić gracza w początkowej pozycji itp.
      // this.player.setPosition(100, 100);
    }

    this.enemyGroup.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Phaser.Physics.Arcade.SpriteWithDynamicBody;
  
      if (enemy.body.velocity.x === 0) {
        enemy.setVelocityX(Phaser.Math.Between(-50, 50) || 50);
      }
  
      const direction = enemy.body.velocity.x > 0 ? 1 : -1;
      const frontX = enemy.x + direction * enemy.width * 0.5;
      const frontY = enemy.y + enemy.height * 0.5 + 2;
  
      const isPlatformBelow = this.platformGroup.getChildren().some((platObj) => {
        const p = platObj as Phaser.Physics.Arcade.Sprite;
        return (
          frontX >= p.x &&
          frontX <= p.x + p.displayWidth &&
          frontY >= p.y &&
          frontY <= p.y + p.displayHeight
        );
      });
  
      if (!isPlatformBelow) {
        enemy.setVelocityX(-1 * enemy.body.velocity.x);
      }
  
      if (enemy.x > this.sceneWidth + 50 || enemy.x < -50 || enemy.y > this.sceneHeight - 40) {
        enemy.destroy();
      }
    });
  
    this.coinGroup.getChildren().forEach((coinObj) => {
      const coin = coinObj as Phaser.Physics.Arcade.Sprite;
  
      if (coin.x > this.sceneWidth + 50 || coin.x < -50 || coin.y > this.sceneHeight + 50) {
        coin.destroy();
      }
    });
    
    
  }
  
  private nextLevel() {
    this.remainingEnemies = this.enemyGroup.countActive(true);
  
    this.enemyGroup.getChildren().forEach((enemy) => {
      const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
      enemySprite.destroy();
    });
  
    this.enemyGroup.clear(true, true);
  
    this.scene.restart({
      level: this.currentLevel + 1,
      score: this.score,
      lives: this.lives,
    });
  }
  

  private generateLevel() {
    const segmentWidth = 48;

    const baseSegments = 17;
    const segmentsCount = baseSegments + (this.currentLevel - 1) * 2;

    const minY = 300;
    const maxY = 550;
    const maxJumpDelta = 150;

    let prevPlatformY = 550;

    const platforms: Phaser.Physics.Arcade.Sprite[] = [];

    for (let i = 0; i < segmentsCount; i++) {
      const segX = i * segmentWidth;

      let platformY = Phaser.Math.Between(minY, maxY);
      let attempts = 0;
      while (Math.abs(platformY - prevPlatformY) > maxJumpDelta && attempts < 20) {
        platformY = Phaser.Math.Between(minY, maxY);
        attempts++;
      }
      if (Math.abs(platformY - prevPlatformY) > maxJumpDelta) {
        platformY = prevPlatformY;
      }

      const mainPlatform = this.platformGroup.create(segX, platformY, 'ground');
      mainPlatform.setOrigin(0, 0).refreshBody();
      platforms.push(mainPlatform);

      prevPlatformY = platformY;

      if (Phaser.Math.Between(1, 100) <= 30) {
        const extraY = Phaser.Math.Between(200, platformY - 50);
        if (extraY >= 150) {
          const extraPlatform = this.platformGroup.create(segX, extraY, 'ground');
          extraPlatform.setOrigin(0, 0).refreshBody();
          platforms.push(extraPlatform);
        }
      }

      if (i < segmentsCount - 1) {
        const enemyChance = 40 + (this.currentLevel - 1) * 5;
        if (Phaser.Math.Between(1, 100) <= enemyChance) {
          const enemyX = segX;
          const enemyY = platformY - 32;
          const enemy = this.enemyGroup.create(enemyX, enemyY, 'enemy');
          enemy.setBounce(0);
          enemy.setCollideWorldBounds(true, true, true, false);
          const vx = Phaser.Math.Between(-50, 50);
          enemy.setVelocityX(vx === 0 ? 40 : vx);
        }
      }

      if (Phaser.Math.Between(1, 100) <= 30) {
        const coinX = segX;
        const coinY = platformY - 32;
        const coin = this.coinGroup.create(coinX, coinY, 'coin');
        coin.setBounce(0);
        coin.setCollideWorldBounds(true, true, true, false);
      }
      
      
    }
    
    for (let i = 0; i < this.remainingEnemies; i++) {
      const randomPlatform =
        platforms[Phaser.Math.Between(0, platforms.length - 1)];
      if (!randomPlatform) continue;

      const enemyX = randomPlatform.x;
      const enemyY = randomPlatform.y - 32;
      const enemy = this.enemyGroup.create(enemyX, enemyY, 'enemy');
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true, true, true, false);
      const vx = Phaser.Math.Between(-50, 50);
      enemy.setVelocityX(vx === 0 ? 40 : vx);
    }

    const lastX = (segmentsCount - 1) * segmentWidth;
    const finalPlatform = this.platformGroup.create(lastX, 550, 'ground');
    finalPlatform.setOrigin(0, 0).refreshBody();
  }

  
  private collectCoin(
    playerObj: Phaser.GameObjects.GameObject,
    coinObj: Phaser.GameObjects.GameObject
  ) {
    const coin = coinObj as Phaser.Physics.Arcade.Sprite
    coin.disableBody(true, true)
  
    this.score += 10
    this.scoreText.setText(`Score: ${this.score}`)
  
    if (this.score >= this.nextLifeScoreThreshold) {
      this.lives++
      this.livesText.setText(`Lives: ${this.lives}`)
  
      this.nextLifeScoreThreshold += this.scoreThresholdIncrement
      this.scoreThresholdIncrement += 100
    }
  }
  
  
  private shootBullet() {
    const bullet = this.bulletGroup.create(this.player.x, this.player.y, 'bullet');
    if (!bullet) return;
  
    bullet.setActive(true);
    bullet.setVisible(true);
  
    bullet.body.velocity.x = this.player.flipX ? -300 : 300;
  
    bullet.body.checkWorldBounds = true;
    bullet.body.outOfBoundsKill = true;
  }
  private hitEnemyWithBullet(
    bulletObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject
  ) {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
  
    bullet.disableBody(true, true);
    enemy.disableBody(true, true);
  
    this.score += 20;
    this.scoreText.setText(`Score: ${this.score}`);
  }
  
  private hitEnemy(
    playerObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject
  ) {
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite
    const player = playerObj as Phaser.Physics.Arcade.Sprite
  
    if (player.body.velocity.y > 0) {
      enemy.disableBody(true, true)
      player.setVelocityY(-200)
      this.score += 20
      this.scoreText.setText(`Score: ${this.score}`)
  
      if (this.score >= this.nextLifeScoreThreshold) {
        this.lives++
        this.livesText.setText(`Lives: ${this.lives}`)
  
        this.nextLifeScoreThreshold += this.scoreThresholdIncrement
        this.scoreThresholdIncrement += 100
      }
    } else {
      this.loseLife()
    }
  }
  

  private loseLife() {
    this.lives--
    this.livesText.setText(`Lives: ${this.lives}`)

    if (this.lives <= 0) {
      this.gameOver = true
      this.player.setTint(0xff0000)
      this.player.anims.play('idle')
      this.add.text(300, 300, 'GAME OVER', {
        fontSize: '40px',
        color: '#f00'
      })
    } else {
      this.player.setPosition(100, 100)
      this.player.setVelocity(0)
    }
  }
private getMapState() {
  const platformsData: { x: number; y: number }[] = [];
  const coinsData: { x: number; y: number }[] = [];
  const enemiesData: { x: number; y: number; vx: number }[] = [];

  this.platformGroup.getChildren().forEach((platObj) => {
    const plat = platObj as Phaser.Physics.Arcade.Sprite;
    platformsData.push({
      x: plat.x,
      y: plat.y
    });
  });

  this.coinGroup.getChildren().forEach((coinObj) => {
    const coin = coinObj as Phaser.Physics.Arcade.Sprite;
    if (coin.active) {
      coinsData.push({
        x: coin.x,
        y: coin.y
      });
    }
  });

  this.enemyGroup.getChildren().forEach((enemyObj) => {
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    if (enemy.active) {
      enemiesData.push({
        x: enemy.x,
        y: enemy.y,
        vx: enemy.body.velocity.x
      });
    }
  });

  return {
    platforms: platformsData,
    coins: coinsData,
    enemies: enemiesData
  };
}
private saveMap() {
  const mapState = this.getMapState();

  const saveData = {
    level: this.currentLevel,
    score: this.score,
    lives: this.lives,
    nextLifeScoreThreshold: this.nextLifeScoreThreshold,
    scoreThresholdIncrement: this.scoreThresholdIncrement,
    map: mapState
  };

  localStorage.setItem('myGameMap', JSON.stringify(saveData));
  console.log('Zapisano mapę i stan gry:', saveData);
}
private loadMap() {
  const savedStr = localStorage.getItem('myGameMap');
  if (!savedStr) {
    console.log('Brak zapisanej mapy w localStorage.');
    return;
  }

  const savedData = JSON.parse(savedStr);

  if (typeof savedData.level === 'number') {
    this.currentLevel = savedData.level;
  }
  if (typeof savedData.score === 'number') {
    this.score = savedData.score;
  }
  if (typeof savedData.lives === 'number') {
    this.lives = savedData.lives;
  }
  if (typeof savedData.nextLifeScoreThreshold === 'number') {
    this.nextLifeScoreThreshold = savedData.nextLifeScoreThreshold;
  }
  if (typeof savedData.scoreThresholdIncrement === 'number') {
    this.scoreThresholdIncrement = savedData.scoreThresholdIncrement;
  }

  const map = savedData.map;
  if (!map) {
    console.log('Zapis nie zawiera mapy.');
    return;
  }

  this.platformGroup.clear(true, true);
  this.coinGroup.clear(true, true);
  this.enemyGroup.clear(true, true);

  if (map.platforms && Array.isArray(map.platforms)) {
    map.platforms.forEach((p: { x: number; y: number }) => {
      const plat = this.platformGroup.create(p.x, p.y, 'ground');
      plat.setOrigin(0, 0).refreshBody();
    });
  }

  if (map.coins && Array.isArray(map.coins)) {
    map.coins.forEach((c: { x: number; y: number }) => {
      const coin = this.coinGroup.create(c.x, c.y, 'coin');
      coin.setBounce(0);
      coin.setCollideWorldBounds(true, true, true, false);
    });
  }
  if (map.enemies && Array.isArray(map.enemies)) {
    map.enemies.forEach((e: { x: number; y: number; vx: number }) => {
      const enemy = this.enemyGroup.create(e.x, e.y, 'enemy');
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true, true, true, false);
      enemy.setVelocityX(e.vx || 0);
    });
  }

  console.log('Wczytano mapę i stan gry:', savedData);
}

}
