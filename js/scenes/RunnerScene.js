/* おふポメのたい焼き大冒険 | M05-4a 軽量化テスト */
class RunnerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RunnerScene' });
    this.jumpCount = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#f8f1dc');
    this.createStorybookBackground();
    // M04-2: ステージ1-1の目標距離とゴール到達判定。
    this.stageLengthPx = 18000;
    this.stageGoalMeters = this.stageLengthPx / 100;
    this.physics.world.setBounds(0, 0, 200000, 540);

    this.add.text(480, 42, 'M05-4a｜軽量化テスト', {
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

    // M05-4: 描画だけを差し替え、物理用の矩形は従来どおり残す。
    // 画面外の200,000px分を1つの巨大Graphicsに溜め込まない。
    // 2,000pxごとの独立した描画オブジェクトはカメラの範囲外でカリングされる。
    let groundArtwork = null;
    let artworkSegment = -1;
    const addGround = (left, right) => {
      const width = right - left;
      if (width <= 0) return;
      const ground = this.add.rectangle(
        left + width / 2, 502, width, 76, 0x8dbf87
      );
      ground.setAlpha(0); // 物理ボディの位置・寸法は変えず、見た目のみ別描画
      // ゴール後は描画不要。物理判定は従来の全区間で維持する。
        if (left < this.stageLengthPx + 2000) {
          const index = Math.floor(left / segmentWidth);
          if (index !== artworkSegment) {
            groundArtwork = this.add.graphics().setDepth(-2);
            artworkSegment = index;
          }
          this.drawStorybookGround(groundArtwork, left, right);
        }
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

    // M05-2: ワールド座標の非物理装飾。背景にだけ描き、衝突判定は付けない。
    // 穴・障害物の周囲は余白を確保し、回避ポイントの視認性を優先する。
    this.createForestDecorations(gaps, [1300, 3900]);

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

  // M05-4: 地面の外観のみ。穴はaddGroundが呼ばれないため自動的に空白になる。
  // 既存の地面の物理位置(y=502, height=76)、穴の区間は一切変更しない。
  drawStorybookGround(g, left, right) {
    const width = right - left;
    if (width <= 0) return;
    const top = 464;
    // 柔らかい草の表面と温かい土。地面は下端540pxまで。
    g.fillStyle(0xb79570, 1);
    g.fillRect(left, top, width, 76);
    g.fillStyle(0xc8a784, 1);
    g.fillRect(left, top + 19, width, 57);
    g.fillStyle(0x8dbb82, 1);
    g.fillRect(left, top, width, 13);
    g.fillStyle(0xb4d29d, 1);
    g.fillRect(left, top, width, 5);
    // 穴の両端をわかりやすくする縦の土色の境界線。
    g.fillStyle(0x9e7c60, 1);
    g.fillRect(left, top + 13, Math.min(4, width), 63);
    g.fillRect(Math.max(left, right - 4), top + 13, Math.min(4, width), 63);
    // 区間をまたいで一定の間隔で描くので、2000px分割の継ぎ目が目立たない。
    for (let x = Math.ceil(left / 145) * 145; x < right; x += 145) {
      const available = Math.min(23, right - x);
      if (available < 5) continue;
      const row = Math.floor(x / 145) % 3;
      const y = 493 + row * 13;
      g.fillStyle(row === 1 ? 0xb58e6c : 0xb99978, 0.72);
      g.fillRoundedRect(x, y, available, 4, 2);
      if (x + 44 < right) {
        g.fillStyle(0xe0c3a0, 0.7);
        g.fillEllipse(x + 42, y + 13, 8, 5);
      }
    }
  }

  // M05-4a: 遠景を静止テクスチャに一度だけ描き、TileSpriteの位置だけ動かす。
  // 毎フレームのGraphics.clear() / 楕円の再生成を廃止してiPhoneの負荷を抑える。
  createStorybookBackground() {
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-100);
    sky.fillStyle(0xf8f1dc, 1);
    sky.fillRect(0, 0, 960, 540);
    sky.fillStyle(0xf1f1d8, 1);
    sky.fillRect(0, 190, 960, 350);

    // 遠景の丘：周期1100pxのテクスチャを一度だけ生成。
    if (this.textures.exists('m05-4a-hills')) this.textures.remove('m05-4a-hills');
    const hills = this.make.graphics({ x: 0, y: 0 });
    const hillShapes = [
      [120, 465, 690, 275, 0xd9e8c8], [700, 470, 790, 280, 0xd9e8c8],
      [380, 515, 780, 205, 0xc4dcba], [940, 510, 680, 215, 0xc4dcba]
    ];
    for (const [x, y, w, h, color] of hillShapes) {
      hills.fillStyle(color, 1);
      for (const offset of [-1100, 0, 1100]) {
        hills.fillEllipse(x + offset, y, w, h);
      }
    }
    hills.generateTexture('m05-4a-hills', 1100, 540);
    hills.destroy();
    this.hillLayer = this.add.tileSprite(0, 0, 960, 540, 'm05-4a-hills')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-99);

    // 遠景の木：周期960px。表示内容をテクスチャ化して再利用。
    if (this.textures.exists('m05-4a-trees')) this.textures.remove('m05-4a-trees');
    const trees = this.make.graphics({ x: 0, y: 0 });
    const treeShapes = [
      [75, 370, 0.9], [210, 395, 0.72], [330, 368, 0.84],
      [540, 388, 0.76], [700, 366, 0.92], [850, 394, 0.74]
    ];
    for (const [x, y, scale] of treeShapes) {
      trees.fillStyle(0xb5c9a5, 1);
      trees.fillRoundedRect(x - 7 * scale, y + 5 * scale, 14 * scale, 100 * scale, 5 * scale);
      trees.fillStyle(0xaed2a8, 1);
      trees.fillEllipse(x, y, 106 * scale, 98 * scale);
      trees.fillStyle(0xc2ddbb, 1);
      trees.fillEllipse(x - 19 * scale, y - 13 * scale, 61 * scale, 58 * scale);
    }
    trees.generateTexture('m05-4a-trees', 960, 540);
    trees.destroy();
    this.treeLayer = this.add.tileSprite(0, 0, 960, 540, 'm05-4a-trees')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-98);
  }

  // M05-2: ステージの木・低木・草。画面固定ではなく世界に配置する。
  createForestDecorations(gaps, obstaclePositions) {
    const decor = this.add.graphics().setDepth(-4);
    const nearHazard = (x) =>
      gaps.some(g => x > g.start - 260 && x < g.end + 260) ||
      obstaclePositions.some(ox => Math.abs(x - ox) < 230);
    const stageEnd = 18000 + 180;

    // 木々：幹と丸い樹冠。すべて地面の奥に置く。
    for (let i = 0, x = 520; x < stageEnd; i++, x += 630) {
      if (nearHazard(x)) continue;
      const h = 92 + (i % 3) * 14;
      const baseY = 465;
      decor.fillStyle(0xa5b79b, 0.94);
      decor.fillRoundedRect(x - 11, baseY - h + 38, 22, h - 38, 8);
      decor.fillStyle(i % 2 ? 0xa8cda3 : 0xb8d7ac, 0.98);
      decor.fillEllipse(x, baseY - h + 23, 112, 105);
      decor.fillStyle(0xcce4bf, 0.95);
      decor.fillEllipse(x - 27, baseY - h + 8, 62, 53);
      decor.fillStyle(0x9fc59c, 0.8);
      decor.fillEllipse(x + 29, baseY - h + 28, 48, 54);
    }

    // 茂み：低い位置に限定してジャンプ軌道と標識を見やすくする。
    for (let i = 0, x = 340; x < stageEnd; i++, x += 410) {
      if (nearHazard(x)) continue;
      const y = 464;
      decor.fillStyle(i % 2 ? 0x9cc48f : 0xb1d19f, 0.95);
      decor.fillEllipse(x, y, 95, 42);
      decor.fillEllipse(x - 28, y + 4, 56, 32);
      decor.fillEllipse(x + 30, y + 5, 58, 30);
    }

    // 草の房：控えめな装飾。危険箇所と重ねない。
    decor.lineStyle(3, 0x83ad7b, 0.88);
    for (let i = 0, x = 260; x < stageEnd; i++, x += 155) {
      if (nearHazard(x)) continue;
      const y = 466;
      decor.lineBetween(x, y, x - 8, y - 13);
      decor.lineBetween(x, y, x + 1, y - 18);
      decor.lineBetween(x, y, x + 9, y - 11);
    }
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
    // 描画の再生成なし。テクスチャのオフセットだけ更新する。
    const scrollX = this.cameras.main.scrollX;
    this.hillLayer.tilePositionX = scrollX * 0.12;
    this.treeLayer.tilePositionX = scrollX * 0.32;
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
