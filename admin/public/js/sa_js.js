
$(document).ready(function(){
            
            $('button#test').hide();
            $('button#test').on('click', function(){
                 //if dbColumn get user name or id, then this:
                //if jsfunction for language call it, then this:
                jinxPage.ajaxCall('apijx/language/RS', 'GET', function(js){
                    jinxPage.display(jinxPage.json2str(js));
                });
            });

            $('#json_edit').draggable();

            //DB part
            //RELOAD STRUCTURE ON SERVER
            $('button#reloadJSON').on('click', function(){
                jinxPage.reloadServerJson();
            });

            //START  
            //show DB tables and fieldsvar that = this;
            jinxPage.ajaxCall('apijx/configTables', 'GET', {}, function(cc){
                jinxPage.configTables = cc;
                jinxPage.loadSqlStructureFromDb(displaySaDbStructure);
            });
            
            function displaySaDbStructure(dbStruct){
                if(!dbStruct || dbStruct.OKERR == false){
                    jinxPage.display(jinxPage.json2str(dbStruct));
                    $('#table_page_buttons, #admin_view, #db_view, #reloadJSON').hide();
                    return;
                }
                $('ul#jinx_db_tables').html('Tables:<br />');
                $('ul#jinx_db_fields').html('Fields:<br />');
                for(var tName in dbStruct){
                    $('ul#jinx_db_tables').append('<li data-jinx-dbTName="'+tName+'">'+tName+'</li>');
                    for(var i=0; i<dbStruct[tName].length; i++){
                        $('ul#jinx_db_fields').append('<li data-jinx-dbTName="'+tName+'">'+
                            dbStruct[tName][i].COLUMN_NAME+'</li>');
                    };
                };
                jinxPage.loadStructureFromServer(createSaMainMenu);

            };
            function createSaMainMenu(allData){
                jinxPage.ajaxCall('apijx/language/EN', 'GET', {}, function(lngObj){
                    jinxPage.setLanguage(lngObj, 'EN');
                    jinxPage.display(jinxPage.firstLevel(allData));
                    jinxPage.createSaMainMenu(allData);  
                });
            };


            $('#reloadDbStructure').on('click', function(){
                jinxPage.loadSqlStructureFromDb(displaySaDbStructure);
            });

            $('#jinx_db_tables').on('click', 'li', function(){
                $('#jinx_db_tables li.selected').removeClass('selected');
                $(this).addClass('selected');
                var tName = $(this).attr('data-jinx-dbTName');
                $('ul#jinx_db_fields li').hide();
                $('ul#jinx_db_fields li[data-jinx-dbTName="'+tName+'"]').show();
            });
            $('#jinx_db_fields').on('click', 'li', function(){
                $('#jinx_db_fields li.selected').removeClass('selected');
                $(this).addClass('selected');
                var tName = $(this).attr('data-jinx-dbTName');
                var fName = $(this).text();
                var jsonName = tName+'_field_'+fName;
                if(jinxPage.jinxSqlFields.sqlFields[jsonName]){
                    var str = '';
                    str += 'SQL Type: '+jinxPage.jinxSqlFields.sqlFields[jsonName].orig_type+'<br />';
                    str += 'JSON Type: '+jinxPage.jinxSqlFields.sqlFields[jsonName].type+'<br />';
                    if($.trim(jinxPage.jinxSqlFields.sqlFields[jsonName].other) !== '')
                        str += 'Spec: '+jinxPage.jinxSqlFields.sqlFields[jsonName].other+'<br />';
                    $('#jinx_db_desc > li').html(str);
                }else{
                    $('#jinx_db_desc > li').html('No description! You should add it with button, and then manualy edit the json file!');
                }
            });


            //CREATE list of VIEWS            
            $('#json_file').val('');
            $('#jinx_view_meni').on('click', 'li', function(){
                //just for html visual selected
                $('#jinx_view_meni li.selected').removeClass('selected');
                $(this).addClass('selected');
            });

            //CREATE default json view from new DB table
            $('#createJsonDefaultTable').on('click', function(){
                if($('#jinx_db_tables li.selected').length == 0){
                    jinxPage.display('You must select table first!', 'red');
                    return;
                }
                var tName = $('#jinx_db_tables li.selected').attr('data-jinx-dbTName');
                jinxPage.createJsonStructureFromDbTable(tName);    
            });
                
            //ADD field to all views or some views
            $('#addSqlField').on('click', function(){
                if(checkSelectedDbField() == false) return;
                var tName = $('#jinx_db_fields li.selected').attr('data-jinx-dbTName');
                var fName = $('#jinx_db_fields li.selected').text();
                jinxPage.createField('createSqlFieldInSqlFile', tName, fName);
            });
            $('#addSqlFieldToDefJson').on('click', function(){
                if(checkSelectedDbField() == false) return;
                var tName = $('#jinx_db_fields li.selected').attr('data-jinx-dbTName');
                var fName = $('#jinx_db_fields li.selected').text();
                jinxPage.createField('createFieldInSqlAndDefJson', tName, fName);
            });
            $('#addSqlFieldToAllJson').on('click', function(){
                if(checkSelectedDbField() == false) return;
                var tName = $('#jinx_db_fields li.selected').attr('data-jinx-dbTName');
                var fName = $('#jinx_db_fields li.selected').text();
                jinxPage.createField('createFieldInSqlAndAllJson', tName, fName);
            });
            function checkSelectedDbField(){
                if($('#jinx_db_tables li.selected').length == 0){
                    jinxPage.display('You must select table first!', 'red');
                    return false;
                }
                if($('#jinx_db_fields li.selected').length == 0){
                    jinxPage.display('You must select field first!', 'red');
                    return false;
                }
                return true;
            }

/*************************************************************************************
**
**
*************************************************************************************/



            //JSON EDIT VIEW
            $('#editView').on('click', function(){
                if($('#jinx_view_meni li.selected').length == 0){
                    jinxPage.display('You must select view first!', 'red');
                    return;
                }
                var tName = $('#jinx_view_meni li.selected').attr('data-jinx-table');
                jinxPage.ajaxCall('apijx/jsonFile/'+tName, 'GET', {}, function(resp){
                    $('#json_file').val( jinxPage.json2str(resp, '\n', '\t') ); 
                    $('#json_edit').show();
                });
            });
            $('#close_json_edit').on('click', function(){
                $('.saveFile').attr('data-filename', '');
                $('#json_edit').hide();
            });

            //COPY VIEW
            $('#copyView').on('click', function(){
                if($('#jinx_view_meni li.selected').length == 0){
                    jinxPage.display('You must select view first!', 'red');
                    return;
                }
                var tName = $('#jinx_view_meni li.selected').attr('data-jinx-table');
                var newViewName = prompt("View name? (include folder like dir/newName without file extension) ", "");
                var data = { origView :tName, newViewName: newViewName };
                jinxPage.ajaxCall('apijx/copyView', 'GET', data, function(resp){
                    if(resp && resp.success == true && resp.tName){
                        window.location.reload();
                        return;
                    }else{
                        if(resp && resp.msg)
                            jinxPage.display(resp.msg, 'red');
                        else
                            jinxPage.display(resp, 'red');
                    }
                });
            });

            //DELETE VIEW
            $('#deleteView').on('click', function(){
                if($('#jinx_view_meni li.selected').length == 0){
                    jinxPage.display('You must select view first!', 'red');
                    return;
                }
                var tName = $('#jinx_view_meni li.selected').attr('data-jinx-table');
                var data = { tName :tName };
                jinxPage.ajaxCall('apijx/deleteView', 'GET', data, function(resp){
                    if(resp && resp.success == true){
                        window.location.reload();
                    }else{
                        jinxPage.display(resp.msg, 'red');
                    }
                });
            });
        




/*************************************************************************************
**
**
*************************************************************************************/


            //SAVE FILE and RELOAD SERVER
            $('.saveFile').on('click', function(){
                var btnId = $(this).attr('id');
                var tName = $('.saveFile').attr('data-filename');
                var url = 'apijx/update'+tName;
                if(tName === undefined || tName === ''){
                    url = 'apijx/updateView';
                    tName = $('#jinx_view_meni li.selected').attr('data-jinx-table');
                }
                var str = $('#json_file').val();
                var jsonObj;
                try{
                    jsonObj = JSON.parse(str);
                }catch(e){ 
                    jinxPage.display('File is not in JSON format. Check your JSON syntax.')
                    return;
                };
                jinxPage.ajaxCall(url, 'POST', jsonObj, function(resp){
                    if(resp && resp.success == true){
                        if(btnId == 'saveFileReload')
                            window.location.reload();
                        else
                            jinxPage.display('SAVED!', 'red');
                    }else{
                        jinxPage.display(resp.msg, 'red');
                    }
                });
            });


            $('#editConfigSe').on('click', function(){
                $('.saveFile').attr('data-filename', 'ConfigCreate');
                $.ajax({ type: 'GET', url: 'apijx/configCreate', 
                    dataType: "text", cache: false,
                    success: function (resp) {
                        $('#json_file').val( resp ); 
                        $('#json_edit').show();
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        jinxPage.display(JSON.stringify(jqXHR));
                        jinxPage.display(textStatus + " " + errorThrown);
                    }
                });
            });
            $('#editConfigCl').on('click', function(){
                $('.saveFile').attr('data-filename', 'ConfigTables');
                $.ajax({ type: 'GET', url: 'apijx/configTables', 
                    dataType: "text", cache: false,
                    success: function (resp) {
                        $('#json_file').val( resp ); 
                        $('#json_edit').show();
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        jinxPage.display(JSON.stringify(jqXHR));
                        jinxPage.display(textStatus + " " + errorThrown);
                    }
                });

            });



});