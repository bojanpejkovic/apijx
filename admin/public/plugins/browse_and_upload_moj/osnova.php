<!DOCTYPE html>
<html lang="sr">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script type="text/javascript" src="jquery-1.11.0.min.js"></script>
        <script type="text/javascript" src="upload_plugin.js"></script>

		<script type="text/javascript">	

            $(document).ready(function(){
                $('.za_browse').eq(0).add_browse({
                    form_name:'nova_forma', 
                    label: 'Klikni odje:', 
                    input_class: 'nije_bitno', 
                    file_type: 'image', 
                    file_path: 'uploaded/', 
                    php_file: 'upload_file.php'
                }); 
                $('.za_browse').eq(1).add_browse({
                    form_name:'nova_forma1', 
                    label: 'Klikni odje:', 
                    input_class: 'nije_bitno1', 
                    file_type: 'image', 
                    file_path: 'uploaded/', 
                    php_file: 'upload_file.php'
                }); 
            });
		</script>
		
        <link rel="stylesheet" type="text/css" href="reset.css" />
		<link rel="stylesheet" type="text/css" href="upload_plugin.css" />
		<style type="text/css">
        html{
            width:100%; height:100%;
        }
        body{
            text-align:center;
        }
           
		</style>
		<title>Pejkovic</title>
    </head>
    <body>

        <div class="za_browse" ></div>

        <div class="za_browse" ></div>

    	
    </body>
</html>