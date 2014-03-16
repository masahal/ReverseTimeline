var readAT = {
checkInterval : 300000,
numOfTweetsEachPage : 20,
setIntervalID : null,
unreadCount : 0,
lastStatus : null,
newLastStatus : null,
ol : null,
lis : null,
pageId : 0,
lastDM : -1,
user : null,
preKind : null,
targetBrowser : null,
onceCanceled : false,
baseUrl: null,
newTwitter : false,
originalTitle : "",
timeRecordingInterval : 300000,
Branch: Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("extensions.readalltweets."),
init: function() {
  Components.utils.import("resource://readalltweets/oauth.js");
//alert(insertAdjacentHTML)
  this.TwitterAPI = function(atoken, atoken_secret){
    this.atoken = atoken;
    this.atoken_secret = atoken_secret;
	//Set "http:" or "https:"
    this.baseProtocol = readAT.baseProtocol || "http:";
  };

  this.TwitterAPI.prototype.consumer = {
  	consumerSecret: "mq3xk6D9ylZtUnVyC3RBsuacZbOEKzgMonog1oI4g8c",
  	consumerKey:"7Ehd9t2Q0ublu39b4uVQ" 
  }
  this.TwitterAPI.prototype.getRequestToken = function() {
      var _self = this;
      var accessor = {
        consumerSecret: this.consumer.consumerSecret,
        tokenSecret: ''
      };
     
      var message = {
        method: "GET",
        action: _self.baseProtocol+"//twitter.com/oauth/request_token",
        parameters: {
          oauth_signature_method: "HMAC-SHA1",
          oauth_consumer_key: _self.consumer.consumerKey
        }
      };
      readATModules.OAuth.setTimestampAndNonce(message);
      readATModules.OAuth.SignatureMethod.sign(message, accessor);
      var target = readATModules.OAuth.addToURL(message.action, message.parameters);
  
  	var req = new XMLHttpRequest();
  	req.open('GET', target, true);
  	req.overrideMimeType('text/xml');
    
  	req.onreadystatechange = function (aEvt) {
  	  if (req.readyState == 4) {
  	     if(req.status == 200){
            //Layout of responseText is:
            //oauth_token=XXXX&oauth_token_secret=XXXX&oauth_callback_confirmed=true

            //Check oauth_callback is succeeded
            req.responseText.match(/oauth_callback_confirmed=([^&]*)/)
            if(RegExp.$1!="true"){
              readAT.oauthFailed();
              return;
            } 
			//Set token and token_secret
            req.responseText.match(/oauth_token_secret=([^&]*)/)
            _self.token_secret = RegExp.$1;
            req.responseText.match(/oauth_token=([^&]*)/)
            _self.token = RegExp.$1;

			//URL to get pin code: _self.baseProtocol+"//twitter.com/oauth/authorize?"+req.responseText
   		 	var tab = gBrowser.addTab(_self.baseProtocol+"//twitter.com/oauth/authorize?"+req.responseText);
            gBrowser.selectedTab = tab;
  			var targetBrowser = gBrowser.getBrowserForTab(tab);
            targetBrowser.addEventListener("DOMContentLoaded", function(aEvent){
				var doc = aEvent.originalTarget;
        
  	    var oauth_pin = doc.evaluate(".//*[@id='oauth_pin']/p/kbd/code",
	        doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;

				if(oauth_pin){
					var pin = oauth_pin.innerHTML.trim();
					targetBrowser.removeEventListener("DOMContentLoaded", arguments.callee, true);					
	    		gBrowser.selectedTab = readAT.targetTab;
					gBrowser.removeTab(tab)
					_self.getAccessToken(pin);
				}				
			}, false);
  	     }
  	     else{
  	     }
  	  }
  	};
  	req.send(null);
  };
  this.TwitterAPI.prototype.getAccessToken = function(pin) {
  	var accessor = {
  	  consumerSecret: this.consumer.consumerSecret,
  	  tokenSecret: this.token_secret // Request Token Secret
  	};
  	var message = {
  	  method: "GET",
  	  action: this.baseProtocol+"//twitter.com/oauth/access_token",
  	  parameters: {
  	    oauth_signature_method: "HMAC-SHA1",
  	    oauth_consumer_key: this.consumer.consumerKey,
  	    oauth_token: this.token, // Request Token
  	    oauth_verifier: pin
  	  }
  	};
  	readATModules.OAuth.setTimestampAndNonce(message);
  	readATModules.OAuth.SignatureMethod.sign(message, accessor);
  	var target = readATModules.OAuth.addToURL(message.action, message.parameters);
    
    var _self = this;
  	var req = new XMLHttpRequest();
  	req.open(message.method, target, true);
  	req.overrideMimeType('text/xml');
  	req.onreadystatechange = function(aEvt){
      if (req.readyState == 4) {
        if (req.status == 200) {
          //oauth_token=XXXX&oauth_token_secret=XXXX&user_id=XXXX&screen_name=XXXX
           req.responseText.match(/oauth_token_secret=([^&]*)/)
           _self.atoken_secret  = RegExp.$1;
           req.responseText.match(/oauth_token=([^&]*)/)
           _self.atoken = RegExp.$1;
           readAT.oauthSetting(_self.atoken, _self.atoken_secret)
        }
      }
    }
  	req.send(null);
  
  };
  this.TwitterAPI.prototype.post = function(api, content, callback) {
    var accessor = {
      consumerSecret: this.consumer.consumerSecret,
      tokenSecret: this.atoken_secret // Access Token Secret
    };
   
    var message = {
      method: "POST",
      action: api,
      parameters: {
        oauth_signature_method: "HMAC-SHA1",
        oauth_consumer_key: this.consumer.consumerKey,
        oauth_token: this.atoken // Access Token
      }
    };
    // 騾∽ｿ｡縺吶ｋ繝��繧ｿ繧偵ヱ繝ｩ繝｡繝ｼ繧ｿ縺ｫ霑ｽ蜉�☆繧�
    for ( var key in content ) {
      message.parameters[key] = content[key];
    }
    readATModules.OAuth.setTimestampAndNonce(message);
    readATModules.OAuth.SignatureMethod.sign(message, accessor);
    var target = readATModules.OAuth.addToURL(message.action, message.parameters);
    
  	var req = new XMLHttpRequest();
  	req.open(message.method, target, true);
  	req.overrideMimeType('text/xml');
  	req.onreadystatechange = function(aEvt){
      if (req.readyState == 4) {
        if (req.status == 200) {
           callback(req.responseText);
        }
      }
    }
  	req.send(null);
  }
  this.TwitterAPI.prototype.get = function(api, content, callback) {
    var accessor = {
      consumerSecret: this.consumer.consumerSecret,
      tokenSecret: this.atoken_secret // Access Token Secret
    };
   
    var message = {
      method: "GET",
      action: api,
      parameters: {
        oauth_signature_method: "HMAC-SHA1",
        oauth_consumer_key: this.consumer.consumerKey,
        oauth_token: this.atoken // Access Token
      }
    };
    // 騾∽ｿ｡縺吶ｋ繝��繧ｿ繧偵ヱ繝ｩ繝｡繝ｼ繧ｿ縺ｫ霑ｽ蜉�☆繧�
    for ( var key in content ) {
      message.parameters[key] = content[key];
    }
    readATModules.OAuth.setTimestampAndNonce(message);
    readATModules.OAuth.SignatureMethod.sign(message, accessor);
    var target = readATModules.OAuth.addToURL(message.action, message.parameters);
    
  	var req = new XMLHttpRequest();
  	req.open(message.method, target, true);
  	req.overrideMimeType('text/xml');
  	req.onreadystatechange = function(aEvt){
      if (req.readyState == 4) {
        if (req.status == 200) {
           callback(req.responseText);
        }
      }
    }
  	req.send(null);
  }
  this.TwitterAPI.prototype.updateStatus = function(uptext, reply_to, callback) {
    var content = {status: uptext};
    if(reply_to != '') {
      content.in_reply_to_status_id = reply_to;
    }
    //dummy function
    if(!callback) callback = function(){};
    this.post(this.baseProtocol+'//twitter.com/statuses/update.json', content, callback);
  }
  //Get mentions which id is larger than lastId
  this.TwitterAPI.prototype.getMentions = function(lastId, callback) {
    var content = {since_id: lastId};
    this.get(this.baseProtocol+'//api.twitter.com/1/statuses/mentions.json', content, callback);
  }
  //Get DMs which id is larger than lastId
  this.TwitterAPI.prototype.checkDM = function(lastId, callback) {
    var content = {since_id: lastId};
    this.get(this.baseProtocol+'//api.twitter.com/1/direct_messages.json', content, callback);
  }
  
	var appcontent = document.getElementById("appcontent");   // 繝悶Λ繧ｦ繧ｶ
	if(appcontent)
		appcontent.addEventListener("DOMContentLoaded", readAT.onPageLoad, true);
	
    this.Branch.QueryInterface(Components.interfaces.nsIPrefBranch);
    this.Branch.addObserver("", this, false);
	
    if(readAT.Branch.getBoolPref("firstrun") && !readAT.Branch.prefHasUserValue("lastStatus")){
        setTimeout(function(){
            //蛻晏屓襍ｷ蜍墓凾縲√ｂ縺�Twitter 縺ｮ繝壹�繧ｸ縺碁幕縺九ｌ縺ｦ縺ｪ縺�↑繧蛾幕縺�
            var notOpened = true;

            var re = new RegExp("");
            re.compile(readAT.genUrlRegex("\/\??[^#/]*(#|#home)?$"));
            var numTabs = gBrowser.tabContainer.childNodes.length;
		        for(var index=0; index<numTabs; index++) {
  		        var tab = gBrowser.tabContainer.childNodes[index];
  		        var currentBrowser = tab.linkedBrowser;
  		        
  		        var uri = currentBrowser.currentURI.spec;
              if(uri.match(re)){
                  notOpened = false;
                  break;
              }
		        }
            if(notOpened){
                 gBrowser.selectedTab = gBrowser.addTab("http://twitter.com/");
            }
        }, 3000);
    }
},
/*
 * return true if a is bigger than b
 * a,b: strings of huge integer 
 */
aIsBiggerThanB : function(a, b){
  //First, compre number of places
  if(a.length==b.length) return a>b
  else return a.length>b.length
},
uninit : function(){
},
observe: function(aSubject, aTopic, aData){
    if(aTopic != "nsPref:changed") return;
    // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
    // aData is the name of the pref that's been changed (relative to aSubject)
    switch (aData) {
      case "general.changeColorOfNewTweets":
        readAT.setCSS();
        // extensions.myextension.pref1 was changed
        break;
      case "general.checkIntervalOfNewTweets" :
      	readAT.setCheckInterval();
    }
},
setCSS : function(){
	var doc = readAT.targetBrowser.contentDocument;
	
	var css = doc.getElementById("RAT_CSS");
	if(!css) return;
	var sheet = css.sheet;
	
	var cssContent = new Array(".RAT_buffered{display : none !important}",
	  "a.RAT_setting_link:hover{cursor:pointer !important; text-decoration: none;}",
    ".RAT_notification{position:fixed;top:0;left:0;width:100%;overflow:visible;z-index:10000;"+
    'background-color:#fff;opacity:.95;-ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=95)";filter:alpha(opacity=95);'+
    "color:#333333;  text-align:center;"+
    "padding:1.2em 0;}",
    ".RATMessage > div > div{padding:10px; background-color:#FFFF99; border:1px solid #ECEC19;}",
    ".RAT_error{padding:10px; background-color:#FFAB9D; border:1px solid #FF8888;}",
    ".RAT_alert{padding:10px; background-color:#FFFF99; border:1px solid #ECEC19;}",
    "div.last-on-page{border-bottom: 1px solid #CCCCCC !important;}",
    ".RAT_alert{padding:10px; background-color:#FFFF99; border:1px solid #ECEC19;}");
    //"div#new-tweets-bar{display:none !important;}\n"; //   "position:absolute;top:0;left:0;color:#000;border-bottom:2px solid rgba(0,0,0,0.07);width:100%;cursor:pointer;}"+ // notification-bar
//    ".RAT_notification-bar-container{position:relative;display:block;width:100%;overflow:visible;}"+
//    ".notification-bar-contents{width:740px;margin:0 auto;text-align:left;position:relative;font-size:150%;}"+
//    ".notification-bar .message-progress{padding-left:24px;background-image:url(http://s.twimg.com/a/1288039940/images/ajax.gif);background-repeat:no-repeat;background-position:left center;}"+
	if(this.Branch.getBoolPref("general.changeColorOfNewTweets")){
		if (readAT.newTwitter) {
			cssContent.push(".stream-items .RAT_newTweets{background-color : #DDFFFF}");
			cssContent.push(".stream-items .RAT_newTweets:hover{background-color:#D5F7F7;}");
			cssContent.push(".stream-items .RAT_newReplies{background-color : #E6FFE6}");
			cssContent.push(".stream-items .RAT_newReplies:hover{background-color : #DEF7DE;}");
			cssContent.push(".new-tweets-bar{display:none;}");
		}
		else {
			cssContent.push("ol.statuses li.RAT_newTweets{background-color : #DDFFFF}");
			cssContent.push("ol.statuses li.RAT_newTweets:hover{background-color:#D5F7F7;}");
			cssContent.push("ol.statuses li.RAT_newReplies{background-color : #E6FFE6}");
			cssContent.push("ol.statuses li.RAT_newReplies:hover{background-color : #DEF7DE;}");
		}
	}
	for (var i = 0; i<cssContent.length; i++){
		sheet.insertRule(cssContent[i], sheet.cssRules.length);		
	}
	/*
	var txt = doc.createTextNode(cssContent);
    css.appendChild(cssContent);
    */
    return
},
setCheckInterval : function(){
	readAT.checkInterval = 60000 * this.Branch.getIntPref("general.checkIntervalOfNewTweets");
	if(!readAT.checkInterval){
		this.Branch.setIntPref("general.checkIntervalOfNewTweets", 1);
		readAT.checkInterval = 60000;
	}
	if(readAT.newTwitter){
    readAT.setIntervalID2 = setInterval(readAT.showReplies, readAT.checkInterval);
  }
  else{
    readAT.setIntervalID = setInterval(readAT.showNewStauses, readAT.checkInterval);
    setTimeout(function(){
        readAT.setIntervalID2 = setInterval(readAT.showReplies, readAT.checkInterval );
    }, 20000);    
  }
},
clearCheckInterval : function(){
    clearInterval(readAT.setIntervalID);
    clearInterval(readAT.setIntervalID2);
    return;
},
onPageLoad : function(aEvent){
  var doc = aEvent.originalTarget; // doc 縺ｯ "onload" event 繧定ｵｷ縺薙＠縺溘ラ繧ｭ繝･繝｡繝ｳ繝�
  if(!doc) return;

  var uri = doc.location.href;
//    Application.console.log(uri)
	if(readAT.targetBrowser && readAT.targetBrowser.contentDocument==doc){
		readAT.targetBrowser=null;
    readAT.clearCheckInterval();
	}
  if(!uri.match(readAT.genUrlRegex('\/'))) return;
  if(uri.match(readAT.genUrlRegex('\/(oauth|settings)\/'))) return;

//Application.console.log(doc.body.innerHTML)
  if(doc.getElementById("top-bar")) readAT.newTwitter = 1;
  else readAT.newTwitter = 2;

  if(readAT.newTwitter==1){
  	readAT.dropdownXPath = ".//ul[contains(@class, 'user-dropdown')]"; 	
  	readAT.newTweetsBarXPath = ".//*[@id='new-tweets-bar']"
  	readAT.newTweetsBarParentXPath = ".//*[contains(@class, 'stream-container')]/*[contains(@class, 'stream')]";
  	readAT.stabsXPath = ".//ul[contains(@class, 'stream-tabs')]";
  }
  else if(readAT.newTwitter==2){
  	 readAT.dropdownXPath = ".//*[@id='user-dropdown']/ul";
  	readAT.newTweetsBarXPath = ".//*[@id='home-stream-manager']/*[contains(@class, 'stream-container')]/div/div[1]/div[contains(@class, 'new-tweets-bar')]"  	 
    readAT.newTweetsBarParentXPath = ".//*[contains(@class, 'stream-container')]";///div[contains(@class, 'stream-item')]
  	readAT.stabsXPath = ".//*[@id='timeline']/div[1]/div[1]";//".//*[@id='page-container']/div/div[contains(@class, 'content-main')]/div[contains(@class, 'content-header')]/div[contains(@class, 'header-inner')]/*";
   }
//  else readAT.newTwitter = 0;
/*
    doc.body.addEventListener('DOMNodeInserted', function(aEvt){
        Application.console.log(aEvt.target.innerHTML)
    }, false)
*/
//	readAT.setSettingsLink(doc);
    if(readAT.newTwitter){
//    	Application.console.log(doc)
//    	readAT.targetBrowser = gBrowser.getBrowserForDocument(doc);
        setTimeout(function(){
            readAT.checkLoadFinished(0, doc);
        }, 1000);
    }
    else{
	    if(doc.body.id=="profile" && uri.match(readAT.genUrlRegex('\/[^/]+$'))) {
	        readAT.setReverseButton(doc);
	    }
	    else if(doc.body.id=="list" && uri.match(readAT.genUrlRegex('\/(#home)?$'))){
	     	setTimeout(function(){
	     		readAT.checkLoadFinished(0, doc);
	     	}, 500);
	     	return;
	     }
	     else{
		    doc.body.addEventListener("DOMAttrModified", readAT.bodyIdObserver, false);
	     	readAT.checkListName(doc.body.id, doc);
	     }
    }     
},
/*
 * return result
 * tweets: user's profile page
 * home : home
 * lists : list listname(http://twitter.com/#!/list/<username>/<listname>)
 */
getKind : function(doc){
    var activeClass = doc.evaluate(".//*[contains(@class, 'stream-tabs')]/li[contains(@class, 'active')]/@class",
        doc.body, null, XPathResult.STRING_TYPE, null );
    var classes = activeClass.stringValue.split(" ");

    for(var i=0; i<classes.length; i++){   
        if(classes[i].indexOf("stream-tab-")>-1){
            var result = classes[i].replace("stream-tab-", "");
            break
        }
    }
//    Application.console.log(result)
//    alert(result)
    return result
},
checkLoadFinished : function(aCount, doc){
    aCount++;
    if(aCount>60) return;
    var stream = doc.evaluate(".//*[contains(@class, 'stream-container')]/*[contains(@class, 'stream')]",
        doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
    if(!stream){
        setTimeout(function(){readAT.checkLoadFinished(aCount, doc)}, 500);        
        return       
    }
    else{
    	var items = doc.evaluate("./*[contains(@class, 'stream-items')]/*[contains(@class, 'stream-item')]",
          stream, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
        if(!items.snapshotLength){
            setTimeout(function(){readAT.checkLoadFinished(aCount, doc)}, 500);        
            return    
        }
    }

    
    readAT.checkListName(kind, doc);

	return;

	  var kind = readAT.getKind(doc);
      var separator = doc.getElementById("RAT_separator");
      if(readAT.preKind!=kind && separator){
	//			separator.parentNode.removeChild(separator);
	  		readAT.preKind = kind;
  			gBrowser.getBrowserForDocument(doc).reload(Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE);
  			return
  		}
  		readAT.preKind = kind;
},
/*
streamTabsObserver : function(aEvent){
        Application.console.log(aEvent.attrName+" "+aEvent.newValue)
    if(aEvent.attrName!="class") return;
    //繧､繝吶Φ繝医ｒ襍ｷ縺薙＠縺溘ヶ繝ｩ繧ｦ繧ｶ縺ｮ讀懃ｴ｢
    var tmp;
    var numTabs = gBrowser.tabContainer.childNodes.length;
    for(var index=0; index<numTabs; index++) {
        var currentBrowser = gBrowser.getBrowserAtIndex(index);
        if(currentBrowser.contentDocument.body == aEvent.explicitOriginalTarget){
            tmp = currentBrowser;
            break;
        }
    }
    if(!tmp) return;
    Application.console.log("aa")
    var uri = tmp.currentURI.spec;
    var bodyid = aEvent.newValue;
    readAT.checkListName(bodyid, tmp.contentDocument);    
},
*/
//For old Twitter
bodyIdObserver : function(aEvent){
	if (readAT.newTwitter) {
		var target = aEvent.target;
		//	alert(aEvent.attrName+" "+aEvent.newValue)
		if (target.id!="doc" || aEvent.attrName != "class") return;
	//	Application.console.log(aEvent.prevValue+"\t"+aEvent.newValue)
		if (!aEvent.newValue || aEvent.newValue==readAT.prevValue ) return;/* || !aEvent.prevValue */
		//繧､繝吶Φ繝医ｒ襍ｷ縺薙＠縺溘ヶ繝ｩ繧ｦ繧ｶ縺ｮ讀懃ｴ｢
		var tmp;
		var numTabs = gBrowser.tabContainer.childNodes.length;
		for (var index = 0; index < numTabs; index++) {
			var currentBrowser = gBrowser.getBrowserAtIndex(index);
			if (currentBrowser.contentDocument.body == target.parentNode) {
				tmp = currentBrowser;
				break;
			}
		}
		
		if (!tmp) return;
		
//		var uri = tmp.currentURI.spec;
		var bodyid = aEvent.newValue;
		readAT.prevValue = bodyid;
		setTimeout(function(){readAT.checkLoadFinished(0, tmp.contentDocument)}, 100);
	}
	else {
		if (aEvent.attrName != "id") 
			return;
		
		//繧､繝吶Φ繝医ｒ襍ｷ縺薙＠縺溘ヶ繝ｩ繧ｦ繧ｶ縺ｮ讀懃ｴ｢
		var tmp;
		var numTabs = gBrowser.tabContainer.childNodes.length;
		for (var index = 0; index < numTabs; index++) {
			var currentBrowser = gBrowser.getBrowserAtIndex(index);
			if (currentBrowser.contentDocument.body == aEvent.explicitOriginalTarget) {
				tmp = currentBrowser;
				break;
			}
		}
		if (!tmp) 
			return;
		
		var bodyid = aEvent.newValue;
		readAT.checkListName(bodyid, tmp.contentDocument);
	}
},
checkListName : function(kind, doc){
//	Application.console.log(kind)
    var uri = doc.location.href;
//    readAT.removeHTMLChange(doc);
    if(readAT.newTwitter){
    	/*
        if(!(kind=="home" || kind=="lists") || 
            !readAT.isTargetList(uri)){
            if(readAT.targetBrowser && readAT.targetBrowser.contentDocument==doc){
                readAT.targetBrowser=null; 
            }
            if(kind=="tweets" || kind=="lists"){
                readAT.setReverseButton(doc);
            }
            return;
        }
        */
       if(readAT.isTargetList(uri))  setTimeout(function(){readAT.start(doc)}, 100);
    }
    else{
	    if((!(kind=="home" || kind=="list" || kind=="list_show") || 
	        !readAT.isTargetList(uri))){
		    if(readAT.targetBrowser && readAT.targetBrowser.contentDocument==doc){
		    	readAT.targetBrowser=null; 
		    }
		    if(kind=="list" || kind=="list_show"){
		        readAT.setReverseButton(doc);
		    }
	        return;
	    }
	    readAT.start(doc);
    }
    return;
},
isTargetList : function(uri){
	readAT.listname = readAT.Branch.getCharPref("general.lists");
    if(readAT.newTwitter){
        if(uri.match(readAT.genUrlRegex("\/#?!?\/?$"))){
            return readAT.listname=="";
        }
        else if(uri.match(readAT.genUrlRegex("\/#!\/(list\/)?(.*)"))){
                return readAT.listname==RegExp.$2;
        }
        else return false;
    }
    else{
	    if(uri.match(readAT.genUrlRegex("\/\??[^#/]*(#|#home)?$"))){
	     	return readAT.listname=="";
	    }
		else{
			if(uri.match(readAT.genUrlRegex("\/\??[^#\/]*#\/?list\/(.*)"))){
				return readAT.listname==RegExp.$1;
			}
			else if(uri.match(readAT.genUrlRegex("\/([^\/]*)\/lists\/([^\/]*)"))){
				return readAT.listname==RegExp.$1 +"/"+ RegExp.$2;
			}
			else if(uri.match(readAT.genUrlRegex("\/(.*)"))){
				return readAT.listname==RegExp.$1;
			}
			else return false;
		}
    }
},
dropdownXPath : "",
getShortAddonName : function(bundle){
	return bundle.getString("extensions.readalltweets@masahal.info.name");//.replace(/\s?\(.*\)/, "");
},

start : function(doc){
	if(readAT.Branch.getBoolPref("general.disableThisAddonTemporarily")) return;
	if(doc.getElementById("RAT_separator")) return;
	readAT.insertAdjacentHTMLIsDefined = doc.body.insertAdjacentHTML

	var bundle = document.getElementById("readalltweets-bundle");
    var args = {};
    if(readAT.Branch.getBoolPref("general.showOnlyTheMostRecentTweets")){
        args["max"] = readAT.Branch.getIntPref("general.maximumNumberOfFetchedTweets");
        readAT.max = args["max"];
    }
    else readAT.max = 0;
	
    var head = doc.getElementsByTagName("head")[0];
    var style = doc.createElement("style");
    style.setAttribute("type", "text/css");
    style.id = "RAT_CSS";
    head.appendChild(style);
//    Application.console.log("ccc")

    //譌｢縺ｫTwitter縺碁幕縺九ｌ縺ｦ繧九°縺ｩ縺�°
	var thisBrowser = gBrowser.getBrowserForDocument(doc);
  //Application.console.log(readAT.targetBrowser)
	if(readAT.targetBrowser){
		var preDoc = readAT.targetBrowser.contentDocument;
		//縺薙�繧ｨ繝ｬ繝｡繝ｳ繝医′蟄伜惠縺吶ｋ縺九←縺�°縺ｧ譌｢縺ｫ螳溯｡後＆繧後※縺�ｋ縺九←縺�°蛻､譁ｭ
		if(readAT.targetBrowser.currentURI && readAT.targetBrowser.currentURI.host=="twitter.com" &&
		preDoc && (preDoc.getElementById("RAT_separator") || preDoc.getElementById("RAT_processing"))){
			if(readAT.newTwitter){
				var alreadyDiv = doc.createElement("div");
				alreadyDiv.id = "RAT_alreadyOpened";
				alreadyDiv.setAttribute("class", "RAT_alert");
				alreadyDiv.setAttribute("style", "display:block; font-size:15px; margin: 10px 15px;");
				var txt = doc.createTextNode(readAT.getShortAddonName(bundle));
				alreadyDiv.appendChild(txt);
				var br = doc.createElement("br");
				alreadyDiv.appendChild(br);
				txt = doc.createTextNode(bundle.getString("alreadyOpened"));
				alreadyDiv.appendChild(txt);
				
		
				var stabs = doc.evaluate(readAT.stabsXPath,
				doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
				if(stabs) stabs.parentNode.insertBefore(alreadyDiv, stabs);

			  }

			return;
		}
	}
  if(!navigator.onLine){
    BrowserOffline.toggleOfflineStatus();
    thisBrowser.reload(Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE);      
    return
  }
    var win = thisBrowser.contentWindow;
    readAT.pageId++;
    readAT.clearCheckInterval();
    readAT.targetBrowser = thisBrowser;
    readAT.baseProtocol = doc.location.protocol;
	  readAT.baseUrl = doc.location.protocol + '//' + doc.location.host + '/';

    readAT.setCSS();
    
   clearInterval(readAT.intervalID)
	 clearInterval(readAT.reloadTimeoutID)
	 readAT.intervalThresholdread = readAT.timeRecordingInterval+100000/* countermeasure for setInterval error*/
     readAT.intervalID = setInterval(function(){
	 var now = readAT.getNow();
//		Application.console.log(readAT.stanbyed+" "+(readAT.getNow()-readAT.preRecodedTime)+" "+readAT.getNow()+" "+readAT.preRecodedTime)
  		if(now-readAT.preRecodedTime > readAT.intervalThresholdread){
        if(!navigator.onLine){
          BrowserOffline.toggleOfflineStatus();
        }
        readAT.stanbyed = true;
      }
      readAT.preRecodedTime = now;
    }, readAT.timeRecordingInterval)
	  readAT.preRecodedTime = readAT.getNow();
    readAT.stanbyed = false;
    
    if(readAT.newTwitter){
    	readAT.originalTitle = doc.title;
    	var processingDiv = doc.createElement("div");
    	processingDiv.id = "RAT_processing"
    	processingDiv.setAttribute("class", "RAT_notification");
    	var txt = doc.createTextNode(bundle.getString("processing") + ' (');
    	processingDiv.appendChild(txt);
    	var span = doc.createElement("span");
    	span.id = "RAT_processing_count";
    	txt = doc.createTextNode("1");
    	span.appendChild(txt);
    	processingDiv.appendChild(span);
    	txt = doc.createTextNode(')');
    	processingDiv.appendChild(txt);

    	doc.body.appendChild(processingDiv);
    	readAT.pageCount = 1;
    	readAT.originalTitle = doc.title;
    	
    	readAT.abort = false;
    	var abort = doc.createElement("a");
    	abort.id = "RAT_abort";
    	abort.href = "javascript:void(0);";
    	var txt = doc.createTextNode(bundle.getString("abort"));
    	abort.appendChild(txt);
    	abort.addEventListener("click", function(){
    		readAT.abort = true;
    	}, false);
      abort.setAttribute("style", "display:block; float:right; font-size:15px; padding-right:10px;")
   	  processingDiv.appendChild(abort);
	
      //id:global-nav-profile a@href = /#!/username
      if(readAT.newTwitter==2){
	      var sc = doc.evaluate(".//*[@id='user-dropdown']//li[contains(@class,'current-user')]//a[contains(@class,'account-summary')]//div[contains(@class,'account-group')]",
	      doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;   
	      var iii = readAT.user = sc.getAttribute("data-screen-name").trim(); 
      }
      else{
	     var sc = doc.getElementById("screen-name");
	     readAT.user = sc.innerHTML.replace(/<.*?>/g, "").trim();      	
      }
     readAT.separatorHidden = false;
     readAT.stream = doc.evaluate(".//*[contains(@class, 'stream-container')]/*[contains(@class, 'stream')]/*[contains(@class, 'stream-items')]",
          doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
     readAT.newTweetsBarParent = doc.evaluate(readAT.newTweetsBarParentXPath,
          doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
     //alert(readAT.newTweetsBarParent);     
	 //alert(readAT.newTweetsBarParent.id);     
	   
     var items = doc.evaluate("./*[contains(@class, 'stream-item')]",
          readAT.stream, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
     var first = items.snapshotItem(0);
     readAT.alreadyReadLi = null;
     readAT.lastStatus = readAT.getLastStatus();
//     alert(readAT.lastStatus)
     readAT.newLastDM = readAT.getLastDM();
//     readAT.newLastStatus = readAT.getId(first);
     var i=0;
		 var id;
		 while(true){
		   id = readAT.getId(items.snapshotItem(i++));
			 if(id!=-1) break; 
		 }
		 readAT.newLastStatus = id;


     if(readAT.lastStatus==0){
        readAT.setLastStatus(readAT.newLastStatus);
        readAT.setLastReply(readAT.newLastStatus);
        readAT.newLastReply = readAT.newLastStatus;

        //chronological order
        var msg = bundle.getString("belowHaveBeenSettedAsAlreadyRead");
        readAT.separator = readAT.createLi("", msg, null);
        readAT.separator.firstChild.firstChild.appendChild(doc.createElement("br"));
        readAT.separator.id="RAT_separator";
        
        var RAT_settings_a2 = doc.createElement("a");
        RAT_settings_a2.setAttribute("class", "RAT_setting_link");
        var txt = doc.createTextNode(readAT.getShortAddonName(bundle)+" "+bundle.getString("settings"));
        RAT_settings_a2.appendChild(txt);
        RAT_settings_a2.addEventListener("click", 
            function(){ window.openDialog('chrome://readalltweets/content/readATOption.xul'); }, false);        
        
        readAT.separator.firstChild.firstChild.appendChild(RAT_settings_a2);
        readAT.stream.insertBefore(readAT.separator, first);
        
        readAT.finish(doc);
        return;
      }
      else readAT.newLastReply = readAT.getLastReply();

      for(var i=0; i < items.snapshotLength; i++){
        var status = readAT.getId(items.snapshotItem(i));
        if(status!=-1 && !readAT.aIsBiggerThanB(status, readAT.lastStatus)){
          readAT.start3(items.snapshotItem(i), false);
          return
        }
      }
  		
  		readAT.showProcessCount(doc);
      readAT.showNextPage(win, doc);
    }

},
getId : function(aElm){
	if(readAT.newTwitter==2){
//		Application.console.log(aElm.innerHTML)
		var content = aElm.getElementsByClassName("tweet")[0];
		if(!content) return null;
		if(content.getAttribute("class").indexOf("promoted-tweet")>-1) return -1;
		var id = content.getAttribute("data-retweet-id") || aElm.getAttribute("data-item-id");
		if(id.indexOf(":")>-1) return -1; 
		else return id;		
	}
	else{
		var content = aElm.getElementsByClassName("stream-item-content")[0];
		if(!content) return null;
		if(content.getAttribute("class").indexOf("promoted-tweet")>-1) return -1;
		var id = content.getAttribute("data-retweet-id") || aElm.getAttribute("data-item-id");
		if(id.indexOf(":")>-1) return -1; 
		else return id;		
	}
},
nodeInserted : function(aEvt){
    var elm = aEvt.target;
    if(elm.parentNode!=readAT.stream) return;
    readAT.notYetNextPageShown = false;
    readAT.stream.removeEventListener("DOMNodeInserted", readAT.nodeInserted, false);
    
    setTimeout(readAT.nodeInserted2, 10);
},
nodeInserted2 : function(){
	if(readAT.abort){
		readAT.start3(null, false);
		return
	}
  var doc = readAT.targetBrowser.contentDocument;
  var items = doc.evaluate("./*[contains(@class, 'stream-item')]",
      readAT.stream, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
  var elm = items.snapshotItem(items.snapshotLength-1);
  var status = readAT.getId(elm);

  if (readAT.aIsBiggerThanB(status, readAT.lastStatus)) {
		if (readAT.max && items.snapshotLength >= readAT.max) {
			readAT.start3(elm, false);
			return
		}
		//div[contains(@class, 'stream')]/div[contains(@class, 'component')]/div[contains(@class, 'stream-end')]
		readAT.showProcessCount(doc);
		var win = readAT.targetBrowser.contentWindow;
		readAT.showNextPage(win, doc);
		return;
	}
	else {
		for (var i = items.snapshotLength - 2; i > -1; i--) {
			elm = items.snapshotItem(i);
			status = readAT.getId(elm);
			if (readAT.aIsBiggerThanB(status, readAT.lastStatus)){
				readAT.start3(items.snapshotItem(i + 1), false);
				return;
			}
		}
	}
},
showProcessCount : function(doc){
	var countSpan = doc.getElementById("RAT_processing_count");
	var txt;
	if (countSpan) {
		countSpan.removeChild(countSpan.firstChild);
		txt = doc.createTextNode(++readAT.pageCount);
		countSpan.appendChild(txt);
	}
    var bundle = document.getElementById("readalltweets-bundle");    
	doc.title = bundle.getString("processing") + ' ('+readAT.pageCount+') '+readAT.originalTitle;
	return
},
showNextPage : function(win, doc){
  readAT.notYetNextPageShown = true;
  readAT.stream.addEventListener("DOMNodeInserted", readAT.nodeInserted, false);
  win.scrollTo(0, win.scrollMaxY);
	clearInterval(readAT.scTimeoutID)
  readAT.scTimeoutID = setTimeout(function(){readAT.scrollCheck(doc, 0)}, 500)
},
scrollCheck : function(doc, aCount){
	var win = doc.defaultView;

  if(readAT.notYetNextPageShown){
	if(readAT.abort){
		readAT.start3(null, false);
		return		
	}
	if (win.scrollY < win.scrollMaxY) {
		win.scrollTo(0, win.scrollMaxY);
		setTimeout(function(){
			readAT.scrollCheck(doc, 0)
		}, 500)
		return;
	}
	else{
	  /*
	  var streamEnd = doc.evaluate(".//div[contains(concat(' ',normalize-space(@class),' '), ' stream-end ')]",
	            doc.body, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null ).singleNodeValue;
		
	  var streamWhaleEnd = doc.evaluate(".//div[contains(@class, 'stream-whale-end')]",
        		  doc.body, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null ).singleNodeValue;
	  Application.console.log(streamWhaleEnd.style.display);
	  if(streamWhaleEnd && streamWhaleEnd.style.display != "none"){
    	  readAT.reloadTimeoutID = setTimeout(function(){
			  readAT.targetBrowser.reload();
		  }, 15000);
		  return
		}
		Application.console.log(streamEnd.style.display);
		if (streamEnd && streamEnd.style.display != "none") {
			if (aCount < 20) {
				setTimeout(function(){
					readAT.scrollCheck(doc, aCount + 1)
				}, 1000)
				return;
			}
			else {
				readAT.start3(null, true);
				return
			}
		}
		*/
//		else{
			if(aCount && aCount%10==0){
    	  var streamLoading = doc.evaluate(".//*[contains(@class, 'stream-loading')]",
	            doc.body, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null ).singleNodeValue;
        if(!streamLoading || streamLoading.style.display == "none"){
  				win.scrollBy(0, -win.innerHeight*2);
          setTimeout(function(){
    				win.scrollTo(0, win.scrollMaxY);					                    
          }, 1000)
        }
			}
			setTimeout(function(){
				readAT.scrollCheck(doc, aCount + 1)
			}, 500)
			return;				
//		}
	}
  }
  return
},
start3 : function(lastElm, failed){
  readAT.stream.removeEventListener("DOMNodeInserted", readAT.nodeInserted, false);
	readAT.notYetNextPageShown = false;

  var bundle = document.getElementById("readalltweets-bundle");    
  var doc = readAT.targetBrowser.contentDocument;
	doc.title = readAT.originalTitle;

  var items = doc.evaluate("./*[contains(@class, 'stream-item')]",
      readAT.stream, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );

  if(failed){
    var errorDiv = doc.createElement("div");
    errorDiv.setAttribute("class", "RAT_error");
    errorDiv.setAttribute("style", "display:block; font-size:15px; margin: 10px 15px;");
    var txt = doc.createTextNode(bundle.getString("notAllNewTweetsCouldBeFetched"));
    errorDiv.appendChild(txt);            

    var stabs = doc.evaluate(readAT.stabsXPath,
    doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
    if(stabs) stabs.parentNode.insertBefore(errorDiv, stabs);
	
	lastElm = items.snapshotItem(items.snapshotLength-1);
  }
    
  var msg = bundle.getString("belowAreAlreadyRead");
  var a = doc.createElement("a");
  a.href = "javascript:void(0);";
  a.addEventListener("click", function (event) { doc.defaultView.scroll(0, 0); return false; }, false);
  a.style.display = "block";
  a.style.cssFloat = "right";
  a.appendChild(doc.createTextNode( bundle.getString("goToTop") ));

  readAT.separator = readAT.createLi("", msg, a);
  readAT.separator.id="RAT_separator";
  readAT.separator.style.minHeight="40px";
  
  
  var first = items.snapshotItem(0);
  readAT.stream.insertBefore(readAT.separator, first);
  if(first==lastElm){
    readAT.unreadCount = 0;
  }
  else{
    readAT.unreadCount = 1;
    readAT.stream.insertBefore(first, readAT.separator);
    for(var i=1; i<items.snapshotLength; i++){
      if(items.snapshotItem(i)!=lastElm){
        readAT.stream.insertBefore(items.snapshotItem(i), items.snapshotItem(i-1));
        readAT.unreadCount++;
      }
      else break;
    }
  }
  var win = readAT.targetBrowser.contentWindow;

  var items = doc.evaluate("./*[contains(@class, 'stream-item')]",
      readAT.stream, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
  readAT.lastItemForEachPage = new Array();
  //separator 縺ｮ蛻�□縺托ｼ�縺励※縺ゅｋ
  for(var i=readAT.numOfTweetsEachPage+1; i<readAT.unreadCount; i+=readAT.numOfTweetsEachPage){
  	var item = items.snapshotItem(i);
    readAT.addClass(item, "last-on-page");
    readAT.lastItemForEachPage.push(item)
  }
  if(readAT.lastItemForEachPage.length){
    readAT.preY = win.pageYOffset;
    doc.addEventListener('scroll', readAT.showNextTweets, false);    
  }
  
	readAT.separatorHidden = false;
  win.scrollTo(0, 0);

  readAT.showUnreadCount();
  readAT.finish(doc);
  
  return
},
oauthAuthentication: function(){
  readAT.targetTab = gBrowser.selectedTab;
  readAT.apiContainer = new this.TwitterAPI()
	readAT.apiContainer.getRequestToken();
},
oauthFailed : function(){
  var bundle = document.getElementById("readalltweets-bundle");    
  var doc = readAT.targetBrowser.contentDocument;
  var oauthDiv = doc.getElementById("RAT_oauth");
  var txt = doc.createTextNode(bundle.getString("isFailed").replace("%S", bundle.getString("oauthAuthentication")));
   oauthDiv.appendChild(txt);
  return  
},
oauthSetting : function(atoken, atoken_secret){
	var oauthList = JSON.parse(this.Branch.getCharPref("oauth"));
      
	var user = readAT.user;
  oauthList[user] = {}
  oauthList[user]["atoken"] = atoken;
  oauthList[user]["atoken_secret"] = atoken_secret;
  
	this.Branch.setCharPref("oauth", JSON.stringify(oauthList));
  
  var bundle = document.getElementById("readalltweets-bundle");    
  var doc = readAT.targetBrowser.contentDocument;
  var oauthDiv = doc.getElementById("RAT_oauth");
  var txt = doc.createTextNode(bundle.getString("isSucceeded").replace("%S", bundle.getString("oauthAuthentication")));
  oauthDiv.appendChild(txt);
  oauthDiv.addEventListener("click", function(aEvt){
    var target = aEvt.target;
    target.parentNode.removeChild(target)
  }, false)
  //oauth is completed
  
  readAT.setOAuthFeatures();
},
setOAuthFeatures : function(){
  setTimeout(function(){readAT.showReplies();}, 1000);
	readAT.setCheckInterval();
//  readAT.replaceTweetButton();
},
replaceTweetButton : function(){
  var doc = readAT.targetBrowser.contentDocument;
  var tweetButton = doc.getElementsByClassName("tweet-button")[0]
//  var tweetButton = doc.evaluate(".//div[contains(@class, 'main-tweet-box')]/div/div[contains(@class, 'tweet-button-container')]/a[contains(@class, 'tweet-button')]",
//    doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
  if(!tweetButton) return
  
  var cls = tweetButton.getAttribute("class");
  var parent = tweetButton.parentNode;
//  parent.removeChild(tweetButton);
  tweetButton.style.display = "none";
  readAT.tweetButtonText = tweetButton.innerHTML;
  readAT.addClass(tweetButton, "original-tweet-button")
  readAT.originalTweetButton = tweetButton;
  
  var newTweetButton = doc.createElement("a");
  newTweetButton.setAttribute("class", cls);
  newTweetButton.href = "#";
  var txt = doc.createTextNode(readAT.tweetButtonText);
  newTweetButton.appendChild(txt);
  parent.appendChild(newTweetButton);
  
  newTweetButton.addEventListener("click", readAT.posting, false);
  
  var counter = doc.getElementsByClassName("tweet-counter")[0]
//  var counter = doc.evaluate(".//div[contains(@class, 'main-tweet-box')]/div/div[contains(@class, 'tweet-button-container')]/span[contains(@class, 'tweet-counter')]",//".//div[contains(@class, 'main-tweet-box')]/div/div[contains(@class, 'text-area')]/textarea",
//    doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
  counter.addEventListener("DOMNodeInserted", function(aEvt){
    var target = aEvt.target
    if(target.value=="140"){
      readAT.addClass(newTweetButton, "disabled")
    }
    else{
      readAT.removeClass(newTweetButton, "disabled");
    }
  }, false)
},
posting : function(){
  var doc = readAT.targetBrowser.contentDocument;
  
  //when sending DM
  if(readAT.originalTweetButton.innerHTML!=readAT.tweetButtonText){
    var $ = doc.defaultView.wrappedJSObject.jQuery;
    $('div.tweet-button-container a.original-tweet-button').click();
    
    return
  }
  
  var textbox = doc.getElementsByClassName("twitter-anywhere-tweet-box-editor")[0]
  if(!textbox.value) return
  var spinner = doc.getElementsByClassName("tweet-spinner")[0]
//  var spinner = doc.evaluate(".//div[contains(@class, 'main-tweet-box')]/div/div[contains(@class, 'tweet-button-container')]/img[contains(@class, 'tweet-spinner')]",
//    doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue; 
  spinner.style.display = ""; 
  readAT.apiContainer.updateStatus(textbox.value, '', function(data){
    spinner.style.display = "none";
    textbox.value = "";
  }) 
    
  return  
},
//	GM_log("1, "+readAT.getTime());
start2 : function(failed, pageCount, newLis, newTweetsCount, args){	
	var doc = readAT.targetBrowser.contentDocument;
	var bundle = document.getElementById("readalltweets-bundle");

	if(failed){
		var errorDiv = doc.createElement("div");
		errorDiv.setAttribute("class", "RAT_error");
		errorDiv.style.display ="block";
        readAT.ol.parentNode.insertBefore(errorDiv, readAT.ol);
        
        if(newLis.length){
        	var txt = doc.createTextNode(bundle.getString("notAllNewTweetsCouldBeFetched"));
        	errorDiv.appendChild(txt);            
        }
        else{
        	var txt = doc.createTextNode(bundle.getString("failedToGetNewTweets"));
        	errorDiv.appendChild(txt);
        	
            
            readAT.moreParent.appendChild(readAT.more);
            var processingDiv = doc.getElementById("RAT_processing");
            processingDiv.parentNode.removeChild(processingDiv);
            
            return
        }
	}
	

    //add separator
    var cls = "bulletin warning";
    var msg = bundle.getString("belowAreAlreadyRead")+
    ' <a href="javascript:void(0);" onclick="javascript:window.scroll(0, 0); return false;" style="display:block; float:right;">'+
    bundle.getString("goToTop")+"</a>";
    readAT.separator = readAT.createLi(cls, msg, null);
    readAT.separator.id="RAT_separator";

    if(newTweetsCount){
        readAT.lis = readAT.getLis(readAT.ol);
        var addedLis = new Array();
        var i = 0;
        while(readAT.lis[i] != newLis[0]){
            readAT.removeClass(readAT.lis[i], "buffered");
            addedLis[i] = readAT.lis[i];
            i++;
        }
        
        readAT.ol.insertBefore(readAT.separator, readAT.ol.firstChild);
		for(var j=newTweetsCount-1; j>-1; j--){
	        if(readAT.isReplie(newLis[j])){
	            readAT.addClass(newLis[j], "RAT_newReplies");
	        }
			readAT.ol.insertBefore(newLis[j], readAT.separator);
		}
        for(j=addedLis.length-1; j>-1; j--){
            if(readAT.isReplie(addedLis[j])){
                readAT.addClass(addedLis[j], "RAT_newReplies");
            }
            readAT.ol.insertBefore(addedLis[j], readAT.separator);
        }
        
		//譛ｪ隱ｭ縺ｧ縺ｪ縺�newLis
		for(var j=newTweetsCount; j<newLis.length; j++){
			readAT.ol.appendChild(newLis[j]);
		}
    }
    else readAT.ol.insertBefore(readAT.separator, readAT.ol.firstChild);

	readAT.moreParent.appendChild(readAT.more);
	readAT.more.href = readAT.more.href.replace(/&page=\d+/, "&page="+pageCount);

	readAT.unreadCount = newTweetsCount;
	
	readAT.lis = readAT.getLis(readAT.ol);    

	//separator 縺ｮ蛻�□縺托ｼ�縺励※縺ゅｋ
	if(readAT.lis.length > readAT.numOfTweetsEachPage+1){
		readAT.lastShownStatusesCount = readAT.numOfTweetsEachPage+1;
		
		var li = readAT.lis[readAT.numOfTweetsEachPage];
		while(li = li.nextSibling){
			if(li.nodeName!="LI") continue;
			readAT.addClass(li, "RAT_buffered");
		}
		var nextDiv = doc.createElement("div");
		nextDiv.id = "showNext";
		nextDiv.setAttribute("class", "more round");
		var txt = doc.createTextNode(bundle.getFormattedString("showNextTweets", [readAT.numOfTweetsEachPage]));
		nextDiv.appendChild(txt); 
		readAT.more.parentNode.appendChild(nextDiv);
		readAT.more.parentNode.removeChild(readAT.more);
		//nextDiv.addEventListener("click", readAT.showNextTweets, false);
		doc.addEventListener('scroll', readAT.showNextTweets, false);
	}
	
	if(readAT.separator.getAttribute("class").indexOf(" RAT_buffered")>-1) readAT.separatorHidden = true;

	//繧ｻ繝�す繝ｧ繝ｳ縺ｮ蠕ｩ蜈�↑縺ｩ縺ｧ髢九°繧後◆蝣ｴ蜷医�繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧ょｾｩ蜈�＆繧後ｋ縺溘ａ縲∽ｸ�分荳翫↓繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺吶ｋ縲�
	var win = readAT.targetBrowser.contentWindow;
	if(readAT.getOffsetTopBody(readAT.ol) < win.pageYOffset){
		win.scrollTo(0, 0);
	}

	readAT.showUnreadCount();
	readAT.finish(doc);
	readAT.showReplies();
	
	return;
},
finish : function(doc){
	var processingDiv = doc.getElementById("RAT_processing");
	if(processingDiv) processingDiv.parentNode.removeChild(processingDiv);

  if(readAT.newTwitter){
//  	var oauthList = JSON.parse(this.Branch.getCharPref("oauth"));
        
//  	var user = readAT.user;
  
  /*
    if(!oauthList[user]){
      var bundle = document.getElementById("readalltweets-bundle");
      
    	var oauthA = doc.createElement("a");
    	oauthA.id = "RAT_oauth_link";
    	oauthA.href = "javascript:void(0);";
    	oauthA.appendChild(doc.createTextNode(  bundle.getString("oauthAuthentication") ));
    	oauthA.addEventListener("click", function(){
        readAT.oauthAuthentication()
      }, false);
  	
      var oauthDiv = doc.createElement("div");
      oauthDiv.id = "RAT_oauth"
      oauthDiv.setAttribute("class", "RAT_alert");
      oauthDiv.setAttribute("style", "display:block; font-size:15px; margin: 10px 15px;")
      var oauthMessage = bundle.getString("youNeedOAuthToEnableNotifications");
      oauthMessage.match(/(.*?)%S(.*)/);
      oauthDiv.appendChild(doc.createTextNode(RegExp.$1));
      oauthDiv.appendChild(oauthA);
      oauthDiv.appendChild(doc.createTextNode(RegExp.$2));
  
      var stabs = doc.evaluate(".//ul[contains(@class, 'stream-tabs')]",
      doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
      stabs.parentNode.insertBefore(oauthDiv, stabs);
  		
    	//oauthList[user] = {};
    }
    else{
      var atoken = oauthList[user]["atoken"];
      var atoken_secret = oauthList[user]["atoken_secret"];    
      
      readAT.apiContainer = new this.TwitterAPI(atoken, atoken_secret)
      readAT.setOAuthFeatures();
    }    
*/
  }
	readAT.setHTMLChange(doc);

	if(!readAT.newTwitter){
    readAT.lastUpdateTime = readAT.getNow();
    readAT.nowTwitterUpdating = false;
		readAT.setCheckInterval();
  }
  else {
    var target = doc.getElementById("new-tweets-bar")
		if(target && target.innerHTML){
      target.style.display = "none";
      readAT.updateStatuses(target)      
    }    
 		var docDiv = doc.getElementById("doc");
    setTimeout(function(){docDiv.addEventListener("DOMAttrModified", readAT.bodyIdObserver, false);}, 5000);    
  }
/*
//Updates when user posts
	readAT.nowUpdatingWhenUserPosts = false;
    var ptUpdateButton = doc.getElementById('tweeting_button') || doc.getElementById('update-submit');
    if(ptUpdateButton)
    	ptUpdateButton.addEventListener('click', function(){
    	readAT.nowUpdatingWhenUserPosts=true;
//        clearInterval(readAT.updateSetTimeout);
//        readAT.updateSetTimeout = 
        setTimeout(function(){readAT.showNewStauses();readAT.nowUpdatingWhenUserPosts=false;}, 500);
    	}, true);
*/
	return;	
},
getNow : function(){
	var dd = new Date();
	return dd.getTime();
},
setHTMLChange : function(doc){
  var bundle = document.getElementById("readalltweets-bundle");
    
	var moveToUnread = doc.createElement("a");
	moveToUnread.id = "RAT_moveToUnreadTweets";
	moveToUnread.href = "javascript:void(0);";
	var txt = doc.createTextNode(bundle.getString("moveToUnreadTweets"));
	moveToUnread.appendChild(txt);
	moveToUnread.addEventListener("click", readAT.moveToUnreadTweets, false);
    if(readAT.newTwitter){
            moveToUnread.setAttribute("style", "display:block; float:right;font-size:15px; padding: 12px;")
 
            var stabs = doc.evaluate(readAT.stabsXPath,
        doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
       if(stabs)  stabs.parentNode.insertBefore(moveToUnread, stabs);

        //readAT.streamParent = readAT.stream.parentNode;
//        alert(readAT.newTweetsBarParent.id);
        readAT.newTweetsBarParent.addEventListener('DOMNodeInserted', readAT.updateCheck, false);
    }
   
    

	return;
},
removeHTMLChange : function(doc){
  var RAT_alreadyOpened = doc.getElementById("RAT_alreadyOpened");
  if(RAT_alreadyOpened){
      RAT_alreadyOpened.parentNode.removeChild(RAT_alreadyOpened);
      return
  }
    
  var RAT_moveToUnreadTweets = doc.getElementById("RAT_moveToUnreadTweets");
	if(RAT_moveToUnreadTweets) RAT_moveToUnreadTweets.parentNode.removeChild(RAT_moveToUnreadTweets);

  var new_results_notification = doc.getElementById("new_results_notification");
  if(new_results_notification) new_results_notification.firstChild.style.display ="block";
    
	var css = doc.getElementById("RAT_CSS");
	if(css) css.parentNode.removeChild(css);

  readAT.clearCheckInterval();

  //readAT.streamParent.removeEventListener('DOMNodeInserted', readAT.updateCheck, false);
  if (!readAT.newTwitter) doc.body.removeEventListener('DOMNodeInserted', readAT.updateCheck, false);

},
moveToUnreadTweets : function(){
	if(!readAT.alreadyReadLi) return;
	readAT.targetBrowser.contentWindow.
		scroll(0, readAT.getOffsetTopBody(readAT.alreadyReadLi/*.nextSibling*/));
},
getLastStatus : function(){
	var lastStatusList = JSON.parse(this.Branch.getComplexValue("lastStatus",
      Components.interfaces.nsISupportsString).data);
	
  if(readAT.listname){
  	var tmp = readAT.listname.split("/");
  	var user = tmp[0];
  	var list = tmp[1];
  }
  else{
  	var user = readAT.user;
  	var list = "/all";
  }
  if(!lastStatusList[user] || !lastStatusList[user][list]){
	  return 0;
  }
  
  var lastStatus = lastStatusList[user][list];
  return lastStatus;    
},
setLastStatus : function(lastStatus){
	if(!lastStatus) return;
	var lastStatusList = JSON.parse(this.Branch.getComplexValue("lastStatus",
      Components.interfaces.nsISupportsString).data);
      
  if(readAT.listname){
  	var tmp = readAT.listname.split("/");
  	var user = tmp[0];
  	var list = tmp[1];
  }
  else{
  	var user = readAT.user;
  	var list = "/all";
  }

  if(!lastStatusList[user]){
  	lastStatusList[user] = {};
  }
  
  lastStatusList[user][list]=lastStatus;

	var str = Components.classes["@mozilla.org/supports-string;1"]
	      .createInstance(Components.interfaces.nsISupportsString);
	str.data = JSON.stringify(lastStatusList);
	this.Branch.setComplexValue("lastStatus", 
	      Components.interfaces.nsISupportsString, str);
	
	return
},
getLastReply : function(){
	var lastReplyList = JSON.parse(this.Branch.getCharPref("lastReply"));
	
  if(!lastReplyList[readAT.user]){
  	readAT.setLastReply(readAT.lastStatus);
  	return readAT.lastStatus;
  }
  return lastReplyList[readAT.user];
},
setLastReply : function(lastStatus){
//	alert(lastStatus);
	if(!lastStatus) return;
//	alert("lastStatus");
	var lastReplyList = JSON.parse(this.Branch.getCharPref("lastReply"));
      
  lastReplyList[readAT.user]=lastStatus;

	this.Branch.setCharPref("lastReply", JSON.stringify(lastReplyList));
	
	return
},
getLastDM : function(){
	var lastDMList = JSON.parse(this.Branch.getCharPref("lastDM"));

  if(!lastDMList[readAT.user]){
		return -1;
  }
    
  var lastDM = lastDMList[readAT.user];
    
  return lastDM;
},
setLastDM : function(lastDM){
	if(!lastDM) return;
	var lastDMList = JSON.parse(this.Branch.getCharPref("lastDM"));
      
  lastDMList[readAT.user] = lastDM;

	this.Branch.setCharPref("lastDM", JSON.stringify(lastDMList));
	
	return
},
getTime : function(){
	var dd = new Date();
	var h = dd.getHours();
	var m = dd.getMinutes();
//	var s = dd.getSeconds();
	if(h<10) h='0'+h;
	if(m<10) m='0'+m;
//	if(s<10) s='0'+s;

	return h+':'+m;
},
showNextTweets : function(){
//GM_log("hideTweets.length:"+readAT.hideTweets.length+" readAT.lis.length:"+readAT.lis.length)
	var doc = readAT.targetBrowser.contentDocument;
	var win = readAT.targetBrowser.contentWindow;
	
  if (readAT.newTwitter) {
    var scroll = win.pageYOffset - readAT.preY;
    readAT.preY = win.pageYOffset;
    if (scroll > 0 && scroll < win.innerHeight) {
      var top = readAT.getOffsetTopBody(readAT.lastItemForEachPage[0].nextSibling);
      if (top < win.pageYOffset) {
        var item = readAT.lastItemForEachPage.shift();
        while(true){
	        var id = readAT.getId(item);
	        if(id>-1){
		        readAT.setLastStatus(id);        	
		        break;	        	
	        }
	        item = item.previousSibling;
        }
        readAT.alreadyReadLi = item;

				readAT.unreadCount -= readAT.numOfTweetsEachPage;
				readAT.showUnreadCount();
        
        if(!readAT.lastItemForEachPage.length){
          doc.removeEventListener('scroll', readAT.showNextTweets, false);                    
        }
      }
    }
  }
  else{
  	var nextDiv = doc.getElementById("showNext");
		var top = readAT.getOffsetTopBody(nextDiv);
		if(top < win.pageYOffset || top > win.pageYOffset + win.innerHeight) return;
		
		doc.removeEventListener('scroll', readAT.showNextTweets, false);

		readAT.lis = readAT.getLis(readAT.ol);
			
	    for(var i=0; i<readAT.lis.length; i++){
	        if(readAT.includeClass(readAT.lis[i], "RAT_buffered")) break;
	    }
	    var lastLi = readAT.lis[i-1];
		readAT.addClass(lastLi, "last-on-page");	
		if(readAT.separatorHidden){
			//Read All Tweets 縺九ｉ縺ｮ繝｡繝�そ繝ｼ繧ｸ莉･螟悶↑繧峨�
			var li = lastLi;
			while(li.nodeName!="LI" || li.getAttribute("class").indexOf(" RATMessage")>-1){
				li = li.previousSibling;
			}
			readAT.setLastStatus(li.id.replace("status_",""));
			
			readAT.unreadCount -= readAT.lastShownStatusesCount;
			readAT.showUnreadCount();
		}
	//	setTimeout(function(){
		
		readAT.lastShownStatusesCount = 0;
		var finished = false;
		var li = lastLi;
		for(var i=0; i<readAT.numOfTweetsEachPage; i++){
			li = li.nextSibling;
			if(!li){
				finished = true;
				break;
			}
			if(li.nodeName!="LI"){
				i--;
				continue;
			}
			
			if(li.getAttribute("class").indexOf(" RATMessage")==-1) readAT.lastShownStatusesCount++;
			readAT.removeClass(li, "RAT_buffered");
		}
		if(readAT.separator.getAttribute("class").indexOf(" RAT_buffered")==-1) readAT.separatorHidden = false;
		if(finished || !li.nextSibling){
			nextDiv.parentNode.appendChild(readAT.more);
			nextDiv.parentNode.removeChild(nextDiv);
		}
		else{
			doc.addEventListener('scroll', readAT.showNextTweets, false);
		}
    }
    //	}, 50);
},
addClass : function(aElem, aClass){
	aElem.setAttribute("class", aElem.getAttribute("class")+" "+aClass);
	return;
},
removeClass : function(aElem, aClass){
	aElem.setAttribute("class", (" "+aElem.getAttribute("class")+" ").replace(" "+aClass+" "," "));
	return;
},
includeClass : function(aElem, aClass){
	var cls = " "+aElem.getAttribute("class")+" ";
	return (cls.indexOf(" "+aClass+" ")>-1);	
},
showUnreadCount : function(){
	var doc = readAT.targetBrowser.contentDocument;
	var title = doc.getElementsByTagName("title")[0];
	if(readAT.newTwitter){
		title.removeEventListener("DOMNodeInserted", readAT.showUnreadCount, false)
	}
	
	if(readAT.unreadCount){
		if(doc.title.match(/^\(\d+\)\s/)) doc.title = doc.title.replace(RegExp.lastMatch, '('+ readAT.unreadCount + ') ');
		else doc.title = '('+ readAT.unreadCount + ') '+  readAT.originalTitle;
		//doc.title ='_'+doc.title

		doc.addEventListener('scroll', readAT.resetUnreadCount, false);
		doc.addEventListener('mouseover', readAT.resetUnreadCount, false);

    var win = doc.defaultView;
    win.addEventListener("focus", readAT.resetUnreadCount, false);
    /*
    win.addEventListener("blur", readAT.resetUnreadCount, false);
    doc.addEventListener("blur", readAT.resetUnreadCount, false);
    doc.body.addEventListener("blur", readAT.resetUnreadCount, false);
*/
		if(readAT.alreadyReadLi && !readAT.includeClass(readAT.alreadyReadLi, "last-on-refresh")){
			readAT.addClass(readAT.alreadyReadLi, "last-on-refresh");
		}
		if(readAT.newTwitter){
			title.addEventListener("DOMNodeInserted", readAT.showUnreadCount, false)			
		}
	}
	else{
		if(doc.title.match(/^\(\d+\)\s/)) doc.title = doc.title.replace(RegExp.lastMatch, '');
	}

	return;
},
updateCheck : function(aEvent){
    var target = aEvent.target;
    if(readAT.newTwitter){
//  		if(target.innerHTML) Application.console.log(target.innerHTML)
//	  var firstItem = doc.evaluate(readAT.newTweetsBarXPath,
//	    doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;

    	//.parentNode!=readAT.newTweetsBarParent
    	
//		Application.console.log(target.getAttribute("class"));
	if(readAT.newTwitter==2){
	  	var doc =  readAT.targetBrowser.contentDocument;
  	    var tmp = doc.evaluate(".//div[contains(@class, 'new-tweets-bar')]",
  		        doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;

				//var tmp = doc.getElementsByClassName("new-tweets-bar");
if(tmp==null) return;
		//if(tmp.length==0) return;
//		Application.console.log("CCC");
		//
	} 
  	　　if((readAT.newTwitter==1 && target.id!="new-tweets-bar")) return;//pre:.parentNode!=readAT.stream.parentNode
      //  target.style.display = "none";
      setTimeout(function(){readAT.updateStatuses(target)}, 100);
    }
    else{
  		if(target.id!="results_update") return;
	
	    readAT.nowTwitterUpdating = true;
	  	setTimeout(function(){readAT.updateStatuses(target)}, 10);
    }
},
updateStatuses : function(target){	
    if(readAT.newTwitter){
//    	alert("a")
//      Application.console.log("b")
//		Application.console.log(readAT.stanbyed+" "+(readAT.getNow()-readAT.preRecodedTime)+" "+readAT.getNow()+" "+readAT.preRecodedTime)
      if(readAT.stanbyed || readAT.getNow()-readAT.preRecodedTime > readAT.intervalThresholdread){
//        readAT.preRecodedTime = now;
        if(!navigator.onLine){
          BrowserOffline.toggleOfflineStatus();
        }
  			readAT.stanbyed = false;
/* reload when restored */

				readAT.targetBrowser.reload(Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE);
				return

        /*
  			
  			//Application.console.log(count)
  			if (count == 20) {
  			}
  			*/
      }

      var doc = readAT.targetBrowser.contentDocument;
//      var win = doc.defaultView;
//      var unsafeWindow = win.wrappedJSObject;
//      var $ = unsafeWindow.jQuery;

 //     var $= content.window.wrappedJSObject.jQuery
      /*
	  var tmp = doc.getElementsByClassName("new-tweets-bar");
	  if(tmp.length==0) return;
	    */
	  var tmp = doc.evaluate(".//div[contains(@class, 'new-tweets-bar')]",
  		        doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
		
	  if(tmp==null) return;
	  
	  if(tmp.getAttribute("data-item-count")=="20" || tmp.getAttribute("data-item-count")=="19"){
		  readAT.targetBrowser.reload(Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE);
	      return
   	  }
	  
	  readAT.newTweetsBarParent.addEventListener("DOMNodeInserted", readAT.hideTweet, false);
	  tmp.click();
   	  //  tmp[0].click();
		
      
	    setTimeout(function(){
        readAT.updateStatuses2(doc)
/*
        try{
          target.parentNode.removeChild(target);
        }
        catch(e){
          
        }      
        */
  		}, 100);    
	  	return
    }
    else{
  		readAT.lis = readAT.getLis(readAT.ol);
	
	/*
	    readAT.lastStatus = readAT.newLastStatus;
		var count = target.innerHTML.match(/\d+/);
		
		var newLis = new Array();
		for(var i=0; i<readAT.lis.length; i++){
			if(!readAT.includeClass(readAT.lis[i],"buffered")){
				if(readAT.includeClass(readAT.lis[i], "mine")){
					var status = readAT.lis[i].id.replace("status_", "");
					if(status<=readAT.lastStatus) break; 
				}
				else break;
			}
			newLis[i] = readAT.lis[i];
			readAT.addClass(newLis[i], "RAT_buffered");
			var a = newLis[i].getElementsByTagName("a");
			for(var j=0; j<a.length; j++){
				a[j].setAttribute("target", "_blank");
			}
		}
	    var newTweetsCount = i;
	*/
	    //Twitter 蛛ｴ縺ｮ繧｢繝��繝��繝医�荳榊�蜷医′襍ｷ縺薙ｋ蜿ｯ閭ｽ諤ｧ縺後≠繧九◆繧√�縺薙■繧峨�繧｢繝��繝��繝医�蜑企勁縺励�繧｢繝峨が繝ｳ蛛ｴ縺ｮ繧｢繝��繝��繝医�縺ｿ驕ｩ逕ｨ
	    var newTweetsCount = 0;
	    for(var i=0; i<readAT.lis.length; i++){
	        if(!readAT.includeClass(readAT.lis[i],"buffered")){
	            if(readAT.includeClass(readAT.lis[i], "mine")){
	                var status = readAT.lis[i].id.replace("status_", "");
	                if(status<=readAT.newLastStatus) break; 
	            }
	            else break;
	        }
	    }
	    newTweetsCount = i;
	    
	    var evt = document.createEvent( "MouseEvents" ); // 繝槭え繧ｹ繧､繝吶Φ繝医ｒ菴懈�
	    evt.initEvent("click", false, true ); // 繧､繝吶Φ繝医�隧ｳ邏ｰ繧定ｨｭ螳�
	    target.dispatchEvent( evt ); // 繧､繝吶Φ繝医ｒ蠑ｷ蛻ｶ逧�↓逋ｺ逕溘＆縺帙ｋ
	
	    for(var i=0; i<newTweetsCount; i++){
	        readAT.ol.removeChild(readAT.lis[i]);
	    }
	    readAT.showUnreadCount();
	    readAT.nowTwitterUpdating = false;
/*  //繧｢繝峨が繝ｳ蛛ｴ縺ｧ譖ｴ譁ｰ縺励※繧句�蜷医�縲√％縺｡繧峨�Tweets 縺ｯ豸亥悉縺吶ｋ縲�
    if(readAT.nowFetchingNewStatuses || readAT.nowUpdatingWhenUserPosts){
        for(var i=0; i<newLis.length; i++){
            readAT.ol.removeChild(newLis[i]);
        }
        return;
    }
    //Twitter 蛛ｴ縺ｮ譛�､ｧ譖ｴ譁ｰ莉ｶ謨ｰ莉･荳翫�譁ｰ逹�匱險�′縺ゅｋ蝣ｴ蜷医�蜑企勁縺励※繧｢繝峨が繝ｳ蛛ｴ縺ｧ譖ｴ譁ｰ縲�
    if(count==readAT.max_refresh_size){
        for(var i=0; i<newLis.length; i++){
            readAT.ol.removeChild(newLis[i]);
        }
        readAT.twitterUpdateIsWorking = false;
        readAT.showNewStauses();
        
        return;     
    }
*/
/*
    var j=newTweetsCount-1;
    while(true){
        if(newLis[j]){
            if(readAT.includeClass(newLis[j], "last-on-refresh")){
                readAT.removeClass(newLis[j], "last-on-refresh");
                break;
            }
        }
        else break
        j--;
    }
    readAT.showNewStauses2(false, null, newLis, newTweetsCount);
*/
    }
    return;
},
hideTweet : function(aEvt){
// Application.console.log("c")
  var elm = aEvt.target
 // if(elm.parentNode!=readAT.stream) return;
//  Application.console.log(elm.getAttribute("class"));
  if (!readAT.includeClass(elm,  "stream-item")) return;
  
  readAT.addClass(elm, "RAT_buffered");
},
updateStatuses2 : function(doc){
  readAT.newTweetsBarParent.removeEventListener("DOMNodeInserted", readAT.hideTweet, false);
//      Application.console.log("d")
	//return previous new tweets to original color
	if(!readAT.unreadCount){
    var preNewStatuses = doc.getElementsByClassName("RAT_newTweets");
    while(preNewStatuses.length){
        readAT.removeClass(preNewStatuses[0], "RAT_newTweets");
    }
    var preNewReplies = doc.getElementsByClassName("RAT_newReplies");
    while(preNewReplies.length){
        readAT.removeClass(preNewReplies[0], "RAT_newReplies");
    }
  }

//	var newLis = doc.getElementsByClassName("RAT_buffered");
  var items = doc.evaluate("./*[contains(@class, 'stream-item')]",
      readAT.stream, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );

  var li, preLi, id;
	var newTweetsCount = 0;
	var selfTweetsCount = 0;
  for(var i=0; i<items.snapshotLength; i++){
    li = items.snapshotItem(i);
  	if(li.id=="RAT_separator") continue;
    id = readAT.getId(li);
    if(!id || (id>-1 && !readAT.aIsBiggerThanB(id, readAT.newLastStatus))) break;
    
    readAT.removeClass(li, "last-new-tweet");
		var tmp = li.getElementsByClassName("stream-item-content");
		if(tmp.length && tmp[0].getAttribute("data-screen-name")==readAT.user) selfTweetsCount++;
		else{
      if(readAT.isReplie(li)){
/*
          li = doc.getElementById(li.id);
          if(li && li.parentNode == readAT.ol){
              if(!readAT.includeClass(li, "buffered")){
                  newTweetsCount--;
                  continue;
              }
              else{
                  li.parentNode.removeChild(li);
              }
          }
*/
          readAT.addClass(li, "RAT_newReplies");
      }
      else readAT.addClass(li, "RAT_newTweets");
    }
//		Application.console.log(li.style.display);
		li.style.display = "block";
		
    readAT.removeClass(li, "RAT_buffered");
    if(preLi) readAT.stream.insertBefore(li, preLi);
    else readAT.stream.insertBefore(li, readAT.separator);
    
    preLi = li;
	}
  newTweetsCount = i;

	if(newTweetsCount){
		var i=0;
		var id;
		while(true){
			id = readAT.getId(items.snapshotItem(i++));
			if(id!=-1) break; 
		}
		readAT.newLastStatus = id;
	}

	readAT.unreadCount += newTweetsCount - selfTweetsCount;
	if(selfTweetsCount && !readAT.unreadCount) readAT.setLastStatus(readAT.newLastStatus)
	readAT.showUnreadCount();
	readAT.autoMovingToUnreadTweets();	
},
resetUnreadCount : function(){
	var doc = readAT.targetBrowser.contentDocument;
	var win = doc.defaultView;

	if(readAT.separatorHidden) return;
	if(gBrowser.selectedBrowser != readAT.targetBrowser) return;
	
	readAT.separator = doc.getElementById("RAT_separator");
	
	var top = readAT.getOffsetTopBody(readAT.separator.firstChild);
//	var height = separator.offsetHeight;
//	GM_log(window.pageYOffset + " " +top+ " " + window.innerHeight);

	if(top < win.pageYOffset || top > win.pageYOffset + win.innerHeight) return;

	
	readAT.unreadCount = 0;
  readAT.preAlreadyReadLi = readAT.alreadyReadLi;
	readAT.alreadyReadLi = readAT.separator.previousSibling;
	readAT.showUnreadCount();

	doc.removeEventListener('scroll', readAT.resetUnreadCount, false);
	doc.removeEventListener('mouseover', readAT.resetUnreadCount, false);
  win.removeEventListener("focus", readAT.resetUnreadCount, false);
  /*
  win.removeEventListener("blur", readAT.resetUnreadCount, false);
  */
  doc.removeEventListener('scroll', readAT.showNextTweets, false);                    
	
	readAT.setLastStatus(readAT.newLastStatus);
	readAT.setLastReply(readAT.newLastReply);
	readAT.setLastDM(readAT.newLastDM);

	return;
},
getOffsetTopBody : function(elem){
	var top = elem.offsetTop;
	var parentElem = elem.offsetParent;
	while(parentElem.tagName != "BODY"){
		top += parentElem.offsetTop;
		parentElem = parentElem.offsetParent;
	}
	return top;
},
/*
getStatusesInit : function(uri, moreId, lastStatus, pageKind, pageId, returnFunc, args){
	readAT.getStatuses(uri, moreId, lastStatus, pageKind, pageId, returnFunc, new Array(), 0, args, 0);	
},
getStatuses : function(uri, moreId, lastStatus, pageKind, pageId, returnFunc, newLis, newTweetsCount, args, failedCount){
    if(readAT.pageId!=pageId) return;
    
    if(args["max"] && newTweetsCount >= args["max"]){
        args["noIncrement"] = true;
        readAT.getStatusesFinish(false, uri, returnFunc, newLis, newTweetsCount, pageId, args);
        return;
    }

    if(args["doc"]) var doc = args["doc"];
    else var doc = readAT.targetBrowser.contentDocument;
    
    if(!doc){
        readAT.clearCheckInterval();
        return;
    }
    	
    var countSpan = doc.getElementById("RAT_processing_count");
	if(countSpan){
	    uri.match(/[?&]page=(\d+)/);
	    var pageCount = RegExp.$1 - 0;
	    countSpan.appendChild(doc.createTextNode(pageCount));
	}

	var req = new XMLHttpRequest();
	req.open('GET', uri, true);
	req.overrideMimeType('text/xml');
    
	req.onreadystatechange = function (aEvt) {
	  if (req.readyState == 4) {
	     if(req.status == 200){
			//謨ｴ蠖｢蠑上↓縺ｪ縺｣縺ｦ縺ｪ縺�→繧ｨ繝ｩ繝ｼ縺悟�繧具ｼ�T&T縺ｪ縺ｩ��′蜷ｫ縺ｾ繧後※縺�ｋ隱槭′豬∬｡後�繝医ヴ繝�け縺ｫ蜈･縺｣縺ｦ繧句�蜷茨ｼ牙庄閭ｽ諤ｧ縺後≠繧九�縺ｧ縲〉esponseXML 縺ｧ縺ｯ縺ｪ縺�responseText 縺ｧ縺�￥
			var res = req.responseText.replace(/[\n\r]/g, " ");
			
			//body 縺ｮ id 縺九ｉ縲�←蛻�↑繝壹�繧ｸ繧貞叙蠕励〒縺阪※繧九°繧呈､懆ｨｼ
			var re = new RegExp('<body [^>]* id="([^"]*)');
			res.match(re);
			var bodyId = RegExp.$1;
			if(pageKind!=bodyId){
	           if(failedCount<3){
	                setTimeout(function(){
	                    readAT.getStatuses(uri, moreId, lastStatus, pageKind, pageId, returnFunc, newLis, newTweetsCount, args, failedCount+1);
	                }, 10000);
	            }
	            else{
	                //荳�Κ縺ｮ逋ｺ險��蜿門ｾ励〒縺阪◆蝣ｴ蜷医ｂ縲∽ｽ輔ｂ蜿門ｾ励〒縺阪↑縺九▲縺溷�蜷医→蜷後§謇ｱ縺�↓縺吶ｋ
	                readAT.getStatusesFinish(true, uri, returnFunc, new Array(), 0, pageId, args);                    
	                //readAT.getStatusesFinish(true, uri, returnFunc, newLis, newTweetsCount, pageId);
	            }
		     	return;
			}
			
			var tmpOl = readAT.getOl(res, "timeline");
			var tmpLis = readAT.getLis(tmpOl);
			
			if(!tmpLis.length){
				var failed = (uri!=readAT.getUrlFor("replies"));
				readAT.getStatusesFinish(failed, uri, returnFunc, newLis, newTweetsCount, pageId, args);
				return;
			}
			var preLength = newLis.length;
			for(var i=0; i<tmpLis.length; i++){
				newLis[preLength+i] = tmpLis[i];
			}
			

			while(true){
//				alert(readAT.newTweetsCount + " \n" + readAT.newLis[readAT.newTweetsCount].innerHTML)
				var status = newLis[newTweetsCount].getAttribute("id").replace("status_", "");
//status 縺碁←蛻�↓蜿門ｾ励〒縺阪↑縺九▲縺溷�蜷�
				if(status==0){
			     	readAT.getStatusesFinish(true, uri, returnFunc, newLis, newTweetsCount, pageId, args);
					return;
				}

				if(!readAT.aIsBiggerThanB(status, lastStatus)){
					break;
				}
				else{
					newTweetsCount++;
					if(!newLis[newTweetsCount]){
                        var span = doc.createElement("span");
						var re = new RegExp('<a [^>]*id="'+moreId+'"[^>]*>[^<]*<\/a>');
						 readAT.replaceHTML(span, res.match(re));
						
						if(!span.innerHTML){
              var failed = (lastStatus>0);
							readAT.getStatusesFinish(failed, uri, returnFunc, newLis, newTweetsCount, pageId, args);
							return;
						}
		
						var nextUri = span.firstChild.href;
						
						readAT.getStatuses(nextUri, moreId, lastStatus, pageKind, pageId, returnFunc, newLis, newTweetsCount, args, failedCount);
						return;
					}
				}
			}

	     	readAT.getStatusesFinish(false, uri, returnFunc, newLis, newTweetsCount, pageId, args);
		  	return;
	     }
	     else{
           if(failedCount<3){
                setTimeout(function(){
                    readAT.getStatuses(uri, moreId, lastStatus, pageKind, pageId, returnFunc, newLis, newTweetsCount, args, failedCount+1);
                }, 10000);
	     	}
	     	else{
                //荳�Κ縺ｮ逋ｺ險��蜿門ｾ励〒縺阪◆蝣ｴ蜷医ｂ縲∽ｽ輔ｂ蜿門ｾ励〒縺阪↑縺九▲縺溷�蜷医→蜷後§謇ｱ縺�↓縺吶ｋ
                readAT.getStatusesFinish(true, uri, returnFunc, new Array(), 0, pageId, args);
         	}
	     	return;
	     }
	  }
	};
    req.setRequestHeader("If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT");
	req.send(null);
	
},
getStatusesFinish : function(failed, uri, returnFunc, newLis, newTweetsCount, pageId, args){
//	//譁ｰ隕冗匱險�ｒ蜿門ｾ励＠繧医≧縺ｨ縺励※縺�ｋ縺ｨ縺阪↓縲�twitter 閾ｪ菴薙�繧｢繝��繝��繝域ｩ溯�縺悟ロ縺榊ｧ九ａ縺溘↑繧峨�荳ｭ豁｢縲�
//	if(uri.indexOf("http://twitter.com/replies")==-1 && readAT.twitterUpdateIsWorking) return;
	if(readAT.pageId!=pageId) return;

    if(args["max"] && newTweetsCount >= args["max"]){
        newTweetsCount = args["max"];
    }

	for(var i=0; i<newLis.length; i++){
		var a = newLis[i].getElementsByTagName("a");
		for(var j=0; j<a.length; j++){
			a[j].setAttribute("target","_blank");
		}
	}
	
	uri.match(/[?&]page=(\d+)/);
	var pageCount = RegExp.$1;
	if(!pageCount) pageCount = 1;
	if(!args["noIncrement"]) pageCount++;

	returnFunc(failed, pageCount, newLis, newTweetsCount, args);
	return;
},
*/
showNewStauses : function(){
	//繝�く繧ｹ繝医お繝ｪ繧｢縺ｫ繝輔か繝ｼ繧ｫ繧ｹ荳ｭ縺ｪ繧牙ｾ後↓
	var focusNode = gBrowser.selectedBrowser.contentDocument.activeElement;
	if(readAT.onceCanceled){
		readAT.onceCanceled = false;
	}
	else if(focusNode && (focusNode.tagName=="TEXTAREA" || 
		(focusNode.tagName=="INPUT" && focusNode.getAttribute("type")=="TEXT"))){
			
			readAT.onceCanceled = true;
			setTimeout(readAT.showNewStauses, readAT.checkInterval/2)
			return;
	}
    if(readAT.nowTwitterUpdating){
        setTimeout(readAT.showNewStauses, 1000);
        return;
    }
/*
	if(!readAT.nowUpdatingWhenUserPosts && readAT.twitterUpdateIsWorking){
		//繧ゅ＠20蛻�ｻ･荳頑峩譁ｰ縺瑚｡後ｏ繧後※縺ｪ縺�↑繧峨�Twitter縺ｮ閾ｪ蜍輔い繝��繝��繝域ｩ溯�縺悟ロ縺�※縺ｪ縺�→蛻､譁ｭ縺励�繧ｳ繝ｼ繝峨°繧芽�蜍輔い繝��繝��繝医ｒ陦後≧縲�
		if(readAT.getNow()-readAT.lastUpdateTime>readAT.Branch.getIntPref("general.checkIntervalOfNewTweets")*2*60000){
			readAT.twitterUpdateIsWorking = false;
		}
		else return;
	}
	readAT.nowFetchingNewStatuses = true;
*/	

    var args = {};
    if(readAT.Branch.getBoolPref("general.showOnlyTheMostRecentTweets")){
        args["max"] = readAT.Branch.getIntPref("general.maximumNumberOfFetchedTweets");
    }
    
    if(readAT.listname){
		var uri = readAT.getUrlFor(readAT.listname);
		var pageKind = "list_show";
	}
	else{
		var uri = readAT.getUrlFor("home");
		var pageKind = "home";
	}
	readAT.lastStatus = readAT.newLastStatus;
	readAT.getStatusesInit(uri, "more", readAT.lastStatus, pageKind, readAT.pageId, readAT.showNewStauses2, args);
},
showNewStauses2 : function(failed, pageCount, newLis, newTweetsCount, args){
	readAT.lastUpdateTime = readAT.getNow();
	
	var doc = readAT.targetBrowser.contentDocument;

	readAT.separator = doc.getElementById("RAT_separator");

	readAT.lis = readAT.getLis(readAT.ol);

	for(var i=0; i<readAT.lis.length; i++){
		var cls = readAT.lis[i].getAttribute("class");
		if(!cls) break;
		if(cls.indexOf(" RAT_buffered")>-1) break;
		if(cls.indexOf(" mine")==-1) break;

		if(readAT.aIsBiggerThanB(readAT.lis[i].id.replace("status_", ""), readAT.lastStatus)){
			readAT.ol.removeChild(readAT.lis[i]);
			selfTweetsCount++;
		}
	}

	//return previous new tweets to original color
    if(!readAT.unreadCount){
        var preNewStatuses = doc.getElementsByClassName("RAT_newTweets");
        while(preNewStatuses.length){
            readAT.removeClass(preNewStatuses[0], "RAT_newTweets");
        }
        var preNewReplies = doc.getElementsByClassName("RAT_newReplies");
        while(preNewReplies.length){
            readAT.removeClass(preNewReplies[0], "RAT_newReplies");
        }
    }

/*
    var li = readAT.alreadyReadLi;
    while(li && li!=readAT.preAlreadyReadLi){
        if(li.nodeName=="LI"){
			var cls = li.getAttribute("class");
			//Read All Tweets 縺九ｉ縺ｮ繝｡繝�そ繝ｼ繧ｸ縲√≠繧九＞縺ｯ閾ｪ蛻��逋ｺ險�ｻ･螟悶↑繧峨�
			if(cls.indexOf(" RATMessage")==-1){
				if(cls.indexOf(" RAT_newTweets")>-1){
					li.setAttribute("class", cls.replace(" RAT_newTweets",""));		
				}
				else if(cls.indexOf(" RAT_newReplies")>-1){
					li.setAttribute("class", cls.replace(" RAT_newReplies",""));		
				}
			}
		}
		li = li.previousSibling;
	}
*/
	if(newTweetsCount){
		readAT.newLastStatus = newLis[0].getAttribute("id").replace("status_", "");
//		alert(readAT.newLastStatus)
	}
	
	if(failed){
		var bundle = document.getElementById("readalltweets-bundle");

		var time = readAT.getTime();
		if(newTweetsCount){
/*
			var div = doc.createElement("div");
			div.appendChild(newLis[0])
			alert(newTweetsCount+" "+readAT.newLastStatus+"\n"+div.innerHTML)
			Application.console.log(newTweetsCount+" "+readAT.newLastStatus+"\n"+div.innerHTML)
*/
			var cls = "bulletin alert";
			var msg = time+'<br/>'+bundle.getString("notAllNewTweetsCouldBeFetched");
			var errorLi2 = readAT.createLi(cls, msg, null);
	
			readAT.ol.insertBefore(errorLi2, readAT.separator);		
		}
		else{
			var cls = "bulletin alert";
			var msg =  time+'<br/>'+bundle.getString("failedToGetNewTweets");
			var cantGetLi = readAT.createLi(cls, msg, null);
			
			readAT.ol.insertBefore(cantGetLi, readAT.separator);
			
			return;
		}
	}

	var selfTweetsCount = 0;
    var li;
	for(var j=newTweetsCount-1; j>-1; j--){
		if(readAT.includeClass(newLis[j], "mine")) selfTweetsCount++;
		else{
            if(readAT.isReplie(newLis[j])){
                li = doc.getElementById(newLis[j].id);
                if(li && li.parentNode == readAT.ol){
                    if(!readAT.includeClass(li, "buffered")){
                        newTweetsCount--;
                        continue;
                    }
                    else{
                        li.parentNode.removeChild(li);
                    }
                }

                readAT.addClass(newLis[j], "RAT_newReplies");
            }
            else readAT.addClass(newLis[j], "RAT_newTweets");
        }
        //update 縺九ｉ蜻ｼ縺ｰ繧後◆蝣ｴ蜷医�縺溘ａ
        if(readAT.separatorHidden){
            if(newLis[j].getAttribute("class").indexOf(" RAT_buffered")==-1){
                readAT.addClass(newLis[j], "RAT_buffered");
            }
        }
        else readAT.removeClass(newLis[j], "RAT_buffered");

		readAT.ol.insertBefore(newLis[j], readAT.separator);
		
	}
	
	readAT.unreadCount += newTweetsCount - selfTweetsCount;
	if(selfTweetsCount && !readAT.unreadCount) readAT.setLastStatus(readAT.newLastStatus)
	readAT.showUnreadCount();
	readAT.autoMovingToUnreadTweets();
	
	return;
},
showReplies : function(){
  if(!readAT.targetBrowser){
    readAT.clearCheckInterval()
    return
  }
  
	if(!readAT.Branch.getBoolPref("general.showRepliesToo")){
		readAT.checkDM();	
		return;
	}
  if(readAT.newTwitter){
     readAT.apiContainer.getMentions(readAT.newLastReply, readAT.showRepliesCallback);
  }
  else{
    if(readAT.nowTwitterUpdating){
        setTimeout(readAT.showReplies, 1000);
        return;
    }
  	
    var args = {};
    if(readAT.Branch.getBoolPref("general.showOnlyTheMostRecentTweets"))
          args["max"] = readAT.Branch.getIntPref("general.maximumNumberOfFetchedTweets");
  	var lastReply = readAT.newLastReply;
  	if(lastReply>-1) readAT.getStatusesInit(readAT.getUrlFor("replies"), "more", lastReply, "replies", readAT.pageId, readAT.showReplies2, args);
  	else readAT.checkDM();    
  }
},
showRepliesCallback : function(data){
	var doc = readAT.targetBrowser.contentDocument;
	readAT.separator = doc.getElementById("RAT_separator");
/*
  var firstItem = doc.evaluate("./div[contains(@class, 'stream-item')]",
    readAT.stream, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;
*/
//Application.console.log(data)
	data =  JSON.parse(data);
  if (data.length) {
    readAT.newLastReply = data[0]["id_str"];
    if (readAT.Branch.getBoolPref("general.showOnlyTheMostRecentTweets")) {
      var max = readAT.Branch.getIntPref("general.maximumNumberOfFetchedTweets");
    }
    else var max = 0;
    
    var tmp = 0;
    var li, div;
    for (var j = data.length - 1; j > -1; j--) {
      //alert(data[j].user.following)
      //if(data[j].user.following) continue
      li = doc.evaluate("./*[contains(@class, 'stream-item') and @data-item-id='" + data[j].id_str + "']", readAT.stream, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
      if (li) continue;
      
      tmp++;
      if (max && tmp > max) break;
      div = readAT.generateDivFromDate(data[j], doc);
      
      readAT.addClass(div, "RAT_newReplies");
      readAT.stream.insertBefore(div, readAT.separator);
    }
    readAT.unreadCount += tmp;
//    alert(readAT.unreadCount);
    if (readAT.unreadCount) readAT.setLastReply(readAT.newLastReply);
//    Application.console.log(readAT.newLastReply)
    
    readAT.autoMovingToUnreadTweets();
  }
  readAT.checkDM();
	
  return
},
showReplies2 : function(failed, pageCount, newLis, newTweetsCount, args){	
	var doc = readAT.targetBrowser.contentDocument;
	readAT.separator = doc.getElementById("RAT_separator");
	
	if(failed){
		var bundle = document.getElementById("readalltweets-bundle");

		var cls = "bulletin alert";
		var time = readAT.getTime();
		if(newTweetsCount){
			var str = "notAllNewRepliesCouldBeFetched";
			
			var msg = time+'<br/>'+bundle.getString(str);
			var errorLi3 = readAT.createLi(cls, msg, null);
			readAT.ol.insertBefore(errorLi3, readAT.separator);
		}
		else{
			var str = "failedToGetNewReples";
			
			var msg = time+'<br/>'+bundle.getString(str);
			var errorLi3 = readAT.createLi(cls, msg, null);
			readAT.ol.insertBefore(errorLi3, readAT.separator);
			
			readAT.checkDM();
			return;
		}
	}
  if(newLis[0]) readAT.newLastReply = newLis[0].getAttribute("id").replace("status_", "");
	
	var tmp = 0;
	var li;
	for(var j=newTweetsCount-1; j>-1; j--){
        li = doc.getElementById(newLis[j].id);
        if(li && li.parentNode == readAT.ol){
            if(!readAT.includeClass(li, "buffered")){
                continue;
            }
            else{
                li.parentNode.removeChild(li);
            }
        }
        
		tmp++;

		readAT.addClass(newLis[j], "RAT_newReplies");
		readAT.ol.insertBefore(newLis[j], readAT.separator);
		//update 縺九ｉ蜻ｼ縺ｰ繧後◆蝣ｴ蜷医�縺溘ａ
		if(readAT.separatorHidden){
			readAT.addClass(newLis[j], "RAT_buffered");
		}
	}
	readAT.unreadCount += tmp;
  if(!readAT.unreadCount) readAT.setLastReply(readAT.newLastReply);

	readAT.autoMovingToUnreadTweets();
	readAT.checkDM();
	
	return;
},
checkDM : function(){	
	if(!readAT.Branch.getBoolPref("general.notifyDM")){
		readAT.checkDMFinish();
		return;
	}
  if(readAT.newTwitter){
    readAT.apiContainer.checkDM(readAT.newLastDM, readAT.checkDM2);
  }
  else{  
   	var doc = readAT.targetBrowser.contentDocument;
  	readAT.separator = doc.getElementById("RAT_separator");

  	var message_count = doc.getElementById("message_count");
  	if(message_count && message_count.firstChild && message_count.firstChild.nodeValue==0){
  		//蛻晄悄蛹�
  		if(readAT.newLastDM==-1) readAT.setLastDM(0);
  		readAT.checkDMFinish();
  		return;
  	}
  	var req = new XMLHttpRequest();
  	req.open('GET', readAT.getUrlFor("inbox"), true);
  	req.overrideMimeType('text/xml');
  	req.onreadystatechange = function (aEvt) {
  	  if (req.readyState == 4) {
  	     if(req.status == 200){
  			var res = req.responseText.replace(/[\n\r]/g, " ");
  					
  			var re = new RegExp('<body [^>]* id="([^"]*)');
  			res.match(re);
  			var bodyId = RegExp.$1;
  			if(bodyId!="inbox"){
  				readAT.checkDMFinish();	
  				return;
  			}
  			readAT.lastDM = readAT.newLastDM;
  
  			var tmpOl = readAT.getOl(res, "timeline");
  			var tmpLis = readAT.getLis(tmpOl);
  
  			if(!tmpLis.length){
  				//蛻晄悄蛹�
  				if(readAT.lastDM==-1){
  					readAT.setLastDM(0);
  				}
  				readAT.checkDMFinish();	
  				return;
  			}
  		
  			readAT.newLastDM = tmpLis[0].getAttribute("id").replace("direct_message_", "");
  			//蛻晄悄蛹�
  			if(readAT.lastDM==-1){
  				readAT.setLastDM(readAT.newLastDM);				
  				readAT.checkDMFinish();
  				return;
  			}
  
  			if(!readAT.aIsBiggerThanB(readAT.newLastDM, readAT.lastDM)){
  				readAT.checkDMFinish();	
  				return;
  			}
  			
  			readAT.unreadCount++;
  		
  			var bundle = document.getElementById("readalltweets-bundle");
  			
  			var cls = "bulletin warning";
  			var msg = bundle.getString("thereAreNewDMs").replace('<a>', '<a target="_blank" href="http://twitter.com/inbox">');
  			var alertDMLi = readAT.createLi(cls, msg, null);
  		
  			readAT.ol.insertBefore(alertDMLi, readAT.separator);
  			//update 縺九ｉ蜻ｼ縺ｰ繧後◆蝣ｴ蜷医�縺溘ａ
  			if(readAT.separatorHidden){
  				readAT.addClass(alertDMLi, "RAT_buffered");
  			}
  			
  			readAT.checkDMFinish();	
  	     }
  	  }
  	}
    req.setRequestHeader("If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT");    
  	req.send(null);    
  }

	return;
},
checkDM2 : function(data){
	var dms =  JSON.parse(data);

  if(!dms.length){
    if(readAT.lastDM==-1){
  		readAT.setLastDM(0);				
  		readAT.checkDMFinish(); 
    }
    return;
  }
	readAT.lastDM = readAT.newLastDM;

	readAT.newLastDM = dms[0].id;
	//蛻晄悄蛹�
	if(readAT.lastDM==-1){
		readAT.setLastDM(readAT.newLastDM);				
		readAT.checkDMFinish();
		return;
	}	
	readAT.unreadCount++;

	var bundle = document.getElementById("readalltweets-bundle");
	var msg = bundle.getString("thereAreNewDMs").replace('<a>', '<a target="_blank" href="http://twitter.com/#!/messages">');;
	
	var alertDMLi = readAT.createLi("", msg, null);
  
  readAT.stream.insertBefore(alertDMLi, readAT.separator);
  
	readAT.checkDMFinish();	  
},
checkDMFinish : function(){
	readAT.showUnreadCount();
	readAT.autoMovingToUnreadTweets();
},
autoMovingToUnreadTweets : function(){
	if(!readAT.unreadCount || gBrowser.selectedBrowser==readAT.targetBrowser) return;
	if(!readAT.alreadyReadLi) return;
	var unreadTweet = readAT.alreadyReadLi.nextSibling;
	if(!unreadTweet) return;
	
	var focusNode = gBrowser.selectedBrowser.contentDocument.activeElement;
	if(focusNode.tagName=="TEXTAREA" || 
		(focusNode.tagName=="INPUT" && focusNode.getAttribute("type")=="TEXT")){
			return;
	}

//	var doc = readAT.targetBrowser.contentDocument;
	var win = readAT.targetBrowser.contentWindow;
	var top = readAT.getOffsetTopBody(unreadTweet);
	//var bottom = top + unreadTweet.height;
	if(top < win.pageYOffset) return;
	if(top > win.pageYOffset && top < win.pageYOffset + win.innerHeight) return;	

	readAT.moveToUnreadTweets();
	return;
},
createLi : function(cls, msg, elems){
    if(readAT.targetBrowser) var doc = readAT.targetBrowser.contentDocument;
    else var doc = readAT.secondBrowser.contentDocument;
    
    if(readAT.newTwitter){
        var div = doc.createElement("div");
        var divClass = "stream-item status RATMessage";
        if(readAT.separatorHidden) divClass += " RAT_buffered";
    
        div.setAttribute("class", divClass);
//        div.setAttribute("data-item-type", "tweet")
        var outerDiv = doc.createElement("div");
        outerDiv.setAttribute("class", "stream-item-content tweet stream-tweet");
        var innerDiv = doc.createElement("div");
        innerDiv.setAttribute("class", cls);
        innerDiv.style.display = "block";
        innerDiv.appendChild(doc.createTextNode(msg));
        if(elems!=null)  innerDiv.appendChild(elems);
        outerDiv.appendChild(innerDiv);
        div.appendChild(outerDiv);
        return div;
    }
},
getUrlFor : function (path) {
	return readAT.baseUrl + path;
},
/*
getOl : function(string, id){
    if(readAT.targetBrowser) var doc = readAT.targetBrowser.contentDocument;
    else var doc = readAT.secondBrowser.contentDocument;
    
	var re = new RegExp("<ol [^>]*id=['"+'"]'+id+'["'+"'][^>]*>(.*?)</ol>");
	string.match(re);
	var tmpString = RegExp.$1;
	var tmpOl = doc.createElement("ol");
	readAT.replaceHTML(tmpOl, tmpString);
	return tmpOl;
},
getLis : function(ol){
//    return ol.getElementsByClassName("hentry");
	var rawLis = ol.getElementsByTagName("li");
	var lis = new Array();
	var j = 0;
	for(var i=0; i<rawLis.length; i++){
		if(rawLis[i].parentNode==ol) lis[j++] = rawLis[i];
	}
    return lis;
},
*/
getOuterHTML : function(aElmArrow){
	var doc = readAT.targetBrowser.contentDocument;
	var r = doc.createRange(), tub = doc.createElement("div");
	r.selectNode(this);
	tub.appendChild(r.cloneContents());
	
	return tub.innerHTML;
},
genUrlRegex : function (path) {
	return new RegExp('^https?:\/\/twitter\.com' + path);
},
isReplie : function(aElm){
	if (readAT.newTwitter) {
		var tmp = aElm.getElementsByClassName("twitter-atreply");
		for(var i=0; i<tmp.length; i++){
			if(tmp[i].getAttribute("data-screen-name")==readAT.user) return true;
		}
		return false;
	}
	else {
		var entryContent = aElm.getElementsByClassName("entry-content");
		if (!entryContent.length) 
			return;
		var content = entryContent[0].innerHTML;
		return content.match(new RegExp('@<a [^>]*>' + readAT.user + "<")) || content.match(new RegExp('@' + readAT.user + "([^a-zA-z0-9_]|$)"))
	}
},
setReverseButton : function(doc){
    if(readAT.newTwitter) return;
    if(doc.getElementById("RAT_reverse_button")) return;
    
    var bundle = document.getElementById("readalltweets-bundle");

    var header = doc.getElementsByClassName("thumb clearfix");
    if(header.length) header = header[0];
    else{
        header = doc.getElementsByClassName("list-header-inner");
        if(header.length) header = header[0];
        else{
            header = doc.getElementById("heading");
            if(!header) return;
        }
    }

    var div = doc.createElement("div");
    var reverseButton = doc.createElement("button");
    reverseButton.setAttribute("type", "button");
    reverseButton.setAttribute("style", "margin: 5px 5px; font-size: small;")
    reverseButton.id = "RAT_reverse_button";
    reverseButton.appendChild(doc.createTextNode(bundle.getString("reverseThisTimeline")));

    
    div.appendChild(reverseButton)
    header.appendChild(div);
    reverseButton.addEventListener("click", readAT.reverseTimeline, false);
    
    return
    
},

reverseTimeline : function(aEvent){
    var bundle = document.getElementById("readalltweets-bundle");

    var max = prompt(bundle.getString("nomOfTweetsYouReverse"), readAT.Branch.getIntPref("general.maximumNumberOfFetchedTweets"));
    if(!max) return;
    
    var button = aEvent.originalTarget;
    button.parentNode.removeChild(button);
    var args = {};
    args["max"] = max;
    
    var browser = gBrowser.selectedBrowser;
    readAT.secondBrowser = browser;
    var doc = browser.contentDocument;
    args["doc"] = doc;
        
    readAT.baseUrl = doc.location.protocol + '//' + doc.location.host + '/';

    var ol = doc.getElementById("timeline");
    args["ol"] = ol;
    var lis = readAT.getLis(ol);
    
    if(!lis.length) return;

    var processingDiv = doc.createElement("div");
    processingDiv.id = "RAT_processing"
    processingDiv.setAttribute("class", "minor-notification");
    processingDiv.style.display ="block";
//    readAT.replaceHTML(processingDiv, bundle.getString("processing") + ' (<span id="RAT_processing_count">1</span>)');
    ol.parentNode.insertBefore(processingDiv, ol);
    
    for(var i=0; i<lis.length; i++){
        var a = lis[i].getElementsByTagName("a");
        for(var j=0; j<a.length; j++){
            a[j].setAttribute("target","_blank");
        }
    }
    
    var more = doc.getElementById("more");
    if(more){
        var moreUri = more.href;
        var moreParent =more.parentNode; 
        moreParent.removeChild(more);
        args["moreParent"] = moreParent;
        args["more"] = more;
    }

    var newLis = new Array();
    var newTweetsCount=0;

    var failed = false;
    while(true){
        newLis[newTweetsCount] = lis[newTweetsCount];
        if(newTweetsCount >= max) break;
        else{
            newTweetsCount++;
            if(lis[newTweetsCount]) continue;
    
            if(!moreUri){
                //failed = true;
                break;
            }
                        
            var pageKind = doc.body.id;
            if(pageKind=="list") pageKind = "list_show";
    
            readAT.getStatuses(moreUri, "more", 0, pageKind, readAT.pageId, readAT.reverseTimeline2, newLis, newTweetsCount, args, 0);
    
            return;
        }
    }
    readAT.reverseTimeline2(failed, 2, newLis, newTweetsCount, args);
},
reverseTimeline2 : function(failed, pageCount, newLis, newTweetsCount, args){   
    var doc = args["doc"];
    var ol = args["ol"];
    var more = args["more"];
    var moreParent = args["moreParent"];
    var bundle = document.getElementById("readalltweets-bundle");

    if(failed){
        var errorDiv = doc.createElement("div");
        errorDiv.setAttribute("class", "bulletin alert");
        errorDiv.style.display ="block";
        ol.parentNode.insertBefore(errorDiv, ol);
        
        if(newLis.length){
             errorDiv.appendChild(doc.createTextNode( bundle.getString("notAllNewTweetsCouldBeFetched") ));            
        }
        else{
            errorDiv.appendChild(doc.createTextNode( bundle.getString("failedToGetNewTweets") ));            
            
            moreParent.appendChild(more);
            var processingDiv = doc.getElementById("RAT_processing");
            processingDiv.parentNode.removeChild(processingDiv);
            
            return
        }
    }

    //add separator
    var cls = "bulletin warning";
    var msg = bundle.getString("belowAreAlreadyRead")+
    ' <a href="javascript:void(0);" onclick="javascript:window.scroll(0, 0); return false;" style="display:block; float:right;">'+
    bundle.getString("goToTop")+"</a>";
    var separator = readAT.createLi(cls, msg, null);
    separator.id="RAT_separator";

    if(newTweetsCount){
        var lis = readAT.getLis(ol);
        var addedLis = new Array();
        var i = 0;
        while(lis[i] != newLis[0]){
            readAT.removeClass(lis[i], "buffered");
            addedLis[i] = lis[i];
            i++;
        }
        
        ol.insertBefore(separator, ol.firstChild);
        for(var j=newTweetsCount-1; j>-1; j--){
            ol.insertBefore(newLis[j], separator);
        }
        for(j=addedLis.length-1; j>-1; j--){
            ol.insertBefore(addedLis[j], separator);
        }
        
        //譛ｪ隱ｭ縺ｧ縺ｪ縺�newLis
        for(var j=newTweetsCount; j<newLis.length; j++){
            ol.appendChild(newLis[j]);
        }
    }
    else ol.insertBefore(separator, ol.firstChild);

    moreParent.appendChild(more);
    more.href = more.href.replace(/&page=\d+/, "&page="+pageCount);

    lis = readAT.getLis(ol);    

    readAT.finishRverseTimeline(doc);
    
    return;
},
finishRverseTimeline : function(doc){
    var processingDiv = doc.getElementById("RAT_processing");
    processingDiv.parentNode.removeChild(processingDiv);

    return; 
}
};
window.addEventListener("load", function() { readAT.init(); }, false);
window.addEventListener("unload", function() {readAT.uninit()}, false);
function $ (selector, el) {
    if (!el) {el = document;}
    return el.querySelector(selector);
}