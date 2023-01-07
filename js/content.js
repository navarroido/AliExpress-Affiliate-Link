let appendNotification = async (success, msg = '') => {
    let interval;
    let second = 3;
    let parentDiv = newEle('div');
    let text = newEle('h1');
    let warning = newEle('h2');
    if (success) {
        parentDiv.classList.add('affilate-notification-success');
        text.innerText = 'Affilated Link is copied in your clipboard!';
    } else {
        parentDiv.classList.add('affilate-notification-fail');
        text.innerText = msg;
    }
    parentDiv.appendChild(text);
    warning.innerText = 'The tab will be redirect in 3 seconds';
    parentDiv.appendChild(warning);
    document.body.appendChild(parentDiv);
    await new Promise(res => interval = sI(() => {
        second--;
        warning.innerText = 'The tab will be redirect in ' + second + ' seconds';
        if (second == 0)(res(), cI(interval));
    }, 1000));
    return Promise.resolve();
}

let filling = async obj => {
    if ([...Selector('.generate-result-box').children].length && !Selector('.ui-feedback-error')) {
        Selector('[name=targetUrl]').value = obj.url;
        let values = [...Selector('[name=trackId]').querySelectorAll('option')].map(e => e.value)
        if (values.includes(obj.tracker_ID)) {
            Selector('[name=trackId]').value = obj.tracker_ID;
        }
        Selector('[name=eventSubmitDoGenerateUrl]').click();
        return Promise.resolve();
    } else if (Selector('.ui-feedback-error')) {
        chrome.storage.local.remove(['automation_data']);
        await appendNotification(false, Selector('.ui-feedback-error').innerText);
        chrome.runtime.sendMessage({
            message: {
                name: 'redirectTab',
                url: obj.url
            }
        });
        return Promise.resolve();
    } else {
        navigator.clipboard.writeText(Selector('.generate-result-box').innerText).then(() => {
            console.log('clipboard write successfully');
        }, () => {
            console.log('clipboard failed to write');
        });
        chrome.storage.local.set({
            tracking_URL: Selector('.generate-result-box').innerText
        });
        chrome.storage.local.set({
            automationStart: false
        });
        chrome.storage.local.remove(['automation_data']);
        await appendNotification(true);
        chrome.runtime.sendMessage({
            message: {
                name: 'redirectTab',
                url: obj.url
            }
        });
        return Promise.resolve();
    }
}

let init = async () => {
    let interval;
    let obj = await new Promise(res => interval = sI(() => chrome.storage.local.get(['automation_data'], r => {
        if (!r.automation_data.auto) return;
        res({
            url: r.automation_data.url,
            tracker_ID: r.automation_data.tracker_ID
        });
        cI(interval);
    })));

    await filling(obj);
}

(async () => {
    let interval;
    await new Promise(res => interval = sI(() => chrome.storage.local.get(['automationStart'], r => {
        if (!r.automationStart) return;
        res();
        cI(interval);
    })));

    init();
})();