//Top Share Bar JS - stolen straight from 
(function($){

   var socialTools = {
        myRoot : '.top-sharebar-wrapper',

        init:function (myRoot) {
            myRoot = myRoot || this.myRoot;
            $(myRoot).each(function(index, myRootElement){
                myRootElement.postShare = new postShare();
                myRootElement.postShare.init($(myRootElement), $(myRootElement).data('postshare'));
                var $root = $(myRootElement), 
                    $individualTool = $('.tool:not(.more)',$root),
                    $socialToolsWrapper = $('.social-tools-wrapper',$root),
                    $socialToolsMoreBtn = $('.tool.more',$socialToolsWrapper),
                    $socialToolsAdditional = $('.social-tools-additional',$root),
                    $socialToolsUtility = $('.utility-tools-wrapper',$root),
                    width = (window.innerWidth > 0) ? window.innerWidth : screen.width,
                    isMobile = (mobile_browser === 1 && width < 480) ? true : false,
                    config = {'omnitureEvent' : 'event6'};          
    
                $socialToolsMoreBtn.off('click').on('click',this,function(ev){  
                    if(isMobile){$socialToolsUtility.hide('fast');};        
                    $socialToolsMoreBtn.hide('fast');
                        $socialToolsAdditional.show('fast',function(ev){
                            $('.tool',$socialToolsWrapper).animate({"width":40},250);
                            $root.addClass("expanded");
                            $('.social-tools',$socialToolsAdditional).animate({"margin-left":0},250);
                            if(isMobile){$socialToolsUtility.show('slow');};        
                        });//end addtl show
                });//end more click 
                $individualTool.bind({
                    click: function(event){
                        //event.stopPropagation();
                        if (typeof window.sendDataToOmniture === 'function' ) {
                            var shareType = $(this).attr('class');
                            shareType = (typeof shareType != 'undefined')?shareType.split(" ")[0].trim():'';
                            var omnitureVars =  {
                                    "eVar1":(typeof window.s == 'object') && s && s.eVar1,
                                    "eVar2":(typeof window.s == 'object') && s && s.eVar2,
                                    "eVar8":(typeof window.s == 'object') && s && s.eVar8,
                                    "eVar17":(typeof window.s == 'object') && s && s.eVar17,
                                    "eVar27":''
                                    };
                            omnitureVars.eVar27 = shareType;
                            var eventName = config.omnitureEvent;
                            try {
                                sendDataToOmniture('share.' + shareType,eventName,omnitureVars);
                            } catch (e){}    
                        }
                    }
                });
            });
         }
    };   

   var textResizer = {
        currIncrementMax:4,
        currIncrementUnit:2,
        currIncrementIndex:0,
        init: function (myRoot,resizeableElementList,clickElement) {
            myRoot = myRoot || '#article-body article, .related-story';
            resizeableElementList = resizeableElementList || 'p, li';
            clickElement = clickElement || '.tool.textresizer';
            this.root = $(myRoot);
            this.resizeableElements = $(resizeableElementList, this.root);

            // add "Next up" lable to the resizable element's list
            if($(".related-story").prev('h3').length > 0){
                this.resizeableElements.push($('.related-story').prev('h3'));
                this.resizeableElements.push($('.related-story h4 a'));
            }
            $(clickElement).unbind('click').on('click',this,this.resize);
        },
        resize: function (event) {  
            var currObj = event.data;
            if (currObj.currIncrementIndex == currObj.currIncrementMax) {
                currObj.currIncrementIndex = 0;
                currObj.currIncrementUnit = (currObj.currIncrementUnit == 2)?-2:2;
            }
            currObj.currIncrementIndex = currObj.currIncrementIndex + 1;
            currObj.resizeableElements.each(function(){
                elm = $(this);
                currSize= parseFloat(elm.css('font-size'),5);
                var result = currSize + currObj.currIncrementUnit;
                elm.css('font-size', result);
                wp_pb.report('textresizer', 'resized', result);
            }); 

            
        }
   };
var mobile_browser = mobile_browser && mobile_browser === 1 ? 1 : 0;
   
   var postShare = function() {
       this.init = function(rootElement, postShareTypes) {
           if (postShareTypes) {
               postShareTypes.split(",").forEach(function(element, index){
                   var postShareUrl = "";
                   if (window.location.host.indexOf('washingtonpost.com') >= 0) {
                       postShareUrl = 'http://postshare.washingtonpost.com'; //production only
                   } else if (window.location.host.indexOf('pb-staging.digitalink.com') >= 0 || window.location.host.indexOf('pb-staging.wpprivate.com') >= 0) {
                       postShareUrl = 'http://postshare-stage.wpprivate.com'; //testing pb-staging
                   } else {
                       postShareUrl = 'http://postshare-dev.wpprivate.com'; //testing pb-dev
                   }
                   var preTimestamp = (new Date()).getTime();
                   var preBusinessKey = wp_pb.StaticMethods.getUniqueKey(1000, null, preTimestamp);
                   var object = {
                       shareType : element,
                       timestamp : preTimestamp,
                       businessKey : preBusinessKey,
                       shareUrl : null,
                       tinyUrl : null,
                       calledPostShare : false,
                       clientUuid : null,
                       postShareUrl : postShareUrl,
                       
                       callPostShare : function (){
                           if (!this.calledPostShare){
                               var _this = this;
                                $.ajax({
                                    url: _this.postShareUrl+"/api/bk/"+_this.businessKey+"/"+_this.clientUuid+"/"+_this.shareType+"/"+_this.timestamp,
                                    async: true,
                                    type: 'POST',
                                    error: function(){
                                        _this.calledPostShare = false;
                                    }
                                });
                                this.calledPostShare = true;
                           }
                       },
                       
                       share : function (socialUrl, socialUrl2, style, callbackContext) {
                           var _this = this;
                           if (!this.tinyUrl || this.tinyUrl.length == 0){
                               $.ajax({
                                   url: "http://tinyurl.washingtonpost.com/create.jsonp",
                                   async: false,
                                   data: {
                                       url: _this.shareUrl + "?postshare="+_this.businessKey
                                   },
                                   type: 'GET',
                                   dataType: 'jsonp',
                                   crossDomain: true,
                                   success: function(data){
                                       _this.tinyUrl = data.tinyUrl;
                                       callbackContext.openWindow(socialUrl+_this.tinyUrl+socialUrl2,_this.shareType,style);
                                   },
                                   error: function(){
                                       //throw "PostShare failed: tinyUrl";
                                   },
                                   timeout: 200
                                });
                            } else {
                                callbackContext.openWindow(socialUrl+_this.tinyUrl+socialUrl2,_this.shareType,style);
                            }
                        }
                    };
                   $(rootElement.find('.'+element)[0]).parent()[0].postShare = $(rootElement)[0].postShare;
                   $(rootElement.find('.'+element)[0]).parent()[0].postShareObject = object;
               });
           }
       },
       
       this.callPostShare = function (element, elementObject, socialUrl, shareUrlLong, socialUrl2, style) {
           if(element && elementObject && socialUrl && shareUrlLong) {
                var shareType = $(element).children().attr('class');
                shareType = (typeof shareType != 'undefined')?shareType.split(" ")[0].trim():'';
                
                if(!socialUrl2) {
                    socialUrl2 = "";
                }
                
                var clientUuid = $.cookie("wapo_login_id");
                
                elementObject.clientUuid = clientUuid;
                if (clientUuid && clientUuid.length > 0 && shareType && shareType.length > 0 && elementObject.shareType && shareType.trim() == elementObject.shareType.trim()) {
                    elementObject.shareUrl = shareUrlLong;
                    elementObject.callPostShare();
                    elementObject.share(socialUrl, socialUrl2, style, element.postShare);
                } else {
                    throw "PostShare failed: no logged in User or wrong Sharetype";
                }
                $(element).parent()[0].postShareObject = elementObject;
           } else {
               throw "PostShare failed: Data missing";
           }
        },
       
        this.openWindow = function(url, name, style){
            window.open(url,'share_'+name,style);
        }
   };
   
   window.TWP = window.TWP || {};
   TWP.SocialTools = TWP.SocialTools || socialTools;
   TWP.TextResizer = TWP.TextResizer || textResizer;

   TWP.TextResizer.init();
   TWP.SocialTools.init();


   /*
     * POPOUT code for later var $article = $('#article-topper'); // START:
     * Social share pop-out var $socialToolsMoreBtn = $('.social-tools
     * .more',$article), $socialToolsPopOut =
     * $('.social-tools.pop-out',$article) ;
     * $socialToolsMoreBtn.on('click',function(ev){ var targetTop =
     * $socialToolsMoreBtn.position().top +
     * $socialToolsMoreBtn.outerHeight()-1-14; var targetLeft =
     * $socialToolsMoreBtn.position().left-1-3;
     * $socialToolsPopOut.css({"top":targetTop,"left":targetLeft});
     * $socialToolsPopOut.toggle(); });
     * $socialToolsPopOut.on('mouseout',function(ev){
     * $socialToolsPopOut.toggle(); }); // END: Social share pop-out
     */
})(jQuery);