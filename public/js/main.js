/**
 * Created by LukMcCall on 14.08.2017.
 */
(function () {
    const canvas = document.querySelector('canvas'),
        c = canvas.getContext("2d");
    let socket = io();
    let movment = {x: 0, y:0};
    let canShoot = true;
    let shootTimer;
    let keyMap = {
        37: false, //ArrowLeft
        38: false, //ArrowUp
        39: false, //ArrowRight
        40: false //ArrowDown
    };

    function bulletDraw(x,y,radius) {
        c.beginPath();
        c.fillStyle = "#FFD34E";
        c.arc(x,y,radius,0,Math.PI*2);
        c.fill();
        c.closePath();
    }


    function Player(id, x, y) {
        this.socketId = id;
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.speed = 2;
    }

    Player.prototype.update = function () {
        if(this.socketId === socket.id) {
            socket.emit("move", {id: this.socketId, movment: movment});
        }
        this.draw();
    };

    Player.prototype.draw = function () {
        c.beginPath();
        c.fillStyle = "#BD4932";
        c.arc(this.x,this.y,this.radius,0,Math.PI*2);
        c.fill();
        c.closePath();
    };

    addEventListener("keydown", function (event) {
        if(event.keyCode in keyMap){
            keyMap[event.keyCode] = true;
            if(keyMap[37] && !keyMap[39]) movment.x = -1;
            if(!keyMap[37] && keyMap[39]) movment.x = 1;
            if(keyMap[38] && !keyMap[40]) movment.y = -1;
            if(!keyMap[38] && keyMap[40]) movment.y = 1;

            if(event.keyCode === 37) movment.x = -1;
            if(event.keyCode === 38) movment.y = -1;
            if(event.keyCode === 39) movment.x = 1;
            if(event.keyCode === 40) movment.y = 1;
        }
    });
    addEventListener("keyup", function (event) {
        if(event.keyCode in keyMap) {
            keyMap[event.keyCode] = false;
            if(!keyMap[37] && !keyMap[39]) movment.x = 0;
            if(!keyMap[38] && !keyMap[40]) movment.y = 0;
        }
    });
    addEventListener("click", function (event) {
        if(canShoot) {
            canShoot = false;
            let speed = 4;
            let x;
            let y;
            for (let i = 0; i < players.length; i++) {
                if (players[i].socketId === socket.id) {
                    x = players[i].x;
                    y = players[i].y;
                    break;
                }
            }
            let mtX = event.clientX;
            let mtY = event.clientY;
            let dx = mtX - x;
            let dy = mtY - y;
            let d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            let vx = dx / d * speed;
            let vy = dy / d * speed;
            socket.emit("new bullet", {id: socket.id, x: x, y: y, vx: vx, vy: vy});
        }else if(!shootTimer){
            shootTimer = setTimeout(()=>{
                canShoot = true;
                shootTimer = undefined;
            }, 250);
        }
    });

    let players = [];
    let bullets = [];
    function init() {
        canvas.height = 600;
        canvas.width = 600;
        setInterval(animate,1000/60);
    }
    socket.on("set up", function (data) {
        players.push(new Player(data.id,data.x,data.y));
    });
    socket.on("update all", function (data) {

        let mustAddOne = true;
        for(let i = 0; i<data.length; i++){
            mustAddOne = true;
            for(let j =0; j<players.length; j++) {
                if (players[j].socketId === data[i].id) {
                    players[j].x = data[i].x;
                    players[j].y = data[i].y;
                    mustAddOne = false;
                    break;
                }
            }
            if(mustAddOne)
                players.push(new Player(data[i].id,data[i].x,data[i].y));
        }

    });
    socket.on("delete player", (data)=>{
        for(let i = 0; i<players.length;i++)
            if(players[i].socketId === data.id) {
                players.splice(i, 1);
            }
    });
    socket.on("update bullets", (data)=>{
        bullets = data;
    });
    socket.on("loss", (data)=>{
        if(socket.id === data) socket.disconnect();
    });
    function animate() {
        c.clearRect(0,0,canvas.width,canvas.height);
        c.fillStyle = "#105B63";
        c.fillRect(0,0,canvas.width,canvas.height);
        for(let i = 0; i<players.length; i++) {
            players[i].update();
        }
        for(let i = 0; i<bullets.length;i++){
            bulletDraw(bullets[i].x,bullets[i].y,5);
        }
    }

    init();
})();