// ==UserScript==
// @name         Kibana TraceId Focus
// @version      0.1
// @description  Add a "focus" link to traceidentifiers that wipes all filters except for timeframe and adds a filter for the traceidentifier.
// @author       JoelG AKA Issung
// @match        https://search-elkelasticsearchdomain-bqedehxv6l7akoeyshisnm72g4.us-west-2.es.amazonaws.com/_plugin/kibana/app/*
// @match        https://search-ekelasticsearchdomain-5jvrnkc5zt3m5nevaxazbnnmp4.eu-central-1.es.amazonaws.com/_plugin/kibana/app/*
// @icon         https://images.contentstack.io/v3/assets/bltefdd0b53724fa2ce/blt601c406b0b5af740/620577381692951393fdf8d6/elastic-logo-cluster.svg
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Custom styling
    document.querySelector('head').insertAdjacentHTML('beforeend', `
        <style>
            div.modification {
                display: inline;
            }
            div.modification a:first-child:hover {
                text-decoration: underline;
            }
            .modification a img.issung {
                height:16px;
                width:16px;
                position: relative;
                top: 4px;
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

    document.addEventListener("click", function(e) {
        console.log(`click event on ${e.target} {}`);

        var isExpandButton = e.target.attributes?.['aria-label']?.value == 'Toggle row details' ?? false;
        var isRightArrowSvg = e.target.querySelector('path')?.attributes?.d?.value.startsWith('M5.157') ?? false;
        var isRightArrowSvgPath = e.target.attributes?.d?.value.startsWith('M5.157') ?? false;
        var isDownArrowSvg = e.target.querySelector('path')?.attributes?.d?.value.startsWith('M13.069') ?? false;
        var isEmptySpace = e.target.attributes?.['data-test-subj']?.value == 'docTableExpandToggleColumn' ?? false;
        var shouldExpand = isExpandButton || isRightArrowSvg || isRightArrowSvgPath || isDownArrowSvg || isEmptySpace;

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
                            <a style="margin-left: 20px;" href="http://github.com/Issung">
                                <img class="issung" src="https://i.imgur.com/Zfb2K30.png" style=""/>
                            </a>
                            <span class="tooltip">
                                <a href="http://github.com/Issung">Kibana focus plugin by JoelG</a>
                            </span>
                        </div>
                        `);

                    // Mark this row as modified so it doesn't get done again for this row.
                    // Possible annoyance for users here as the columns get modified and such after we generate the link...
                    row.setAttribute('modified', true);
                }
            });

            function generateUrl(fieldName, fieldValue) {
                const timeRegex = /(?<=,time:\()[^)]*(?=\))/g; // Get 'time' field from  url.
                const columnsRegex = /(?<=\(columns:!\()[^)]*(?=\))/g; // Get 'columns' field from url.
                const indexRegex = /(?<=index:')[0-9a-f-]*(?=',)/g; // Get 'index' field from url.
                var location = window.location.href;
                var timeMatch = timeRegex.exec(location);
                var time = timeMatch[0];
                var columnsMatch = columnsRegex.exec(location);
                var columns = columnsMatch[0];
                var indexMatch = indexRegex.exec(location);
                var index = indexMatch[0];

                // Generate Kibana url in the most scuffed way possible.
                var url = `https://${window.location.host}/_plugin/kibana/app/discover#/
                    ?_g=
                    (
                        filters:!(),
                        refreshInterval:
                        (
                            pause:!t,
                            value:0
                        ),
                        time:
                        (
                            ${time}
                        )
                    )
                    &_a=
                    (
                        columns:!
                        (
                            ${columns}
                        ),
                        filters:!
                        (
                            (
                                '$state':
                                (
                                    store:appState
                                ),
                                meta:
                                (
                                    alias:!n,
                                    disabled:!f,
                                    index:'${index}',
                                    key:${fieldName},
                                    negate:!f,
                                    params:
                                    (
                                        query:'${fieldValue}'
                                    ),
                                    type:phrase
                                ),
                                query:
                                (
                                    match_phrase:
                                    (
                                        ${fieldName}:'${fieldValue}'
                                    )
                                )
                            )
                        ),
                        index:'${index}',
                        interval:auto,
                        query:
                        (
                            language:lucene,
                            query:''
                        ),
                        sort:!()
                    )`
                .replaceAll(/\s/g,''); // Remove all whitespace, its easy to read in the code but busted in browser.

                return url;
            }
        }
    });
})();