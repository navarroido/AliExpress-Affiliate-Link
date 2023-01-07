const Selector = ele => document.querySelector(ele),
  SelectorAll = eleAll => document.querySelectorAll(eleAll),
  newEle = newele => document.createElement(newele),
  hrefIndex = href => window.location.href.indexOf(href),
  lsGet = item => localStorage.getItem(item),
  lsSet = (key, value) => localStorage.setItem(key, value),
  lsRem = item => localStorage.removeItem(item),
  sI = (fun, time) => setInterval(fun, time),
  sT = (fun, time) => setTimeout(fun, time),
  cI = intervaliable => clearInterval(intervaliable),
  cT = intervaliable => clearTimeout(intervaliable),
  docLis = (eve, fun) => document.addEventListener(eve, fun);

let getPageDetail = async () => {
  let tab = {
    currentWindow: true,
    active: true
  };
  let tabDetail = await new Promise(r => chrome.tabs.query(tab, (t) => r({
    pageDetail: t[0]
  })));
  chrome.storage.local.set(tabDetail);
}

let openPortal = async () => {
  let url = 'https://portals.aliexpress.com/tools/promoLinkGenerate.htm?tools_promoLinkGenerate';

  await new Promise(res => {
    chrome.tabs.update({
      url: url
    }, tab => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId == tab.id && info.status == "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          res();
        };
      });
    })
  });

  chrome.storage.local.set({
    automationStart: true
  })
}

let msgReceived = async (request, sender, sendResponse) => {
  if (request.message == "tab_data") {
    getPageDetail();
    sendResponse({
      pageDetail: true
    });
  }
  if (request.message == "open_portal_page") {
    openPortal();
    sendResponse({
      portalOpened: true
    });
  }
  if (request.message.name == "redirectTab") {
    chrome.tabs.update({
      url: request.message.url
    });
  }
}

chrome.runtime.onMessage.addListener(msgReceived); // receiving messages

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // Code to be executed on first install
    chrome.tabs.create({
      url: "html/dashboard.html"
    });

    chrome.storage.local.set({
      dashboard_data: []
    });

    chrome.storage.local.set({
      tracker_ID: 'default'
    })
  }
});