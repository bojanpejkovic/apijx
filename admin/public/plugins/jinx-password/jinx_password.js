/*
Plugin definition. To change it:
    -change jinxPassword (all small-cap) to pluginName
    -change JinxPassword (first letter UP) in 2 places to whatever
    -add methods only to first part: class JinxPassword.

To call it:
    var hil = $('.test').jinxPassword({ r: 12 });  
    hil.jinxPassword('valIs', 'sve');   //all
    $('#t1').jinxPassword('valIs', 15);  //from jquery
    $(hil[1]).jinxPassword('valIs', 2);  //from returned array

*/

(function($){

    var JinxPassword = function($el, options) {  //CustomPlugin 

        //OPTIONS
        this._defaults = { text: 'Repeat password:', oneLine:false };
        this._options = $.extend(true, {}, this._defaults, options);
        this.options = function(options) {
            return (options) ? $.extend(true, this._options, options) : this._options;
        };


        //CREATE
        var that = this;
        var pass1, pass2;
        (function init(){
            var this_options = that.options();
            pass1 = $('<input type="password" />');
            pass2 = $('<input type="password" />');
            $el.append(pass1);
            if(this_options.oneLine == false) $el.append('<br />');
            $el.append(this_options.text);
            $el.append('<br />');
            $el.append(pass2);
            pass1.val(''); 
            pass2.val(''); 
        })();


        
        //PUBLIC METHODS
        this.valIs = function(val) {   
            pass1.val(val); 
            pass2.val(val); 
        };

        this.valGet = function() {   
            if(pass1.val() !== pass2.val())
                return ['Error', 'Values must be the same in both fields!'];
            if(pass1.val() == '')
                return ['Error', 'Values are empty!'];
            return ['', pass1.val()]; 
        };

    };

    $.fn.jinxPassword = function(methodOrOptions, args) { //customPlugin
        var method = (typeof methodOrOptions === 'string') ? methodOrOptions : undefined;
        if (method){
            var results = [];
            var args    = (arguments.length > 1) ? Array.prototype.slice.call(arguments, 1) : undefined;
            this.each(function(){
                var $el          = $(this);
                var jinxPassword = $(this).data('jinxPassword');
                if (!jinxPassword) {
                    console.log('$.jinxPassword not instantiated on element ');
                    return;
                };
                if (typeof jinxPassword[method] === 'function') {
                    var result = jinxPassword[method].apply(jinxPassword, args);
                    results.push(result);
                } else {
                    console.log('Method \'' + method + '\' not defined in $.customPlugin');
                }
            });
            return (results.length > 1) ? results : results[0];
        } else{
            var options = (typeof methodOrOptions === 'object') ? methodOrOptions : undefined;
            return this.each(function(){
                var jinxPassword = new JinxPassword($(this), options);
                $(this).data('jinxPassword', jinxPassword);
            });
        }
    };
    
})(jQuery);