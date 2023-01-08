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