let isBlackout = false;

const socket = io();

socket.on('connect', ()=>{
    console.log(`SessionId: ${socket.id}`)
})
socket.on('message', message=>{
    console.log(message)
})
socket.on('phonebook', user_=>{
    // Get Phonebook from other users to SYNC
    phonebook(user_)
})
socket.on('user-connected', (user , privateID)=>{
    // Get alerted when a new user connects
    sysMessage(user);
    // Add a Chatbox to your Message App
    newUserConnects(user, privateID)
    
})
socket.io.on("reconnect", () => {  
    socket.emit('new-user', Username , socket.id)
});
socket.on('user-disconnected', (id)=>{
    userDisconnects(id);
})
socket.on("new-character", message=>{
    addCharacterToList(message);
})

window.addEventListener("contextmenu", e => e.preventDefault());

// Shorten getElements
let gEI = function(element){
    return document.getElementById(element)
};
let gEC = function(element){
    return document.getElementsByClassName(element)
};
let cE = function(element){
    return document.createElement(element)
};

// Prevent Default
function preventDef(e){
    e.preventDefault()
}

// Login Check

function isAuthenticated(){
    if(auth){
        let loginCard = gEI('login-card');
        loginCard.remove();
        getUsername(); 
    }
}
isAuthenticated();

function checkUsername(e){
    let username = gEI('username')
    let reg = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    if(!reg.test(username.value)){
        (username.classname === 'error')?console.log():username.classList.toggle('error');
    }else if(username.value === ''){
        (username.classname === 'error')?console.log():username.classList.toggle('error');
    }else{
        (username.classname === 'error')?username.classList.toggle('error'):console.log('good');
    }
}

function checkPassword(e){
    let password = e.target
    if(password.value === ''){
        if(password.className === 'error'){
        }else{
            password.classList.toggle('error')
        }
    }else{
        if(password.className === 'error'){
            password.classList.toggle('error')
        }
    }
}

function doLogInCheck(e){
    let username = gEI('username')
    let password = gEI('password')
    let message = gEI('message')

    let dP = {
        username: username.value,
        password: password.value
    }

    if(!username.value && !password.value){
        message.classList.toggle('err')
        message.innerHTML = 'Username and Password Missing'
        setTimeout(()=>{
            message.innerHTML = ''
            message.classList.toggle('err')
        },1500)
    }else if(!username.value){
        message.classList.toggle('err')
        message.innerHTML = 'Username Missing'
        setTimeout(()=>{
            message.innerHTML = ''
            message.classList.toggle('err')
        },1500)
    }else if(!password.value){
        message.classList.toggle('err')
        message.innerHTML = 'Password Missing'
        setTimeout(()=>{
            message.innerHTML = ''
            message.classList.toggle('err')
        },1500)
    }else if(username.value && password.value){
        doLogIn(dP, message);
    }
}

async function doLogIn(dP, message){
    // console.log(dP)
    try {
        const {data} = await axios.post('/login', {
            username: dP.username,
            password: dP.password
        })
        if(data === 'username not found'){
            message.innerHTML = 'No Username Found';
            message.classList.toggle('err')
            setTimeout(()=>{
                message.innerHTML = '';
                message.classList.toggle('err')
            },2000)
        }else if(data === 'username and password incorrect'){
            message.innerHTML = 'Incorrect Password';
            message.classList.toggle('err')
            setTimeout(()=>{
                message.innerHTML = '';
                message.classList.toggle('err')
            },2000)
        }else if(data.status === 'Successful Log In'){
            logInTrue(data);
            message.innerHTML = "Successful Log In!"
            message.classList.toggle('success')
        }
    } catch (error) {
        console.log(error)
    }
}

function logInTrue(data){
    let loginCard = gEI('login-card');

    setTimeout(()=>{
        loginCard.classList.toggle('hide');
        loginCard.remove();
        getUsername(); 
    },500)
}

async function logout(e){
    try {
        const {data} = await axios.post('/logout')
        if(data){
            window.location.href = '/'
        }
    } catch (error) {
        console.log(error)
    }
}

const canvas = document.getElementById('map')
let c = canvas.getContext('2d');
const squares = document.getElementById('squares');
const mapName = document.getElementById('map-name')
const menu = document.getElementById('menu');
const settings = gEI('settings-')
const menuBtnOpen = document.getElementById('settings');
const menuBtnClose = document.getElementById('settings-close')
const tileSizeInput = document.getElementById('tile-size')
const squareHeightInput = document.getElementById('sq-h')
const squareWidthInput = document.getElementById('sq-w')
const notesBtn = document.getElementById('notes');
const mainContainer = document.getElementById('main-container')
const canvasContainer = document.getElementById('canvas-container')
const canvasMain = document.getElementById('canvas-main')
const linkShare = gEI('linkshare');

let currentMap = undefined;
let privateChat = undefined;
let allChat = ejs_id;
// console.log(allChat)
let currentRoom = allChat;
let Username = undefined;
let UsersConnected = [];
let Chatboxes = [];
let languageList = [];
let characters = [];
let playerList = [];
 
// Add Global Chat to Chatboxes
Chatboxes.push(allChat)

/* First part is When User connects, they emit a signal
Second part is when Server get's Signal, it sends broadcast to other Users
The broadcast gives them an Instruction to send their usernames back to Server 
Then back to the Original User*/

async function getUsername(){
    try {
        const {data} = await axios.get('/getUsername')
        Username = data.Username
        setTimeout(()=>{
            privateChat = socket.id;
            UsersConnected.push({name: data.Username, id: socket.id})
            socket.emit('new-user', data.Username , socket.id)
            socket.emit('join-room', allChat)
        },500)
        allCharacters();
        
    } catch (error) {
        console.log(error)
    }
}


menuBtnOpen.addEventListener('click', (e)=>{
        settings.style = '';
        setTimeout(()=>{
            settings.classList.toggle('show')
        }, 100)
})

menuBtnClose.addEventListener('click', ()=>{
    setTimeout(()=>{
        settings.style = 'display: none'
    }, 300)
    settings.classList.toggle('show')
})

// Disable Context Menu for Canvas

canvas.oncontextmenu = function(e) {
    e.preventDefault(); e.stopPropagation(); 
}

// Menu OPENING and CLOSING Actions

function menuListenersOn(){
    menu.addEventListener("click", openMenu);
}
menuListenersOn();

function menuListenersOff(){
    menu.removeEventListener("click", openMenu);
}

function openMenu(){
    let optionsContainer = gEI('options-container');
    let top = gEI('top');
    top.style = 'width:100%;';
    optionsContainer.style = 'width:100%'
    menu.classList.toggle('open')
    menu.onclick = closeMenu;
    menuListenersOff();
}

function closeMenu(){
    let optionsContainer = gEI('options-container');
    let top = gEI('top');
    top.style = '';
    optionsContainer.style = ''
    menu.classList.toggle('open')
    menu.onclick = ''
    menuListenersOn();
}

let tileStandard = 70
let tileSize = tileStandard
canvas.width = 770
canvas.height = 770;
let maxTileWidth = undefined;
let maxTileHeight = undefined;
let maxTileWidth_ = undefined;
let maxTileHeight_ = undefined;
let isPassiveLimitCounter = false;
let sW = canvas.width/tileSize;
let sH = canvas.height/tileSize;
let notes = [];
let tokens = [];
let tokenPos = [];
let startingPos = {
    x: undefined,
    y: undefined,
}

// canvas Auto Size

function defaultCanvasSize(){
    // tileSizeInput.value = tileSize;
    squareHeightInput.value = canvas.height/tileSize;
    squareWidthInput.value = canvas.width/tileSize;
}
defaultCanvasSize();

function tileResizeAuto(e){
    canvas.width = Math.floor(window.innerWidth/tileSize)*tileSize;
    canvas.height = Math.floor(window.innerHeight/tileSize)*tileSize;

    maxTileWidth = Math.floor(window.innerWidth/tileSize);
    maxTileHeight = Math.floor(window.innerHeight/tileSize);

    maxTileWidth_ = Math.floor(window.innerWidth/tileSize);
    maxTileHeight_ = Math.floor(window.innerHeight/tileSize);

    squareHeightInput.value = maxTileHeight
    squareWidthInput.value = maxTileWidth

    getSquares();
}
tileResizeAuto();

function tileResizeAutoPassive(e){
    maxTileWidth_ = Math.floor(window.innerWidth/tileSize);
    maxTileHeight_ = Math.floor(window.innerHeight/tileSize);

    if(maxTileHeight_ < squareHeightInput.value || maxTileWidth_ < squareWidthInput.value){
        canvasAutoSizeOn();
    }
}

function canvasAutoSizeOn(){
    window.addEventListener('resize', tileResizeAuto)
    if(isPassiveLimitCounter){
        isPassiveLimitCounter = false
        window.removeEventListener('resize', tileResizeAutoPassive)
    }
}
canvasAutoSizeOn();

function canvasAutoSizeOff(){
    window.removeEventListener('resize', tileResizeAuto)
    window.addEventListener('resize', tileResizeAutoPassive)

    isPassiveLimitCounter = true;

    maxTileWidth = Math.floor(window.innerWidth/tileSize);
    maxTileHeight = Math.floor(window.innerHeight/tileSize);
}

squareHeightInput.addEventListener('change', (e)=>{
    // console.log(e.target.value)

    if(e.target.value < maxTileHeight_){
        if(!isPassiveLimitCounter){
            canvasAutoSizeOff()
        }
    }else if(e.target.value === maxTileHeight_){
        if(isPassiveLimitCounter){
            canvasAutoSizeOn()
            e.target.value = maxTileHeight_
        }
    }else if(e.target.value > maxTileHeight_){
        e.target.value = maxTileHeight_;
        canvasAutoSizeOn();
    }
    canvas.height = e.target.value * tileSize
    getSquares();
})

squareWidthInput.addEventListener('change', (e)=>{

    if(e.target.value < maxTileWidth_){
        if(!isPassiveLimitCounter){
            canvasAutoSizeOff()
        }
    }else if(e.target.value === maxTileWidth_){
        if(isPassiveLimitCounter){
            canvasAutoSizeOn()
            e.target.value = maxTileWidth_
        }
    }else if(e.target.value > maxTileWidth_){
        e.target.value = maxTileWidth_;
        canvasAutoSizeOn();
    }
    canvas.width = e.target.value * tileSize;
    getSquares();
})

// Get Squares from Width and Height

function getSquares(){
    sW = canvas.width/tileSize;
    sH = canvas.height/tileSize;
    // squares.innerHTML = `${sW}x${sH} Squares Map`
}
getSquares();

// Map

let img = new Image();

// Get Initial Map for Canvas

async function getCurrentMap(){

    try {
        // console.log(n_)
        const {data} = await axios.post('/getMainCanvas', {
            campaign: ejs_id
        })
        currentMap = data.name
        // console.log(data)
        img.src = `/maps/${data.img}`
        img.name = data.name
        refreshPlayers();
    } catch (error) {
        console.log(error)
    }
}
getCurrentMap();


// Switches

let isCanvasLoaded = false;
let isDown = false;
let isImgLoad = false;
let isSelectionOn = false;
let isOnNote = false;
let isTokenSelected = false;
let areTokensOnMap = false;
let isHoveredOver = false;
let isAutoScrollDown = true;

// Img

let imgHeight = img.height
let imgWidth = img.width
let imgScale = 1

function scrollWheelZoom(e){

    // Pos
    if(e.wheelDelta > 0){
        let scaleUp = +(+((e.wheelDelta/e.wheelDelta)/10).toFixed(2) + imgScale).toFixed(2)
        
        if(scaleUp >= 2){
            scaleUp = 2
        }else{

            // the Impossible Math for the Scroll Zoom

            startingPos.x = imgPos.x/tileSize;
            startingPos.y = imgPos.y/tileSize;
            
            imgScale = scaleUp;
            
            imgPos.x = startingPos.x*(tileStandard*imgScale);
            imgPos.y = startingPos.y*(tileStandard*imgScale);
                        
            let updatedTokens = []
            
            tileSize = tileStandard*imgScale;

            for(let el of tokens){
                console.log(el.index)
                for(let ol of tokenPos){
                    console.log(ol.player)
                    if(el.index === ol.player){
                        console.log(el.player, ol.index)
                        let x = tokenPos[tokenPos.indexOf(ol)].x*tileSize
                        let y = tokenPos[tokenPos.indexOf(ol)].y*tileSize
                        let w = tileSize
                        let h = tileSize
                        let img_q = el.image
                        let qName = el.index
                        updatedTokens.push(new doDrawToken(x,y,w,h,img_q, qName))
                    }
                }
            }
            tokens = updatedTokens
            getSquares();
        }
    }else{
        let scaleUp = +(+((e.wheelDelta/-e.wheelDelta)/10).toFixed(2) + imgScale).toFixed(2)
        if(scaleUp <= .5){
            scaleUp = .5
        }else{
            startingPos.x = imgPos.x/tileSize;
            startingPos.y = imgPos.y/tileSize;
    
            imgScale = scaleUp;
            
            imgPos.x = startingPos.x*(tileStandard*imgScale);
            imgPos.y = startingPos.y*(tileStandard*imgScale);
                        
            // Neg
            
            let updatedTokens = []
            
            tileSize = tileStandard*imgScale;
            for(let el of tokens){
                for(let ol of tokenPos){
                    if(el.index === ol.player){
                        let x = tokenPos[tokenPos.indexOf(ol)].x*tileSize
                        let y = tokenPos[tokenPos.indexOf(ol)].y*tileSize
                        let w = tileSize
                        let h = tileSize
                        let img_q = el.image
                        let qName = el.index
                        updatedTokens.push(new doDrawToken(x,y,w,h,img_q, qName))
                    }
                }
            }
            tokens = updatedTokens
            getSquares();
        }
    }
}

function onScrollZoom(){
    canvas.addEventListener('wheel', scrollWheelZoom)
}
onScrollZoom();

function offScrollZoom(){
    canvas.removeEventListener('wheel', scrollWheelZoom)
}


let imgPos = {
    x: 0,
    y: 0,
}

// Add Map to the Canvas

function addMap(){

    if(!img.complete){
        isCanvasLoaded = false;
    }else{
        mapName.innerHTML = img.name
    
        // Each Square is 35pixels at * .5
        // Each Square is 70pixels at * 1
        let img_x = imgPos.x
        let img_y = imgPos.y
        let img_w = img.width * imgScale
        let img_h = img.height * imgScale
        c.drawImage(img, img_x, img_y, img_w, img_h);
        isCanvasLoaded = true;
        if(!isImgLoad && img.height > 0){
            isImgLoad = true;
            let divloader = gEI('canvas-loader')
            divloader.remove()
        }
    }
}

// Create a Selection Square

function createSelection(x, y, w, h){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.draw = function(){
        c.fillRect(x,y,w,h);
        c.fillStyle='#ff00008c';
    }

    this.update = function(){
        this.w = w
        this.h = h
        this.draw()
    }
}

let drawNotes = undefined;
let selection = undefined;
let drawToken = undefined;
let focusedShadow = undefined;

// Animation Engine and Refresh Rate

function engine(){
    c.clearRect(0, 0, canvas.width, canvas.height);
    addMap();
    if(isSelectionOn){
        selection.update()
    }
    if(isOnNote){
        drawNotes.update()
    }
    if(isTokenSelected){
        drawToken.update()
    }
    if(areTokensOnMap){
        if(isHoveredOver){
            focusedShadow.update()
        }
        for(let el of tokens){
            el.update()
        }
    }
    canvas.style.cursor = 'grab'
    requestAnimationFrame(engine)
}
engine();

function canvasLoading(){

    let divLoader = cE('div')
    divLoader.style = `background-image:url('/img/canvas_loader.gif'); background-size: 100px; background-repeat: no-repeat; background-position:center;width:100%;height:100%;position: absolute; display:flex;z-index: 20;background-color: black`
    divLoader.id = 'canvas-loader'

    setTimeout(()=>{
        if(img.complete){
            return
        }else{
            let g_ = gEI('canvas-loader')
            let h1 = cE('h1')
            h1.innerHTML = 'Just a moment, almost there...';
            h1.style = 'color:white;display: inline-block;font-size: 2rem;position:absolute; bottom:30%;'
            g_.insertAdjacentElement('afterbegin', h1)
    
            setTimeout(()=>{
                if(img.complete){
                   return 
                }else{
                    h1.innerHTML = 'Maps are pretty big <3...';
                    setTimeout(()=>{
                        if(img.complete){
                            return
                        }else{
                            h1.innerHTML = 'Furries are the superior race...';
                            setTimeout(()=>{
                                if(img.complete){
                                    return
                                }else{
                                    h1.innerHTML='who said that?...';
                                    setTimeout(()=>{
    
                                        if(img.complete){
                                            return
                                        }else{
                                            h1.innerHTML="'OwO'";
                                            setTimeout(()=>{
                                                if(img.complete){
                                                    return
                                                }else{
                                                    window.location.reload();
                                                }
                                            },5000)
                                        }
                                    },8000)
                                }
                            },800)
                        }
                    },8000)
                }
            },8000)
        }
    },5000)
    
    canvasContainer.insertAdjacentElement('afterbegin', divLoader)
}
canvasLoading();

// Mouse Window Position

let windowMousePos = {
    x: undefined,
    y: undefined,
}

// Canvas Event Listeners for Dragging

canvas.addEventListener('mousemove', (e)=>{
    if(isDown){
        if(e.buttons === 2){
            onMouseMove(e);
        }
    }
})

function onS0(){
    window.addEventListener('mousedown', onMouseClick)
    window.addEventListener("mouseup", onMouseEnd)
}
onS0();

function offS0(){
    window.removeEventListener('mousedown', onMouseClick);
    window.removeEventListener("mouseup", onMouseEnd);
}

let mousePosition = {
    x: 0,
    y: 0,
}

function onMouseClick(e){
    // console.log(e.buttons)
    if(e.buttons === 2){
        // console.log('eoj')

    // get mouse coordinates

    mouseX=e.clientX;
    mouseY=e.clientY;
    // console.log(mouseY, mouseX)

    
    // set the starting drag position 
    // this is needed in mousemove to determine how far we have dragged
    
    mousePosition.x=mouseX;
    mousePosition.y=mouseY;

    isDown = true
    }
}

let tilePosition = {
    tileX: 0,
    tileY: 0,
}

function onMouseMove(e){

    if(e.buttons === 2){
        if(imgPos.x <= 0 && imgPos.y <= 0){
            if(imgPos.x > -img.width*imgScale + canvas.width && imgPos.y > -img.height*imgScale + canvas.height){
                var dx=e.movementX;
                var dy=e.movementY;
              
                imgPos.x += dx
                imgPos.y += dy
    
                // Tile X Set Snapping
                if(-imgPos.x%tileSize <= (tileSize/2 -1)){
                    tilePosition.tileX = Math.floor(-imgPos.x/tileSize)
                }else if(tileSize/2 <= -imgPos.x%tileSize){
                    tilePosition.tileX = Math.ceil(-imgPos.x/tileSize)
                }
    
                // Tile Y Set Snapping
    
                if(-imgPos.y%tileSize <= (tileSize/2 -1)){
                    tilePosition.tileY = Math.floor(-imgPos.y/tileSize)
                }else if(tileSize/2 <= -imgPos.y%tileSize){
                    tilePosition.tileY = Math.ceil(-imgPos.y/tileSize)
                }
    
    
            }else if(imgPos.x <= -img.width*imgScale + canvas.width){
                imgPos.x = -img.width*imgScale + canvas.width+1
            }else if(imgPos.y <= -img.height*imgScale + canvas.height){
                imgPos.y = -img.height*imgScale + canvas.height+1
            }
        }else{
            if(imgPos.x > 0){
                imgPos.x = 0
            }else if(imgPos.y > 0){
                imgPos.y = 0
            }
        }
    }
}

function onMouseEnd(e){
    isDown = false

    imgPos.x = tilePosition.tileX * -tileSize;
    imgPos.y = tilePosition.tileY * -tileSize;

    let data_ = {
        map: currentMap,
        tileSize: tileSize,
        x: tilePosition.tileX,
        y: tilePosition.tileY,
    }
    socket.emit('img-position', data_)

    async function updateCampaign(){
        try {
            const {data} = await axios.post('/mapPosition-update', {
                campaign: allChat,
                username: Username,
                mapPositions: {
                    mapName: data_.map,
                    x: data_.x,
                    y: data_.y,
                },
            })
        } catch (error) {
            console.log(error)
        }
    }
    updateCampaign();
}



// END DRAGGING ENGINE

function whereAmI(e){
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;


    let tiles = {
        tileX:Math.floor(x/tileSize) + -imgPos.x/tileSize,
        tileY:Math.floor(y/tileSize) + -imgPos.y/tileSize,
    }
    return tiles
}

// Select Tiles for Notes

notesBtn.addEventListener('click', noteMaker)

let mapTileArray_x = [];
let mapTileArray_y = [];

let selectableTiles = undefined;
let notePos = undefined;
let selectionDown = false;

let mouseOriginPosition = {
    x: undefined,
    y: undefined,
}
let areaSelected = {
    x: undefined,
    y: undefined,
    w: undefined,
    h: undefined,
}

// Creates an Array of mapTiles

function tileArrayGenerator(img){

        let mapSquares_W = img.width/tileSize;
        let mapSquares_H = img.height/tileSize;
        // console.log(mapSquares_W)
        // console.log(mapSquares_H)

        mapTileArray_x = []
        mapTileArray_y = []
    
        for(i=0; i <= mapSquares_W; i++){
            mapTileArray_x.push(i)
        }

        for(i=0; i<= mapSquares_H; i++){
            mapTileArray_y.push(i)
        }
}

// Event Listener for Mouse Click on Notes

function noteOnMouseDown(e){
    if(!selectionDown){
        selectionDown = true
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        windowMousePos.x = e.screenX;
        windowMousePos.y = e.screenY;            
        mouseOriginPosition.x = x
        mouseOriginPosition.y = y
    }else{
        selectionDown = false;
        let x = areaSelected.x
        let y = areaSelected.y
        let w = areaSelected.w
        let h = areaSelected.h
        createNote(x, y, w, h)
    }
}

function noteOnMouseMove(e){
    if(selectionDown){
        isSelectionOn = true

        // console.log(e)

        const rect = canvas.getBoundingClientRect();
        const movex = e.clientX - rect.left;
        const movey = e.clientY - rect.top;


        let currentImgOrigin = {
            x: -imgPos.x,
            y: -imgPos.y,
        }

        let dx = movex - mouseOriginPosition.x
        let dy = movey - mouseOriginPosition.y

        // Cursor Position

        let x = Math.floor(mouseOriginPosition.x/tileSize)*tileSize;
        let y = Math.floor(mouseOriginPosition.y/tileSize)*tileSize;

        let w = 0;
        let h = 0

        // WidthXHeight

        if(dx > 0){
            w = Math.ceil(dx/tileSize) * tileSize
            // console.log(w)
        }else if(dx<0){
            w = Math.floor(dx/tileSize) * tileSize
            // console.log(w)
        }
        
        if(dy > 0){
            h = Math.ceil(dy/tileSize) * tileSize
            // console.log(h)

        }else if(dy<0){
            h = Math.floor(dy/tileSize) * tileSize
            // console.log(h)
        }

        areaSelected.x = x
        areaSelected.y = y
        areaSelected.w = w
        areaSelected.h = h

        selection = new createSelection(x, y ,w ,h)

    }
}

// Makes the Note Square

function noteMaker(e){

    offS0();
    offScrollZoom();
    canvas.addEventListener('mousedown', noteOnMouseDown)
    canvas.addEventListener('mousemove', noteOnMouseMove)

}

// Parses position information for Map location

function createNote(x,y,w,h){

    let origin = {
        x: -imgPos.x,
        y: -imgPos.y,
    }

    notePos = {
        area: undefined,
        startX: Math.floor(origin.x + x)/tileSize,
        startY: Math.floor(origin.y + y)/tileSize,
        endX: Math.ceil(origin.x + x)/tileSize + w/tileSize,
        endY: Math.ceil(origin.y + y)/tileSize + h/tileSize,
    }

    notePos.area = Math.abs((notePos.endY - notePos.startY) * (notePos.endX - notePos.startX))


    noteInfo()

}

// Exit Notes Process

function exitNoteState(){

    let msgBox = document.getElementById('note-msg-box')
    msgBox.classList.toggle('hidden')
    setTimeout(()=>{
        msgBox.remove()
    },300)

    isSelectionOn = false
    onScrollZoom();
    onS0();
}

// Creates Fields for input of Notes Details

function noteInfo(){

    canvas.removeEventListener('mousedown', noteOnMouseDown)
    canvas.removeEventListener('mousemove', noteOnMouseMove)

    let msg = document.createElement('div');
    msg.className = 'msg-box small';
    msg.id = 'note-msg-box'

    let exitBtn = document.createElement('a')
    exitBtn.className = 'exit-btn'
    exitBtn.onclick = exitNoteState
    msg.appendChild(exitBtn)

    let title = document.createElement('h1');
    title.style = 'font-size:2rem;font-weight:bold';
    title.innerHTML = 'New Object'
    msg.appendChild(title)

    let inputContainer = document.createElement('div')
    inputContainer.className = 'input-msg-container'
    msg.appendChild(inputContainer);

    let label = document.createElement('label');
    label.innerHTML = 'Title';
    label.style = 'margin-top: 1rem'
    inputContainer.appendChild(label);

    let inputTitle = document.createElement('input');
    inputTitle.placeholder = "Jeff Bezos' Beanie Babies Collection"
    inputTitle.className = 'input-msg-title';
    inputTitle.id = 'input-msg-title';
    inputContainer.appendChild(inputTitle);

    let labelTextField = document.createElement('label');
    labelTextField.innerHTML = 'Message to Display';
    labelTextField.style = 'margin-top: 1rem'
    inputContainer.appendChild(labelTextField)


    let textField = document.createElement('textarea')
    textField.className = 'form-control note-txt'
    textField.style = 'width: 90%';
    textField.id = 'note-txt'
    inputContainer.appendChild(textField)

    let submitBtn = document.createElement('a')
    submitBtn.className = 'btn btn-primary note';
    submitBtn.innerHTML = 'Make Note';
    submitBtn.onclick = submitNote;
    inputContainer.appendChild(submitBtn)

    canvasMain.insertAdjacentElement('afterbegin' ,msg);
    setTimeout(()=>{
        msg.classList.toggle('small')
    },10)

}

// Submittion and Push to Array of Notes

function submitNote(){
    let noteTitle = document.getElementById('input-msg-title');
    let noteTxt = document.getElementById('note-txt');
    let toPush = {
        index: notes.length,
        title: noteTitle.value,
        comment: noteTxt.value,
        notePos: notePos,
    }
    notes.push(toPush)
    exitNoteState();
    onS0();
    onScrollZoom();
    // drawNotes = drawNotesScreen(x,y,w,h)

}

// Check if cursor is on a note and Show Note

function checkIfNote(e){
    isOnNote = false

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;


    let tiles = {
        tileX:Math.floor(x/tileSize) + -imgPos.x/tileSize,
        tileY:Math.floor(y/tileSize) + -imgPos.y/tileSize,
    }

    for(let el of notes){

        let startX = Math.min(el.notePos.startX, el.notePos.endX);
        let endX = Math.max(el.notePos.startX, el.notePos.endX);
        let startY = Math.min(el.notePos.startY, el.notePos.endY)
        let endY = Math.max(el.notePos.startY, el.notePos.endY);

        let w = (endX - startX) * tileSize;
        let h = (endY - startY) * tileSize;

        if(tiles.tileX >= startX && tiles.tileX < endX && tiles.tileY >= startY && tiles.tileY < endY){
            isOnNote = true;

            // Show message on Cursor

            cursorNoteMessage(el, x, y, e);

            // Show Note Square : Change later

            drawNotes = new drawNotesScreen(startX, startY ,w ,h)
        }
    }
    let msg = document.getElementById('msgInfo-cursor')

    if(!isOnNote && msg){
        msg.remove()
    }
}

canvas.addEventListener('mousemove', checkIfNote)

// Drawing Notes on Screen

function drawNotesScreen(x,y, w, h){
    this.x = x*tileSize + imgPos.x;
    this.y = y*tileSize + imgPos.y;
    this.w = w;
    this.h = h;

    this.draw = function(){
        c.strokeRect(this.x, this.y, this.w, this.h);
        c.strokeStyle='#ff00008c';
        c.lineWidth=15;
        
    }

    this.update = function(){
        this.draw()
    }
}

function cursorNoteMessage(noteInfo, x, y, e){

    let msg = document.getElementById('msgInfo-cursor')
    if(msg){
        msg.style = `top:${y + 10}px;left:${x+10}px;`
    }else{
        // console.log(noteInfo)
        // let msg = document.getElementById('msgInfo-cursor')
        // msg.remove();
        let msgInfoBox = document.createElement('div');
        msgInfoBox.className = 'msgInfo-cursor hide';
        msgInfoBox.id = 'msgInfo-cursor';
        
        let msgTitle = document.createElement('h1')
        msgTitle.innerHTML = noteInfo.title;
        msgTitle.className = 'msgInfo-title'
        msgInfoBox.appendChild(msgTitle);

        let msgComment = document.createElement('p')
        msgComment.innerHTML = noteInfo.comment;
        msgComment.className = 'msgInfo-comment'
        msgInfoBox.appendChild(msgComment);
        
        canvasMain.insertAdjacentElement( 'afterbegin' ,msgInfoBox);

        setTimeout(()=>{
            msgInfoBox.classList.toggle('hide');
        },10)
    }

}

// END NOTE PROCESS
// Player Character


const playersBtn = document.getElementById('players');

playersBtn.addEventListener('click', playerMenu)

function exitPlayerMenu(e){
    // Remove Exit Event Listener
    playersBtn.removeEventListener('click', exitPlayerMenu);

    // Remove Player Menu
    let playerMenuC = document.getElementById('playerMenu')
    playerMenuC.classList.toggle('hidden');
    setTimeout(()=>{
        playerMenuC.remove()
    },300)
    
    // Reset Listeners
    playersBtn.addEventListener('click', playerMenu)

    // Canvas Drag Listeners
    // canvas.addEventListener('mousedown', onMouseClick)
    // canvas.addEventListener("mouseup", onMouseEnd)

    // Remove any unncessary menu
    let addPlayerMenu = document.getElementById('addplayer-menu-container');

    if(addPlayerMenu){
        addPlayerMenu.classList.toggle('small')
        setTimeout(()=>{
            addPlayerMenu.remove()
        },300)
    }
}

function playerMenu(e){
    // Stop the Listeners for Drag and Doubling
    playersBtn.removeEventListener('click', playerMenu);

    // Add New Event Listener to Exit with Icon
    playersBtn.addEventListener('click', exitPlayerMenu);

    // Menu Maker
    let playerMenuCont = document.createElement('div')
    playerMenuCont.className = 'playerMenu small';
    playerMenuCont.id = 'playerMenu'
    canvasMain.appendChild(playerMenuCont);
    setTimeout(()=>{
        playerMenuCont.classList.toggle('small')
    },10)

    // Add Player

    let addPlayerCont = document.createElement('div');
    addPlayerCont.className = 'add-player-container';
    addPlayerCont.id = 'add-player-container';
    playerMenuCont.appendChild(addPlayerCont)

    let addPlayerMain = document.createElement('a')
    addPlayerMain.className = 'add-player-main';
    addPlayerMain.id = 'add-player-main';
    addPlayerMain.onclick = addPlayerMenu;
    addPlayerCont.appendChild(addPlayerMain)

    let addPlayer = document.createElement('div');
    addPlayer.className = 'add-player';
    addPlayer.id = 'add-player-btn';
    addPlayerMain.appendChild(addPlayer)
    
    let infoTitle = document.createElement('h1');
    infoTitle.className = 'addPlayer-title';
    infoTitle.id = 'addPlayer-title';
    infoTitle.innerHTML = 'Add Player'
    addPlayerMain.appendChild(infoTitle)

    // Edit Players

    let editPlayers = document.createElement('a');
    editPlayers.className = 'edit-players';
    editPlayers.id = 'edit-players';
    editPlayers.onclick = doEditPlayers;
    addPlayerCont.appendChild(editPlayers)

    let editPlayerIcon = document.createElement('div');
    editPlayerIcon.className = 'edit-player-icon';
    editPlayerIcon.id = 'edit-player-icon';
    editPlayers.appendChild(editPlayerIcon);

    let editTitle = document.createElement('h1');
    editTitle.className = 'editPlayers-title';
    editTitle.id = 'editPlayers-title';
    editTitle.innerHTML = 'Edit Players';
    editPlayers.appendChild(editTitle);

    // Player List

    let playerList = document.createElement('div');
    playerList.className = 'player-list'
    playerList.id = 'player-list'
    playerMenuCont.appendChild(playerList);

    getPlayerList();

}

// Get Player List and Add it

// function getPlayerList(list){

//     list.innerHTML = ''
//     for(let el of playerList){
//         // console.log(el)
//         let div = document.createElement('div');
//         div.innerHTML = `<div class='player-info'><h1 class='player-name'>${el.playerName}</h1><p class='player-classRace'>${el.class}/${el.race}</p><div class='hp-bar'></div><div class='player-stats'><p class='player-hp'>HP: ${el.HP}</p><p class='player-speed'>SP: ${el.speed}</p></div></div><a class='player-img-container' onclick=createToken(event) name=${el.playerName}><img class='player-img' name='${el.playerName}' src='${el.img}'></a>`
//         div.className = 'player-list-item'
//         list.appendChild(div)
//     }

// }

// Exit Edit Player

function exitEditPlayer(){
    let addPlayerMenu_ = document.getElementById('addplayer-menu-container');
    let addPlayerMain = document.getElementById('add-player-main')
    addPlayerMain.onclick = addPlayerMenu;
    if(addPlayerMenu_){
        addPlayerMenu_.classList.toggle('small')
        setTimeout(()=>{
            addPlayerMenu_.remove()
        },100)
    }
}

// Language List event listener

function languageListAdd(e){
    // ADD A DIV TO LIST AND PUSH TO ARRAY
    let data = e.originalTarget.value

    if(languageList.indexOf(data) === -1){
        let createOption = cE('div');
        createOption.className = 'cont-langlist'
        createOption.id = data;
        createOption.innerHTML = `<p class='p-langlist'>${data}</p><a name='${data}' class='del-langlist' onclick='languageListRemove(event)'>X</a>`
        let addPlayerLangList = gEI('addPlayer-languageList');
        languageList.push(data);
        addPlayerLangList.appendChild(createOption)
    }
}

function languageListRemove(e){

    let name = e.originalTarget.name;
    let index = languageList.indexOf(name)
    if(index >= 0){
        languageList.splice(index, 1)
        let removal_ = gEI(name);
        removal_.remove();
    }
}

// Add Players to the List

function addPlayerMenu(e){

    // Remove Add Player Event Listener
    let addPlayerMain = document.getElementById('add-player-main')
    addPlayerMain.onclick = exitEditPlayer;


    // AddPlayer Menu
    let addPlayerMenu = document.createElement('div');
    addPlayerMenu.className = 'addplayer-menu-container small';
    addPlayerMenu.id = 'addplayer-menu-container';
    canvasMain.appendChild(addPlayerMenu);
    setTimeout(()=>{
        addPlayerMenu.classList.toggle('small')
    },10)

    // Add Player Inputs
    setTimeout(()=>{

        // campaign
        // username
        // name
        // class
        // race
        // level
        // languages
        // deathsaves
        // hitpoints
        // speed
        // armorClass
        // token
    

        let inputPlayerTitle = document.createElement('h1');

        let inputPlayerNameLabel = document.createElement('label');
        let inputPlayerName = document.createElement('input');
        let inputPlayerClassLabel = document.createElement('label');
        let inputPlayerClass = document.createElement('input')
        let inputPlayerRaceLabel = document.createElement('label');
        let inputPlayerRace = document.createElement('input');
        let inputPlayerHPLabel = document.createElement('label');
        let inputPlayerHP = document.createElement('input');
        inputPlayerHP.oninput = function(e){
            let rege = /[a-zA-Z\*\\\&\#\@\!\^\&\-\.\, ]/
            if(rege.test(e.data)){
                e.originalTarget.value = 0;
            }
        }
        let inputPlayerSpeedLabel = document.createElement('label');
        let inputPlayerSpeed = document.createElement('input');
        inputPlayerSpeed.oninput = function(e){
            let rege = /[a-zA-Z\*\\\&\#\@\!\^\&\-\.\, ]/
            if(rege.test(e.data)){
                e.originalTarget.value = 0;
            }
        }
        let inputPlayerSubmit = document.createElement('a');
        
        // Additional Update
        // Level
        let inputLevelContainer = cE('div')
        inputLevelContainer.className = 'addPlayer-HPc'
        let inputLevelLabel = cE('label')
        inputLevelLabel.innerHTML = 'LVL'
        inputLevelLabel.className = 'addPlayer-label'
        let inputLevel = cE('input');
        inputLevel.type = 'number';
        inputLevel.min = 0;
        inputLevel.value = 0;
        inputLevel.id = 'addPlayer-level';
        inputLevel.className = 'addPlayer-input number';
        inputLevel.oninput = function(e){
            let rege = /[a-zA-Z\*\\\&\#\@\!\^\&\-\.\, ]/
            if(rege.test(e.data)){
                e.originalTarget.value = 0;
            }
        }
        
        // Arrows
        let inputLevel_LA = document.createElement('a');
        inputLevel_LA.className = 'addPlayer-Speed-LA';
        inputLevel_LA.onclick = function (){
            let _n = document.getElementById('addPlayer-level')
            if(_n.value > 0){
                _n.value--
            }
        }
        
        let inputLevel_RA = document.createElement('a');
        inputLevel_RA.className = 'addPlayer-Speed-RA';
        inputLevel_RA.onclick = function (){
            let _n = document.getElementById('addPlayer-level')
            if(_n.value >= 0 && _n.value < 999){
                _n.value++
            }
        }

        inputLevelContainer.appendChild(inputLevel_LA)
        inputLevelContainer.appendChild(inputLevel)
        inputLevelContainer.appendChild(inputLevel_RA)

        // Language Label
        let inputLangLabel = cE('label');
        inputLangLabel.innerHTML = 'Languages';
        inputLangLabel.className = 'addPlayer-label';
        // Language Input
        let inputLang = cE('select');
        inputLang.id = 'addPlayer-language';
        inputLang.className = 'addPlayer-input-language';
        inputLang.placeholder = 'Select Language...';
        inputLang.onchange = languageListAdd;

        let selectedOption = cE('option');
        selectedOption.value = '';
        selectedOption.selected = true;
        selectedOption.disabled = true;
        selectedOption.innerHTML = 'Select a Language...'
        inputLang.appendChild(selectedOption)

        let languages = [
            ["Dwarvish",
            "Elvish",
            "Giant",
            "Gnomish",
            "Goblin",
            "Halfling",
            "Orc"],
            ["Abyssal",
            "Celestial",
            "Draconic",
            "Deep Speech",
            "Infernal",
            "Primordial",
            "Sylvan",
            "Undercommon"]
        ]

        for(i=0; i<languages.length;i++){
            if(i === 0){
                let disOption = cE('option');
                disOption.disabled = true;
                disOption.value = 'Common Languages';
                disOption.innerHTML = 'Common Languages';
                inputLang.appendChild(disOption); 
                for(let el of languages[i]){
                    let option = cE('option');
                    option.value = el;
                    option.innerHTML = el;
                    inputLang.appendChild(option); 
                }
            }else{
                let disOption = cE('option');
                disOption.disabled = true;
                disOption.value = 'Uncommon Languages';
                disOption.innerHTML = 'Uncommon Languages';
                inputLang.appendChild(disOption); 
                for(let el of languages[i]){
                    let option = cE('option');
                    option.innerHTML = el;
                    option.value = el;
                    inputLang.appendChild(option); 
                }
            }
        }

        let languageListCont = cE('div');
        languageListCont.className = 'addPlayer-languageList';
        languageListCont.id = 'addPlayer-languageList';
        

        // Armor Container
        let armorClassContainer = cE('div');
        armorClassContainer.className = 'addPlayer-HPc'

        // Armor Class Label
        let armorClassLabel = cE('label')
        armorClassLabel.className = 'addPlayer-label';
        armorClassLabel.innerHTML = 'AC';
        
        // Armor Class
        let armorClass = cE('input');
        armorClass.type = 'number'
        armorClass.id = 'addPlayer-armorClass'
        armorClass.className = 'addPlayer-input number'
        armorClass.min = 0;
        armorClass.value = 0;
        armorClass.oninput = function(e){
            let rege = /[a-zA-Z\*\\\&\#\@\!\^\&\-\.\, ]/
            if(rege.test(e.data)){
                e.originalTarget.value = 0;
            }
        }

        
        // Arrows
        let armorClass_LA = document.createElement('a');
        armorClass_LA.className = 'addPlayer-Speed-LA';
        armorClass_LA.onclick = function (){
            let _n = document.getElementById('addPlayer-armorClass')
            if(_n.value > 0){
                _n.value--
            }
        }
        
        let armorClass_RA = document.createElement('a');
        armorClass_RA.className = 'addPlayer-Speed-RA';
        armorClass_RA.onclick = function (){
            let _n = document.getElementById('addPlayer-armorClass')
            if(_n.value >= 0 && _n.value < 999){
                _n.value++
            }
        }
        
        armorClassContainer.appendChild(armorClass_LA)
        armorClassContainer.appendChild(armorClass)
        armorClassContainer.appendChild(armorClass_RA)

        // AAAA
        
        let inputPlayerStats = document.createElement('div');
        inputPlayerStats.className = 'addPlayer-stats';

        let inputPlayerHPc = document.createElement('div');
        inputPlayerHPc.className = 'addPlayer-HPc';

        let inputPlayerSpeedc = document.createElement('div');
        inputPlayerSpeedc.className = 'addPlayer-SPc';

        let inputPlayerHP_LA = document.createElement('a');
        inputPlayerHP_LA.className = 'addPlayer-HP-LA';
        inputPlayerHP_LA.onclick = function (){
            let _n = document.getElementById('inputPlayerHP')
            // let regex = /^[A-Z]+$/i
            // if(regex.test( _n.value))
            if(_n.value > 0){
                _n.value--
            }
        }

        let inputPlayerHP_RA = document.createElement('a');
        inputPlayerHP_RA.className = 'addPlayer-HP-RA';
        inputPlayerHP_RA.onclick = function (){
            let _n = document.getElementById('inputPlayerHP')
            // let regex = /^[A-Z]+$/i
            // if(regex.test( _n.value))
            if(_n.value >= 0 && _n.value < 999){
                _n.value++
            }
        }

        // Speed Arrows

        let inputPlayerSpeed_LA = document.createElement('a');
        inputPlayerSpeed_LA.className = 'addPlayer-Speed-LA';
        inputPlayerSpeed_LA.onclick = function (){
            let _n = document.getElementById('inputPlayerSpeed')
            // let regex = /^[A-Z]+$/i
            // if(regex.test( _n.value))
            if(_n.value > 0){
                _n.value--
            }
        }

        let inputPlayerSpeed_RA = document.createElement('a');
        inputPlayerSpeed_RA.className = 'addPlayer-Speed-RA';
        inputPlayerSpeed_RA.onclick = function (){
            let _n = document.getElementById('inputPlayerSpeed')
            // let regex = /^[A-Z]+$/i
            // if(regex.test( _n.value))
            if(_n.value >= 0 && _n.value < 999){
                _n.value++
            }
        }

        inputPlayerNameLabel.className = 'addPlayer-label'
        inputPlayerRaceLabel.className = 'addPlayer-label'
        inputPlayerClassLabel.className = 'addPlayer-label'
        inputPlayerHPLabel.className = 'addPlayer-label'
        inputPlayerTitle.className = 'add-player-title'
        inputPlayerSpeedLabel.className = 'addPlayer-label'

        inputPlayerName.className = 'addPlayer-input'
        inputPlayerRace.className = 'addPlayer-input'
        inputPlayerClass.className = 'addPlayer-input'
        inputPlayerHP.className = 'addPlayer-input number';
        inputPlayerSubmit.className = 'btn btn-primary addPlayer-submit'
        inputPlayerSpeed.className = 'addPlayer-input number'

        inputPlayerName.id = 'inputPlayerName'
        inputPlayerRace.id = 'inputPlayerRace'
        inputPlayerClass.id = 'inputPlayerClass'
        inputPlayerHP.id = 'inputPlayerHP';
        inputPlayerSubmit.id = 'inputPlayerSubmit'
        inputPlayerSpeed.id = 'inputPlayerSpeed'


        inputPlayerName.type = 'text'
        inputPlayerRace.type = 'text'
        inputPlayerClass.type = 'text'
        inputPlayerHP.type = 'number'
        inputPlayerHP.min = '0'
        inputPlayerHP.value = '0'
        inputPlayerSpeed.type = 'number'
        inputPlayerSpeed.min = '0'
        inputPlayerSpeed.value = '0'


        inputPlayerNameLabel.innerHTML = 'Name'
        inputPlayerRaceLabel.innerHTML = 'Race'
        inputPlayerClassLabel.innerHTML = 'Class'
        inputPlayerHPLabel.innerHTML = 'HP'
        inputPlayerTitle.innerHTML = 'Add NPC'
        inputPlayerSubmit.innerHTML = 'Add'
        inputPlayerSpeedLabel.innerHTML = 'SP'

        addPlayerMenu.appendChild(inputPlayerTitle)
        addPlayerMenu.appendChild(inputPlayerNameLabel)
        addPlayerMenu.appendChild(inputPlayerName)
        addPlayerMenu.appendChild(inputPlayerClassLabel)
        addPlayerMenu.appendChild(inputPlayerClass)
        addPlayerMenu.appendChild(inputPlayerRaceLabel)
        addPlayerMenu.appendChild(inputPlayerRace)

        addPlayerMenu.appendChild(inputLangLabel)
        addPlayerMenu.appendChild(inputLang)
        addPlayerMenu.appendChild(languageListCont)
        addPlayerMenu.appendChild(inputPlayerStats)
        
        inputPlayerStats.appendChild(inputLevelLabel);
        inputPlayerStats.appendChild(inputLevelContainer);
        inputPlayerStats.appendChild(armorClassLabel)
        inputPlayerStats.appendChild(armorClassContainer)
        inputPlayerStats.appendChild(inputPlayerHPLabel)
        inputPlayerStats.appendChild(inputPlayerHPc)

        inputPlayerHPc.appendChild(inputPlayerHP_LA)
        inputPlayerHPc.appendChild(inputPlayerHP)
        inputPlayerHPc.appendChild(inputPlayerHP_RA)
        inputPlayerStats.appendChild(inputPlayerSpeedLabel)
        inputPlayerStats.appendChild(inputPlayerSpeedc)
        inputPlayerSpeedc.appendChild(inputPlayerSpeed_LA)
        inputPlayerSpeedc.appendChild(inputPlayerSpeed)
        inputPlayerSpeedc.appendChild(inputPlayerSpeed_RA)

        // Upload Img
        let inputPlayerImgLabel = document.createElement('label')
        let inputPlayerImg = document.createElement('input');
        let inputPlayerImgRef = document.createElement('img')

        inputPlayerImgLabel.htmlFor = 'tokenImg'
        inputPlayerImgLabel.className = 'tokenImg-label';
        inputPlayerImgLabel.innerHTML = 'Click to Upload Icon'
        inputPlayerImgLabel.id = 'tokenImg-label'

        inputPlayerImg.id = 'tokenImg';
        inputPlayerImg.accept = '.jpg,.png,.jpeg'
        inputPlayerImg.onchange = addPlayerImgPreview
        inputPlayerImg.className = 'tokenImg'
        inputPlayerImg.type = 'file';
        // Img Reference
        inputPlayerImgRef.style = '';
        inputPlayerImgRef.id = 'tokenImg-reference'
        inputPlayerImgRef.className = 'tokenImg-reference';
        inputPlayerImgRef.name = 'tokenImg'


        inputPlayerSubmit.onclick = submitPlayer;

        addPlayerMenu.appendChild(inputPlayerImgLabel);
        addPlayerMenu.appendChild(inputPlayerImg);
        addPlayerMenu.appendChild(inputPlayerImgRef);
        addPlayerMenu.appendChild(inputPlayerSubmit);

        // Message Box

        let inputPlayerMessage = document.createElement('p');
        inputPlayerMessage.innerHTML = '';
        inputPlayerMessage.id = 'inputPlayerMessage';
        inputPlayerMessage.className = 'inputPlayerMessage';
        addPlayerMenu.appendChild(inputPlayerMessage)

    },100)

}

// Add Player Img Preview when Input

function addPlayerImgPreview(e){
    // Name of Selected input
    // console.log(e.target)
    // console.log(e.target.id)

    let input = document.getElementById(e.target.id);
    let preview = document.getElementById('tokenImg-label');
    let referenceSelected = document.getElementById('tokenImg-reference')

    let formSend = new FormData();
    // console.log(e.target)
    
    const curFiles = input.files;
    if(curFiles.length === 0) {
        // console.log('no files')
    }else{
        for(const file of curFiles) {
            if(file) {
                formSend.append('img-edit', input.files[0], input.files[0].name)

                async function sendForm(){
                    // console.log(formSend)
                    try {
                        const {data} = await axios.post('/img-process', formSend)

                        // console.log(data)

                        referenceSelected.src = data.URI;
                        if(preview.className != 'tokenImg-label preview'){
                            preview.classList.toggle('preview')
                        }
                        preview.innerHTML = ''
                        preview.style = `background-image: url('${data.URI}')`;

                    } catch (error) {
                        console.log(error)
                    }
                }
                sendForm();
                
            } else {
                console.log('no type right')
            }
        }
        // console.log(formSend)
    }

}

// Check if Player Already Exists

function isPlayerExists(Pname){
    for(let el of playerList){
        if(el.playerName === Pname.value){
            return true
        }
    }
}

// Submit Players

function submitPlayer(){

    // Names
    let Pname = document.getElementById('inputPlayerName')
    let Pclass = document.getElementById('inputPlayerClass')
    let Prace = document.getElementById('inputPlayerRace')
    
    // Array of Languages
    let PlangList = languageList;
    
    // Numbers
    let Plevel = gEI('addPlayer-level');
    let ParmorClass = gEI('addPlayer-armorClass');
    let PhitPoints = document.getElementById('inputPlayerHP')
    let Pspeed = document.getElementById('inputPlayerSpeed')
    
    // Image
    let Pimg = document.getElementById('tokenImg-reference')
    
    // Error Message
    let Pmessage = document.getElementById('inputPlayerMessage')

    let menuPlayerList = document.getElementById('player-list')
    if(Pname.value === '' || Pclass.value === '' || Prace.value === '' || PhitPoints.value <= 0 || Pspeed <= 0 || Pimg.src === ''){
        Pmessage.innerHTML = 'Fill Out Details!';
        Pmessage.classList.toggle('error')
        setTimeout(()=>{
            Pmessage.classList.toggle('error')
        },1500)
    }else if(isPlayerExists(Pname)){
        Pmessage.innerHTML = 'Player Already Exists';
        Pmessage.classList.toggle('error')
        setTimeout(()=>{
            Pmessage.classList.toggle('error')
        },1500)
    }else{
        // console.log(Pimg.src)
        let dP = {
            campaign: allChat,
            name: Pname.value,
            class: Pclass.value,
            race: Prace.value,
            armorClass: ParmorClass.value,
            deathsaves: {
                success:0,
                fail:0,
            },
            hitpoints: PhitPoints.value,
            speed: Pspeed.value,
            img: Pimg.src,
            languages: PlangList,
            token: Pimg.src,
            level: Plevel.value,
            username: Username,
        }
        // console.log(dP)
        characters.push(dP)
        socket.emit('send-character', dP)
        getPlayerList(menuPlayerList);
        exitEditPlayer();
        sendDBCharacter(dP);
    }
}

// Send to Name to Server
async function sendDBCharacter(datapackage){
    try {
        const {data} = await axios.post('/new-character', datapackage)
        console.log(data)
        
        let inputMsg = gEI('inputPlayerMessage');

        if(data.status != 'Character Already Exists'){
            // Hide Create Character Screen

            exitEditPlayer();
            
        }else{
            inputMsg.classList.toggle('error')
            inputMsg.innerHTML = 'Character Already Exists';
            setTimeout(()=>{
                inputMsg.classList.toggle('error')
            },2500)
        }
    } catch (error) {
        console.log(error)
    }
}


// Remove Player

function doRemovePlayer(e){
    // console.log(e.target.name)

    // Remove Div for Player in Update Players

    let divs = document.getElementsByClassName('player-item-c')
    for(el of divs){
        if(el.name === e.target.name){
            el.remove()
        }
    }

    // Remove Player from Tokens, TokenPos and Player List

    for(let el of tokenPos){
        if(el.player === e.target.name){
            tokenPos.splice(tokenPos.indexOf(el),1)
        }
    }
    for(let el of tokens){
        if(el.index === e.target.name){
            tokens.splice(tokens.indexOf(el,1))
        }
    }
    for(let el of playerList){
        if(el.playerName === e.target.name){
            playerList.splice(playerList.indexOf(el,1))
        }
    }

    if(playerList.length === 0){
        areTokensOnMap = false;
        exitListenTokenReselect();
        exitTokenCM();
    }

}

// Edit Players from the List

function doEditPlayers(){
    // console.log('bad')

    let playerMenu = document.getElementById('playerMenu');
    let addPlayerMenuContainer = document.getElementById('addplayer-menu-container')
    playerMenu.classList.toggle('small')
    if(addPlayerMenuContainer){
        addPlayerMenuContainer.classList.toggle('small')
    }
    playerMenu.innerHTML = '';
    setTimeout(()=>{

        if(addPlayerMenuContainer){
            addPlayerMenuContainer.remove()
        }

        playerMenu.classList.toggle('editMode')
        let editPlayerList = document.createElement('div');
        editPlayerList.classList = 'player-list'
        editPlayerList.style = 'height:80%;grid-auto-rows:180px;'
        playerMenu.appendChild(editPlayerList)
    
        for(let el of characters){
            // Item Container
            let playerItemC = document.createElement('div');
            playerItemC.className = 'player-item-c'
            playerItemC.name = el.name;
            editPlayerList.appendChild(playerItemC);
    
            // Text Input Container
            let textInpC = document.createElement('div');
            textInpC.className = 'edit-text-inputC';
            playerItemC.appendChild(textInpC)

            // Text Input Main
            let textInpMain = document.createElement('div');
            textInpMain.className = 'edit-text-inputMain';
            textInpC.appendChild(textInpMain)

            // Remove Button
            let removePlayer = document.createElement('a')
            removePlayer.className = 'remove-player'
            removePlayer.innerHTML = 'Remove Player'
            removePlayer.onclick = doRemovePlayer
            removePlayer.name = el.name
            
            // Img Input Main
            let imgInputMain = document.createElement('div');
            imgInputMain.className = 'img-input-main';
            textInpC.appendChild(imgInputMain);
            
            // Img Holder Link
            let imgHolderA = document.createElement('a');
            imgHolderA.className = 'img-holder-a';
            imgHolderA.id = 'img-holder-a';
            imgInputMain.appendChild(imgHolderA);

            // Img bucket to reference for extraction
            let imgReference = document.createElement('img');
            imgReference.src = el.img;
            imgReference.name = el.name;
            imgReference.className = 'img-reference';
            imgHolderA.appendChild(imgReference)

            // Img Holder Itself (LABEL)
            let imgHolder = document.createElement('label');
            imgHolder.htmlFor = el.name
            imgHolder.className = 'img-edit';
            imgHolder.name = el.name;
            imgHolder.style = `background-image: url(${el.token})`
            imgHolderA.appendChild(imgHolder);
            
            // Img Holder Input file bucket
            let imgFiles = document.createElement('input')
            imgFiles.id = el.name
            imgFiles.name = el.name
            imgFiles.type = 'file'
            imgFiles.accept = '.jpeg, .png, .jpg'
            imgFiles.style = 'opacity:0;width:0px;height:0px;position:absolute;'
            imgFiles.onchange = updateImageEdit;
            imgHolderA.appendChild(imgFiles)

            // Name Input
            let nameInput = document.createElement('input');
            nameInput.value = el.name;
            nameInput.type = 'text';
            nameInput.placeholder = 'Player Name'
            nameInput.className = 'edit-input name-edit-input';
            nameInput.name = el.name;
            textInpMain.appendChild(nameInput);
    
            // Class Input
            let classInput = document.createElement('input')
            classInput.value = el.class;
            classInput.type = 'text';
            classInput.placeholder = 'Class'
            classInput.className = 'edit-input class-edit-input';
            classInput.name = el.name;
            textInpMain.appendChild(classInput);
    
            // Race Input
            let raceInput = document.createElement('input')
            raceInput.value = el.race;
            raceInput.type = 'text';
            raceInput.placeholder = 'Race'
            raceInput.className = 'edit-input race-edit-input';
            raceInput.name = el.name;
            textInpMain.appendChild(raceInput);
            textInpMain.appendChild(removePlayer)

            // Stats Container
            let statsC = document.createElement('div')
            statsC.className = 'edit-stats-container';
            playerItemC.appendChild(statsC)
    
            // HP Input
            let HPLabel = document.createElement('label')
            HPLabel.innerHTML = 'HP'
            let HPInput = document.createElement('input')
            HPInput.value = el.hitpoints;
            HPInput.type = 'number'
            HPInput.className = 'number-edit-input hp';
            HPInput.name = el.name;
            statsC.appendChild(HPLabel)
            statsC.appendChild(HPInput);
    
            // AC Input
            let ACLabel = document.createElement('label')
            ACLabel.innerHTML = 'AC'
            let ACInput = document.createElement('input')
            ACInput.value = el.armorClass;
            ACInput.type = 'number'
            ACInput.className = 'number-edit-input ac';
            ACInput.name = el.name;
            statsC.appendChild(ACLabel)
            statsC.appendChild(ACInput);

            // Speed Input
            let speedLabel = document.createElement('label')
            speedLabel.innerHTML = 'SP'
            let speedInput = document.createElement('input')
            speedInput.value = el.speed;
            speedInput.type = 'number'
            speedInput.className = 'number-edit-input speed';
            speedInput.name = el.name;
            statsC.appendChild(speedLabel)
            statsC.appendChild(speedInput);    
        }
        // Submit Button to Update
        let updateBtn = document.createElement('a');
        updateBtn.className = 'update-players';
        updateBtn.innerHTML = 'Update Players';
        updateBtn.onclick = updatePlayers;

        let cancelBtn = document.createElement('a');
        cancelBtn.className = 'cancel-update-players';
        cancelBtn.innerHTML = 'Cancel';
        cancelBtn.onclick = exitPlayerMenu;
        
        playerMenu.appendChild(updateBtn)
        playerMenu.appendChild(cancelBtn)        
    },350)


}

// Update Img Edit Token

function updateImageEdit(e){

    // Name of Selected input
    // console.log(e.target)
    // console.log(e.target.id)

    let input = document.getElementById(e.target.id);
    let p_preview = document.getElementsByClassName('img-edit');
    let referenceImgs = document.getElementsByClassName('img-reference')
    let preview = undefined;
    let referenceSelected = undefined

    for(let el of p_preview){
        if(el.name === e.target.id){
            for (let ol of referenceImgs){
                if(ol.name === el.name){
                    referenceSelected = ol
                }
            }
            preview = el
        }
    }

    let formSend = new FormData();
    // console.log(e.target)
    
    const curFiles = input.files;
    if(curFiles.length === 0) {
        console.log('no files')
    }else{
        for(const file of curFiles) {
            if(file) {
                formSend.append('img-edit', input.files[0], input.files[0].name)

                async function sendForm(){
                    // console.log(formSend)
                    try {
                        const {data} = await axios.post('/img-process', formSend)

                        // console.log(data)

                        referenceSelected.src = data.URI;
                        preview.style = `background-image: url('${data.URI}')`;

                    } catch (error) {
                        console.log(error)
                    }
                }
                sendForm();
                
            } else {
                console.log('no type right')
            }
        }
        // console.log(formSend)
    }
}

// Update Players

function updatePlayers(){
    let Pnames = document.getElementsByClassName('edit-input name-edit-input')
    let Pclass = document.getElementsByClassName('class-edit-input')
    let Praces = document.getElementsByClassName('race-edit-input')
    let Php = document.getElementsByClassName('number-edit-input hp')
    let Pac = gEC('number-edit-input ac')
    let Psp = document.getElementsByClassName('number-edit-input speed')
    let Pimg = document.getElementsByClassName('img-reference')

    let newPlayerList = [];

    for(i=0;i<Pnames.length;i++){
        let playerObj = {};
        playerObj.name = Pnames[i].value;
        playerObj.class = Pclass[i].value
        playerObj.race = Praces[i].value
        playerObj.hitpoints = Php[i].value
        playerObj.armorClass = Pac[i].value
        playerObj.speed = Psp[i].value
        playerObj.token = Pimg[i].src
        newPlayerList.push(playerObj)

        for(let el of characters){
            if(el.name === Pnames[i].name){
                el.name = Pnames[i].value;
                el.race = Praces[i].value;
                el.class = Pclass[i].value;
                el.hitpoints = Php[i].value;
                el.armorClass = Pac[i].value;
                el.speed = Psp[i].value;
                el.token = Pimg[i].src;
            }
        }
        
        // Use new Player List to redo TokenPos and Tokens
        //  i is the index of Player List
        // Compare the player list name to the tokenPos and Tokens
        
        for(let el of tokenPos){
            if(el.player === characters[i].name){
                el.player = Pnames[i].value;
            }
        }
        for(let el of tokens){
            if(el.index === characters[i].name){
                el.index = Pnames[i].value;
                let doChangeIcon = new Image()
                doChangeIcon.src = Pimg[i].src;
                el.image = doChangeIcon;
            }
        }
    }

    socket.emit('player-edit', characters)
    
    // async function uploadtoDB(){
    //     try {
    //         const {data} = await axios.post('characters')
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }
    // uploadtoDB();
    // Make new Player List
    // playerList = []
    // playerList = newPlayerList

    exitPlayerMenu();
}

// Create Token to Place on Board
// Token link Clicks

function doDrawToken(x,y,w,h,image, index){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.image = image
    this.index = index

    this.draw = function(){
        // c.beginPath();
        // c.arc(this.x+tileSize/2, this.y+tileSize/2,this.h/2,0,180,false);
        // c.fillStyle = '#a52a2a6b';
        // c.fill()
        c.drawImage(this.image, this.x, this.y, this.w, this.h)
    }
    this.update = function(){
        // let x = tokenPos.x*tileSize;
        // let y = tokenPos.y*tileSize;    
        this.x = x+imgPos.x
        this.y = y+imgPos.y
        this.w = tileSize
        this.h = tileSize

        this.draw();
    }

}

let img_t = undefined;
let pName = undefined;
let existsIndex = undefined;
let isListeningForReselect = false;
let isTokenReselect = false;

// Check the tokens to see if it already exists

function checkIfTokenExist(e){
    for(i=0;i<tokenPos.length;i++){
        // console.log(existsIndex)
        if(e.target.name === tokenPos[i].player){
            existsIndex = i
            return true
        }
    }
}

// State 1 - Token Select

function createToken(e){

    img_t = new Image();
    img_t.src = e.target.src;
    // console.log(img_t)
    pName = e.target.name

    // console.log(e.target.name)
    // console.log(existsIndex)
    if(checkIfTokenExist(e)){
        // console.log(existsIndex);
        tokens.splice(existsIndex,1);
        tokenPos.splice(existsIndex, 1);
    }
    canvas.removeEventListener('mousedown', onMouseClick)
    canvas.removeEventListener("mouseup", onMouseEnd)

    canvas.addEventListener('mousedown', onTokenDown)
    canvas.addEventListener('mousemove', onTokenMove)
    // console.log(e.target.src)
}

function onTokenMove(e){
    // const rect = canvas.getBoundingClientRect();
    // const movex = e.clientX - rect.left;
    // const movey = e.clientY - rect.top;

    // console.log(whereAmI(e))


    let x = whereAmI(e).tileX*tileSize
    let y = whereAmI(e).tileY*tileSize
    let w = tileSize
    let h = tileSize
    
    drawToken = new doDrawToken(x,y,w,h,img_t)

    isTokenSelected = true;

}

// State 2 - onTokenDown

function onTokenDown(e){
    let x = whereAmI(e).tileX*tileSize;
    let y = whereAmI(e).tileY*tileSize;

    let tPos = {
        player: pName,
        x: whereAmI(e).tileX,
        y: whereAmI(e).tileY,
    }

    
    drawToken = new doDrawToken(x,y,tileSize,tileSize,img_t, pName)



    tokenPos.push(tPos)
    tokens.push(drawToken);

    // Emit Change
    positionChangeEmit(tPos)

    if(isTokenReselect){
        canvas.removeEventListener('mousemove', reselectTokenOnMove)
        canvas.removeEventListener('mouseup', onTokenDown)
        isTokenReselect = false
    }

    canvas.removeEventListener('mousedown', onTokenDown)
    canvas.removeEventListener('mousemove', onTokenMove)
    
    isTokenSelected = false;
    areTokensOnMap = true;
    tokenContextMenu();
    onS0();

    if(!isListeningForReselect){
        isListeningForReselect = true;
        listenTokenReselect();
    }

}

// Re-Select Token to Move
// Listener turn on if tokens are active

function listenTokenReselect(){
    canvas.addEventListener('mousedown', overToken)
    canvas.addEventListener('mousemove', hoverToken)
}

function exitListenTokenReselect(){
    canvas.removeEventListener('mousedown', overToken)
    canvas.removeEventListener('mousemove', hoverToken)
}

function drawHoverShadow(x, y){
    this.x = x;
    this.y = y;

    this.draw = function(){
        c.fillRect(x,y,tileSize,tileSize);
        c.fillStyle='#a52a2a6e';


    }

    this.update = function(){
        this.draw()
    }
}

// Token Hover Animation for Re-Selection
function hoverToken(e){
    // console.log(isOnTokenCM(e))
    // console.log(whichToken(e))
    // console.log(tokenPos[whichToken(e)])

    if(isOnTokenCM(e)){
        if(!isHoveredOver){
            let x = tokenPos[whichToken(e)].x*tileSize+imgPos.x;
            let y = tokenPos[whichToken(e)].y*tileSize+imgPos.y;
    
            let left = tokenPos[whichToken(e)].x*tileSize;
            let top = tokenPos[whichToken(e)].y*tileSize;
            
            // Shadow Selection
            isHoveredOver = true;
            focusedShadow = new drawHoverShadow(x,y)
    
            // Name Tag
            let nameTagCont = document.createElement('div')
            nameTagCont.className = 'nameTag'
            nameTagCont.id = 'nameTag'
            nameTagCont.name = whichToken(e);
            nameTagCont.style = `top:${y}px;left:${x}px;height:${tileSize/2}px;`;
            nameTagCont.innerHTML = `<p style='text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.431);margin:0px;'>${tokenPos[whichToken(e)].player}</p>`
            canvasMain.appendChild(nameTagCont);
            setTimeout(()=>{
                nameTagCont.style = `top:${y-tileSize/2}px;left:${x}px;height:${tileSize/2}px;opacity:1;`;
            },10)
        }
    }else{
        if(isHoveredOver){
            // console.log('woah')
            let nameTag = document.getElementById('nameTag')
            nameTag.remove();
            isHoveredOver = false;
        }
    }
}


let reselecImg_t = undefined;

// Check if click was over Token

function overToken(e){

    if(e.buttons === 1){
        let x = whereAmI(e).tileX;
        let y = whereAmI(e).tileY;
    
        for(i=0;i<tokenPos.length;i++){
            if(tokenPos[i].x === x && tokenPos[i].y === y){
                reselectToken(e)
                pName = tokenPos[i].player;
                tokenPos.splice(i, 1)
                tokens.splice(i,1)
            }
        }
    }
}

// State 3 - onTokenReselect

function reselectToken(e){
    offS0();

    // console.log(whichToken(e))
    // tokenPos[whichToken(e)].player

    img_t = new Image();
    
    for(let el of characters){
        if(el.name === tokenPos[whichToken(e)].player){
            img_t.src = el.token
        }
    }

    let x = whereAmI(e).tileX*tileSize;
    let y = whereAmI(e).tileY*tileSize;
    let w = tileSize
    let h = tileSize

    drawToken = new doDrawToken(x,y,w,h,img_t)

    isTokenReselect = true
    isTokenSelected = true
    
    canvas.addEventListener('mouseup', onTokenDown)
    canvas.addEventListener('mousemove', reselectTokenOnMove)
}


function reselectTokenOnMove(e){
    let isTokenOverAnother = false;

    let x = whereAmI(e).tileX*tileSize;
    let y = whereAmI(e).tileY*tileSize;

    let x_ = whereAmI(e).tileX;
    let y_ = whereAmI(e).tileY;

    let w = tileSize
    let h = tileSize
    
    for(let el of tokenPos){
        if(x_ === el.x && y_ === el.y){
            isTokenOverAnother = true;
            isTokenSelected = false;
            exitListenTokenReselect();
            canvas.removeEventListener('mouseup', onTokenDown)
        }
    }
    if(!isTokenOverAnother){
        isTokenSelected = true
        isTokenSelected = true
        listenTokenReselect();
        canvas.addEventListener('mouseup', onTokenDown)
        drawToken = new doDrawToken(x,y,w,h,img_t)
    }
}

function deleteToken(e){

    // delete Token
    for(i=0;i<tokenPos.length;i++){
        if(e.target.name === tokenPos[i].player){
            tokenPos.splice(i, 1)
            tokens.splice(i, 1)
            resetTokenCM(e);
            emitTokenRemoval(e)
            // Remove Event Listeners
            canvas.removeEventListener('mousedown', resetTokenCM)    
            // Back to state0
            onS0();
            tokenContextMenu();

            if(tokens.length === 0){
                areTokensOnMap = false
                isTokenSelected = false
                exitTokenCM();
            }
        }
    }
}

// Token Information Context Menu
// Token Hover Animation

function isOnTokenCM(e){
    let x = whereAmI(e).tileX;
    let y = whereAmI(e).tileY;

    for(i=0;i<tokenPos.length;i++){
        // console.log(tokenPos[i])
        // console.log(`${x}, ${y}`)
        if(tokenPos[i].x === x && tokenPos[i].y === y){
            return true
        }
    }
}

// Which Token is Selected?

function whichToken(e){
    let x = whereAmI(e).tileX;
    let y = whereAmI(e).tileY;

    for(i=0;i<tokenPos.length;i++){
        // console.log(tokenPos[i])
        // console.log(`${x}, ${y}`)
        if(tokenPos[i].x === x && tokenPos[i].y === y){
            return i
        }
    }
}

// Token CM Event Listeners

function tokenContextMenu(){
    // Show Context Menu
    canvas.addEventListener('mousedown', tokenCMOnDown)
}

// Exit the PlayerCM

function exitTokenCM(){
    // Show Context Menu
    canvas.removeEventListener('mousedown', tokenCMOnDown)
}

// Reset the PlayerCM

function resetTokenCM(e){
    if(isOnTokenCM(e)){
        let cMenu = document.getElementById('cMenu')
        cMenu.remove();
        onS0();
        if(areTokensOnMap){
            canvas.removeEventListener('mousedown', resetTokenCM)    
            tokenContextMenu();
        }
    }else{
        let cMenu = document.getElementById('cMenu');
        cMenu.remove();
        canvas.removeEventListener('mousedown', resetTokenCM)
        tokenContextMenu();
        onS0();
    }
}

// Actions on CM

function tokenCMOnDown(e){
    if(e.buttons === 2){
        if(isOnTokenCM(e)){
            exitTokenCM();
            offS0();

            let x = whereAmI(e).tileX*tileSize + imgPos.x;
            let y = whereAmI(e).tileY*tileSize + imgPos.y;
        
            // Token 
    
            canvas.addEventListener('mousedown', resetTokenCM)    
            let cMenu = document.createElement('div')
            cMenu.className = 'cMenu'
            cMenu.id = 'cMenu'
            cMenu.name = tokenPos[whichToken(e)].player
            cMenu.style = `top:${y}px;left:${x+tileSize}px;width:fit-content;height:fit-content;`
            canvasMain.insertAdjacentElement('afterbegin' ,cMenu);
    
            let button1 = document.createElement('a')
            button1.innerHTML = 'Move'
            button1.className = 'cBtn move'
            cMenu.appendChild(button1);

            let button2 = document.createElement('a')
            button2.innerHTML = 'Action'
            button2.className = 'cBtn move'
            cMenu.appendChild(button2);

            let button3 = document.createElement('a')
            button3.innerHTML = 'Shit'
            button3.className = 'cBtn move'
            cMenu.appendChild(button3);

            let button4 = document.createElement('a')
            button4.innerHTML = 'Player Sheet'
            button4.className = 'cBtn move'
            cMenu.appendChild(button4);

            let button5 = document.createElement('a');
            button5.innerHTML = 'Remove';
            button5.id = 'Remove';
            button5.name = tokenPos[whichToken(e)].player
            button5.className = 'cBtn remove';
            button5.onclick = deleteToken
            cMenu.appendChild(button5);
        }    
    }
}

/* ADDITIONAL DM SITE CODE */

// Chat MSGS

let chat = gEI('chat');
let chatContainer = gEI('chat-main-container');
let chatHideIcon = gEI('chat-hide-icon');
let chatOpenArrow = gEI('chat-openArrow');

function chatListenerOn(){
    chat.addEventListener('click', onChatMouseDown)
}
chatListenerOn();

function chatListenerOff(){
    chat.removeEventListener('click', onChatMouseDown)
}

function onChatIconMouseDown(e){
    chatContainer.classList.toggle('hide')
    chatOpenArrow.classList.toggle('hide')
}

function onChatArrowUp(e){

    chatContainer.classList.toggle('hide')
    if(chatOpenArrow.className === 'chat-openArrow notification'){
        chatOpenArrow.classList.toggle('notification')
    }
    chatOpenArrow.classList.toggle('hide')

}

function onChatMouseDown(){
    closeMenu();
    chatContainer.classList.toggle('hide')
    if(chatOpenArrow.className === 'chat-openArrow notification'){
        chatOpenArrow.classList.toggle('notification')
    }
    chatOpenArrow.classList.toggle('hide')
}

// Chat engine to connect players

let sendChat = gEI('send-chat');
sendChat.onclick = onChatSubmit;
let chatInputMsg = gEI('chat-textarea');
chatInputMsg.oninput = chatTextAreaCheck;
let allChatTab = gEC('chat-convo selected');
allChatTab[0].onclick = selectConvo;
allChatTab[0].name = allChat;



// Switches

let isCodeOn = false;

function chatTextAreaCheck(e){

    let message = chatInputMsg.value
    let room = currentRoom 

    // Press "Enter"
    if(e.data === null && e.inputType === 'insertLineBreak'){

        if(chatInputMsg.value.length <= 1){
            console.log('no')
            chatInputMsg.value = '';

        }else if(room != allChat){

            for(let el of UsersConnected){
                if(el.name === room){
                    sendMessage(el.id, message)
                }
            }
        }else if(room === allChat){
            console.log('ALL')
            console.log(room)
            sendMessage(room, message)
        }
    }
}

function onChatSubmit(e){
    let message = chatInputMsg.value;
    let room = currentRoom;
    // console.log(e.data , e.inputType)
    // console.log(e)

    if(message === '' || !message){
        return
    }else if(room != allChat){
        for(let el of UsersConnected){
            if(el.name === room){
                sendMessage(el.id, message)
            }
        }
    }else if(room === allChat){
        console.log('ALL')
        console.log(room)
        sendMessage(room, message)
    }
}

// MESSAGE SENDER

let allChatBox = gEI(ejs_id)
allChatBox.addEventListener('scroll', stopAutoScroll )

function sendMessage(room, message){
    let chatBox;
    if(room === allChat){
        chatBox = gEI(allChat)
    }else{
        for(let el of UsersConnected){
            if(el.id === room){
                chatBox = gEI(el.name)
            }
        }
    }
    // console.log(message)
    if(!message || message === ''){
        // console.log('no')
        chatInputMsg.value = '';
    }else{
        for(let el of UsersConnected){
            if(el.name === room){
                room = el.id;
                console.log('Change ID to real ID')
            }
        }
        
        console.log(room)
        // socket.emit('join-room', room);
        socket.emit('send-message', message, room, Username);
        chatInputMsg.value = '';
    
        let p_ = cE('p');
        p_.className = 'chat-msg user';
        p_.innerHTML = `<span style="color: #fffb00;">${Username}: </span>${message}`
        chatBox.appendChild(p_);
        if(isAutoScrollDown){
            gotoBottom(chatBox.id);
        }
    }
}

// System Messages
function sysMessage(message){
    let currentChatbox = gEI(allChat);
    let p_ = cE('p');
    p_.className = 'chat-msg bot';
    p_.innerHTML = `<span style="color: #cacaca;">Bot:</span>${message} has Joined!`
    currentChatbox.appendChild(p_);
    if(isAutoScrollDown){
        gotoBottom(currentChatbox.id);
    }
}

// New User Entered

function newUserConnects(user, privateID){
    // Chat Tabs of Convos CONTAINER
    let chatConvo = gEI('chat-convo-container');

    // Create new TAB CONVO
    let newTab = cE('a');
    
    // Switch to check if the person is Already Connected
    let isAlreadyConnected = false

    // Go through UsersConnected to check if User is already in there
    for(i=0;i<UsersConnected.length; i++){
        if(UsersConnected[i].name === user){
            UsersConnected[i].id = privateID;
            // If user is already in the list then switch on
            isAlreadyConnected = true;
        }
    }
    // Send the User List you have back to the new User.
    socket.emit('user-list', UsersConnected)
    
    /* If user never had been connected then Add the 
    tab and Push to the UsersConnected array */
    if(!isAlreadyConnected){
        // Make new Tab
        newTab.className = 'chat-convo';
        newTab.innerHTML = user.split(' ')[0]
        newTab.name = user;
        let dt = {
            name: user,
            id: privateID,
        }
        UsersConnected.push(dt);
        newTab.onclick = selectConvo;
        chatConvo.insertAdjacentElement('beforeend' ,newTab)

        // Make new Chat Box
        let chatCont_ = gEI('chat-container')

        // Create New Chat Box for newly made Chat
        let chatbox = cE('div');
        chatbox.id = user;
        chatbox.className = 'chat-box hide';
        chatbox.onscroll = stopAutoScroll;
        
        // Push to Chatboxes
        Chatboxes.push(user)
        
        // Add New Chat box
        chatCont_.insertAdjacentElement( 'afterbegin' ,chatbox); 
    }
}

// On User disconnects

function userDisconnects(id){

    let convoTab = gEC('chat-convo')
    let itemRemove = undefined;
    let index = undefined;

    for(let el of UsersConnected){
        if(el.id === id){
            itemRemove = el;
            index = UsersConnected.indexOf(el)
            UsersConnected.splice(index,1)
            for(let ol of convoTab){
                if(ol.name === itemRemove.name){
                    if(ol.name === currentRoom){
                        let allChatEl = gEI(allChat);
                        allChatEl.classList.toggle('hide');
                        convoTab[0].classList.toggle('selected')
                    }
                    ol.remove();
                    let convoBox = gEI(itemRemove.name)
                    convoBox.remove()
                }
            }
        }
    }


}

// PhoneBook Calls in with All players Sync

function phonebook(u_){
    // console.log(u_)
    // console.log(Username)
    // console.log(UsersConnected)
    // Check Phonebook given item by item
    for(let ol of u_){
        // Avoid doubling own Username
        if(ol.name != Username){
            // console.log(ol)
            // console.log(Chatboxes.indexOf(ol.name))
            // Match by Name  UsersConnected.indexOf(ol) === -1
            if(Chatboxes.indexOf(ol.name) === -1){
                let test = / /;
                
                // Create Tab
                let chatConvo = gEI('chat-convo-container');
                let newTab = cE('a');        
                newTab.className = 'chat-convo';
                newTab.innerHTML = test.test(ol.name)?ol.name.split(' ')[0]:ol.name
                newTab.name = ol.name;
                newTab.onclick = selectConvo;
                chatConvo.insertAdjacentElement('beforeend' ,newTab)
    
                // Create ChatBox
                let chatCont_ = gEI('chat-container')
    
                // Create New Chat Box for newly made Chat
                let chatbox = cE('div');
                chatbox.id = ol.name;
                chatbox.className = 'chat-box hide';
                chatbox.onscroll = stopAutoScroll;
                
                // Push to Chatboxes
                Chatboxes.push(ol.name)

                // Push to UsersConnected
                UsersConnected.push(ol)
                
                // Add New Chat box
                chatCont_.insertAdjacentElement( 'afterbegin' ,chatbox);
    
            }    
        }
    }
}


// Receive Messages

socket.on('receive-message', (message, room, username_)=>{

    // ROOM = PRIVATEID TO GO ->
    // username_ = USERNAME OF WHO IT COMES FROM

    console.log(room, username_, message)
    if(room === allChat){
        // Notification
        notifyMsg(room);

        let user = username_

        let currentChatbox = gEI(room);
        let p_ = cE('p');
        p_.className = 'chat-msg';
        p_.innerHTML = `<span style="color: tomato;">${user}: </span>${message}`
        currentChatbox.appendChild(p_);
        if(isAutoScrollDown){
            gotoBottom(currentChatbox.id);
        }

    }else{
        if(room === privateChat ){
            let user = username_
            notifyMsg(user);
            console.log(user)
            let currentChatbox = gEI(user);
            let p_ = cE('p');
            p_.className = 'chat-msg';
            p_.innerHTML = `<span style="color: tomato;">${user}: </span>${message}`
            currentChatbox.appendChild(p_);
            if(isAutoScrollDown){
                gotoBottom(currentChatbox.id);
            }
        }
    }
})

// Change Room
function selectConvo(e){
    // console.log(e.target.name)
    let isAlreadyChatbox = false;
    let selectedChatBox = undefined; 
    let chatCont_ = gEI('chat-container')

    for(let el of Chatboxes){
        if(el === e.target.name){
            isAlreadyChatbox = true;
            selectedChatBox = el;
            // console.log('Yes')
        }
    }
    if(isAlreadyChatbox){

        // Select Tab that was Active
        let currentChatboxName = gEC('chat-convo selected')
        
        // Get Current Chat Box
        let currentChatBox= gEI(currentChatboxName[0].name)
        
        // Get all ChatBoxes by CLASS
        let allChatTabs = gEC('chat-convo');
        
        // Target Chatbox
        let targetChatbox = gEI(e.target.name);

        
        for(let el of allChatTabs){
            if(el.name === e.target.name){
                currentChatboxName[0].classList.toggle('selected');
                if(el.className === 'chat-convo notification'){
                    el.classList.toggle('notification')
                }
                el.classList.toggle('selected')
                currentChatBox.classList.toggle('hide')
                // console.log(el.name)
            }
        }
        targetChatbox.classList.toggle('hide')

        // Hide the Current Chat Box

        currentRoom = e.target.name;
    }else{
        // Select Tab that was Active
        let currentChatboxName = gEC('chat-convo selected')
        
        // Get Current Chat Box
        let currentChatBox= gEI(currentChatboxName[0].name)
        
        
        // Hide the Current Chat Box
        currentChatBox.classList.toggle('hide');
        
        // Create New Chat Box for newly made Chat
        let chatbox = cE('div');
        chatbox.id = e.target.name;
        chatbox.className = 'chat-box';
        chatbox.onscroll = stopAutoScroll;
        
        // Push to Chatboxes
        Chatboxes.push(e.target.name)
        
        // Deselect Curretn Chat Box
        currentChatboxName[0].classList.toggle('selected')
        
        // Add New Chat box
        chatCont_.insertAdjacentElement( 'afterbegin' ,chatbox);

        // Change the current Room
        currentRoom = e.target.name;

        // Highlight the Now Current Tab
        let tabs_ = gEC('chat-convo');
        for(let el of tabs_){
            if(el.name === e.target.name){
                el.classList.toggle('selected')
            }
        }
    }



}

// ScrollDown Msgs

function stopAutoScroll(e){
    // console.log(e.target.scrollTop ,e.target.scrollTopMax)
    setTimeout(()=>{
        if(e.target.scrollTop < e.target.scrollTopMax-90){
            isAutoScrollDown = false;
        }else if(e.target.scrollTop === e.target.scrollTopMax){
            isAutoScrollDown = true;
        }
    }, 500)
}

function gotoBottom(id){
    var element = document.getElementById(id);
    element.scrollTop = element.scrollHeight - element.clientHeight;
}

function notifyMsg(e){
    if(currentRoom != e){
        let tabNotify = gEC('chat-convo');
        for(let el of tabNotify){
            if(el.name === e){
                if(el.className != "chat-convo notification"){
                    el.classList.toggle('notification')
                }
            }
        }
    }
    if(chatOpenArrow.className != 'chat-openArrow hide'){
        if(chatOpenArrow.className != 'chat-openArrow notification'){
            chatOpenArrow.classList.toggle('notification')
        }
    }

}


// Position Change Process

socket.on('position-update', (tpos)=>{
    positionUpdate(tpos);
})

// Emitter
function positionChangeEmit(tpos){

    // UpdateDB
    async function positionDBUpdate(){
        try {
            const {data} = await axios.post('/edit-character', {
                campaign: allChat,
                username: Username,
                characterName: tpos.player,
                position: tpos,
            })
        } catch (error) {
            console.log(error)
        }
    }
    positionDBUpdate();

    socket.emit('position-change', (tpos))
}

// Update Position
function positionUpdate(tpos){

    let isUpdated = false;
    let imgUpdate = new Image();
    
    for(let el of tokens){
        if(el.index === tpos.player){
            isUpdated = true;
            tokens.splice(tokens.indexOf(el), 1)
            
            for(let ul of characters){
                if(ul.name === tpos.player){
                    imgUpdate.src = ul.token;
                    endUpdate();
                }
            }

            function endUpdate(){
                let x_ = tpos.x * tileSize;
                let y_ = tpos.y * tileSize;
    
                drawToken = new doDrawToken(x_,y_,tileSize,tileSize,imgUpdate, tpos.player)
    
                // Delete from Tokens
                tokens.push(drawToken)
                for(let ol of tokenPos){
                    if(ol.player === tpos.player){
                        ol.x = tpos.x;
                        ol.y = tpos.y;
                    }
                }
            }
        }
    }
    if(!isUpdated){
        areTokensOnMap = true
        for(let el of characters){
            if(el.name === tpos.player){
                imgUpdate.src = el.token
            }
        }
        tokenPos.push(tpos)
        let x = tpos.x *tileSize;
        let y = tpos.y *tileSize;
        drawToken = new doDrawToken(x,y,tileSize,tileSize,imgUpdate, tpos.player)
        tokens.push(drawToken);
    }
}

// Listen for Token Removal

socket.on('remove-token', tokenName=>{
    tokenRemoval(tokenName)
})

// Emit Token Removal

function emitTokenRemoval(e){
    let tokenName = e.target.name;
    socket.emit('token-removed', tokenName);
}

// Remove Token
function tokenRemoval(tokenName){
    console.log(tokenName)
    for(i=0;i<tokenPos.length;i++){
        if(tokenName === tokenPos[i].player){

            tokenPos.splice(i, 1)
            tokens.splice(i, 1)

            if(tokens.length === 0){
                areTokensOnMap = false
                isTokenSelected = false
                exitTokenCM();
            }
        }
    }
}

// Refresh Players Positions
function refreshPlayers(){

    // Create the Tokens and Add the TokenPos

    for(let el of characters){
        if(el.position){
            let imgUpdate = new Image();
            imgUpdate.src = el.token;
            let x_ = el.position.x * tileSize;
            let y_ = el.position.y * tileSize;
            let name = el.name;
            
            drawToken = new doDrawToken(x_,y_,tileSize,tileSize,imgUpdate, name)
            tokenPos.push(el.position);
            tokens.push(drawToken)
            areTokensOnMap = true
            tokenContextMenu();

            if(!isListeningForReselect){
                isListeningForReselect = true;
                listenTokenReselect();
            }
        

        }
    }


}

// Check get all Characters
async function allCharacters(){
    try {
        const {data} = await axios.post('/all-characters', {campaign: allChat})
        for(let el of data){
            characters.push(el);
        }
        getCampaign();
        refreshPlayers();
    } catch (error) {
        console.log(error)
    }
}

let blackout = gEI('blackout-icon');
blackout.onclick = onBlackout;


async function getCampaign(){
    try {
        const {data} = await axios.post('/getCampaign', {
            campaign: allChat,
        })
        isBlackout = data.blackout;
        if(isBlackout){
            blackout.classList.toggle('on')
        }
    } catch (error) {
        console.log(error)
    }
}

// Blackout
function onBlackout(e){

    let blackoutIcon = gEI('blackout-icon');
    
    if(!isBlackout){
        socket.emit('blackout', {status: 'off'})
        blackoutIcon.classList.toggle('on')
        isBlackout = true;
        blackoutUpdate();
    }else{
        socket.emit('blackout', {status: 'on'})
        blackoutIcon.classList.toggle('on')
        isBlackout = false;
        blackoutUpdate();
    }
}

async function blackoutUpdate(){
    console.log(isBlackout)
    try {
        const {data} = await axios.post('/updateCampaign',{
            campaign: allChat,
            blackout: isBlackout,
        })
        console.log(data)
    } catch (error) {
        console.log(error)
    }
}

// Change Map Menu

let mapsContainer = gEI('maps-container');
let mapsButton = gEI('maps-');
let mapsClose = gEI('maps-close')
let mapsAvailable = gEI('maps-available')

mapsClose.onclick = closeMapsMenu;
mapsButton.onclick = createMapsMenu;

function createMapsMenu(e){
    e.preventDefault();
    e.stopPropagation();

    mapsContainer.classList.toggle('hide')

    async function getAllMaps(){
        try {
            const {data} = await axios.post('/getCampaign', {
                campaign: allChat,
            })
            for(let el of data.maps){
                createMapItems(el, data.maps);
            }
            console.log(data)
        } catch (error) {
            console.log(error)
        }
    }
    getAllMaps();

    
}

function closeMapsMenu(){
    mapsContainer.classList.toggle('hide')
    setTimeout(()=>{
        mapsAvailable.innerHTML = '';
    },300)

}

function createMapItems(el, maps){
    
    let snippet = `<a class="map-link" onclick='switchMaps(event)' name='${el}'>
        <img src='/preview/${el}' class="map-item-img">
    </a>
    <h2 class='map-title'>${el.split('.')[0]}</h2>
    <div class='map-secondary'>
        <a class='map-secondary-link'>Update</a>
        <a class='map-secondary-link'>Rename</a>
        <a class='map-secondary-link'>Delete</a>
    </div>`

    let mapItem = cE('div');
    mapItem.className = 'map-item'
    mapItem.innerHTML = snippet;
    mapsAvailable.appendChild(mapItem);

    if(el === maps[maps.length -1]){
        let newMapInput = cE('div');
        newMapInput.className = 'map-item'
        let snipp_ = `<label class="map-label" for='newMap'>Add Map</label>
        <label for='map-name-input' class='map-label text'>Name</label>
        <input id='map-name-input' type='text'>
        <a class='map-submit' onclick='checkMapSubmit(event)'>Upload</a>
        <input onchange='onMapChange(event)' id='newMap' name='newMap' type='file' style='width:0px;height:0px;opacity:0'>`
        newMapInput.innerHTML = snipp_;
        mapsAvailable.appendChild(newMapInput);
    }

}

function onMapChange(e){
    let files = e.target.files[0];
    let form = new FormData();
    let labelTarget = gEC('map-label')[0]
    form.append('img-edit', files, files.name)

    async function mapChange(){
        try {
            const {data} = await axios.post('/img-process', form);
            console.log(data)
            labelTarget.classList.toggle('preview');
            labelTarget.innerHTML = ''
            labelTarget.style = `background-image: url('${data.URI}');`

        } catch (error) {
            console.log(error)
        }
    }
    mapChange();
}

function checkMapSubmit(e){
    let mapName = gEI('map-name-input');
    let mapNameInput = gEI('newMap');

    if(mapName.value === '' || !mapNameInput.files[0]){
        console.log('missing fields')
    }else{
        mapSubmit(mapName, mapNameInput);
    }
}

async function mapSubmit(mapName, mapNameInput){

    let newForm = new FormData();
    newForm.append('map', mapNameInput.files[0], mapName.value)

    try {
        const {data} = await axios.post('/addMap', newForm)
        console.log(data)
        
        if(data){
            const submitDB = await axios.post('/addMap-campaign', {
                campaign: allChat,
                map: data,
            })
            let mapItems = gEC('map-item');
            let lastItem = mapItems[mapItems.length -1];

            lastItem.innerHTML = '';

            let snippet = `<a class="map-link" onclick='switchMaps(event)' name='${data}'>
            <img src='/preview/${data}' class="map-item-img">
        </a>
        <h2 class='map-title'>${data.split('.')[0]}</h2>
        <div class='map-secondary'>
            <a class='map-secondary-link'>Update</a>
            <a class='map-secondary-link'>Rename</a>
            <a class='map-secondary-link'>Delete</a>
        </div>`
    

            lastItem.innerHTML = snippet
        }
    } catch (error) {
        console.log(error)
    }
}

function switchMaps(e){
    console.log(e.target.parentNode.name);
    let imgname = e.target.parentNode.name;

    img.src = `/maps/${imgname}`
    imgPos.x = 0;
    imgPos.y = 0;
    tilePosition.tileX = 0;
    tilePosition.tileY = 0;

    let dataPackage = {
        pos: imgPos,
        name: imgname,
        tile: tilePosition,
    }

    socket.emit('change-map', dataPackage)

}

/* PLAYER SITE
THIS IS FUNCTIONALITY TO PLAYERS ONLY */

// Get Player List and Add it
function getPlayerList(){
    let list = gEI('player-list')
    list.innerHTML = ''
    for(let el of characters){
        // console.log(el)
        let div = document.createElement('div');
        div.innerHTML = `<div class='player-info'><h1 class='player-name'>${el.name}</h1><p class='player-classRace'>${el.class}/${el.race}</p><div class='hp-bar'></div><div class='player-stats'><p class='player-hp'>HP: ${el.hitpoints}</p><p class='player-speed'>AC: ${el.armorClass}</p></div></div><a class='player-img-container' onclick=createToken(event) name=${el.name}><img class='player-img' name='${el.name}' src='${el.token}'></a>`;
        div.className = 'player-list-item'
        list.appendChild(div)
    }

}

// Add Character to Player List
function addCharacterToList(char){
    characters.push(char)
}
