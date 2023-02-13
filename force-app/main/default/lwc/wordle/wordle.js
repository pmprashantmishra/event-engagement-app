import { LightningElement, api } from "lwc";
import { realDictionary } from "./dictionary.js";
import LightningAlert from "lightning/alert";
import saveActivity from "@salesforce/apex/EventAppCtrl.saveActivity";

const dictionary = realDictionary;
const finalWords = [
    "admin",
    "agent",
    "agile",
    "alert",
    "asset",
    "batch",
    "build",
    "cases",
    "clone",
    "cloud",
    "field",
    "flows",
    "genie",
    "group",
    "oauth",
    "queue",
    "quote",
    "sales",
    "share",
    "trail"
];

const TOTAL_SECONDS = 180;

export default class Wordle extends LightningElement {
    rendered = false;
    hideKeyboard = false;

    state;

    @api attendeeId;
    @api eventId;

    gameOver = false;
    totalSeconds = TOTAL_SECONDS;
    secondsLeft = TOTAL_SECONDS;

    countDown;

    tmpTimeout;

    drawGrid(container) {
        const grid = document.createElement("div");
        grid.className = "grid";
        grid.setAttribute("c-wordle_wordle", "");
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 5; j++) {
                this.drawBox(grid, i, j);
            }
        }
        container.appendChild(grid);
    }

    updateGrid() {
        for (let i = 0; i < this.state.grid.length; i++) {
            for (let j = 0; j < this.state.grid[i].length; j++) {
                const box = this.template.querySelector(`.box${i}${j}`);
                box.textContent = this.state.grid[i][j];
            }
        }
        localStorage.setItem("wordle_state", JSON.stringify(this.state));
    }

    drawBox(container, row, col, letter = "") {
        const box = document.createElement("div");
        box.setAttribute("c-wordle_wordle", "");
        box.textContent = letter;
        box.className = `box box${row}${col}`;
        container.appendChild(box);
        return box;
    }

    handleKey(key) {
        if (key === "Enter") {
            if (this.state.currentCol === 5) {
                const word = this.getCurrentWord(this.state.currentRow);
                if (this.isWordValid(word)) {
                    this.revealWord(word, this.state.currentRow);
                    if (this.state.currentRow < 5) {
                        this.state.currentRow++;
                        this.state.currentCol = 0;
                    }
                } else {
                    LightningAlert.open({
                        message:
                            "The word you have entered is not a valid dictionary word",
                        theme: "error",
                        label: "Not a valid word"
                    });
                }
            }
        }
        if (key === "Backspace") {
            this.removeLetter();
        }
        if (this.isLetter(key)) {
            this.addLetter(key);
        }

        this.updateGrid();
    }

    getCurrentWord(rowNum) {
        return this.state.grid[rowNum].reduce((prev, curr) => prev + curr);
    }

    isWordValid(word) {
        return dictionary.includes(word);
    }

    getNumOfOccurrencesInWord(word, letter) {
        let result = 0;
        for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) {
                result++;
            }
        }
        return result;
    }

    getPositionOfOccurrence(word, letter, position) {
        let result = 0;
        for (let i = 0; i <= position; i++) {
            if (word[i] === letter) {
                result++;
            }
        }
        return result;
    }

    revealWord(guess, currentRow) {
        const row = currentRow;
        const animation_duration = 500; // ms

        for (let i = 0; i < 5; i++) {
            const box = this.template.querySelector(`.box${row}${i}`);
            const letter = box.textContent;
            const numOfOccurrencesSecret = this.getNumOfOccurrencesInWord(
                this.state.secret,
                letter
            );
            const numOfOccurrencesGuess = this.getNumOfOccurrencesInWord(
                guess,
                letter
            );
            const letterPosition = this.getPositionOfOccurrence(
                guess,
                letter,
                i
            );

            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => {
                let letterColor;
                if (
                    numOfOccurrencesGuess > numOfOccurrencesSecret &&
                    letterPosition > numOfOccurrencesSecret
                ) {
                    box.classList.add("empty");
                    letterColor = "empty";
                } else {
                    if (letter === this.state.secret[i]) {
                        box.classList.add("right");
                        letterColor = "right";
                    } else if (this.state.secret.includes(letter)) {
                        box.classList.add("wrong");
                        letterColor = "wrong";
                    } else {
                        box.classList.add("empty");
                        letterColor = "empty";
                    }
                }
                this.shadeKeyBoard(letter, letterColor);
            }, ((i + 1) * animation_duration) / 2);

            box.classList.add("animated");
            box.style.animationDelay = `${(i * animation_duration) / 2}ms`;
        }

        const isWinner = this.state.secret === guess;
        const isGameOver =
            this.state.currentRow === 5 && this.state.currentCol === 5;
        if (this.tmpTimeout) {
            clearTimeout(this.tmpTimeout);
        }
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.tmpTimeout = setTimeout(() => {
            if (isWinner) {
                LightningAlert.open({
                    message: "You have successfully found the word.",
                    theme: "success",
                    label: "Congratulations!"
                });
                this.endGame();
                this.hideKeyboard = true;
            } else if (isGameOver) {
                LightningAlert.open({
                    message: `Better luck next time! The word was "${this.state.secret}".`,
                    theme: "error",
                    label: "Better luck next time!"
                });
                this.endGame();
                this.hideKeyboard = true;
            }
        }, 3 * animation_duration);
    }

    isLetter(key) {
        return key.length === 1 && key.match(/[a-z]/i);
    }

    addLetter(letter) {
        if (this.state.currentCol === 5) return;
        this.state.grid[this.state.currentRow][this.state.currentCol] = letter;
        this.state.currentCol++;
    }

    removeLetter() {
        if (this.state.currentCol === 0) return;
        this.state.grid[this.state.currentRow][this.state.currentCol - 1] = "";
        this.state.currentCol--;
    }

    shadeKeyBoard(letter, color) {
        for (const elem of this.template.querySelectorAll(".keyboard-button")) {
            if (elem.textContent === letter) {
                let oldColor = elem.classList;
                if (oldColor.contains("right")) {
                    return;
                }

                if (oldColor === "wrong" && color !== "right") {
                    return;
                }

                elem.classList.add(color);
                break;
            }
        }
    }

    enableOnScreenKeyboard() {
        this.template
            .querySelector(".keyboard-cont")
            .addEventListener("click", (e) => {
                const target = e.target;

                if (!target.classList.contains("keyboard-button")) {
                    return;
                }
                let key = target.textContent;

                if (key === "Del") {
                    key = "Backspace";
                }

                if (key === "Ent") {
                    key = "Enter";
                }

                this.handleKey(key);
            });
    }

    renderedCallback() {
        if (!this.rendered) {
            this.rendered = true;
            const game = this.template.querySelector(".game");
            this.drawGrid(game);
            this.updateGrid();
            if (this.state.currentRow > 0) {
                let rowsToFill;
                if (
                    this.state.currentRow === 5 &&
                    this.state.currentCol === 5
                ) {
                    rowsToFill = this.state.currentRow;
                } else {
                    rowsToFill = this.state.currentRow - 1;
                }
                for (let i = 0; i <= rowsToFill; i++) {
                    const word = this.getCurrentWord(i);
                    this.revealWord(word, i);
                }
            }
            this.enableOnScreenKeyboard();
        }
    }

    connectedCallback() {
        if (localStorage.getItem("wordle_state") != null) {
            this.state = JSON.parse(localStorage.getItem("wordle_state"));
        } else {
            this.state = {
                secret: finalWords[
                    Math.floor(Math.random() * finalWords.length)
                ],
                grid: Array(6)
                    .fill()
                    .map(() => Array(5).fill("")),
                currentRow: 0,
                currentCol: 0
            };
        }

        this.gameStarted = true;
        localStorage.setItem("game2_started", true);
        const sl_ls = localStorage.getItem("secondsLeft_game2");
        if (sl_ls) {
            this.secondsLeft = sl_ls;
        }

        if (!this.countDown) {
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.countDown = setInterval(() => {
                this.secondsLeft--;
                localStorage.setItem("secondsLeft_game2", this.secondsLeft);
                if (this.secondsLeft <= 0) {
                    const alreadyComplete_ls =
                        localStorage.getItem("alreadyComplete");
                    const wordle_lost = localStorage.getItem("wordle_lost");
                    if (!alreadyComplete_ls) {
                        this.endGame();
                        localStorage.setItem("wordle_lost", true);
                        LightningAlert.open({
                            message: `The word was "${this.state.secret}".`,
                            theme: "error",
                            label: "Better luck next time!"
                        });
                    }
                    if (wordle_lost) {
                        LightningAlert.open({
                            message: `The word was "${this.state.secret}".`,
                            theme: "error",
                            label: "Better luck next time!"
                        });
                    }
                    this.timeUp = true;
                    this.hideKeyboard = true;
                    clearInterval(this.countDown);
                }
            }, 1000);
        }
    }

    async endGame() {
        clearInterval(this.countDown);
        try {
            await saveActivity({
                eventId: this.eventId,
                attendeeId: this.attendeeId,
                activityType: "Game 2",
                value: this.state.currentRow
            });
            localStorage.setItem("alreadyComplete", true);
        } catch (e) {
            this.error = e;
        }
    }

    get duration() {
        if (this.startTimestamp && this.endTimestamp) {
            return Math.floor((this.endTimestamp - this.startTimestamp) / 1000);
        }
        return "";
    }

    get showSecondsLeft() {
        return this.secondsLeft >= 0 ? this.secondsLeft : 0;
    }

    disconnectedCallback() {
        if (this.countDown) {
            clearInterval(this.countDown);
        }
    }
}
