const express = require('express');
const router = express.Router();
const expressEJSLayouts = require('express-ejs-layouts')
const sharp = require('sharp');
const multer = require('multer')
const socketio = require('socket.io')
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
const upload_ = multer({ dest: './public/maps/' })
const fs = require('fs');
const { diskStorage } = require('multer');

const app = express();

app.use(expressEJSLayouts)
app.use(router)
app.set('view engine', 'ejs')
app.set('layout', 'layout1')
app.use('/assets' ,express.static('./assets'))
app.use('/' ,express.static('./public'))


router.get('/', (req,res,next)=>{

    let introFile = fs.readFileSync('./assets/snippets/intro.html')
    res.render('start' , {title: 'DnD Map | Rolfe Shepsky (C) ', stylesheet: introFile})
})

router.get('/dm-side', (req,res,next)=>{
    let dmFile = fs.readFileSync('./assets/snippets/dmFile.html')

    res.render('dnd' , {title: 'DnD Map | Rolfe Shepsky (C) ',stylesheet: dmFile})
})

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

app.listen(80)