import { LightningElement, api } from "lwc";
import SLDSTOUCH from "@salesforce/resourceUrl/SLDSTOUCH";
import { loadStyle } from "lightning/platformResourceLoader";
import getAttendeeByEmail from "@salesforce/apex/EventAppCtrl.getAttendeeByEmail";
import updateAttendee from "@salesforce/apex/EventAppCtrl.updateAttendee";
import LightningAlert from "lightning/alert";

const STEP1 = "step1";
const STEP2 = "step2";
const STEP3 = "step3";

export default class EventRegistration extends LightningElement {
    step;
    showSpinner = false;

    @api eventId;

    email;
    twitter;
    attendeeId;

    handleEmailChange(event) {
        this.email = event.detail.value?.trim();
    }

    handleTwitterChange(event) {
        this.twitter = event.detail.value;
    }

    connectedCallback() {
        loadStyle(this, SLDSTOUCH);
        this.step = STEP1;
    }

    get isStep1() {
        return this.step === STEP1;
    }

    get isStep2() {
        return this.step === STEP2;
    }

    get isStep3() {
        return this.step === STEP3;
    }

    moveToStep2() {
        const emailEle = this.template.querySelector(".email");
        if (this.email) {
            emailEle.setCustomValidity("");
            emailEle.reportValidity();
            this.showSpinner = true;
            getAttendeeByEmail({ email: this.email, eventId: this.eventId })
                .then((result) => {
                    const resultObj = JSON.parse(result);

                    if (!resultObj.attendeeId) {
                        LightningAlert.open({
                            message:
                                "If you previously registered for this event, please check the email you entered. If not, please proceed to the registration desk.",
                            theme: "error",
                            label: "Unable to find your registration"
                        });
                    } else {
                        if (resultObj.alreadyCheckedIn) {
                            this.attendeeId = resultObj.attendeeId;
                            const event = new CustomEvent(
                                "registrationcomplete",
                                {
                                    detail: { attendeeId: this.attendeeId }
                                }
                            );
                            this.dispatchEvent(event);
                        } else {
                            if (resultObj.checkInClosed) {
                                LightningAlert.open({
                                    message:
                                        "Sorry. We are at capacity and cannot check in anyone else.",
                                    theme: "error",
                                    label: "Check In Closed"
                                });
                            } else {
                                this.attendeeId = resultObj.attendeeId;
                                this.step = STEP2;
                            }
                        }
                    }
                })
                .catch(() => {
                    LightningAlert.open({
                        message:
                            "An error occurred when fetching your details. Please reach out to the event staff.",
                        theme: "error",
                        label: "An error occurred"
                    });
                })
                .finally(() => {
                    this.showSpinner = false;
                });
        } else {
            emailEle.setCustomValidity("Email address is required");
            emailEle.reportValidity();
        }
    }

    moveToStep3() {
        const twitterEle = this.template.querySelector(".twitter");
        if (this.twitter) {
            twitterEle.setCustomValidity("");
            twitterEle.reportValidity();
            this.showSpinner = true;
            updateAttendee({
                attendeeId: this.attendeeId,
                twitterHandle: this.twitter
            })
                .then((result) => {
                    if (result) {
                        this.step = STEP3;
                        const event = new CustomEvent("registrationcomplete", {
                            detail: { attendeeId: this.attendeeId }
                        });
                        this.dispatchEvent(event);
                    } else {
                        LightningAlert.open({
                            message:
                                "An error occurred when saving your data. Please reach out to the event staff.",
                            theme: "error",
                            label: "An error occurred"
                        });
                    }
                })
                .catch(() => {
                    LightningAlert.open({
                        message:
                            "An error occurred when saving your data. Please reach out to the event staff.",
                        theme: "error",
                        label: "An error occurred"
                    });
                })
                .finally(() => {
                    this.showSpinner = false;
                });
        } else {
            twitterEle.setCustomValidity("Twitter handle is required");
            twitterEle.reportValidity();
        }
    }

    skipToStep3() {
        this.step = STEP3;
        const event = new CustomEvent("registrationcomplete", {
            detail: { attendeeId: this.attendeeId }
        });
        this.dispatchEvent(event);
    }
}
