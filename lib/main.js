var contextMenu = require('context-menu')
var pageMod = require('page-mod')
var self = require('self')
var xhr = require('xhr')
var simpleStorage = require('sdk/simple-storage').storage
var panels = require('panel')
var tabs = require('tabs')
var url = require('url')
var prefs = require('simple-prefs')
var cookieutil = require('./cookieutil')

var SITEINFO_IMPORT_URLS = [
    'http://wedata.net/databases/AutoPagerize/items_all.json',
]
var CACHE_EXPIRE = 24 * 60 * 60 * 1000
var siteinfo = {}
var launched = {}
// var settings = {}
var excludes = [
    'https://mail.google.com/*',
    'http://b.hatena.ne.jp/*',
    'http://www.facebook.com/plugins/like.php*',
    'http://api.tweetmeme.com/button.js*'
]
var loading_html = ''
var error_html = ''

exports.main = function (options, callbacks) {
    if (simpleStorage.settings) {
        // remove obsolete settings.
        var mysettings = JSON.parse(simpleStorage.settings)
        if (mysettings.loading_html || mysettings.error_html) {
            delete mysettings.loading_html
            delete mysettings.error_html
            simpleStorage.settings = JSON.stringify(mysettings)
        }
    }
    else {
        var defaultSettings = {
            // iframe can not load "self.data.url('')" on Firefox.
            // extension_path: self.data.url(''),
            display_message_bar: true,
            exclude_patterns: simpleStorage.exclude_patterns || ''
        }
        simpleStorage.settings = JSON.stringify(defaultSettings)
    }
    loading_html = self.data.load('loading.html.data')
    error_html = self.data.load('error.html.data')

    loadLocalSiteinfoCallback(JSON.parse(self.data.load('items.json')))

    pageMod.PageMod({
        include: ['http://*', 'https://*'],
        contentScriptWhen: 'ready',
        contentScriptFile: [
            self.data.url('extension.js'),
            self.data.url('autopagerize.user.js')
        ],
        onAttach: onAttach
    })

    contextMenu.Menu({
        label: "AutoPagerize",
        context: contextMenu.PageContext(),
        contentScriptFile: self.data.url('context_menu.js'),
        items: [
            contextMenu.Item({ label: "on/off", data: "toggle" }),
            contextMenu.Item({ label: "config", data: "config" })
        ],
        onMessage: function (message) {
            if (message == 'show_config_panel') {
                configPanel.show()
            }
            else if (message == 'toggle') {
                var settings = JSON.parse(simpleStorage.settings)
                postEvent(settings.disable ? 'AutoPagerizeEnableRequest' : 'AutoPagerizeDisableRequest')
                settings.disable = !settings.disable
                simpleStorage.settings = JSON.stringify(settings)
            }
        }
    })

    var configPanel = panels.Panel({
        width: 700,
        height: 500,
        contentURL: self.data.url("options.html"),
        contentScriptFile: self.data.url("options.js"),
        contentScriptWhen: "ready",
        onShow: function() {
            configPanel.postMessage({ name: 'onshow' })
        },
        onMessage: function(message) {
            if (message.name == 'settings') {
                configPanel.postMessage({ name: message.name, data: JSON.parse(simpleStorage.settings) })
            }
            else if (message.name == 'settingsUpdate') {
                simpleStorage.settings = JSON.stringify(message.data)
                configPanel.hide()
                postEvent('AutoPagerizeUpdateSettingsRequest')
                postEvent(message.data.disable ? 'AutoPagerizeDisableRequest' : 'AutoPagerizeEnableRequest')
            }
            else if (message.name == 'siteinfo_meta') {
                var u = SITEINFO_IMPORT_URLS[0]
                var len = siteinfo[u].info.length
                var updated_at = siteinfo[u].expire - CACHE_EXPIRE
                configPanel.postMessage({ name: message.name, len: len, updated_at: updated_at })
            }
            else if (message.name == 'update_siteinfo') {
                refreshSiteinfo({ force: true, callback: function() {
                    configPanel.postMessage({ name: message.name, res: 'ok' })
                }})
            }
        }
    })
    prefs.on('openPref', configPanel.show.bind(configPanel))
}

function onAttach(worker) {
    // skip about scheme page like "about:addons".
    if (/^about:/.test(worker.tab.url)) {
        return
    }

    worker.on('error', function(error) {
        console.error(error.message)
    })
    worker.on('message', function(message) {
        if (message.name == 'settings') {
            var res = JSON.parse(simpleStorage.settings)
            res.exclude_patterns += ' ' + excludes.join(' ')
            res.loading_html = loading_html
            res.error_html = error_html
            worker.postMessage({ name: 'settings', data: res })
        }
        else if (message.name == 'siteinfo') {
            var res_ = SITEINFO_IMPORT_URLS.reduce(function(r, url) {
                return r.concat(siteinfo[url].info)
            }, []).filter(function(s) {
                return message.data.url.match(s.url)
            })
            worker.postMessage({ name: 'siteinfo', data: res_ })
        }
        else if (message.name == 'launched') {
            launched[message.data.url] = true
        }
        else if (message.name == 'get') {
            var cookie = cookieutil.getCookie(message.data.fromURL, message.data.url)
            get(message.data.url, function(res) {
                var issame = cookieutil.isSameOrigin(
                    message.data.fromURL, res.responseURL)
                var d = {
                    responseText : issame ? res.responseText : null,
                    responseURL : res.responseURL
                }
                worker.postMessage({ name: 'get', data: d })
            }, { charset: message.data.charset, cookie: cookie })
        }
        else {
            console.log('else')
        }
    })
}

function loadLocalSiteinfoCallback(data) {
    var url = 'http://wedata.net/databases/AutoPagerize/items_all.json'
    var url_old = 'http://wedata.net/databases/AutoPagerize/items.json'
    var cache = JSON.parse(simpleStorage.cacheInfo || '{}')
    if (!cache[url]) {
        siteinfo[url] = {
            url: url,
            expire: new Date().getTime() - 1,
            info: reduceWedataJSON(data)
        }
        cache[url] = siteinfo[url]
        simpleStorage.cacheInfo = JSON.stringify(cache)
    }
    else {
        siteinfo[url] = cache[url]
    }

    // remove old url cache
    if (cache[url_old]) {
        delete cache[url_old]
        simpleStorage.cacheInfo = JSON.stringify(cache)
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
    if (info.length === 0) {
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

function refreshSiteinfo(opt) {
    opt = opt || {}
    var cache = JSON.parse(simpleStorage.cacheInfo || '{}')
    SITEINFO_IMPORT_URLS.forEach(function(url) {
        if (opt.force || !cache[url] || (cache[url].expire && new Date(cache[url].expire) < new Date())) {
            var callback = function(res) {
                if (res.status != 200) {
                    return
                }
                var info = reduceWedataJSON(JSON.parse(res.responseText))
                if (info.length === 0) {
                    return
                }
                siteinfo[url] = {
                    url: url,
                    expire: new Date().getTime() + CACHE_EXPIRE,
                    info: info
                }
                cache[url] = siteinfo[url]
                simpleStorage.cacheInfo = JSON.stringify(cache)
                if (opt.callback) {
                    opt.callback()
                }
            }
            try {
                get(url, callback)
            }
            catch(e) {
                console.log(e)
            }
        }
    })
}

function get(url, callback, opt) {
    opt = opt || {}
    var req = new xhr.XMLHttpRequest()
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            callback(req)
        }
    }
    req.open('GET', url, true)
    if (opt.charset) {
        req.overrideMimeType('text/html; charset=' + opt.charset)
    }
    if (opt.cookie) {
        req.setRequestHeader('Cookie', opt.cookie)
    }
    req.send(null)
    return req
}

function postEvent(name) {
    var cs = "var ev = document.createEvent('Event');" +
        "ev.initEvent('" + name + "', true, false);" +
        "document.dispatchEvent(ev);"
    attachAll(cs)
}

function attachAll(contentScript, urlpattern) {
    for (var i in tabs) {
        if (!urlpattern || urlpattern.match(tabs[i].url)) {
            tabs[i].attach({ contentScript: contentScript })
        }
    }
}
