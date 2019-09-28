const express = require('express');
const redis = require('redis');
const dotenv = require('dotenv');

//configure environment variables
dotenv.config();


const app = express();

app.listen(process.env.PORT, () => console.log(`Server listening on ${process.env.PORT}`));