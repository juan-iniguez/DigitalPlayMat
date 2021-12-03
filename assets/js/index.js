var canvas = document.getElementById('tutorial');
var c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let doAnim = true;
let mouse = {
    x: undefined,
    y: undefined,
}
let minRadius = 10;
let maxRadius = 80;
var circleArray = [];
let stillResizing = false;

c.imageSmoothingEnabled = false;

function makeCircles(x, y, dx, dy, radius){
    
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius;

    this.draw = function(){

        c.beginPath();
        c.arc(this.x, this.y, this.radius,0, Math.PI *2, true);
        var gradient = c.createLinearGradient(50, 0, 800, 0);
        gradient.addColorStop(0, 'blue');
        gradient.addColorStop(1, "brown")
        c.fillStyle= gradient;
        c.strokeStyle='white';
        c.lineWidth=7;
        
        c.stroke();
        c.fill();
        
    }
    
    this.update = function(){
        if(this.x + this.radius > window.innerWidth || this.x - this.radius < 0){
            this.dx = -this.dx;
        }
        
        if(this.y + this.radius > window.innerHeight || this.y - this.radius < 0){
            this.dy = -this.dy
        }
        
        this.x += this.dx
        this.y += this.dy

        // Interactivity

        if((mouse.x + maxRadius > this.x) && (mouse.x - maxRadius < this.x) && (mouse.y + maxRadius > this.y) && (mouse.y- maxRadius < this.y) ){
            if(this.radius < maxRadius){
                this.radius += 1
            }
        }else{
            if(this.radius > minRadius){
                this.radius -= 1
            }
        }

        this.draw()
    }
    
}

function circlesGenerator(){
    circleArray = [];

    if(!doAnim){
        doAnim = true
    }
    
    for(i=0;i<100;i++){
        var x = Math.random() * (window.innerWidth - radius *2) + radius;
        var y = Math.random() * (window.innerHeight - radius *2) + radius;
        var dx = (Math.random() - 0.5) * 0.1
        var dy = (Math.random() - 0.5) * 0.1
        var radius = 35
        
        circleArray.push(new makeCircles(x, y, dx, dy, radius))
    }
    animation();
}

function animation(){
    
    if(!doAnim){
        c.clearRect(0, 0, window.innerWidth, window.innerHeight);
        return
    }

    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    requestAnimationFrame(animation)
    for(i=0;i<circleArray.length;i++){
        circleArray[i].update()
    }
}

window.onload = circlesGenerator();

window.addEventListener('resize', (e)=>{

    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    doAnim = false;
    setTimeout(()=>{
        circlesGenerator();
    },100)
})

window.addEventListener('mousemove', (e)=>{
    mouse.x = e.x;
    mouse.y = e.y;
})

