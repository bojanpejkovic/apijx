(function ( $ ) {
    
    $.fn.html_editor = function( options ) {
        var objDoc;
        var iframe;
        var divImgStyle;

        var button_area =  $(document.createElement('div'));
        button_area.addClass('wysiwyg_button_area');

        var buttons_arr = {
            "buttonBold":{ title:'BOLD', icon:'icons/bold.png', iconClass: 'icon_bold', command:'bold', args:null },
            "buttonItalic":{ title:'ITALIC', icon:'icons/italic.png', iconClass: 'icon_italic', command:'italic', args:null },
            "buttonUnderline":{ title:'UNDERLINE', icon:'icons/underline.png', iconClass: 'icon_underline', command:'underline', args:null },
            "buttonStrikeThrough":{ title:'STRIKE THROUGH', icon:'icons/cross-out.png', iconClass: 'icon_crossline', command:'strikeThrough', args:null },
            "buttonLink":{ 
                title:'LINK', icon:'icons/link.png', iconClass: 'icon_link', command:'createLink', args:null,
                args_function : function(){
                    var url = prompt('Enter URL...', 'http://');
                    if(!url || url === null || url === undefined)
                        url = '';
                    return url;
                } 
            },
            "buttonImage":{ 
                title:'IMAGE', icon:'icons/image.png', iconClass: 'icon_image', command:'insertImage', args:null,
                args_function : function(){
                    var url = prompt('Full path image please...');
                    if(!url || url === null || url === undefined)
                        url = '';
                    return url;
                } 
            },
            "newLine2":'',
            "buttonOrderedList":{ title:'NUMBER LIST', icon:'icons/numbered.png', iconClass: 'icon_numbered', command:'insertOrderedList', args:null },
            "buttonUnorderedList":{ title:'DOT LIST', icon:'icons/list.png', iconClass: 'icon_list', command:'insertUnorderedList', args:null },
            "buttonJustifyFull":{ title:'JUSTIFY', icon:'icons/text-alignment2.png', iconClass: 'icon_alignment2', command:'justifyFull', args:null },
            "buttonJustifyCenter":{ title:'CENTER', icon:'icons/text-alignment.png', iconClass: 'icon_alignment', command:'justifyCenter', args:null },
            "buttonJustifyLeft":{ title:'LEFT', icon:'icons/text-alignment1.png', iconClass: 'icon_alignment1', command:'justifyLeft', args:null },
            "buttonJustifyRight":{ title:'RIGHT', icon:'icons/text-alignment3.png', iconClass: 'icon_alignment3', command:'justifyRight', args:null }
        };
        if(options && options.buttons_arr)
            $.extend(true, buttons_arr, options.buttons_arr);


        var html_buttons = {};
        for(var name in buttons_arr){
            if(name.substr(0,7) == 'newLine'){
                 button_area.append('<br />');
            }else
            if(name.substr(0,7) == 'newLine'){
                 button_area.append('<br />');
            }else
            if(name == 'buttonImage'){
                var rnd = parseInt(Math.random()*1000000);                 
                html_buttons[name] = $(document.createElement('div'));
                html_buttons[name].attr({
                    'data-jinx-id': rnd,
                    'data-html-editor-name': name
                });
                $(html_buttons[name]).addClass('wysiwyg_button');
                if(buttons_arr[name].iconClass) 
                    $(html_buttons[name]).addClass(buttons_arr[name].iconClass);
                else
                    $(html_buttons[name]).html(buttons_arr[name].title);
                var url = location.protocol+'//'+location.hostname;
                var file_dest = (options && options.img_path)? options.img_path : "slike/upload/";
                console.log("file_dest", file_dest);
                var div = $('<div>').add_browse_wysiwyg({
                    form_name:'nova_forma', 
                    label: html_buttons[name], 
                    input_class: 'inputFileBrowse', 
                    browse_class: 'inputFileBrowse',
                    file_type: 'image', 
                    file_path:  '', 
                    file_dest: '../'+file_dest,   //zbog nivo iznad admin
                    php_file: url+'/admin/wys_upload_file.php',
                    img_thumbnail: false,
                    callbackUploaded: function(filename){
                        divImgStyle.attr('data-path', '../../../'+file_dest+filename); //zbog 3 nivoa iznad admin/public/admin
                        divImgStyle.show();
                    }
                }).addClass('div_inline'); 
                button_area.append(div);
                createImageStyleDiv(); 
            }else{
                html_buttons[name] = $(document.createElement('button'));
                html_buttons[name].attr('data-html-editor-name', name);
                html_buttons[name].on('click', function(){  
                    var name = $(this).attr('data-html-editor-name');
                    var command = buttons_arr[name].command;
                    var args = buttons_arr[name].args;
                    if(buttons_arr[name].args_function)
                        args = buttons_arr[name].args_function();
                    objDoc.execCommand(command, false, args); 
                    iframe[0].contentWindow.focus();
                });
                $(html_buttons[name]).addClass('wysiwyg_button');
                if(buttons_arr[name].iconClass) 
                    //$(html_buttons[name]).html('<img src="'+buttons_arr[name].icon+'" alt="'+buttons_arr[name].title+'" />');
                    $(html_buttons[name]).addClass(buttons_arr[name].iconClass);
                else
                    $(html_buttons[name]).html(buttons_arr[name].title);
                button_area.append(html_buttons[name]);
            }
        }

        $(this).append(button_area);
        var iframe_wrapper = $(document.createElement('div'));
        iframe_wrapper.addClass('iframe_wrapper');
        if(options && options.style)
            iframe_wrapper.css(options.style);
        
        iframe = $(document.createElement('iframe'));
        iframe.on('load', function(){
            objDoc = iframe[ 0 ].contentWindow.document;
            objDoc.close();
            objDoc.designMode = 'on';
        });
        iframe.src = "about:blank";
        iframe.addClass('wysiwyg_iframe');
        //iframe.contents().find('body').html('<br>');

        iframe_wrapper.append(iframe);

        $(this).append(iframe_wrapper);
        
        this.getHtmlCode = function(){
            return iframe.contents().find('body').html();
        }
        this.setHtmlCode = function(htmlcode){
            iframe.contents().find('body').html(htmlcode);
            return;
        }

        $(this).addClass('html_editor_plugin');
        if(options && options.width)
            $(this).css('width',options.width);
        if(options && options.height)
            $(this).css('height',options.height);

        return this;

        function insertImg(){
            var path = divImgStyle.attr('data-path');
            var w = divImgStyle.find('input#wid').val();
            if(w<20) w=20;
            if(w>100) w=100; 
            var s = divImgStyle.find('select#side').val();
            var s2 = (s.substr(0,5)!=='full_' && s!== 'center')?
                    'float:'+s+';' : '';
            var img = `<img src="${path}" 
            alt="slika" style="${s2} width:${w}%; max-width:100%; padding:1em; box-sizing:border-box;" />`;
            var insert = (s.substr(0,5)=='full_')? 
                `<div style="text-align:${s.substr(5)}">${img}</div>` : img;
            objDoc.execCommand('insertHtml', false, insert); 
            divImgStyle.hide();
            iframe[0].contentWindow.focus();
        }
        function createImageStyleDiv(){
            divImgStyle=$(document.createElement('div'));
            divImgStyle.addClass("imgStyling");
            divImgStyle.html(`
                <p>Širina:<input id="wid" value=100 min="20" max="100" type="number" />%</p>
                <p>Strana:<select id="side">
                    <option value="full_center">NA SREDINI</option>
                    <option value="left">LEVO</option>
                    <option value="right">DESNO</option>
                    <option value="full_left">LEVO BEZ TEXTA</option>
                    <option value="full_right">DESNO BEZ TEXTA</option>
                </select></p>`);
            var btn = $(document.createElement('button'));
            btn.text('OK');
            btn.on('click', () => insertImg());
            divImgStyle.append(btn);
            $('body').append(divImgStyle);
        }
    };
 
}( jQuery ));