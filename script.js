// DOM elements
const video = document.getElementById('camera');
const startBtn = document.getElementById('startBtn');
const countdownEl = document.getElementById('countdown');
const thumbnails = document.querySelectorAll('.thumb img');
const starMessage = document.getElementById('message');
const editBtn = document.getElementById('editBtn');
const retakeBtn = document.getElementById('retakeBtn');
const afterButtons = document.getElementById('afterButtons');
const editSection = document.getElementById('editSection');
const mainSection = document.getElementById('mainSection');
const retakeFromEditBtn = document.getElementById('retakeFromEditBtn');
const removeStickersBtn = document.getElementById('removeStickers');
const photostripPreview = document.getElementById('photostripPreview');
const downloadBtn = document.getElementById('downloadBtn');
const frameColors = document.querySelectorAll('#frameColors .color');
const bgColors = document.querySelectorAll('#bgColors .color');
const filterButtons = document.querySelectorAll('.filters button');
const enableDateCheckbox = document.getElementById('enableDate');

let stream = null;
let capturedPhotos = []; // Lưu trữ ảnh đã chụp với thông tin sticker

// Danh sách sticker ảnh với vị trí và kích thước cố định
const imageStickers = [
  {
    url: 'anhanh.png',
    position: { top: '20px', right: '20px' },
    size: { width: '340px', height: '300px' }
  },
];

// Tất cả sticker (chỉ ảnh)
const availableStickers = [...imageStickers];

// State quản lý sticker hiện tại
let currentCameraSticker = null;

// Mở camera
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch {
    alert("Không thể truy cập camera 😢");
  }
}

// Đếm ngược
function showCountdown(seconds) {
  return new Promise(resolve => {
    countdownEl.style.display = 'block';
    let count = seconds;
    countdownEl.textContent = count;
    const interval = setInterval(() => {
      count--;
      countdownEl.textContent = count > 0 ? count : '📸';
      if (count <= 0) {
        clearInterval(interval);
        setTimeout(() => {
          countdownEl.style.display = 'none';
          resolve();
        }, 500);
      }
    }, 1000);
  });
}

// Chụp ảnh từ video với sticker - cải thiện
async function takePhoto() {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Vẽ video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Vẽ sticker nếu có
    const cameraSticker = document.querySelector('.camera-sticker');
    if (cameraSticker && cameraSticker.tagName === 'IMG') {
      const videoRect = video.getBoundingClientRect();
      const stickerRect = cameraSticker.getBoundingClientRect();

      const scaleX = canvas.width / videoRect.width;
      const scaleY = canvas.height / videoRect.height;

      const stickerX = (stickerRect.left - videoRect.left) * scaleX;
      const stickerY = (stickerRect.top - videoRect.top) * scaleY;
      const stickerWidth = cameraSticker.offsetWidth * scaleX;
      const stickerHeight = cameraSticker.offsetHeight * scaleY;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        ctx.drawImage(img, stickerX, stickerY, stickerWidth, stickerHeight);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          sticker: currentCameraSticker ? {
            url: currentCameraSticker.url,
            position: currentCameraSticker.position,
            size: currentCameraSticker.size
          } : null
        });
      };
      img.onerror = function() {
        console.error('Error loading sticker image');
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          sticker: null
        });
      };
      img.src = cameraSticker.src;
      
      // Fallback nếu ảnh đã được cache
      if (img.complete) {
        ctx.drawImage(img, stickerX, stickerY, stickerWidth, stickerHeight);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          sticker: currentCameraSticker ? {
            url: currentCameraSticker.url,
            position: currentCameraSticker.position,
            size: currentCameraSticker.size
          } : null
        });
      }
    } else {
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        sticker: null
      });
    }
  });
}

// Thêm sticker lên camera video với vị trí và kích thước cố định
function addStickerToCamera() {
  // Xóa sticker cũ nếu có
  removeCameraSticker();

  // Chọn sticker ngẫu nhiên từ danh sách
  const randomStickerData = availableStickers[Math.floor(Math.random() * availableStickers.length)];
  currentCameraSticker = randomStickerData;
  
  // Tạo img element cho sticker ảnh
  const sticker = document.createElement('img');
  sticker.src = randomStickerData.url;
  sticker.crossOrigin = 'anonymous';
  
  // Áp dụng kích thước từ config
  const stickerSize = randomStickerData.size || { width: '80px', height: '80px' };
  sticker.style.width = stickerSize.width;
  sticker.style.height = stickerSize.height;
  sticker.style.objectFit = 'contain';
  
  sticker.classList.add('camera-sticker');
  
  // Style chung cho sticker
  sticker.style.position = 'absolute';
  sticker.style.zIndex = '20';
  sticker.style.pointerEvents = 'none';
  sticker.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))';
  
  // Áp dụng vị trí cố định từ config
  Object.assign(sticker.style, randomStickerData.position);
  
  // Thêm sticker vào camera wrapper
  const cameraWrapper = document.querySelector('.camera-wrapper');
  cameraWrapper.style.position = 'relative';
  cameraWrapper.appendChild(sticker);
}

// Xóa sticker trên camera
function removeCameraSticker() {
  const existingSticker = document.querySelector('.camera-sticker');
  if (existingSticker) {
    existingSticker.remove();
  }
  currentCameraSticker = null;
}

// Xóa ảnh thumbnail
function clearThumbnails() {
  thumbnails.forEach(img => {
    img.src = '';
    img.style.display = 'none';
  });
  capturedPhotos = [];
  removeCameraSticker();
}

// Chụp 4 ảnh liên tiếp - cải thiện
async function takePhotosSequence() {
  clearThumbnails();
  starMessage.style.display = 'none';
  capturedPhotos = [];

  for (let i = 0; i < thumbnails.length; i++) {
    // Thêm sticker lên camera trước khi đếm ngược
    addStickerToCamera();
    
    await showCountdown(3);
    
    // Chụp ảnh và lưu thông tin
    const photoData = await takePhoto();
    capturedPhotos.push(photoData);
    
    // Hiển thị thumbnail
    thumbnails[i].src = photoData.dataUrl;
    thumbnails[i].style.display = 'block';
    
    // Xóa sticker trên camera sau khi chụp
    removeCameraSticker();
    
    // Delay nhỏ giữa các lần chụp
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  starMessage.style.display = 'block';
  afterButtons.style.display = 'flex';
  startBtn.style.display = 'none';
}

// Hiển thị photostrip với sticker - cải thiện
function renderPhotostrip() {
  photostripPreview.innerHTML = '';
  
  capturedPhotos.forEach((photoData, index) => {
    if (photoData && photoData.dataUrl) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('photo-wrapper');
      wrapper.style.position = 'relative';

      const photo = document.createElement('img');
      photo.src = photoData.dataUrl;
      photo.crossOrigin = 'anonymous';
      wrapper.appendChild(photo);
      photostripPreview.appendChild(wrapper);
    }
  });
}

// Xóa sticker (chỉ sticker edit, không xóa sticker gốc)
function removeStickers() {
  photostripPreview.querySelectorAll('.sticker').forEach(s => s.remove());
  document.querySelectorAll('.emoji-sticker, .sticker-option').forEach(s => s.classList.remove('selected'));
}

// Thêm sticker emoji (trong edit mode)
function addSticker(emoji) {
  // Chỉ xóa sticker edit, giữ lại sticker gốc
  photostripPreview.querySelectorAll('.sticker').forEach(s => s.remove());

  const wrappers = photostripPreview.querySelectorAll('.photo-wrapper');
  const positions = [
    { top: '10px', left: '10px' },
    { top: '10px', right: '10px' },
    { bottom: '10px', left: '10px' },
    { bottom: '10px', right: '10px' }
  ];

  wrappers.forEach((wrapper, index) => {
    const sticker = document.createElement('div');
    sticker.classList.add('sticker');
    sticker.textContent = emoji;
    sticker.style.position = 'absolute';
    sticker.style.zIndex = '15';
    sticker.style.fontSize = '28px';
    sticker.style.pointerEvents = 'none';
    sticker.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    sticker.style.userSelect = 'none';
    
    // Áp dụng vị trí cụ thể
    const pos = positions[index % positions.length];
    Object.assign(sticker.style, pos);
    
    wrapper.appendChild(sticker);
  });
}

// Thêm sticker ảnh (trong edit mode)
function addImageSticker(url) {
  // Chỉ xóa sticker edit, giữ lại sticker gốc
  photostripPreview.querySelectorAll('.sticker').forEach(s => s.remove());

  const wrappers = photostripPreview.querySelectorAll('.photo-wrapper');
  const positions = [
    { top: '10px', left: '10px' },
    { top: '10px', right: '10px' },
    { bottom: '10px', left: '10px' },
    { bottom: '10px', right: '10px' }
  ];

  wrappers.forEach((wrapper, index) => {
    const sticker = document.createElement('img');
    sticker.classList.add('sticker');
    sticker.src = url;
    sticker.crossOrigin = 'anonymous';
    sticker.style.width = '40px';
    sticker.style.height = '40px';
    sticker.style.position = 'absolute';
    sticker.style.zIndex = '15';
    sticker.style.pointerEvents = 'none';
    sticker.style.userSelect = 'none';
    sticker.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))';
    
    // Áp dụng vị trí cụ thể
    const pos = positions[index % positions.length];
    Object.assign(sticker.style, pos);
    
    wrapper.appendChild(sticker);
  });
}

// Đổi màu khung
function setFrameColor(color) {
  document.querySelectorAll('.photo-wrapper img').forEach(img => {
    img.style.borderColor = color;
  });
}

// Đổi màu nền
function setBgColor(color) {
  if (color === '#000') {
    photostripPreview.style.background = 'linear-gradient(145deg, #2c3e50, #34495e)';
  } else {
    photostripPreview.style.background = `linear-gradient(145deg, ${color}, ${color}dd)`;
  }
}

// Áp filter ảnh
function applyFilter(filter) {
  document.querySelectorAll('.photo-wrapper img').forEach(img => {
    if (!img.classList.contains('sticker') && !img.classList.contains('original-sticker')) {
      img.style.filter = filter === 'none' ? '' : filter;
    }
  });
}

// Toggle ngày
function toggleDate() {
  const existingDate = photostripPreview.querySelector('.photostrip-date');
  if (enableDateCheckbox.checked) {
    if (!existingDate) {
      const dateEl = document.createElement('div');
      dateEl.classList.add('photostrip-date');
      dateEl.textContent = new Date().toLocaleDateString('vi-VN');
      dateEl.style.position = 'absolute';
      dateEl.style.bottom = '10px';
      dateEl.style.right = '10px';
      dateEl.style.fontSize = '12px';
      dateEl.style.color = '#666';
      dateEl.style.zIndex = '20';
      photostripPreview.appendChild(dateEl);
    }
  } else {
    if (existingDate) existingDate.remove();
  }
}

// Fallback download method
function downloadWithDomToImage() {
  console.log('Using fallback download method');
  // Tạo canvas thủ công để download
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 400;
  canvas.height = 600;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Vẽ text thông báo
  ctx.fillStyle = '#333';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Download failed - Please try again', canvas.width/2, canvas.height/2);
  
  const link = document.createElement('a');
  link.download = 'photostrip_fallback.png';
  link.href = canvas.toDataURL();
  link.click();
}

// Khởi động camera
startCamera();

// Gán sự kiện
startBtn.addEventListener('click', takePhotosSequence);

editBtn.addEventListener('click', () => {
  mainSection.style.display = 'none';
  editSection.style.display = 'block';
  renderPhotostrip();
});

retakeBtn.addEventListener('click', () => location.reload());
retakeFromEditBtn.addEventListener('click', () => location.reload());

document.querySelectorAll('.emoji-sticker').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.emoji-sticker, .sticker-option').forEach(s => s.classList.remove('selected'));
    btn.classList.add('selected');
    addSticker(btn.dataset.sticker);
  });
});

document.querySelectorAll('.sticker-option').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.emoji-sticker, .sticker-option').forEach(s => s.classList.remove('selected'));
    btn.classList.add('selected');
    addImageSticker(btn.dataset.stickerUrl);
  });
});

removeStickersBtn.addEventListener('click', removeStickers);

frameColors.forEach(c => {
  c.addEventListener('click', () => {
    frameColors.forEach(c => c.classList.remove('selected'));
    c.classList.add('selected');
    setFrameColor(c.dataset.color);
  });
});

bgColors.forEach(c => {
  c.addEventListener('click', () => {
    bgColors.forEach(c => c.classList.remove('selected'));
    c.classList.add('selected');
    setBgColor(c.dataset.color);
  });
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter(btn.dataset.filter);
  });
});

enableDateCheckbox.addEventListener('change', toggleDate);

downloadBtn.addEventListener('click', () => {
  // Đảm bảo tất cả ảnh đã load xong
  const images = photostripPreview.querySelectorAll('img');
  let loadedCount = 0;
  const totalImages = images.length;
  
  if (totalImages === 0) {
    downloadWithDomToImage();
    return;
  }
  
  function checkAllLoaded() {
    loadedCount++;
    if (loadedCount >= totalImages) {
      // Tất cả ảnh đã load, tiến hành capture
      setTimeout(() => {
        html2canvas(photostripPreview, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff',
          ignoreElements: function(element) {
            return element.classList && element.classList.contains('ignore-capture');
          },
          onclone: function(clonedDoc) {
            const clonedStickers = clonedDoc.querySelectorAll('.sticker, .original-sticker');
            clonedStickers.forEach(sticker => {
              sticker.style.position = 'absolute';
              sticker.style.zIndex = sticker.classList.contains('original-sticker') ? '10' : '15';
              sticker.style.pointerEvents = 'none';
            });
          }
        }).then(canvas => {
          const link = document.createElement('a');
          link.download = `photostrip_${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png', 0.9);
          link.click();
        }).catch(error => {
          console.error('Error generating image:', error);
          downloadWithDomToImage();
        });
      }, 100);
    }
  }
  
  images.forEach(img => {
    if (img.complete) {
      checkAllLoaded();
    } else {
      img.onload = checkAllLoaded;
      img.onerror = checkAllLoaded;
    }
  });
});

// Ảnh test với sticker trên camera
function loadTestImages() {
  const urls = [
      'stickers/ling1.jpg',
      'stickers/ling2.jpg', 
      'stickers/ling3.jpg',
      'stickers/ling4.jpg'
  ];

  // Tạo dữ liệu test giống như ảnh thật
  capturedPhotos = urls.map(url => ({
    dataUrl: url,
    sticker: {
      url: 'anhanh.png',
      position: { top: '20px', right: '20px' },
      size: { width: '340px', height: '300px' }
    }
  }));

  thumbnails.forEach((img, i) => {
    img.src = urls[i];
    img.style.display = 'block';
  });
  
  starMessage.style.display = 'block';
  afterButtons.style.display = 'flex';
  startBtn.style.display = 'none';
}