import { net } from "./main"
import { game } from "./main"

export default class Ui {
    mainDiv: HTMLDivElement
    dajDane: HTMLInputElement
    logujButton: HTMLDivElement
    resetButton: HTMLDivElement
    timer: any

    constructor() {
        this.timer
        this.mainDiv = document.createElement("div")
        this.dajDane = document.createElement("input")
        this.logujButton = document.createElement("div")
        this.resetButton = document.createElement("div")

        this.dajDane.setAttribute("id", "dajDane")

        this.mainDiv.setAttribute("id", "mainDiv")
        this.mainDiv.innerText = "LOGOWANIE"

        this.logujButton.setAttribute("id", "logujButton")
        this.logujButton.innerText = "Zaloguj"

        this.resetButton.setAttribute("id", "resetButton")
        this.resetButton.innerText = "Reset"


        this.mainDiv.append(this.dajDane, this.logujButton, this.resetButton)
        document.body.append(this.mainDiv)

        document.getElementById("logujButton")!.addEventListener("click", () => {
            net.loguj()
        })
        document.getElementById("resetButton")!.addEventListener("click", () => {
            net.reset()
        })
    }

    waitForSecondPlayer = () => {
        this.stopWaiting()
        let waitingDiv = document.createElement("div")
        waitingDiv.id = "waitingDiv"
        waitingDiv.innerHTML = "Czekam na drugiego gracza"
        document.body.appendChild(waitingDiv)
    }

    waitForYourTurn = () => {
        this.stopWaiting()
        let waitingDiv = document.createElement("div")
        waitingDiv.id = "waitingDiv"


        let currentTime = 20
        waitingDiv.innerHTML = "Teraz gra przeciwnik.<br>Czekaj " + currentTime + "s"

        this.timer = setInterval(() => {
            currentTime--
            waitingDiv.innerHTML = "Teraz gra przeciwnik.<br>Czekaj " + currentTime + "s"

            if (currentTime <= 0) {
                waitingDiv.remove()
                clearInterval(this.timer)

                net.lost("time")
            }
        }, 1000)

        document.body.appendChild(waitingDiv)
    }

    stopWaiting = () => {
        console.log("stopWaiting");

        clearInterval(this.timer)
        let waitingDiv = document.getElementById("waitingDiv")
        if (waitingDiv != null) {
            waitingDiv.remove()
        }
    }

    youLost = (reason: string) => {
        game.endGame = true
        game.clearPossibleMoves()

        this.stopWaiting()

        let lostDiv = document.createElement("div")
        lostDiv.id = "lostDiv"
        lostDiv.innerHTML = "Przegrałeś!<br>" + reason

        document.body.appendChild(lostDiv)
    }

    youWon = (reason: string) => {
        game.endGame = true
        game.clearPossibleMoves()

        this.stopWaiting()

        let wonDiv = document.createElement("div")
        wonDiv.id = "wonDiv"
        wonDiv.innerHTML = "Wygrałeś!<br>" + reason

        document.body.appendChild(wonDiv)
    }
}
