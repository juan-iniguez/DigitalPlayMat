const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const connection = require('./database');
const User = connection.models.User;
const validPassword = require('../lib/passwordUtils').validPassword


const customFields = {
    usernameField: 'username',
    passwordField: 'password'
}

const verifyCallback = (username, password, done) =>{

    User.findOne({ username: username })
        .then((user)=> {

            if(!user) {
                console.log('User Not Found')
                return done(null,false) 
            }

            const isValid = validPassword(password, user.hash, user.salt);

            if(isValid) {
                console.log('User is Found')
                console.log(user)
                return done(null, user);
            } else {
                return done(null, false);
            }
        })
        .catch((err) => {
            done(err);
        })
}

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.use(strategy); 

passport.serializeUser((user, done) => {
    console.log(`this is ${user.id}`)
    done(null, user.id);
})

passport.deserializeUser((userId,done) => {
    User.findById(userId)
        .then((user) => {
            done(null,user);
        })
        .catch(err => done(err))
})