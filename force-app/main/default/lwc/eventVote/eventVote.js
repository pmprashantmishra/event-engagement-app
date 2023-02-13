import { LightningElement, api } from "lwc";
import SLDSTOUCH from "@salesforce/resourceUrl/SLDSTOUCH";
import { loadStyle } from "lightning/platformResourceLoader";
import LightningAlert from "lightning/alert";

export default class EventVote extends LightningElement {
    connectedCallback() {
        loadStyle(this, SLDSTOUCH);
    }

    @api voteOptions;
    @api voteType;
    @api voteTitle;
    @api alreadyVoted;
    @api isFeedback;
    @api embedded;
    @api feedbackText;

    feedbackNotes;

    captureFeedbackNotes(event) {
        this.feedbackNotes = event.detail.value;
    }

    submitVote() {
        const radioElements = this.template.querySelectorAll(
            "lightning-radio-group"
        );
        let allValid = true;
        let votes = {};
        radioElements.forEach((ele) => {
            if (!ele.checkValidity()) {
                allValid = false;
            }
            votes[ele.name] = ele.value;
            ele.reportValidity();
        });

        if (allValid && this.voteType === "sessionVote") {
            let voteValues = Object.values(votes);
            if (voteValues[0] === voteValues[1]) {
                allValid = false;
                LightningAlert.open({
                    message:
                        "You cannot select the same session as both your preferences.",
                    theme: "error",
                    label: "Cant select same session"
                });
            }
        }

        if (this.isFeedback && this.feedbackNotes) {
            votes.notes = this.feedbackNotes;
        }

        if (allValid) {
            const event = new CustomEvent("vote", {
                detail: { votes }
            });
            this.dispatchEvent(event);
        }
    }

    cancelFeedback() {
        this.dispatchEvent(new CustomEvent("closefeedback"));
    }
}
