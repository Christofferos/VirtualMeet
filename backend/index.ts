import express from 'express';
import path from 'path';
import http from 'http';

const PORT = process.env.PORT || 8989;
const EXPRESS_APP = express();

const httpServer = http.createServer(EXPRESS_APP);

EXPRESS_APP.use(express.json());
EXPRESS_APP.use(express.urlencoded({ extended: true }));

// Serve client static files
const publicPath = path.join(path.resolve(), '..', 'frontend', 'build');
EXPRESS_APP.use(express.static(publicPath));

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server listening for requests on http://localhost:${PORT}`);
});
