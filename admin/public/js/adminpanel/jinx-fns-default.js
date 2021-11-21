var jinxFn = {}

jinxFn.browseAndUpload = {
			name : 'browseAndUpload',
			create : function(wrapperType, label){ 
				//var tip = 'image';
				var tip = (label !== 'Excel')? 'image' : 'excel';
				//var in_cl = (label !== 'Katalog')? 'nije_bitno' : 'katalog_ime';
				//tip moze biti image ili canvas. za sad
				var htmlEl = $(document.createElement('div'));
				htmlEl.className = "uploadForm";
				var url = location.protocol+'//'+location.hostname;
				var that = this;
				htmlEl.add_browse({
                    form_name:'nova_forma', 
                    label: '<span class="form_field_label">'+label+': </span><span class="hopla"></span><br>', 
                    input_class: 'nije_bitno',  //in_cl
                    file_type: tip, 
                    file_path: '../img/upload/', 
                    php_file: url+'/admin/upload_file.php', 
                    callbackUploaded: function(filename){
						htmlEl.find('span:nth-child(2)').text(filename);
                    }
                });    
                htmlEl.val('');
				return htmlEl;
			},
			val : function(htmlEl, value, nesto, arg4){ 
				if(value == undefined){
					return htmlEl.find('span:nth-child(2)').text();
					// if(htmlEl.val() == '-1') 
					// 	return htmlEl.find('span:nth-child(2)').text();
					// else 
					// 	return htmlEl.val();
				}else{
					if(value == ''){ value = -1; htmlEl.find('span:nth-child(2)').text(''); }
					else htmlEl.find('span:nth-child(2)').text(value); 
					htmlEl.val(value);
					if(value == -1) htmlEl.find('.img_thumbnail').prop('src', '');
				}
			}
}
jinxFn.afterUpdInsertForm = function(pk, vals, div, folderInsideSlike){ 
	jinxPage.display('INSERTED: ', 'red');
	jinxPage.display(jinxPage.json2str(vals));
	//kopiraj sliku iz upload u Folder
	if(!div) return;
	var inputForms = div[0].querySelectorAll('input[type="file"]');
	jinxPage.display("BROJ FORMI: "+inputForms.length);
	var data = {
		'who':'img',
		'what':'copyImgs',
		names:[], folders:[] 
	}

	for(var i=0; i<inputForms.length; i++){
		var folder = (Array.isArray(folderInsideSlike))? folderInsideSlike[i] : folderInsideSlike;
		if(folder == undefined) folder = '';
		if(inputForms[i].files.length > 0){
			if(data.names.indexOf(inputForms[i].files[0].name) < 0){
				data.names.push(inputForms[i].files[0].name);
				data.folders.push(folder);
			}
		}
	}
	if( data.names.length > 0 ){
		var url = location.protocol+'//'+location.hostname;
		$.post(url+'/admin/manipulate_file.php', data, function(json){
			if(json.OKERR == false) 
				jinxPage.displayAdmin(false, json.msg, 'red', 3);
			else
				jinxPage.displayAdmin(false, "Fajl "+ json.filename+ " je uploadovan na server.", 'red', 3);
		})
		  .fail(function(e) {
			jinxPage.displayAdmin(false, "Nije uspelo snimanje slike "+e, 'red', 3);
		  })
	}
}
//upotreba
// jinxFn.afterUpdInsertGrupa = function(pk, vals, div){
// 	jinxFn.afterUpdInsertForm(pk, vals, div, 'glavne');
// }

////////////////////////////////////////////////////////////////////////////////////////////////////////////
jinxFn.distinctVals = {
			name: 'distinctVals',
			asynCall: function(wrapperType, tName, callback){
				var name = this.name;
				var data = {  sqlQuery: "name" };
				jinxPage.ajaxCall('apijx/sqlQuery', 'GET', data, function(getData){
					if(getData.OKERR == false){
						jinxPage.display('resp from apijx/sqlQuery: '+jinxPage.json2str(getData));
						return;
					}
					var len = getData.lines.length;
					for(var i=0; i<len; i++){
						$('*[data-jinx-view="'+wrapperType+'"] *[data-jinx-asyncName="'+name+'"].empty').append(
							'<option value="'+getData.lines[i].ColVal+'">'+getData.lines[i].Col1+'</option>'
						);
					}
					$('*[data-jinx-view="'+wrapperType+'"] *[data-jinx-asyncName="'+name+'"].empty').removeClass('empty');
					callback();
		        });
			},
			create : function(wrapType, label, allVals, name, args){ 
				var htmlEl = $(document.createElement('select'));
				htmlEl.addClass('empty');
				return htmlEl;
			},
			val : function(htmlEl, value, calcVals){ 
				if(value == undefined){
					return htmlEl.val();
				}else{
					if(value == '') value = -1;
					htmlEl.val(value);
				}
			}
};
jinxFn.distinctValsFn = function(name, queryName, ColVal, ColLabel){
		return {
			name: name,
			asynCall: function(wrapperType, tName, callback){
				jinxPage.ajaxCall('apijx/sqlQuery', 'GET', { sqlQuery: queryName }, function(getData){
					jinxPage.display('resp from apijx/sqlQuery: '+jinxPage.json2str(getData));					
					if(getData.OKERR == false)  return;
					var len = getData.lines.length;
					jinxPage.display(wrapperType);
					jinxPage.display(typeof wrapperType);
					if(Array.isArray(wrapperType)) wrapperType = 'table';
					//for(var j=0;j<wrapperType.length; j++){
						//jinxPage.display('*[data-jinx-view="'+wrapperType+'"] *[data-jinx-asyncName="'+name+'"]');
						//jinxPage.display('LENGTH: '+$('*[data-jinx-view="'+wrapperType+'"] *[data-jinx-asyncName="'+name+'"]').length);
						let s1 = $('*[data-jinx-view="'+wrapperType+'"] *[data-jinx-asyncName="'+name+'"] select.empty');
						// s1.append('<option value="0">GLAVNA</option>');
						for(var i=0; i<len; i++){
							s1.append(
								'<option value="'+getData.lines[i][ColVal]+'">'+getData.lines[i][ColLabel]+'</option>'
							);
						}
						s1.removeClass('empty');
					//}
					callback();
		        });
			},
			create : function(wrapType, label, allVals, name, args){ 
				var htmlEl = $(document.createElement('div'));
				if(wrapType !== 'table')
					htmlEl.html('<span class="form_field_label">'+label+':</span>');
				var htmlSelect = $(document.createElement('select'));
				htmlSelect.addClass('empty')
				htmlEl.append(htmlSelect);
				return htmlEl;
			},
			val : function(htmlEl, value, calcVals){ 
				if(value == undefined){
					return htmlEl.find('select').val();
				}else{
					if(value == '') value = -1;
					htmlEl.find('select').val(value);
				}
			}
		};
};
//upotreba
//jinxFn.distinctNadgrupe = jinxFn.distinctValsFn('distinctNadgrupe', 'distinctNadgrupe', 'Id', 'Naziv');
//jinxFn.sveGrupe = jinxFn.distinctValsFn('sveGrupe', 'sveGrupe', 'Sifra', 'Naziv');
////////////////////////////////////////////////////////////////////////////////////////////////////////////

jinxFn.wysiwyg = {
		name: 'wysiwyg',
		create:  function(wrapType, label){ 
			var htmlEl = $(document.createElement('div'));
			var wysEl = $(document.createElement('div'));
			wysEl.css('display', 'inline-block');
			htmlEl.wysEl = wysEl.html_editor();
			if(wrapType != 'table')
				htmlEl.prepend('<span class="form_field_label" style="vertical-align:top">'+label+':</span>');
			htmlEl.append(wysEl);    
            return htmlEl;
		},
		val : function(htmlEl, value){ 
			if(value === undefined){
				return htmlEl.wysEl.getHtmlCode();
			}else{
				setTimeout(function(){
					if(value == '') value=' ';
					htmlEl.wysEl.setHtmlCode(value);
				}, 1000);
			}
		}
}
jinxFn.wysiwygFn = function(options){
	return {
		name: 'wysiwyg',
		create:  function(wrapType, label){ 
			var htmlEl = $(document.createElement('div'));
			var wysEl = $(document.createElement('div'));
			wysEl.css('display', 'inline-block');
			htmlEl.wysEl = wysEl.html_editor(options);
			if(wrapType != 'table')
				htmlEl.prepend('<span class="form_field_label" style="vertical-align:top">'+label+':</span>');
			htmlEl.append(wysEl);    
            return htmlEl;
		},
		val : function(htmlEl, value){ 
			if(value === undefined){
				return htmlEl.wysEl.getHtmlCode();
			}else{
				setTimeout(function(){
					if(value == '') value=' ';
					htmlEl.wysEl.setHtmlCode(value);
				}, 1000);
			}

		}
	};
}
//upotreba
//jinxFn.wysOnama = jinxFn.wysiwygFn({ img_path:'slike/onama/' });

////////////////////////////////////////////////////////////////////////////////////////////////////////////

jinxFn.inputSearchAll = {
		name: 'inputSearchAll',
		create:  function(wrapType, label){ 
			var htmlEl = $(document.createElement('div'));
			if(wrapType != 'table')
				htmlEl.append('<span class="form_field_label">'+label+':</span>');
			htmlEl.append('<br /> <input value=""></input>');
            return htmlEl;
		},
		val : function(htmlEl, value){ 
			if(value === undefined){
				var v = htmlEl.find('input').val();
				if(v !== '') v = '%'+v+'%';
				return v;
			}else{
				if(value.substr(0,1) === '%') value = value.substr(1);
				if(value.substr(-1) === '%') value = value.substr(0,value.length-1);
				htmlEl.find('input').val(value);
			}
		},
		searchVal : function(htmlEl, value){ 
			var val = this.val(htmlEl);
			if(val == '') return [];
			var retObj = [
				{colName: '', val: val, oper: 'LIKE', logicOper: 'AND' }
			];
			return retObj;
		}

};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

jinxFn.shortLabel = {
		name: 'shortLabel',
		create:  function(wrapType, label){ 
			var htmlEl = $(document.createElement('div'));
            return htmlEl;
		},
		val : function(htmlEl, value){ 
			if(value === undefined){
				return htmlEl.html();
			}else{
				if(value.length > 20)
					htmlEl.html(value.substr(0,20)+'...');
				else
					htmlEl.html(value);					
			}

		}
};
jinxFn.labelVr = {
	name: 'labelVr',
	create:  function(wrapType, label){ 
		var htmlEl = $(document.createElement('div'));
		return htmlEl;
	},
	val : function(htmlEl, value){ 
		if(value === undefined){
			return htmlEl.html();
		}else{
			htmlEl.html(value);					
		}

	}
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

jinxFn.jqDatePicker = {
			name : 'jqDatePicker',
			create : function(wrapType, label, listVals, fieldName, fieldArgs){
				var htmlDiv = $(document.createElement('div'));
				if(wrapType != 'table')
					htmlDiv.append('<span class="form_field_label">'+label+':</span><br />');
				htmlDiv.append('<input />');
				htmlDiv.find('input').datepicker({	dateFormat: "dd.mm.yy" });
				return htmlDiv;
			},
			val : function(htmlElement, value){
				if(!htmlElement) return;
				htmlElement = htmlElement.find('input');
				if(value === undefined){
					//GET
					var date = htmlElement.datepicker( "getDate" );
					var ret = (date == null || date == '' || date === undefined)? 
						'' : date.mysqlDateFormat();
					return ret;
				}else{
					//SET
					if(value != '' && value != '0000-00-00' && value != null){
						var d = new Date(value);
						htmlElement.datepicker( "setDate", d);
					}else{
						var d = new Date();
						htmlElement.datepicker( "setDate", '');
					}
				}
			},
			searchVal : function(htmlElement){
				//one value returned
				
				return this.val(htmlElement);
				

				//object with more conditions returned
				/*
				var val = this.val(htmlElement);
				if(val == '') return [];
				var oldDate = new Date(val);
				oldDate.setDate(oldDate.getDate() - 7);
				var retObj = [
					{colName: '', val: this.val(htmlElement), oper: '<=', logicOper: 'AND' },
					{colName: '', val: oldDate.mysqlDateTimeFormat(), oper: '>=', logicOper: 'OR' }
				];
				return retObj;
				*/
			},
			searchDefaultVal: function(){
				return new Date();
			}
};

jinxFn.jqDatePickerDateToday = {
	name : 'jqDatePickerDateToday',
	create : function(wrapType, label, listVals, fieldName, fieldArgs){
		return jinxFn.jqDatePicker.create(wrapType, label, listVals, fieldName, fieldArgs);
	},
	val : function(htmlElement, value, allvals, type){
		if(!htmlElement) return;
		htmlElement = htmlElement.find('input');
		if(type === 'get'){
			//GET
			var date = htmlElement.datepicker( "getDate" );
			var ret = (date == null || date == '' || date === undefined)? 
				'' : date.mysqlDateFormat();
			return ret;
		}
		if(type === 'set'){
			//SET
			if(value != '' && value != '0000-00-00'){
				var d = new Date(value);
				htmlElement.datepicker( "setDate", d);
			}else{
				htmlElement.datepicker( "setDate", '');
			}
		}
		if(type === 'reset'){
			var d = new Date(value);
			htmlElement.datepicker( "setDate", d);
		}
	},
	searchVal : function(htmlElement){
		return this.val(htmlElement);
	},
	searchDefaultVal: function(){
		return new Date();
	}
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////


jinxFn.jinxTimePicker = {
			name : 'jinxTimePicker',
			create : function(wrapType, label, listVals, fieldName, fieldArgs){
					var htmlDiv = $(document.createElement('div'));
					if(wrapType !== 'table' && label && label !== '')
						htmlDiv.append('<span class="form_field_label">'+label + ':</span>');
					htmlDiv.append('<div class="jinxTime"></div>');
					htmlDiv.find('.jinxTime').jinx_time({
	                    html_type: 'input', format: 'HH:MM:SS',  output_format: 'HH:MM:SS'
	                });  
					return htmlDiv;
			},
			val : function(htmlDiv, value){
				if(!htmlDiv) return;
				var jinxEl = (htmlDiv.hasClass('jinxTime'))? htmlDiv : htmlDiv.find('.jinxTime');
				if(value === undefined){
					//GET
					var ret = jinxEl.jinx_time('val');
					if(ret == '00:00' || ret=='00:00:00') return '';
					else return ret;
				}else{
					//SET
					jinxEl.jinx_time('val', value);
				}
			}
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////


jinxFn.jinxPassword = {
			name : 'jinxPassword',
			create : function(wrapType, label, listVals, fieldName, fieldArgs){
				var htmlDiv = $(document.createElement('div'));
				if(wrapType !== 'table' && label && label !== '')
					htmlDiv.append('<span class="form_field_label">'+label + ':</span>');
				htmlDiv.append('<div class="jinxPassword"></div>');
				htmlDiv.find('.jinxPassword').jinxPassword();  
				return htmlDiv;
			},
			val : function(htmlDiv, value){
				if(!htmlDiv) return;
				var jinxEl = (htmlDiv.hasClass('jinxPassword'))? htmlDiv : htmlDiv.find('.jinxPassword');
				if(value === undefined){
					//GET
					var arr = jinxEl.jinxPassword('valGet');
					if(arr[0] === '')
						return arr[1];
					return arr;
				}else{
					//SET
					jinxEl.jinxPassword('valIs', value);
				}
			},
			markBadField : function(htmlDiv){
				if(!htmlDiv) return;
				var jinxEl = (htmlDiv.hasClass('jinxPassword'))? htmlDiv : htmlDiv.find('.jinxPassword');
				jinxEl.addClass('badPasswordInput');
			},
			unmarkBadField: function(htmlDiv){
				if(!htmlDiv) return;
				var jinxEl = (htmlDiv.hasClass('jinxPassword'))? htmlDiv : htmlDiv.find('.jinxPassword');
				jinxEl.removeClass('badPasswordInput');
			}
};
jinxFn.jinxPluginPasswordCheck = function(checkVal, calcVals){
	if(!Array.isArray(checkVal)) return true;
	if(checkVal[0] == ''){
		return true;
	}else{
		return [false, checkVal[1]];
	}
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////


jinxFn.colorPicker = {
			name : 'colorPicker',
			create : function(wrapType, label){
				if(wrapType == 'input'){
					var htmlDiv = $(document.createElement('div'));
					var title = (wrapType !== 'table' && label && label != '')? 
						'<span class="form_field_label">'+label + ':</span>'+
						'<span style="font-size:80%; font-weight:normal"> (posle odabira boje, obavezno kliknuti OK) </span>' : '';
					var htmlElement = $(document.createElement('div'));
					htmlDiv.elemObj = htmlElement.colpick({
						flat:true,
						layout:'hex',
						colorScheme:'light',
						color: 'auto',
						submit: true,
						onChange:function(hsb,hex,rgb,el,bySetColor) {
							//boja je '#'+hex;
							//htmlDiv.jinx_color_picked = '#'+hex;
						},
						onSubmit:function(hsb,hex,rgb,el,bySetColor) {
							//boja je '#'+hex;
							htmlDiv.jinx_color_picked = '#'+hex;
						}
					});
					htmlDiv.append(title);
					htmlDiv.append(htmlElement);
				}else{
					var htmlDiv = $(document.createElement('div'));
					htmlDiv.addClass('showOneColor');
				}
				htmlDiv.jinx_color_picked = '#000000';
				htmlDiv.createType = wrapType;
				return htmlDiv;
			},
			val : function(htmlDiv, value){
				if(htmlDiv.createType == 'input'){
					if(value === undefined){
						//GET
						return htmlDiv.jinx_color_picked;
					}else{
						//SET
						if(value == '') value = '#000000';
						htmlDiv.jinx_color_picked = value;
						htmlDiv.elemObj.colpickSetColor(value.substr(1), true);
					}
				}else{
					if(value === undefined){
						//GET
						return htmlDiv.jinx_color_picked;
					}else{
						//SET
						htmlDiv.jinx_color_picked = value;
						htmlDiv.css('background-color', value);
					}
					
				}
			}
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

jinxFn.getFromTo = {
			name : 'getFromTo',
			create : function(){
				var htmlEl = $(document.createElement('div'));
				var htmlEl1 = $(document.createElement('input')).attr('data-search', 'from');
				htmlEl1.prop('type', 'number');
				htmlEl1.prop('step', 1);
				var htmlEl2 = $(document.createElement('input')).attr('data-search', 'to');
				htmlEl2.prop('type', 'number');
				htmlEl2.prop('step', 1);
				htmlEl.append(htmlEl1);
				htmlEl.append(htmlEl2);
				return htmlEl;
			},
			val: function(htmlEl, value){
				alert(value);
				var htmlEl1 = $(htmlEl.find('input')[0]);
				var htmlEl2 = $(htmlEl.find('input')[1]);
				if(value == undefined){
					return htmlEl1.val();
				}else{
					if(value == '') value = 0;
					htmlEl1.val(value);
					htmlEl2.val(value);
				}
			},
			searchVal: function(htmlEl){
				//object with more conditions returned
				var htmlEl1 = $(htmlEl.find('input')[0]);
				var val1 = htmlEl1.val();
				var htmlEl2 = $(htmlEl.find('input')[1]);
				var val2 = htmlEl2.val();
				if(val1 == '' && val2 == '') return [];
				var retObj = [
					{colName: '', val: val1, oper: '>=', logicOper: 'AND' },
					{colName: '', val: val2, oper: '<=', logicOper: 'AND' }
				];
				return retObj;
			}
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

jinxFn.getFrom = {
			name : 'getFrom',
			create : function(){
				var htmlEl = $(document.createElement('input')).attr('data-search', 'from');
				htmlEl.prop('type', 'number');
				htmlEl.prop('step', 1);
				return htmlEl;
			},
			val: function(htmlEl, value){
				if(value == undefined){
					return htmlEl.val();
				}else{
					if(value == '') value = 0;
					htmlEl.val(value);
				}
			},
			searchVal: function(htmlEl){
				//object with more conditions returned
				var val1 = htmlEl.val();
				if(val1 == '') return [];
				var retObj = [
					{colName: '', val: val1, oper: '>=', logicOper: 'AND' }
				];
				return retObj;
			}
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

jinxFn.getTo = {
			name : 'getTo',
			create : function(){
				var htmlEl = $(document.createElement('input')).attr('data-search', 'from');
				htmlEl.prop('type', 'number');
				htmlEl.prop('step', 1);
				return htmlEl;
			},
			val: function(htmlEl, value){
				if(value == undefined){
					return htmlEl.val();
				}else{
					if(value == '') value = 0;
					htmlEl.val(value);
				}
			},
			searchVal: function(htmlEl){
				//object with more conditions returned
				var val1 = htmlEl.val();
				if(val1 == '') return [];
				var retObj = [
					{colName: '', val: val1, oper: '<=', logicOper: 'AND' }
				];
				return retObj;
			}
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

jinxFn.bojaOrFilePick = {
	name:"bojaOrFilePick",
	radioClick: function(htmlEl){
		var r = $('input[type="radio"][name="bojaOrFilePick"]:checked');
		if(r.val() == 'color'){
			htmlEl.cp.show();
			htmlEl.bau.hide();
		}else{
			htmlEl.cp.hide();
			htmlEl.bau.show();
		}
	},
	create: function(wrapType, label){
		var htmlEl = $(document.createElement('div')).addClass('provera');
		htmlEl.cp = jinxFn.colorPicker.create(wrapType, label);
		htmlEl.bau = jinxFn.browseAndUpload.create(wrapType, label);
		htmlEl.r1 = $(`<input type="radio" name="bojaOrFilePick" value="color">`);
		htmlEl.r2 = $(`<input type="radio" name="bojaOrFilePick" value="file">`);
		htmlEl.append(htmlEl.r1); 
		htmlEl.append('Boja<br>');
		htmlEl.append(htmlEl.r2); 
		htmlEl.append('Slika<br>');
		htmlEl.r1.on('click', this.radioClick.bind(this, htmlEl));
		htmlEl.r2.on('click', this.radioClick.bind(this, htmlEl));
		htmlEl.append(htmlEl.cp);
		htmlEl.append(htmlEl.bau);
		htmlEl.cp.hide(); htmlEl.bau.hide();
		return htmlEl;
	},
	val:function(htmlEl, value){
		if(value==undefined){
			//GET
			var r = $('input[type="radio"][name="bojaOrFilePick"]:checked');
			if(r.val() == 'color')
				return jinxFn.colorPicker.val(htmlEl.cp, value);
			else
				return jinxFn.browseAndUpload.val(htmlEl.bau, value);
		}else{
			//SET
			jinxPage.display('SET '+value);
			if(value.length == 7 && value.substr(0,1) == '#'){
				//color
				htmlEl.cp.show();
				htmlEl.bau.hide();
				htmlEl.r1.attr('checked', true);
				jinxFn.colorPicker.val(htmlEl.cp, value);
			}else{
				//file
				htmlEl.cp.hide();
				htmlEl.bau.show();
				htmlEl.r2.attr('checked', true);
				jinxFn.browseAndUpload.val(htmlEl.bau, value);
			}
		}
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////

jinxFn.selectDANE = {
			name : 'selectDANE',
			create : function(wrapType, label){
				var htmlEl = $(document.createElement('div'));
				htmlEl.append(label+':');
				let sel = $(document.createElement('select'));
				sel.html('<option value="s">SVE</option><option value="1">DA</option><option value="2">NE</option>');
				htmlEl.append(sel);
				return htmlEl;
			},
			val: function(htmlEl, value, nesto, arg4){
				if(value == undefined){
					let s = htmlEl.find('select').val();
					if(s=='s') return '';
					if(s=='2') return 0;
					return s;
				}else{
					if(value == undefined) value = 2;
					if(value == '') value = 's';
					if(value == true) value = 1;
					if(value == false || value == 'false') value = 2;
					htmlEl.find('select').val(value);
				}
			}
}

jinxFn.disabledInput = {
	name:"disabledInput",
	create:function(wrapType, label){
		let htmlEl = $(document.createElement('div'));
		htmlEl.html(label+": ");
		let htmlIn = $(document.createElement('input'));
		htmlIn.prop('disabled', true);
		htmlEl.append(htmlIn);
		return htmlEl;
	},
	val:function(htmlEl, value, nesto, arg4){
		if(value == undefined) return htmlEl.find("input").val();
		htmlEl.find("input").val(value);
	}
}















jinxFn.testFN = function(structure, wrapperType, calcVals){
	return calcVals.users_field_PoljeT15;
}

jinxFn.testRestFn = function(value, calcVals){
	var bool = (value >= calcVals.users_field_Polje6);
	var msg = (value >= calcVals.users_field_Polje6) ? '' : 'Value must be >= '+calcVals.users_field_Polje6;
	return [bool, msg];
}


jinxFn.newFnLanguage = function(user, callback){
	//2 ways to do it.
	//a) you get lng from some ASync call:
	//jinxPage.ajaxCall(url, 'GET', {}, function(lng){
		var lng = 'EN';
        callback(lng);
    //});
   
    //b) you get lng from some Sync call:
    //call it and just return the lang
    //callback(lng);
}


jinxFn.newTestBtn = {
	labelLng: false,
	label: 'Caption',
	onClick: function(event){
		var jinxViewId = $(this).attr('data-jinx-htmlview-id');
	}
}

jinxFn.btnShowSubmenu = {
	name: 'btnShowSubmenu',
	asynCall: function(wrapperType, tName, callback){
		var name = this.name;
		var data = {  sqlQuery: "queryName" };
		jinxPage.ajaxCall('apijx/sqlQuery', 'GET', data, function(getData){
			if(getData.OKERR == false){
				jinxPage.display('OKERR === false', 'red');
				jinxPage.display('resp from apijx/sqlQuery: '+jinxPage.json2str(getData));
				return;
			}
			if(getData.lines === undefined){
				jinxPage.display('getData.lines === undefined', 'red');
				jinxPage.display('resp from apijx/sqlQuery: '+jinxPage.json2str(getData));
				return;
			}
			var len = getData.lines.length;
			for(var i=0; i<len; i++)
				if(getData.lines[i].Email !== '' && getData.lines[i].Email !== null)
					$('*[data-jinx-view="'+wrapperType+'"] *[data-jinx-asyncName="'+name+'"]').append(
						'<option value="'+getData.lines[i].Email+'">'+getData.lines[i].Email+'</option>'
					);
			callback();
		});
	},
	create: function(wrapType, label, listValues, fieldName){
		var div = $(document.createElement('div'));
		var btn = $(document.createElement('button')).text('ALL SUBMENUS');
		var tbl_wrap = $(document.createElement('div')).addClass('submenu_dragg');
		var tbl = $(document.createElement('div'));
		var close_btn = $(document.createElement('span')).html('X')
			.css({ 'z-index':'1000', 'position':'absolute', 'top':'0.5em', 'right':'0.5em', 'line-height':'0.5em', 'color':'red' })
			.on('click', function(){  tbl_wrap.hide();	});
		jinxPage.createView(
			'meni_short', div, undefined, tbl
		);
		var info = $(document.createElement('span'))
			.css({ 'z-index':'1000', 'position':'absolute', 'top':'0.5em', 
				'right':'1.5em', 'line-height':'0.5em', 'color':'black' });
			//.html('ID: '+listValues['meni_field_Naziv']);
		tbl_wrap.append(tbl);
		tbl_wrap.append(close_btn);
		tbl_wrap.append(info);
		tbl_wrap.hide();
		btn.on('click', function(){
			tbl_wrap.show();
			var myData = jinxPage.getDataFromHtmlEl($(this));
			var htmlDivId = parseInt(tbl.attr('data-jinx-divs-id'));
			var data = {  
				whereCols: [{ 
					colName: 'meni_field_Pripada_ID', 
					colVal: myData.primKeyAsArray[0], 
					oper:'=', logicOper: 'AND' 
				}]
			};
			jinxPage.refreshView(
				'meni_short', 'table', undefined, data, htmlDivId
			);
			info.html('ID: '+myData.primKeyAsArray[0]);
		});
		div.append(btn);
		div.append(tbl_wrap);
		tbl_wrap.draggable();
		return div;
	},
	val: function(){
		return '';
	}
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////

jinxFn.afterMainMenu = function(user){
	jinxPage.display(JSON.stringify(user));
};



jinxFn.dataAndChart = function(parentDiv, query, colX, colY, title, type, chartColor, borderColor, time, callback){
	var div = document.createElement('div');
	div.className = "chart-parent";
	var canvas = document.createElement('canvas');
	div.append(canvas);
	parentDiv.append(div);
	jinxPage.ajaxCall('apijx/sqlQuery', 'GET', { sqlQuery: query }, function(a){
		console.log(a);
		if(a.lines){
			var labels = [], vals = [];
			for(var i=0;i<a.lines.length; i++){
				if(a.lines[i][colX] == null) continue;
				labels.push(a.lines[i][colX]);
				vals.push(a.lines[i][colY]);
			}
			jinxFn.drawChartOnCanvas(canvas, title, labels, vals, type, chartColor, borderColor, time, callback);
		}
	});
}
jinxFn.drawChartOnCanvas = function(canvas,title, x_ax, y_ax, type, chartColor, borderColor, time, callback){
    var ctx = canvas.getContext('2d');
    var myChart = new Chart(ctx, {
        type: type,
        data: {
            labels: x_ax,
            datasets: [{
                label: title,
                data: y_ax,
                borderWidth: 5,
                borderColor: borderColor,
                backgroundColor: chartColor 
            }]
        },
        options: {
        	responsive: true,
    		maintainAspectRatio: true,
            animation: { 
            	duration: time,
            	onComplete: function(){ 
            		if(callback && typeof callback === 'function') 
            			callback(canvas); 
            	}
            }
        }
    });
}



jinxFn.smTestInds = [];

jinxFn.showMultipleViewsTest1 = function(event){
	jinxPage.resetAllDivs();

	//menu 1
	var div = $(document.createElement('div')).addClass('admin_input_view');
	var tbl = $(document.createElement('div')).addClass('admin_table_view');
	$('#admin_view').append(div);
	$('#admin_view').append(tbl);
	jinxPage.createView(
		'meni', $('#admin_view'), div, tbl
	);
	jinxFn.smTestInds[0] = parseInt(div.attr('data-jinx-divs-id'));

	//menu 2
	/*
	var div2 = $(document.createElement('div')).addClass('admin_input_view');
	var tbl2 = $(document.createElement('div')).addClass('admin_table_view');
	$('#admin_view').append(div2);
	$('#admin_view').append(tbl2);
	jinxPage.createView(
		'meni', $('#admin_view'), div2, tbl2
	);
	jinxFn.smTestInds[1] = parseInt(div2.attr('data-jinx-divs-id'));

	//meni_short 1
	/*
	var div3 = $(document.createElement('div')).addClass('admin_input_view');
	var tbl3 = $(document.createElement('div')).addClass('admin_table_view');
	$('#admin_view').append(div3);
	$('#admin_view').append(tbl3);
	jinxPage.createView(
		'meni_short', $('#admin_view'), div3, tbl3
	);
	jinxFn.smTestInds[2] = parseInt(div3.attr('data-jinx-divs-id'));
	*/
	jinxPage.display('jinxFn.smTestInds: ' + jinxFn.smTestInds, 'purple');

	jinxPage.refreshView('meni', 'table', undefined, {'pageNumber': 1}, jinxFn.smTestInds[0]);
		//jinxPage.refreshView('meni', 'table', undefined, {'pageNumber': 2}, jinxFn.smTestInds[1]);
//jinxPage.refreshView('meni_short', 'table', undefined, {'pageNumber': 1}, jinxFn.smTestInds[2]);

};

////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////





