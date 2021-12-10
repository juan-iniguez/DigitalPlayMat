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
const Campaign = connection.models.Campaign;
const app = express();


const options = {
    key: fs.readFileSync("./keys/localhost.key"),
    cert: fs.readFileSync("./keys/localhost.cert"),
};
const server = https.createServer(options ,app);


const io = socketio(server);
const PORT = process.env.PORT || 443;

const upload = multer({ storage: storage });
const upload_ = multer({ dest: __dirname + '/public/maps/' })


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
app.use('/assets' ,express.static(__dirname + '/assets'))
app.use('/' ,express.static(__dirname + '/public'))
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

let allClients = [];

io.on('connection', socket=>{
    allClients.push(socket.id)
    socket.emit('message', 'You are connected...')
    socket.on('send-message', (message, room, username) =>{
        socket.broadcast.to(room).emit("receive-message", message , room, username)
    })
    socket.on('join-room', room=>{
        socket.join(room)
    })
    socket.on('new-user', (username , privateID)=>{
        socket.broadcast.emit("user-connected", username , privateID)
    })
    socket.on('user-list', Users=>{
        socket.broadcast.emit("phonebook", Users)
    })
    socket.on('disconnect', ()=>{
        var i = allClients.indexOf(socket.id);
        allClients.splice(i, 1);
        socket.broadcast.emit('user-disconnected', socket.id)
    })
    socket.on('send-character', character=>{
        socket.broadcast.emit("new-character", character)
    })
    socket.on('position-change', (tpos)=>{
        socket.broadcast.emit('position-update', (tpos));
    })
    socket.on('token-removed', tokenName=>{
        socket.broadcast.emit('remove-token', tokenName)
    })
    socket.on('img-position', imgPos=>{
        socket.broadcast.emit('change-imgPos', imgPos)
    })
    socket.on('blackout', blackout=>{
        console.log(blackout)
        socket.broadcast.emit('blackout-switch', blackout)
    })
})

// Routing GET REQUESTS

router.get('/', (req,res,next)=>{

    let indexCSS = fs.readFileSync('./assets/snippets/indexCSS.html')
    res.render('index' , {title: 'Digital Play Mat | Rolfe Shepsky (C) ', stylesheet: indexCSS})

    // res.render('start' , {title: 'DnD Map | Rolfe Shepsky (C) ', stylesheet: introFile})
})

router.get('/campaign/:id', (req,res,next)=>{
    // Load an Already made campaign
    let dmFile = fs.readFileSync('./assets/snippets/dmFile.html')

    let rege = / /g
    let usernam = req.user.name.replace(rege, '%20');

    if (req.isAuthenticated()) {
        res.render('DM-Site' , {title: 'DnD Map | Rolfe Shepsky (C) ',stylesheet: dmFile , id: req.params.id, auth:true, from_user: usernam})
    }else{
        res.redirect('/')
    }
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

router.get('/player/:player/:id', (req,res,next)=>{
    let dmFile = fs.readFileSync('./assets/snippets/playerCSS.html')

    console.log(req.params.id)

    if (req.isAuthenticated()) {
        res.render('player' , {title: 'DnD Map | Rolfe Shepsky (C) ',stylesheet: dmFile, id: req.params.id, auth: true})
    }else{
        res.render('player' , {title: 'DnD Map | Rolfe Shepsky (C) ',stylesheet: dmFile, id: req.params.id, auth: false})
    }


})

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

router.get('/getUsername', (req,res,next)=>{
    let Username = req.user.name
    res.send({Username: Username})
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
    console.log(req.body.campaignName)
    console.log(req.body.description)
    console.log(req.user)

    let campaigns = {
        name: String,
        description: String,
        maps: [],
        date: Date,
        time: String,
    }

    let campaign_ = {
        campaign: String,
        description: String,
        maps: [],
        dm_notes: [],
        player_notes:[],
        mapNotes: [],
        mapBO: [],
        players: [],    
    }

    campaigns.name = req.body.campaignName;
    campaigns.description = req.body.description;
    campaigns.maps = req.body.maps;
    campaigns.date = new Date();
    campaigns.time = campaigns.date;

    campaign_.campaign = req.body.campaignName;
    campaign_.description = req.body.description;
    campaign_.maps = req.body.maps;


    async function uploadUserDB(){
        try {
            const campaign = new Campaign(campaign_)
            const user = await User.findByIdAndUpdate(req.user._id, {$push: {campaigns: campaigns}});
            let save = await campaign.save();
            campaign.save();
            res.send(user)
        } catch (error) {
            console.log(error)
        }
    }
    uploadUserDB();


})

router.post('/getCampaign', (req,res,next)=>{

    let campaign = req.body.campaign

    async function getCampaign(){
        try {
            const campaign_ = await Campaign.findOne({campaign: campaign})
            res.send(campaign_)
        } catch (error) {
            console.log(error)
        }
    }
    getCampaign();
})

router.post('/updateCampaign', (req,res,next)=>{
    let data = req.body;
    let campaign = req.body.campaign;
    
    /* REQS: 
    campaign
    ANY STAT TO CHANGE
    */
    
    // Polyfill Change
    async function editCharacter(key, da){
        try {
            let updateCampaign = await Campaign.findOneAndUpdate({ campaign: campaign}, {$set: {[key]: da}})
        } catch (error) {
            console.log(error)
        }
    }

    // Parse the keys of the fields to be changed
    for(let el of Object.keys(data)){
        if(el !== 'campaign' || el !== 'username'){
            if(el === 'campaign' || el === 'username'){
            }else{
                let d_ = data[el]
                editCharacter(el ,d_)
            }
        }
    }
    res.send("Done");
})

router.post('/getMainCanvas', (req,res,next)=>{
    console.log(req.body.campaign)

    async function getCampaign(){
        try {
            const campaign = await Campaign.findOne({campaign: req.body.campaign})
            // console.log(campaign.campaign)
            let data = {
                img: campaign.maps[0],
                name: campaign.maps[0].split('.')[0],
            }

            res.send(data)

        } catch (error) {
            console.log(error)
        }
    }
    getCampaign();

})

router.post('/all-characters', (req,res,next)=>{
    let campaign = req.body.campaign;
    let datapackage = []

    async function readChar(){
        try {
            const c = await Campaign.findOne({campaign: campaign});
            if(c.characters.length === 0){
                res.send('No Characters')
            }else{
                res.send(c.characters)
            }
        } catch (error) {
            console.log(error)
            res.send(error)
        }
    }
    readChar();

})

// GET CHARACTER SHEET API - CRUD 

// Create
router.post('/new-character', (req,res,next)=>{

    let campaign = req.body.campaign

    /* REQS:  
    campaign
    username
    name
    class
    race
    level
    languages
    deathsaves
    hitpoints
    speed
    armorClass
    token
    */

    let datapackage = {
        username: req.body.username,
        name: req.body.name,
        class: req.body.class,
        race: req.body.race,
        level: req.body.level,
        languages: req.body.languages,
        deathsaves: req.body.deathsaves,
        hitpoints: req.body.hitpoints,
        speed: req.body.speed,
        armorClass: req.body.armorClass,
        token: req.body.token,
    }
    let isDouble = false
    
    function checkIfDouble(data){

        for(let el of data.characters){
            if(el.name === datapackage.name){
                isDouble = true
                res.send({status: 'Character Already Exists'})
            }
        }
        if(!isDouble){
            console.log('hello')
            createNewCharacter();                
        }
    }

    async function checkIfExists(){
        try {
            const data = await Campaign.findOne({campaign: campaign});

            checkIfDouble(data);

        } catch (error) {
            console.log(error)
        }
    }
    checkIfExists();

    async function createNewCharacter(){
        try {
            let addCharacter = await Campaign.findOneAndUpdate({campaign: req.body.campaign}, {$push: {characters: datapackage}});
            res.send(`Character: ${req.body.name}`)
        } catch (error) {
            console.log(error)
            res.send(error)
        }
    }
})

// Read
router.post('/read-character', (req,res,next)=>{
    let username = req.body.username;
    let campaign = req.body.campaign;
    let name = req.body.name;

    async function readChar(){
        try {
            const char = await Campaign.findOne({campaign: campaign});

            for(let el of char.characters){
                if(el.name === name && el.username === username){
                    // console.log(el)
                    res.send(el)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }
    readChar();
})

// Update
router.post('/edit-character', (req,res,next)=>{
    let data = req.body;
    let campaign = req.body.campaign;
    let characterName = req.body.characterName
    
    /* REQS: 
    campaign
    characterName
    ANY STAT TO CHANGE
    */
    
    // Polyfill Change
    async function editCharacter(key, da){
        try {
            if(da != '' || da){
                let set = `characters.$.${key}`
                let updateCharacter = await Campaign.findOneAndUpdate({campaign: campaign, "characters.name": characterName}, {$set: {[set]: da}})
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Parse the keys of the fields to be changed
    for(let el of Object.keys(data)){
        // console.log(data[el])
        if(el !== 'campaign' || el !== 'username'){
            if(el === 'campaign' || el === 'username'){
            }else{
                let d_ = data[el]
                editCharacter(el ,d_)
            }
        }
    }
    res.send("Done");
})

// Delete
router.post('/delete-character', (req,res,next)=>{
    /* REQS:
    username
    campaign
    name
    */

    // let username = req.body.username;
    let campaign = req.body.campaign;
    let name = req.body.name;

    async function readCharacter(){
        try {
            const eraseChar = await Campaign.findOneAndUpdate({campaign: campaign, "characters.name": name}, {$pull: {"characters": {name: name}}},{multi:true})
            res.send(eraseChar);
        } catch (error) {
            console.log(error)
        }
    }
    readCharacter();
})

// Character Position
router.post('/mapPosition-update', (req,res,next)=>{
    let data = req.body;
    let campaign = req.body.campaign;
    let username = req.body.username;
    /* REQS: 
    campaign
    username
    data : {
        mapName:
        x:
        y:
    }
    */
    
    // Polyfill Change
    async function editCampaign(key, da){
        try {
            if(da != '' || da){
                // let set = `${key}.$`
                let updateCampaign = await Campaign.findOneAndUpdate({ campaign: campaign ,"mapPositions.mapName": da.mapName }, {$set: {"mapPositions.$.x": da.x, "mapPositions.$.y": da.y}})
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Parse the keys of the fields to be changed
    for(let el of Object.keys(data)){
        if(el !== 'campaign' || el !== 'username'){
            if(el === 'campaign' || el === 'username'){
            }else{
                let d_ = data[el]
                editCampaign(el ,d_)
            }
        }
    }
    res.send("Done");

})


server.listen(PORT || 443, ()=>{console.log(`Server running on port ${PORT}`)})