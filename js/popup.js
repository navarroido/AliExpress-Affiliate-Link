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

// code start

let appendTrackerIDs = async data => {
    data.forEach(d => {
        let opt = newEle('option');
        opt.innerText = d
        opt.value = d;
        Selector('select').appendChild(opt);
    });
    chrome.storage.local.get(['tracker_ID'], r => {
        if (r.tracker_ID == '') return;
        Selector('select').value = r.tracker_ID;
    })
}

let removeDetail = () => {
    chrome.storage.local.remove(['pageDetail']);
}

let showDetail = async start => {
    if (!start) return;
    chrome.storage.local.get(['pageDetail'], async t => {
        if (!Object.keys(t).length) {
            showDetail(start);
            return;
        }
        if (t.pageDetail.url.indexOf('.aliexpress.') == -1) {
            removeDetail();
            return;
        };
        Selector('textarea').value = t.pageDetail.url;
        removeDetail();
    });
};

let selectTrackerID = async () => {
    let val = Selector('select').value;
    chrome.storage.local.set({
        tracker_ID: val
    })
};

(async () => {
    chrome.runtime.sendMessage({
        message: "tab_data"
    }, r => showDetail(r));

    chrome.storage.local.get(['dashboard_data'], r => {
        if (r.dashboard_data.length) appendTrackerIDs(r.dashboard_data);
    });

    Selector('select').addEventListener('change', () => selectTrackerID());

    Selector('button').onclick = () => {
        if (Selector('textarea').value == '') return;

        chrome.storage.local.set({
            automation_data: {
                auto: true,
                url: Selector('textarea').value,
                tracker_ID: Selector('select').value
            }
        });

        chrome.runtime.sendMessage({
            message: "open_portal_page"
        }, r => window.close());
    }
})();