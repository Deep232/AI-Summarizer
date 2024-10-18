document.getElementById("save").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value;
    const notionApiKey = document.getElementById("notionApiKey").value;
    chrome.storage.local.set({ apiKey, notionApiKey }, () => {
      console.log("API Keys saved");
      alert("API Keys saved successfully!");
    });
  });
  