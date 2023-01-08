(async () => {
    var methods = {
        init: async function () {
            chrome.storage.local.get(['session_storage'], async r => {
                if (hrefIndex('https://d.aliexpress.com') > -1) this.dLinkExtractor(r); // run when the d.link url visits
                if (hrefIndex('portals.aliexpress.com/tools/promoLinkGenerate') === -1) return;
                if (Selector('.generate-result-box').children.length && !Selector('.ui-feedback-error')) {
                    await methods.isLoggedIn();
                    methods.fillURL(r.session_storage);
                } else if (Selector('.ui-feedback-error')) {
                    let user = await methods.isLoggedIn();
                    if (!user) methods.unsupportedURL(r.session_storage);
                    if (user) methods.dLinkMethod(r.session_storage);
                } else {
                    if (r.session_storage.d_link) {
                        location.href = Selector('.generate-result-box').innerText;
                    } else {
                        r.session_storage.d_link = false;
                        r = await methods.copyClipboard(r);
                        r = await methods.saveTimeDate(r);
                        methods.saveDataAPI();
                        methods.urlGenerated(r.session_storage);
                    }
                }
            });
        },
        fillURL: async function (obj) {
            if (obj.d_link) {
                Selector('[name=targetUrl]').value = obj.dlinkUrl;
            } else {
                Selector('[name=targetUrl]').value = obj.url;
            }
            let values = [...Selector('[name=trackId]').querySelectorAll('option')].map(e => e.value);
            if (values.includes(obj.tracker_ID)) Selector('[name=trackId]').value = obj.tracker_ID;
            Selector('[name=eventSubmitDoGenerateUrl]').click();
        },
        unsupportedURL: async function (obj) {
            chrome.storage.local.remove(['session_storage']);
            chrome.storage.local.set({
                automationStart: false
            });
            await methods.appendNotification(false, Selector('.ui-feedback-error').innerText);
            methods.redirectToOrignal(obj.url);
        },
        dLinkExtractor: async function (r) {
            r.session_storage.short_link = location.href.split('https://d.aliexpress.com/')[1];
            r = await methods.copyClipboard(r);
            r = await methods.saveTimeDate(r);
            methods.saveDataAPI();
            methods.urlGenerated(r.session_storage);
        },
        dLinkMethod: async function () {
            await methods.appendNotification(false, Selector('.ui-feedback-error').innerText, true);
            chrome.storage.local.get(['session_storage'], async r => {
                r.session_storage.dlinkUrl = 'https://d.aliexpress.com/' + r.session_storage.url;
                r.session_storage.d_link = true;
                chrome.storage.local.set(r);
            });
            methods.redirectToOrignal('https://portals.aliexpress.com/tools/promoLinkGenerate.htm?tools_promoLinkGenerate');
        },
        isLoggedIn: async function () {
            return new Promise(res => {
                chrome.storage.local.get('auth', r => {
                    if (r.auth && r.auth.valid) res(true);
                    res(false);
                });
            })
        },
        copyClipboard: async function (r) {
            let txt = r.session_storage.short_link || Selector('.generate-result-box').innerText;
            navigator.clipboard.writeText(txt).then(() => {
                console.log('clipboard write successfully');
            }, () => console.log('clipboard failed to write'));
            r.session_storage.short_link = txt;
            chrome.storage.local.set(r);
            return Promise.resolve(r);
        },
        appendNotification: async function (success, msg = '', unsupportedURL = false) {
            let interval;
            let second = success ? 3 : unsupportedURL ? 3 : 10;
            let parentDiv = newEle('div');
            let text = newEle('h1');
            let warning = newEle('h2');
            if (success && !unsupportedURL) {
                parentDiv.classList.add('affilate-notification-success');
                text.innerText = 'Affilated Link is copied in your clipboard!';
            } else {
                parentDiv.classList.add('affilate-notification-fail');
                text.innerText = msg;
            }
            warning.innerHTML = `The tab will be redirect in <span class="count">${second}</span> seconds`;
            if (!success && unsupportedURL) {
                parentDiv.classList.add('affilate-notification-fail');
                text.innerText = msg;
                warning.innerHTML = `But we apply a trick for bypass this error. Just wait for <span class="count">${second}</span> second.`;
            }
            parentDiv.appendChild(text);
            parentDiv.appendChild(warning);
            document.body.appendChild(parentDiv);
            await new Promise(res => interval = sI(() => {
                second--;
                warning.querySelector('.count').innerText = second;
                if (second == 0)(res(), cI(interval));
            }, 1000));
            return Promise.resolve();
        },
        saveTimeDate: async function (r) {
            r.session_storage.date = new Date().toISOString();
            await new Promise(res => chrome.storage.local.set(r, () => res()));
            return Promise.resolve(r);
        },
        saveDataAPI: async function () {
            chrome.storage.local.get(['session_storage', 'server', 'auth'], async r => {
                let body = {
                    original_link: r.session_storage.url,
                    short_link: r.session_storage.short_link,
                    d_link: r.session_storage.d_link,
                    tracking_id: r.session_storage.tracker_ID,
                    date: r.session_storage.date,
                    product_name: r.session_storage.title
                }
                let result = await fetch(r.server + 'sendLinkData', {
                        method: 'post',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            token: r.auth.token,
                            linkData: body
                        })
                    })
                    .then(r => r.json().then(r => r))
                    .catch(() => console.log('server error!'));
                chrome.storage.local.remove(['session_storage']);
            });
        },
        urlGenerated: async function (obj) {
            await methods.appendNotification(true);
            chrome.storage.local.set({
                automationStart: false
            });
            methods.redirectToOrignal(obj.url);
        },
        redirectToOrignal: async function (url) {
            chrome.runtime.sendMessage({
                message: {
                    name: 'redirectTab',
                    url: url
                }
            });
        },
        msgReceived: function (request, sender, sendResponse) {
            if (request.message.name !== "titleExtract") return;
            if (Selector('.product-title .product-title-text') || Selector('h1')) {
                let title = Selector('.product-title .product-title-text') || Selector('h1');
                chrome.storage.local.set({
                    session_storage: {
                        auto: true,
                        title: title.innerText
                    }
                }, sendResponse('store Successful!'));
            } else {
                sendResponse('store Successful title is null!');
            }
        },
        sendNotification: async function (msg, err) {
            let msgSpan = newEle('span');
            let text = newEle('span');
            let icon = newEle('span');
            msgSpan.classList.add('affilate-server-notification');
            (err) ?
            (icon.classList.add('icon-fail')) :
            (icon.classList.add('icon-success'));
            icon.innerHTML = '<span class="material-icons-round">error</span>&nbsp;';
            text.innerText = msg;
            msgSpan.classList.add('warningMsg');
            msgSpan.appendChild(icon);
            msgSpan.appendChild(text);
            document.body.appendChild(msgSpan);
            sT(() => msgSpan.remove(), 6000);
        }
    };
    chrome.storage.local.get(['automationStart'], r => {
        if (!r.automationStart) return;
        methods.init();
    });
    chrome.runtime.onMessage.addListener(methods.msgReceived); // receiving messages
})();