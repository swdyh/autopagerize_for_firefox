var url = require('sdk/url')
var {Cc, Ci} = require('chrome')

exports.getCookie = getCookie
exports.isSameOrigin = isSameOrigin

function getCookie(from, to) {
    if (!isSameOrigin(from, to)) {
        return ''
    }
    var toUrl = new url.URL(to)
    var needSecureCookie = toUrl.scheme == 'https'
    var result = []
    var cookieManager = Cc['@mozilla.org/cookiemanager;1'].getService(Ci.nsICookieManager2)
    var enumerator = cookieManager.getCookiesFromHost(toUrl.host)
    var cookie
    while (enumerator.hasMoreElements()) {
        cookie = enumerator.getNext().QueryInterface(Ci.nsICookie2)
        if (!cookie.isSecure || needSecureCookie) {
            result.push(cookie.name + '=' + cookie.value)
        }
    }
    return result.join('; ')
}

function isSameOrigin(url1, url2) {
    var a = new url.URL(url1)
    var b = new url.URL(url2)
    return (a.scheme == b.scheme && a.host == b.host &&
            a.port == b.port)
}
