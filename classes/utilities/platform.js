
BROWSER_MIN_FIREFOX = 7;
BROWSER_MIN_CHROME = 7;
BROWSER_MIN_SAFARI = 6;
BROWSER_MIN_IE = 10;
BROWSER_MIN_OPERA = 12;

// http://www.quirksmode.org/js/detect.html
var BrowserDetect = {
    init: function () {
        this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
        this.version = this.searchVersion(navigator.userAgent)
            || this.searchVersion(navigator.appVersion)
            || "an unknown version";
        this.OS = this.searchString(this.dataOS) || "an unknown OS";
    },
    searchString: function (data) {
        for (var i=0;i<data.length;i++)	{
            var dataString = data[i].string;
            var dataProp = data[i].prop;
            this.versionSearchString = data[i].versionSearch || data[i].identity;
            if (dataString) {
                if (dataString.indexOf(data[i].subString) != -1)
                    return data[i].identity;
            }
            else if (dataProp)
                return data[i].identity;
        }
    },
    searchVersion: function (dataString) {
        var index = dataString.indexOf(this.versionSearchString);
        if (index == -1) return;
        return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
    },
    dataBrowser: [
        {
            string: navigator.userAgent,
            subString: "Chrome",
            identity: "Chrome"
        },
        { 	string: navigator.userAgent,
            subString: "OmniWeb",
            versionSearch: "OmniWeb/",
            identity: "OmniWeb"
        },
        {
            string: navigator.vendor,
            subString: "Apple",
            identity: "Safari",
            versionSearch: "Version"
        },
        {
            prop: window.opera,
            identity: "Opera",
            versionSearch: "Version"
        },
        {
            string: navigator.vendor,
            subString: "iCab",
            identity: "iCab"
        },
        {
            string: navigator.vendor,
            subString: "KDE",
            identity: "Konqueror"
        },
        {
            string: navigator.userAgent,
            subString: "Firefox",
            identity: "Firefox"
        },
        {
            string: navigator.vendor,
            subString: "Camino",
            identity: "Camino"
        },
        {		// for newer Netscapes (6+)
            string: navigator.userAgent,
            subString: "Netscape",
            identity: "Netscape"
        },
        {
            string: navigator.userAgent,
            subString: "MSIE",
            identity: "Explorer",
            versionSearch: "MSIE"
        },
        {
            string: navigator.userAgent,
            subString: "Gecko",
            identity: "Mozilla",
            versionSearch: "rv"
        },
        { 		// for older Netscapes (4-)
            string: navigator.userAgent,
            subString: "Mozilla",
            identity: "Netscape",
            versionSearch: "Mozilla"
        }
    ],
    dataOS : [
        {
            string: navigator.platform,
            subString: "Win",
            identity: "Windows"
        },
        {
            string: navigator.platform,
            subString: "Mac",
            identity: "Mac"
        },
        {
            string: navigator.userAgent,
            subString: "iPhone",
            identity: "iPhone/iPod"
        },
        {
            string: navigator.platform,
            subString: "Linux",
            identity: "Linux"
        }
    ]

};
BrowserDetect.init();



function checkForBrowserCompatibility() {
    if (BrowserDetect.browser == "Firefox") {
        if (BrowserDetect.version < BROWSER_MIN_FIREFOX) {
            $("#"+PAPAYA_WARNINGS_ID).append("<p>This version of " +BrowserDetect.browser+ " is " + BrowserDetect.version + ".\n" +BrowserDetect.browser+ " version "+BROWSER_MIN_FIREFOX+" or higher is required.\n\nPlease consider upgrading or using a different browser.</p>")
        }
    } else if (BrowserDetect.browser == "Chrome") {
        if (BrowserDetect.version < BROWSER_MIN_CHROME) {
            $("#"+PAPAYA_WARNINGS_ID).append("<p>This version of " +BrowserDetect.browser+ " is " + BrowserDetect.version + ".\n" +BrowserDetect.browser+ " version "+BROWSER_MIN_CHROME+" or higher is required.\n\nPlease consider upgrading or using a different browser.</p>")
        }
    } else if (BrowserDetect.browser == "Explorer") {
        if (BrowserDetect.version < BROWSER_MIN_IE) {
            $("#"+PAPAYA_WARNINGS_ID).append("<p>This version of " +BrowserDetect.browser+ " is " + BrowserDetect.version + ".\n" +BrowserDetect.browser+ " version "+BROWSER_MIN_IE+" or higher is required.\n\nPlease consider upgrading or using a different browser.</p>")
        }
    } else if (BrowserDetect.browser == "Safari") {
        if (BrowserDetect.version < BROWSER_MIN_SAFARI) {
            $("#"+PAPAYA_WARNINGS_ID).append("<p>This version of " +BrowserDetect.browser+ " is " + BrowserDetect.version + ".\n" +BrowserDetect.browser+ " version "+BROWSER_MIN_SAFARI+" or higher is required.\n\nPlease consider upgrading or using a different browser.</p>")
        }
    } else if (BrowserDetect.browser == "Opera") {
        if (BrowserDetect.version < BROWSER_MIN_OPERA) {
            $("#"+PAPAYA_WARNINGS_ID).append("<p>This version of " +BrowserDetect.browser+ " is " + BrowserDetect.version + ".\n" +BrowserDetect.browser+ " version "+BROWSER_MIN_OPERA+" or higher is required.\n\nPlease consider upgrading or using a different browser.</p>")
        }
    }
}




if (!window.console) {
	console = {};
}

console.log = console.log || function() { };
console.warn = console.warn || function() { };
console.error = console.error || function() { };
console.info = console.info || function() { };


function getKeyCode(ev) {
	return (ev.keyCode ? ev.keyCode : ev.charCode);
}

function getMousePositionX(ev) {
	return ev.pageX;
}

function getMousePositionY(ev) {
	return ev.pageY;
}



// Cross-browser slice method.
var makeSlice = function(file, start, length) {
    if (typeof File === 'undefined') {
        return function() { };
    } else if (File.prototype.slice) {
	    return file.slice(start, start+length);
	} else if (File.prototype.mozSlice) {
	    return file.mozSlice(start, length);
    } else if (File.prototype.webkitSlice) {
        return file.webkitSlice(start, length);
    }
}



function isPlatformLittleEndian() {
	var buffer = new ArrayBuffer(2);
	new DataView(buffer).setInt16(0, 256, true);
	return new Int16Array(buffer)[0] === 256;
};
