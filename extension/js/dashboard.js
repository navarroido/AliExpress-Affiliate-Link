(async () => {
    var methods = {
        init: async function () {
            //** user **//
            if (Selector('header .user:not(.loggedIn)')) Selector('header .user:not(.loggedIn)').addEventListener('click', methods.dashboard.openLogRegForm);
            if (Selector('header .user.loggedIn')) Selector('header .user.loggedIn').addEventListener('click', methods.dashboard.userDropDown);
            Selector('.user-panel').addEventListener('click', methods.dashboard.exitFromUserPanel);
            SelectorAll('.user-panel .credential>div .visibility').forEach(ele => ele.addEventListener('click', methods.dashboard.passwordVisibility));
            Selector('.registration #password').addEventListener('input', methods.dashboard.checkPassword);
            Selector('.registration #cmfpassword').addEventListener('input', methods.dashboard.checkPassword);
            Selector('#formlogin').addEventListener('submit', methods.login);
            Selector('#formregistration').addEventListener('submit', methods.registration);
            //** user dropdown **//
            Selector('.user-dropdown li.settings').addEventListener('click', methods.dashboard.openSettingsPanel); // logout user
            Selector('.user-dropdown').addEventListener('blur', methods.dashboard.closeDropDown); // logout user
            Selector('.user-dropdown li.logout').addEventListener('click', methods.logout); // logout user
        },
        beforeLogin: async function () {
            //** Trackers Panel **//
            await methods.tracker.loadData();
            methods.tracker.deleteButton(); // add listener to the dynamic button
            Selector('.tracker-container input').focus(); // focus on tacker field after page load
            Selector('.tracker-container button').onclick = methods.dashboard.saveTrackers // adding tracker IDs after button click
            Selector('.tracker-container input').onkeypress = methods.dashboard.saveTrackers // adding tracker IDs after enter press
            //** dashboard **//
            SelectorAll('.user-panel ul li').forEach(li => li.addEventListener('click', methods.profile.changePanel)); // change panel
            SelectorAll('.options li').forEach(li => li.addEventListener('click', methods.dashboard.changePanel)); // change panel
            return Promise.resolve();
        },
        setDynamicValues: async function () {
            chrome.storage.local.get(['server'], r => {
                Selector('.credential #formlogin').action = r.server + 'login';
                Selector('.credential #formregistration').action = r.server + 'registration';
            });
        },
        stayLoggedIn: async function () {
            chrome.storage.local.get(['auth', 'server'], async r => {
                if (r.auth && r.auth.valid) {
                    let result = await fetch(r.server + 'validUser', {
                            method: 'post',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                token: r.auth.token
                            })
                        })
                        .then(r => r.json().then(r => r))
                        .catch(() => methods.dashboard.sendNotification('server error!', true));
                    if (!result) {
                        methods.logout();
                        methods.init(); // init all code
                        return;
                    };
                    chrome.storage.local.set({
                        auth: result.user
                    });
                    await methods.activeProfile(result.user.token);
                    methods.init(); // init all code
                    return;
                }
                Selector('.user-panel').classList.add('active'); // show user login panel if user is not loggedIn
            });
        },
        activeProfile: async function (token) {
            let user = JSON.parse(atob(token.split('.')[1]));
            let profile = Selector('header .user');
            profile.classList.add('loggedIn');
            profile.querySelector('.user-name span').innerText = user.email;
            return Promise.resolve();
        },
        getLinks: async function () {
            chrome.storage.local.get(['auth', 'server'], async r => {
                if (r.auth && r.auth.valid) {
                    let result = await fetch(r.server + 'getLinkData', {
                            method: 'post',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                token: r.auth.token
                            })
                        })
                        .then(r => r.json().then(r => r))
                        .catch(() => methods.dashboard.sendNotification('server error!', true));
                    if (!result) return;
                    if (result.msg_type === 'success') {
                        await methods.statistics.appendLinks.init(result);
                        SelectorAll('.session .detail .dropdown').forEach(d => d.addEventListener('click', methods.statistics.expandDropDown)); // add event listener to the detail button
                        SelectorAll('.session .detail .link .copy').forEach(d => d.addEventListener('click', methods.statistics.copyShortLink)); // add event listener to the detail button
                    }
                    return;
                }
                Selector('.user-panel').classList.add('active'); // show user login panel if user is not loggedIn
                methods.init(); // init all code
            })
        },
        dashboard: {
            changePanel: async function () {
                Selector('.options li.active').classList.remove('active');
                this.classList.add('active');
                Selector(`.panel div.active`).classList.remove('active');
                Selector(`.panel div.${this.getAttribute('data-value')}`).classList.add('active');
            },
            saveTrackers: async function (e) {
                if (e instanceof KeyboardEvent && e.which !== 13) return;
                let val = await methods.tracker.addToList(Selector('input').value);
                methods.tracker.saveData(val);
                Selector('.tracker-container input').focus();
            },
            passwordVisibility: async function () {
                let obj = {
                    type: {
                        text: 'password',
                        password: 'text'
                    },
                    visibile: {
                        visibility: 'visibility_off',
                        visibility_off: 'visibility'
                    }
                }
                this.parentElement.querySelector('input').type = obj.type[this.parentElement.querySelector('input').type];
                this.querySelector('span').innerText = obj.visibile[this.querySelector('span').innerText]
            },
            checkPassword: async function () {
                let parent = Selector('.registration');
                if (parent.querySelector('.msg')) parent.querySelector('.msg').remove();
                let msg = newEle('span');
                msg.classList.add('msg');
                (parent.querySelector('#cmfpassword').value == parent.querySelector('#password').value && this.value !== '') ?
                (msg.classList.add('success'), msg.innerText = 'password is matched!') :
                (msg.classList.add('error'), msg.innerText = 'password is not matched!');
                parent.querySelector('#cmfpassword').parentElement.parentElement.appendChild(msg);
            },
            openLogRegForm: async function () {
                Selector('.user-panel').classList.add('active');
                Selector('#email').focus();
            },
            exitFromUserPanel: async function (e) {
                if (e.target == this) this.classList.remove('active');
            },
            sendNotification: async function (msg, err) {
                let msgSpan = newEle('span');
                let text = newEle('span');
                let icon = newEle('span');
                msgSpan.classList.add('notification');
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
            },
            userDropDown: async function () {
                Selector('.user-dropdown').classList.add('active');
                Selector('.user-dropdown').focus();
            },
            closeDropDown: async function () {
                Selector('.user-dropdown').classList.remove('active');
            },
            openSettingsPanel: async function () {

            }
        },
        tracker: {
            saveData: async function (val) {
                if (!val) return;
                chrome.storage.local.get(['dashboard_data'], r => {
                    r.dashboard_data.push(val);
                    chrome.storage.local.set(r);
                });
                methods.tracker.deleteButton();
                return Promise.resolve();
            },
            loadData: async function () {
                await new Promise(res => {
                    chrome.storage.local.get(['dashboard_data'], r => {
                        if (r instanceof Object && !Object.keys(r).length) {
                            res();
                            return;
                        };
                        if (r.dashboard_data instanceof Array && !r.dashboard_data.length) {
                            res();
                            return;
                        };
                        r.dashboard_data.forEach(n => methods.tracker.addToList(n));
                        res();
                    });
                })
                return Promise.resolve();
            },
            updateData: async function () {
                let storeOBJ = {};
                storeOBJ.dashboard_data = [...SelectorAll('.tracker-list ul li:not(.disable) .delete')].map(d => d.parentElement.parentElement.getAttribute('data-value'));
                chrome.storage.local.set(storeOBJ);
                return Promise.resolve();
            },
            removeData: async function () {
                this.parentElement.parentElement.remove();
                await methods.tracker.updateData();
            },
            addToList: async function (val) {
                if (val == '') return;
                let li = newEle('li');
                let parent_span = newEle('span');
                let name_span = newEle('span');
                let delete_span = newEle('span');
                li.setAttribute('data-value', val);
                name_span.classList.add('name');
                name_span.innerText = val;
                delete_span.classList.add('delete');
                delete_span.innerHTML = '<span class="material-icons-round">delete</span>';
                parent_span.appendChild(name_span);
                parent_span.appendChild(delete_span);
                li.appendChild(parent_span);
                Selector('.tracker-list ul').appendChild(li);
                Selector('input').value = '';
                Selector('input').focus();
                return val;
            },
            deleteButton: async function () {
                eventListener(false, [...SelectorAll('.tracker-list ul li:not(.disable) .delete')], 'click', methods.tracker.removeData);
                if (SelectorAll('.tracker-list ul li:not(.disable) .delete').length === 0) return;
                eventListener(true, [...SelectorAll('.tracker-list ul li:not(.disable) .delete')], 'click', methods.tracker.removeData);
            }
        },
        statistics: {
            expandDropDown: async function () {
                if (this.classList.contains('active')) {
                    this.classList.toggle('active');
                    this.parentElement.parentElement.parentElement.classList.toggle('active');
                    return;
                }
                if (Selector('.session .detail .product .dropdown.active')) Selector('.session .detail .product .dropdown.active').classList.remove('active');
                if (Selector('.session .detail.active')) Selector('.session .detail.active').classList.remove('active');
                this.classList.toggle('active');
                this.parentElement.parentElement.parentElement.classList.toggle('active');
            },
            copyShortLink: async function () {
                navigator.clipboard.writeText(this.parentElement.querySelector('input').value)
                    .then(() => {
                        methods.dashboard.sendNotification('Link is copied to clipboard!', false);
                    }, () => {
                        methods.dashboard.sendNotification('Can\'t copy the link!', false);
                    });
            },
            appendLinks: {
                created_date: async function (list) {
                    let createdDate_div = newEle('div');
                    let createdDate_div_heading = newEle('div');
                    let createdDate_div_value = newEle('div');
                    createdDate_div_heading.classList.add('heading');
                    createdDate_div_value.classList.add('value');
                    createdDate_div_value.innerText = new Date(list.date).toLocaleString();
                    createdDate_div_heading.innerText = 'Created Date';
                    createdDate_div.classList.add('created_date');
                    createdDate_div.appendChild(createdDate_div_heading);
                    createdDate_div.appendChild(createdDate_div_value);
                    return Promise.resolve(createdDate_div);
                },
                tracker_ID: async function (list) {
                    let tracker_div = newEle('div');
                    let tracker_div_heading = newEle('div');
                    let tracker_div_value = newEle('div');
                    tracker_div_heading.classList.add('heading');
                    tracker_div_value.classList.add('value');
                    tracker_div_value.innerText = list.tracking_id;
                    tracker_div_heading.innerText = 'Tracker ID';
                    tracker_div.classList.add('tracker_ID');
                    tracker_div.appendChild(tracker_div_heading);
                    tracker_div.appendChild(tracker_div_value);
                    return Promise.resolve(tracker_div);
                },
                pro_link: async function (list) {
                    let pro_div = newEle('div');
                    let pro_div_heading = newEle('div');
                    let pro_div_value = newEle('div');
                    pro_div_heading.classList.add('heading');
                    pro_div_value.classList.add('value');
                    pro_div_value.innerText = Boolean(list.is_pro);
                    pro_div_heading.innerText = 'Pro Link (d.aliexpress)';
                    pro_div.classList.add('pro_link');
                    pro_div.appendChild(pro_div_heading);
                    pro_div.appendChild(pro_div_value);
                    return Promise.resolve(pro_div);
                },
                original_link: async function (list) {
                    let original_div = newEle('div');
                    let original_div_heading = newEle('div');
                    let original_div_value = newEle('div');
                    let original_div_valueChild_a = newEle('a');
                    original_div_heading.classList.add('heading');
                    original_div_value.classList.add('value');
                    original_div_valueChild_a.href = list.original_link;
                    original_div_valueChild_a.innerText = list.original_link;
                    original_div_valueChild_a.target = '_blank';
                    original_div_valueChild_a.setAttribute('tabindex', '-1')
                    original_div_heading.innerText = 'Original Link';
                    original_div.classList.add('original_link');
                    original_div_value.appendChild(original_div_valueChild_a);
                    original_div.appendChild(original_div_heading);
                    original_div.appendChild(original_div_value);
                    return Promise.resolve(original_div);
                },
                product: async function (list) {
                    let product_div = newEle('div');

                    let div_fir = newEle('div');
                    let div_sec = newEle('div');
                    let div_thir = newEle('div');

                    let div_fir_heading = newEle('div');
                    let div_fir_value = newEle('div');
                    div_fir_heading.classList.add('heading');
                    div_fir_value.classList.add('value');
                    div_fir_heading.innerText = 'Product';
                    div_fir_value.innerText = list.product_name;
                    div_fir_value.title = list.product_name;
                    div_fir.appendChild(div_fir_heading);
                    div_fir.appendChild(div_fir_value);

                    let div_sec_link = newEle('div');
                    let div_sec_linkChild_input = newEle('input');
                    let div_sec_linkChild_copy = newEle('div');
                    let div_sec_linkChild_copyChild_copyicon = newEle('span');
                    div_sec_link.classList.add('link');
                    div_sec_linkChild_copy.classList.add('copy');
                    div_sec_linkChild_copyChild_copyicon.classList.add('material-icons-round');
                    div_sec_linkChild_copyChild_copyicon.innerText = 'content_copy';
                    div_sec_linkChild_input.value = list.short_link;
                    div_sec_linkChild_input.type = 'text';
                    div_sec_linkChild_input.disabled = true;
                    div_sec_linkChild_copy.appendChild(div_sec_linkChild_copyChild_copyicon);
                    div_sec_link.appendChild(div_sec_linkChild_input);
                    div_sec_link.appendChild(div_sec_linkChild_copy);
                    div_sec.appendChild(div_sec_link);

                    let div_thir_dropdown = newEle('div');
                    let div_thir_dropdownChild_expandicon = newEle('span');
                    div_thir_dropdown.classList.add('dropdown');
                    div_thir_dropdownChild_expandicon.innerText = 'expand_more';
                    div_thir_dropdownChild_expandicon.classList.add('material-icons-round');
                    div_thir_dropdown.appendChild(div_thir_dropdownChild_expandicon);
                    div_thir.appendChild(div_thir_dropdown);

                    product_div.classList.add('product');
                    product_div.appendChild(div_fir);
                    product_div.appendChild(div_sec);
                    product_div.appendChild(div_thir);
                    return Promise.resolve(product_div);
                },
                detail: async function (list) {
                    let detail_div = newEle('div');
                    detail_div.classList.add('detail');
                    detail_div.appendChild(await this.product(list));
                    detail_div.appendChild(await this.original_link(list));
                    detail_div.appendChild(await this.pro_link(list));
                    detail_div.appendChild(await this.tracker_ID(list));
                    detail_div.appendChild(await this.created_date(list));
                    return Promise.resolve(detail_div);
                },
                session: async function (date, list) {
                    let curr_session = list.filter((l) => new Date(l.date).toLocaleDateString() === date);
                    let session_div = newEle('div');
                    let date_div = newEle('div');
                    session_div.classList.add('session');
                    date_div.classList.add('date');
                    date_div.innerText = new Date(curr_session[0].date).toDateString();
                    session_div.appendChild(date_div);
                    for (const c of curr_session) {
                        let detail = await this.detail(c);
                        session_div.appendChild(detail);
                    }
                    return Promise.resolve(session_div);
                },
                init: async function (d) {
                    let date = d.links.map(l => new Date(l.date).toLocaleDateString()).reverse();
                    date = [...new Set(date)];
                    for (const item of date) {
                        let sessions = await this.session(item, d.links);
                        Selector('.panel .statistics').appendChild(sessions);
                    }
                    Selector('.panel .noData').remove();
                    return Promise.resolve();
                }
            },
        },
        profile: {
            changePanel: async function () {
                Selector('.user-panel ul li.active').classList.remove('active');
                this.classList.add('active');
                Selector(`.user-panel .credential .active`).classList.remove('active');
                Selector(`.user-panel .credential .${this.getAttribute('data-value')}`).classList.add('active');
            }
        },
        login: async function (e) {
            e.preventDefault(); // prevent from submiting form

            let reg = {
                email: this.email.value,
                password: this.password.value
            }

            let result = await fetch(this.action, {
                    method: this.method,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reg)
                })
                .then(r => r.json().then(r => r))
                .catch(() => methods.dashboard.sendNotification('server error!', true));

            if (result.msg_type === 'fail') {
                methods.dashboard.sendNotification(result.err, true);
            }
            if (result.msg_type === 'success') { // position sensitive
                methods.dashboard.sendNotification(result.msg, false);
                this.querySelectorAll('input').forEach(i => i.value = '');
                this.parentElement.parentElement.parentElement.parentElement.classList.remove('active');
                Selector('header .user:not(.loggedIn)').removeEventListener('click', methods.dashboard.openLogRegForm);
                await methods.activeProfile(result.user.token); // make changes on the profile (don't change position)
                Selector('header .user.loggedIn').addEventListener('click', methods.dashboard.userDropDown);
                chrome.storage.local.set({
                    auth: result.user
                });
                methods.getLinks(); // show links
            }
        },
        registration: async function (e) {
            e.preventDefault(); // prevent from submiting form
            if (this.password.value !== this.cmfpassword.value) return;

            let reg = {
                email: this.email.value,
                password: this.password.value,
                is_pro: 0
            }

            let result = await fetch(this.action, {
                    method: this.method,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reg)
                })
                .then(r => r.json().then(r => r))
                .catch(() => methods.dashboard.sendNotification('server error!', true));

            if (result.msg_type === 'fail') {
                methods.dashboard.sendNotification(result.err, true);
            }
            if (result.msg_type === 'success') {
                methods.dashboard.sendNotification(result.msg, false);
                this.querySelectorAll('input').forEach(i => i.value = '');
                this.querySelector('.msg').remove();
                methods.profile.changePanel.bind(Selector('.user-panel ul li[data-value=login]'))();
            }
        },
        logout: async function () {
            chrome.storage.local.remove('auth', () => location.reload());
        }
    };
    await methods.beforeLogin(); // init first
    methods.setDynamicValues(); // set some values
    methods.stayLoggedIn(); // authenticate user
    methods.getLinks(); // show links
})();