import Phaser from 'phaser'

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene')
  }

  preload() {

    this.load.image('ground', 'assets/Platform.png')
    this.load.image('enemy', 'assets/Enemy.png')
    this.load.image('coin', 'assets/Coin.png')
    this.load.image("bullet", "assets/Star_Red.png")
    this.load.spritesheet('player', 'assets/Player.png', {
      frameWidth: 32,
      frameHeight: 32,
    })
  }

  create() {
    this.scene.start('GameScene')
  }
}
