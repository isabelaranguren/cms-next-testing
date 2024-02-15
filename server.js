require('dotenv').config(); // Load environment variables from .env.local file
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const axios = require('axios'); // You may need to install axios: npm install axios

const dev = process.env.NODE_ENV !== 'production';
const port = 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // If the request is not for the GraphQL endpoint, handle it with Next.js
      if (pathname !== '/graphql') {
        await handle(req, res, parsedUrl);
        return;
      }

      // If the request is for the GraphQL endpoint, proxy it
      const apiUrl = 'http://cms.stagingseo.com/graphql';
      const response = await axios.post(apiUrl, req.body, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      res.setHeader('Content-Type', 'application/json');
      res.status(response.status).send(response.data);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});
