import { LightningElement, api } from 'lwc';
import getActiveQuizEvent from '@salesforce/apex/EventQuizAppCtlr.getActiveQuizEvent';
export default class EventQuizApp extends LightningElement {
    @api activeEventId = 'a041y000004DQQ5AAO';// hardcore for now
    questions;
    correctAns = [];
    totalMarks;
    quizTimmer;
    quizScreen;
    resultScreen;
    correctAnsLength;
    isUpdate;

    connectedCallback() {
        this.resultScreen = localStorage.getItem('resultScreen');
        this.quizScreen = !localStorage.getItem('resultScreen');
        this.totalMarks = localStorage.getItem('totalMarks');
        this.correctAnsLength = localStorage.getItem('correctAnsLength');
        if(this.quizScreen){
            getActiveQuizEvent({activeEventId:this.activeEventId}).then(result =>{
                this.questions = JSON.parse(result.Questions__c.replaceAll('\'',''));
                this.quizTimmer = result.Quiz_Time__c;
                let i = 0;
                this.questions = this.questions.map((item,index) => {
                    item.questionText = `${index+1}. ${item.questionText}`;
                    return item;
                });
            }).catch(error =>{
                console.log('error : ',error);
            });
        }
    }

    handleOptionSelect(event){
        let questionIndex = event.target.dataset.index;
        let questionText = event.target.name;
        let selectedAns = event.detail.value;
        if(this.questions[questionIndex].correctAnswer === selectedAns){
            this.correctAns.push({"questionText":questionText, "marks":this.questions[questionIndex].marks});
        }else{
            let newArray = this.correctAns.filter(item => {
                return item.questionText!==questionText;
            });
            this.correctAns = newArray;
        }
    }

    handleSubmit(){
        this.quizScreen = false;
        this.totalMarks = 0;
        for(var i=0; i<this.correctAns.length; i++)
        {
            this.totalMarks += parseInt(this.correctAns[i].marks);
        }
        
        this.resultScreen = true;
        this.correctAnsLength = this.correctAns.length;
        localStorage.setItem('totalMarks',this.totalMarks);
        localStorage.setItem('correctAnsLength',this.correctAns.length);
        localStorage.setItem('resultScreen',true);
        this.updateResult();
    }

    updateResult(){
        //to update attendee result. into {'label': ``, 'value': this.totalMarks};
    }
}