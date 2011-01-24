on('context', function (node) {
    return document.getElementById('autopagerize_message_bar');
})
on('click', function (node, data) {
    if (data == 'toggle') {
        var ev = document.createEvent('Event');
        ev.initEvent('AutoPagerizeToggleRequest', true, false)
        document.dispatchEvent(ev)
    }
    else if (data == 'config') {
        postMessage('show_config_panel')
    }
})
