self.on('context', function (node) {
    return document.getElementById('autopagerize_message_bar');
})
self.on('click', function (node, data) {
    if (data == 'toggle') {
        // var ev = document.createEvent('Event');
        // ev.initEvent('AutoPagerizeToggleRequest', true, false)
        // document.dispatchEvent(ev)
        self.postMessage('toggle')
    }
    else if (data == 'config') {
        self.postMessage('show_config_panel')
    }
})
