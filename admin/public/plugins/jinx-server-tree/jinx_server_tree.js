(function ( $ ) {
    
    $.fn.jinx_server_tree = function( htmlCode ) {
    		$('body').append(htmlCode);
			var tree = $('div[data-jinx-class="server_tree"]');
			//otvori direktorijum
			$('body').on('click', 'div[data-jinx-class="server_tree"] p.tree_dir', function(){
		        var level = parseInt( $(this).attr('data-tree-level') );
		        var path =  $(this).attr('data-path');
		        level++;
		        if ($('div[data-jinx-class="server_tree"] '+
		        	'p.tree_node[data-tree-level="'+level+'"]'+
		        	'[data-path^="'+path+'"]').is(':visible')) {  
		            $('div[data-jinx-class="server_tree"] '+
		            	'p.tree_node[data-path^="'+path+'"]').hide();
		            $(this).show();
		        }else{
		            $('div[data-jinx-class="server_tree"] '+
		            	'p.tree_node[data-tree-level="'+level+'"]'+
		            	'[data-path^="'+path+'"]').show();
		        }   
		    });
		    //prikazi sliku
		    $('body').on('click', 'div[data-jinx-class="server_tree"] p.tree_image', function(){
		        $('div[data-jinx-class="server_tree"] .tree_image_selected')
		        	.removeClass('tree_image_selected');
		        $(this).addClass('tree_image_selected');
		        var path =  $(this).attr('data-path');
		        $('div[data-jinx-class="server_tree"] .server_tree_img_preview').attr('src', path);
		    });
		    //OK button click
		    $('body').on('click', 
		        'div[data-jinx-class="server_tree"] .server_ok_image', 
		        function(){
		            var path = $('div[data-jinx-class="server_tree"] .tree_image_selected')
		            	.attr('data-path');
		            //alert( path);//$(this).parent().attr('class') );
		            //$(this).parent().find('input').val(path);
		            var input_id = $(this).attr('data-jinx-caller');
		            $('input[data-jinx-id="'+input_id+'"]').val(path);
		            $('div[data-jinx-class="server_tree"]').hide();
		            $('input[data-jinx-id="'+input_id+'"]').trigger('path_set');
	        });
	        //CANCEL button click
	        $('body').on('click', 
	            'div[data-jinx-class="server_tree"] .server_cancel_image', 
	            function(){
	                $('div[data-jinx-class="server_tree"]').hide();
	                $('div[data-jinx-class="server_tree"] .server_ok_image')
	                	.attr('data-jinx-caller', '');
	        });
	        //OPEN browse click
	        $('body').on('click', '.browse_server_tree', function(){
	            $('div[data-jinx-class="server_tree"]').show();
	            var input_id = $(this).attr('data-jinx-id');
	            $('div[data-jinx-class="server_tree"] .server_ok_image')
	                .attr('data-jinx-caller', input_id);

	        });

		return this;
    };
 
}( jQuery ));