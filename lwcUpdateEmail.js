import {
    LightningElement,
    track,
    api
} from 'lwc';
import {
    ShowToastEvent
} from "lightning/platformShowToastEvent";
import {
    NavigationMixin
} from 'lightning/navigation';
import doInitContactAddress from '@salesforce/apex/UpdateEmailController.doInitContactAddress';
import doInitUserDetails from '@salesforce/apex/UpdateEmailController.doInitUserDetails';
import saveContactAddress from '@salesforce/apex/UpdateEmailController.saveContactAddress';
import saveUserDetails from '@salesforce/apex/UpdateEmailController.saveUserDetails';
import resetPassword from '@salesforce/apex/UpdateEmailController.resetPassword';

export default class LwcUpdateEmail extends NavigationMixin(LightningElement) {

    @api showEmail;
    @api showResetPassword;
    @api showUsername;
    @api editEmail;
    @api recordId;

    @track responseWrapper = {
        conDetails: '',
        userDetails: ''
    };
    @track showSpinner = true;
    @track emailConfirmationModal = false;
    @track showEmailModel = false;
    @track conId;
    @track userId;
    @track disableEmail = false;
    @track showSuccessMessage = false;
    @track showConfirmationModal = false;

    connectedCallback() {
        if (this.editEmail == false) {
            this.disableEmail = true;
        } else
            this.disableEmail = false;
    }
    handleInput(event) {
        if (event.target.name === "username") {
            this.responseWrapper.userDetails.username = event.target.value.trim();
            this.emailRecover.username = event.target.value.trim();
        } else if (event.target.name === "email") {
            this.responseWrapper.userDetails.email = event.target.value.trim();
            this.responseWrapper.conDetails.conEmail = event.target.value.trim();
        }
    }

    cancelUpdateEmailModal() {
        this.showConfirmationModal = false;
        this.showEmailModel = true;
        this.dispatchEvent(new CustomEvent('modalcancel'));
    }

    handleSaveContinue() {
        this.showSpinner = true;
        saveContactAddress({
                responseWrapper: JSON.stringify(this.responseWrapper.conDetails),
                contactId: this.conId,
            })
            .then(result => {})
            .catch(error => {})
            .finally(() => this.showSpinner = false);
        this.showSpinner = true;
        saveUserDetails({
                responseWrapper: JSON.stringify(this.responseWrapper.userDetails),
                userId: this.userId
            })
            .then(result => {
                this.showConfirmationModal = false;
                this.emailConfirmationModal = true;
            })
            .catch(error => {
                this.showSpinner = true;
                const event = new ShowToastEvent({
                    title: "Error",
                    message: "You do not have permission to update the email!",
                    variant: "error",
                    mode: "dismissable"
                });
                this.dispatchEvent(event);
            })
            .finally(() => this.showSpinner = false);
    }

    handleResetPassword() {
        this.showSpinner = true;
        this.showEmailModel = false;
        try {
            resetPassword({
                    username: this.responseWrapper.userDetails.username
                })
                .then(result => {
                    this.showSpinner = false;
                    const event = new ShowToastEvent({
                        title: "Success",
                        message: "Reset Password Email has been sent to your provided email!",
                        variant: "success",
                        mode: "dismissable"
                    });
                    this.dispatchEvent(event);
                })
                .catch(error => {
                    this.showSpinner = false;
                });
        } catch (ex) {
            this.showSpinner = false;
        }
    }
    openEmailModel() {
        this.showEmailModel = true;
        this.showSpinner = true;
        doInitContactAddress({
                contactId: this.recordId,
            })
            .then(result => {
                if (result != null) {
                    this.responseWrapper.conDetails = result;
                    this.conId = this.responseWrapper.conDetails.Id;
                }
                console.log(this.responseWrapper.conDetails);
            })
            .catch(error => {})
            .finally(() => this.showSpinner = false);
        this.showSpinner = true;
        doInitUserDetails({
                contactId: this.recordId
            })
            .then(result => {
                if (result != null) {
                    this.responseWrapper.userDetails = result;
                    this.userId = this.responseWrapper.userDetails.Id;
                }
            })
            .catch(error => {})
            .finally(() => this.showSpinner = false);

    }

    cancelEmailModal() {
        this.showEmailModel = false;
        this.dispatchEvent(new CustomEvent('modalcancel'));
    }

    isValid() {
        let valid = false;
        valid = [...this.template.querySelectorAll("lightning-input")].reduce(
            (validSoFar, input) => {
                input.reportValidity();
                return validSoFar && input.checkValidity();
            },
            true
        );

        valid &= [...this.template.querySelectorAll("lightning-combobox")].reduce(
            (validSoFar, input) => {
                input.reportValidity();
                return validSoFar && input.checkValidity();
            },
            true
        );
        return valid;
    }
    handleEmailSave() {
        if (this.isValid()) {
            if (this.responseWrapper.userDetails.email == '') {
                return;
            }
            this.showEmailModel = false;
            this.showConfirmationModal = true;
        }
    }
    cancelConfirmationModal() {
        window.location.reload();
        this.emailConfirmationModal = false;
        this.dispatchEvent(new CustomEvent('modalcancel'));
    }
}
