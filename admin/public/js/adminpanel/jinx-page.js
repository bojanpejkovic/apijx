
window.onerror = function(poruka, url, red, kol, errorObj) {
     var msg = poruka +'. URL: '+url+'. Line: '+red;
     if(kol !== undefined) msg += ' Column: ' + kol+'. ';
     if(errorObj !== undefined) 
        msg += 'ErrorObj: ' + errorObj;
     jinxPage.display(msg, 'red');
     //return true; 
     //true - ne poziva se browser_windows.onerror
     //pa nema prijavljene greške u konzoli browsera.
}



//some global stuff
Date.prototype.twoDigitsDate = function(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}
Date.prototype.mysqlDateTimeFormat = function() {
    return this.getFullYear().toString() + "-" + this.twoDigitsDate(1 + this.getMonth()) + "-" + this.twoDigitsDate(this.getDate()) + " " + this.twoDigitsDate(this.getHours()) + ":" + this.twoDigitsDate(this.getMinutes()) + ":" + this.twoDigitsDate(this.getSeconds());
};
Date.prototype.mysqlDateFormat = function() {
    return this.getFullYear().toString() + "-" + this.twoDigitsDate(1 + this.getMonth()) + "-" + this.twoDigitsDate(this.getDate());
};
Date.prototype.mysqlTimeFormat = function() {
    return this.twoDigitsDate(this.getHours()) + ":" + this.twoDigitsDate(this.getMinutes()) + ":" + this.twoDigitsDate(this.getSeconds());
};
Date.prototype.mysqlYearFormat = function() {
    return this.getFullYear().toString();
};

$('.a_error_log').on('click', function(){
    //jinxPage.toggleDisplayAdmin();
    $(this).hide();
});
$('.toggle_sa_error_log').on('click', function(){
    jinxPage.toggleSaErrorLog();
});

$('#menuIcon').on('click', function(){
    jinxPage.menuIconClick();
});

$(window).on('resize', function(){
    jinxPage.windowResize();
});
window.addEventListener('popstate', function(){
    jinxPage.loadState(); 
});
/*****************************************************************************************************************
**
**
*****************************************************************************************************************/


var jinxPage = {

    jinxSqlFields : {},
    jsonStructures: {},

    allJinxViews: {},
    //PUBLIC:
    allErrors : [],
    historyArr: [], historyInd : 0,
    menuIconMaxWidth : -1,
    menuSettings: {},

    display: function(text, color){
        /*if( $('.sa_error_log').length == 0){
            this.allErrors.push(text);
            return;
        }*/
        if(text == 'reset_log'){ 
            $('.sa_error_log div.list').html('');  return; 
        };
        if(color === undefined) var color = 'black';
        $('.sa_error_log div.list').append('<br /><p style="color:'+color+'">'+text+'</p>');
        $('.sa_error_log div.list')[0].scrollTop = $('.sa_error_log div.list')[0].scrollHeight;
    },
    sAdminDisplayDiv: $('.sa_error_log'),
    sAdminDisplayDivList: $('.sa_error_log div.list'),
    clearSaDisplayAdmin: function(){
        this.sAdminDisplayDivList.html('');
    },
    toggleSaErrorLog: function(){
        var hidden = this.sAdminDisplayDiv.hasClass('hideSaErrorLog');
        this.sAdminDisplayDiv.removeClass('hideSaErrorLog');
        if(hidden == false)
            this.sAdminDisplayDiv.addClass('hideSaErrorLog');
    },
    

    adminDisplayDiv: $('.a_error_log'),
    adminDisplayDivList: $('.a_error_log div.list'),
    clearDisplayAdmin: function(){
        this.adminDisplayDivList.html('');
    },

    colorInfoText: 'green', 
    displayAdmin: function(reset, text, color, hideAfter){
        if(reset == true) this.adminDisplayDivList.html('');  
        if(color === undefined) var color = 'black';
        this.adminDisplayDivList.append('<p style="color:'+color+'">'+text+'</p>');
        var htmlDiv = this.adminDisplayDiv;
        htmlDiv.fadeIn();
        if(hideAfter > 0)
            setTimeout( function(){
                htmlDiv.fadeOut();
            }, hideAfter*1000);
    },


    ajaxCall : function(url, method, data, callback){
        var nData = (method == 'GET')? data : JSON.stringify(data);
        url = window.location.href+url;
        jinxPage.display('request: '+url+'<br >'+JSON.stringify(data), 'blue');
        $.ajax({ type: method, url: url, contentType: 'application/json; charset=UTF-8',
            dataType: "text", data: nData, cache: false,
            success: function (tData) {
                var rData;
                if(tData && $.trim(tData) !== '')
                    try{
                        rData = JSON.parse(tData);
                        jinxPage.display('request: '+url+'<br >'+jinxPage.firstLevel(rData), 'green');
                    }catch(e){
                        jinxPage.display('ERROR: Cant parse to JSON: '+tData);
                        return;
                    }
                if(callback && typeof callback == 'function') 
                    callback(rData);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                jinxPage.display('request: '+url+'<br >'+JSON.stringify(data), 'red');
                if(jqXHR.status == 404) {
                    jinxPage.display('Wrong permissions. Page does not exists.', 'red');
                    return;
                }
                jinxPage.display(JSON.stringify(jqXHR), 'red');
                jinxPage.display(textStatus + " FROM ERROR " + errorThrown, 'red');
            }
        });
    },
    json2str: function(data, nl, tab1){
        if(data === undefined) return '{ undefined }';
        var str = JSON.stringify(data), len = str.length;
        var buffer = "\t";
        var tab = (tab1)? tab1 : " _ ";
        var strOpened = false;
        if(nl === undefined) nl = "<br />";
        for(var i=0; i<len; i++){
            var ch = str.substr(i, 1); 
            if(ch == '"') strOpened = !strOpened;
            if(strOpened === true){
                buffer += ch; continue;
            }
            if(ch !== '{' && ch !== '}' && ch !== '[' && ch !== ']'){
                buffer += ch;
                if(ch == ':') buffer += ' ';
                if(ch == ',') buffer += nl + tab;
            }
            if(ch == '{' || ch == '['){
                tab += (tab1)? tab1 : " _ ";
                buffer += ch + nl + tab;
            }
            if(ch == '}' || ch == ']'){
                buffer += nl;
                if(tab1)
                    tab = tab.substr(0, tab.length - tab1.length);
                else
                    tab = tab.substr(0, tab.length - 3);
                buffer += tab + ch;
            }
        }
        return buffer;
    },
    firstLevel: function(obj){
        var strObj = {};
        for(var prop in obj){
            if(typeof obj[prop] === 'object')
                strObj[prop] = 'object';
            else
                if(typeof obj[prop] === 'function')
                    strObj[prop] = 'function';
                else
                    strObj[prop] = obj[prop];
        }
        return this.json2str(strObj);
    },
    copyObj : function(source, dest){
        for(var property in source)
            if(property !== '_comment')
                if( typeof source[property] !== 'object'){
                    dest[property] = source[property];  
                }else{
                    if( Array.isArray(source[property]) ){
                        dest[property] = source[property];   
                    }else{
                        dest[property] = {}; 
                        this.copyObj(source[property], dest[property]); 
                    }
                }
    },


/*****************************************************************************************************************
**
**
*****************************************************************************************************************/
    beforeLogin: function(){
        this.ajaxCall('apijx/beforeLogin', 'POST', {});
    },
    loginPageOpen: function(callback){
        var that = this;
        this.ajaxCall('apijx/loginPage', 'GET', {}, function(received){
            if(received.type === 'error'){
                $('#new_structure').hide();
                $('#login_wrap').hide();
                if(received.msg && received.msg.length > 0){
                    for(var i=0; i<received.msg.length; i++)
                        jinxPage.displayAdmin(false, received.msg[i], 'red');
                }else{
                    jinxPage.displayAdmin(true, 'Error: no message!', 'red');
                }
                //// show ERROR ////
            }
            if(received.type === 'create'){
                $('#new_structure').show();
                $('#login_wrap').hide();
                setTimeout( ()=>$('input#db_user').focus(), 500);
            }
            if(received.type === 'login'){
                $('#new_structure').html('');
                $('#login_wrap').show();
                setTimeout( ()=>$('input[name="user"]').focus(), 500);

            }

            //razdvajanje ako je jedan jezik dobijen ili druge mogucnosti
            var thisCallback = callback;
            if(received.lng.getLanguage && received.lng.getLanguage.type === 'jsfunction')
                jinxFn[received.lng.getLanguage.language](null, function(lng){
                    jinxPage.ajaxCall('apijx/setLanguage/'+lng, 'GET', {}, function(lngObj){
                        jinxPage.setLanguage(lngObj, lng);
                        if(thisCallback && typeof thisCallback ==='function')
                            thisCallback();
                    });
                })
            else
                that.ajaxCall('apijx/setLanguage/'+received.lng.default, 'GET', {}, function(lngObj){
                    jinxPage.setLanguage(lngObj, received.lng.default);
                    if(thisCallback && typeof thisCallback ==='function')
                        thisCallback();
                });
        });
    },
    login: function(html_user, html_pass, callback){
        this.display('reset_log');
        var user = $.trim(html_user.val());
        var pass = $.trim(html_pass.val());
        if(user == ''){ //pass
            this.displayAdmin(true, jinxPage.LngMsg.emptyLogin, 'red');
            return;
        }
        var data = {user: user, pass: pass};
        var that = this;
        this.ajaxCall('apijx/login', 'POST', data, function(received){ 
                if(received.OKERR == false){
                    that.displayAdmin(true, received.msg, 'white');
                    html_pass.val('');
                    html_user.focus();
                    if(callback && typeof callback == 'function')
                        callback(received);
                }
                if(received.OKERR === true){
                    if(received.link !== '')
                        window.location = received.link;
                    else
                        if(callback && typeof callback == 'function')
                            callback(received);
                }
        });
    },

    adminPageOpen: function($divMainMenu, $divSmallMainMenu){
        if($divMainMenu) this.$divMainMenu = $divMainMenu;
        if($divSmallMainMenu) this.$divSmallMainMenu = $divSmallMainMenu;
        var that = this;
        jinxPage.ajaxCall('apijx/configTables', 'GET', {}, function(cc){
            that.display(that.firstLevel(cc));
            that.configTables = cc;
            that.getUserData(); //if success, it set language too,  and calls mainmenu.
        });
    },
    reloadServerJson : function(){
        this.ajaxCall('apijx/reloadJSON', 'GET', {}, function(data){
            if(data.OKERR == true) window.location.reload(); 
            else alert(data.msg);
        });
    },
    reloadOneJsonTable: function(){
        var tName = '';
        let currentState = history.state;
        if(currentState)
            tName = currentState.tName;
        else alert('Jok, nije definisan currentState');
        this.ajaxCall('apijx/reloadJSONtable/'+tName, 'GET', {}, function(data){
            if(data.OKERR == true) window.location.reload(); 
            else alert(data.msg);
        });
    },
    loadSqlStructureFromDb: function(callback){
        this.ajaxCall('apijx/viewSqlStructure', 'GET', {}, function(resp){ 
            callback(resp);
        });
    },

/*****************************************************************************************************************
**
**
*****************************************************************************************************************/
    allNewElNames: function(){
        var newElNames = [];
        var wrTypes = ['input', 'table', 'search'], wrapperType;
        for(var oneViewName in jinxPage.jsonStructures){
        for(var fieldName in jinxPage.jsonStructures[oneViewName].fields){
        for(var i=0; i<wrTypes.length; i++){
            wrapperType = wrTypes[i];
            if(jinxPage.jsonStructures[oneViewName].fields[fieldName][wrapperType+'View'] == 'NEW-ELEMENT'){
                var newElName = jinxPage.jsonStructures[oneViewName].fields[fieldName][wrapperType+'ViewType'];
                if(newElNames.indexOf(newElName) < 0)
                    newElNames.push(newElName);
            }
        }}};
        return newElNames;
    },

    getNewElNames: function(oneViewName, wrapperType, onlyAsync, fnType){
        var newElNames = [];
        if(!Array.isArray(wrapperType)) wrapperType = [wrapperType];
        for(var fieldName in jinxPage.jsonStructures[oneViewName].fields){
        for(var i=0; i<wrapperType.length; i++){
            wrapperType1 = wrapperType[i];
            if(jinxPage.jsonStructures[oneViewName].fields[fieldName][wrapperType1+'View'] == 
            'NEW-ELEMENT'){
                var newElName = jinxPage.jsonStructures[oneViewName].fields[fieldName][wrapperType1+'ViewType'];
                if(jinxPage.configTables.newElementsDef[newElName] === undefined)
                    // jinxPage.display(fieldName+' have '+wrapperType1+'ViewType: '+newElName
                    //     +', that is not defined in configTables.newElementsDef', 'red');
                    jinxPage.configTables.newElementsDef[newElName] = {
                        async:false, jsSrc: [], cssSrc:[]
                    }
                if(!onlyAsync || jinxPage.configTables.newElementsDef[newElName].async === true)
                if(fnType === undefined || typeof jinxFn[newElName].asynCall === fnType)
                if(newElNames.indexOf(newElName) < 0)
                        newElNames.push(newElName);
            }
        }};
        return newElNames;
    },
    loadStructureFromServer: function(callback){
        var that = this;
        this.ajaxCall('apijx/viewJsonList', 'GET', {}, function(data){
            jinxPage.jsonStructures = data.formsData;
            jinxPage.display('apijx/viewJsonList.formsData: '+jinxPage.firstLevel(data.formsData));
            jinxPage.display('apijx/viewJsonList.settings: '+jinxPage.firstLevel(data.settings));
            var pathToPublic = '../';  
            var jsAdded = [], cssAdded = [];
            var newElNames = jinxPage.allNewElNames();
            for(var tName in data.settings.mainMenu){
                var mm = data.settings.mainMenu[tName];
                if(mm.fn && mm.fn !== '' && typeof jinxFn[mm.fn] === 'function')
                    newElNames.push(mm.fn);
            }
            for(var i=0; i<newElNames.length; i++){
                var newElName = newElNames[i];
                var NEDef = jinxPage.configTables.newElementsDef[newElName];
                if(NEDef == undefined) continue;
                var jsArr = NEDef.jsSrc;
                if(jsArr)
                for(var jsInd=0; jsInd<jsArr.length; jsInd++)
                    if(jsAdded.indexOf(jsArr[jsInd]) < 0)
                        jsAdded.push(jsArr[jsInd]);
                var cssArr = NEDef.cssSrc;
                if(cssArr)
                for(var cssInd=0; cssInd<cssArr.length; cssInd++)
                    if(cssAdded.indexOf(cssArr[cssInd]) < 0)
                        cssAdded.push(cssArr[cssInd]);
            };
            if(callback && typeof callback == 'function'){
                jinxPage.dynScriptCallback = callback;
                jinxPage.dynScriptData = data;
            }
            jinxPage.dynScriptsLen = jsAdded.length + cssAdded.length; 
            jinxPage.dynScriptsLoadedLen = 0;
            for(var i=0; i<jsAdded.length; i++){
                if(jsAdded[i].substr(0,4) === 'http') 
                    jinxPage.loadDynScripts(jsAdded[i], function(){ jinxPage.dynScriptLoaded('js', jsAdded[i]); });
                else 
                    jinxPage.loadDynScripts(pathToPublic+jsAdded[i], function(){ jinxPage.dynScriptLoaded('js', jsAdded[i]); });
            }
            for(var i=0; i<cssAdded.length; i++){
                if(cssAdded[i].substr(0,4) === 'http') 
                    jinxPage.loadDynLink(cssAdded[i], function(){ jinxPage.dynScriptLoaded('css', cssAdded[i]); });
                else 
                    jinxPage.loadDynLink(pathToPublic+cssAdded[i], function(){ jinxPage.dynScriptLoaded('css', cssAdded[i]); });
            } 
            that.ajaxCall('apijx/sqlFields', 'GET', {}, function(resp){
                jinxPage.jinxSqlFields = resp;
                jinxPage.dynScriptLoaded('sqlFields', 'sqlFields'); 
            });               
        });
    },

    loadDynScripts: function(url, callback){
        var script = document.createElement('script');
        script.type = 'text/javascript';
        if(callback && typeof callback == 'function')
            script.onload = callback;
        script.onerror = function(){ jinxPage.dynScriptLoaded('error', url); };
        if(url.indexOf('?') < 0)
            script.src = url+'?v'+(new Date().getMilliseconds());
        else
            script.src = url+(new Date().getMilliseconds());
        document.head.appendChild(script);
    },
    loadDynLink: function(url, callback){
        var link = document.createElement('link');
        link.type= 'text/css';
        if(callback && typeof callback == 'function')
            link.onload = callback;
        link.onerror = function(){ jinxPage.dynScriptLoaded('error', url); };
        link.rel = "stylesheet";
        if(url.indexOf('?') < 0)
            link.href = url+'?v'+(new Date().getMilliseconds());
        else
            link.href = url+(new Date().getMilliseconds());
        document.head.appendChild(link);
    },

    dynScriptsLoadedLen: 0,
    dynScriptsLen: 0,
    dynScriptCallback: '', dynScriptData: {},
    dynScriptLoaded: function(fileType, url){
        jinxPage.dynScriptsLoadedLen++;
        if(fileType === 'error'){
            jinxPage.display('Error loading link: '+url, 'red');
        }
        jinxPage.display(jinxPage.dynScriptsLoadedLen+' of '+jinxPage.dynScriptsLen);
        /*  ">" sqlFields is one more file to load */
        if(jinxPage.dynScriptsLoadedLen > jinxPage.dynScriptsLen){  
            if(jinxPage.dynScriptCallback && typeof jinxPage.dynScriptCallback == 'function')
                jinxPage.dynScriptCallback(jinxPage.dynScriptData);
        }
    },
    
/*****************************************************************************************************************
**
**
*****************************************************************************************************************/

    createStructureOnServer: function(html_user, html_pass, html_db){
        this.display('reset_log');
        var user = $(html_user).val();
        var pass = $(html_pass).val();
        var db = $(html_db).val();
        if(user == '' || db === ''){ //pass
            this.display('You did not type a username and/or db name!', 'red');
            return;
        }
        if(!confirm('Are you sure you want to create?')) return;
                
        var dataSend = { user:user, pass:pass, db:db };
        var that = this;
        this.ajaxCall('apijx/createJsonServerStructure', 'GET', dataSend, function(resp){
            if(resp === undefined)
                that.display('resp is undefined in createServerStructure.', 'red');
            else
            if(resp.OKERR !== true){
                that.display(resp.msg, 'red');
                that.sAdminDisplayDivList.show();
                alert();
                //ER_DBACCESS_DENIED_ERROR
                //ER_ACCESS_DENIED_ERROR
                //ER_BAD_DB_ERROR
                //ECONNREFUSED ako mysql nije ukljucen            
            } else {
                //that.reloadServerJson();
                alert('ADMIN basic HTML is READY!');
                window.location.reload();  
            }
        });
    },

    createJsonStructureFromDbTable: function(tName){
        var dataSend = { tName: tName };
        var that = this;
        this.ajaxCall('apijx/getTableType', 'GET', dataSend, function(resp){ 
            if(resp.OKERR === true){
                var that2 = that; 
                dataSend.tType = resp.tableType;
                that.ajaxCall('apijx/createJsonStructureFromDbTable', 'GET', dataSend, function(resp2){ 
                    //preoveri odgovor prvo
                    if(resp2[tName] && resp2[tName] == 'created')
                        that2.reloadServerJson();
                    else{
                        that2.display('Error: Json structure not created! ');
                        that2.display(that2.json2str(resp2));
                    }
                });
            }else{
                that.display('getTableType FAILED!');
            }
        });
    },

    createField:function(what, sqlTable, field){
        var dataSend = { sqlTable: sqlTable, sqlField:field };
        this.ajaxCall('apijx/'+what, 'GET', dataSend, function(resp){ 
            if(resp.OKERR === true){
                jinxPage.reloadServerJson();
            }else{  
                jinxPage.display(resp.msg, 'red');
            }
        });
    },

/*****************************************************************************************************************
**
**
*****************************************************************************************************************/
    createSaMainMenu: function(allData){
        var data = allData.formsData;
        //allData.settings is configTables.saSettings (with mainMenu added)
        var ul = $('#jinx_view_meni');
            
        for(var tName in data){
            //data is all VIEWS that exists for superAdmin
            jinxPage.display(tName);
            this.createView(
                tName, $('#admin_view'), $('#admin_input_view'), $('#admin_table_view')
            );
            if(data[tName].types){
                var orig_types = data[tName].types;
                var types = [];
                if(orig_types.indexOf('table') >= 0 && orig_types.indexOf('input') >= 0 &&
                data[tName].tableSettings.tableWithInput == true)
                    types.push("page");
                else{
                    if(orig_types.indexOf('table') >= 0) 
                        types.push("table");
                    if(orig_types.indexOf('input') >= 0) 
                        types.push("input");
                }
                for(var v=0; v<types.length; v++){
                    this.createSaViewMenuLi(tName, types[v])
                        .appendTo(ul);
                };
            }
        };
    },
    createSaViewMenuLi: function(tName, type){
        var li = $(document.createElement('li'));
        li.attr({
            'data-jinx-table' : tName, 'data-jinx-view': type
        }).text(type.toUpperCase()+' -- "'+tName+'"');
        li.on('click', $.proxy(this.mainMenuLiClick, this));
        return li;
    },

    createAdminMainMenu: function(htmlParent){
        this.loadStructureFromServer(
            function(allData){
                jinxPage.menuSettings = allData.settings; 
                jinxPage.createAdminMainMenuInDiv(allData, htmlParent);
                //uers callback function
                if(allData.settings && allData.settings.callbackFns && 
                allData.settings.callbackFns.afterMainMenu &&
                typeof jinxFn[allData.settings.callbackFns.afterMainMenu] == 'function')
                    jinxFn[allData.settings.callbackFns.afterMainMenu](jinxPage.user);
                //call default table
                if(history.state) jinxPage.loadState();
                else
                if(allData.settings.defaultTable && allData.settings.defaultTable !== ''){
                    var tName = allData.settings.defaultTable;
                    $('#mainMenu_wrapper ul.menu li[data-jinx-table="'+tName+'"]').trigger('click');                    
                }
            }
        );
    },

    createAdminMainMenuInDiv: function(allData, htmlParent){
        //allData.formsData - all json files
        //allData.settings - settings for admin in configTables.adminSettings
        
        //set icon for menu, and when to show it
        this.setBigAndSmallMenu(allData.settings.smallScreens);

        var ul = $(document.createElement('ul'));
        var uls = $(document.createElement('ul'));
        ul.addClass('menu');
        uls.addClass('menu');
        for(var tName in allData.settings.mainMenu){
            var mm = allData.settings.mainMenu[tName];
            if(allData.formsData[mm.viewName]){
                this.createView(
                    mm.viewName, 
                    $('#admin_view'), $('#admin_input_view'), $('#admin_table_view')
                );
            };
            if(mm.smallScreens && mm.smallScreens.length > 0){
                jinxPage.display('smallScreens for '+tName, 'purple');
                for(var i=0; i< mm.smallScreens.length; i++){
                    if(mm.smallScreens[i].viewName && allData.formsData[mm.smallScreens[i].viewName]){
                        this.createView(
                            mm.smallScreens[i].viewName, 
                            $('#admin_view'), $('#admin_input_view'), $('#admin_table_view')
                        );
                    }else
                        jinxPage.display('NO smallScreens for '+tName+'->'+mm.smallScreens[i].viewName, 'purple');
                }
            }
            //allData.settings is configTables.adminSettings
            if(mm.label && mm.label !== ''){
                var li = $(document.createElement('li'));
                var lis = $(document.createElement('li'));
                var lbl = (mm.labelLng === true)? jinxPage.LngMsg[mm.label] : mm.label;
                var jinx_table = (mm.viewName)? mm.viewName : mm.fn;
                var jinx_view = (mm.viewName)? "page" : "function";
                li.attr({
                    'data-jinx-table' : jinx_table, 'data-jinx-view': jinx_view
                }).text(lbl);
                lis.attr({
                    'data-jinx-table' : jinx_table, 'data-jinx-view': jinx_view
                }).text(lbl);
                li.on('click', $.proxy(this.mainMenuLiClick, this));
                lis.on('click', $.proxy(this.mainMenuLiClick, this));
                li.appendTo(ul);
                lis.appendTo(uls);
            };
        };
        if(this.$divMainMenu && this.$divMainMenu.length > 0)
            this.$divMainMenu.append(ul);
        if(this.$divSmallMainMenu && this.$divSmallMainMenu.length > 0)
            this.$divSmallMainMenu.append(uls);

        return [ul, uls];
        /*if(htmlParent && htmlParent.length > 0)
            htmlParent.append(ul);
        else 
            return ul;*/
    },
    mainMenuLiClick : function(event){
        $('.selected').removeClass('selected');
        $(event.target).addClass('selected');
        var tName = $(event.target).attr('data-jinx-table');
        var view = $(event.target).attr('data-jinx-view');
        this.createAndOpen(tName, view);
    },
    selectMenu: function(menu){
        $('ul.menu li').removeClass('selected');
        $('ul.menu li[data-jinx-table="'+menu+'"]').addClass('selected');
    },
    createAndOpen: function(tName, viewType, sendData){
        var view = (viewType == "page")? "table" : viewType;
        var pn = (view == 'table')? 1 : undefined;
        var data = (sendData)? sendData : { 'pageNumber' : pn }; 
        if(viewType !== 'function'){
            if(data.whereCols == undefined && this.jsonStructures[tName].orderBy.searchDefaultJustOnce === true)
                data.whereCols = this.allJinxViews[tName][0].getDefaultSearchOrder();
            
            //is it time for smaller table view ???
            if(this.menuSettings.smallScreens && this.menuSettings.smallScreens.build === 'oneTable'){
                var w = parseInt($(window).width());
                var mm = this.menuSettings.mainMenu[tName];
                if(this.user.type === 'admin' && mm.smallScreens && mm.smallScreens.length > 0)
                    for(var i=0; i< mm.smallScreens.length; i++)
                        if(mm.smallScreens[i].viewName && w <= parseInt(mm.smallScreens[i].maxWidth))
                            tName = mm.smallScreens[i].viewName;
            };
        };        

        this.addHistoryLink(tName, view, data);
        if(view !== 'function')
            this.openView(tName, view, undefined, data, 0, 'all' );
        else
            this.userFnMainMenu(tName);
        if(this.$divSmallMainMenu && this.$divSmallMainMenu.length > 0)
            this.$divSmallMainMenu.hide();
    },
    userFnMainMenu: function(fnName){
        this.resetAllDivs();
        var htmlDiv1 = $('#admin_view #admin_table_view');                
        var htmlDiv2 = $('#admin_view #admin_input_view');                
        htmlDiv1.attr({ 'data-jinx-view': 'function', 'data-jinx-table': fnName }).show();
        htmlDiv2.attr({ 'data-jinx-view': 'function', 'data-jinx-table': fnName }).show();
        jinxFn[fnName](htmlDiv1, htmlDiv2);
    },

    addHistoryLink : function(tName, view, data){
        history.pushState({ tName: tName, view: view, data: data }, null, document.URL);
    },
    loadState:function(){
        let currentState = history.state;
        if(currentState){
            var tName = currentState.tName;
            var view = currentState.view;
            var data = currentState.data;
            jinxPage.selectMenu(tName);
            if(view !== 'function')
                jinxPage.openView(tName, view, undefined, data, 0, 'all' );
            else
                jinxPage.userFnMainMenu(tName);
        }
    },
    setBigAndSmallMenu: function(smallScreens){
        this.menuIconMaxWidth = 600;
        if(smallScreens !== undefined){
            if(smallScreens.icon) $('#menuIcon').prop('src', '../img/'+smallScreens.icon);
            if(smallScreens.maxWidth) this.menuIconMaxWidth = smallScreens.maxWidth;
        }
        $('body').append(
            '<style>@media only screen and (max-width: '+this.menuIconMaxWidth+'px) { '+
                'div#mainMenu_wrapper{  display: none;  }'+
                'div#smallMainMenu_wrapper{    display:block; }'+
                '#menuIcon{ display: block; }'+
                'div#admin_view{  left:0; width:100%;  }'+
            '}</style>'
        );
    },

    windowResize: function(){
        var w = parseInt($(window).width());
        if(w > jinxPage.menuIconMaxWidth)
            if(this.$divSmallMainMenu && this.$divSmallMainMenu.length > 0)
                this.$divSmallMainMenu.hide();
    },

    menuIconClick: function(){
        if(this.$divSmallMainMenu && this.$divSmallMainMenu.length > 0)
            this.$divSmallMainMenu.toggle();
    },

    hideColumns: function(tName){
        if(this.menuSettings.smallScreens && this.menuSettings.smallScreens.build === 'hideColumns'){
            jinxPage.display('this.jsonStructures: '+jinxPage.firstLevel(this.jsonStructures), 'purple');
            //hide some columns
            var mm = this.menuSettings.mainMenu[tName];
            var to = this.jsonStructures[tName].orderBy.tableOrder;
                $('.hideColumnsDiff').remove();
            if(this.user.type === 'admin' && mm.smallScreens && mm.smallScreens.length > 0){
                for(var i=0; i< mm.smallScreens.length; i++){
                    var w = parseInt(mm.smallScreens[i].maxWidth);
                    var tNameSS = mm.smallScreens[i].viewName;
                    var structure = this.jsonStructures[tNameSS];
                    var $style = $(document.createElement('style')).addClass('hideColumnsDiff')
                        .prop({'type':"text/css", "media":"(max-width: "+w+"px)" });
                    var toSmall = this.jsonStructures[tNameSS].orderBy.tableOrder;
                    var found;
                    var diff = [];
                    for(var i2=0;i2<to.length;i2++){
                        found = false;
                        for(var j=0;j<toSmall.length;j++){
                            if(to[i2] === toSmall[j]){
                                found = true; break;
                            }
                        }
                        if(!found) diff.push(to[i2]);
                    }
                    jinxPage.display('DIFF: '+diff);
                    for(var i3=0;i3<diff.length;i3++){
                        $style.append('.jinxTableCell[data-jinx-cname="'+diff[i3]+'"]{ display:none; }');
                        $style.append('.jinxTableHead[data-jinx-sort-fname="'+diff[i3]+'"]{ display:none; }');
                    }
                    $('body').append($style);
                }
            }
        }

    },
/*****************************************************************************************************************
**
**
*****************************************************************************************************************/

    createView: function(tName, mainDiv, defInputDiv, defTableDiv){
        if(mainDiv === undefined)
            mainDiv = $(document.createElement('div')).attr('id', 'admin_view').appendTo('body');
        if(defInputDiv === undefined && $('#admin_input_view').length == 0)
            defInputDiv = $(document.createElement('div')).attr('id', 'admin_input_view').appendTo(mainDiv);
        if(defTableDiv === undefined && $('#admin_table_view').length == 0)
            defTableDiv = $(document.createElement('div')).attr('id', 'admin_table_view').appendTo(mainDiv);
        var structure = this.jsonStructures[tName];
        if(this.allJinxViews[tName] === undefined)
            this.allJinxViews[tName] = [];
        var ind = this.allJinxViews[tName].length;
        this.allJinxViews[tName].push(new this.jinxView(ind, structure, mainDiv, defInputDiv, defTableDiv));
    },

    refreshView: function(tName, view, key_id, sendData, indDiv){
        jinxPage.display('firstLevel: '+jinxPage.json2str(this.allJinxViews[tName]), 'purple');
        jinxPage.display('indDiv: '+tName+', '+view+', '+key_id+', '+sendData+', '+indDiv, 'purple');
        var jinxView = this.allJinxViews[tName][indDiv];
        jinxView.$divs[view].html('');
        jinxPage.display('REFRESH VIEW: '+view+' - '+tName, 'red');

        jinxView.openView(
            jinxView.$divs[view], tName, view, key_id, sendData
        );  
    },
    openView: function(tName, view, key_id, sendData, indDiv, resetDivs){
        if(this.allJinxViews[tName] === undefined){
            jinxPage.display(tName+' dont exists!', 'red');
            jinxPage.display(this.firstLevel(this.allJinxViews));
            return;
        }
        var jinxView = this.allJinxViews[tName][indDiv];
        if(resetDivs && resetDivs == 'all'){
            this.resetAllDivs();
        }else{
            //reset just this all divs in this view   
            jinxView.resetAllDivs();
            jinxView.hideAllDivs();  
        };

        this.hideColumns(tName);
        
        //open
        if(this.jsonStructures[tName] === undefined || this.jsonStructures[tName].tableSettings == undefined){
            jinxPage.display(tName+' dont exists!', 'red');
            jinxPage.display(this.firstLevel(this.jsonStructures[tName]));
            return;
        }
        if(view == 'table' && this.jsonStructures[tName].tableSettings.tableWithInput === true){
            if(view == 'input')
                jinxPage.display('reset_log');
            jinxView.showDiv('input');
            jinxView.openView(
                jinxView.$divs.input, tName, 'input', key_id, sendData
            );          
            jinxView.showDiv('table');
            jinxView.openView(
                jinxView.$divs.table, tName, 'table', key_id, sendData
            );
        }else{
            jinxPage.display('reset_log');
            var htmlEl = jinxView.$divs[view];        
            jinxView.showDiv(view);
            jinxView.openView(htmlEl, tName, view, key_id, sendData);
        };
    },
    resetAllDivs: function(){
        //reset all views that exists!
        for(var view1 in this.allJinxViews){
            for(var i=0;i<this.allJinxViews[view1].length;i++){
                this.allJinxViews[view1][i].resetAllDivs();
                this.allJinxViews[view1][i].hideAllDivs();    
                this.allJinxViews[view1][i].htmlView = [];   
            }
        }
    },
    createModalView: function(tableName, view, data, key_id){
        if(view !== 'page' && view !== 'table' && view !== 'input' && view !=='details'){
            this.display('View must be page, table, input or details');
            return;
        }
        var tbl_wrap = $(document.createElement('div')).addClass('submenu_dragg');
        var tbl = $(document.createElement('div')); 
        var inp = $(document.createElement('div')); 
        var close_btn = $(document.createElement('img')).prop('src', '../img/close.png')
            .addClass('close_submenu_dragg')
            .on('click', function(){  tbl_wrap.hide();  });
        tbl_wrap.append(inp);
        tbl_wrap.append(tbl);
        tbl_wrap.append(close_btn);
        $('body').append(tbl_wrap);
        tbl_wrap.draggable();

        jinxPage.createView(tableName, tbl_wrap, inp, tbl);
        var ind = (view == 'table' || view=='page')? tbl.attr('data-jinx-divs-id') : inp.attr('data-jinx-divs-id');
        var nowView = (view == 'page')? 'table' : view;
        console.log('ind',ind);
        jinxPage.refreshView(tableName, nowView, key_id, data, ind);
        if(view == 'page'){
            ind2 = inp.attr('data-jinx-divs-id');
            jinxPage.refreshView(tableName, 'input', key_id, data, ind2);
        }
        tbl_wrap.show();
    },

/*****************************************************************************************************************
**
**
*****************************************************************************************************************/

    asynNewElCallOver: function(tName, newElName){
        if(jinxPage.allJinxViews[tName] === undefined){
            jinxPage.display(tName+' dont exists!', 'red');
            jinxPage.display(jinxPage.firstLevel(jinxPage.allJinxViews));
            return;
        }
        for(var i in jinxPage.allJinxViews[tName])    
            jinxPage.allJinxViews[tName][i].setAsyncFieldsValues(newElName);
    },
    asynFnCallOver: function(tName, callbacks, results){
        //call asynCallback for each element
        callbacks.forEach(function(newElName){
            if(jinxFn[newElName].asynCallback && typeof jinxFn[newElName].asynCallback === 'function')
                jinxFn[newElName].asynCallback(results);
            else
                jinxPage.display('You did not assign a asynCallback(as function) for element '+newElName, 'red');
            //set val for each element
            for(var i in jinxPage.allJinxViews[tName])    
                jinxPage.allJinxViews[tName][i].setAsyncFieldsValues(newElName);
        });
        
    },

    getDataFromHtmlEl: function(htmlEl){
        if(htmlEl.length == 0) return {};
        var retData = {};
        retData.htmlParent = this.findJinxParent(htmlEl);
        if(retData.htmlParent == false){ 
            this.display('Could not find htmlParent with data-jinx-table!'); 
            return {}; 
        };
        retData.htmlDivInd = parseInt( this.findJinxParent(htmlEl, 'data-jinx-divs-id').attr('data-jinx-divs-id') );
        retData.htmlDivId = parseInt(retData.htmlParent.attr('data-jinx-htmlview-id'));
        retData.htmlViewId = parseInt(retData.htmlParent.attr('data-jinx-htmlview-id'));
        retData.tableName = retData.htmlParent.attr('data-jinx-table');
        retData.primKeyAsArray = this.allJinxViews[retData.tableName][retData.htmlDivInd]
            .getPrimaryKey(retData.htmlViewId);
        retData.primKeyAsApiString = this.allJinxViews[retData.tableName][retData.htmlDivInd]
            .getPrimaryKeyAsApiString(retData.primKeyAsArray);
        return retData;
    },
    getAllTableData: function(tName, htmlEl){
        var htmlDivInd = parseInt( this.findJinxParent(htmlEl, 'data-jinx-divs-id').attr('data-jinx-divs-id') );
        if(tName === undefined || tName == ''){
            var locD = this.getDataFromHtmlEl(htmlEl);
            tName = locD.tableName;
        };
        return this.allJinxViews[tName][htmlDivInd].getAllTableData();
    },
    findJinxParent : function(htmlEl, findAttr){
        if(findAttr == undefined) findAttr = 'data-jinx-table';
        if(htmlEl.parent().length == 0) return false;
        if(htmlEl.parent().attr(findAttr) !== undefined && htmlEl.parent().attr(findAttr) !== false)
            return htmlEl.parent();
        else 
            return this.findJinxParent(htmlEl.parent(), findAttr);
    },


    getUserData: function (user, pass, received){
        var that = this;
        jinxPage.ajaxCall('apijx/myadmindata', 'GET', {}, function(line){
            that.display('USER LINE GOT: '+that.json2str(line));
            that.user = line.data;
            that.getLanguage(function(){
                jinxPage.createAdminMainMenu();            
            });
        });
    },
    getLanguage: function(callback){
        jinxPage.ajaxCall('apijx/language', 'GET', {}, function(lngObj){
            if(lngObj.OKERR == false){
                jinxPage.display('Language not loaded: '+jinxPage.json2str(lngObj), 'red');
                return;
            }
            if(lngObj.lngName == 'jsfunction'){
                if(!jinxFn[lngObj.lng] || typeof jinxFn[lngObj.lng]!=='function'){
                    jinxPage.display('Language not loaded: '+lngObj.lng+' is not a jinxFn function.', 'red');
                    return;
                }
                jinxFn[lngObj.lng](this.user, function(lng){
                    if(lng == undefined || lng == ''){
                        jinxPage.displayAdmin(true, 'Language not loaded from function jinxFn.'+lngObj.lng+'!', 'red');
                        return;
                    }
                    lng = '/' + lng;
                    jinxPage.ajaxCall('apijx/language'+lng, 'GET', {}, function(lngObj2){
                        if(lngObj2.OKERR == false){
                            jinxPage.display('Language not loaded 2: '+jinxPage.json2str(lngObj2), 'red');
                            return;
                        }
                        jinxPage.setLanguage(lngObj2);
                        if(callback && typeof callback === 'function') callback();
                    });
                });
                return;
            }
            jinxPage.setLanguage(lngObj);
            if(callback && typeof callback === 'function') callback();     
        });       
    },
    setLanguage: function(lngObj){
        if(!lngObj) return;
        this.LngMsg = lngObj.lng;
        this.display('LANGUAGE GOT: '+lngObj.lng);
    }

};

