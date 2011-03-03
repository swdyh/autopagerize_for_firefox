var form = document.getElementById('settings_form')
var form_ep = document.getElementById('form_ep')
var form_dm = document.getElementById('form_dm')
form.addEventListener('submit', function(event) {
    var d = {}
    d['exclude_patterns'] = form_ep.value
    d['display_message_bar'] = !!form_dm.checked
    postMessage({ name: 'settingsUpdate', data: d })
    event.preventDefault()
}, false)

var us = document.getElementById('update_siteinfo')
us.addEventListener('click', updateCacheInfo, false)

onMessage = function(res) {
    // console.log('options.js:onMessage', JSON.stringify(res))
    if (res.name == 'settings') {
        var settings = res.data
        form_ep.value = settings['exclude_patterns'] || ''
        form_dm.checked = settings['display_message_bar'] === false ? false : 'checked'
    }
    else if (res.name == 'siteinfo_meta') {
        if (res.len) {
            document.getElementById('siteinfo_size').innerHTML = res.len
        }
        if (res.updated_at) {
            var d = new Date(res.updated_at)
            document.getElementById('siteinfo_updated_at').innerHTML = d
        }
    }
    else if (res.name == 'update_siteinfo') {
        if (res.res == 'ok') {
            updateCacheInfoInfo()
            us.disabled = false
            us.value = 'update_siteinfo'
        }
    }
    else if (res.name == 'onshow') {
        postMessage({ name: 'settings' })
        updateCacheInfoInfo()
    }
}

function updateCacheInfoInfo() {
    postMessage({ name: 'siteinfo_meta' })
}

function updateCacheInfo() {
    us.disabled = true
    us.value = 'Updateing...'
    postMessage({ name: 'update_siteinfo' })
}
