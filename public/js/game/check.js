<!--  		// script to find the browser and browser version. Found here: http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
		
		navigator.sayswho= (function(){
		var ua= navigator.userAgent, tem, 
		M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
		if(/trident/i.test(M[1])){
		    tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
		    return 'IE '+(tem[1] || '');
		}
		if(M[1]=== 'Chrome'){
		    tem= ua.match(/\bOPR\/(\d+)/)
		    if(tem!= null) return 'Opera '+tem[1];
		}
		M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
		if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
		return M.join(' ');
		})();
	    var myNavigator = navigator.sayswho;
		//if ((myNavigator.indexOf("Chrome") == -1) && (myNavigator.indexOf("Firefox") == -1)) //if it doesn't find Chrome
		//{
		//	document.getElementById("selection").innerHTML = "This game only works in a Chrome browser. Please switch to Chrome and try again.";
		//	document.getElementById("toHide").style.display = 'none';	
		//}

		if (window.innerWidth < 800) //if resolution too small
		{		
			document.getElementById("selection").innerHTML = "This game only works on PC and Macs with a screen resolution width > 800px. Please try again from another device.";
			document.getElementById("toHide").style.display = 'none';
		}

	 if( navigator.userAgent.match(/Android/i) // if using smartphone or tablet
	 || navigator.userAgent.match(/webOS/i)
	 || navigator.userAgent.match(/iPhone/i)
	 || navigator.userAgent.match(/iPad/i)
	 || navigator.userAgent.match(/iPod/i)
	 || navigator.userAgent.match(/BlackBerry/i)
	 || navigator.userAgent.match(/Windows Phone/i)
	 ){
			document.getElementById("selection").innerHTML = "This game only works on PC and Macs (no mobile devices). Please try again from another device.";
			document.getElementById("toHide").style.display = 'none';
	  }
	 


-->
