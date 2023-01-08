(async () => {
  let msgReceived = async (request, sender, sendResponse) => {
    if (request.message.name !== "redirectTab") return;
    chrome.tabs.update({
      url: request.message.url
    });
  }
  chrome.runtime.onMessage.addListener(msgReceived); // receiving messages
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
      // open url after uninstall
      chrome.runtime.setUninstallURL('https://aliaffiliates.com/feedback');
      // Code to be executed on first install
      chrome.tabs.create({
        url: "html/dashboard.html"
      });
      chrome.storage.local.set({
        dashboard_data: []
      });
      chrome.storage.local.set({
        tracker_ID: 'default'
      });
      chrome.storage.local.set({
        server: 'https://phpstack-743429-2933059.cloudwaysapps.com/'
        // server: 'http://localhost:3000/'
      });
      chrome.storage.local.set({
        portalLink: 'https://portals.aliexpress.com/tools/promoLinkGenerate.htm?tools_promoLinkGenerate'
      });
    }
  });
})();