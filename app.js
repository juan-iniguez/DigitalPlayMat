const express = require('express');
const router = express.Router();
const expressEJSLayouts = require('express-ejs-layouts');
const sharp = require('sharp');
const multer = require('multer');
const socketio = require('socket.io');
const storage = multer.memoryStorage();
const https = require('https')
const fs = require('fs');
const compression = require('compression')
const tls = require('tls')
const session = require('express-session')
const genPassword = require('./lib/passwordUtils').genPassword;
const passport = require('passport')
const connection = require('./config/database.js');
const MongoStore = require('connect-mongo')
const mongoose = require('mongoose')
const Maps = connection.models.Maps;
const app = express();

const options = {
    key: fs.readFileSync("./keys/localhost.key"),
    cert: fs.readFileSync("./keys/localhost.cert"),
};
const server = https.createServer(options ,app);


const io = socketio(server);
const PORT = process.env.PORT || 443;

const upload = multer({ storage: storage });
const upload_ = multer({ dest: './public/maps/' })
const { diskStorage } = require('multer');

const sessionStore = MongoStore.create({
    mongoUrl: process.env.DND_DB,
    collection: 'sessions'
})


require('dotenv').config();
require('./config/passport');
console.log('Passport is Ready')

app.use(compression())

app.use(expressEJSLayouts)
app.set('view engine', 'ejs')
app.set('layout', 'layout1')
app.use('/assets' ,express.static('./assets'))
app.use('/' ,express.static('./public'))
// app.use(express.json({ limit: '50mb'}));
// app.use(express.urlencoded({ limit: '50mb', extended: true})); 

// Sessions

app.use(
    session({
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: true,
        store: sessionStore,
        cookie: {
            maxAge: 1000*60*60*24,
            sameSite: 'lax',
            secure: true
        }
}))

console.log('Express Sessions Ready')
    
// PASSPORT AUTHENTICATION
    
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {   
        console.log(req.session);
        console.log(req.user);
        next();
});

app.use(router)

// Routing GET REQUESTS

router.get('/', (req,res,next)=>{

    // Socket Open Connection
    io.on('connection', socket=>{
        socket.emit('message', 'You are connected...')
        console.log(socket.id)
    })

    let introFile = fs.readFileSync('./assets/snippets/intro.html')
    res.render('start' , {title: 'DnD Map | Rolfe Shepsky (C) ', stylesheet: introFile})
})

// TODO : CREATE A LOGIN AND SIGN UP PAGE
// MAKE A PLAYER SITE AND A DM SITE
// CONNECT THE DM ROOM TO THE PLAYER ROOM WITH SOCKET.IO


router.get('/dm-side', (req,res,next)=>{

    io.on('connection', socket=>{
        socket.emit('message', 'You are connected...')
        console.log(socket.id)
    })

    let dmFile = fs.readFileSync('./assets/snippets/dmFile.html')
    res.render('dnd' , {title: 'DnD Map | Rolfe Shepsky (C) ',stylesheet: dmFile})
})

// POST REQUESTS 

router.post('/login', async function(req, res, next) {

    const existUsername = await User.findOne({ username: req.body.username});

    if (!existUsername) {
        res.send('username not found');
      }else{          

    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.send('username and password incorrect'); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.send('/equipment');
      });
    })(req, res, next);
}});

router.post('/register', async (req,res,next)=>{
    const saltHash = genPassword(req.body.password);

    const salt = saltHash.salt;
    const hash = saltHash.hash;
    
    // Validation if Already Existst
    const existUsername = await User.findOne({ username: req.body.username});
    // Execution of the Query
    if (existUsername) {
      res.send('username taken');
    }else{        
        const newUser = new User({
            username: req.body.username,
            hash: hash,
            salt: salt
        });
    
        newUser.save()
           .then((user) => {
            //    console.log(user);
            });
            res.send('/login');
        }
});

router.post('/img-process', upload.single('img-edit'), (req,res,next)=>{

    let originalImage = req.file
    let outputImage = undefined;

    sharp(originalImage.buffer)
    .resize(256, 256, {
        fit: 'cover'
    })
    .toBuffer((err,data,info)=>{
        outputImage = data.toString('base64')
        // console.log(data)
        // console.log(err)
        // console.log()
        res.send(`data:image/${req.file.mimetype.split('/')[1]};base64,${outputImage}`)
    })


})

router.post('/tokens-upload', upload.array('tokens'), (req,res,next)=>{
    console.log(req.files)
})

router.post('/addMap', upload_.single('map'), (req,res,next)=>{
    let mapImage = req.file
    let mimetype = mapImage.mimetype.split('/')[1]

    console.log(mapImage)

    let Olddest = req.file.destination + req.file.filename
    let newDest = req.file.destination + req.file.originalname + '.' + mimetype


    fs.rename( Olddest , newDest, (err)=>{
        if(err){
            res.send(err)
        }else{
            res.send('Done!')
        }
    })
})

let DEVADDRESS = process.env.DEV

server.listen(PORT, DEVADDRESS || '192.168.1.148', ()=>{console.log(`Server running on port ${PORT}`)})