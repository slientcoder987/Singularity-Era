// 零依赖 Node.js 静态文件服务器 - 用于运行打包后的游戏
// 支持 MIME 类型、SPA 路由回退、自动端口选择
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, 'dist');
const PORT = 5174;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(DIST_DIR, safePath);

    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!existsSync(filePath)) {
      const indexPath = join(DIST_DIR, 'index.html');
      if (existsSync(indexPath)) {
        const data = await readFile(indexPath);
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(data);
        return;
      }
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      const indexPath = join(filePath, 'index.html');
      if (existsSync(indexPath)) {
        const data = await readFile(indexPath);
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(data);
        return;
      }
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`\n  Game server started`);
  console.log(`  URL: ${url}\n`);
  console.log(`  Press Ctrl+C to stop\n`);

  import('node:child_process').then(({ exec }) => {
    exec(`start "" "${url}"`);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use, please close the program using it and retry`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
