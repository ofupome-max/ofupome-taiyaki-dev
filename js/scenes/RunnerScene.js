/* おふポメのたい焼き大冒険 | M03-3 障害物・穴 回避テスト */
class RunnerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RunnerScene' });
    this.jumpCount = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#e6f1e8');
    this.physics.world.setBounds(0, 0, 200000, 540);

    this.add.text(480, 42, 'M03-3｜障害物・穴 回避テスト', {
      fontFamily: 'sans-serif', fontSize: '30px', color: '#355b42', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
    this.add.text(480, 88, '画面をタップ：ジャンプ → 空中でもう一度タップ', {
      fontFamily: 'sans-serif', fontSize: '21px', color: '#466f53'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    // 仮図形のみ。公式おふポメのキャラクター画像はまだ使用しない。
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xb88d5e, 1);
    graphics.fillRoundedRect(0, 0, 78, 56, 15);
    graphics.generateTexture('m02-placeholder', 78, 56);
    graphics.destroy();

    // M03-2: 2,000px区間の地面を保ち、指定した区間だけ穴を空ける。
    // 最初の穴は走行開始から約8秒後。幅300pxで二段ジャンプを試せる。
    this.groundSegments = this.physics.add.staticGroup();
    const segmentWidth = 2000;
    const stageWidth = 200000;
    const gaps = [
      { start: 2600, end: 2900 },
      { start: 5300, end: 5650 }
    ];

    const addGround = (left, right) => {
      const width = right - left;
      if (width <= 0) return;
      const ground = this.add.rectangle(
        left + width / 2, 502, width, 76, 0x8dbf87
      );
      this.physics.add.existing(ground, true);
      this.groundSegments.add(ground);
    };

    for (let left = 0; left < stageWidth; left += segmentWidth) {
      const right = Math.min(left + segmentWidth, stageWidth);
      let cursor = left;
      for (const gap of gaps) {
        if (gap.end <= cursor || gap.start >= right) continue;
        addGround(cursor, Math.min(gap.start, right));
        cursor = Math.max(cursor, Math.min(gap.end, right));
      }
      addGround(cursor, right);
    }

    // 穴の位置を示す小さな目印。キャラクターと同じワールド座標に配置。
    for (const gap of gaps) {
      this.add.text(gap.start - 120, 420, '▼ あな', {
        fontFamily: 'sans-serif', fontSize: '23px', color: '#a55d38'
      }).setDepth(2);
    }

    // M03-3: 仮の障害物を2か所に配置。M03-2の穴はそのまま維持する。
    // 障害物は接触検知専用。ゲームオーバーとリスタートはM03-4で実装。
    this.obstacles = this.physics.add.staticGroup();
    const obstaclePositions = [1300, 3900];
    for (const x of obstaclePositions) {
      const obstacle = this.add.rectangle(x, 434, 56, 60, 0xc66b4d);
      this.physics.add.existing(obstacle, true);
      this.obstacles.add(obstacle);
      this.add.text(x - 85, 371, '▲ しょうがいぶつ', {
        fontFamily: 'sans-serif', fontSize: '19px', color: '#a04530'
      }).setDepth(2);
    }

    this.player = this.physics.add.sprite(180, 420, 'm02-placeholder');
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(66, 50);
    this.player.setVelocityX(300);
    this.player.setGravityY(1800);
    this.player.body.setMaxVelocity(300, 1200);
    this.physics.add.collider(this.player, this.groundSegments);
    this.physics.add.overlap(this.player, this.obstacles, () => this.onObstacleHit());
    this.cameras.main.startFollow(this.player, false, 1, 0, -180, 0);
    this.cameras.main.setBounds(0, 0, 200000, 540);

    this.jumpCount = 0;
    this.hasFallen = false;
    this.hasHitObstacle = false;
    this.input.on('pointerdown', () => this.tryJump());
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.tryJump());
    }

    this.status = this.add.text(24, 135, '', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#355b42'
    }).setScrollFactor(0).setDepth(10);
  }

  onObstacleHit() {
    if (this.hasFallen || this.hasHitObstacle) return;
    this.hasHitObstacle = true;
    this.player.setVelocity(0, 0);
    this.player.setGravityY(0);
    this.player.body.enable = false;
    this.add.text(480, 260, '障害物に接触！ 再挑戦はページを再読み込み', {
      fontFamily: 'sans-serif', fontSize: '25px', color: '#a04530',
      backgroundColor: '#fff4e6', padding: { x: 18, y: 12 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20);
  }

  tryJump() {
    const grounded = this.player.body.blocked.down || this.player.body.touching.down;
    if (grounded) this.jumpCount = 0;
    if (this.hasFallen || this.hasHitObstacle || this.jumpCount >= 2) return;
    this.player.setVelocityY(this.jumpCount === 0 ? -650 : -600);
    this.jumpCount += 1;
  }

  update() {
    if (!this.player || !this.player.body) return;
    if (this.player.body.enable && (this.player.body.blocked.down || this.player.body.touching.down)) {
      this.jumpCount = 0;
    }
    // M03-2ではゲームオーバー画面やリスタートは未実装（M03-4で対応）。
    // 落下時は停止して表示し、ブラウザ再読み込みで再試行する。
    if (!this.hasFallen && !this.hasHitObstacle && this.player.y > 610) {
      this.hasFallen = true;
      this.player.setVelocity(0, 0);
      this.player.setGravityY(0);
      this.add.text(480, 260, '落下を確認！ 再挑戦はページを再読み込み', {
        fontFamily: 'sans-serif', fontSize: '25px', color: '#a04530',
        backgroundColor: '#fff4e6', padding: { x: 18, y: 12 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20);
    }
    if (!this.hasFallen && !this.hasHitObstacle) this.player.setVelocityX(300);
    const meters = Math.floor(Math.max(0, this.player.x - 180) / 100);
    this.status.setText(`走行距離 ${meters}m   |   ジャンプ ${this.jumpCount}/2`);
  }
}
