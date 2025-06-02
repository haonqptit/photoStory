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

// Danh sách sticker ảnh
const imageStickers = [
  'a.webp',
  'b.webp'
];

// Tất cả sticker (chỉ ảnh)
const availableStickers = [...imageStickers];

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

// Chụp ảnh từ video (bao gồm cả sticker)
function takePhoto() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  
  // Vẽ video lên canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Vẽ sticker lên canvas nếu có
  const cameraSticker = document.querySelector('.camera-sticker');
  if (cameraSticker) {
    const cameraWrapper = document.querySelector('.camera-wrapper');
    const videoRect = video.getBoundingClientRect();
    const stickerRect = cameraSticker.getBoundingClientRect();
    
    // Tính toán vị trí sticker tương đối với video
    const scaleX = canvas.width / videoRect.width;
    const scaleY = canvas.height / videoRect.height;
    
    const stickerX = (stickerRect.left - videoRect.left) * scaleX;
    const stickerY = (stickerRect.top - videoRect.top) * scaleY;
    
    // Kiểm tra loại sticker
    if (cameraSticker.tagName === 'IMG') {
      // Vẽ sticker ảnh
      const stickerWidth = 80 * Math.min(scaleX, scaleY);
      const stickerHeight = 80 * Math.min(scaleX, scaleY);
      
      // Tạo promise để đợi ảnh load
      const img = new Image();
      img.onload = function() {
        ctx.drawImage(img, stickerX, stickerY, stickerWidth, stickerHeight);
      };
      img.src = cameraSticker.src;
      
      // Vẽ ngay lập tức nếu ảnh đã được cache
      if (img.complete) {
        ctx.drawImage(img, stickerX, stickerY, stickerWidth, stickerHeight);
      }
    } else {
      // Vẽ emoji sticker
      ctx.font = `${48 * Math.min(scaleX, scaleY)}px Arial`;
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Vẽ outline cho text
      ctx.strokeText(cameraSticker.textContent, stickerX + 24 * scaleX, stickerY + 24 * scaleY);
      ctx.fillText(cameraSticker.textContent, stickerX + 24 * scaleX, stickerY + 24 * scaleY);
    }
  }
  
  return canvas.toDataURL('image/png');
}

// Thêm sticker lên camera video
function addStickerToCamera() {
  // Xóa sticker cũ nếu có
  const existingSticker = document.querySelector('.camera-sticker');
  if (existingSticker) {
    existingSticker.remove();
  }

  // Chọn sticker ngẫu nhiên
  const randomSticker = availableStickers[Math.floor(Math.random() * availableStickers.length)];
  
  // Kiểm tra xem là emoji hay ảnh
  const isImageSticker = imageStickers.includes(randomSticker);
  
  // Tạo sticker element
  let sticker;
  if (isImageSticker) {
    // Tạo img element cho sticker ảnh
    sticker = document.createElement('img');
    sticker.src = randomSticker;
    sticker.style.width = '80px';
    sticker.style.height = '80px';
    sticker.style.objectFit = 'contain';
  } else {
    // Tạo div element cho emoji sticker
    sticker = document.createElement('div');
    sticker.textContent = randomSticker;
    sticker.style.fontSize = '48px';
  }
  
  sticker.classList.add('camera-sticker');
  
  // Style chung cho sticker
  sticker.style.position = 'absolute';
  sticker.style.zIndex = '20';
  sticker.style.pointerEvents = 'none';
  sticker.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
  sticker.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))';
  
  // Vị trí ngẫu nhiên trên camera
  const positions = [
    { top: '20px', right: '20px' },
    { top: '20px', left: '20px' },
    { bottom: '20px', right: '20px' },
    { bottom: '20px', left: '20px' },
    { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  ];
  
  const randomPosition = positions[Math.floor(Math.random() * positions.length)];
  Object.assign(sticker.style, randomPosition);
  
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
}

// Xóa tất cả sticker tự động
function clearAutoStickers() {
  document.querySelectorAll('.auto-sticker').forEach(sticker => {
    sticker.remove();
  });
}

// Xóa ảnh thumbnail
function clearThumbnails() {
  thumbnails.forEach(img => {
    img.src = '';
    img.style.display = 'none';
  });
  removeCameraSticker();
}

// Chụp 4 ảnh liên tiếp
async function takePhotosSequence() {
  clearThumbnails();
  starMessage.style.display = 'none';

  for (let i = 0; i < thumbnails.length; i++) {
    // Thêm sticker lên camera trước khi đếm ngược
    addStickerToCamera();
    
    await showCountdown(3);
    thumbnails[i].src = takePhoto();
    thumbnails[i].style.display = 'block';
    
    // Xóa sticker trên camera sau khi chụp
    removeCameraSticker();
  }

  starMessage.style.display = 'block';
  afterButtons.style.display = 'flex';
  startBtn.style.display = 'none';
}

// Hiển thị photostrip
function renderPhotostrip() {
  photostripPreview.innerHTML = '';
  thumbnails.forEach(img => {
    if (img.src) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('photo-wrapper');

      const photo = document.createElement('img');
      photo.src = img.src;
      wrapper.appendChild(photo);
      
      photostripPreview.appendChild(wrapper);
    }
  });
}

// Xóa sticker (chỉ trong edit mode)
function removeStickers() {
  photostripPreview.querySelectorAll('.sticker').forEach(s => s.remove());
  document.querySelectorAll('.emoji-sticker, .sticker-option').forEach(s => s.classList.remove('selected'));
}

// Thêm sticker emoji (trong edit mode)
function addSticker(emoji) {
  removeStickers();

  const wrappers = photostripPreview.querySelectorAll('.photo-wrapper');
  const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  wrappers.forEach((wrapper, index) => {
    const sticker = document.createElement('div');
    sticker.classList.add('sticker', positions[index % positions.length]);
    sticker.textContent = emoji;
    wrapper.appendChild(sticker);
  });
}

// Thêm sticker ảnh (trong edit mode)
function addImageSticker(url) {
  removeStickers();

  const wrappers = photostripPreview.querySelectorAll('.photo-wrapper');
  const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  wrappers.forEach((wrapper, index) => {
    const sticker = document.createElement('img');
    sticker.classList.add('sticker', positions[index % positions.length]);
    sticker.src = url;
    sticker.style.width = '40px';
    sticker.style.height = '40px';
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
    img.style.filter = filter === 'none' ? '' : filter;
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
      photostripPreview.appendChild(dateEl);
    }
  } else {
    if (existingDate) existingDate.remove();
  }
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
  html2canvas(photostripPreview).then(canvas => {
    const link = document.createElement('a');
    link.download = 'photostrip.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
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

  thumbnails.forEach((img, i) => {
    img.src = urls[i];
    img.style.display = 'block';
  });
  starMessage.style.display = 'block';
  afterButtons.style.display = 'flex';
  startBtn.style.display = 'none';
}