let saveData = async val => {
    chrome.storage.local.get(['dashboard_data'], r => {
        let storeOBJ = {
            dashboard_data: []
        }
        if (r.dashboard_data && r.dashboard_data.length) storeOBJ.dashboard_data = [...r.dashboard_data];
        storeOBJ.dashboard_data.push(val);
        chrome.storage.local.set(storeOBJ);
    });
    deleteButton();
    return Promise.resolve();
}

let addToList = val => {
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
};

let loadData = async () => {
    chrome.storage.local.get(['dashboard_data'], r => {
        if (r instanceof Object && !Object.keys(r).length) return;
        if (r.dashboard_data instanceof Array && !r.dashboard_data.length) return;
        r.dashboard_data.forEach(n => addToList(n));
    });
    return Promise.resolve();
};

let updateData = async () => {
    let storeOBJ = {};
    let updated = [...SelectorAll('.tracker-list ul li:not(.disable) .delete')].map(d => d.parentElement.parentElement.getAttribute('data-value'));
    storeOBJ.dashboard_data = updated;
    chrome.storage.local.set(storeOBJ);
}

async function removeData() {
    this.parentElement.parentElement.remove();
    await updateData();
}

let deleteButton = async () => {
    let interval;
    await new Promise(res => interval = sI(() => SelectorAll('.tracker-list ul li:not(.disable) .delete').length ? (res(), cI(interval)) : null));
    eventListener(false, [...SelectorAll('.tracker-list ul li:not(.disable) .delete')], 'click', removeData);
    eventListener(true, [...SelectorAll('.tracker-list ul li:not(.disable) .delete')], 'click', removeData);
}


(async () => {
    await loadData();
    deleteButton();
    Selector('input').focus();
    Selector('button').onclick = () => saveData(addToList(Selector('input').value));
    Selector('input').onkeypress = e => e.which == 13 ? saveData(addToList(Selector('input').value)) : null;
})();