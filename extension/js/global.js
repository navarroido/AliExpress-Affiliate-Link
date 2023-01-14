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

// event listener
let eventListener = (bool, targetElement, event, eventHandler) => targetElement.length ? bool ? targetElement.forEach(ele => ele.addEventListener(event, eventHandler)) : targetElement.forEach(ele => ele.removeEventListener(event, eventHandler)) : undefined;

//global strings
const G_STR = {
    portal_herfIndex_url: 'portals.aliexpress.com/tools/promoLinkGenerate',
    portal_url: 'https://portals.aliexpress.com/tools/promoLinkGenerate.htm?tools_promoLinkGenerate',
    server_url: 'https://phpstack-743429-2933059.cloudwaysapps.com/',
    d_link: 'https://d.aliexpress.com/',
    dashboard_storage: 'dashboard_data',
    tracker_storage: 'tracker_ID',
    session_storage: 'session_storage',
    user_auth: 'auth',
    dashboard_url: 'chrome-extension://' + chrome.runtime.id + '/html/dashboard.html',
    copy_clipboard_success: 'clipboard write successfully',
    copy_clipboard_fail: 'clipboard write successfully',
    short_link_created_msg: 'Affilated Link is copied in your clipboard!',
    unsupoorted_link_msg: 'Oooops :( this is not an affiliate link',
    redirect_msg_text_html: 'The tab will be redirect in <span class="count"></span> seconds',
    redirect_notuser_msg_text_html: '<center>We have a way to solve this and let you earn from non affiliate link. <BR/> <div class="affilate_reg"></div> <BR/>The tab will be redirect in <span class="count"></span> seconds</center>',
    button_msg_text_html: '<div class="buttonSection success"><button class="affilate_reg_btn">Register Here</button></div>',
    dlink_msg_text_html: 'But we apply a trick for bypass this error. Just wait for <span class="count"></span> second',
}

// global funtion
const G_FUN = {
    chrome_api: {
        get: function (key) {
            return new Promise(res => chrome.storage.local.get(key, r => res(r)));
        },
        set: function (obj) {
            chrome.storage.local.set(obj);
        },
        remove: function (key) {
            chrome.storage.local.remove(key);
        }
    }
}

// global objects
const G_OBJ = {
    current_tab: {
        currentWindow: true,
        active: true
    }
}
// dom element
const domele = () => {
    return {
        dashboard: {},
        popup: {
            tracker_id: Selector('#tracker_ids'),
            current_url: Selector('#current_url'),
            create_tracker_link: Selector('.buttonSection button')
        },
        portel: {
            target_url: Selector('input[name="targetUrl"]'),
            track_id: Selector('select#trackId[name="trackId"]'),
            generate_result_box: Selector('div.generate-result-box'),
            generate_btn: Selector('input[name="eventSubmitDoGenerateUrl"]'),
            error_container: Selector('.ui-feedback-error')
        },
        aliexpress: {}
    }
}