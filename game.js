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

  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  private score = 0
  private lives = 3
  private gameOver = false
  private remainingEnemies = 0; // Liczba wrogów z poprzedniego poziomu

  private nextLifeScoreThreshold = 100; // Początkowy próg (dla pierwszego życia)
  private scoreThresholdIncrement = 100; // Wzrost o 100 dla kolejnego życia

  private scoreText!: Phaser.GameObjects.Text
  private livesText!: Phaser.GameObjects.Text

  // Numer aktualnego poziomu
  private currentLevel = 1
  // Rozmiar sceny
  private readonly sceneWidth = 800
  private readonly sceneHeight = 600

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: GameSceneData) {
    // Odbieramy parametry (level, score, lives) przy restarcie sceny
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
    // GRUPY
    this.platformGroup = this.physics.add.staticGroup()
    this.enemyGroup = this.physics.add.group()
    this.coinGroup = this.physics.add.group()

    // GENEROWANIE POZIOMU
    this.generateLevel()

    // GRACZ
    this.player = this.physics.add.sprite(100, 100, 'player')
    // Kolizja tylko z lewo/góra/prawo świata, nie z dołem
    this.player.setCollideWorldBounds(true, true, true, false)

    this.physics.add.collider(this.player, this.platformGroup)

    // Animacje
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

    this.cursors = this.input.keyboard.createCursorKeys()

    // KOLIZJE
    this.physics.add.collider(this.enemyGroup, this.platformGroup)
    this.physics.add.collider(this.coinGroup, this.platformGroup)
    this.physics.add.overlap(this.player, this.enemyGroup, this.hitEnemy, undefined, this)
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, undefined, this)

    // HUD
    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, { fontSize: '18px' })
    this.livesText = this.add.text(16, 36, `Lives: ${this.lives}`, { fontSize: '18px' })

    // Ustawiamy bounds świata
    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
  }

  update() {
    if (this.gameOver) return

    // -- Sterowanie graczem --
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-160)
      this.player.anims.play('run', true)
      this.player.setFlipX(true)
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(160)
      this.player.anims.play('run', true)
      this.player.setFlipX(false)
    } else {
      this.player.setVelocityX(0)
      this.player.anims.play('idle')
    }

    if (this.cursors.up?.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-400)
    }

    // -- Spadnięcie gracza poza scenę --
    if (this.player.y > this.sceneHeight - 40) {
      this.loseLife()
    }

    // -- Przejście w prawo => nowy poziom --
    if (this.player.x > this.sceneWidth - 40) {
      this.nextLevel()
    }

    // -- Logika wrogów: odwracanie na krawędzi platformy --
    this.enemyGroup.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody

      // Jeśli wróg stoi w miejscu (velocityX = 0), to daj mu jakiś kierunek
      if (enemy.body.velocity.x === 0) {
        enemy.setVelocityX(Phaser.Math.Between(-50, 50) || 50)
      }

      // Sprawdzamy, czy wróg "wychodzi" z platformy
      const direction = enemy.body.velocity.x > 0 ? 1 : -1
      const frontX = enemy.x + (direction * enemy.width * 0.5)
      const frontY = enemy.y + enemy.height * 0.5 + 2

      // Czy w tym miejscu jest platforma?
      const isPlatformBelow = this.platformGroup.getChildren().some((platObj) => {
        const p = platObj as Phaser.Physics.Arcade.Sprite
        return (
          frontX >= p.x &&
          frontX <= p.x + p.displayWidth &&
          frontY >= p.y &&
          frontY <= p.y + p.displayHeight
        )
      })

      if (!isPlatformBelow) {
        enemy.setVelocityX(-1 * enemy.body.velocity.x)
      }
    })
  }

  // ----------------------------------------------------------------------------
  // GENEROWANIE MAPY - POJEDYNCZE PLATFORMY (48 px), CAŁA SZEROKOŚĆ
  // ----------------------------------------------------------------------------
  private generateLevel() {
    // Każdy segment to 48 px
    const segmentWidth = 48

    // Dla level=1 zróbmy np. 17 segmentów (48*17=816 > 800),
    // a dla wyższych leveli - zwiększaj liczbę segmentów
    const baseSegments = 17 // starczy na pokrycie ~800 px
    const segmentsCount = baseSegments + (this.currentLevel - 1) * 2

    // Zakres wysokości platform
    const minY = 300
    const maxY = 550
    // Maks różnica wysokości, by dało się przeskoczyć
    const maxJumpDelta = 150

    // Wysokość poprzedniej platformy (start)
    let prevPlatformY = 550

    for (let i = 0; i < segmentsCount; i++) {
      const segX = i * segmentWidth

      // 1) Wysokość głównej platformy
      let platformY = Phaser.Math.Between(minY, maxY)
      let attempts = 0
      // Ograniczamy różnicę od poprzedniej
      while (Math.abs(platformY - prevPlatformY) > maxJumpDelta && attempts < 20) {
        platformY = Phaser.Math.Between(minY, maxY)
        attempts++
      }
      if (Math.abs(platformY - prevPlatformY) > maxJumpDelta) {
        platformY = prevPlatformY
      }

      // Tworzymy dokładnie 1 klocek
      const mainPlatform = this.platformGroup.create(segX, platformY, 'ground')
      mainPlatform.setOrigin(0, 0).refreshBody()

      // Aktualizujemy "poprzednią platformę"
      prevPlatformY = platformY

      // 2) Opcjonalnie - dodatkowa platforma 30% szans
      if (Phaser.Math.Between(1, 100) <= 30) {
        const extraY = Phaser.Math.Between(200, platformY - 50)
        // (Możesz pominąć warunek, jeśli chcesz platformy wyżej niż minY=300)
        if (extraY >= 150) {
          const extraPlatform = this.platformGroup.create(segX, extraY, 'ground')
          extraPlatform.setOrigin(0, 0).refreshBody()
        }
      }

      // 3) Wrogowie - omijamy ostatni segment by nie spamować na końcu
      if (i < segmentsCount - 1) {
        const enemyChance = 40 + (this.currentLevel - 1) * 5
        if (Phaser.Math.Between(1, 100) <= enemyChance) {
          const enemyX = segX
          const enemyY = platformY - 32
          const enemy = this.enemyGroup.create(enemyX, enemyY, 'enemy')
          enemy.setBounce(0)
          enemy.setCollideWorldBounds(true, true, true, false)
          const vx = Phaser.Math.Between(-50, 50)
          enemy.setVelocityX(vx === 0 ? 40 : vx)
        }
      }

      // 4) Monety
      if (Phaser.Math.Between(1, 100) <= 30) {
        const coinX = segX
        const coinY = platformY - 32
        const coin = this.coinGroup.create(coinX, coinY, 'coin')
        coin.setBounce(0)
        coin.setCollideWorldBounds(true, true, true, false)
      }
    }

    // Zapewniamy, że w ostatnim segmencie gracz ma platformę na dole (550),
    // żeby na pewno dało się dojść do prawej krawędzi
    const lastX = (segmentsCount - 1) * segmentWidth
    const finalPlatform = this.platformGroup.create(lastX, 550, 'ground')
    finalPlatform.setOrigin(0, 0).refreshBody()
  }

  // ----------------------------------------------------------------------------
  // PRZEJŚCIE NA NASTĘPNY POZIOM
  // ----------------------------------------------------------------------------
  private nextLevel() {
    // Zliczamy pozostałych wrogów
    this.remainingEnemies = this.enemyGroup.countActive(true);
  
    // Restartujemy scenę z zachowaniem danych
    this.scene.restart({
      level: this.currentLevel + 1,
      score: this.score,
      lives: this.lives,
    });
  }
  

  // ----------------------------------------------------------------------------
  // KOLIZJE / ZDARZENIA
  // ----------------------------------------------------------------------------
  
  private collectCoin(
    playerObj: Phaser.GameObjects.GameObject,
    coinObj: Phaser.GameObjects.GameObject
  ) {
    const coin = coinObj as Phaser.Physics.Arcade.Sprite
    coin.disableBody(true, true)
  
    this.score += 10
    this.scoreText.setText(`Score: ${this.score}`)
  
    // Sprawdzamy, czy wynik osiągnął próg dla dodatkowego życia
    if (this.score >= this.nextLifeScoreThreshold) {
      this.lives++
      this.livesText.setText(`Lives: ${this.lives}`)
  
      // Zwiększamy próg dla następnego życia
      this.nextLifeScoreThreshold += this.scoreThresholdIncrement
      this.scoreThresholdIncrement += 100 // Każde następne życie wymaga więcej punktów
    }
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
  
      // Sprawdzamy, czy wynik osiągnął próg dla dodatkowego życia
      if (this.score >= this.nextLifeScoreThreshold) {
        this.lives++
        this.livesText.setText(`Lives: ${this.lives}`)
  
        // Zwiększamy próg dla następnego życia
        this.nextLifeScoreThreshold += this.scoreThresholdIncrement
        this.scoreThresholdIncrement += 100 // Każde następne życie wymaga więcej punktów
      }
    } else {
      this.loseLife()
    }
  }
  

  private loseLife() {
    this.lives--
    this.livesText.setText(`Lives: ${this.lives}`)

    if (this.lives <= 0) {
      // KONIEC GRY
      this.gameOver = true
      this.player.setTint(0xff0000)
      this.player.anims.play('idle')
      this.add.text(300, 300, 'GAME OVER', {
        fontSize: '40px',
        color: '#f00'
      })
    } else {
      // Cofamy gracza do startowej pozycji
      this.player.setPosition(100, 100)
      this.player.setVelocity(0)
    }
  }
}
