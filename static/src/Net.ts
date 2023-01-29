import { ui } from "./main"
import { game } from "./main"

export default class Net {
    playerInfo: HTMLElement
    mainDiv: HTMLElement
    url: string = "https://dev.juliandworzycki.pl/api"

    constructor() {
        this.playerInfo = document.getElementById("playerInfo")!
        this.mainDiv = document.getElementById("mainDiv")!
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
                            } else if (data == "2") {
                                this.mainDiv.remove()
                                if (this.playerInfo.innerHTML != nick + " grasz bialymi") {
                                    this.playerInfo.innerHTML = nick + " grasz czarnymi"
                                }
                                clearInterval(interval)
                                document.getElementById("waitingDiv")!.remove()
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
}