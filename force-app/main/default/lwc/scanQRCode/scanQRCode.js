import { LightningElement } from "lwc";

export default class ScanQRCode extends LightningElement {
    iframeLoaded = false;

    receiveMessage = (message) => {
        if (message.origin === "https://venerable-strudel-b9e4e9.netlify.app") {
            const event = new CustomEvent("scancomplete", {
                detail: { message }
            });
            this.dispatchEvent(event);
        }
    };

    connectedCallback() {
        window.addEventListener("message", this.receiveMessage);
    }

    disconnectedCallback() {
        window.removeEventListener("message", this.receiveMessage);
    }

    handleLoad() {
        this.iframeLoaded = true;
    }
}
