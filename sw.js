/* Service worker: lưu sẵn các file của app trong máy để mở được khi không có mạng.
   MỖI LẦN SỬA FILE CỦA APP: tăng số PHIEN_BAN để điện thoại tải bản mới. */
const PHIEN_BAN = 'so-tap-v3';
const FILE_APP = [
  './',
  'index.html',
  'css/app.css',
  'js/du-lieu.js',
  'js/kien-thuc.js',
  'js/du-lieu-opengym.js',
  'js/du-lieu-anh.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];
const FONT = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
/* ảnh minh hoạ (~3 MB): bộ nhớ riêng, giữ qua các phiên bản. Đổi ảnh thì đổi tên này (anh-v2...) để tải lại. */
const ANH_CACHE = 'anh-v1';
importScripts('js/du-lieu-anh.js'); /* lấy bảng ANH: danh sách ảnh cần lưu */
const FILE_ANH = [...new Set(Object.values(ANH))].flatMap(f => [`anh/${f}-0.webp`, `anh/${f}-1.webp`]);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(PHIEN_BAN).then(c => c.addAll(FILE_APP)).then(() => self.skipWaiting()));
});

/* xoá bộ nhớ của phiên bản cũ */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== PHIEN_BAN && k !== 'font' && k !== ANH_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      /* tải ngầm ảnh còn thiếu; ảnh nào lỗi thì bỏ qua, sẽ được lưu khi xem tới (xem fetch bên dưới) */
      .then(() => caches.open(ANH_CACHE)).then(c => Promise.all(FILE_ANH.map(f =>
        c.match(f).then(hit => hit || fetch(f).then(r => r.ok && c.put(f, r)).catch(() => {})))))
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  /* font Google: lấy từ bộ nhớ nếu có, không thì tải rồi lưu lại */
  if (FONT.test(req.url)) {
    e.respondWith(caches.open('font').then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }))));
    return;
  }
  if (new URL(req.url).origin !== location.origin) return;
  /* ảnh minh hoạ chưa có trong bộ nhớ: tải rồi lưu lại */
  if (new URL(req.url).pathname.includes('/anh/')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(ANH_CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  /* file của app: lấy từ bộ nhớ trước (mở ngay, không cần mạng) */
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).catch(() =>
      req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
  );
});
