import { ui } from "./main"
import { game } from "./main"
import { io, Socket } from "socket.io-client";

export default class Net {
    playerInfo: HTMLElement
    mainDiv: HTMLElement
    url: string = "https://dev.juliandworzycki.pl/api"
    client: Socket
    playerColor: string

    constructor() {
        this.playerColor = ""
        this.playerInfo = document.getElementById("playerInfo") as HTMLElement
        this.mainDiv = document.getElementById("mainDiv") as HTMLElement

        this.client = io("/", {
            path: "/socket.io"
        });

        this.client.on("connect", () => {
            console.log("Connected to server")
        });

        this.client.on('movePawnToClient', (data) => {
            console.log("got from server", data);

            game.moveEnemyPawn(data.fromX, data.fromY, data.toX, data.toY, data.pawns)
        });

        this.client.on('capturePawnToClient', (data) => {
            console.log("got from server", data);

            game.captureEnemyPawn(data.fromX, data.fromY, data.toX, data.toY, data.pawns, data.removeX, data.removeY)
        });

        this.client.on('turn', (data) => {
            console.log("got from server1111", data);

            if (data.turn == this.playerColor) {
                game.changeTurn(true)
                ui.stopWaiting();
            } else {
                game.changeTurn(false)
                ui.waitForYourTurn()
            }

            game.checkForMovePawn(data.turn == "white" ? 1 : 2)
        });

        this.client.on('lostGame', (data) => {
            console.log("got from server", data);

            if (data.loser == this.playerColor) {
                ui.youWon(data.reason)
            } else {
                ui.youLost(data.reason)
            }
        });
    }

    waitForSecondPlayer = () => {
        let nick = (document.getElementById("dajDane") as HTMLInputElement).value

        const body = JSON.stringify({ nick: nick, info: "fetch" });
        const headers = { "Content-Type": "application/json" };

        ui.waitForSecondPlayer();

        let interval = setInterval(() => {
            (async () => {
                await fetch(this.url + "/GET_USERS", { method: "post", body, headers })
                    .then(response => response.json())
                    .then(
                        data => {
                            if (nick == "") {
                                nick = "Quest" + data
                            }

                            if (data == "1") {
                                this.mainDiv.remove()
                                this.playerInfo.innerHTML = nick + " grasz bialymi"
                                this.playerColor = "white"
                            } else if (data == "2") {
                                this.mainDiv.remove()
                                if (this.playerInfo.innerHTML != nick + " grasz bialymi") {
                                    this.playerInfo.innerHTML = nick + " grasz czarnymi"
                                    this.playerColor = "black"
                                }
                                clearInterval(interval)
                                document.getElementById("waitingDiv")!.remove()

                                this.client.emit("startGame", {
                                    start: true
                                })
                            }
                        })
            })();
        }, 500);
    }

    loguj = () => {
        let nick = (document.getElementById("dajDane") as HTMLInputElement).value
        if (nick == "") {
            nick = "Quest" + new Date().getTime()
        }

        const body = JSON.stringify({ nick: nick, info: "fetch" });
        const headers = { "Content-Type": "application/json" };

        (async () => {
            fetch(this.url + "/ADD_USER", { method: "post", body, headers })
                .then(response => response.json())
                .then(
                    data => {
                        if (data == "1") {
                            game.givePawns()
                            game.setPlayer(1)

                            this.waitForSecondPlayer();
                        } else if (data == "2") {
                            game.givePawns()
                            game.setPlayer(2)

                            this.waitForSecondPlayer();
                        } else if (data == "userExists") {
                            this.playerInfo.innerHTML = data
                        } else if (data == "gameFull") {
                            this.playerInfo.innerHTML = data
                        }
                    }
                )
        })();
    }

    reset = () => {
        const body = JSON.stringify({ reset: "reset" });
        const headers = { "Content-Type": "application/json" };

        (async () => {
            await fetch(this.url + "/RESET", { method: "post", body, headers, })
                .then(response => response.json())
                .then(
                    (data) => {
                        this.playerInfo.innerHTML = data;
                        (document.getElementById("dajDane") as HTMLInputElement).value = "";
                    }
                )
        })();
    }

    movePawn = (fromX: number, fromY: number, toX: number, toY: number, pawns: number[][]) => {
        this.client.emit("movePawn", {
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            pawns: pawns
        })
    }

    capturePawn = (fromX: number, fromY: number, toX: number, toY: number, pawns: number[][], removeX: number, removeY: number) => {
        this.client.emit("capturePawn", {
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            pawns: pawns,
            removeX: removeX,
            removeY: removeY
        })
    }

    nextTurn = () => {
        console.log("next turn", this.playerColor);

        this.client.emit("nextTurn", {
            turn: this.playerColor
        })
    }

    lost = (reason: string) => {
        console.log(reason)
        this.client.emit("lost", {
            reason: reason,
            loser: this.playerColor
        })
    }
}