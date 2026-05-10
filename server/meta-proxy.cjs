const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 简单解析 .env 文件
const loadEnv = () => {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (!process.env[key]) process.env[key] = value;
        }
      });
    } catch (e) {
      // 忽略找不到的 .env
    }
  }
};
loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase URL or Anon Key in environment variables.");
  process.exit(1);
}

const PORT = process.env.PORT || 8787;
const HTML_PATHS = [
  path.join('/opt/1panel/apps/openresty/openresty/www/sites/861866.xyz/index', 'index.html'), // 正式服路径
  path.join(process.cwd(), 'dist', 'index.html'), // 本地 build 路径
  path.join(process.cwd(), 'index.html') // 降级本地路径
];

// 获取第一个存在的 index.html
function getIndexHtml() {
  for (const p of HTML_PATHS) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf8');
    }
  }
  return '<!DOCTYPE html><html><head><title>静园</title></head><body>Server Error: index.html not found</body></html>';
}

function fetchSupabase(table, id, select) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&select=${select}`;
    https.get(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            resolve(json[0] || null);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Status Code: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

// 简单清除 HTML 标签提取纯文本作为摘要
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
}

function generateMetaTags(title, description, imageUrl, url) {
  const safeTitle = title.replace(/"/g, '&quot;');
  const safeDesc = description.replace(/"/g, '&quot;');
  let safeImage = imageUrl || '/pwa-icon-512.webp';
  if (!safeImage.startsWith('http://') && !safeImage.startsWith('https://')) {
    if (!safeImage.startsWith('/')) {
      safeImage = '/' + safeImage;
    }
    safeImage = 'https://861866.xyz' + safeImage;
  }
  return `
    <title>${safeTitle} - 静园</title>
    <meta name="description" content="${safeDesc}" />
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDesc}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDesc}">
    <meta name="twitter:image" content="${safeImage}">
  `;
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `https://861866.xyz`);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  let html = getIndexHtml();

  try {
    const injectMeta = (htmlContent, metaStr) => {
      return htmlContent
        .replace(/<title>.*?<\/title>/i, '')
        .replace(/<meta name="description"([^>]+)?>/i, '')
        .replace(/<meta property="og:image"([^>]+)?>/i, '')
        .replace(/<meta name="twitter:card"([^>]+)?>/i, '')
        .replace(/<meta name="twitter:image"([^>]+)?>/i, '')
        .replace('</head>', metaStr + '\n  </head>');
    };

    if (pathParts.length === 2 && pathParts[0] === 'article') {
      const id = pathParts[1];
      const data = await fetchSupabase('articles', id, 'title,excerpt,content,cover_image');
      if (data) {
        const desc = data.excerpt || stripHtml(data.content) || '静园文章分享';
        let img = null;
        if (data.cover_image) {
          if (data.cover_image.startsWith('http://') || data.cover_image.startsWith('https://')) {
            img = data.cover_image;
          } else {
            img = `${SUPABASE_URL}/storage/v1/object/public/article-covers/${data.cover_image}`;
          }
        }
        const newMeta = generateMetaTags(data.title, desc, img, urlObj.href);
        html = injectMeta(html, newMeta);
      }
    } else if (pathParts.length === 2 && pathParts[0] === 'topic') {
      const id = pathParts[1];
      const data = await fetchSupabase('topics', id, 'title,content');
      if (data) {
        const desc = stripHtml(data.content) || '静园话题分享';
        const newMeta = generateMetaTags(data.title, desc, null, urlObj.href);
        html = injectMeta(html, newMeta);
      }
    }
  } catch (err) {
    console.error(`[Meta Proxy] Error rendering ${req.url}:`, err.message);
    // Fallback to original html on error
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Meta proxy running at http://127.0.0.1:${PORT}/`);
});
