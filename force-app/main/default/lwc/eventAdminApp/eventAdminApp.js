import { LightningElement, api, wire, track } from "lwc";
import { getRecord, getFieldDisplayValue } from "lightning/uiRecordApi";
import PHASE_FIELD from "@salesforce/schema/Trailblazer_Event__c.Event_Phase__c";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getFeedbackMetrics from "@salesforce/apex/EventAppCtrl.getFeedbackMetrics";
import getSessionsAndBoothsForEvent from "@salesforce/apex/EventAppCtrl.getSessionsAndBoothsForEvent";
import getSurveyResults from "@salesforce/apex/EventAppCtrl.getSurveyResults";

export default class EventAdminApp extends LightningElement {
    @api recordId;
    @track feedbackResult;

    selectedFeedbackOption;
    totalVotes = 0;

    showSessionsList = false;
    sessions;
    selectedSession;

    showSurveyResults = false;
    showFeedbackResults = false;

    @wire(getRecord, { recordId: "$recordId", fields: [PHASE_FIELD] })
    devEvent;

    @wire(getSessionsAndBoothsForEvent, { eventId: "$recordId" })
    handleSessions({ data }) {
        if (data) {
            this.sessions = data.map((session) => {
                return {
                    label: session.Name,
                    value: session.Id
                };
            });
        }
    }

    get phase() {
        return getFieldDisplayValue(this.devEvent.data, PHASE_FIELD);
    }

    get isFeedback() {
        return (
            this.phase?.includes("Feedback") || this.phase?.includes("Survey")
        );
    }

    get feedbackOptions() {
        return [
            { label: "Keynote 1 Feedback", value: "keynote1Feedback" },
            { label: "Keynote 2 Feedback", value: "keynote2Feedback" },
            { label: "Session/Booth Feedback", value: "sessionFeedback" },
            { label: "Content Survey", value: "survey" },
            { label: "Event Feedback", value: "eventFeedback" }
        ];
    }

    handleSessionOptionChange(event) {
        this.selectedSession = event.detail.value;
        this.selectedFeedbackOption = "session_feedback" + this.selectedSession;
    }

    handleFeedbackOptionChange(event) {
        this.selectedFeedbackOption = event.detail.value;
        if (this.selectedFeedbackOption === "sessionFeedback") {
            this.showSessionsList = true;
        } else {
            this.showSessionsList = false;
        }
    }

    getFeedbackCounts() {
        if (this.selectedFeedbackOption !== "survey") {
            getFeedbackMetrics({
                eventId: this.recordId,
                feedbackType: this.selectedFeedbackOption
            })
                .then((result) => {
                    this.showSurveyResults = false;
                    this.showFeedbackResults = true;
                    this.feedbackResult = undefined;
                    this.feedbackResult = JSON.parse(result);
                })
                .catch((error) => {
                    console.error(error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "An error occurred",
                            message: "Please try again",
                            variant: "error"
                        })
                    );
                });
        } else {
            getSurveyResults({
                eventId: this.recordId
            })
                .then((result) => {
                    const parsedResult = JSON.parse(result);
                    const feedbackResult = {};
                    feedbackResult.count = parsedResult.count;
                    feedbackResult.comments = parsedResult.comments;
                    feedbackResult.otherValues = parsedResult.otherValues;
                    for (const prop in parsedResult) {
                        if (
                            prop !== "count" &&
                            prop !== "comments" &&
                            prop !== "otherValues"
                        ) {
                            feedbackResult[prop] = [];
                            // eslint-disable-next-line guard-for-in
                            for (const objProp in parsedResult[prop]) {
                                feedbackResult[prop].push({
                                    name: objProp,
                                    count: parsedResult[prop][objProp]
                                });
                            }
                        }
                    }
                    this.showSurveyResults = true;
                    this.showFeedbackResults = false;

                    this.feedbackResult = feedbackResult;
                    console.log(feedbackResult);
                })
                .catch((error) => {
                    console.error(error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "An error occurred",
                            message: "Please try again",
                            variant: "error"
                        })
                    );
                });
        }
    }
}
