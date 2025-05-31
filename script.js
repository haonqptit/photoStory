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

// Chụp ảnh từ video
function takePhoto() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

// Xóa ảnh thumbnail
function clearThumbnails() {
  thumbnails.forEach(img => {
    img.src = '';
    img.style.display = 'none';
  });
}

// Chụp 4 ảnh liên tiếp
async function takePhotosSequence() {
  clearThumbnails();
  starMessage.style.display = 'none';

  for (let i = 0; i < thumbnails.length; i++) {
    await showCountdown(3);
    thumbnails[i].src = takePhoto();
    thumbnails[i].style.display = 'block';
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

// Xóa sticker
function removeStickers() {
  photostripPreview.querySelectorAll('.sticker').forEach(s => s.remove());
  document.querySelectorAll('.emoji-sticker, .sticker-option').forEach(s => s.classList.remove('selected'));
}

// Thêm sticker emoji
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

// Thêm sticker ảnh
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

// Ảnh test
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
