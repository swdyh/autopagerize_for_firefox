var contextMenu = require('context-menu')
var pageMod = require('page-mod')
var self = require('self')
var xhr = require('xhr')
var localStorage = require('simple-storage').storage
var panels = require('panel')
var tabs = require('tabs')
var url = require('url')

var SITEINFO_IMPORT_URLS = [
    'http://wedata.net/databases/AutoPagerize/items.json',
]
var CACHE_EXPIRE = 24 * 60 * 60 * 1000
var siteinfo = {}
var launched = {}
// var settings = {}

xhr.XMLHttpRequest.prototype.__defineGetter__(
    'finalURL',
    function() {
        return this._req.channel.URI.spec
    })

exports.main = function (options, callbacks) {
    if (!localStorage['settings']) {
        var defaultSettings = {
            // extension_path: self.data.url(''),
            display_message_bar: true,
            exclude_patterns: localStorage['exclude_patterns'] || ''
        }
        localStorage['settings'] = JSON.stringify(defaultSettings)
    }

    loadLocalSiteinfoCallback(JSON.parse(self.data.load('items.json')))

    pageMod.add(new pageMod.PageMod({
        include: ['http://*', 'https://*'],
        contentScriptWhen: 'ready',
        contentScript: self.data.load('extension.js') + ';' +
            self.data.load('autopagerize.user.js'),
        onAttach: onAttach
    }))

    var menuItem = contextMenu.Item({
        label: "AutoPagerize on/off",
        context: function(contextObj) {
            return !!launched[contextObj.window.location.href]
        },
        onClick: function (contextObj, item) {
            var doc = contextObj.document
            var ev = doc.createEvent('Event')
            ev.initEvent('AutoPagerizeToggleRequest', true, false)
            doc.dispatchEvent(ev)
        }
    })

    var configPanel = panels.Panel({
        width: 700,
        height: 500,
        contentURL: self.data.url("options.html"),
        contentScriptURL: [self.data.url("options.js")],
        contentScriptWhen: "ready",
        onMessage: function(message) {
            // console.log(JSON.stringify(message))
            if (message.name == 'settings') {
                configPanel.postMessage({ name: message.name, data: JSON.parse(localStorage['settings']) })
            }
            else if (message.name == 'settingsUpdate') {
                localStorage['settings'] = JSON.stringify(message.data)
                configPanel.hide()

                for (var i in tabs) {
                    var doc = i.contentDocument
                    var ev = doc.createEvent('Event')
                    ev.initEvent('AutoPagerizeUpdateSettingsRequest', true, false)
                    doc.dispatchEvent(ev)
                }
            }
        }
    })
    panels.add(configPanel)

    var menuItemConfig = contextMenu.Item({
        label: "AutoPagerize config",
        context: function(contextObj) {
            return !!launched[contextObj.window.location.href]
        },
        onClick: function (contextObj, item) {
            configPanel.show()
        }
    })
    contextMenu.add(menuItem)
    contextMenu.add(menuItemConfig)
}

function onAttach(worker, mod) {
    worker.on('error', function(error) {
        console.error(error.message)
    })
    worker.on('message', function(message) {
        if (message.name == 'settings') {
            var res = JSON.parse(localStorage['settings'])
            worker.postMessage({ name: 'settings', data: res })
        }
        else if (message.name == 'siteinfo') {
            var res = SITEINFO_IMPORT_URLS.reduce(function(r, url) {
                return r.concat(siteinfo[url].info)
            }, []).filter(function(s) {
                return message.data.url.match(s.url)
            })
            worker.postMessage({ name: 'siteinfo', data: res })
        }
        else if (message.name == 'launched') {
            launched[message.data.url] = true
        }
        else if (message.name == 'get') {
            get(message.data.url, function(res) {
                var d = {
                    responseText : res.responseText,
                    finalURL : res.finalURL
                }
                worker.postMessage({ name: 'get', data: d })
            })
        }
        else {
            console.log('else')
        }
    })
}

function loadLocalSiteinfoCallback(data) {
    var url = 'http://wedata.net/databases/AutoPagerize/items.json'
    var cache = JSON.parse(localStorage['cacheInfo'] || '{}')
    if (!cache[url]) {
        siteinfo[url] = {
            url: url,
            expire: new Date().getTime() - 1,
            info: reduceWedataJSON(data)
        }
        cache[url] = siteinfo[url]
        localStorage['cacheInfo'] = JSON.stringify(cache)
    }
    else {
        siteinfo[url] = cache[url]
    }
    refreshSiteinfo()
}

function reduceWedataJSON(data) {
    var r_keys = ['url', 'nextLink', 'insertBefore', 'pageElement']
    var info = data.map(function(i) {
        return i.data
    }).filter(function(i) {
        return ('url' in i)
    })
    if (info.length == 0) {
        return []
    }
    else {
        info.sort(function(a, b) {
            return (b.url.length - a.url.length)
        })
        return info.map(function(i) {
            var item = {}
            r_keys.forEach(function(key) {
                if (i[key]) {
                    item[key] = i[key]
                }
            })
            return item
        })
    }
}

function refreshSiteinfo() {
    var cache = JSON.parse(localStorage['cacheInfo'] || '{}')
    SITEINFO_IMPORT_URLS.forEach(function(url) {
        if (!cache[url] || (cache[url].expire && new Date(cache[url].expire) < new Date())) {
            var callback = function(res) {
                if (res.status != 200) {
                    return
                }
                var info = reduceWedataJSON(JSON.parse(res.responseText))
                if (info.length == 0) {
                    return
                }
                siteinfo[url] = {
                    url: url,
                    expire: new Date().getTime() + CACHE_EXPIRE,
                    info: info
                }
                cache[url] = siteinfo[url]
                localStorage['cacheInfo'] = JSON.stringify(cache)
            }
            try {
                get(url, callback)
            }
            catch(e) {
            }
        }
    })
}

function get(url, callback, opt) {
    var req = new xhr.XMLHttpRequest()
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (isSameOrigin(url, req.finalURL)) {
                callback(req)
            }
            else {
                // redirected other origin url
                callback({ responseText: null, finalURL: req.finalURL })
            }
        }
    }
    req.withCredentials = true
    req.open('GET', url, true)
    req.send(null)
    return req
}

function isSameOrigin(url1, url2) {
    var a = new url.URL(url1)
    var b = new url.URL(url2)
    return (a.scheme && a.scheme && a.host == b.host &&
            a.port == b.port)
}
