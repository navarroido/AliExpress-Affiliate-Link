(async () => {
    let CURRENT_TAB = {
        currentWindow: true,
        active: true
    };
    // code start
    let appendTrackerIDs = async data => { // add list of tracker IDs
        data.forEach(d => {
            let opt = newEle('option');
            opt.innerText = d
            opt.value = d;
            Selector('select').appendChild(opt);
        });
        chrome.storage.local.get(['tracker_ID'], r => {
            if (r.tracker_ID == '') return;
            Selector('select').value = r.tracker_ID;
        });
    }
    let showDetail = async tab => {
        if (tab.url.indexOf('aliexpress.') == -1) return;
        Selector('textarea').value = tab.url;
    };
    let selectTrackerID = async () => {
        let val = Selector('select').value;
        chrome.storage.local.set({
            tracker_ID: val
        });
    };
    let openPortal = async () => {
        chrome.storage.local.get(['portalLink'], r => {
            chrome.tabs.update({
                url: r.portalLink
            }, tab => chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId == tab.id && info.status == "complete") {
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            }));
            window.close(); // close the popup window
        })
    }
    chrome.storage.local.get(['dashboard_data'], r => {
        if (r.dashboard_data.length) appendTrackerIDs(r.dashboard_data);
    });
    Selector('select').addEventListener('change', () => selectTrackerID());
    Selector('button').onclick = async () => {
        if (Selector('textarea').value == '') return;
        let [currentTab] = await chrome.tabs.query(CURRENT_TAB);
        chrome.storage.local.set({
            automationStart: true
        });
        chrome.tabs.sendMessage(currentTab.id, {
            message: {
                name: 'titleExtract'
            }
        }, () => {
            chrome.storage.local.get(['session_storage'], r => {
                if (r.session_storage instanceof Object && r.session_storage.auto) {
                    r.session_storage.url = Selector('textarea').value;
                    r.session_storage.tracker_ID = Selector('select').value;
                    chrome.storage.local.set(r, () => openPortal());
                } else {
                    chrome.storage.local.set({
                        session_storage: {
                            auto: true,
                            url: Selector('textarea').value,
                            tracker_ID: Selector('select').value
                        }
                    }, () => openPortal());
                }
            })
        });
    }
    let [tab] = await chrome.tabs.query(CURRENT_TAB);
    showDetail(tab); // show detail
})();