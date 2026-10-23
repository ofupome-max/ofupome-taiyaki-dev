/* おふポメのたい焼き大冒険 | M02 走行テスト起動設定 */
(function () {
  'use strict';

  if (
    typeof Phaser === 'undefined' ||
    typeof BootScene === 'undefined' ||
    typeof RunnerScene === 'undefined'
  ) {
    console.error('M02: Phaser またはシーンファイルを読み込めませんでした。');
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
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    render: {
      pixelArt: false,
      antialias: true
    },
    // M02は仮図形で走行・二段ジャンプを検証する。
    // BootSceneは保持し、起動シーンをRunnerSceneに切り替える。
    scene: [RunnerScene, BootScene]
  };

  try {
    window.ofupomeGame = new Phaser.Game(config);
  } catch (error) {
    console.error('M02: ゲームの起動に失敗しました。', error);
  }
})();
