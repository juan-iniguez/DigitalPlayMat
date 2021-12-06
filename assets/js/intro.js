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


let introH1 = document.getElementById('intro h1');
let introH2 = document.getElementById('intro h2');
let loading = document.getElementById('loading');
let mainContainer = document.getElementById('main-container');

let maps_ = []

const socket = io();

socket.on('message', message=>{
    console.log(message)
})

// Brief Animation

setTimeout(()=>{
    loading.classList.toggle('hide')
    introH1.classList.toggle('hide')
    setTimeout(()=>{
        introH2.classList.toggle('hide')
        setTimeout(()=>{
            loading.classList.toggle('hide')
            setTimeout(()=>{
                loading.remove()
                addMapMenu();
            },300)
        },1500)
    },100)
},300)


// Add The Menu-grid for Maps Uploads

function addMapMenu(){
    introH2.remove();
    introH1.innerHTML = 'Start by adding a Name and Description'
    introH1.style = 'font-family: DnD;'
    introH2.innerHTML = 'A good name will shine forever'
    document.body.style = "background-image: url('/img/fire.gif');background-color: #000000bd;"
    mainContainer.classList.toggle('next')
    let menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';
    mainContainer.appendChild(menuContainer)

    async function menuInputs(){
        try {
            const {data} = await axios.get('/assets/snippets/introMenu.html')

            menuContainer.innerHTML = data;
            let mapMenu = document.getElementById('map')
            let mapItem = document.getElementById('map-item')
            let mapName = document.getElementById('map-name')
            mapName.addEventListener('input', preventCharacters)
            mapItem.name = 0
            mapMenu.onchange = mapPreview

        } catch (error) {
            console.log(error)
        }
    }
    menuInputs();
}

// Map Menu Submit function

function mapMenuActivate(){
    let message = document.getElementById('message');
    let campaignName = gEI('campaign-name')
    let description = gEI('campaign-description')
    let isNames = true

    let createDP = {
        campaignName: campaignName.value,
        description: description.value,
        maps: [],
    }

    if(maps_.length > 1){
        // TODO: Name Inputs put them into and ARRAY
        let mapNames = document.getElementsByClassName('map-name');

        let form = new FormData();
        for(i=0;i<maps_.length;i++){
            if(mapNames[i].value === ''){
                isNames = false
            }else{
                createDP.maps.push(mapNames[i].value)
                form.append('map', maps_[i].files, mapNames[i].value)
            }
        }
        let info = {
            name: campaignName.value,
            description: description.value,
        }
        if(isNames && campaignName.value != '' && description.value != ''){
            async function sendMultipleMaps(){
                try {
                    const {data} = await axios.post('/addMaps', form)
                    const create = await axios.post('/createCampaign', createDP)
                    console.log(data)
                    console.log(create.data)
    
                    if(create.data){
                        window.location.href = `/campaign/${campaignName.value}`
                    }else{
                        console.log(data)
                    }
    
    
                } catch (error) {
                    console.log(error)
                }
            }
            sendMultipleMaps();
        }else{
            message.innerHTML = 'Names are missing'
            message.classList.toggle('error');
            setTimeout(()=>{
                message.innerHTML = ''
                message.classList.toggle('error');
            },1500)
        }

    }else{

        let files = document.getElementById('map').files[0];
        let name = document.getElementById('map-name');
        console.log(files)
        
        if(!files || name.value === '' || campaignName.value === '' || description.value === ''){
            if(name.value === '' && !files){
                message.innerHTML = 'Everything Missing'
                message.classList.toggle('error');
                setTimeout(()=>{
                    message.innerHTML = ''
                    message.classList.toggle('error');
                },1500)
            }else if(name.value === ''){
                message.innerHTML = 'Map Name Missing'
                message.classList.toggle('error');
                setTimeout(()=>{
                    message.innerHTML = ''
                    message.classList.toggle('error');
                },1500)
            }else if(!files){
                message.innerHTML = 'Map Missing'
                message.classList.toggle('error');
                setTimeout(()=>{
                    message.innerHTML = ''
                    message.classList.toggle('error');
                },1500)
            }
        }else{
            let form = new FormData();
            form.append('map', files, name.value);
            createDP.maps.push(name.value + '.' + files.type.split('/')[1]);
            async function menuSend(){
                try {
                    const {data} = await axios.post('/addMap', form)
                    const create = await axios.post('/createCampaign', createDP)
                    console.log(data)
                    console.log(create.data)
                    if(create.data){
                        window.location.href = `/campaign/${campaignName.value}`
                    }else{
                        console.log(data)
                    }
                    
                } catch (error) {
                    console.log(error)
                }
            }
            menuSend();
        }
    }
}
    
// When map is clicked, delete map Item
    
function deleteMap(e){

    // Delete the correct Obj on the array
    let mapItems = document.getElementsByClassName('map-item');
    // console.log(mapItems.length)
    let index = e.target.parentElement.parentElement.name;
    let mapForm = document.getElementById('map-form');
    let mapItem = document.createElement('div');
    mapItems[index].remove()
    // console.log(mapItems.length)
    mapItem.className = 'map-item';
}

// Get snippet from server to include next Map grid Item

async function getMapInputField(){
    const {data} = await axios.get('/assets/snippets/addmapitem.html')

    return data
}

// Get Preview Image from Server to display preview

function mapPreview(e){
    let mapItem = document.getElementsByClassName('map-item')
    let mapLabel = document.getElementById('map-label');
    let files = document.getElementById('map').files[0];

    let objectToStore = {
        name: files.name,
        files: files,
    }

    maps_.push(objectToStore);

    mapLabel.innerHTML = ''

    // Get a preview of the map
    async function previewMap(){

        let form = new FormData();
        form.append('img-edit', files, files.name)

        mapLabel.innerHTML = ''
        mapLabel.style = "background-image: url('/img/loading.gif');background-size: cover;background-position: center;background-repeat: no-repeat;background-color: black;"
        
        try {
            const {data} = await axios.post('/img-process', form)
            if(data){
                mapLabel.remove();
                let mapPreview = document.createElement('a');
                mapPreview.onclick = deleteMap;

    
                mapPreview.className = 'map-uploaded'
                mapPreview.innerHTML = `<img src="${data}" class='map-uploaded-img'>`

                let mapImgs = document.getElementsByClassName('map-uploaded-img')

                mapItem[mapImgs.length].insertAdjacentElement('afterbegin' ,mapPreview)

                addNextMapItem();

            }else{
                console.log('error no data')
            }
        } catch (error) {
            console.log(error)
        }
    }
    previewMap();
}

// Function to add Snippet to MapItem 

async function addNextMapItem(){
    let mapForm = document.getElementById('map-form')
    let mapItems = document.getElementsByClassName('map-item');
    let mapItem = document.createElement('div')
    mapItem.id = 'map-item'
    mapItem.className = 'map-item';
    mapItem.name = mapItems.length;
    let data = await getMapInputField();
    
    mapItem.innerHTML = data;
    mapForm.appendChild(mapItem)
    // let map = document.getElementsByClassName('map')
    // map[map.length].onchange = mapPreview;
}

// Prevent Characters

function preventCharacters(e){
    let nameInp = e.target;
    let regExp = /[\.@#\$\\%^&*!=:/{}[\]?"'<>|]/;

    if(regExp.test(nameInp.value)){
        let n_ = nameInp.value.slice(0,-1)
        nameInp.value = n_

        message.className = 'message'

        message.innerHTML = ''
        message.classList.toggle('error')
        message.innerHTML = `Illegal Characters "\.@#\$\\%^&*!=:/{}[\]?"'<>|"`
        setTimeout(()=>{
            message.classList.toggle('error')
        },2000)
    }
}