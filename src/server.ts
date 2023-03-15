import express from "express";
import http from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 5000;

const app = express()
const server = http.createServer(app);
const socketio = new Server(server, {
    path: "/socket.io"
});

app.use(express.json());
app.use(express.static('static/dist'))
app.use(express.urlencoded({
    extended: true
}));

let users: string[]

app.get("/", function (req, res) {
    res.sendFile("index.html")
})

app.post("/ADD_USER", (req, res) => {
    //console.log(req.body);
    res.setHeader('content-type', 'application/json');
    console.log(users);

    if (users && users.length < 2) {
        if (users.includes(req.body.nick)) {
            res.end(JSON.stringify("userExists"));
        } else {
            //console.log("Nie ma");
            users.push(req.body.nick)

            if (users.length == 1) {
                res.end(JSON.stringify("1"));
            } else {
                res.end(JSON.stringify("2"));
            }
        }
    } else {
        res.end(JSON.stringify("gameFull"));
    }
})

app.post("/RESET", (req, res) => {
    users = []
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify("cleared"));
})

app.post("/GET_USERS", (req, res) => {
    res.end(JSON.stringify(users.length));
})

let turn = "white"
socketio.on('connection', (client) => {
    console.log("klient się podłączył z id = ", client.id)

    client.on("startGame", (data) => {
        console.log("startgame: ", data);

        socketio.emit("turn", {
            turn: "white"
        })
    })


    client.on('movePawn', (data) => {
        client.broadcast.emit("movePawnToClient", {
            fromX: data.fromX,
            fromY: data.fromY,
            toX: data.toX,
            toY: data.toY,
            pawns: data.pawns
        })
    });

    client.on('capturePawn', (data) => {
        client.broadcast.emit("capturePawnToClient", {
            fromX: data.fromX,
            fromY: data.fromY,
            toX: data.toX,
            toY: data.toY,
            pawns: data.pawns,
            removeX: data.removeX,
            removeY: data.removeY
        })
    });

    client.on('nextTurn', (data) => {
        console.log("turn1: ", turn);

        if (turn == "white") {
            turn = "black"
        } else {
            turn = "white"
        }

        console.log("turn2: ", turn);


        console.log("nextTurn: ", data);
        socketio.emit("turn", {
            turn: turn
        })
    });

    client.on('lost', (data) => {
        console.log("lost: ", data);

        socketio.emit("lostGame", {
            reason: data.reason,
            loser: data.loser
        })
    });
});



server.listen(PORT, function () {
    console.log("server start on port " + PORT)
})