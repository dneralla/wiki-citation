chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  chrome.action.show(sender.tab.id);
  sendResponse({});
});
