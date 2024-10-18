// Get text content from the webpage
function extractPageContent() {
    let content = document.body.innerText;
    return content.trim();
  }
  
  // Send a message to background script to summarize
  function summarizePage() {
    const pageContent = extractPageContent();
    chrome.runtime.sendMessage({ action: "summarize", content: pageContent });
  }
  
  // Set a listener for keyboard shortcut command
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request);
    if (request.action === "summarize_page") {
      summarizePage();
    }
  });
  