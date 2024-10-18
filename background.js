// background.js for Chrome Extension


const notionApiKey = "notionApiKey";  // Optional: If Notion API key is also hardcoded
const openAiApiKey = "openapiKey";

const notionPageId = "PageId";  // The Notion page ID where summaries will be saved

// background.js for Chrome Extension

let currentSummary = "";
let currentContent = "";
let currentPageTitle = "";
let currentPageUrl = "";

// Listener for keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "summarize_page") {
    console.log("Summarize page command received");
    summarizeActiveTab();
  }
});

// Listener for browser action button click
chrome.action.onClicked.addListener((tab) => {
  console.log("Browser action button clicked");
  summarizeActiveTab();
});

// Function to summarize the active tab
function summarizeActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.id) {
        currentPageTitle = activeTab.title;
        currentPageUrl = activeTab.url;
      // Inject script to extract content
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          func: extractPageContent
        },
        (result) => {
          if (result && result[0] && result[0].result) {
            currentContent = result[0].result;
            showTemplateSelection(currentContent);
          }
        }
      );
    }
  });
}

// Function to extract content from the page
function extractPageContent() {
  return document.body.innerText.trim();
}

// Function to show template selection popup
function showTemplateSelection(content, tabId) {
  chrome.windows.getCurrent((currentWindow) => {
    const width = 400;
    const height = 300;
    const top = currentWindow.top + 85; // Adjust this value as needed
    const left = currentWindow.left + currentWindow.width - width - 20; // 20px from right edge

    chrome.windows.create({
      url: chrome.runtime.getURL("template_selection.html"),
      type: "popup",
      width: width,
      height: height,
      top: top,
      left: left
    }, (window) => {
      templateSelectionWindowId = window.id;
      chrome.runtime.onMessage.addListener(function handleTemplateSelection(message, sender, sendResponse) {
        if (message.action === "templateSelected") {
          chrome.runtime.onMessage.removeListener(handleTemplateSelection);
          const selectedTemplate = message.template;
          generateSummary(content, selectedTemplate, tabId);
          chrome.windows.remove(templateSelectionWindowId);
          templateSelectionWindowId = null;
        }
      });
    });
  });
}

// Function to generate the summary using OpenAI API
async function generateSummary(content, template, tabId) {
  if (!openAiApiKey) {
    console.error("API key not set");
    return;
  }

  console.log("Generating summary for content:", content);

  const prompt = `${template}\n\n${content}\n\n`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that summarizes text." },
          { role: "user", content: prompt }
        ],
        max_tokens: 300
      })
    });
    
    const data = await response.json();
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      currentSummary = data.choices[0].message.content;
      console.log("Generated summary:", currentSummary);

      // Open summary confirmation popup
      showSummaryPopup(currentSummary, tabId);
    } else {
      console.error("No valid response from OpenAI");
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
  }
}

// Function to show summary popup
function showSummaryPopup(initialContent, tabId) {
  chrome.windows.getCurrent((currentWindow) => {
    const width = 500;
    const height = 400;
    const top = currentWindow.top + 85; // Adjust this value as needed
    const left = currentWindow.left + currentWindow.width - width - 20; // 20px from right edge

    chrome.windows.create({
      url: chrome.runtime.getURL("summary_popup.html"),
      type: "popup",
      width: width,
      height: height,
      top: top,
      left: left
    }, (window) => {
      chrome.tabs.sendMessage(window.tabs[0].id, { action: "showSummary", summary: initialContent });
    });
  });
}

// Listener for messages from popup to get the summary or save to Notion
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSummary") {
    sendResponse({ summary: currentSummary });
  } else if (message.action === "saveSummaryToNotion") {
    saveSummaryToNotion(currentSummary).then((success) => {
      sendResponse({ success });
    });
    return true;  // Keep the message channel open for async response
  }
});

// Function to save the summary to Notion
async function saveSummaryToNotion(summary) {
    if (!notionApiKey || !notionPageId) {
      console.error("Notion API key or page ID not set");
      return false;
    }
  
    try {
        const response = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${notionApiKey}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
          },
          body: JSON.stringify({
            parent: { page_id: notionPageId },
            properties: {
              title: { title: [{ text: { content: currentPageTitle } }] }
            },
            children: [
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ text: { content: summary } }]
                }
              },
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{
                    type: "text",
                    text: {
                      content: "For more information, you can view the original document here: ",
                      link: null
                    }
                  }, {
                    type: "text",
                    text: {
                      content: currentPageUrl,
                      link: { url: currentPageUrl }
                    }
                  }]
                }
              }
            ]
          })
        });
    if (response.ok) {
      console.log("Summary sent to Notion successfully");
      return true;
    } else {
      console.error("Failed to send summary to Notion", await response.text());
      return false;
    }
  } catch (error) {
    console.error("Error sending to Notion:", error);
    return false;
  }
}
