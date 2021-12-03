let introH1 = document.getElementById('intro h1')
let introH2 = document.getElementById('intro h2')
let loading = document.getElementById('loading');
let mainContainer = document.getElementById('main-container')

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
        },2500)
    },100)
},300)

function addMapMenu(){
    document.body.style = "background-image: url('/img/fire.gif');background-color: #000000bd;"
    let menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';
    mainContainer.appendChild(menuContainer)

    async function menuInputs(){
        try {
            const {data} = await axios.get('/assets/snippets/introMenu.html')

            menuContainer.innerHTML = data;
            let mapMenu = document.getElementById('map')

            mapMenu.onchange = mapPreview

        } catch (error) {
            console.log(error)
        }
    }
    menuInputs();
}

function mapMenuActivate(){
    let files = document.getElementById('map').files[0];
    let name = document.getElementById('map-name');
    console.log(files)

    
    if(!files || name.value === ''){
        console.log("no map added")
    }else{
        let form = new FormData();
        form.append('map', files, name.value)
        async function menuSend(){
            try {
                const {data} = await axios.post('/addMap', form)

                console.log(data)

                if(data === 'Done!'){
                    window.location.href = '/dm-side'
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

function mapPreview(e){
    let mapLabel = document.getElementById('map-label');
    mapLabel.innerHTML = e.target.files[0].name
}