const JwtStrategy = require('passport-jwt').Strategy,
      ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User.js');

module.exports = new JwtStrategy({
    jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey : process.env.JWT_SECRET
}, function(jwt_payload, done) {
    User.findById(jwt_payload.sid, '_id')
    .then((user) => {
        if (!user) {
            return done(err, false);
        }
        else {
            return done(null, user);
        }
    });
});