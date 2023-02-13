import { LightningElement, wire, api } from 'lwc';
import QRCode from "c/barcode";
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Session_Booth__c.Name';
import CODE_FIELD from '@salesforce/schema/Session_Booth__c.Code__c';

export default class SessionBoothQRCode extends LightningElement {
    @api recordId;

    @wire(getRecord, {
        recordId: '$recordId',
        fields: [NAME_FIELD, CODE_FIELD]
    })
    record;

    get sessionName() {
        return getFieldValue(this.record.data, NAME_FIELD);
    }

    get sessionCode() {
        return getFieldValue(this.record.data, CODE_FIELD);
    }

    renderedCallback(){
        QRCode.toCanvas(
            this.template.querySelector(".barcode"),
            btoa(this.sessionCode),
            {
                margin: 1,
                color: {
                    light: "#fff",
                    dark: "#000" /** Use your event's theme color **/
                },
                width: 300
            },
            function (error) {
                if (error) console.error(error.message);
            }
        );
    }
}