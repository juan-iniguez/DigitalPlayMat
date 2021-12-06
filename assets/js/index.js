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

let indexContainer = gEI('index-container');
let indexCard = gEI('index-card')
let submit = gEI('submit')
let register = gEI('register')
register.onclick = doRegister;
submit.onclick = doLogInCheck;

setTimeout(()=>{
    indexContainer.classList.toggle('hide')
    setTimeout(()=>{
        indexCard.classList.toggle('hide')
    },100)
},200)

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
            // console.log(data)
            logInTrue(data);
        }
    } catch (error) {
        console.log(error)
    }
}

function doRegister(e){
    let indexCard = gEI('index-card')
    let submitCard = gEI('submit-card')
    indexCard.classList.toggle('outleft')
    indexContainer.classList.toggle('submit')
    
    setTimeout(()=>{
        indexCard.classList.toggle('outleft')
        indexCard.classList.toggle('none')
        submitCard.classList.toggle('none')
        submitCard.classList.toggle('inright')
        setTimeout(()=>{
            submitCard.classList.toggle('inright')
        },700)
    },500)
}

async function doRegisterSend(e){
    let name = gEI('name')
    let username = gEI('username-sub');
    let password = gEI('password-sub');
    let message = gEI('message-');
    let submitCard = gEI('submit-card');

    let endSpace = /\s$/;

    if(endSpace.test(name.value)){
        let e_ = name.value.replace(' ', '')
        name.value = e_
    }

    let dP = {
        name: name.value,
        username: username.value,
        password: password.value
    }

    try {
        const {data} = await axios.post('/register', dP)
        console.log(data)
        if(data === 'success'){
            message.innerHTML = 'Success! Account Registered';
            message.classList.toggle('suc')
            setTimeout(()=>{
                message.innerHTML = '';
                message.classList.toggle('suc')
                submitCard.style = 'cursor:wait;'
                document.body,style = 'cursor:wait;'
                setTimeout(()=>{
                    window.location.href = '/'
                },200)
            },2000)
        }else if(data === 'username taken'){
            message.innerHTML = 'Username is Already Taken';
            message.classList.toggle('err')
            setTimeout(()=>{
                message.innerHTML = '';
                message.classList.toggle('err')
            },2000)
        }
    } catch (error) {
        console.log(error)
    }
}

function logInTrue(data){
    let indexCard = gEI('index-card');

    indexContainer.classList.toggle('main');
    indexCard.classList.toggle('hide')
    setTimeout(()=>{
        indexContainer.innerHTML = '';
        setMainScreen(data);
    },500)
}

function checkNameSubmit(e){
    let endSpaces = / \s$/;
    let hasSpace = endSpaces.test(e.target.value);

    if(hasSpace){
        let e_ = e.target.value.replace('  ', '')
        e.target.value = e_
    }
}

function signUpHo(){
    let endSpace = /\s$/;

    let nameAccount = gEI('name')

    if(nameAccount.test(endSpace)){
        let n_ = nameAccount.value.slice(nameAccount.length-1,1)
        nameAccount.value = n_
    }
    console.log(nameAccount.value)

}

function goBackLogIn(e){
    let submitCard = gEI('submit-card');
    let indexCard = gEI('index-card');
    submitCard.classList.toggle('outright');
    indexContainer.classList.toggle('submit');
    indexContainer.classList.toggle('return');
    setTimeout(()=>{
        submitCard.classList.toggle('none');
        submitCard.classList.toggle('outright');
        indexCard.classList.toggle('none')
        indexCard.classList.toggle('inleft')
        setTimeout(()=>{
            indexContainer.classList.toggle('return');
            indexCard.classList.toggle('inleft')
        },500)
    },500)

}

async function setMainScreen(data_){
    try {
        const {data} = await axios.get('/assets/snippets/mainCard.html');
        indexContainer.innerHTML = data
        let quote = gEI('quote');
        quote.innerHTML = data_.quotes

        loadCampaigns();

    } catch (error) {
        console.log(error)
    }
}

function onWasHovered(e){
    e.target.classList.toggle('wasHovered')
    setTimeout(()=>{
        e.target.classList.toggle('wasHovered')
    },500)
}

// Load Campaigns stored in User

async function loadCampaigns(){
    let mapsContainer = gEI('maps-campaigns');
    try {
        const {data} = await axios.get('/getCampaigns')

        // Add Campaigns to the List
        
        let campaigns = data.campaigns

        for(i=0;i<campaigns.length;i++){
            let a_ = cE('a')
            a_.id = campaigns[i].name;
            a_.className = 'campaign'
            a_.innerHTML = `<img name='${campaigns[i].name}' src='/preview/${campaigns[i].maps[0]}' class="campaign-img">
            <div name='${campaigns[i].name}' class="campaign-text-container">
                <h1 name='${campaigns[i].name}' class="campaign-item-hero">${campaigns[i].name}</h1>
                <p name='${campaigns[i].name}' class='description'>${campaigns[i].description}</p>
            </div>
            <div name='${campaigns[i].name}' class="campaign-date-container">
                <p name='${campaigns[i].name}' class="date">${campaigns[i].date.split('T')[0]}</p>
                <p name='${campaigns[i].name}' class='time'>${campaigns[i].time.split(' ')[4]} PT</p>
            </div>`;
            a_.onmouseleave = onWasHovered;
            a_.onclick = goToCampaign;
            mapsContainer.insertAdjacentElement('afterbegin' ,a_)
        }
    } catch (error) {
        console.log(error)
    }
};

// Load Campaign

function goToCampaign(e){

    if(e.target.tagName === "A"){
        console.log(e.target.id)
        window.location.href = `/campaign/${e.target.id}`
    }else{
        if(e.target.parentElement.tagName != "A"){
            console.log(e.target.parentElement.parentElement.id)
            window.location.href = `/campaign/${e.target.parentElement.parentElement.id}`
        }else{
            console.log(e.target.parentElement.id)
            window.location.href = `/campaign/${e.target.parentElement.id}`
        }
    }
    // window.location.href = `/campaign/${e.target.parentElement.id}`
}

// Make New Campaign

function makeNewCampaign(){
    window.location.href = '/new-campaign'
}

