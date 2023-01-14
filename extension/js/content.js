(async () => {
    let fun_content = {
        openDashboard: async function () {
            window.open(G_STR.dashboard_url, '_target');
        },
        sendToAPI: async function () {
            let r = await G_FUN.chrome_api.get([G_STR.session_storage, G_STR.user_auth]);
            if (!r.auth || !r.auth.valid) {
                G_FUN.chrome_api.remove(G_STR.session_storage); // remove the session storage
                return;
            };
            let body = {
                original_link: r.session_storage.url,
                short_link: r.session_storage.short_link,
                d_link: r.session_storage?.d_link ?? false,
                tracking_id: r.session_storage.tracker_ID,
                date: r.session_storage.date,
                product_name: r.session_storage.title
            }
            let result = await fetch(G_STR.server_url + 'sendLinkData', {
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: r.auth.token,
                    linkData: body
                })
            }).then(r => r.json().then(r => r)).catch(() => console.log('server error!'));
            G_FUN.chrome_api.remove(G_STR.session_storage); // remove the session storage
            return Promise.resolve(result);
        },
        removeSessionStorage: function () {
            G_FUN.chrome_api.remove(G_STR.session_storage);
        },
        redirectToOrignal: async function (url) {
            let obj = {
                message: {
                    name: 'redirectTab',
                    url: url
                }
            }
            chrome.runtime.sendMessage(obj);
        },
        appendNotification: async function (isSuccess, user = false) {
            let interval;
            let second = isSuccess ? 3 : user ? 3 : 100;
            let parentDiv = newEle('div');
            let text = newEle('h1');
            let warning = newEle('h2');
            let register = newEle('div');
            if (!user && !isSuccess) {
                parentDiv.classList.add('affilate-notification-fail');
                //text.innerText = domele().portel.error_container.innerText;
                text.innerText = G_STR.unsupoorted_link_msg;
                warning.innerHTML = G_STR.redirect_notuser_msg_text_html;
                warning.querySelector('.affilate_reg').innerHTML = G_STR.button_msg_text_html;
                warning.querySelector('.affilate_reg .affilate_reg_btn').addEventListener('click', this.openDashboard);
                //register.innerHTML = G_STR.button_msg_text_html;
            } else if (user && !isSuccess) {
                parentDiv.classList.add('affilate-notification-fail');
                text.innerText = domele().portel.error_container.innerText;
                warning.innerHTML = G_STR.dlink_msg_text_html;
            } else {
                parentDiv.classList.add('affilate-notification-success');
                text.innerText = G_STR.short_link_created_msg;
                warning.innerHTML = G_STR.redirect_msg_text_html;
            }
            warning.querySelector('span.count').innerText = second;
            parentDiv.appendChild(text);
            parentDiv.appendChild(warning);
            parentDiv.appendChild(register);
            document.body.appendChild(parentDiv);
            await new Promise(res => interval = sI(() => {
                second--;
                warning.querySelector('span.count').innerText = second;
                if (second == 0)(res(), cI(interval));
            }, 1000));
            return Promise.resolve();
        },
        copyClipboard: async function (txt) {
            navigator.clipboard.writeText(txt).then(() => console.log(G_STR.copy_clipboard_success), () => console.log(G_STR.copy_clipboard_fail));
        },
        saveTimeDate: async function (obj) {
            obj.session_storage.date = new Date().toISOString();
            G_FUN.chrome_api.set(obj);
        },
        dLinkMethod: async function (obj, user) {
            obj.session_storage.d_link_url = G_STR.d_link + obj.session_storage.url;
            obj.session_storage.d_link = true;
            G_FUN.chrome_api.set(obj); // update session storage; d_link
            await this.appendNotification(false, user);
            this.fillData(obj); // fill the data again with new d link user for logged in user
        },
        getActualLink: async function (url) {
            const response = await chrome.runtime.sendMessage({
                message: {
                    name: "fetching",
                    url: url
                }
            });
            return Promise.resolve(response);
        },
        shortDLinkVisit: async function (obj) {
            obj.session_storage.short_link = domele().portel.generate_result_box.innerText;
            let result = await this.getActualLink(obj.session_storage.short_link);
            obj.session_storage.short_link = result.short_link; // assign the new short link
            this.copyClipboard(obj.session_storage.short_link); // copy the short link in the clip board
            this.saveTimeDate(obj); // update the session storage; adding current time
            G_FUN.chrome_api.set(obj); // update the session storage; adding shortlink
            await this.appendNotification(true); // show notification to the screen
            await this.sendToAPI(); // send data to the api
            this.redirectToOrignal(obj.session_storage.url); // redirect to the product url
        },
        isLoggedIn: async function () {
            let user = await G_FUN.chrome_api.get(G_STR.user_auth); // get user authentication detail
            if (user.auth && user.auth.valid) return Promise.resolve(true);
            if (!user.auth || !user.auth.valid) return Promise.resolve(false);
        },
        fillData: function (obj) {
            if (obj.session_storage.d_link) domele().portel.target_url.value = obj.session_storage.d_link_url;
            if (!obj.session_storage.d_link) domele().portel.target_url.value = obj.session_storage.url;
            domele().portel.track_id.value = obj.session_storage.tracker_ID;
            domele().portel.generate_btn.click();
        },
        unsupportedURL: async function (obj) {
            let user = await this.isLoggedIn();
            if (user) this.dLinkMethod(obj, user); // user is logged in; run d link method
            if (!user) { // user is not logged in; run d link method
                this.saveTimeDate(obj); // update the session storage; adding current time
                G_FUN.chrome_api.set(obj); // update storage; short link
                await this.sendToAPI(); // send data to the api
                await this.appendNotification(false, user); // show notification to the screen
                this.redirectToOrignal(obj.session_storage.url); // redirect to the product url
            }
        },
        getShortLink: async function (obj) {
            obj.session_storage.short_link = domele().portel.generate_result_box.innerText;
            this.copyClipboard(obj.session_storage.short_link); // copy the short link in the clip board
            this.saveTimeDate(obj); // update the session storage; adding current time;
            G_FUN.chrome_api.set(obj); // update the session storage; adding shortlink
            await this.appendNotification(true); // show notification to the screen
            await this.sendToAPI(); // send data to the api
            this.redirectToOrignal(obj.session_storage.url); // redirect to the product url
        },
        conditionChecker: function (obj) {
            if (domele().portel.generate_result_box.children.length && !domele().portel.error_container) this.fillData(obj);
            if (domele().portel.error_container) this.unsupportedURL(obj);
            if (!domele().portel.generate_result_box.children.length && !domele().portel.error_container && !obj.session_storage.d_link) this.getShortLink(obj);
            if (!domele().portel.generate_result_box.children.length && !domele().portel.error_container && obj.session_storage.d_link) this.shortDLinkVisit(obj);
        },
        start: async function () {
            let obj = await G_FUN.chrome_api.get(G_STR.session_storage);
            if (!obj.session_storage || !obj.session_storage.automationStart) return;
            this.conditionChecker(obj);
        },
        init: async function () {
            if (hrefIndex(G_STR.portal_herfIndex_url) === -1) return;
            this.start();
        }
    }
    fun_content.init(); // init the content script
})();