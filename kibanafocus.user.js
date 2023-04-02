// ==UserScript==
// @name         Kibana Focus
// @version      0.2.2
// @description  Extend Kibana UI to make it easier to navigate and use.
// @author       JoelG AKA Issung
// @match        https://search-elkelasticsearchdomain-bqedehxv6l7akoeyshisnm72g4.us-west-2.es.amazonaws.com/_plugin/kibana/app/*
// @match        https://search-ekelasticsearchdomain-5jvrnkc5zt3m5nevaxazbnnmp4.eu-central-1.es.amazonaws.com/_plugin/kibana/app/*
// @icon         https://images.contentstack.io/v3/assets/bltefdd0b53724fa2ce/blt601c406b0b5af740/620577381692951393fdf8d6/elastic-logo-cluster.svg
// @grant        GM.setValue
// @grant        GM.getValue
// @require      https://cdn.jsdelivr.net/npm/rison@0.1.1/js/rison.js
// ==/UserScript==

(function() {
    'use strict';
    const FAVCOLS_KEY = 'KIBANAFOCUS_FAVCOLS';

    console.log('%c KibanaFocus userscript running! Written by JoelG/Issung', 'font-size: 30px; font-weight: bold');

    function getUrlParts() {
        var hash = window.location.hash;
        var questionMarkIndex = hash.indexOf('?'); // TODO: Trim # and / up until the question mark instead.
        var queryParamsString = hash.substr(questionMarkIndex);
        const params = new Proxy(new URLSearchParams(queryParamsString), {
            get: (searchParams, prop) => searchParams.get(prop),
        });

        var g = rison.decode(params._g);
        var a = rison.decode(params._a);

        return [g, a];
    }

    function saveFavouriteColumns() {
        let [g, a] = getUrlParts();
        var columnsJoined = a.columns.join(',');
        GM.setValue(FAVCOLS_KEY, columnsJoined);
        console.log(`${FAVCOLS_KEY} set to ${columnsJoined}`);
        var columnsMessageElement = document.querySelector('#favourite-columns-message');
        if (columnsMessageElement != null) {
            columnsMessageElement.innerHTML = `Favourites saved as [${columnsJoined}]`;
        }
    }

    // Set custom columns if none set.
    async function restoreFavouriteColumns() {
        let [g, a] = getUrlParts();
        let defaults = `@service,level,message`;
        var favColumns = (await GM.getValue(FAVCOLS_KEY, defaults)).split(',');
        console.log(`${FAVCOLS_KEY} loaded ${favColumns} (defaults are ${defaults})`);
        a.columns = favColumns;
        var gEncoded = rison.encode(g);
        var aEncoded = rison.encode(a);
        var url = `https://${window.location.host}/_plugin/kibana/app/discover#/?_g=${gEncoded}&_a=${aEncoded}`;
        window.location = url;
        var columnsMessageElement = document.querySelector('#favourite-columns-message');
        if (columnsMessageElement != null) {
            columnsMessageElement.innerHTML = `Columns restored to favourites [${favColumns}]`;
        }
    }

    function addColumnButtons() {
        // First check if already added
        if (document.querySelector('div.modification#favourite-columns') != null) {
            return;
        }

        // The elements we insert the column buttons inbetween load after page load
        // So we check every 100ms for the elements existence, and when they appear we insert, simple!
        var timeChartElement = document.querySelector('section.dscTimechart');
        if (timeChartElement == null) {
            setTimeout(addColumnButtons, 100);
        }
        else {
            let [g, a] = getUrlParts();
            var motd = motds[Math.floor(Math.random()*motds.length)];
            timeChartElement.insertAdjacentHTML('afterend', `
                <div class="modification" id="favourite-columns">
                    <button action="save" alt="Set your favourite columns to the current setup">Save favourite columns</button>
                    <button action="restore" alt="Load your favourite columns and use them in the UI">Restore favourite columns</button>
                    <p id="favourite-columns-message">Columns automatically restored to [${a.columns}], ${motd}</p>
                    <a style="float: right;" href="https://github.com/Issung/KibanaFocus">
                        <img class="issung" src="https://i.imgur.com/Zfb2K30.png"/>
                    </a>
                    <span class="tooltip" style="float: right;">
                        <a href="https://github.com/Issung/KibanaFocus">Kibana focus plugin by JoelG</a>
                    </span>
                </div>
            `);
            // We can't put onclick events on the buttons because of CSP, so this is the solution..
            document.querySelectorAll('div#favourite-columns button').forEach(btn => {
                btn.addEventListener('click', event => {
                    if (event.target.attributes.action.value == 'save') {
                        saveFavouriteColumns();
                    }
                    else if (event.target.attributes.action.value == 'restore') {
                        restoreFavouriteColumns();
                    }
                });
            });
        }
    }

    // Custom styling
    document.querySelector('head').insertAdjacentHTML('beforeend', `
        <style>
            .modification#favourite-columns {
                display: block;
                padding: 5px;
            }
            .modification#favourite-columns #favourite-columns-message {
                display: inline;
                font-family: 'Roboto Mono';
                font-size: 11px;
            }
            .modification#favourite-columns button {
                text-decoration: underline;
                color: black;
                margin-right: 10px;
                font-size: 14px;
            }
            div.modification {
                display: inline;
            }
            div.modification a:first-child:hover {
                text-decoration: underline;
            }
            .modification img.issung {
                height:16px;
                width:16px;
                position: relative;
            }
            .modification a + span.tooltip {
                display: none;
            }
            .modification a:hover + span.tooltip,
            .modification span.tooltip:hover {
                display: inline;
            }
            .modification span.tooltip {
                background-color: black;
                color: white;
                position: relative;
                left: 0px;
            }
            .modification span.tooltip a {
                color: white;
            }
        </style>
    `);

    // Setup column favourites
    /*document.querySelector('section.dscTimechart').after(`
        <div class="modification" id="favourite-columns">
            <button>Save favourite columns</button>
            <button>Restore favourite columns</button>
        </div>
    `);*/

    addColumnButtons();

    // On page load, if no columns are set then set them now.
    if (window.location.hash.indexOf('columns:!(_source)') != -1) {
        restoreFavouriteColumns();
    }

    // Add listener for if the discovery page is opened, then restore favourite columns.
    window.addEventListener("hashchange", (event) => {
        if (event.oldURL == '' && event.oldURL == '') {
            return;
        }
        // Did we navigate from elsewhere to the discover page?
        if (event.oldURL.endsWith('#/') && event.newURL.indexOf('#/?_g=(') != -1) {
            console.log(`Doing some setup again because hashchanged to what we think is the discover page. oldURL: ${event.oldURL}, newURL: ${event.newURL}`);
            addColumnButtons();
            if (event.newURL.indexOf('columns:!(_source)') != -1) {
                restoreFavouriteColumns();
            }
        }
    });

    // Setup on log-expand traceid focus button generation
    document.addEventListener("click", function(e) {
        //console.log(`click event on ${e.target} ${e.target.outerHTML}`);

        var isExpandButton = e.target.attributes?.['aria-label']?.value == 'Toggle row details' ?? false;
        var isRightArrowSvg = e.target.querySelector('path')?.attributes?.d?.value.startsWith('M5.157') ?? false;
        var isRightArrowSvgPath = e.target.attributes?.d?.value.startsWith('M5.157') ?? false;
        var isDownArrowSvg = e.target.querySelector('path')?.attributes?.d?.value.startsWith('M13.069') ?? false;
        var isEmptySpace = e.target.attributes?.['data-test-subj']?.value == 'docTableExpandToggleColumn' ?? false;
        var isArrowIcon = e.target.tagName.toLowerCase() == 'icon' && (e.target.attributes.type?.value?.startsWith(`'arrow`) ?? false);
        var shouldExpand = isExpandButton || isRightArrowSvg || isRightArrowSvgPath || isDownArrowSvg || isEmptySpace || isArrowIcon;

        if (shouldExpand) {
            console.log("something expanded or collapsed");
            var traceidRows = document.querySelectorAll('tr[data-test-subj="tableDocViewRow-traceidentifier"]');

            traceidRows.forEach(function (row) {
                if (row.attributes.modified?.value != 'true') {
                    var lastColumn = row.querySelector('td:last-child');
                    var traceidentifier = lastColumn.children[0].innerHTML.replaceAll(/<\/?mark>/g, '').split('-')[1]; // Remove <mark>'s which are the yellow-highlighted matches.
                    var url = generateUrl('traceidentifier', traceidentifier);

                    lastColumn.insertAdjacentHTML('beforeend', `
                        <div class="modification">
                            <a style="margin-left: 20px;" href="${url}">🔍 Focus on traceidentifier</a>
                            <a style="margin-left: 20px;" href="https://github.com/Issung/KibanaFocus">
                                <img style="top: 4px;" class="issung" src="https://i.imgur.com/Zfb2K30.png"/>
                            </a>
                            <span class="tooltip">
                                <a href="https://github.com/Issung/KibanaFocus">Kibana focus plugin by JoelG</a>
                            </span>
                        </div>
                        `);

                    // Mark this row as modified so it doesn't get done again for this row.
                    // Possible annoyance for users here as the columns get modified and such after we generate the link...
                    row.setAttribute('modified', true);
                }
            });

            function generateUrl(fieldName, fieldValue) {
                let [g, a] = getUrlParts();

                a.filters = [
                    {
                        $state: {
                            store: 'appState'
                        },
                        meta: {
                            alias: null,
                            disabled: false,
                            index: a.index,
                            key: fieldName,
                            negate: false,
                            params: {
                                query: fieldValue
                            },
                            type: 'phrase',
                        },
                        query: {
                            match_phrase: {
                                [fieldName]: fieldValue // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#computed_property_names
                            },
                        },
                    },
                ];

                a.query.query = ""; // Retain preferred query type (lucene or kql), but remove the searchboxtext

                var gEncoded = rison.encode(g);
                var aEncoded = rison.encode(a);

                var url = `https://${window.location.host}/_plugin/kibana/app/discover#/?_g=${gEncoded}&_a=${aEncoded}`;

                return url;
            }
        }
    });

    let motds = [
        'good luck!',
        'you\'re welcome!',
        'hello world!',
        'abandon hope all ye who enter here...',
        'remember to thank Joel!',
        'boy I\'m useful!',
        `the time is ${new Date().toLocaleTimeString()}.`,
        `the date is ${new Date().toDateString()}.`,
        'have a great day!',
        'bababooey!',
        'nevermind...',
        'I hope these messages brighten your day!',
        'I got one job and I\'m good at it!',
        'let\'s dance!',
        'beers after this?',
        'the log has to be in here somewhere..',
        'stop reading these messages!',
        'close that Twitter tab! I see it!',
        'that\'s all.',
        'stay safe!',
        'wanna hear a joke?',
        'sue me!',
        'I\'m running out of messages.',
        'happy birthday!',
        'remember to drink some water.',
    ];
})();