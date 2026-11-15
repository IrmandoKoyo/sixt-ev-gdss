/* Menyinkronkan public/dssclass/* ke root public/* agar proyek berjalan 100% baik
   saat diakses dari root domain (/) maupun dari subpath (/dssclass) di Cloudflare Pages & Vercel. */
const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

const pubDir = path.join(__dirname, '..', 'public');
const dssDir = path.join(pubDir, 'dssclass');

copyRecursive(path.join(dssDir, 'index.html'), path.join(pubDir, 'index.html'));
copyRecursive(path.join(dssDir, 'assets'), path.join(pubDir, 'assets'));

// Cloudflare Pages _redirects file
fs.writeFileSync(
  path.join(pubDir, '_redirects'),
  '/dssclass /dssclass/index.html 200\n/dssclass/* /dssclass/:splat 200\n',
  'utf8'
);

console.log('Synchronized public/dssclass -> public/ root mirror successfully.');
