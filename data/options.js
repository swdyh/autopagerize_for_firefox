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
onMessage = function(res) {
    // console.log('options.js:onMessage', JSON.stringify(res))
    if (res.name == 'settings') {
        var settings = res.data
        form_ep.value = settings['exclude_patterns'] || ''
        form_dm.checked = settings['display_message_bar'] === false ? false : 'checked'
    }
}
postMessage({ name: 'settings' })
