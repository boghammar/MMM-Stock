'use strict';
/* MMM-Stock.js
 *
 * Magic Mirror module - Display stock quotes. 
 * This module use the API's provided by Trafiklab.
 * 
 * Magic Mirror
 * Module: MMM-Stock
 * 
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * Module MMM-MMM-Stock By Anders Boghammar a fork of MMM-Stock by hakanmhmd/MMM-Stock
 * 
 * Main purpose of the fork is to make a limitless horizontal ticker slider instead and
 * add some more error handling.
 * 
 * Notifications:
 *      STOCK_RESULT: Is sent by the node_helper when new quotes are available
 */

Module.register("MMM-Stock", {

    result: {},
    
    // --------------------------------------- Define module defaults
    defaults: {
        updateInterval: 60000,
        fadeSpeed: 1000,
        companies: ['GOOG', 'AMZN'],
        currency: 'usd',
        animationSpeed: 60, // pixels/s
        baseURL: 'https://query.yahooapis.com/v1/public/yql',
        showSymbolOnly: true,
        //proxy:'http://proxy:8080'

    },

    // --------------------------------------- Define required stylesheets
    getStyles: function () {
        return ["MMM-Stock.css", 'font-awesome.css'];
    },

    // --------------------------------------- Start the module
    start: function () {
        this.failure = undefined;

        this.sendSocketNotification('CONFIG', this.config); // Send config to helper

        this.getStocks();
        if (this.config.currency.toLowerCase() != 'usd') {
            this.getExchangeRate();
        }
        this.scheduleUpdate();
    },

    // --------------------------------------- Generate dom for module
    getDom: function () {
        var wrapper = document.createElement("div");
        wrapper.className = "quotes";

        var data = this.result;

        // Show any service failures
        if (this.failure !== undefined) {
            var div = document.createElement("div");
            var str = this.failure;
            if (this.failure.statusCode !== undefined) str = 'Service returns status: ' +this.failure.statusCode
            if (this.failure.code !== undefined) str = this.failure.syscall + ': ' +this.failure.code
            div.innerHTML = "Service problems: " + str;
            wrapper.appendChild(div);
        }

        // the data is not ready
        if (Object.keys(data).length === 0 && data.constructor === Object) {
            return wrapper;
        }
        var count = data.query.count;
        //console.log(count)

        //if another currency is required - usd is default
        var differentCurrency = false;
        if (this.config.currency.toLowerCase() != 'usd') {
            differentCurrency = true;
            var requiredCurrency = this.config.currency.toUpperCase();
        }

        var list = document.createElement("ul"); //OLD
        var marquee = document.createElement("div");
        marquee.className = 'marquee small';
        var par = document.createElement("p");
        par.id = 'mp';
        marquee.appendChild(par);

        for (var i = 0; i < count; i++) {
            var stockData = data.query.results.quote[i];
            var symbol = stockData.symbol;
            var change = stockData.Change;
            var name = stockData.Name;
            var price = stockData.LastTradePriceOnly;
            var pChange = stockData.PercentChange;
            var html = "";

            var priceClass = "greentext", priceIcon = 'fa fa-chevron-circle-up'; //"up_green";
            if (change < 0) {
                priceClass = "redtext";
                priceIcon = 'fa fa-chevron-circle-down'; //"down_red";
            }
            
            html = html + "<span class='" + priceClass + " oneQuote'>";
            if (this.config.showSymbolOnly) html = html + "<span class='quote'>" + symbol + "</span> ";
            else html = html + "<span class='quote'>" + name + " (" + symbol + ")</span> ";
            if (differentCurrency) {
                //convert between currencies
                var exchangeRate = this.rate.query.results.rate;
                if (exchangeRate.Bid && exchangeRate.Bid != "N/A") {
                    price = parseFloat(price) * parseFloat(exchangeRate.Bid);
                }
                html = html + parseFloat(price).toFixed(2) + " " + requiredCurrency;
            } else {
                html = html + parseFloat(price).toFixed(2) + " " + stockData.Currency;
            }
            html = html + " <span class='" + priceIcon + "'></span>";
            html = html + " <span style='font-weight:bold'>"+ parseFloat(change).toFixed(2)+"</span>";
            //html = html + "<span style='font-weight:bold'>"+ parseFloat(Math.abs(change)).toFixed(2)+"</span>";
            html = html + " (" + (pChange == null ? 'no data' : parseFloat(pChange.split('%')[0]).toFixed(2) + "%)");
            //html = html + " (" + (pChange == null ? 'no data' : parseFloat(Math.abs(pChange.split('%')[0])).toFixed(2) + "%)");
            html = html + "</span>";

            var stock = document.createElement("span");
            stock.className = "stockTicker";
            stock.innerHTML = html;

            var listItem = document.createElement("li");
            //listItem.appendChild(stock);
            listItem.innerHTML = html;
            list.appendChild(listItem);

            par.innerHTML = par.innerHTML + html;
        }
        par.style.animationDuration = this.getAnimationDuration(par);
        //wrapper.appendChild(list);
        wrapper.appendChild(marquee);

        // Set a timeout to set the animationduration, we need the styles to be applied to calculate it
        var self = this;
        setTimeout(function() {
            var pm = document.getElementById('mp');
            var dur = self.getAnimationDuration(par);
            if (pm.style.animationDuration != dur) pm.style.animationDuration = dur;
        }, 500);

        return wrapper;
    },

    // --------------------------------------- Calculate animation duration based on speed setting
    getAnimationDuration: function (el) {
        // From https://stackoverflow.com/questions/38315592/js-css-animation-speed-relative-to-object-size
        var contentWidth = Math.max(
            document.documentElement["clientWidth"],
            document.body["scrollWidth"],
            document.documentElement["scrollWidth"],
            document.body["offsetWidth"],
            document.documentElement["offsetWidth"]
        );
        var pixelsPerSecond = this.config.animationSpeed;
        var pad = parseFloat(window.getComputedStyle(el, null).getPropertyValue('padding-left'));
        var thisWidth = el.offsetWidth - pad;
        var dur = (thisWidth+contentWidth)/pixelsPerSecond + 's';
        Log.info("Animationspeed: "+ this.config.animationSpeed + "Animationdur: "+ dur)
        return dur;
    },

    // --------------------------------------- Schedule updates
    scheduleUpdate: function (delay) {
        var loadTime = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            loadTime = delay;
        }

        var self = this;
        setInterval(function () {
            self.getStocks();
            if (self.config.currency.toLowerCase() != 'usd') {
                self.getExchangeRate();
            }
        }, loadTime);
    },

    // --------------------------------------- Do the actual updates
    getStocks: function () {
        var url = this.config.baseURL + "?q=env%20'store%3A%2F%2Fdatatables.org%2Falltableswithkeys'%3B%20select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20('" + this.config.companies.join(', ') + "')&format=json&diagnostics=true&callback=";
        this.sendSocketNotification('GET_STOCKS', url);
    },

    getExchangeRate: function () {
        var url = this.config.baseURL + "?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20('USD" + this.config.currency + "')&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback="
        this.sendSocketNotification('GET_EXCHANGE_RATE', url);
    },

    // --------------------------------------- Handle socketnotifications
    socketNotificationReceived: function (notification, payload) {
        if (notification === "STOCK_RESULT") {
            this.result = payload;
            this.updateDom(self.config.fadeSpeed);
        } else if (notification === "EXCHANGE_RATE") {
            this.rate = payload;

        }
        if (notification === "SERVICE_FAILURE") {
            this.failure = payload;
            this.updateDom(self.config.fadeSpeed);
        } else {
            this.failure = undefined;            
        }
        
    },

});