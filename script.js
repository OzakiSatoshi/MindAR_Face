document.addEventListener('DOMContentLoaded', function () {
  const captureBtn = document.getElementById('capture-btn');
  const canvas = document.getElementById('arCanvas');
  const video = document.getElementById('video');
  const scene = document.querySelector('a-scene');
  const logoImg = document.getElementById('logo-img');

  // カメラ映像の取得
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error('Error accessing the camera', error);
    });

  // ウィンドウサイズ変更時やデバイス向き変更時の対応
  function resizeScene() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    scene.style.width = `${width}px`;
    scene.style.height = `${height}px`;
  }

  // 初期ロード時とリサイズ時にリサイズ関数を実行
  window.addEventListener('resize', resizeScene);
  window.addEventListener('orientationchange', resizeScene);
  resizeScene();

  // WebGLとカメラ映像を合成して描画するための関数
  function captureWebGLAndVideo(renderer, canvas) {
    try {
      const gl = renderer.getContext();
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;

      // メインキャンバスの設定
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      // カメラ映像を描画する
      context.drawImage(video, 0, 0, width, height);

      // WebGLコンテンツを取得
      const pixels = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      // WebGLのピクセルデータをImageDataに変換
      const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height);

      // 一時キャンバスにWebGLコンテンツを描画
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempContext = tempCanvas.getContext('2d');

      // WebGLの内容を上下反転と左右反転を修正して描画
      tempContext.putImageData(imageData, 0, 0);
      context.save();
      context.scale(-1, -1);  // X軸とY軸の両方を反転して、上下左右反転を修正
      context.drawImage(tempCanvas, -width, -height);  // 正しい位置に描画
      context.restore();

    } catch (error) {
      console.error("Error during WebGL and video capture", error);
    }
  }

  // 撮影ボタンを押した際に現在のカメラ映像とAR表示をキャプチャする機能
  captureBtn.addEventListener('click', () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const renderer = scene.renderer;

      if (renderer && scene.camera) {
        requestAnimationFrame(() => {
          try {
            // WebGLとカメラ映像を合成して描画
            captureWebGLAndVideo(renderer, canvas);

            // ロゴをキャンバスに描画（中央下部に配置）
            const context = canvas.getContext('2d');
            const logoWidth = logoImg.width;
            const logoHeight = logoImg.height;
            const x = (canvas.width - logoWidth) / 2;
            const y = canvas.height - logoHeight - 20; // 画面下部から20pxのマージンをつける

            context.drawImage(logoImg, x, y);

            // キャプチャ画像を生成してダウンロード
            const imageData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imageData;
            link.download = 'capture.png';
            link.click();
          } catch (error) {
            console.error("Render error:", error);
          }
        });
      } else {
        console.error("Renderer or camera is not available for rendering.");
      }
    } else {
      console.log("Waiting for video data...");
    }
  });
});
