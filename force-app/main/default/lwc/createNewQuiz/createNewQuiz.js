import { LightningElement } from 'lwc';
import getEventNamesWithIds from '@salesforce/apex/EventAppCtrl.getEventNamesWithIds';
export default class CreateNewQuiz extends LightningElement {
    eventOptions = [];
    questionWithOptionsList = [];
    eventId;
    quizName;

    connectedCallback() {
        getEventNamesWithIds()
            .then(result => {
                this.eventOptions = result;
            })
            .catch(error => {
                console.log(`error >> ${error}`);
            })
        this.handleAddRow();
    }

    handleAddRow() {
        let questionRow = {
            questionText : '',
            options : [],
            correctAnswer : '',
            marks : ''
        }
        this.questionWithOptionsList = [...this.questionWithOptionsList, Object.create(questionRow)];
    }

    handleEventChange(event) {
        this.eventId = event.target.value;
    }

    handleQuizNameChange(event) {
        this.quizName = event.target.value;
    }

    handleQuestionChange(event) {
        // event.detail
        this.questionWithOptionsList[event.currentTarget.dataset.index].questionText = event.target.value;
    }

    handleOption1Change(event) {
        this.questionWithOptionsList[event.currentTarget.dataset.index].questionText = event.target.value;
    }

    handleAnswerChange(event) {
        this.questionWithOptionsList[event.currentTarget.dataset.index].correctAnswer = event.target.value;
    }

    handleMarksChange(event) {
        this.questionWithOptionsList[event.currentTarget.dataset.index].marks = event.target.value;
        console.log(`${JSON.stringify(this.questionWithOptionsList)}`);
    }
}