# MMM-Stock
Stock prices third party module for Magic Mirror. This is a fork of [MMM-Stock by hakanmhmd](https://github.com/hakanmhmd/MMM-Stock). The main difference is that this version use a horizontal marquee, adds some error controls and has a slight different apperance of the quotes.

The module uses the [YQL Web Service](https://developer.yahoo.com/yql/guide/yql_url.html) (Yahoo Query Language)

## Installing the Module
* Navigate into your MagicMirror's modules folder and execute `git clone https://github.com/boghammar/MMM-Stock.git`
* Do `npm install` in the `modules/MMM-Stock` directory
* Update your Magic Mirror config in `config/config.js`

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
{
    		module: 'MMM-Stock',
    		position: 'bottom_bar',
    		config: {
    			companies: ['MSFT', 'GOOG', 'ORCL', 'FB'], //check each company ticker symbol in yahoo finance
		        currency: 'gbp', //dont use this if you need the currency to be USD
		        animationSpeed: 30, // pixels/s that the marquee moves with
		        proxy: '', // the url of your proxy
		        showSymbolOnly: true // Only show the symbol and not the full name of the stock/index
    		}
}
````


## Finding ticker symbols
Go to this url [https://finance.yahoo.com/quote/%5EOMXSPI/?p=^OMXSPI](https://finance.yahoo.com/quote/%5EOMXSPI/?p=^OMXSPI) and enter what you search for in the search field.

