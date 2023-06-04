import { LightningElement } from 'lwc';
import getEventNamesWithIds from '@salesforce/apex/EventAppCtrl.getEventNamesWithIds';
import createQuiz from '@salesforce/apex/EventAppCtrl.createQuiz';
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
        // Question Row
        let questionRow = {
            questionText : '',
            options : {
                option1 : '',
                option2 : '',
                option3 : '',
                option4 : ''
            },
            correctAnswer : '',
            marks : ''
        }
        this.questionWithOptionsList = this.questionWithOptionsList.concat([questionRow]);
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
        this.questionWithOptionsList[event.currentTarget.dataset.index].options.option1 = event.target.value;
    }

    handleOption2Change(event) {
        this.questionWithOptionsList[event.currentTarget.dataset.index].options.option2 = event.target.value;
    }

    handleOption3Change(event) {
        this.questionWithOptionsList[event.currentTarget.dataset.index].options.option3 = event.target.value;
    }

    handleOption4Change(event) {
        this.questionWithOptionsList[event.currentTarget.dataset.index].options.option4 = event.target.value;
    }

    handleAnswerChange(event) {
        this.questionWithOptionsList[event.currentTarget.dataset.index].correctAnswer = event.target.value;
    }

    handleMarksChange(event) {
        this.questionWithOptionsList[event.currentTarget.dataset.index].marks = event.target.value;
    }

    handleAddRowClick() {
        this.handleAddRow();
    }

    handleCreateQuizClick(){
        createQuiz({eventId : this.eventId, quizName : this.quizName, quizQuestions : JSON.stringify(this.questionWithOptionsList)})
            .then(result => {
                console.log('result ', result);
            })
            .catch(error => {
                console.log('error creating quiz ', error);
            })
    }
}