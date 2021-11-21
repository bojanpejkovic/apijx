(function ( $ ) {
    function jinx_randomString(length) {
        var result = '';
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    };

    
    $.fn.add_browse_wysiwyg = function( options ) {
        var this_options = {
                    form_name:'new_form', 
                    label: 'Upload file:', 
                    input_class: 'input_class',
                    browse_class: '', 
                    file_type: 'image', 
                    file_path: '', 
                    file_dest: '../../../../../slike/onama/',
                    php_file: 'upload_file.php',
                    img_thumbnail: true,
                    form_width: '400px'
        };
        if(options)
            $.extend(this_options, options);

        this_options.form_name += '_'+jinx_randomString(12);
        
    	var newForm = $(document.createElement('form'));
        newForm.prop({
        	'method' : "post",
        	'enctype' : "multipart/form-data",
        	'name' : this_options.form_name,
            'class' : 'jinx_wys_upload_browse'
        });
        newForm.css('max-width', this_options.form_width);
        var label = $('<label></label>');
        var inputFile = $('<input type="file" name="fileToUpload" required class="'+this_options.browse_class+'" />');
        label.append(inputFile);
        label.append(this_options.label);
        newForm.append(label);

        if(this_options.input_class != '')
            newForm.append('<input type="text" class="'+this_options.input_class+'" val="" />');

        newForm.append('<input type="hidden" name="file-type" value="'+this_options.file_type+'" />');
        newForm.append('<input type="hidden" name="file-path" value="'+this_options.file_path+'" />');
        newForm.append('<input type="hidden" name="file-dest" value="'+this_options.file_dest+'" />');
        var inputSubmit = $('<input type="submit" value="UPLOAD" />');
        newForm.append(inputSubmit);
        newForm.append('<div class="form_output">'+
                    '<div class="progressbar_wrapper">'+
                        '<div class="progressbar"> </div>'+
                    '</div>'+
                    '<!--<button class="cancelUpload">Cancel</button>-->'+
                    '<p class="wait">Please wait...</p>'+
                '</div>'
        );
        if(this_options.img_thumbnail == true){
            newForm.css('position', 'relative');
            newForm.append('<img src="" class="img_thumbnail" />');
        }
        this.append(newForm);
        
        this.val = function(vv){
            if(vv === undefined){
                var src = $('form[name="'+this_options.form_name+'"] input[type="text"]').val();
                return src;
            }else{
                $('form[name="'+this_options.form_name+'"] input[type="text"]').val(vv);
            }
        };

        $(inputFile).on('change', function(){
            $(inputSubmit).trigger('click');
        });

        //$('form[name="'+this_options.form_name+'"]')[0].addEventListener('submit', function(event) {
        newForm[0].addEventListener('submit', function(event) {
                var form_name = this_options.form_name;
                $('form[name="'+form_name+'"] .form_output .progressbar').css( 'width', "100%");
                $('form[name="'+form_name+'"] .form_output').show();
                        //var img_class = form.getAttribute('data-image-class');
                        //var img_type = form.getAttribute('data-image-type');
                var oData = new FormData(document.forms.namedItem(form_name));
                //oData.append("CustomField", "This is some extra data");

                var xhr = new XMLHttpRequest();
                xhr.open("POST", this_options.php_file, true);  
                xhr.upload.addEventListener("progress", function(e) {
                    var pc = parseInt(100 - (e.loaded / e.total * 100));
                    $('form[name="'+form_name+'"] .form_output .progressbar').css( 'width', pc + "%");
                }, false);
                var that_options = this_options;
                xhr.onload = function(oEvent) {
                    
                    if (this.status == 200) {
                        //alert("Resp: " + this.responseText);
                        if(this.responseText.substr(0, 5) == 'Error'){
                                    alert(this.responseText);
                                    $('form[name="'+form_name+'"] .form_output').hide();
                                    return;
                        }
                        $('form[name="'+form_name+'"] .form_output').hide();
                        
                        var str = $('form[name="'+form_name+'"] input[type="file"]').val();
                        var str2 = $('form[name="'+form_name+'"] input[name="file-type"]').val();
                        var filename = str.split(/(\\|\/)/g).pop();
                        var folder = $('form[name="'+form_name+'"] input[name="file-dest"]').val();
                        $('form[name="'+form_name+'"] input[type="text"]').val(filename);
                        if(str2 == "image"){   //image
                            //prikazi sliku
                            if(that_options.img_thumbnail == true){
                                $('form[name="'+form_name+'"] .img_thumbnail')
                                    .prop('src', folder+filename); 
                                $('form[name="'+form_name+'"]').addClass('form_image_uploaded');
                            }
                        }
                        if(str2 == "canvas"){    //canvas
                            var img = new Image();
                            //img.onload = function(){ imageOnLoad(img, img_class); }
                            //img.onerror = function(){ ResetCanvas(img_class); }
                            img.src = folder+filename; // '/'+
                        }
                        console.log('SERVER RESP: ', this.responseText);
                        if(that_options.callbackUploaded)
                            if(typeof that_options.callbackUploaded === 'function')
                                that_options.callbackUploaded(filename);

                        
                    } else {
                        alert("Error " + this.status + " occurred uploading your file. "+this.responseText);
                    }
                };
                var bb = xhr.send(oData);
                event.preventDefault();
        }, false);

		
        return this;
    };
 
}( jQuery ));