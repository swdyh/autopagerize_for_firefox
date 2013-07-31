var form = document.getElementById('settings_form')
var form_ep = document.getElementById('form_ep')
var form_dm = document.getElementById('form_dm')
var form_disable = document.getElementById('form_disable')
form.addEventListener('submit', function(event) {
    var d = {}
    d.exclude_patterns = form_ep.value
    d.display_message_bar = !!form_dm.checked
    d.disable = !!form_disable.checked
    self.postMessage({ name: 'settingsUpdate', data: d })
    event.preventDefault()
}, false)

var us = document.getElementById('update_siteinfo')
us.addEventListener('click', updateCacheInfo, false)

self.on('message', function(res) {
    // console.log('options.js:onMessage', JSON.stringify(res))
    if (res.name == 'settings') {
        var settings = res.data
        form_ep.value = settings.exclude_patterns || ''
        form_dm.checked = settings.display_message_bar === false ? false : 'checked'
        form_disable.checked = settings.disable ? 'checked' : null
    }
    else if (res.name == 'siteinfo_meta') {
        if (res.len) {
            document.getElementById('siteinfo_size').textContent = res.len
        }
        if (res.updated_at) {
            var d = new Date(res.updated_at)
            document.getElementById('siteinfo_updated_at').textContent = d
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
        self.postMessage({ name: 'settings' })
        updateCacheInfoInfo()
    }
})

function updateCacheInfoInfo() {
    self.postMessage({ name: 'siteinfo_meta' })
}

function updateCacheInfo() {
    us.disabled = true
    us.value = 'Updateing...'
    self.postMessage({ name: 'update_siteinfo' })
}
