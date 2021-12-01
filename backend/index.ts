import express from 'express';
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const http = require('http');

const EXPRESS_APP = express();

EXPRESS_APP.use(express.urlencoded({ extended: true }));
EXPRESS_APP.use(express.json());

const PORT = process.env.PORT || 5000;

const SERVER = http
  .createServer(EXPRESS_APP)
  .listen(
    PORT,
    console.log(`Https server running in ${process.env.NODE_ENV} mode on port ${PORT}`),
  );

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error:`);
  SERVER.close(() => process.exit(1));
});
