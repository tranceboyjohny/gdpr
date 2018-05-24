/*
WES GDPR consent popup.
*/

var wes_cookie = {
    name : "_eu_wes",
    val: 1,
    scriptLink : "https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js",
    get: function() {
        var self = this;
        return new Promise(function(resolve, reject){
            $.getScript(self.scriptLink).done(function(js){
                resolve(typeof Cookies.get(self.name) !== "undefined");
            });
        });
    },
    set: function() {
        var self = this;      
        return new Promise(function(resolve, reject){
            $.getScript(self.scriptLink).done(function(){
                Cookies.set(self.name, self.val, { expires: 1825 });
                resolve();
            });
        });
    },
    toString: function() {
        return this.name + ", " + this.val;
    }
}

var Ip = {
    getInfo : function() {
        var options = $.extend( options || {}, {
            dataType: "jsonp",
            type: "GET",
            url: "https://api.ipstack.com/check",
            data: { access_key : "91470bf648eedda2b1f664aee50db435" }
        });
        return $.ajax(options);
    }
}

class user_consent{
    constructor(options){
        if (typeof options !== "object") this.throwError("Invalid parameter");

        this.mode = "modal";
        this.ScriptsToInject = options.js;        
        this.appendTo = options.el.name;        
        this.site = options.site;
        
        this.checkParams();

        this.modalContentUrl = this.getModalContent();
        this.alertContentUrl = this.getAlertContent();
    }

    init(){
        var self = this;
        wes_cookie.get().then(function(cookieAlreadySet){
            if (cookieAlreadySet) {
                self.injectScripts();
                return;
            }

            try {
                Ip.getInfo().done(function(json){
                    if (!json.location.is_eu) {
                        self.mode = "alert";
                        self.injectScripts();
                    }
                    self.showConsent();
                });
            }
            catch(error){
                console.log("error occured: " + error)

                // continue as if eu
                self.showConsent();
            }            
        });
    }

    showConsent(){
        var self = this;

        switch(this.mode){
            case "alert":
                $.get(this.alertContentUrl).done(function(text){
                    console.log("in alert!");
                    console.log(this);
                    console.log(self);

                    var newDiv = $('<div/>').addClass("alert alert-info newPrivacyAlert").attr("role","alert").append(text);
                    self.appendTo.prepend(newDiv);
                    self.setButtons(self);
                });
                break;
            case "modal":
                $.get(this.modalContentUrl).done((modal) => {                    
                    self.appendTo.prepend(modal);                    
                    $("#myModal").modal({backdrop: 'static', keyboard: false});
                    console.log("in modal!");
                    console.log(this);
                    console.log(self);
                    self.setButtons(self);

                    /*$("#savecookie").on('click', function(){
                        wes_cookie.set().then(function(){
                            $("#myModal").modal('hide');
                            self.injectScripts();
                        });
                    });
                    
                    var path = "https://www.wes.org/";
                    if (window.location.href.indexOf("/ca/") !== -1){
                        path += "ca/";
                    }

                    $("#pp").attr("href", path + "privacy-policy/");
                    $("#cc").attr("href", path + "cookie-policy/");*/
                });
            case "redirect":
                break;
            default: break;
        }
    }

    setButtons(that){
        console.log("in setButtons!");
        console.log(this);
        var path = "https://www.wes.org/";
        if (window.location.href.indexOf("/ca/") !== -1){
            path += "ca/";
        }

        $("#pp").attr("href", path + "privacy-policy/");
        $("#cc").attr("href", path + "cookie-policy/");

        $("#btnIAccept").on("click", function(){ 
            wes_cookie.set().then(function(){
                if (that.mode === "alert"){
                    $(".newPrivacyAlert").hide('slow'); 
                }
                else{
                    $("#myModal").modal('hide');
                    that.injectScripts();
                }
                
            });
        });
    }
    
    getModalContent(){
        console.log(window.location.hostname);
        return window.location.hostname + "/terms.html";
    }

    getAlertContent(){
        console.log(window.location.hostname);
        return window.location.hostname + "/alertText.html";
    }    

    injectScripts(){
        this.ScriptsToInject.forEach(script => {
            $.getScript("https://applications.wes.org/js/" + script);		
        });
    }

    checkParams(){
        if (!Array.isArray(this.ScriptsToInject)) this.throwError("js must be an array of js scripts.");
        if (this.appendTo instanceof jQuery === false) this.throwError("appendTo must be a jquery selecter object");        
    }

    throwError(msg){
        throw msg;
    }
}