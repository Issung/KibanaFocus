# KibanaFocus
Browser userscript to help make Kibana easier to use.
* "Focus in" on specific fields, at the moment `traceidentifier` and `hangfire_job_id`
  * Focus links are displayed as anchor tags so they can be clicked to use the current window, dragged, copied, or middle clicked to focus-in within a new tab.
  * Your current index, timeframe and displayed columns are carried across to your new focus window.
* Remember your favourite columns configuration, restores automatically when you open Kibana.
* Row coloring based on log levels, find the key logs faster.
* A random message of the day to bring a smile to your face!

![Screenshot showing the button within Kibana](https://i.imgur.com/uoL1r6a.png)

# Installation
You need a [Userscript](https://en.wikipedia.org/wiki/Userscript) extension installed. Recommended:
* Chrome/Edge: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
* Firefox: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
* Safari: [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887)

Then click this link to install/update the KibanaFocus script: https://raw.githubusercontent.com/Issung/KibanaFocus/main/kibanafocus.user.js.