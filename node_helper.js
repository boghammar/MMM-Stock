var NodeHelper = require('node_helper');
var request = require('request');
var HttpsProxyAgent = require('https-proxy-agent');
var Url = require('url');

module.exports = NodeHelper.create({
    start: function () {
        console.log(this.name + ' helper method started...');
        this.started = false;
    },

    sendRequest: function (url) {
        var self = this;
        // See https://stackoverflow.com/questions/31673587/error-unable-to-verify-the-first-certificate-in-nodejs
        var opt = { url: url, method: 'GET', rejectUnauthorized: false};
        if (this.config.proxy !== undefined) {
            opt.agent = new HttpsProxyAgent(Url.parse(this.config.proxy));
        }

        console.log("Getting "+ url);
        request(opt, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(body);
                console.log(result)
                self.sendSocketNotification('STOCK_RESULT', result);
            } else if (error) {
                self.sendSocketNotification('SERVICE_FAILURE', error);
                console.log(" Error:"+ error);
            } else {
                self.sendSocketNotification('SERVICE_FAILURE'
                    , response); 
                    //+ (error ? " " + error : " no error"));
                console.log("Service returns statuscode: " + response.statusCode);
            }
        });

    },

    sendExchangeRate: function (url) {
        var self = this;

        request({ url: url, method: 'GET' }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(body);
                self.sendSocketNotification('EXCHANGE_RATE', result);
            }
        });
    },

    //Subclass socketNotificationReceived received.
    socketNotificationReceived: function (notification, payload) {
        if (notification === 'GET_STOCKS') {
            //console.log(url)
            this.sendRequest(payload);
        } else if (notification === 'GET_EXCHANGE_RATE') {
            this.sendExchangeRate(payload);
        }
        if (notification === 'CONFIG' && this.started == false) {
            this.config = payload;
            this.started = true;
        }
    }

});