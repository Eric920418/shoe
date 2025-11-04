import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const httpsPort = parseInt(process.env.HTTPS_PORT || '443', 10);
const httpPort = parseInt(process.env.HTTP_PORT || '80', 10);

// 準備 Next.js 應用
const app = next({ dev, hostname, port: httpsPort });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpsOptions = {
    key: readFileSync(join(process.cwd(), 'ssl', 'private.key')),
    cert: readFileSync(join(process.cwd(), 'ssl', 'fullchain.pem')),
  };

  // HTTPS 伺服器
  createHttpsServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error('HTTPS Server Error:', err);
      process.exit(1);
    })
    .listen(httpsPort, () => {
      console.log(`> HTTPS Server ready on https://${hostname}:${httpsPort}`);
      console.log(`> Environment: ${dev ? 'development' : 'production'}`);
    });

  // HTTP 伺服器（重定向到 HTTPS）
  createHttpServer((req, res) => {
    const host = req.headers.host?.split(':')[0] || hostname;
    const redirectUrl = `https://${host}${httpsPort !== 443 ? `:${httpsPort}` : ''}${req.url}`;

    res.writeHead(301, { Location: redirectUrl });
    res.end();
  })
    .once('error', (err) => {
      console.error('HTTP Redirect Server Error:', err);
      // HTTP 伺服器失敗不影響 HTTPS 伺服器
    })
    .listen(httpPort, () => {
      console.log(`> HTTP Redirect Server ready on http://${hostname}:${httpPort}`);
    });
});
