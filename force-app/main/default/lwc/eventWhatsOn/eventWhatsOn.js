import { LightningElement, api } from "lwc";
import saveActivity from "@salesforce/apex/EventAppCtrl.saveActivity";
import saveSessionBoothAttendance from "@salesforce/apex/EventAppCtrl.saveSessionBoothAttendance";
import LightningAlert from "lightning/alert";
import getActiveEvent from "@salesforce/apex/EventAppCtrl.getActiveEvent";

export default class EventWhatsOn extends LightningElement {
    phase;
    @api attendeeId;
    @api eventId;
    @api attendeeRegId;
    @api preRegistered;

    showCheckIn = false;
    showKeynote = false;
    showGame1 = false;
    showGame2 = false;
    showBoothsSessions = false;

    showVote = false;
    showSurvey = false;

    showSpinner = false;

    isFeedback = false;
    feedbackText = "Any additional thoughts?";

    embedded = false;

    voteType;
    voteOptions;
    voteTitle;
    alreadyVoted;

    feedbackOptions = [
        { label: "😍 I loved it 😍", value: "5" },
        { label: "🤩 It was good 🤩", value: "4" },
        { label: "🙂 It was OK 🙂", value: "3" },
        { label: "😒 It was not bad 😒", value: "2" },
        { label: "🤮 I hated it 🤮", value: "1" }
    ];

    async connectedCallback() {
        this.showSpinner = true;
        const eventResult = await getActiveEvent();
        if (eventResult) {
            this.phase = eventResult.Event_Phase__c;
            this.showPhaseContent();
        }
        this.showSpinner = false;
    }

    showPhaseContent() {
        switch (this.phase) {
            case "Check In":
                this.showCheckIn = true;
                break;
            case "Keynote 1":
                this.showKeynote = true;
                break;
            case "Game 1":
                this.showGame1 = true;
                break;
            case "Keynote 1 Feedback":
                this.populateKeynote1Feedback();
                this.showVote = true;
                this.isFeedback = true;
                break;
            case "Booths and Sessions":
                this.showBoothsSessions = true;
                break;
            case "Keynote 2":
                this.showKeynote = true;
                break;
            case "Game 2":
                this.showGame2 = true;
                break;
            case "Keynote 2 Feedback":
                this.populateKeynote2Feedback();
                this.showVote = true;
                this.isFeedback = true;
                break;
            case "Survey":
                this.populateSurvey();
                this.showSurvey = true;
                this.isFeedback = true;
                break;
            case "Event Feedback":
                this.populateEventFeedback();
                this.showVote = true;
                this.isFeedback = true;
                break;
            default:
                break;
        }
    }

    get isRegistrationPhase() {
        return this.phase && this.phase === "Check In";
    }

    get isKeynotePhase() {
        return this.phase && this.phase === "Keynote";
    }

    populateKeynote1Feedback() {
        this.voteType = "keynote1Feedback";
        this.voteTitle = "Keynote Feedback";
        this.voteOptions = [
            {
                title: "How was the opening keynote?",
                name: "keynote1Feedback",
                options: this.feedbackOptions
            }
        ];
        this.embedded = false;
        if (localStorage.getItem("vote_" + this.voteType) === "done") {
            this.alreadyVoted = true;
        } else {
            this.alreadyVoted = false;
        }
    }

    populateKeynote2Feedback() {
        this.voteType = "keynote2Feedback";
        this.voteTitle = "Keynote Feedback";
        this.voteOptions = [
            {
                title: "How was the closing keynote?",
                name: "keynote2Feedback",
                options: this.feedbackOptions
            }
        ];
        this.embedded = false;
        if (localStorage.getItem("vote_" + this.voteType) === "done") {
            this.alreadyVoted = true;
        } else {
            this.alreadyVoted = false;
        }
    }

    populateSurvey() {
        this.voteType = "survey";
        this.voteTitle = "Developer Content Survey";
        this.feedbackText =
            "What content would you like us to do that we are not doing right now?";
        this.voteOptions = [
            {
                title: "Where do you follow Salesforce Developers and get updates?",
                name: "updates",
                options: [
                    { label: "Telegram", value: "telegram" },
                    { label: "Linkedin", value: "linkedin" },
                    { label: "Facebook", value: "facebook" },
                    { label: "Twitter", value: "twitter" },
                    { label: "SF Developers Newsletter", value: "newsletter" },
                    { label: "Community Group on Trailhead", value: "cgth" }
                ]
            },
            {
                title: "If we were to do webinars on YouTube, when would you be free to attend virtually?",
                name: "timeframe",
                options: [
                    { label: "Thursday morning", value: "thu_morn" },
                    { label: "Thursday evening", value: "thu_eve" },
                    { label: "Friday morning", value: "fri_morn" },
                    { label: "Friday evening", value: "fri_eve" },
                    { label: "Saturday morning", value: "sat_morn" },
                    { label: "Saturday evening", value: "sat_eve" },
                    {
                        label: "Only interested in the recording",
                        value: "recording"
                    }
                ]
            },
            {
                title: "How long would you like learning videos to be?",
                name: "preferedLength",
                options: [
                    { label: "YouTube Shorts ~ 1 mins", value: "ytshorts" },
                    { label: "Quick Tutorials ~ 10 mins", value: "qtakes" },
                    { label: "Deep dives: ~30 min", value: "deepdives" },
                    {
                        label: "Webinars/live streams: ~1 hour",
                        value: "webinars"
                    }
                ]
            },
            {
                title: "Where do you go to learn something cool or new about Salesforce?",
                name: "preferedPlace",
                options: [
                    {
                        label: "SF Developers YouTube Channel",
                        value: "sfdevsyt"
                    },
                    { label: "Other YouTube channels", value: "otheryt" },
                    { label: "SF Developers Blog", value: "sfdevsblog" },
                    { label: "Other Blogs", value: "otherblogs" },
                    { label: "Trailhead", value: "trailhead" },
                    { label: "LinkedIn", value: "li" },
                    { label: "Other", value: "other" }
                ]
            }
        ];
        if (localStorage.getItem("vote_" + this.voteType) === "done") {
            this.alreadyVoted = true;
        }
    }

    populateEventFeedback() {
        this.voteType = "eventFeedback";
        this.voteTitle = "Event Feedback";
        this.voteOptions = [
            {
                title: "How was the event?",
                name: "eventFeedbackOverall",
                options: this.feedbackOptions
            }
        ];
        this.embedded = false;
        if (localStorage.getItem("vote_" + this.voteType) === "done") {
            this.alreadyVoted = true;
        } else {
            this.alreadyVoted = false;
        }
    }

    handleVote(event) {
        this.showSpinner = true;
        saveActivity({
            eventId: this.eventId,
            attendeeId: this.attendeeId,
            activityType: "Vote",
            activitySubType: this.voteType,
            value: JSON.stringify(event.detail.votes)
        })
            .then((result) => {
                if (result) {
                    localStorage.setItem("vote_" + this.voteType, "done");
                    this.alreadyVoted = true;
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
    }

    sessionCode;
    showSessionAttendance = true;
    showSessionFeedback = false;

    handleSessionCodeChange(event) {
        this.sessionCode = event.detail.value;
    }

    showFeedbackForm(sessionCode) {
        this.showSpinner = true;
        saveSessionBoothAttendance({
            eventId: this.eventId,
            attendeeId: this.attendeeId,
            sessionCode: sessionCode
        })
            .then((result) => {
                if (result) {
                    const parsedResult = JSON.parse(result);
                    if (parsedResult.isSuccess) {
                        this.showSessionAttendance = false;
                        this.showSessionFeedback = true;

                        // Populate Vote Options
                        this.voteType =
                            "session_feedback" + parsedResult.message;
                        this.voteTitle =
                            "Attendance marked. Share your feedback";
                        this.voteOptions = [
                            {
                                title: "How did you like the content shared?",
                                name: "session_feedback" + parsedResult.message,
                                options: this.feedbackOptions
                            }
                        ];
                        this.embedded = true;
                        this.isFeedback = true;
                        this.feedbackText = "Any additional thoughts?";
                        if (
                            localStorage.getItem("vote_" + this.voteType) ===
                            "done"
                        ) {
                            this.alreadyVoted = true;
                        } else {
                            this.alreadyVoted = false;
                        }
                    } else {
                        LightningAlert.open({
                            message: parsedResult.message,
                            theme: "error",
                            label: "Oops!"
                        });
                    }
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
    }

    saveSessionAttendance() {
        const sessionCodeEle = this.template.querySelector(".sessionCode");
        if (this.sessionCode) {
            sessionCodeEle.setCustomValidity("");
            sessionCodeEle.reportValidity();
            this.showFeedbackForm(this.sessionCode);
        } else {
            sessionCodeEle.setCustomValidity("Session Code is required");
            sessionCodeEle.reportValidity();
        }
    }

    closefeedback() {
        this.showSessionAttendance = true;
        this.showSessionFeedback = false;
        this.sessionCode = undefined;
    }

    showScanner = false;

    scanQRCode() {
        this.showScanner = true;
    }

    async handleQRResponse(event) {
        this.closeScanner();
        try {
            const message = event.detail.message.data;
            this.showFeedbackForm(message);
        } catch (e) {
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
