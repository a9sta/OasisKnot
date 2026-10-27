/** 미리보기용 서버. 정적 자산 호스팅과 같은 방식으로 /경로/ → /경로/index.html 을 내준다.
 *  node scripts/serve.mjs [포트]   기본 8788 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const PORT = Number(process.argv[2] || 8788);
const TYPE = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(DIST, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    const alt = path.join(DIST, p, 'index.html');
    if (fs.existsSync(alt)) f = alt;
    else {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(path.join(DIST, '404.html')));
    }
  }
  res.writeHead(200, { 'content-type': TYPE[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
}).listen(PORT, () => console.log(`http://127.0.0.1:${PORT}/`));
