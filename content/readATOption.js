var readATOption={
nativeJSON : Components.classes["@mozilla.org/dom/json;1"]
                 .createInstance(Components.interfaces.nsIJSON),
Branch: Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("extensions.readalltweets."),
Init: function(){
    var developer = document.getElementById("developer");
    developer.addEventListener("click", function(){
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
	    var mainWindow = wm.getMostRecentWindow("navigator:browser");
	    var br = mainWindow.getBrowser();
	    br.selectedTab = br.addTab("http://twitter.com/masahal");
    }, false);
    
    var checkbox = document.getElementById("prefs.general.showOnlyTheMostRecentTweets");
    var label = document.getElementById("prefs.general.showOnlyTheMostRecentTweets_label");
    
	var strbundle = document.getElementById("readalltweets-bundle");
	var string=strbundle.getString("showOnlyTheMostRecentTweets");
	string.match(/(.*?) ?%S ?(.*)/);
  checkbox.label = RegExp.$1;
  label.value = RegExp.$2;
    
  checkbox.addEventListener("click", readATOption.toggleTextBox, false);

  readATOption.toggleTextBox();
},
toggleTextBox :function(){
    setTimeout(function(){
	    var checkbox = document.getElementById("prefs.general.showOnlyTheMostRecentTweets");
	    var textbox = document.getElementById("prefs.general.maximumNumberOfFetchedTweets");

	    textbox.disabled = !checkbox.checked;
    }, 10);
},
setAsAlreadyRead : function(){
	var str = Components.classes["@mozilla.org/supports-string;1"]
	      .createInstance(Components.interfaces.nsISupportsString);
	str.data = "{}";
	this.Branch.setComplexValue("lastStatus", 
	      Components.interfaces.nsISupportsString, str);	
}
};