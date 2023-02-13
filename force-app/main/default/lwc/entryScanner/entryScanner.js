import { LightningElement } from "lwc";
import SFLOGO from "@salesforce/resourceUrl/sf_logo";
import login from "@salesforce/apex/EventAppCtrl.login";
import LightningAlert from "lightning/alert";
import checkInPerson from "@salesforce/apex/EventAppCtrl.checkInPerson";

export default class BoothScanner extends LightningElement {
    sfLogo = SFLOGO;
    boothSessionId;
    boothSessionName;
    showScanner = false;
    isLoading = false;

    recentlyCheckedInName;

    connectedCallback() {
        const boothSessionId_ls = localStorage.getItem(
            "welcome_boothSessionId"
        );
        if (boothSessionId_ls) {
            this.boothSessionId = boothSessionId_ls;
        }

        const boothSessionName_ls = localStorage.getItem(
            "welcome_boothSessionName"
        );
        if (boothSessionName_ls) {
            this.boothSessionName = boothSessionName_ls;
        }
    }

    handleLogin() {
        const sessCodeEle = this.template.querySelector(".sessCode");
        const otpEle = this.template.querySelector(".otp");
        sessCodeEle.reportValidity();
        otpEle.reportValidity();
        if (sessCodeEle.value?.trim() && otpEle.value?.trim()) {
            this.isLoading = true;
            login({
                sessCode: sessCodeEle.value.trim(),
                otp: otpEle.value.trim()
            })
                .then((result) => {
                    if (result) {
                        this.boothSessionId = result.Id;
                        this.boothSessionName = result.Name;
                        localStorage.setItem(
                            "welcome_boothSessionId",
                            this.boothSessionId
                        );
                        localStorage.setItem(
                            "welcome_boothSessionName",
                            this.boothSessionName
                        );
                    } else {
                        LightningAlert.open({
                            message: "Invalid session/booth code or OTP",
                            theme: "error",
                            label: "Unable to Login"
                        });
                    }
                })
                .catch((error) => {
                    console.log(error);
                    LightningAlert.open({
                        message:
                            "An error occurred. Please contact event staff.",
                        theme: "error",
                        label: "An error occurred"
                    });
                })
                .finally(() => {
                    this.isLoading = false;
                });
        }
    }

    handleLogout() {
        this.boothSessionId = undefined;
        localStorage.removeItem("welcome_boothSessionId");
        localStorage.removeItem("welcome_boothSessionName");
    }

    scanQRCode() {
        this.showScanner = true;
    }

    closeScanner() {
        this.showScanner = false;
    }

    handleQRResponse() {
        try {
            const message = atob(event.detail.message.data);
            this.isLoading = true;
            checkInPerson({ attendeeCode: message })
                .then((result) => {
                    this.recentlyCheckedInName = result.Name;
                })
                .catch((error) => {
                    LightningAlert.open({
                        message: error.message,
                        theme: "error",
                        label: "Oops"
                    });
                    console.log(error);
                })
                .finally(() => {
                    this.isLoading = false;
                });
        } catch (e) {
            this.closeScanner();
            LightningAlert.open({
                message: "Invalid code scanned",
                theme: "error",
                label: "Oops"
            });
        }
    }
}
