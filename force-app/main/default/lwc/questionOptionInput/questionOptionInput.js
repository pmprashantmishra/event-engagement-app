import { LightningElement, api } from 'lwc';

export default class QuestionOptionInput extends LightningElement {
    optionsList = [];

    connectedCallback(){
        this.addRow();
        this.addRow();
    }

    addRow() {
        let optionRow = {
            label : '',
            value : ''
        }
        this.optionsList = this.optionsList.concat([optionRow]);
    }

    handleAddOptionRow(){
        this.addRow();
    }

    handleOptionChange(event) {
        let data = event.target.value;
        this.optionsList[event.currentTarget.dataset.index].label = data;
        this.optionsList[event.currentTarget.dataset.index].value = data;

        this.dispatchEvent(new CustomEvent('optionchange', {
            detail : this.optionsList
        }));
    }
}