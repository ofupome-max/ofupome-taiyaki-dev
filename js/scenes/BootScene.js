/* おふポメのたい焼き大冒険 - M01 起動確認用シーン */
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.cameras.main.setBackgroundColor('#e6f1e8');

    const graphics = this.add.graphics();
    graphics.fillStyle(0xc5dfcc, 1);
    graphics.fillRoundedRect(175, 132, 610, 286, 24);
    graphics.lineStyle(3, 0x8fb99c, 1);
    graphics.strokeRoundedRect(175, 132, 610, 286, 24);

    this.add.text(width / 2, 78, 'おふポメのたい焼き大冒険', {
      fontFamily: 'sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#466f53'
    }).setOrigin(0.5);

    this.add.text(width / 2, 193, 'Phaser 起動成功！', {
      fontFamily: 'sans-serif', fontSize: '42px', fontStyle: 'bold', color: '#355b42'
    }).setOrigin(0.5);

    this.add.text(width / 2, 268, '960 × 540  |  M01 起動テスト', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#466f53'
    }).setOrigin(0.5);

    this.add.text(width / 2, 345, 'ここから、おふポメの冒険が始まる。', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#59745e'
    }).setOrigin(0.5);

    this.add.text(width / 2, 483, '開発テスト Ver.0.1', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#59745e'
    }).setOrigin(0.5);
  }
}
