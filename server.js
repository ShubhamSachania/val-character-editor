const http = require('http');
const fs = require('fs');
const path = require('path');
const { decodeFch, encodeFch } = require('./fch_codec');

const PORT = process.env.PORT || 3000;
const WORKSPACE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.fch': 'application/octet-stream',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Decode uploaded .fch binary file
  if (pathname === '/api/upload-fch' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const fullBuf = Buffer.concat(chunks);
        let rawFchBuf = fullBuf;
        // Check if multipart form-data
        const boundaryIdx = fullBuf.indexOf(Buffer.from('\r\n\r\n'));
        if (boundaryIdx !== -1 && fullBuf.slice(0, 10).toString().includes('---')) {
          const endBoundaryIdx = fullBuf.lastIndexOf(Buffer.from('\r\n--'));
          rawFchBuf = fullBuf.subarray(boundaryIdx + 4, endBoundaryIdx !== -1 ? endBoundaryIdx : undefined);
        }

        const decoded = decodeFch(rawFchBuf);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(decoded));
      } catch (err) {
        console.error('Upload decode error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to decode .fch file: ' + err.message }));
      }
    });
    return;
  }

  // API: Export .fch binary blob for browser download
  if (pathname === '/api/export-fch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const charData = JSON.parse(body);
        const encodedBuf = encodeFch(charData);
        const fileName = `${charData.playerName || 'character'}.fch`;

        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': encodedBuf.length
        });
        res.end(encodedBuf);
      } catch (err) {
        console.error('Export error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API: Save modified character to specified file in workspace
  if (pathname === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const charData = payload.characterData || payload;
        const filename = payload.filename || `${charData.playerName || 'character'}.fch`;
        const encodedBuf = encodeFch(charData);

        const targetFchPath = path.join(WORKSPACE_DIR, filename);
        // Create backup if file already existed
        if (fs.existsSync(targetFchPath)) {
          const bakPath = targetFchPath + '.bak';
          fs.copyFileSync(targetFchPath, bakPath);
        }

        fs.writeFileSync(targetFchPath, encodedBuf);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Saved successfully to ${filename}!` }));
      } catch (err) {
        console.error('Save error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(WORKSPACE_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n============================================================`);
  console.log(`  🛡️ VALHEIM INVENTORY & CHARACTER FORGE SERVER STARTED`);
  console.log(`  🔗 Web App running on port ${PORT}`);
  console.log(`============================================================\n`);
});
