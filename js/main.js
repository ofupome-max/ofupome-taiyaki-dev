/* おふポメのたい焼き大冒険（仮） | M01 Phaser起動設定 */
(function () {
  'use strict';

  if (typeof Phaser === 'undefined' || typeof BootScene === 'undefined') {
    console.error('M01: Phaser または BootScene.js を読み込めませんでした。');
    return;
  }

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#e6f1e8',
    width: 960,
    height: 540,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 960,
      height: 540
    },
    render: {
      pixelArt: false,
      antialias: true
    },
    scene: [BootScene]
  };

  try {
    window.ofupomeGame = new Phaser.Game(config);
  } catch (error) {
    console.error('M01: ゲームの起動に失敗しました。', error);
  }
})();
