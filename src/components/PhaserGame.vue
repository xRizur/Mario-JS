<template>
  <div ref="gameContainer" class="game-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import Phaser from 'phaser'

import PreloadScene from '@/game/PreloadScene'
import GameScene from '@/game/GameScene'

const gameContainer = ref<HTMLDivElement | null>(null)

let game: Phaser.Game | null = null

onMounted(() => {
  if (gameContainer.value) {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameContainer.value, // Gdzie renderować
      backgroundColor: '#87CEEB',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 800 },
          debug: false,
        },
      },
      scene: [PreloadScene, GameScene],
    }

    game = new Phaser.Game(config)
  }
})

onBeforeUnmount(() => {
  if (game) {
    game.destroy(true)
  }
})
</script>

<style scoped>
.game-container {
  width: 800px;
  height: 600px;
  margin: 0 auto;
}
</style>
