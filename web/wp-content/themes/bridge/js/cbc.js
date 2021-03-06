
var cbc = {
	cssKey: function(module){
		return this.config.key+'-'+(module.config.key||module.prototype.config.key);
	}
};

// BEGIN api
cbc.req = function(/* method must come after url */){
	var z = cbc.req, method = 'get'
		,url,data,opts,showLoader,cb,i
	for (i=0;i<arguments.length;++i) {
		switch (typeof arguments[i]) {
			case 'string': url ? method = arguments[i] : url = arguments[i]; break;
			case 'object': data ? opts = arguments[i] : data = arguments[i]; break;
			case 'function': cb = arguments[i]; break;
			case 'boolean': showLoader = arguments[i]; break;
		}
	}
	url = z.config.apiPrefix + (url[0] == '/' ? url.substr(1) : url);
	showLoader && cbc.loader.up();
	$.ajax({
		url: url
		,data: data
		,method: method // jQuery v1
		,type: method // jQuery v2
		,dataType: 'json'
		,complete: function(res){
			var undef;
			showLoader && cbc.loader.down();
			// BEGIN handle jquery not returning responseJSON (wrong content-type or not an object)
			if (res && !res.responseJSON && res.responseText) {
				try {
					res.responseJSON = JSON.parse(res.responseText);
				} catch (e){}
			}
			// END handle jquery not returning responseJSON (wrong content-type or not an object)
			if (!(res && res.responseJSON))
				return cb({error:'unexpected response from api', code:0});
			if (res.responseJSON.code !== undef || res.responseJSON.error !== undef) {
				if (!res.responseJSON.code)
					res.responseJSON.code = -1;
				if (typeof res.responseJSON.error == 'object')
					res.responseJSON.error = JSON.stringify(res.responseJSON.error);
				return cb(res.responseJSON);
			}
			cb(false, res.responseJSON);
		}
	});
};
cbc.req.config = {
	apiPrefix: '/wp-json/wp/v2/'
};
// END api


cbc.loader = {
	config: {
		key: 'loader'
	}
	,$el: null
	,queue: 0
	,up: function(){
		if (++this.queue == 1)
			this._show();
	}
	,down: function(){
		if (this.queue == 0)
			return;
		if (--this.queue == 0)
			this._hide();
	}
	,_show: function(){
		var z = this
			,x = cbc.cssKey(z)
		;
		if (!z.$el)
			z.$el = $('<div class="'+x+'" />').appendTo($('body'));
		z.$el.css('display','');
	}
	,_hide: function(){
		if (this.$el)
			this.$el.css('display','none');
	}
}


cbc.util = {
	formatWpTimestamp: function(timestampStr,format){
		if (!format) format = 'd/m/Y'
		try {
			return phpjs.date(format,Math.round(+new Date(timestampStr)/1000))
		} catch (e) {
			console.error('formatWpTimestamp',e)
		}
		return ''
	}
}

phpjs = {
	date: function(format, timestamp) {
		var jsdate, f
		// Keep this here (works, but for code commented-out below for file size reasons)
		// var tal= [];
		var txtWords = [
			'Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur',
			'January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'
		]
		// trailing backslash -> (dropped)
		// a backslash followed by any character (including backslash) -> the character
		// empty string -> empty string
		var formatChr = /\\?(.?)/gi
		var formatChrCb = function (t, s) {
			return f[t] ? f[t]() : s
		}
		var _pad = function (n, c) {
			n = String(n)
			while (n.length < c) {
				n = '0' + n
			}
			return n
		}
		f = {
			// Day
			d: function () {
				// Day of month w/leading 0; 01..31
				return _pad(f.j(), 2)
			},
			D: function () {
				// Shorthand day name; Mon...Sun
				return f.l()
					.slice(0, 3)
			},
			j: function () {
				// Day of month; 1..31
				return jsdate.getDate()
			},
			l: function () {
				// Full day name; Monday...Sunday
				return txtWords[f.w()] + 'day'
			},
			N: function () {
				// ISO-8601 day of week; 1[Mon]..7[Sun]
				return f.w() || 7
			},
			S: function () {
				// Ordinal suffix for day of month; st, nd, rd, th
				var j = f.j()
				var i = j % 10
				if (i <= 3 && parseInt((j % 100) / 10, 10) === 1) {
					i = 0
				}
				return ['st', 'nd', 'rd'][i - 1] || 'th'
			},
			w: function () {
				// Day of week; 0[Sun]..6[Sat]
				return jsdate.getDay()
			},
			z: function () {
				// Day of year; 0..365
				var a = new Date(f.Y(), f.n() - 1, f.j())
				var b = new Date(f.Y(), 0, 1)
				return Math.round((a - b) / 864e5)
			},

			// Week
			W: function () {
				// ISO-8601 week number
				var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3)
				var b = new Date(a.getFullYear(), 0, 4)
				return _pad(1 + Math.round((a - b) / 864e5 / 7), 2)
			},

			// Month
			F: function () {
				// Full month name; January...December
				return txtWords[6 + f.n()]
			},
			m: function () {
				// Month w/leading 0; 01...12
				return _pad(f.n(), 2)
			},
			M: function () {
				// Shorthand month name; Jan...Dec
				return f.F()
					.slice(0, 3)
			},
			n: function () {
				// Month; 1...12
				return jsdate.getMonth() + 1
			},
			t: function () {
				// Days in month; 28...31
				return (new Date(f.Y(), f.n(), 0))
					.getDate()
			},

			// Year
			L: function () {
				// Is leap year?; 0 or 1
				var j = f.Y()
				return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0
			},
			o: function () {
				// ISO-8601 year
				var n = f.n()
				var W = f.W()
				var Y = f.Y()
				return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0)
			},
			Y: function () {
				// Full year; e.g. 1980...2010
				return jsdate.getFullYear()
			},
			y: function () {
				// Last two digits of year; 00...99
				return f.Y()
					.toString()
					.slice(-2)
			},

			// Time
			a: function () {
				// am or pm
				return jsdate.getHours() > 11 ? 'pm' : 'am'
			},
			A: function () {
				// AM or PM
				return f.a()
					.toUpperCase()
			},
			B: function () {
				// Swatch Internet time; 000..999
				var H = jsdate.getUTCHours() * 36e2
				// Hours
				var i = jsdate.getUTCMinutes() * 60
				// Minutes
				// Seconds
				var s = jsdate.getUTCSeconds()
				return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3)
			},
			g: function () {
				// 12-Hours; 1..12
				return f.G() % 12 || 12
			},
			G: function () {
				// 24-Hours; 0..23
				return jsdate.getHours()
			},
			h: function () {
				// 12-Hours w/leading 0; 01..12
				return _pad(f.g(), 2)
			},
			H: function () {
				// 24-Hours w/leading 0; 00..23
				return _pad(f.G(), 2)
			},
			i: function () {
				// Minutes w/leading 0; 00..59
				return _pad(jsdate.getMinutes(), 2)
			},
			s: function () {
				// Seconds w/leading 0; 00..59
				return _pad(jsdate.getSeconds(), 2)
			},
			u: function () {
				// Microseconds; 000000-999000
				return _pad(jsdate.getMilliseconds() * 1000, 6)
			},

			// Timezone
			e: function () {
				// Timezone identifier; e.g. Atlantic/Azores, ...
				// The following works, but requires inclusion of the very large
				// timezone_abbreviations_list() function.
				/*							return that.date_default_timezone_get();
				 */
				var msg = 'Not supported (see source code of date() for timezone on how to add support)'
				throw new Error(msg)
			},
			I: function () {
				// DST observed?; 0 or 1
				// Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
				// If they are not equal, then DST is observed.
				var a = new Date(f.Y(), 0)
				// Jan 1
				var c = Date.UTC(f.Y(), 0)
				// Jan 1 UTC
				var b = new Date(f.Y(), 6)
				// Jul 1
				// Jul 1 UTC
				var d = Date.UTC(f.Y(), 6)
				return ((a - c) !== (b - d)) ? 1 : 0
			},
			O: function () {
				// Difference to GMT in hour format; e.g. +0200
				var tzo = jsdate.getTimezoneOffset()
				var a = Math.abs(tzo)
				return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4)
			},
			P: function () {
				// Difference to GMT w/colon; e.g. +02:00
				var O = f.O()
				return (O.substr(0, 3) + ':' + O.substr(3, 2))
			},
			T: function () {
				// The following works, but requires inclusion of the very
				// large timezone_abbreviations_list() function.
				/*							var abbr, i, os, _default;
				if (!tal.length) {
					tal = that.timezone_abbreviations_list();
				}
				if ($locutus && $locutus.default_timezone) {
					_default = $locutus.default_timezone;
					for (abbr in tal) {
						for (i = 0; i < tal[abbr].length; i++) {
							if (tal[abbr][i].timezone_id === _default) {
								return abbr.toUpperCase();
							}
						}
					}
				}
				for (abbr in tal) {
					for (i = 0; i < tal[abbr].length; i++) {
						os = -jsdate.getTimezoneOffset() * 60;
						if (tal[abbr][i].offset === os) {
							return abbr.toUpperCase();
						}
					}
				}
				*/
				return 'UTC'
			},
			Z: function () {
				// Timezone offset in seconds (-43200...50400)
				return -jsdate.getTimezoneOffset() * 60
			},

			// Full Date/Time
			c: function () {
				// ISO-8601 date.
				return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb)
			},
			r: function () {
				// RFC 2822
				return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb)
			},
			U: function () {
				// Seconds since UNIX epoch
				return jsdate / 1000 | 0
			}
		}

		var _date = function (format, timestamp) {
			jsdate = (timestamp === undefined ? new Date() // Not provided
				: (timestamp instanceof Date) ? new Date(timestamp) // JS Date()
				: new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
			)
			return format.replace(formatChr, formatChrCb)
		}

		return _date(format, timestamp)
	}
}
