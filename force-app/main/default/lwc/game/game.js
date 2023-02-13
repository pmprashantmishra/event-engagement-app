import { LightningElement, api, track } from "lwc";
import saveActivity from "@salesforce/apex/EventAppCtrl.saveActivity";

const TOTAL_SECONDS = 140;

export default class Game extends LightningElement {
    @api attendeeId;
    @api eventId;

    gameStarted = false;

    gameObj = {
        words: ["APPY", "BLAZE", "SAASY", "RUTH", "META", "KOA"],
        gridSize: 6,
        letterGroups: [
            ["A", "A", "D", "T", "A", "N"],
            ["P", "N", "O", "T", "K", "Z"],
            ["P", "Z", "E", "O", "Q", "H"],
            ["Y", "M", "A", "U", "Q", "T"],
            ["B", "L", "A", "Z", "E", "U"],
            ["Y", "S", "A", "A", "S", "R"]
        ]
    };

    @track gameBlocks = [];
    @track foundWords = [];

    startTimestamp;
    endTimestamp;
    gameOver = false;
    gridWidth;

    timeUp = false;
    countDown;

    totalSeconds = TOTAL_SECONDS;
    secondsLeft = TOTAL_SECONDS;

    score = 0;

    alreadyComplete = false;

    startGame() {
        this.gameStarted = true;
        localStorage.setItem("game1_started", true);
        const sl_ls = localStorage.getItem("secondsLeft_game1");
        if (sl_ls) {
            this.secondsLeft = sl_ls;
        }

        if (
            this.gameObj &&
            this.gameObj.letterGroups &&
            this.gameObj.gridSize
        ) {
            const tmpBlocks = [];
            for (let y = 0; y < this.gameObj.gridSize; y++) {
                for (let x = 0; x < this.gameObj.gridSize; x++) {
                    const obj = {
                        id: `${x}:${y}`,
                        letter: this.gameObj.letterGroups[y][x],
                        used: false,
                        selected: false,
                        class: "",
                        group: ""
                    };
                    tmpBlocks.push(obj);
                }
            }
            this.gameBlocks = tmpBlocks;

            const d = new Date();
            const d_ls = localStorage.getItem("game1_startTime");
            this.startTimestamp = d_ls ? d_ls : d.getTime();
            if (!d_ls) {
                localStorage.setItem("game1_startTime", this.startTimestamp);
            }

            this.gridWidth = `width: ${this.gameObj.gridSize * 40}px`;

            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.countDown = setInterval(() => {
                this.secondsLeft--;
                localStorage.setItem("secondsLeft_game1", this.secondsLeft);
                if (this.secondsLeft <= 0) {
                    this.endGame();
                    this.timeUp = true;
                    clearInterval(this.countDown);
                }
            }, 1000);
        }
    }

    connectedCallback() {
        const gameStarted_ls = localStorage.getItem("game1_started");
        if (gameStarted_ls) {
            this.startGame();
        }

        const alreadyComplete_ls = localStorage.getItem("alreadyComplete");
        if (alreadyComplete_ls) {
            this.alreadyComplete = true;
        }
    }

    get duration() {
        if (this.startTimestamp && this.endTimestamp) {
            return Math.floor((this.endTimestamp - this.startTimestamp) / 1000);
        }
        return "";
    }

    get totalWords() {
        if (this.gameObj && this.gameObj.words) {
            return (
                this.gameObj.words.length -
                this.foundWords.length +
                " words remaining"
            );
        }
        return "";
    }

    get numberOfWordsFound() {
        return this.foundWords.length;
    }

    handleLetterClick(event) {
        event.preventDefault();
        const letterIndex = event.target.dataset.reference;
        const letterPosIndex = this.gameBlocks.findIndex(
            (x) => x.id === letterIndex
        );
        if (this.gameBlocks[letterPosIndex].selected) {
            this.gameBlocks[letterPosIndex].selected = false;
        } else {
            this.gameBlocks[letterPosIndex].selected = true;
        }
    }

    validateWord(event) {
        let word = "";
        this.gameBlocks.forEach((block) => {
            if (block.selected) {
                word += block.letter;
            }
        });

        const splitString = word.split("");
        const reverseArray = splitString.reverse();
        const reversedWord = reverseArray.join("");

        const foundWord = this.gameObj.words.find(
            (element) => element === word || element === reversedWord
        );

        if (foundWord && !this.foundWords.includes(foundWord)) {
            this.foundWords.push(foundWord);
            this.score += 20;
            this.gameBlocks.forEach((block) => {
                if (block.selected) {
                    block.used = true;
                    block.selected = false;
                    block.group = this.foundWords.length;
                }
            });
            if (this.gameObj.words.length === this.foundWords.length) {
                const d = new Date();
                this.endTimestamp = d.getTime();
                clearInterval(this.countDown);
                this.endGame();
                this.gameOver = true;
            }
        } else {
            const element = event.target;
            element.classList.add("animate");
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => {
                element.classList.remove("animate");
            }, 1000);
            this.gameBlocks.forEach((block) => {
                if (block.selected) {
                    block.selected = false;
                }
            });
        }
    }

    async endGame() {
        this.score += this.secondsLeft;
        try {
            await saveActivity({
                eventId: this.eventId,
                attendeeId: this.attendeeId,
                activityType: "Game 1",
                value: this.score
            });
            localStorage.setItem("alreadyComplete", true);
        } catch (e) {
            this.error = e;
        }
    }
}
