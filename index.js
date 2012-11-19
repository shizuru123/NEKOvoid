// forked from shizuru's "enchant.js NEKOvoid 01" http://jsdo.it/shizuru/slimeescape
// forked from 3panda_dev's "forked: enchant.js | KUMAvoid - 08.プレイヤーと敵の衝突判定をしよう" http://jsdo.it/3panda_dev/jHTr
// forked from phi's "enchant.js | KUMAvoid - 08.プレイヤーと敵の衝突判定をしよう" http://jsdo.it/phi/L7hh
// forked from phi's "enchant.js | KUMAvoid - 07.敵が画面からはみ出ないよう制御しよう" http://jsdo.it/phi/dVDF
// forked from phi's "enchant.js | KUMAvoid - 06.敵を移動, ジャンプさせよう" http://jsdo.it/phi/nA4c
// forked from phi's "enchant.js | KUMAvoid - 05.敵を生成, 表示しよう" http://jsdo.it/phi/aX7g
// forked from phi's "enchant.js | KUMAvoid - 04.画面をタッチするとプレイヤーの進行方向が反転するようにしよう" http://jsdo.it/phi/aPCA
// forked from phi's "enchant.js | KUMAvoid - 03.プレイヤーが画面からはみ出ないよう制御しよう" http://jsdo.it/phi/jgmo
// forked from phi's "enchant.js | KUMAvoid - 02.プレイヤーが自動で走るようにしよう" http://jsdo.it/phi/4QuI
// forked from phi's "enchant.js | KUMAvoid - プレイヤーを生成, 表示しよう" http://jsdo.it/phi/3RPn
// forked from phi's "enchant.js | KUMAvoid - 背景を表示しよう" http://jsdo.it/phi/ZsGe
// forked from phi's "enchant.js - enchant.js のテンプレートを用意しよう" http://jsdo.it/phi/isoa
// おまじない(using namespace enchant)
enchant();

// リソース(予め使いそうなリソースを用意しておく)
var PLAYER_IMAGE_PATH = "http://jsrun.it/assets/f/H/q/d/fHqde.png"; // プレイヤーイメージ
var ENEMY_IMAGE_PATH  = "http://enchantjs.com/assets/images/chara6.gif"; // エネミーイメージ
var MAP_IMAGE_PATH    = "http://enchantjs.com/assets/images/map0.gif";   // マップイメージ
var MAIN_BGM_PATH     = "http://enchantjs.com/assets/sounds/bgm08.wav";  // メインBGM
var JUMP_SE_PATH      = "http://enchantjs.com/assets/sounds/se8.wav";    // ジャンプSE
var APPEAR_SE_PATH    = "http://enchantjs.com/assets/sounds/se3.wav";    // 出現時SE
var CRASH_SE_PATH     = "http://enchantjs.com/assets/sounds/se9.wav";    // クラッシュ時SE

// 定数(ゲームバランスの調整用のパラメータとして使います)
var SCREEN_WIDTH          = 320;// 画面幅
var SCREEN_HEIGHT         = 320;// 画面高さ
var FLOOR_SIZE            = 16; // 床のサイズ
var FLOOR_TYPE            = 0;  // 床のタイプです. このタイプに応じてプレイヤーの移動速度を変えたりすると面白いかも(0:草原, 1:海, 2:砂地, 3:岩)
var FLOOR_HEIGHT          = SCREEN_HEIGHT-FLOOR_SIZE;   // 地面の高さ
var PLAYER_SIZE           = 32; // プレイヤーのサイズ
var PLAYER_SPEED          = 4;  // プレイヤーの移動速度
var ENEMY_MAX_NUM         = 6;  // 敵生成の最大数
var ENEMY_APPEAR_INTERVAL = 300;// 指定フレーム間隔で敵を生成する
var ENEMY_SIZE            = 32; // 敵のサイズ
var ENEMY_SPEED           = 2;  // 敵の横移動スピード
var ENEMY_SIZE_PADDING    = 8;  // 敵用の画像に余白があるのでそのぶんの補正値
var GRAVITY               = 0.2;// 重力(今のところプレイヤーはジャンプしないので敵の落下速度に使用)
var COLLISION_LENGTH      = 16; // 衝突判定距離

// メイン処理
window.onload = function() {
    var game = new Game(SCREEN_WIDTH, SCREEN_HEIGHT);
    game.time = 0;
    // リソース(画像や音データ)読み込み
    game.preload(PLAYER_IMAGE_PATH, ENEMY_IMAGE_PATH, MAP_IMAGE_PATH, MAIN_BGM_PATH, JUMP_SE_PATH, APPEAR_SE_PATH, CRASH_SE_PATH);
    
    game.onload = function() {
	var scene = game.rootScene;
	
        // 背景を作成
        var bgSprite = new Sprite(game.width, game.height);   // 背景用スプライト生成
        bgSprite.backgroundColor = "#eff";                    // 背景色指定
        
        var bgSurface = new Surface(game.width, game.height); // 描画用サーフェス生成
        var mapImage = game.assets[MAP_IMAGE_PATH];           // マップイメージ
        // 地面描画
        for (var i=0; i<game.width; i+=FLOOR_SIZE) {
            var uvX = FLOOR_TYPE*16;
            bgSurface.draw(mapImage, uvX, 0, FLOOR_SIZE, FLOOR_SIZE, i, FLOOR_HEIGHT, FLOOR_SIZE, FLOOR_SIZE);  // 草原ぽいのを描画
        }
        bgSprite.image = bgSurface; // 背景用スプライトに画像として背景用サーフェスをセット
        scene.addChild(bgSprite);   // シーンに追加
	
        // キャラクタ用変数
        var player = null;    // プレイヤー用変数
        var enemyList = [];   // 敵用変数(主に衝突判定で使用)
        var timerLabel = null;// タイマーラベル
        
        label = new Label("")
        scene.addChild(label)
        
        // プレイヤー作成
        player = new Sprite(PLAYER_SIZE, PLAYER_SIZE); // 生成
        player.image = game.assets[PLAYER_IMAGE_PATH]; // 画像をセット
        player.moveTo(0, FLOOR_HEIGHT-PLAYER_SIZE);    // 移動
	scene.addChild(player);  // シーンに追加
	// プレイヤーを移動させる(走らせる)
	player.vx = 1;
        player.onenterframe = function() {
	    // 移動
            this.x += this.vx * PLAYER_SPEED;
            
            // フレームアニメーション
            if (game.frame % 4) {
		player.frame += 1;
		player.frame %= 3;
            }
	    
            // 画面外に出ないよう調整
            var left  = 0;
            var right = game.width-this.width;
            if (this.x < left) {
		this.x = left;     // 位置補正
		this.vx *= -1;     // 進行方向反転
		this.scaleX *= -1; // 表示向き反転
            }
            if (this.x > right) {
		this.x = right;    // 位置補正
		this.vx *= -1;     // 進行方向反転
		this.scaleX *= -1; // 表示向き反転
            }
        };
	
        // シーンをタッチした際の処理
        scene.ontouchstart = function() {
            player.vx *= -1;     // 進行方向反転
            player.scaleX *= -1; // 表示向き反転
        };
	
	// 経過フレーム数を0にする
	game.frame = 0;
        // シーン更新イベントリスナを登録
        scene.onenterframe = function() {
            game.time++; // 敵から逃げた時間がスコア
            if (game.frame % ENEMY_APPEAR_INTERVAL == 0 && enemyList.length < ENEMY_MAX_NUM) {
		// 敵を生成
		var enemy = new Sprite(ENEMY_SIZE, ENEMY_SIZE);  // 生成
		enemy.image = game.assets[ENEMY_IMAGE_PATH];     // 画像をセット
		enemy.moveTo(Math.random()*(game.width-enemy.width), 20 + Math.floor(Math.random()*40)); // 移動
		scene.addChild(enemy);  // シーンに追加
		enemyList.push(enemy);  // 敵リストに追加
		// 更新関数登録
		enemy.vx = Math.floor(Math.random()*2) ? 1 : -1; // 左右どちらかランダムで進む
		enemy.vy = 0;
		enemy.onenterframe = function() {
		    enemy.vy += GRAVITY;              // 重力
		    enemy.x += enemy.vx * ENEMY_SPEED;// 横移動
		    enemy.y += enemy.vy;              // 縦移動
		    
		    // 地面についたらジャンプさせる
		    var bottom = FLOOR_HEIGHT - this.height + ENEMY_SIZE_PADDING;
		    if (enemy.y > bottom) {
			enemy.y = bottom;
			enemy.vy *= -1;
		    }
		    
		    // 画面外に出ないよう調整
		    var left  = -ENEMY_SIZE_PADDING;
		    var right = game.width-this.width + ENEMY_SIZE_PADDING;
		    if (this.x < left) {
			this.x = left;     // 位置補正
			this.vx *= -1;     // 進行方向反転
			this.scaleX *= -1; // 表示向き反転
		    }
		    if (this.x > right) {
			this.x = right;    // 位置補正
			this.vx *= -1;     // 進行方向反転
			this.scaleX *= -1; // 表示向き反転
		    }
		};
	    }
            // スコアを表示
            label.text = "SCORE:" + game.time;
            // 衝突判定
            for (var i=0,len=enemyList.length; i<len; ++i) {
		var enemy = enemyList[i];
		// プレイヤーと敵を衝突判定
		if (player.within(enemy, COLLISION_LENGTH) == true) {
		    game.end(game.time, "猫は約" + game.time + "フレームのあいだ、スライムから逃げた！");
		}
            }
	    
	};
    };
    
    game.start();
};
