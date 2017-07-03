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
        companies: ['GOOG', 'YHOO'],
        currency: 'usd',
        baseURL: 'https://query.yahooapis.com/v1/public/yql',
    },

    // --------------------------------------- Define required stylesheets
    getStyles: function () {
        return ["MMM-Stock.css"];
    },

    // --------------------------------------- Start the module
    start: function () {
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
        marquee.appendChild(par);

        for (var i = 0; i < count; i++) {
            var stockData = data.query.results.quote[i];
            var symbol = stockData.symbol;
            var change = stockData.Change;
            var name = stockData.Name;
            var price = stockData.LastTradePriceOnly;
            var pChange = stockData.PercentChange;
            var priceClass = "greenText", priceIcon = "up_green";
            if (change < 0) {
                priceClass = "redText";
                priceIcon = "down_red";
            }

            var html = "";
            var priceClass = "greentext", priceIcon = "up_green";
            if (change < 0) {
                priceClass = "redtext";
                priceIcon = "down_red";
            }
            html = html + "<span class='" + priceClass + "'>";
            html = html + "<span class='quote'>" + name + " (" + symbol + ")</span> ";
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
            html = html + "<span class='" + priceIcon + "'></span>" + parseFloat(Math.abs(change)).toFixed(2) + " (";
            html = html + (pChange == null ? 'no data' : parseFloat(Math.abs(pChange.split('%')[0])).toFixed(2) + "%)</span>");

            var stock = document.createElement("span");
            stock.className = "stockTicker";
            stock.innerHTML = html;

            var listItem = document.createElement("li");
            //listItem.appendChild(stock);
            listItem.innerHTML = html;
            list.appendChild(listItem);

            par.innerHTML = par.innerHTML + html;
        }
        //wrapper.appendChild(list);
        wrapper.appendChild(marquee);

        return wrapper;
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
    },

});