import { LightningElement, api } from "lwc";
import getQuestMetrics from "@salesforce/apex/EventAppCtrl.getQuestMetrics";
import isSecretValid from "@salesforce/apex/EventAppCtrl.isSecretValid";
import updateAttendee from "@salesforce/apex/EventAppCtrl.updateAttendee";
import LightningAlert from "lightning/alert";
import EventHashTag from "@salesforce/label/c.EventHashTag";

export default class EventQuest extends LightningElement {
    @api attendeeId;
    @api eventId;

    eventHashTag = EventHashTag;

    boothVisitComplete = false;
    numFeedbackGiven = 0;
    numSessionAttended = 0;
    numPplMet = 0;

    metVolunteer = false;
    metSpeaker = false;

    eventFeedbackComplete = false;

    playedGame = false;
    tweeted = false;
    showSpinner = false;

    twitterHandle;
    updatedOnce = false;
    updateMode = false;

    showScanner = false;

    inPerson = false;

    get numPplProgress() {
        const perc = this.numPplMet * 10;
        return perc > 100 ? 100 : perc;
    }

    get numFeedbackProgress() {
        const perc = this.numFeedbackGiven * 33;
        return perc > 98 ? 100 : perc;
    }

    get numSessionProgress() {
        const perc = this.numSessionAttended * 33;
        return perc > 98 ? 100 : perc;
    }

    connectedCallback() {
        this.updateMode = false;
        this.getMetrics();
    }

    handleRefresh() {
        this.getMetrics();
    }

    handleTwitterChange(event) {
        this.twitterHandle = event.detail.value;
    }

    handleUpdateClick() {
        this.updateMode = true;
    }

    async saveTwitterHandle() {
        const twitterEle = this.template.querySelector(".twitter_handle");
        twitterEle.reportValidity();
        if (this.twitterHandle) {
            this.showSpinner = true;
            await updateAttendee({
                attendeeId: this.attendeeId,
                twitterHandle: this.twitterHandle,
                fromQuest: true
            });
            this.showSpinner = false;
            this.updateMode = false;
            this.updatedOnce = true;
        }
    }

    getMetrics() {
        this.showSpinner = true;
        getQuestMetrics({ attendeeId: this.attendeeId })
            .then((result) => {
                this.boothVisitComplete = result.Visited_a_Booth__c;
                this.numSessionAttended = result.Number_of_sessions_attended__c;
                this.numFeedbackGiven = result.Number_of_feedbacks_given__c;
                this.numPplMet = result.Number_of_people_met__c;
                this.metSpeaker = result.Met_a_speaker__c;
                this.metVolunteer = result.Met_a_volunteer__c;
                this.eventFeedbackComplete = result.Give_event_feedback__c;
                this.playedGame = result.Play_a_game__c;
                this.tweeted = result.Tweet__c;
                this.twitterHandle = result.Twitter_handle__c;
                this.updatedOnce = result.Updated_Twitter_Handle__c;
            })
            .catch(() => {
                LightningAlert.open({
                    message:
                        "An error occurred when fetching data. Please reach out to the event staff.",
                    theme: "error",
                    label: "An error occurred"
                });
            })
            .finally(() => {
                this.showSpinner = false;
            });
    }

    secretCode;

    handleChange(event) {
        this.secretCode = event.detail.value;
    }

    scanQRCode() {
        this.showScanner = true;
    }

    async handleQRResponse(event) {
        try {
            const message = atob(event.detail.message.data);
            this.closeScanner();
            this.showSpinner = true;
            const secretValid = await isSecretValid({
                eventId: this.eventId,
                secret: message,
                attendeeId: this.attendeeId
            });
            if (secretValid.isSuccess) {
                this.getMetrics();
                this.showSpinner = false;
            } else {
                this.showSpinner = false;
                LightningAlert.open({
                    message: secretValid.message,
                    theme: "error",
                    label: "Oops"
                });
            }
        } catch (e) {
            this.showSpinner = false;
            this.closeScanner();
            console.log(e);
            LightningAlert.open({
                message:
                    "An error occurred. Please reach out to the event staff.",
                theme: "error",
                label: "An error occurred"
            });
        }
    }

    closeScanner() {
        this.showScanner = false;
    }
}
