const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = express();

//configure environment variables
dotenv.config();

//Importing Routes
const adminRoute = require('./routes/auth/admin');
const userRoute = require('./routes/auth/user');
const teamRoute = require('./routes/teams');
const fixtureRoute = require('./routes/fixtures');

//Middleware
app.use(express.json());

//connect to mongoDB
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.DB_CONNECT,
    { useNewUrlParser: true},
    () => console.log('Successfully Connected to DB'));


//Route Middleware
app.use('/api/v1', adminRoute); //admin users route
app.use('/api/v1', userRoute);  //normal users route
app.use('/api/v1', teamRoute);   //teams route
app.use('/api/v1', fixtureRoute);   //fixtures route

app.listen(process.env.PORT, () => console.log(`Server listening on ${process.env.PORT}`));