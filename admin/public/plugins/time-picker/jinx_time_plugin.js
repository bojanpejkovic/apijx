(function ( $ ) {
    var JinxTime = function($el, options) {  

        //OPTIONS
        this._defaults = { 
            html_type: 'select',
            format: 'HH:MM:SS',
            output_format: 'HH:MM:SS'
        };
        this._options = $.extend(true, {}, this._defaults, options);
        this.options = function(options) {
            return (options) ? $.extend(true, this._options, options) : this._options;
        };


        //CREATE
        var that = this;
        var $selH, $selM, $selS, $inputHMS;

        (function init(){
            var this_options = that.options();
            var ff = this_options.format.split(':');
            if(this_options.html_type == 'select'){
                for(var iFF=0; iFF<ff.length; iFF++){
                    if(ff[iFF] == 'HH' || ff[iFF] == 'H'){
                        $selH = $(document.createElement('select'));
                        if(ff[iFF].indexOf('HH') >= 0){
                            for(var i=0; i<10; i++)
                                $selH.append('<option val="0'+i+'">0'+i+'</option>');
                            for(var i=10; i<24; i++)
                                $selH.append('<option val="'+i+'">'+i+'</option>');
                        }else{
                            for(var i=1; i<=12; i++)
                                $selH.append('<option val="'+i+'">0'+i+'</option>');
                        }
                        $el.append($selH);
                    }
                    if(ff[iFF] == 'MM' || ff[iFF] == 'M'){
                        $selM = $(document.createElement('select'));
                        if(ff[iFF].indexOf('MM') >= 0)
                            for(var i=0; i<10; i++)
                                $selM.append('<option val="0'+i+'">0'+i+'</option>');
                        else
                            for(var i=0; i<10; i++)
                                $selM.append('<option val="'+i+'">'+i+'</option>');
                        for(var i=10; i<60; i++)
                            $selM.append('<option val="'+i+'">'+i+'</option>');
                        $el.append($selM);
                    }
                    if(ff[iFF] == 'SS' || ff[iFF] == 'S'){
                        $selS = $(document.createElement('select'));
                        if(ff[iFF].indexOf('SS') >= 0)
                            for(var i=0; i<10; i++)
                                $selS.append('<option val="0'+i+'">0'+i+'</option>');
                        else
                            for(var i=0; i<10; i++)
                                $selS.append('<option val="'+i+'">'+i+'</option>');
                        for(var i=10; i<60; i++)
                            $selS.append('<option val="'+i+'">'+i+'</option>');
                        $el.append($selS);
                    }
                }
            }
            if(this_options.html_type == 'input'){
                $inputHMS = $(document.createElement('input'));
                $inputHMS.attr('placeholder', this_options.format);
                $el.append($inputHMS);
            }
        })();   //INIT



        //PUBLIC METHODS
        this.val = function(value){
                var this_options = this.options();
                if(value === undefined){
                    if(this_options.html_type == 'select'){
                        var format = this_options.output_format.split(':');
                        var hms = '';
                        var dotes = '';
                        for(var iFF=0; iFF<format.length; iFF++){
                                if(iFF>0) dotes = ':';
                                if(format[iFF] == 'HH' || format[iFF] == 'H')
                                    hms += dotes+$selH.val();
                                if(format[iFF] == 'MM' || format[iFF] == 'M')
                                    hms += dotes+$selM.val();
                                if(format[iFF] == 'SS' || format[iFF] == 'S')
                                    hms += dotes+$selS.val();
                        }
                        return hms;
                    };
                    if(this_options.html_type == 'input'){
                        var vals = $inputHMS.val().split(':')
                        var format = this_options.output_format.split(':');
                        
                        var dotes = ''; 
                        var hms = '';
                        for(var iFF=0; iFF<vals.length; iFF++){
                            if(iFF>0) dotes = ':';
                            var v = parseInt(vals[iFF]);
                            if(v === NaN) vals[iFF] = '00';
                            hms += dotes+vals[iFF];
                        }
                        if(format.length > vals.length){
                            for(var iFF=vals.length; iFF<format.length; iFF++){
                                if(hms == '') dotes = '';
                                else dotes = ':';
                                hms += dotes+'00';
                            }
                        }
                        return hms;
                    };
                }else{
                    //set   ;
                    var format = this_options.format.split(':');
                    if(this_options.html_type == 'select'){
                        if(value == ''){ $selH.val(-1);$selM.val(-1);$selS.val(-1);  return; }
                        var vv = value.split(':');
                        for(var iFF=0; iFF<vv.length; iFF++){
                            if(!format[iFF]) return;
                            if(format[iFF] == 'HH' || format[iFF] == 'H')
                                $selH.val(vv[iFF]);
                            if(format[iFF] == 'MM' || format[iFF] == 'M')
                                $selM.val(vv[iFF]);
                            if(format[iFF] == 'SS' || format[iFF] == 'S')
                                $selS.val(vv[iFF]);
                        }
                    }
                    if(this_options.html_type == 'input'){
                        if(value == ''){   $inputHMS.val('');  return;   }
                        var vv = value.split(':');
                        var hms = '', dotes = '';
                        for(var iFF=0; iFF<vv.length; iFF++){
                            if(iFF>0) dotes = ':';
                            var v = parseInt(vv[iFF]);
                            if(v === NaN) vv[iFF] = '00';
                            hms += dotes+vv[iFF];
                        }
                        if(format.length > vv.length){
                            for(var iFF=vv.length; iFF<format.length; iFF++){
                                if(hms == '') dotes = '';
                                else dotes = ':';
                                hms += dotes+'00';
                            }
                        }
                        $inputHMS.val(hms);
                    };
                }
        }
    };

    
    $.fn.jinx_time = function(methodOrOptions, args) { //customPlugin
        var method = (typeof methodOrOptions === 'string') ? methodOrOptions : undefined;
        if (method){
            var results = [];
            var args    = (arguments.length > 1) ? Array.prototype.slice.call(arguments, 1) : undefined;
            this.each(function(){
                var $el          = $(this);
                var jinx_time = $(this).data('jinx_time');
                if (!jinx_time) {
                    console.log('$.jinx_time not instantiated on element ');
                    return;
                };
                if (typeof jinx_time[method] === 'function') {
                    var result = jinx_time[method].apply(jinx_time, args);
                    results.push(result);
                } else {
                    console.log('Method \'' + method + '\' not defined in $.customPlugin');
                }
            });
            return (results.length > 1) ? results : results[0];
        } else{
            var options = (typeof methodOrOptions === 'object') ? methodOrOptions : undefined;
            return this.each(function(){
                var jinx_time = new JinxTime($(this), options);
                $(this).data('jinx_time', jinx_time);
            });
        }
    };
}( jQuery ));