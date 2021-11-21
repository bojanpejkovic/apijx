<?php
	$folder_name = '';
	$btn_ok_title = '';


	if(isset($_POST['folder_name']))
		$folder_name = $_POST['folder_name'];
	else{
		echo '';
		exit;
	}
	if(isset($_POST['btn_ok_title']))
		$btn_ok_title = $_POST['btn_ok_title'];

	html_server_tree();

	function html_server_tree(){
		global $folder_name, $btn_ok_title;
		echo '<div data-jinx-class="server_tree"><div class="tree">';
		server_tree($folder_name, 0);
		echo '<img class="server_tree_img_preview" src="" />';
		echo '</div>';
		echo '<button class="server_tree_btn server_ok_image">'.$btn_ok_title.'</button>';
		echo '<button class="server_tree_btn server_cancel_image">CANCEL</button>';
		echo '</div>';
	}
	function server_tree($start_dir, $level){
		$dir = $start_dir;
		$dir_files = scandir($dir); 
		if(count($dir_files)>2){
			$marginLeft = $level * 30;
			$photo = '';
			for ($i=0;$i<count($dir_files);$i++){
				if(substr($dir_files[$i], 0,1)!='.'){
					if( !is_dir($dir.'/'.$dir_files[$i]) ){
						$photo .= '<p class="tree_node tree_image" data-path="'.$dir.'/'.$dir_files[$i].'"';
						$photo .= ' data-tree-level="'.$level.'" style="margin-left:'.$marginLeft.'px;">';
						$photo .= ''.$dir_files[$i].'</p>'; //<img src="iconphoto.png" alt="image:" /> 
					}else{
						echo '<p class="tree_node tree_dir" data-path="'.$dir.'/'.$dir_files[$i].'"';
						echo ' data-tree-level="'.$level.'" style="margin-left:'.$marginLeft.'px;">';
						echo ''.$dir_files[$i].'</p>'; //<img src="icondir.gif" alt="dir:" /> 
						server_tree($dir.'/'.$dir_files[$i], $level+1);
					}
				}
			}
			echo $photo;
		}
	}
?>