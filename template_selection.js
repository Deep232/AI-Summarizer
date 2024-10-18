console.log("template_selection.js loaded");

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded event fired");
    const confirmButton = document.getElementById("confirmTemplate");
    const templateSelector = document.getElementById("templateSelector");

    if (confirmButton && templateSelector) {
        console.log("Confirm button and template selector found");
        confirmButton.addEventListener("click", () => {
            const selectedTemplate = templateSelector.value;
            console.log("Sending template selection:", selectedTemplate);
            chrome.runtime.sendMessage(
                { action: "templateSelected", template: selectedTemplate },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message:", chrome.runtime.lastError);
                    } else {
                        console.log("Template selection sent successfully", response);
                        window.close();
                    }
                }
            );
        });
    } else {
        console.error("Confirm button or template selector not found");
    }
});
