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
const User = connection.models.User;
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
app.use(express.json({ limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb', extended: true})); 

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
        // console.log(req.session);
        // console.log(req.user);
        next();
});

app.use(router)

// Routing GET REQUESTS

router.get('/', (req,res,next)=>{

    let indexCSS = fs.readFileSync('./assets/snippets/indexCSS.html')
    res.render('index' , {title: 'Digital Play Mat | Rolfe Shepsky (C) ', stylesheet: indexCSS})

    // res.render('start' , {title: 'DnD Map | Rolfe Shepsky (C) ', stylesheet: introFile})
})

router.get('/campaign/:id', (req,res,next)=>{
    // Load an Already made campaign

    io.on('connection', socket=>{
        socket.emit('message', 'You are connected...')
        console.log(socket.id)
    })

    let dmFile = fs.readFileSync('./assets/snippets/dmFile.html')
    res.render('DM-Site' , {title: 'DnD Map | Rolfe Shepsky (C) ',stylesheet: dmFile})


})

router.get('/new-campaign', (req,res,next)=>{

    // Socket Open Connection
    io.on('connection', socket=>{
        socket.emit('message', 'You are connected...')
        // console.log(socket.id)
    })

    let newCampaignMap = fs.readFileSync('./assets/snippets/newCampaignMap.html')
    res.render('newCampaign' , {title: 'DnD Map | Rolfe Shepsky (C) ', stylesheet: newCampaignMap})
})

router.get('/getCampaigns', (req,res,next)=>{
    console.log(req.user.campaigns)
    let data = {
        campaigns: req.user.campaigns
    }
    res.send(data)
})

router.get('/player/:id', (req,res,next)=>{

})

// MAKE SCROLLING TO ZOOM OUT DONE
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

router.get('/preview/:id', (req,res,next)=>{
    console.log(req.params.id)
    let id = req.params.id
    let originalImage = fs.readFileSync(__dirname + `/public/maps/${id}`)
    let outputImage = undefined;

    sharp(originalImage)
    .resize(256, 256, {
        fit: 'cover'
    })
    .toBuffer((err,data,info)=>{
        outputImage = Buffer.from(data, 'base64')

        res.writeHead(200, {
            'Content-Type':'image/png',
            'Content-Length': outputImage.length
        });

        res.end(outputImage);
    })


})

// POST REQUESTS 

router.post('/login', async function(req, res, next) {
    // console.log(req.body)

    let quotes = [
        '“The Study of philosophy is not that we may know what men have thought, but what the truth of things is.” —Thomas Aquinas', '“What is better than wisdom? Woman. And what is better than a good woman? Nothing.” —Geoffrey Chaucer', '“The nourishment of body is food, while the nourishment of the soul is feeding others.” —`Alī ibn Abī Ṭālib, Caliph', '“Justice is the constant and perpetual wish to render every one his due.” —Emperor Justinian',
    ]

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }

    let n_ = getRandomInt(0, quotes.length-1)
    // console.log(n_)
    let dP = {
        status: 'Successful Log In',
        quotes: quotes[n_],
    }

    const existUsername = await User.findOne({ username: req.body.username});

    if (!existUsername) {
        res.send('username not found');
      }else{          

    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.send('username and password incorrect'); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.send(dP);
      });
    })(req, res, next);
}
});

router.post('/logout', (req, res, next) => {
    req.logout();
    res.send('/login');
});

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
            name: req.body.name,
            username: req.body.username,
            hash: hash,
            salt: salt
        });
    
        newUser.save()
           .then((user) => {
            //    console.log(user);
            });
            res.send('success');
        }
});

router.post('/img-process', upload.single('img-edit'), (req,res,next)=>{

    let originalImage = req.file
    let outputImage = undefined;
    console.log(req.file)
    sharp(originalImage.buffer)
    .resize(256, 256, {
        fit: 'cover'
    })
    .toBuffer((err,data,info)=>{
        outputImage = data.toString('base64')
        // console.log(data)
        // console.log(err)
        // console.log()
        let package = {
            URI: `data:image/${req.file.mimetype.split('/')[1]};base64,${outputImage}`,
            name: req.file.originalname,
        }
        res.send(package)
    })


})

router.post('/tokens-upload', upload.array('tokens'), (req,res,next)=>{
    console.log(req.files)
})

router.post('/addMap', upload_.single('map'), (req,res,next)=>{
    let mapImage = req.file
    let mimetype = mapImage.mimetype.split('/')[1]
    let Olddest = req.file.destination + req.file.filename
    let newDest = req.file.destination + req.file.originalname + '.' + mimetype

    fs.rename( Olddest , newDest, (err)=>{
        if(err){
            res.send(err)
            console.log(err)
        }else{
            res.send('Done!')
        }
    })
})

router.post('/addMaps', upload_.array('map'), (req,res,next)=>{

    console.log(req.files)
    // res.send(req.files)

    // Maps in the files
    let maps = req.files

    // Mimetype Array
    let mimetype = []

    for(let el of maps){

        let Olddest = el.destination + el.filename
        let newDest = el.destination + el.originalname + '.' + el.mimetype.split('/')[1]
    
        fs.rename( Olddest , newDest, (err)=>{
            if(err){
                res.send(err)
            }else if(maps.indexOf(el) === maps.length-1){
                res.send('Done!')
            }else{
                console.log('not yet')
            }
        })
    }
})

router.post('/createCampaign', (req,res,next)=>{
    console.log(req.body.campaign)
    console.log(req.body.description)

    let campaigns = {
        name: String,
        description: String,
        maps: [],
        date: Date,
        time: String,
    }

    campaigns.name = req.body.campaignName;
    campaigns.description = req.body.description;
    campaigns.maps = req.body.maps;
    campaigns.date = new Date();
    campaigns.time = campaigns.date;

    async function uploadUserDB(){
        try {
            const user = await User.findByIdAndUpdate(req.user._id, {$push: {campaigns: campaigns}});
            res.send(user)
        } catch (error) {
            console.log(error)
        }
    }
    uploadUserDB();


})

router.post('/getMainCanvas', (req,res,next)=>{
    // console.log(req.body)
    console.log(req.user)
    let index = undefined;

    for(let el of req.user.campaigns){
        if(el.name === req.body.campaign){
            index = req.user.campaigns.indexOf(el)
        }
    }

    let data = {
        img:req.user.campaigns[index].maps[0],
        name:req.user.campaigns[index].maps[0].split('.')[0]
    }

    res.send(data)
})

server.listen(PORT || 443, ()=>{console.log(`Server running on port ${PORT}`)})