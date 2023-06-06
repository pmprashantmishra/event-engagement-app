import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getEventNamesWithIds from '@salesforce/apex/EventAppCtrl.getEventNamesWithIds';
import createQuiz from '@salesforce/apex/EventAppCtrl.createQuiz';
export default class CreateNewQuiz extends LightningElement {
	eventOptions = [];
	questionWithOptionsList = [];
	eventId;
	quizName;
	quizOrder;
	quizTime;

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
			options : [],
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

	handleQuizTimeChange(event){
		this.quizTime = event.target.value;
	}

	handleQuizOrderChange(event){
		this.quizOrder = event.target.value;
	}

	handleQuestionChange(event) {
		// event.detail
		this.questionWithOptionsList[event.currentTarget.dataset.index].questionText = event.target.value;
	}

	handleOptionsChange(event) {
		this.questionWithOptionsList[event.currentTarget.dataset.index].options= event.detail;
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
		createQuiz({eventId : this.eventId,
					quizName : this.quizName,
					quizQuestions : JSON.stringify(this.questionWithOptionsList),
					quizOrder : this.quizOrder,
					quizTime : this.quizTime
				})
			.then(result => {
				this.sendToastMessage(
					'Success',
					'Quiz '+result+' is created nevigating to record...',
					'success'
				);
				window.location.href = '/'+result;
			})
			.catch(error => {
				console.log('error creating quiz ', error);
				this.sendToastMessage(
					'Error',
					'There is some error make sure you have feild all required fields',
					'error'
				);

			})
	}

	sendToastMessage(titleText, messageText, variantName){
		const event = new ShowToastEvent({
			title: titleText,
			message: messageText,
			variant: variantName
		});
		this.dispatchEvent(event);
	}
}