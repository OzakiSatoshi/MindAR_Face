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

window.addEventListener('resize', resizeScene);
window.addEventListener('orientationchange', resizeScene);
resizeScene();

// WebGLとカメラ映像を合成して描画する関数
function captureWebGLAndVideo(renderer, canvas) {
  try {
    const gl = renderer.getContext();
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    context.drawImage(video, 0, 0, width, height);

    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempContext = tempCanvas.getContext('2d');

    tempContext.putImageData(imageData, 0, 0);
    context.save();
    context.scale(-1, -1);
    context.drawImage(tempCanvas, -width, -height);
    context.restore();
  } catch (error) {
    console.error("Error during WebGL and video capture", error);
  }
}

captureBtn.addEventListener('click', () => {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const renderer = scene.renderer;

    if (renderer && scene.camera) {
      requestAnimationFrame(() => {
        captureWebGLAndVideo(renderer, canvas);

        const context = canvas.getContext('2d');
        const logoWidth = logoImg.width;
        const logoHeight = logoImg.height;
        const x = (canvas.width - logoWidth) / 2;
        const y = (canvas.height - logoHeight) / 2;
        context.drawImage(logoImg, x, y);

        const imageData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageData;
        link.download = 'capture.png';
        link.click();
      });
    } else {
      console.error("Renderer or camera is not available for rendering.");
    }
  } else {
    console.log("Waiting for video data...");
  }
});
