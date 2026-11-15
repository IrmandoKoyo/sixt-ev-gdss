/* Menyinkronkan public/dssclass/* ke root public/* serta root repositori (dssclass/, assets/, index.html)
   agar proyek berjalan 100% baik saat diakses dari root domain (/) maupun dari subpath (/dssclass)
   di Vercel (baik Output Directory = '.' maupun 'public') dan Cloudflare Pages. */
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

const rootDir = path.join(__dirname, '..');
const pubDir = path.join(rootDir, 'public');
const dssDir = path.join(pubDir, 'dssclass');

// 1. Mirror ke public/index.html & public/assets
copyRecursive(path.join(dssDir, 'index.html'), path.join(pubDir, 'index.html'));
copyRecursive(path.join(dssDir, 'assets'), path.join(pubDir, 'assets'));

// 2. Mirror ke root repositori agar Vercel (default Output Directory = '.') langsung menemukan /dssclass & /index.html
copyRecursive(dssDir, path.join(rootDir, 'dssclass'));
copyRecursive(path.join(dssDir, 'index.html'), path.join(rootDir, 'index.html'));
copyRecursive(path.join(dssDir, 'assets'), path.join(rootDir, 'assets'));

// 3. Cloudflare Pages _redirects file
const redirectsContent = '/dssclass /dssclass/index.html 200\n/dssclass/* /dssclass/:splat 200\n';
fs.writeFileSync(path.join(pubDir, '_redirects'), redirectsContent, 'utf8');
fs.writeFileSync(path.join(rootDir, '_redirects'), redirectsContent, 'utf8');

console.log('Synchronized public/dssclass -> public/ and repo root mirror successfully.');
