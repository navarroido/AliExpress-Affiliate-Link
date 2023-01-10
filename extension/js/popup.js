(async () => {
    let fun_popup = {
        selectLastTrackerIDs: async function () { // select the last selected tracker
            let obj = await G_FUN.chrome_api.get(G_STR.tracker_storage);
            if (obj.tracker_ID == '') return;
            domele().popup.tracker_id.value = obj.tracker_ID;
        },
        appendTrackerIDs: async function () {
            let obj = await G_FUN.chrome_api.get(G_STR.dashboard_storage);
            obj.dashboard_data.forEach(d => {
                let opt = newEle('option');
                opt.innerText = d;
                opt.value = d;
                domele().popup.tracker_id.appendChild(opt);
            });
        },
        openPortal: function () {
            let obj = {
                url: G_STR.portal_url
            }
            chrome.tabs.update(obj, tab => chrome.tabs.onUpdated.addListener((tabId, info) => {
                if (tabId == tab.id && info.status == "complete") chrome.tabs.onUpdated.removeListener(listener);
            }));
            window.close(); // close the popup window
        },
        saveDetails: async function () { // this refers to the current url textarea
            let [tab] = await chrome.tabs.query(G_OBJ.current_tab);
            let obj = {
                session_storage: {
                    automationStart: true,
                    url: domele().popup.current_url.value,
                    tracker_ID: domele().popup.tracker_id.value,
                    title: tab.title
                }
            }
            G_FUN.chrome_api.set(obj); // init the first session_storage
            fun_popup.openPortal(); // open portal link
        },
        tabDetails: async function () {
            let [tab] = await chrome.tabs.query(G_OBJ.current_tab);
            if (tab.url.indexOf('aliexpress.') == -1) return;
            domele().popup.current_url.value = tab.url == '' ? tab.pendingUrl : tab.url;
        },
        selectorTrackerID: function () {
            let obj = {
                tracker_ID: this.value
            };
            G_FUN.chrome_api.set(obj); // save the changed tracker id
        },
        listener: function () {
            domele().popup.tracker_id.addEventListener('change', this.selectorTrackerID);
            domele().popup.create_tracker_link.addEventListener('click', this.saveDetails);
        },
        init: function () {
            this.listener();
            this.tabDetails();
            this.appendTrackerIDs();
            this.selectLastTrackerIDs();
        }
    }
    fun_popup.init(); // init the popup js
})();