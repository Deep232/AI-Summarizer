document.addEventListener("DOMContentLoaded", () => {
  const summaryDiv = document.getElementById("summary");

  // Request the summary from the background script
  chrome.runtime.sendMessage({ action: "getSummary" }, (response) => {
    if (response && response.summary) {
      summaryDiv.textContent = response.summary;
    } else {
      summaryDiv.textContent = "No summary available.";
      console.error("No summary received from background script");
    }
  });

  document.getElementById("accept").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "saveSummaryToNotion" }, (response) => {
      if (response && response.success) {
        alert("Summary saved to Notion successfully!");
        window.close(); // Close the popup after saving
      } else {
        alert("Failed to save summary to Notion.");
      }
    });
  });

  document.getElementById("reject").addEventListener("click", () => {
    window.close(); // Simply close the popup if rejected
  });

  document.getElementById("copy").addEventListener("click", () => {
    const summaryText = summaryDiv.textContent;
    navigator.clipboard.writeText(summaryText).then(() => {
      alert("Summary copied to clipboard!");
    });
  });
});
