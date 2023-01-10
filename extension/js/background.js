(async () => {
  let fetching = async (url) => {
    let result = await fetch(url).then(r => r); // send request to the short link to get the actual link
    if (result.url.indexOf('https://d.aliexpress.com/') > -1) return Promise.resolve({
      short_link: result.url.split('https://d.aliexpress.com/')[1]
    });
    if (result.url.indexOf('https://d.aliexpress.com/') === -1) return Promise.resolve({
      short_link: url
    });
  }
  let msgReceived = (request, sender, sendResponse) => { // don't use async on the main listener funtion (cause: no async await inside)
    if (request.message.name === 'fetching') {
      fetching(request.message.url).then(sendResponse); // use then on async functions
      return true; // return true is mandatory if we use await on send response
    }
    if (request.message.name === "redirectTab") {
      chrome.tabs.update({
        url: request.message.url
      });
    };
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