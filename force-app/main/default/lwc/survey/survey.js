import { LightningElement, api } from "lwc";
import SLDSTOUCH from "@salesforce/resourceUrl/SLDSTOUCH";
import { loadStyle } from "lightning/platformResourceLoader";

export default class Survey extends LightningElement {
    connectedCallback() {
        loadStyle(this, SLDSTOUCH);
    }

    @api voteOptions;
    @api voteType;
    @api voteTitle;
    @api alreadyVoted;
    @api feedbackText;

    feedbackNotes;
    otherValue;

    captureFeedbackNotes(event) {
        this.feedbackNotes = event.detail.value;
    }

    saveOtherValue(event) {
        this.otherValue = event.detail.value;
    }

    submitVote() {
        const checkboxElements = this.template.querySelectorAll(
            "input[type=checkbox]"
        );
        let allValid = true;
        let votes = {};

        checkboxElements.forEach((ele) => {
            votes[ele.name] = [];
        });

        checkboxElements.forEach((ele) => {
            if (ele.checked) {
                votes[ele.name].push(ele.value);
            }
        });

        this.template.querySelectorAll("fieldset").forEach((element) => {
            if (votes[element.dataset.name]?.length === 0) {
                element.classList.add("slds-has-error");
                allValid = false;
            } else {
                element.classList.remove("slds-has-error");
            }
        });

        if (this.feedbackNotes) {
            votes.notes = this.feedbackNotes;
        }

        if (this.otherValue) {
            votes.otherValue = this.otherValue;
        }

        if (allValid) {
            const event = new CustomEvent("vote", {
                detail: { votes }
            });
            this.dispatchEvent(event);
        }
    }

    handleCheckBoxChange(e) {
        let showOther = false;
        const eleName = e.target.name;

        const checkboxElements = this.template.querySelectorAll(
            "input[type=checkbox][name=" + eleName + "]"
        );
        checkboxElements.forEach((el) => {
            if (el.checked && el.value.includes("other")) {
                showOther = true;
            }
        });

        if (showOther) {
            this.template.querySelector(
                ".otherOption[data-name=" + eleName + "]"
            ).style.display = "block";
        } else {
            this.template.querySelector(
                ".otherOption[data-name=" + eleName + "]"
            ).style.display = "none";
        }
    }
}
