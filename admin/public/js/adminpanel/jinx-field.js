jinxPage.jinxField = {

	createHtmlField : function(wrapperType, obj, badFieldStar){  
		//wrapperType: input, table, search, details
		if(obj === undefined) return '';
		var newFormField, newFormFieldInputElement;
		var type = obj[wrapperType+'View'];
		var fType = obj[wrapperType+'ViewType'];
		if(fType == ''){
			fType = obj.type;
			obj[wrapperType+'ViewType'] = fType;
		}
		var listValues = (obj.listValues)? obj.listValues : [];

		if(wrapperType == 'input')
			jinxPage.display(obj.name+' - '+type+' - '+fType);

		if(type == 'HIDDEN'){
			newFormField = $(document.createElement('div'));
			newFormField.addClass('hidden_element');
			newFormField.attr({  'data-jinx-fname': obj.name  });
			return [newFormField, newFormField];
		}
		if(type == 'FN') return [''];
		if(type == 'DEFAULT' || type == 'NEW-ELEMENT'){
				newFormField = $(document.createElement('div')).attr({  'data-jinx-cname': obj.name  });
				if(wrapperType == 'table')
					newFormField.addClass('jinxTableCell');
				if(obj[wrapperType+'ViewMaxLen'] && obj[wrapperType+'ViewMaxLen'] !== '')
					newFormField.css('max-width', obj[wrapperType+'ViewMaxLen']);
				if(wrapperType !== 'table')
					if(type == 'DEFAULT' && obj.label && obj.label != ''){
						var lbl = (obj.labelLng === true)? jinxPage.LngMsg[obj.label] : obj.label;
						newFormField.append('<span class="form_field_label">'+ lbl + ': </span>');
					}
				if(type == 'DEFAULT'){
					newFormFieldInputElement = this.createDefaultHtmlField(obj.name, fType, listValues);
				}
				if(type == 'NEW-ELEMENT'){
					var lbl = (obj.labelLng === true)? jinxPage.LngMsg[obj.label] : obj.label;
					if(jinxFn[fType] === undefined){
						jinxPage.display('jinxFn['+fType+'] is undefined!', 'red');
						return;
					}
					newFormFieldInputElement = jinxFn[fType].create(
						wrapperType, lbl, listValues, obj.name, obj[wrapperType+'Args']
					);
					if(obj.async)
						newFormFieldInputElement.attr('data-jinx-asyncName', fType);
				}
				newFormFieldInputElement.attr({  'data-jinx-fname': obj.name  });
				this.addHtmlAttributes(newFormFieldInputElement, obj.attrList);
				newFormField.append(newFormFieldInputElement);
				if(badFieldStar == true){
					newFormField.append('<span class="badField" data-jinx-fname-bad="'+obj.name+'">*</span>');
					newFormField.append('<span class="badField" data-jinx-fname-req="'+obj.name+'">*</span>');
				}
		}
		return [newFormField, newFormFieldInputElement];
	},

	createDefaultHtmlField : function(name, type, listValues){
		if(type == 'radiogroup' || type == 'radio')
			return this.createHtmlRadioGroup(name,listValues);
		var newFormFieldInputElement, defType;
		switch (type){
			case 'label':
					newFormFieldInputElement = $(document.createElement('span'));						
					break;
			case 'text-short' : 
			case 'varchar' :
			case 'input' :
					newFormFieldInputElement = $(document.createElement('input'));						
					break;
			case 'password' : 
					newFormFieldInputElement = $('<input type="password" />');
					break;
			case 'textarea' : 
			case 'text' : 
					newFormFieldInputElement = $(document.createElement('textarea'));	
					newFormFieldInputElement.attr({ "rows": "5", "cols":"50"});					
					break;
			case 'text-html' : 
					newFormFieldInputElement = $(document.createElement('textarea'));						
					break;
			case 'number' :
					newFormFieldInputElement = $('<input type="number" step=any />');			
					break;
			case 'int' :  
			case 'year' :  
					newFormFieldInputElement = $('<input type="number" step=1 />');			
					break;
			case 'float' : 
					newFormFieldInputElement = $('<input type="number" step=0.01 />');			
					break;
			case 'checkbox' :   
			case 'boolean' :   
			case 'tinyint' :  
					newFormFieldInputElement = $('<input type="checkbox" />');
					break;	
			case 'date' :     
					newFormFieldInputElement = $('<input type="date" />');	
					newFormFieldInputElement.attr('placeholder', 'YYYY-MM-DD');				
					break;
			case 'time' :     
					newFormFieldInputElement = $('<input type="date" />');	
					newFormFieldInputElement.attr('placeholder', 'HH:MM:SS');				
					break;
			case 'datetime' :
			case 'timestamp' : 
					newFormFieldInputElement = $(document.createElement('input'));						
					newFormFieldInputElement.attr('placeholder', 'YYYY-MM-DD HH:MM:SS');				
					break;
			case 'select' : 		//moze se dodati atribut list, selected, size
					var list = listValues;
					if(list !== undefined){
							newFormFieldInputElement = $(document.createElement('select'));
							for(var listName in list){
								newFormFieldInputElement.append(
									'<option value="'+listName+'">'
									+ list[listName]+'</option>'
								);
							}
					}else{
							newFormFieldInputElement = $(document.createElement('p'));
							newFormFieldInputElement.append(
								'<b>LIST IS UNDEFINED FOR SELECT FIELD '+name+'</b>'
							);
					}
					break;
		}
		return newFormFieldInputElement;
	},
	
	createHtmlRadioGroup : function(name, listValues){
		var list = listValues;
		var newFormFieldInputElement;
		if(list !== undefined){
			newFormFieldInputElement = $(document.createElement('div'));
			for(var listName in list){
				newFormFieldInputElement.append(
					'<input name="'+name+'" type="radio" value="'+listName+'" data-jinx-fname="'+name+'" />'
					+ '<span>' + list[listName] + '</span>'
				);
			}
		}else{
			newFormFieldInputElement = $(document.createElement('p'));
			newFormFieldInputElement.append(
				'<b>LIST IS UNDEFINED FOR RADIO FIELD '+name+'</b>'
			);
		}
		return newFormFieldInputElement;
	},

	addHtmlAttributes : function(htmlElement, attrList){
		//htmlElement = (htmlElement.$htmlEl)? htmlElement.$htmlEl : htmlElement;
		if(attrList !== undefined && attrList != '')
			for(var attrListName in attrList)
				$(htmlElement).attr(
					attrListName, attrList[attrListName]
				);
	},



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////




	resetFieldValue : function(wrapperType, obj, htmlElement){
		var type = obj[wrapperType+'View'];
		if(type == 'FN') return;
		if(htmlElement == undefined || htmlElement.length == 0){
			jinxPage.display(obj.name + ' - htmlElement don\'t exist or is undefined in jinx-field.resetFieldValue()');
			return;
		} 
		if(htmlElement.attr('data-dontreset') == 'dont') return;
		var fType = obj[wrapperType+'ViewType'];
		if(fType == '') fType = obj.type;

		if(type == 'HIDDEN'){
			if(wrapperType == 'input' || wrapperType == 'search')
				htmlElement.text('');
		};
		if(type == 'NEW-ELEMENT'){
			jinxFn[fType].val(htmlElement, '', '', 'reset');
		}
		
		if(type == 'DEFAULT'){
			//radiobutton
			if(fType == 'radiogroup' || fType == 'radio'){
				htmlElement.find('input:radio').removeAttr('checked');
		        return;
			}
			//checkbox
			if(fType == 'checkbox' || fType == 'boolean' || fType == 'tinyint'){
				htmlElement.removeAttr('checked');
			}else
			//label
			if(fType == 'label'){
				if(wrapperType == 'input' || wrapperType == 'search')
					htmlElement.html('');
			}else
			//select
			if(fType == 'select'){
				htmlElement.val(-1);
			}else
			//all other elements
				htmlElement.val(''); 
		}
	},


	setFieldValue : function(wrapperType, obj, htmlElement, value, allVals){
		var type = obj[wrapperType+'View'];
		if(type == 'FN') return;
		
		if(htmlElement == undefined || htmlElement.length == 0){
			jinxPage.display(obj.name + ' - htmlElement don\'t exist in jinx-field.setFieldValue()');
			return;
		} 
		if(value === undefined && type !== 'NEW-ELEMENT'){
			//jinxPage.display(wrapperType+", "+type);
			//jinxPage.display(jinxPage.json2str(obj));
			jinxPage.display(obj.name + ' - value is undefined in jinx-field.setFieldValue()');
			return;
		}

		var type = obj[wrapperType+'View'];
		var fType = obj[wrapperType+'ViewType'];
		if(fType == '') fType = obj.type;

		if(type == 'HIDDEN'){
			htmlElement.text(value);
		};

		if(type == 'NEW-ELEMENT'){
			if(obj.async === undefined || obj.async === false)
				jinxFn[fType].val(htmlElement, value, allVals, 'set');
			else
				htmlElement.attr({ 'data-jinx-asyncVal': value, 'data-jinx-asyncName': fType });
		}
		if(type == 'DEFAULT'){
			if(value !== ''){
				if(obj.type == 'datetime' || obj.type == 'timestamp' || obj.type == 'date'){
					var d = new Date(value);
					if(isNaN(d) === false)
						value = (obj.type == 'date')? d.mysqlDateFormat() : d.mysqlDateTimeFormat();
				}
			}

			//radiobutton
			if(fType == 'radiogroup' || fType == 'radio'){
				htmlElement
		                .find('input:radio[data-jinx-fname="'+obj.name+'"][value="'+value+'"]')
		                .prop('checked', true);
		        return;
			}
			//checkbox
			if(fType == 'checkbox' || fType == 'boolean' || fType == 'tinyint'){
				if(value != '' && value != 0)
					htmlElement.prop('checked', true);
		        else
		        	htmlElement.removeAttr('checked');
			}else
			//label
			if(fType == 'label'){
				htmlElement.html(value);
			}else
			//select
			if(fType == 'select'){
				if($.trim(value) == '')
					htmlElement.val(-1);
				else
					htmlElement.val(value);
			}else
			//all other elements
				htmlElement.val(value); 
		}
	},

	getFieldValue : function(wrapperType, obj, htmlElement, calcVals){
		var type = obj[wrapperType+'View'];
		if((htmlElement == undefined || htmlElement.length == 0) && type !== 'FN'){ //type !== 'HIDDEN' &&
		 	jinxPage.display(obj.name + ' - htmlElement don\'t exist in jinx-field.getFieldValue() : fieldType ');
		 	return [false];
		};
		var fType = obj[wrapperType+'ViewType'];
		if(fType == '') fType = obj.type;
		if( (type == 'DEFAULT' && fType == 'label') || type == 'HIDDEN' || (type == 'NEW-ELEMENT' && fType.toLowerCase().indexOf('label') >= 0))
			return [false, htmlElement.text()];
		if(type == 'FN'){
			if(jinxFn[fType] && typeof jinxFn[fType] === 'function')
				return [true, jinxFn[fType](obj, wrapperType, calcVals)];
			else{
				jinxPage.displayAdmin('jinxFn.'+fType+' function is not defined!', 'red');
				return [false];
			}
		}
		var saveField = (obj[wrapperType+'Save'] !== undefined)? obj[wrapperType+'Save'] : true;
		//console.log('SAVE_FIELD:', obj.name, wrapperType, obj[wrapperType+'Save']);
		var retVal;
		if(type == 'NEW-ELEMENT')
			retVal = (wrapperType == 'search' && jinxFn[fType].searchVal && typeof jinxFn[fType].searchVal == 'function')?
					jinxFn[fType].searchVal(htmlElement) : jinxFn[fType].val(htmlElement, undefined, calcVals, 'get');
		else
		if(fType == 'radiogroup' || fType == 'radio')
			retVal = htmlElement.find('input:radio[data-jinx-fname="'+obj.name+'"]:checked').val();
		else
		if(fType == 'checkbox' || fType == 'boolean' || fType == 'tinyint')
			retVal = htmlElement.is(':checked')? 1 : 0;
		else
			retVal = htmlElement.val();
		return [saveField, retVal];
	},


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	checkRestrictions : function(htmlParent, htmlEl, view, fieldName, structure, calcVals){
		//structure is one field in fields
		if(structure[view+'View'] !== 'DEFAULT' && structure[view+'View'] !== 'NEW-ELEMENT')
			return [true];
		if(structure[view+'ViewType'] == 'label')
			return [true];
		if(structure[view+'View'] == 'NEW-ELEMENT' && structure[view+'ViewType'] == 'shortLabel')
			return [true];
		if(structure.restrictions && structure.restrictions.dontCheck === true)
			return [true];
		if(structure[view+'Save'] === false || structure[view+'View'] === false)
			return [true];
		var checkVal = calcVals[fieldName];
		
		if(checkVal === undefined || checkVal === null){
			this.markBadField(htmlParent, htmlEl, fieldName);
			var lbl = (structure.labelLng === true)? jinxPage.LngMsg[structure.label] : structure.label;
			return [false, jinxPage.LngMsg.field+' '+lbl+': '+jinxPage.LngMsg.undVal];
		}

		var check = [true];
		if(structure.restrictions)
			check = this.checkRestrictionObj(structure.restrictions, checkVal, view);
		if(structure.restrictionFn && structure.restrictionFn !== ''){
			if(jinxFn[structure.restrictionFn] === undefined || 
			typeof jinxFn[structure.restrictionFn] !== 'function'){
				return [false, 'jinxFn.'+structure.restrictionFn+' '+jinxPage.LngMsg.dontExist+'! '];
			}
			check = jinxFn[structure.restrictionFn](checkVal, calcVals);
			if(!Array.isArray(check)) check = [check, ''];
		}
		if(structure.restrictionString && structure.restrictionString !== '')		
			check = this.checkRestrictionString(structure.restrictionString, checkVal, view);
		if((structure.restrictions == undefined || 
		Object.getOwnPropertyNames(structure.restrictions).length === 0) && 
		(structure.restrictionFn == undefined || structure.restrictionFn == '') &&
		(structure.restrictionString == undefined || structure.restrictionString == '')
		&& structure.sqlFieldName !== '' && structure.sqlFieldName !== 'no_sql'){ 
			//find type in sql and just check that, 
			var sqlName = structure.sqlFieldName;
			if(jinxPage.jinxSqlFields.sqlFields[sqlName]){
				var sqlType = jinxPage.jinxSqlFields.sqlFields[sqlName].type;
				check = this.checkRestrictionType(checkVal, sqlType);
			}
		}
		if(check[0] == false){
			this.markBadField(htmlParent, htmlEl, fieldName, structure[view+'View'], structure[view+'ViewType']);
			var lbl = (structure.labelLng === true)? jinxPage.LngMsg[structure.label] : structure.label;
			check[1] = jinxPage.LngMsg.field+' '+lbl+': '+check[1];
			return check;
		}
		this.unmarkBadField(htmlParent, htmlEl, fieldName, structure[view+'View'], structure[view+'ViewType']);
		return [true];
	},
	checkRestrictionString: function(str, checkVal, wrapperType){
		if(str == '') return true;
		var restStructure = this.createRestrictionObjFromString(str);
		return this.checkRestrictionObj(restStructure, checkVal, wrapperType);
	},
	checkRestrictionObj : function(restStructure, checkVal, wrapperType){
		var check = this.check1RestrictionObj(restStructure, checkVal);
		if(check[0] == true && restStructure[wrapperType])
				check = this.check1RestrictionObj(restStructure[wrapperType], checkVal);
		return check;
	},
	check1RestrictionObj : function(restStructure, checkVal){
		if(restStructure === undefined || restStructure == null)
			return [true];
		for(var prop in restStructure){
			if(prop == 'input' || prop == 'table') continue;
			if(prop == 'notEmpty' && restStructure[prop] === true){
				if(checkVal == undefined || checkVal === null)	
					return [false, jinxPage.LngMsg.undVal];
				if($.trim(checkVal) == '')	
					return [false, jinxPage.LngMsg.emptyVal];
			}
			if(prop == 'type'){  
				var check = this.checkRestrictionType(checkVal, restStructure[prop]);
				if(check[0] == false)	
					return check;
			}
			
			if(prop == 'len' || prop == 'val'){
				var value = restStructure[prop];
				var values = value.split(';');
				for(j=0; j<values.length; j++) {
					var znak = values[j].substr(0, 1);
					var deo = values[j].substr(1, values[j].length);
					var newCheck = checkVal;
					if(prop == 'len')
						if(typeof checkVal === 'string') 
							newCheck = checkVal.length;
						else
							return [false, jinxPage.LngMsg.lenForStr+
								jinxPage.LngMsg.given+': '+typeof(checkVal)+ " - "+checkVal];

					if(prop == 'val'){
						try{
							newCheck = parseFloat(newCheck);
						}catch(e){
							return [false, jinxPage.LngMsg.valForNum+
								jinxPage.LngMsg.given+': '+typeof(newCheck) + " - "+newCheck];
						}
						if(typeof newCheck !== 'number')
						 	return [false, jinxPage.LngMsg.valForNum+
								jinxPage.LngMsg.given+': '+typeof(newCheck) + " - "+newCheck];
					}
					if(deo.substr(0,1) == '='){
						znak += '=';
						deo = parseFloat(deo.substr(1, deo.length));
					}else
						deo = parseFloat(deo);	
					if(prop == 'val')
						if(typeof(deo) !== 'number') 
							return [false, "Val restriction can be set only to type Number. "+
								typeof(deo)+ " is given. Value: "+deo];		
					var restWord = (prop == 'len') ? 'Length' : 'Value';
					var check = this.check_1_RestrictionLenVal(newCheck, deo, znak, restWord);
					if(check[0] == false)	
						return check;
				}
			}
		}
		return [true];
	},

	checkRestrictionType : function(value, type){
		if($.trim(value) == '')	return [true];
		if(type == 'int'){
			var no; 
			try{ no = parseInt(value); }catch(e){ 
				return [false, jinxPage.LngMsg.notIntVal]; 
			}
			if(no === NaN) return [false, jinxPage.LngMsg.notIntVal];
		}
		if(type == 'float'){
			var no; 	
			try{ no = parseFloat(value); }catch(e){ 
				return [false, jinxPage.LngMsg.notFloatVal]; 
			}
			if(no === NaN) return [false, jinxPage.LngMsg.notFloatVal]; 
		}
		if(type == 'datetime'){
			var arr = $.trim(value).split(' ');
			if(arr.length < 2) return [false, jinxPage.LngMsg.spaceDateTimeErr]; 
			if(arr.length > 2) return [false, arr+'. '+jinxPage.LngMsg.spaceDateTimeErr2]; 
			//date part
			var d = new Date(arr[0]);
			if(isNaN(d)) return [false, jinxPage.LngMsg.undDate]; 
			//time part
			var compare1 = /^([01]\d|2[0-3]):?([0-5][0-9]):?([0-5][0-9])$/;
            var compare2 = /^([01]\d|2[0-3]):?([0-5][0-9])$/;
            if((arr[1].match(compare1) === null) && (arr[1].match(compare2) === null))            	
				return [false, jinxPage.LngMsg.formTime+' ('+jinxPage.LngMsg.shortTimeFormat+
						' or '+jinxPage.LngMsg.longTimeFormat+')']; 
		}
		if(type == 'date'){
			var d = new Date(value);
			if( isNaN(d) ) return [false, jinxPage.LngMsg.undDate]; 
		}
		if(type == 'time'){
			var compare1 = /^([01]\d|2[0-3]):?([0-5][0-9]):?([0-5][0-9])$/;
            var compare2 = /^([01]\d|2[0-3]):?([0-5][0-9])$/;
            if((value.match(compare1) === null) && (value.match(compare2) === null))            	
				return [false, jinxPage.LngMsg.formTime+' ('+jinxPage.LngMsg.shortTimeFormat+
						' or '+jinxPage.LngMsg.longTimeFormat+')']; 
		}	
		if(type === 'year'){
			var no;
			try{ no = parseInt(value); }catch(e){ 
				return [false, jinxPage.LngMsg.formYear]; 
			};
			if(no === NaN) return [false, jinxPage.LngMsg.formYear]; 
		}
		return [true];
	},
	check_1_RestrictionLenVal : function(value, restVal, znak, restWord){
		if(znak == '>') if(value <= restVal)	return [false, restWord+' '+jinxPage.LngMsg.mustBe+' > '+restVal]; 
		if(znak == '>=') if(value < restVal)	return [false, restWord+' '+jinxPage.LngMsg.mustBe+' >= '+restVal];
		if(znak == '<') if(value >= restVal)	return [false, restWord+' '+jinxPage.LngMsg.mustBe+' < '+restVal];
		if(znak == '<=') if(value > restVal)	return [false, restWord+' '+jinxPage.LngMsg.mustBe+' <= '+restVal];
		if(znak == '=') if(value = restVal)		return [false, restWord+' '+jinxPage.LngMsg.mustBe+' = '+restVal];
		return [true];
	},

	createRestrictionObjFromString : function(str){
	    if(str === undefined) return null;
	    if($.trim(str) === '') return null;

	    var restObj = {};
		var rest = str.split(";");
		for(j=0; j<rest.length; j++) {
			rest[j] = $.trim(rest[j]);
			if(rest[j].substr(0,9) == 'dontCheck'){
				restObj.dontCheck = true;
			}
			if(rest[j].substr(0,5) == 'type='){
				restObj.type = rest[j].substr(5);
			}
			if(rest[j].substr(0,9) == 'notEmpty='){
				restObj.notEmpty = (rest[j].substr(9) == 'true');
			}
			if((rest[j].substr(0, 3) == 'len') || (rest[j].substr(0, 3) == 'val')){
				var prop = rest[j].substr(0, 3);
				var value = rest[j].substr(3, rest[j].length);
				if(restObj[prop])
					restObj[prop] += ';'+value;
				else
					restObj[prop] = value;
			}
		}
		return restObj;
	},

	isDate : function(d){
		if ( Object.prototype.toString.call(d) === "[object Date]" ) {
		  if ( isNaN( d.getTime() ) )   // d.valueOf() could also work
		    return false;
		  else return true;
		}else return false;
	},

	markForDontEverReset: function(htmlEl){
		htmlEl.attr('data-dontreset', 'dont');
	},
	markBadField: function(htmlParent, htmlEl, fieldName, view, viewType){
		if(view == 'NEW-ELEMENT' && jinxFn[viewType].markBadField 
		&& typeof(jinxFn[viewType].markBadField) == 'function')
			jinxFn[viewType].markBadField(htmlEl);
		else
			this.markBadFieldDefault(htmlParent, htmlEl, fieldName);
	},
	unmarkBadField: function(htmlParent, htmlEl, fieldName, view, viewType){
		if(viewType && view == 'NEW-ELEMENT' && jinxFn[viewType].unmarkBadField 
		&& typeof(jinxFn[viewType].unmarkBadField) == 'function')
			jinxFn[viewType].unmarkBadField(htmlEl);
		else
			this.unmarkBadFieldDefault(htmlParent, htmlEl, fieldName);
	},
	markBadFieldDefault: function(htmlParent, htmlEl, fieldName){
		if(htmlParent === undefined || htmlParent.length == 0) return;
		if(htmlEl !== undefined && htmlEl.length > 0) htmlEl.addClass('showBadField');
		htmlParent.find('*[data-jinx-fname-bad="'+fieldName+'"]').addClass('showBadField');
		htmlParent.find('*[data-jinx-fname-req="'+fieldName+'"]').addClass('showBadField');
	},
	unmarkBadFieldDefault: function(htmlParent, htmlEl, fieldName){
		if(htmlParent === undefined || htmlParent.length == 0) return;
		if(htmlEl !== undefined && htmlEl.length > 0) htmlEl.removeClass('showBadField');
		htmlParent.find('*[data-jinx-fname-bad="'+fieldName+'"]').removeClass('showBadField');
		htmlParent.find('*[data-jinx-fname-req="'+fieldName+'"]').removeClass('showBadField');
	}




//iz starog je ostalo 
//i od 428 pa na dalje.
	//addAsynHtmlElemToPage
	//checkValidTypes (sta god to bilo)
//od 586 restrictions je prebaceno 

};