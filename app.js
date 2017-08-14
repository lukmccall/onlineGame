/**
 * Created by LukMcCall on 14.08.2017.
 */
const express = require('express');
const app = express();
const http  = require('http').Server(app);
const io = require('socket.io')(http);
//static file
app.use(express.static('public'));

//render engine
app.set('view engine', 'ejs');

app.get('/', (req, res)=>{
    res.render('index');
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
players = [];
bullets = [];
io.on('connection', (socket)=>{
    let x = getRandomInt(20,380);
    let y = getRandomInt(20,380);
    players.push({id: socket.id, x:x,y:y, health:5});
    io.sockets.emit('set up', {id: socket.id,x: x, y: y});

    socket.on('update', (data)=>{
        for(let i = 0;i<players.length; i++)
        {
            if(players[i].id === data.id)
                players[i] = {id: data.id, x:data.x, y:data.y, health: players[i].health};
        }
        io.sockets.emit('update all', {id: data.id, x:data.x, y:data.y});
    });

    socket.on('disconnect', ()=>{
        for(let i = 0;i<players.length; i++)
        {
            if(players[i].id === socket.id)
                players.splice(i,1);
        }
        io.sockets.emit('delete player', {id: socket.id});
    });

    socket.on("new bullet", (data)=>{
        bullets.push(data);
    });
});

function chcekCollioson(x1,y1,r1,id1,x2,y2,r2,id2) {
    if(id1 !== id2){
        let dx = x1 - x2;
        let dy = y1 - y2;
        let d = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
        return r1+r2>d
    }
    return false;
}

setInterval(()=>{
    let send = [];
    for(let i =0; i<bullets.length; i++){
        for(let j = 0; j<players.length; j++){
            if(bullets[i] !== undefined && players[j] !== undefined && chcekCollioson(bullets[i].x,
                    bullets[i].y,
                    5,
                    bullets[i].id,
                    players[j].x,
                    players[j].y,
                    10,
                    players[j].id)) {
                players[j].health--;
                if(players[j].health <= 0)
                    io.sockets.emit("loss", players[j].id);

                bullets.splice(i, 1);
            }
        }
        if(bullets[i] !== undefined) {
            bullets[i].x += bullets[i].vx;
            bullets[i].y += bullets[i].vy;

            if (bullets[i].x > 650 || bullets[i].x < -50 || bullets[i].y > 650 || bullets[i].y < -50)
                bullets.splice(i, 1);
            else
                send.push({x: bullets[i].x, y: bullets[i].y});
        }
    }
    io.sockets.emit('update bullets', send);
}, 1000/60);


http.listen(process.env.PORT || 5000, function () {
    console.log("Listening on",process.env.PORT );
});