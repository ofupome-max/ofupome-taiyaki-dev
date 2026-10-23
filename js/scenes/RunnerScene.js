/* おふポメのたい焼き大冒険 | M04-4 クリア後の再挑戦テスト */
class RunnerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RunnerScene' });
    this.jumpCount = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#e6f1e8');
    // M04-2: ステージ1-1の目標距離とゴール到達判定。
    this.stageLengthPx = 18000;
    this.stageGoalMeters = this.stageLengthPx / 100;
    this.physics.world.setBounds(0, 0, 200000, 540);

    this.add.text(480, 42, 'M04-4｜クリア後の再挑戦 テスト', {
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
    // 障害物は接触検知専用。接触したら共通ゲームオーバー処理を実行。
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
    this.isGameOver = false;
    this.hasReachedGoal = false;
    this.input.on('pointerdown', () => this.tryJump());
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.tryJump());
    }

    this.status = this.add.text(24, 135, '', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#355b42'
    }).setScrollFactor(0).setDepth(10);
  }

  onObstacleHit() {
    if (this.isGameOver || this.hasReachedGoal) return;
    this.hasHitObstacle = true;
    this.showGameOver('障害物にぶつかった！');
  }

  showGameOver(reason) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.player.setVelocity(0, 0);
    this.player.setGravityY(0);
    this.player.body.enable = false;
    this.add.rectangle(480, 270, 960, 540, 0x20392b, 0.62)
      .setScrollFactor(0).setDepth(30);
    this.add.text(480, 190, 'ゲームオーバー', {
      fontFamily: 'sans-serif', fontSize: '48px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    this.add.text(480, 267, reason, {
      fontFamily: 'sans-serif', fontSize: '27px', color: '#fff4e6'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    this.add.text(480, 350, '画面をタップして、もう一度！', {
      fontFamily: 'sans-serif', fontSize: '27px', color: '#ffffff',
      backgroundColor: '#557d5b', padding: { x: 22, y: 13 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
  }

  // M04-4: ゴール後の専用クリア画面と再挑戦操作。
  showStageClear() {
    this.add.rectangle(480, 270, 960, 540, 0x20392b, 0.68)
      .setScrollFactor(0).setDepth(30);
    this.add.text(480, 166, 'ステージクリア！', {
      fontFamily: 'sans-serif', fontSize: '52px', fontStyle: 'bold', color: '#fff8df'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    this.add.text(480, 258, '森 1-1  ｜  180m ゴール！', {
      fontFamily: 'sans-serif', fontSize: '29px', color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    this.add.text(480, 321, 'おめでとう！', {
      fontFamily: 'sans-serif', fontSize: '30px', color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
    this.add.text(480, 402, 'もう一度プレイ  ▶', {
      fontFamily: 'sans-serif', fontSize: '29px', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#557d5b', padding: { x: 28, y: 14 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31);
  }

  tryJump() {
    if (this.isGameOver) {
      this.scene.restart();
      return;
    }
    if (this.hasReachedGoal) {
      this.scene.restart();
      return;
    }
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
    // M03-4: 落下・障害物衝突を共通ゲームオーバー画面に統一。
    if (!this.isGameOver && !this.hasReachedGoal && !this.hasFallen && !this.hasHitObstacle && this.player.y > 610) {
      this.hasFallen = true;
      this.showGameOver('穴に落ちた！');
    }
    // 180m到達時は走行を止める。クリア画面・再挑戦はM04-3/4で追加。
    if (!this.isGameOver && !this.hasReachedGoal && this.player.x - 180 >= this.stageLengthPx) {
      this.hasReachedGoal = true;
      this.player.setVelocity(0, 0);
      this.player.setGravityY(0);
      this.player.body.enable = false;
      this.showStageClear();
    }
    if (!this.isGameOver && !this.hasReachedGoal) this.player.setVelocityX(300);
    const meters = Math.floor(Math.max(0, this.player.x - 180) / 100);
    this.status.setText(`走行距離 ${meters}m / 目標 ${this.stageGoalMeters}m   |   ジャンプ ${this.jumpCount}/2`);
  }
}
