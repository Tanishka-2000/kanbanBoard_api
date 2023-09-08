const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// requring routers
const userRouter = require('./api/user');
const boardRouter = require('./api/board');

// initailizing app
const app = express();

// connecting to database
mongoose.connect(process.env.MONGODB_URL) 
.then(() => console.log('connected to database'))
.catch( error => console.log(error));

// reading json and form data
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// allowing cors request
app.use(cors());

// configuring passport with jwt strategy
const passport = require('passport');
const jwtStrategy = require('./strategies/jwt');
passport.use(jwtStrategy);

// routers
app.use('/', userRouter);
app.use('/board', passport.authenticate('jwt', {session: false}), boardRouter);

const port = process.env.PORT || 4000
app.listen(port, () => console.log('app listening on port ' + port));