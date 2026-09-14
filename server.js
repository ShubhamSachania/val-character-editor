const http = require('http');
const fs = require('fs');
const path = require('path');
const { decodeFch, encodeFch, cleanCharacterCheats, getCheatedStats } = require('./fch_codec');

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

function getKnownSaveDirectories() {
  const dirs = [];
  
  // 1. OnlineFix / Steam Platform save location
  const onlineFixDir = 'C:\\Users\\Public\\Documents\\OnlineFix\\892970\\Saves\\characters';
  if (fs.existsSync(onlineFixDir)) {
    dirs.push({ name: 'Active Game Saves (OnlineFix/Platform)', path: onlineFixDir, active: true });
  }

  // 2. Standard LocalLow location
  if (process.env.USERPROFILE) {
    const localLowDir = path.join(process.env.USERPROFILE, 'AppData', 'LocalLow', 'IronGate', 'Valheim', 'characters_local');
    if (fs.existsSync(localLowDir)) {
      dirs.push({ name: 'LocalLow Characters (Local)', path: localLowDir, active: false });
    }
  }

  // 3. Workspace directory
  dirs.push({ name: 'Editor Workspace Folder', path: WORKSPACE_DIR, active: false });

  return dirs;
}

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

  // API: Get list of known system save locations & character files
  if (pathname === '/api/system-saves' && req.method === 'GET') {
    try {
      const dirs = getKnownSaveDirectories();
      const results = [];
      const flatSaves = [];

      for (const d of dirs) {
        if (!fs.existsSync(d.path)) continue;
        const files = fs.readdirSync(d.path)
          .filter(f => f.endsWith('.fch') && !f.endsWith('.bak') && !f.includes('_backup_'))
          .map(f => {
            const fullPath = path.join(d.path, f);
            const stats = fs.statSync(fullPath);
            let cheatInfo = null;
            let playerName = f.replace('.fch', '');
            try {
              const buf = fs.readFileSync(fullPath);
              const decoded = decodeFch(buf);
              cheatInfo = getCheatedStats(decoded);
              if (decoded.playerName) playerName = decoded.playerName;
            } catch (e) {}

            const saveObj = {
              name: playerName,
              playerName,
              fileName: f,
              filename: f,
              fullPath,
              filePath: fullPath,
              category: d.name,
              type: d.active ? 'active' : (d.path.includes('AppData') ? 'locallow' : 'workspace'),
              sizeBytes: stats.size,
              modified: stats.mtime,
              usedCheats: cheatInfo ? cheatInfo.characterCheated : false,
              cheatedItemsCount: cheatInfo ? cheatInfo.cheatedItemsCount : 0,
              cheatInfo
            };
            flatSaves.push(saveObj);
            return saveObj;
          });

        results.push({
          category: d.name,
          dirPath: d.path,
          active: d.active,
          files
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ saves: flatSaves, categories: results }));
    } catch (err) {
      console.error('System saves list error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API: Load .fch directly from a system file path (GET or POST)
  if (pathname === '/api/load-from-path') {
    const handleLoadPath = (targetPath) => {
      try {
        if (!targetPath || !fs.existsSync(targetPath)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Target file does not exist: ' + targetPath }));
          return;
        }

        const buf = fs.readFileSync(targetPath);
        const decoded = decodeFch(buf);
        decoded._filePath = targetPath;
        decoded._cheatStats = getCheatedStats(decoded);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(decoded));
      } catch (err) {
        console.error('Load from path error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    };

    if (req.method === 'GET') {
      const targetPath = url.searchParams.get('path');
      handleLoadPath(targetPath);
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { filePath } = JSON.parse(body);
          handleLoadPath(filePath);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        }
      });
      return;
    }
  }

  // API: Save .fch directly to any system file path
  if (pathname === '/api/save-to-path' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const charData = payload.characterData;
        const targetPath = payload.filePath;

        if (!targetPath) {
          throw new Error('Target filePath is required.');
        }

        const encodedBuf = encodeFch(charData);

        // Create backup if file existed
        if (fs.existsSync(targetPath)) {
          const bakPath = targetPath + '.bak';
          fs.copyFileSync(targetPath, bakPath);
        }

        fs.writeFileSync(targetPath, encodedBuf);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `Saved successfully to ${targetPath}!`,
          cheatStats: getCheatedStats(charData)
        }));
      } catch (err) {
        console.error('Save to path error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API: Revert cheats & restore achievements on character & inventory
  if (pathname === '/api/revert-cheats' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        let charData = payload.characterData;
        const filePath = payload.filePath;

        if (!charData && filePath && fs.existsSync(filePath)) {
          const buf = fs.readFileSync(filePath);
          charData = decodeFch(buf);
        }

        if (!charData) {
          throw new Error('No characterData or valid filePath provided.');
        }

        // Clean cheats
        cleanCharacterCheats(charData);

        // If filePath provided, write clean version to disk
        if (filePath && fs.existsSync(filePath)) {
          const bakPath = filePath + '.bak_before_cheat_clear';
          if (!fs.existsSync(bakPath)) {
            fs.copyFileSync(filePath, bakPath);
          }
          const cleanBuf = encodeFch(charData);
          fs.writeFileSync(filePath, cleanBuf);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Cheats purged! Character and inventory cleansed for achievements.',
          characterData: charData,
          cheatStats: getCheatedStats(charData)
        }));
      } catch (err) {
        console.error('Revert cheats error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
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
        res.end(JSON.stringify({
          ...decoded,
          cheatStats: getCheatedStats(decoded)
        }));
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
        if (fs.existsSync(targetFchPath)) {
          const bakPath = targetFchPath + '.bak';
          fs.copyFileSync(targetFchPath, bakPath);
        }

        fs.writeFileSync(targetFchPath, encodedBuf);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `Saved successfully to ${filename}!`,
          cheatStats: getCheatedStats(charData)
        }));
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
