import { LightningElement, api } from "lwc";
import generateOTP from "@salesforce/apex/EventAppCtrl.generateOTP";
import { getRecordNotifyChange } from "lightning/uiRecordApi";

export default class GeneratePassword extends LightningElement {
    _recordId;

    @api
    set recordId(recordId) {
        if (recordId !== this._recordId) {
            this._recordId = recordId;
        }
    }

    get recordId() {
        return this._recordId;
    }

    @api
    async invoke() {
        await generateOTP({ recordId: this.recordId });
        getRecordNotifyChange([{ recordId: this.recordId }]);
    }
}
