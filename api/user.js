const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/signup', (req, res) => {

  // generating hash from password
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if(err) return res.status(500).json(err);

    // create user
    User.create({
        username: req.body.username,
        passwordHash: hash
    }).then((user) => {
      
      const token = jwt.sign({sid: user._id}, process.env.JWT_SECRET);
      console.log(token);
      res.json({ token });
    });
  });
});

router.post('/login', (req, res) => {
  
  User.findOne({'username': req.body.username}, '_id username, passwordHash')
  .then((user) => {

    if(!user) return res.status(400).json({message: 'no such username exist'});
    
    bcrypt.compare(req.body.password, user.passwordHash, (err, result) => {
      
      if(!result) return res.status(400).json({message: 'incorrect password'});
      const token = jwt.sign({sid: user._id}, process.env.JWT_SECRET);
      res.json({ token });
    });
  });
});

module.exports = router;