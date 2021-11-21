

	jinxPage.jinxView = function(indDiv, structure, mainWrapperDiv, defInputDiv, defTableDiv){
		if(structure)
			this.myStructure = structure;  //one json file
		else
			this.myStructure = {};
		if(mainWrapperDiv == undefined || mainWrapperDiv.length == 0)
			mainWrapperDiv = $('body');

		this.htmlView = [];	
		/*[{ mainDiv:htmlParent, type:'big_table', tableName: tableName, 
			htmlSearchViewId: -1, pageNumber: data.pageNumber }, ...]
			
			{ mainDiv:htmlForm, type:wrapperType, tableName: tableName, htmlElements:{ }, 
			primKey:{}  }]
		*/
		if(structure){
			if(defInputDiv)
				defInputDiv.attr({ 'data-jinx-divs-id': indDiv, 'data-jinx-table': structure.jsonTableName });
			if(defTableDiv)
				defTableDiv.attr({ 'data-jinx-divs-id': indDiv, 'data-jinx-table': structure.jsonTableName });
		}

		this.$divs = { main: mainWrapperDiv, input: defInputDiv, table: defTableDiv, details: defTableDiv };

		this.jinxField = jinxPage.jinxField;

		this.tableState = { search:[], sortOrder:{}, pageNumber: 0, htmlTable:'', defaultSearch:[]  };
	};



////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////

	jinxPage.jinxView.prototype.openView = function(htmlParent, tName, view, key_id, sendData){
			htmlParent.attr({ 'data-jinx-view': view, 'data-jinx-table': tName });
	        if(view !== 'table' && view !== 'details'){
				var htmlViewId = this.createInputView( tName, htmlParent, view );
	            if(key_id !== undefined){
	            	//it means we are creating form for EDIT one line
	            	var str = this.getPrimaryKeyAsApiString(key_id);
	            	var that = this;
	            	jinxPage.ajaxCall('apijx/model/' + tName + str, 'GET', {}, function(data){  
		            	that.setInputFieldsValue( htmlViewId, data.lines[0]);		            	
		            });
		        }
		        //it means we are creating form for NEW line
		        if(key_id === undefined){
		        	if(view == 'input')
		        		this.setPrimaryKey(htmlViewId);
		        };
		        //it means we have predefined vals for NEW line (ie some OUTSIDE key)
		        if(sendData && sendData.inputFieldValuesOnly){
		        	this.setInputFieldValueOnly(htmlViewId, sendData.inputFieldValuesOnly);
		        }
				
				this.callAsyncNewElementMethod(view, 1);		   
	        }
	        if(view === 'table'){
	        	if(sendData === undefined) sendData = {};
	        	if(sendData.whereCols === undefined) sendData.whereCols = [];
	        	if(!this.myStructure.orderBy.searchDefaultJustOnce)
	        		sendData.whereCols = sendData.whereCols.concat(this.getDefaultSearchOrder());
	        	var that = this;
	            jinxPage.ajaxCall('apijx/model/'+tName+'/table', 'GET', sendData, function(data){
	            	if(data.OKERR == true || (data.OKERR==false && data.msg=="Empty rows.")){
	        			that.createHtmlTable(tName, htmlParent, data);
	            	}else
	                    jinxPage.display(JSON.stringify(data), 'red');
	            });
	        }
	        if(view === 'details'){
	        	var str = this.getPrimaryKeyAsApiString(key_id);
	            var that = this;
	            jinxPage.ajaxCall('apijx/model/' + tName + str, 'GET', {}, function(data){  
	            	if(data.OKERR == true || (data.OKERR==false && data.msg=="Empty rows.")){
	        			that.createHtmlTableDetails(tName, htmlParent, data);
	            	}else
	                    jinxPage.display(JSON.stringify(data), 'red');
	            });
	        }
	};


	jinxPage.jinxView.prototype.setTableState = function(data){
		this.tableState.search = {};
		this.tableState.search.whereCols = (data.searchBy)? data.searchBy : [];
		this.tableState.search.whereCompGroup = (data.searchByGroups)? data.searchByGroups : [];
        this.tableState.pageNumber = (data.pageNumber)? data.pageNumber : -1;
        this.tableState.sortOrder = (data.orderBy)? data.orderBy : {};
		this.tableState.htmlTable = $(document.createElement('div')).addClass('jinxTable');
		if(this.myStructure.tableSettings.css_table_class && this.myStructure.tableSettings.css_table_class !=='')
			this.tableState.htmlTable.addClass(this.myStructure.tableSettings.css_table_class);
	};


	jinxPage.jinxView.prototype.resetAllDivs = function(){
        for(var type in this.$divs){
            if(this.$divs[type] && type !== 'main')
            	this.$divs[type].html('');
            if(this.$divs[type] == undefined)
            	jinxPage.display('resetAllDivs type und: '+type, 'red');
        }
    };
    jinxPage.jinxView.prototype.hideAllDivs = function(){
        for(var type in this.$divs){
            if(this.$divs[type] && type !== 'main')
                this.$divs[type].hide();
            if(this.$divs[type] == undefined)
            	jinxPage.display('hideAllDivs type und: '+type, 'red');
        }
    };
    jinxPage.jinxView.prototype.resetDiv = function(type){
        if(this.$divs[type]) this.$divs[type].html(''); else jinxPage.display('resetDiv type und: '+type, 'red');
    };
    jinxPage.jinxView.prototype.showDiv = function(type){
    	if(this.$divs[type]) this.$divs[type].show(); else jinxPage.display('showDiv type und: '+type, 'red');
    };
    jinxPage.jinxView.prototype.hideDiv = function(type){
        if(this.$divs[type]) this.$divs[type].hide(); else jinxPage.display('hideDiv type und: '+type, 'red');
    };

    jinxPage.jinxView.prototype.getDefaultSearchOrder = function(){
    	var whereCols = [];
    	if(this.myStructure.orderBy.searchDefaultVal){
	        for(var prop in this.myStructure.orderBy.searchDefaultVal){
	        	var oneObj = {};
		        oneObj.colName = prop;
		        oneObj.colVal = this.myStructure.orderBy.searchDefaultVal[prop];
		        oneObj.oper = 'LIKE'; 
		        oneObj.logicOper = 'AND';
	        	whereCols.push(oneObj);
		    };
		}
		if(this.myStructure.orderBy.searchDefaultValFn && jinxFn[this.myStructure.orderBy.searchDefaultValFn]
		&& typeof jinxFn[this.myStructure.orderBy.searchDefaultValFn] === 'function'){
			whereCols = jinxFn[this.myStructure.orderBy.searchDefaultValFn]();
		}
        return whereCols;
    };
////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////


	jinxPage.jinxView.prototype.getSqlFieldName = function(fieldName){
		var sqlName = this.myStructure.fields[fieldName].sqlFieldName;
		if(this.myStructure.fields[fieldName].thisQueryFieldName){
			sqlName = this.myStructure.fields[fieldName].thisQueryFieldName;
			return sqlName;
		}
		return jinxPage.jinxSqlFields.sqlFields[sqlName].name;
	};
	jinxPage.jinxView.prototype.createDefaultButton = function(butType, htmlViewId, caption, tableName){
		var newButton = $(document.createElement('span')).addClass('jinxBtn');
		newButton.attr({ 'data-jinx-htmlview-id': htmlViewId, 'data-jinx-type':butType });
		newButton.prop({ "tabindex":0 });  
		if(tableName)
			newButton.attr({ 'data-jinx-table': tableName });
		var allBtns = ["save","edit","reset","delete","search", "details", 'newline', 'resetsort'];
		if(allBtns.indexOf(butType) >= 0){
			var cap = (caption === undefined)? butType.toUpperCase() : caption;
			newButton.text(cap);
			var that = this;
			newButton.on('click', $.proxy( this[butType+'Click'], this )  );  
			newButton.on('keyup', function(event){
				if(event.which == 13) that[butType+'Click'](event); 
			});
		}else{
			if(jinxFn[butType]){
				var label = (jinxFn[butType].labelLng && jinxFn[butType].labelLng === true)? 
						jinxPage.LngMsg[jinxFn[butType].label] : jinxFn[butType].label;
				newButton.text(label);
				if(typeof jinxFn[butType].onClick === 'function'){
					newButton.on('click',  jinxFn[butType].onClick );
				 	newButton.on('keyup', function(event){
						if(event.which == 13) jinxFn[butType].onClick(event); 
					});
				};
			};
		};
		return newButton;
	};

	jinxPage.jinxView.prototype.setPrimaryKey = function(htmlViewId, vals){
		if(vals == undefined){
			this.htmlView[htmlViewId].primKey = {};
			return;
		}
		var len = this.myStructure.orderBy.primKeyOrder.length;
		for(var i=0; i<len; i++){
			var sqlFN = this.getSqlFieldName(this.myStructure.orderBy.primKeyOrder[i]);
			this.htmlView[htmlViewId].primKey[sqlFN] = vals[sqlFN];
		};
	};
	jinxPage.jinxView.prototype.getPrimaryKey = function(htmlViewId){
		var arr = [];
		var len = this.myStructure.orderBy.primKeyOrder.length;
		for(var i=0; i<len; i++){
			var sqlFN = this.getSqlFieldName(this.myStructure.orderBy.primKeyOrder[i]);
			arr.push(this.htmlView[htmlViewId].primKey[sqlFN]);
		}
		return arr;
	};
	jinxPage.jinxView.prototype.getPrimaryKeyFromVals = function(vals){
		var arr = [];
		var len = this.myStructure.orderBy.primKeyOrder.length;
		for(var i=0; i<len; i++){
			var sqlFN = this.getSqlFieldName(this.myStructure.orderBy.primKeyOrder[i]);
			arr.push(vals[this.myStructure.orderBy.primKeyOrder[i]]);
		}
		return arr;
	};
	jinxPage.jinxView.prototype.getPrimaryKeyAsApiString= function(arr){
		var str = '';
    	if(typeof arr === 'string') str = '/:'+arr;
    	if(Array.isArray(arr))
    		for(var i=0; i<arr.length;i++)
    			str += '/:'+arr[i];
    	return str;
	};
	jinxPage.jinxView.prototype.getHtmlViewIdFromPrimKey = function(primKey){
		var len1 = this.htmlView.length;
		var len2 = this.myStructure.orderBy.primKeyOrder.length;
		var ret = [];
		for(var hvid=0; hvid<len1; hvid++){
			if(this.htmlView[hvid].type == 'table' && this.htmlView[hvid].primKey){
				var bool = true;
				for(var i=0; i<len2; i++){
					var sqlFN = this.getSqlFieldName(this.myStructure.orderBy.primKeyOrder[i]);
					bool = bool && (this.htmlView[hvid].primKey[sqlFN] == primKey[i]);
				}
				if(bool == true) ret.push(hvid);
					//return hvid;
			}
		};
		if(ret.length == 0)
			return [-1];
		else
			return ret;
	};

	jinxPage.jinxView.prototype.createInputView = function(tableName, htmlParent, wrapperType){
		var str = '';
		//zaglavlje i title
		var htmlForm = (htmlParent)? htmlParent : $(document.createElement('div'));
		if(wrapperType != 'table')
			htmlForm.append( '<h2 class="title">'+this.myStructure[wrapperType+'Title']+'</h2>' );
		htmlForm.attr({  'data-jinx-table': tableName,  'data-jinx-view': wrapperType });
		if(this.myStructure.tableSettings['css_'+wrapperType+'_class'] && this.myStructure.tableSettings['css_'+wrapperType+'_class'] !=='')
			htmlForm.addClass(this.myStructure.tableSettings['css_'+wrapperType+'_class']);

		//remember this div, and create array for future child of this form
		var htmlViewId = this.htmlView.length;
		this.htmlView.push({ 
			mainDiv:htmlForm, type:wrapperType, tableName: tableName, htmlElements:{ }, 
			primKey:{}
		});	

		htmlForm.attr('data-jinx-htmlview-id', htmlViewId);
		//all fields
		var asyncNewEls = this.getAsyncNewElNames(wrapperType);
		for(var i=0; i<this.myStructure.orderBy[wrapperType+'Order'].length; i++){
			var fieldName = this.myStructure.orderBy[wrapperType+'Order'][i];	
			var elems = this.createOneInputField(fieldName, wrapperType, asyncNewEls);
			//console.log(elems);
			if(elems === false) return;
			htmlForm.append(elems[0]);
			if(elems[1]){
				this.htmlView[htmlViewId].htmlElements[fieldName] = elems[1];
				this.jinxField.resetFieldValue(wrapperType, this.myStructure.fields[fieldName], elems[1]);
			}
		};

		//buttons 
		if(this.myStructure.buttonsPerView[wrapperType]){
			var len = this.myStructure.buttonsPerView[wrapperType].length;
			var td = $(document.createElement('div')).addClass('jinxTableCell');
			for(var i=0; i<len; i++){
				var btnName = this.myStructure.buttonsPerView[wrapperType][i];
				if(wrapperType == 'table')
					td.append( this.createDefaultButton(btnName, htmlViewId, jinxPage.LngMsg[btnName]) );
				else
					htmlForm.append( this.createDefaultButton(btnName, htmlViewId, jinxPage.LngMsg[btnName]) );
			}
			if(wrapperType == 'table' && len>0)
				htmlForm.append(td);
		}
		return htmlViewId;
	};

	jinxPage.jinxView.prototype.createOneInputField = function(fieldName, wrapperType, asyncNewEls){
		if(this.myStructure.fields[fieldName] === undefined){
			jinxPage.display('Field '+fieldName+' in '+wrapperType+'Order is not defined in fields!', 'red');
			jinxPage.display(jinxPage.json2str(this.myStructure.fields));
			return false;
		}
		if(wrapperType === 'tableDetails') wrapperType = 'table';
		var neName = this.myStructure.fields[fieldName][wrapperType+'ViewType'];
		if(asyncNewEls.indexOf(neName) >= 0)
			this.myStructure.fields[fieldName].async = true;
		else
			this.myStructure.fields[fieldName].async = false;
		return this.jinxField.createHtmlField(
			wrapperType, this.myStructure.fields[fieldName], 
			this.myStructure.tableSettings.badFieldStar
		);
	};

	jinxPage.jinxView.prototype.callAsyncNewElementMethod= function(wrapperType, who){
		var wt = (wrapperType === 'details')? 'table' : wrapperType;
		var newEls = this.getAsyncNewElNames(wt, 'function');
		var jtName = this.myStructure.jsonTableName;
		newEls.forEach(function(newElName){
			jinxFn[newElName].asynCall(
				wrapperType, jtName, function(){
					jinxPage.asynNewElCallOver(jtName, newElName);
				}
			);
		});

		newEls = this.getAsyncNewElNames(wt, 'string');
		var strFns = [], callbackFns = {};
		for(var i=0; i<newEls.length; i++){
			var fnName = jinxFn[newEls[i]].asynCall;
			if(strFns.indexOf(fnName) < 0){
				strFns.push(fnName);
				callbackFns[fnName] = [];
			}
			callbackFns[fnName].push(newEls[i]);
		}
		strFns.forEach(function(fnName){
			jinxFn[fnName].fn(function(results){
				jinxPage.asynFnCallOver(jtName, callbackFns[fnName], results);
			});
		});
	};
	
	jinxPage.jinxView.prototype.getAsyncNewElNames= function(wrapperType, fnType){
		return jinxPage.getNewElNames(this.myStructure.jsonTableName, wrapperType, true, fnType)
	};

	jinxPage.jinxView.prototype.createFieldValsFromSqlVals= function(wrapperType, allVals){
		var fields = this.myStructure.orderBy[wrapperType+'Order'];
		var len = fields.length;
		var fieldVals = {};
		for(var i=0; i<len; i++){
			var sqlFN = this.getSqlFieldName(fields[i]);
			if(allVals[sqlFN] !== undefined)
				fieldVals[fields[i]] = allVals[sqlFN];
		};
		//jinxPage.display('ALL VALS: '+jinxPage.json2str(allVals));
		//jinxPage.display('CONVERTED: '+jinxPage.json2str(fieldVals));
		return fieldVals;
	};
	jinxPage.jinxView.prototype.createFieldValsFromReturnedSearchVals= function(allVals){
		var fields = this.myStructure.orderBy['searchOrder'];
		var len = allVals.length;
		var fieldVals = {};
		for(var i=0; i<len; i++)
			if(!fieldVals[allVals[i].colName])
				fieldVals[allVals[i].colName] = allVals[i].colVal;
			else{
				fieldVals[allVals[i].colName] = [fieldVals[allVals[i].colName]];
				fieldVals[allVals[i].colName].push(allVals[i].colVal);
			}
		return fieldVals;
	};
	jinxPage.jinxView.prototype.setInputFieldValueOnly = function(htmlViewId, vals){
		for(var jsonFieldName in vals){
    		if(this.myStructure.fields[jsonFieldName]){
				this.jinxField.setFieldValue('input', this.myStructure.fields[jsonFieldName], 
					this.htmlView[htmlViewId].htmlElements[jsonFieldName], vals[jsonFieldName], 
					vals);
				this.jinxField.unmarkBadField(
					this.htmlView[htmlViewId].mainDiv, this.htmlView[htmlViewId].htmlElements[jsonFieldName], 
					jsonFieldName, this.myStructure.fields[jsonFieldName]['inputView']
				);	
				this.jinxField.markForDontEverReset(this.htmlView[htmlViewId].htmlElements[jsonFieldName]);
			}
		}
	};
	jinxPage.jinxView.prototype.setInputFieldsValue = function(htmlViewId, vals){
		var htmlParent = this.htmlView[htmlViewId].mainDiv;
		var wrapperType = this.htmlView[htmlViewId].type;
		var fields = this.myStructure.orderBy[wrapperType+'Order'];
		var len = fields.length;
		var asyncNewEls = this.getAsyncNewElNames(wrapperType);
		var fieldVals;
		if(vals === undefined){
			for(var i=0; i<len; i++){
				this.jinxField.resetFieldValue(wrapperType, this.myStructure.fields[fields[i]], 
					this.htmlView[htmlViewId].htmlElements[fields[i]] );
				this.jinxField.unmarkBadField(
					this.htmlView[htmlViewId].mainDiv, this.htmlView[htmlViewId].htmlElements[fields[i]], 
					fields[i], this.myStructure.fields[fields[i]][wrapperType+'View'], 
					this.myStructure.fields[fields[i]][wrapperType+'ViewType']
				);				
			}
		}else{
			fieldVals = (wrapperType != 'search')? 
					this.createFieldValsFromSqlVals(wrapperType, vals) 
					: this.createFieldValsFromReturnedSearchVals(vals);
			this.htmlView[htmlViewId].allVals = fieldVals; //needed after for async
			for(var i=0; i<len; i++){
				var neName = this.myStructure.fields[fields[i]][wrapperType+'ViewType'];
				if(asyncNewEls.indexOf(neName) >= 0){
					this.myStructure.fields[fields[i]].async = true;
				}else{
					this.myStructure.fields[fields[i]].async = false;
				}
				
				this.jinxField.setFieldValue(wrapperType, this.myStructure.fields[fields[i]], 
					this.htmlView[htmlViewId].htmlElements[fields[i]], fieldVals[fields[i]], 
					fieldVals);
				this.jinxField.unmarkBadField(
					this.htmlView[htmlViewId].mainDiv, this.htmlView[htmlViewId].htmlElements[fields[i]], 
					fields[i], this.myStructure.fields[fields[i]][wrapperType+'View'], neName
				);				
			}
		}
		if(wrapperType === 'input'){
			if(vals !== undefined){
				htmlParent.find('.title').text('UPDATE');
			}else
				htmlParent.find('.title').text(this.myStructure[wrapperType+'Title']);
		}
		if(wrapperType !== 'search' && (wrapperType !== 'table' || vals !== undefined))
			this.setPrimaryKey(htmlViewId, vals);
	};
	jinxPage.jinxView.prototype.setAsyncFieldsValues= function(newElName){
		var allEls = $('*[data-jinx-asyncName="'+newElName+'"]');
		var that = this;
		$(allEls).each(function(){
			var value = $(this).attr('data-jinx-asyncVal');
			if(value == undefined) value = ''; //for reset
			var htmlParent = that.findJinxParent($(this), 'data-jinx-htmlview-id');
			var htmlViewId = htmlParent.attr('data-jinx-htmlview-id');
			//jinxPage.display('htmlViewId: '+htmlViewId);
			//jinxPage.display('ALL htmlViewId: '+jinxPage.firstLevel(that.htmlView));
			if(that.htmlView[htmlViewId] === undefined) return; ///?????????????????????????????????
			jinxFn[newElName].val($(this), value, that.htmlView[htmlViewId].allVals, 'set');
			var fName = $(this).attr('data-jinx-fname');
			if(fName){
				if(jinxFn[newElName].unmarkBadField && typeof(jinxFn[newElName].unmarkBadField) == 'function')
			 		jinxFn[newElName].unmarkBadField($(this));
			 	else
				 	that.jinxField.unmarkBadFieldDefault(htmlParent, $(this), fName);
			}
		});
	};

	jinxPage.jinxView.prototype.getInputFieldsValue = function(htmlViewId, tableName){
		if(this.htmlView[htmlViewId].htmlElements === undefined){
			jinxPage.display('htmlViewId: '+htmlViewId+' htmlEls is und.', 'red');
			return null;
		}
		//var htmlParent = this.htmlView[htmlViewId].mainDiv;
		var wrapperType = this.htmlView[htmlViewId].type;
		var fields = this.myStructure.orderBy[wrapperType+'Order'];
		var len = fields.length;
		var gets = {}, allVals = {};  
		//allVals have vals for all elements in html, even labels, 
		//gets dont! 
		//not all from allVals goes to dB, but it is maybe needed its value to calc other fields 
		if(wrapperType === 'tableDetails') wrapperType = 'table';
		for(var i=0; i<len; i++){
			var val = this.jinxField.getFieldValue( 
				wrapperType, this.myStructure.fields[fields[i]], 
				this.htmlView[htmlViewId].htmlElements[fields[i]], allVals 
			);
			if(val[1] !== undefined) allVals[fields[i]] = val[1];
			if(tableName){     //required are only fields from this table
				if(!this.isFieldInTable(tableName, fields[i])) continue;
			}
			
			if(val[0] === true) gets[fields[i]] = val[1];
		};
		this.htmlView[htmlViewId].allVals = allVals;
		jinxPage.display('.ALL VALS: '+jinxPage.json2str(this.htmlView[htmlViewId].allVals));
		return gets;
	};




/***********************************************************************************

***********************************************************************************/
	
	jinxPage.jinxView.prototype.createHtmlTableDetails = function(tableName, htmlParent, data){
		//set all labels if needed
		var fields = this.myStructure.orderBy['tableDetailsOrder'];
		if(this.myStructure.tableSettings.allFieldsLabel === true)
			this.setAllLabelsInTable(this.myStructure.orderBy['tableDetailsOrder']);

		//delete edit button
		if(this.myStructure.buttonsPerView.table){
			var r = this.myStructure.buttonsPerView.table.indexOf('edit');
			if(r >= 0)	this.myStructure.buttonsPerView.table.splice(r,1);
		};

		htmlParent.html('');
		this.tableState.htmlTable = $(document.createElement('div')).addClass('jinxTable');
		if(this.myStructure.tableSettings.css_table_class && this.myStructure.tableSettings.css_table_class !=='')
			this.tableState.htmlTable.addClass(this.myStructure.tableSettings.css_table_class);
		//this.setTableState(data);
		
		var htmlViewId = this.htmlView.length; 
		htmlParent.attr('data-jinx-htmlview-id', htmlViewId);
		this.htmlView.push({ 
			mainDiv:htmlParent, type:'tableDetails', tableName: tableName, primKey : {},
			htmlSearchViewId: -1, pageNumber: data.pageNumber, htmlElements: {}
		});	

		var asyncNewEls = this.getAsyncNewElNames('table');
		var wrapperType = 'table';
		var vals = data.lines[0];
		var fieldVals = this.createFieldValsFromSqlVals('tableDetails', vals);
		this.htmlView[htmlViewId].allVals = fieldVals; //needed after for async

		jinxPage.display('VALS: '+jinxPage.json2str(vals), 'purple');
			jinxPage.display('fieldVals: '+jinxPage.json2str(fieldVals), 'purple');
		
		var len = fields.length;
		for(var i=0; i<len; i++){  
			var fieldName = fields[i];
			if(this.myStructure.fields[fieldName] === undefined){
				jinxPage.display('Field '+fieldName+' in tableDetailsOrder is not defined in fields!', 'red');
				return;
			}

			var field = this.myStructure.fields[fieldName];
			if(field.tableView == 'DEFAULT' || field.tableView == 'NEW-ELEMENT'){
					var tableLine = $(document.createElement('div')).addClass('jinxTableRow');
					//field name
					var th = $(document.createElement('div')).addClass('jinxTableCell');
					var lbl = (field.labelLng === true)? jinxPage.LngMsg[field.label] : field.label;
					th.html('<span>'+lbl+'</span>');
					tableLine.append( th );
					//field create	
					var elems = this.createOneInputField(fieldName, 'tableDetails', asyncNewEls);
					if(elems === false){
					 	jinxPage.display('DETAILS, return elem false on '+fieldName, 'red');
					 	return;
					}
					tableLine.append(elems[0]);
					if(elems[1]){
						this.htmlView[htmlViewId].htmlElements[fieldName] = elems[1];
						this.jinxField.resetFieldValue('table', this.myStructure.fields[fieldName], elems[1]);
					}
					//set value for field
					var neName = this.myStructure.fields[fieldName][wrapperType+'ViewType'];
					if(asyncNewEls.indexOf(neName) >= 0){
						this.myStructure.fields[fieldName].async = true;
					}else{
						this.myStructure.fields[fieldName].async = false;
					}
					this.jinxField.setFieldValue(wrapperType, this.myStructure.fields[fieldName], 
							this.htmlView[htmlViewId].htmlElements[fieldName], fieldVals[fieldName], 
							fieldVals
					);
					this.jinxField.unmarkBadField(
							this.htmlView[htmlViewId].mainDiv, this.htmlView[htmlViewId].htmlElements[fieldName], 
							fieldName, this.myStructure.fields[fieldName][wrapperType+'View'], neName
					);

					this.tableState.htmlTable.append( tableLine );   

			}

		} //end fields

		
		this.setPrimaryKey(htmlViewId, vals);


		this.callAsyncNewElementMethod('details', 2);
		//verovatno ciji se detalji prikazuju 
		var header = $(document.createElement('h2')).addClass('title').html(this.myStructure.tableTitle);
		htmlParent.append( header );
		
		//buttons 
		var htmlBtns = $(document.createElement('div')).addClass('jinxTableColspan');
		var btns = this.myStructure.buttonsPerView['details'];
		if(btns){
			var len = btns.length;
			for(var i=0; i<len; i++){
				var btnName = btns[i];
				htmlBtns.append( this.createDefaultButton(btnName, htmlViewId, jinxPage.LngMsg[btns[i]]) );
			}
			htmlBtns.attr({ 'data-jinx-htmlview-id': htmlViewId });
			if(this.myStructure.tableSettings.tablePageNumbersPos == 'footer')
				htmlBtns.addClass('jinxTableColspanBottom');
			this.tableState.htmlTable.append( htmlBtns );
		}
		
		htmlParent.append( this.tableState.htmlTable );

		if(this.myStructure.callbackFns && this.myStructure.callbackFns.afterHtmlTable
    	&& this.myStructure.callbackFns.afterHtmlTable !== ''
		&& typeof jinxFn[this.myStructure.callbackFns.afterHtmlTable] === 'function'){
			jinxFn[this.myStructure.callbackFns.afterHtmlTable]();        			
		}
	}	


/***********************************************************************************

***********************************************************************************/
	

	
	jinxPage.jinxView.prototype.createHtmlTable = function(tableName, htmlParent, data){
		if(this.myStructure.tableSettings.allFieldsLabel === true)
			this.setAllLabelsInTable(this.myStructure.orderBy['tableOrder']);

		htmlParent.html('');
		this.setTableState(data);

		//create viewID for whole table. just for it's data without htmlEls.
		//every row will have its own htmlViewId
		var htmlViewId = this.htmlView.length;
		htmlParent.attr('data-jinx-htmlview-id', htmlViewId);
		this.htmlView.push({ 
			mainDiv:htmlParent, type:'big_table', tableName: tableName, 
			htmlSearchViewId: -1, pageNumber: data.pageNumber
		});	

		if(this.myStructure.tableSettings.tableWithSearch == true){
			//create search
			var htmlSearchViewId = this.createInputView(tableName, undefined, 'search');
	        var searchDiv = this.htmlView[htmlSearchViewId].mainDiv;
	        if(data.searchBy){
	        	this.setInputFieldsValue(htmlSearchViewId, data.searchBy);
	        }else{
	        	this.setInputFieldsValue(htmlSearchViewId);
	        }
		  	//save searchId     
		    this.htmlView[htmlViewId].htmlSearchViewId = htmlSearchViewId;
		}
		
		//pagenumbers, add new, reset,	 		undefined-parent means create as table th line
		var tableHeader = this.createTablePageNumbersLine(
			undefined, htmlViewId, data.total_lines, data.linesPerRequest, data.pageNumber
		);
		//add new line button
		if(this.myStructure.tableSettings.addNewButton == true){
			tableHeader.prepend( this.createDefaultButton('newline', undefined, jinxPage.LngMsg.addNew, tableName) );
		}
		if(tableHeader.find('pageNumbers').length > 0 || this.myStructure.tableSettings.addNewButton == true)
			this.tableState.htmlTable.append(tableHeader);
		if(this.myStructure.tableSettings.tablePageNumbersPos == 'both'){
			var tableHeader2 = this.createTablePageNumbersLine(
				undefined, htmlViewId, data.total_lines, data.linesPerRequest, data.pageNumber
			);
			tableHeader2.addClass('jinxTableColspanBottom');
			if(this.myStructure.tableSettings.addNewButton == true)
				tableHeader2.prepend( this.createDefaultButton('newline', undefined, jinxPage.LngMsg.addNew, tableName) );
			this.tableState.htmlTable.append(tableHeader2);
		}


		//column names and sort
		var tableCaptionSort = this.createTableHeader(undefined, htmlViewId);
		this.tableState.htmlTable.append( tableCaptionSort );
		
		//LINES in table
		if(data.lines){
			len = data.lines.length;
			for(var i=0; i<len; i++){
				var htmlLineId = this.createHtmlTableLine(tableName, data.lines[i], 'last');
				if(i == 0) 
					this.htmlView[htmlViewId].firstHtmlViewId = htmlLineId;
				if(i == len - 1) 
					this.htmlView[htmlViewId].lastHtmlViewId = htmlLineId;
			}
		}else{
			var table_row = $(document.createElement('div')).addClass('jinxTableHeading jinxRowFullLength emptyRecordsMessage'); 
			var len = this.myStructure.orderBy.tableOrder.length;
			for(var i=0;i<len;i++) table_row.append('<div class="jinxTableCell"></div>');
			table_row.append('<div class="jinxDisplay">'+jinxPage.LngMsg.emptyLines+'</div>');
			//this.tableState.htmlTable.append('<div class="jinxTableHeading"> </div>');
			this.tableState.htmlTable.append(table_row);
			//this.tableState.htmlTable.append('<div class="jinxTableHeading"> </div>');
		}

		var wt = (this.myStructure.tableSettings.tableWithSearch == true)? ['table', 'search'] : 'table';
		this.callAsyncNewElementMethod(wt, 3);
		htmlParent.append( searchDiv );
		var header = $(document.createElement('h2')).addClass('title').html(this.myStructure.tableTitle); 
		htmlParent.append( header );
		
			
		htmlParent.append( this.tableState.htmlTable );
		if(this.myStructure.callbackFns && this.myStructure.callbackFns.afterHtmlTable
    	&& this.myStructure.callbackFns.afterHtmlTable !== ''
		&& typeof jinxFn[this.myStructure.callbackFns.afterHtmlTable] === 'function'){
			jinxFn[this.myStructure.callbackFns.afterHtmlTable]();        			
		}
	};
	
	jinxPage.jinxView.prototype.createHtmlTableLine = function(tableName, vals, rowPos){
		//wrapper DIV
		tableLine = $(document.createElement('div')).addClass('jinxTableRow');
		//create
		var htmlViewId = this.createInputView( tableName, tableLine, 'table' );
		this.tableState.htmlTable.append( tableLine ); 
		//set values
		this.setInputFieldsValue(htmlViewId, vals);

		if(rowPos == 'last')
			this.tableState.htmlTable.append( tableLine );
		if(rowPos == 'first')
			this.tableState.htmlTable.find('.table_th_row').after(tableLine);
		return htmlViewId;
	};

	jinxPage.jinxView.prototype.createTablePageNumbersLine = function(htmlParent, htmlViewId, total_lines, linesPerRequest, pageNumber){
		var thLine = (htmlParent)? htmlParent : $(document.createElement('div')).addClass('jinxTableColspan');
		thLine.attr({ 'data-jinx-htmlview-id': htmlViewId });
		if(this.myStructure.tableSettings.tablePageNumbersPos == 'footer')
			thLine.addClass('jinxTableColspanBottom');
		var pn_len = (linesPerRequest>0)? Math.ceil(total_lines / linesPerRequest) : 0;
		if(this.myStructure.tableSettings.pageNumbers == false || linesPerRequest == 0 || pn_len === 1)
			return thLine;
		
		var thPages = $(document.createElement('div')).addClass('pageNumbers'); 
		//create page numbers
		if(pn_len > 1){
			thPages.append('Page: ');
			if(this.myStructure.tableSettings.pageNumbersSide[0] == true && pageNumber > 1)
				thPages.append( this.createTablePageOneNumber(1, ' << ', false) );
			if(this.myStructure.tableSettings.pageNumbersSide[1] == true && pageNumber > 1)
				thPages.append( this.createTablePageOneNumber(pageNumber-1, ' < ', false) );
			//page numbers
			for(var i=1; i<=pn_len; i++){
				thPages.append( this.createTablePageOneNumber(i, ' '+i+' ', (i == pageNumber)) );
			}
			if(this.myStructure.tableSettings.pageNumbersSide[2] == true && pageNumber < pn_len)
				thPages.append( this.createTablePageOneNumber(pageNumber+1, ' > ', false) );
			if(this.myStructure.tableSettings.pageNumbersSide[3] == true && pageNumber < pn_len)
				thPages.append( this.createTablePageOneNumber(pn_len, ' >> ', false) );
			
		}
		thLine.append( thPages );
		return thLine;	
		//return thPages;
	};
	jinxPage.jinxView.prototype.createTableHeader= function(htmlParent, htmlViewId){
		var tableLine = (htmlParent)? htmlParent : $(document.createElement('div')).addClass('jinxTableHeading');
		tableLine.attr({ 'data-jinx-htmlview-id': htmlViewId });
		var len = this.myStructure.orderBy.tableOrder.length;
		for(var i=0; i<len; i++){  
			var fieldName = this.myStructure.orderBy.tableOrder[i];
			if(this.myStructure.fields[fieldName] === undefined){
				jinxPage.display('Field '+fieldName+' in tableOrder is not defined in fields!', 'red');
				return;
			}
			var field = this.myStructure.fields[fieldName];
			if(field.tableView == 'DEFAULT' || field.tableView == 'NEW-ELEMENT'){
					var th = $(document.createElement('div')).addClass('jinxTableHead');
					th.attr('data-jinx-sort-fname', fieldName);
					var lbl = (field.labelLng === true)? jinxPage.LngMsg[field.label] : field.label;
					th.html('<span>'+lbl+'</span>');
					if(field.sortCol === true){
						var btnDown = $(document.createElement('img'));
						btnDown.prop({ 'src': "../img/arr_down.png", 'alt': "down" })
								.attr({"data-jinx-sort-dir":"ASC" })
								.addClass('arr_order_by')
								.on('click', $.proxy( this.sortTableClick, this )  );
						var btnUp = $(document.createElement('img'));
						btnUp.prop({ 'src': "../img/arr_up.png", 'alt': "up" })
								.attr({"data-jinx-sort-dir":"DESC" })
								.addClass('arr_order_by')
								.on('click', $.proxy( this.sortTableClick, this ) );
						if(this.tableState.sortOrder){
							for(var ofName in this.tableState.sortOrder)
								if(ofName == fieldName)
									if(this.tableState.sortOrder[fieldName] == 'DESC') 
										btnUp.addClass('arr_order_by_mark');
									else
										btnDown.addClass('arr_order_by_mark');
						};
						th.append(btnDown);
						th.append(btnUp);
					}
					tableLine.append( th );
			}
		}
		//reset sort button
		var thTableButtons = $(document.createElement('div')).addClass('jinxTableHead'); 
		var lenBtns = this.myStructure.buttonsPerView['table'].length;
		thTableButtons.css('column-count', lenBtns);	
		if(this.myStructure.tableSettings.resetSortButton == true){
			thTableButtons.append( this.createDefaultButton('resetsort', htmlViewId, 'RESET SORT') );
		}
		if(lenBtns > 0 || this.myStructure.tableSettings.resetSortButton == true)
			tableLine.append( thTableButtons );
		tableLine.addClass('table_th_row');
		return tableLine;
	};
	jinxPage.jinxView.prototype.createTablePageOneNumber= function(i, txt, marked){
		var htmlNo = $(document.createElement('span'));
		htmlNo.addClass('page_link').attr('data-jinx-pageNo', i).text(txt);
		if(marked == true) htmlNo.addClass('page_link_mark');
		htmlNo.on('click', $.proxy( this.pageNumberClick, this ) ); 
		return htmlNo;
	};
	jinxPage.jinxView.prototype.setAllLabelsInTable= function(fields){
		var len = fields.length;
		for(var i=0; i<len; i++){
			var fieldName = fields[i];
			if(this.myStructure.fields[fieldName].tableView == 'DEFAULT'){
				//sad po tipu
				if(this.myStructure.fields[fieldName].tableViewType == 'checkbox' || this.myStructure.fields[fieldName].tableViewType == 'select'){

				}else{
					this.myStructure.fields[fieldName].tableViewType = 'label';
				}
			}
			if(this.myStructure.fields[fieldName].tableView == 'NEW-ELEMENT')
				if(this.myStructure.fields[fieldName].tableViewType !== 'shortLabel'){
					this.myStructure.fields[fieldName].tableView = 'DEFAULT';
					this.myStructure.fields[fieldName].tableViewType = 'label';
				}
		}
		if(this.myStructure.buttonsPerView.table){
			var s = this.myStructure.buttonsPerView.table.indexOf('save');
			if(s >= 0)	this.myStructure.buttonsPerView.table.splice(s,1);
			var r = this.myStructure.buttonsPerView.table.indexOf('reset');
			if(r >= 0)	this.myStructure.buttonsPerView.table.splice(r,1);
		}
	};
	jinxPage.jinxView.prototype.getAllTableData = function(){
		var ret = {};
		for(var i=0; i<this.htmlView.length; i++){
			if(this.htmlView[i].type !== 'table') continue;
			var vals = this.getInputFieldsValue(i);
			if(vals === null) continue;
			ret[i] = { htmlViewId: i, vals: vals };
		}
		return ret;
	};

/***********************************************************************************

***********************************************************************************/




	jinxPage.jinxView.prototype.deleteHtmlParent = function(htmlParent){
		htmlParent.fadeOut(500, function(){
			htmlParent.remove();
		});
	};
	jinxPage.jinxView.prototype.resetFields = function(htmlViewId){
		this.setInputFieldsValue(htmlViewId);
	};
	jinxPage.jinxView.prototype.resetClick = function(event){ 
		var htmlViewId = parseInt($(event.target).attr('data-jinx-htmlview-id'));
		this.resetFields(htmlViewId);
	};
	jinxPage.jinxView.prototype.saveClick = function(event){
		jinxPage.clearDisplayAdmin();
		var htmlViewId = parseInt($(event.target).attr('data-jinx-htmlview-id'));
		var view = this.htmlView[htmlViewId].type;
		var tableName = this.htmlView[htmlViewId].tableName;
		var sqlTN = this.myStructure.tableName;
		this.unmarkAllBadFields(htmlViewId);
		var vals = this.getInputFieldsValue(htmlViewId, sqlTN);

		if(this.checkRestrictions(htmlViewId, vals, tableName) == false)
			return;
		var method, url; 
		if($.isEmptyObject(this.htmlView[htmlViewId].primKey) == false){
			method = 'PUT';
			var pk = this.getPrimaryKey(htmlViewId);
			url = 'apijx/model/'+tableName+this.getPrimaryKeyAsApiString(pk);
		}else{
			method = 'POST';
			url = 'apijx/model/'+tableName+'/'+view;
		} 
		var sendData = { 'cols': vals };
		jinxPage.display('VALS: '+jinxPage.json2str(vals));
		var that = this;
		sendData.returnAffected = (method === 'PUT' && 
				(view == 'table' || this.myStructure.tableSettings.tableWithInput == true));
		jinxPage.ajaxCall(url, method, sendData, function(resp){
			jinxPage.display(jinxPage.json2str(resp));
        	if(resp.OKERR === undefined || resp.OKERR == false){ 
        		if(resp.falseCols){
					for(var fieldName in resp.falseCols){
						var msg = resp.falseCols[fieldName];
						var htmlParent = that.htmlView[htmlViewId].mainDiv;
						that.jinxField.markBadField(
							htmlParent, that.htmlView[htmlViewId].htmlElements[fieldName], fieldName,
			 				that.myStructure.fields[fieldName][view+'View'], 
			 				that.myStructure.fields[fieldName][view+'ViewType']
			 			);
						jinxPage.displayAdmin(false, msg, 'red', 0);
					}
				}
				if(resp.msg)
					jinxPage.displayAdmin(true, resp.msg, 'red', 0);
				if(resp.updateInsFail == true)
					return; 
        	};
        	
        	var divInd = that.findJinxParent($(event.target), 'data-jinx-divs-id').attr('data-jinx-divs-id');
			
			//update
        	if(method === 'PUT'){ 
				if(that.myStructure.callbackFns && that.myStructure.callbackFns.afterUpdate
				&& that.myStructure.callbackFns.afterUpdate !== ''
				&& typeof jinxFn[that.myStructure.callbackFns.afterUpdate] === 'function'){
					jinxFn[that.myStructure.callbackFns.afterUpdate](pk, vals, that.htmlView[htmlViewId].mainDiv);        			
				}
				if(sendData.returnAffected == false && resp.affectedRows == 0){
					var msg = jinxPage.LngMsg.notChanged;
					jinxPage.displayAdmin(false, msg, 'red', 0);
					jinxPage.display('Changed: ' +resp.changedRows+' - '+resp.affectedRows, 'red');
					return;
	        	}
				jinxPage.displayAdmin(true, jinxPage.LngMsg.updateOk, jinxPage.colorInfoText, 2);
				//update returned line.
				if(sendData.returnAffected == true && resp.lines && resp.lines.length == 1){
					if(view == 'table'){
						that.setInputFieldsValue(htmlViewId, resp.lines[0]);
						that.setPrimaryKey(htmlViewId, resp.lines[0]);
					}
					if(view == 'input'){
						var exPK = that.getPrimaryKey(htmlViewId);
						//find htmlViewId with this PK
						var alltblHtmlViewId = that.getHtmlViewIdFromPrimKey(exPK);
						var tblHtmlViewId = alltblHtmlViewId[alltblHtmlViewId.length-1];
						//update that htmlViewId
						jinxPage.display(' _ '+JSON.stringify(alltblHtmlViewId)+'-view updating with PK: '+jinxPage.json2str(exPK));
						jinxPage.display('resp.lines: '+jinxPage.json2str(resp.lines[0]));
						that.setInputFieldsValue(tblHtmlViewId, resp.lines[0]);
						that.setPrimaryKey(tblHtmlViewId, resp.lines[0]);
						that.resetFields(htmlViewId);
					}
        		}else{
        			var sendData2 = { 
    					'whereCols' : that.tableState.search.whereCols,  
    					'whereCompGroup': that.tableState.search.whereCompGroup, 
						'pageNumber' : that.tableState.pageNumber, 
						'orderBy': that.tableState.sortOrder 
					};
        			//ako su input i tabela na istoj strani 
    				if(view == 'input'){
    					that.resetFields(htmlViewId);
    					if(that.myStructure.tableSettings.tableWithInput == true){
	        				jinxPage.refreshView(tableName, 'table', undefined, sendData2, divInd);
	    				}else{
	    					if(that.myStructure.tableSettings.openTableAfterInput == true)
	        					jinxPage.openView(tableName, 'table', undefined, sendData2, divInd);  
	    				}
	    			}else{
	        			jinxPage.refreshView(tableName, 'table', undefined, sendData2, divInd);
	    			}
	        	}
        	}
        	//insert
        	if(method === 'POST'){
				if(that.myStructure.callbackFns && that.myStructure.callbackFns.afterInsert
				&& that.myStructure.callbackFns.afterInsert !== ''
				&& typeof jinxFn[that.myStructure.callbackFns.afterInsert] === 'function'){
					var valsIn = that.createFieldValsFromSqlVals('input', resp.insertedLine);
					var pkIn = that.getPrimaryKeyFromVals(valsIn);
					jinxFn[that.myStructure.callbackFns.afterInsert](pkIn, valsIn, that.htmlView[htmlViewId].mainDiv);      
				}
				jinxPage.displayAdmin(true, jinxPage.LngMsg.insertOk, jinxPage.colorInfoText, 2);
        		//ako su input i tabela na istoj strani ubaci novi red
        		if(that.myStructure.types.indexOf('table') >= 0 
        		&& that.myStructure.tableSettings.tableWithInput == true){
        			that.resetFields(htmlViewId);
        			$('.emptyRecordsMessage').remove();
        			that.createHtmlTableLine(tableName, resp.insertedLine, 'first');
        			that.callAsyncNewElementMethod('table', 3);
        		}else{
        			if(that.myStructure.tableSettings.openTableAfterInput == true)
        				jinxPage.openView(tableName, 'table', undefined, { 'pageNumber' : 1 }, divInd);
        			else
        				that.resetFields(htmlViewId);
        		};
        	};
        });
	};

	jinxPage.jinxView.prototype.deleteClick = function(event){
		jinxPage.clearDisplayAdmin();
		var htmlViewId = parseInt($(event.target).attr('data-jinx-htmlview-id'));
		var htmlParent = this.htmlView[htmlViewId].mainDiv;
		var tableName = this.htmlView[htmlViewId].tableName;
		var pk = this.getPrimaryKey(htmlViewId);
		var url = 'apijx/model/'+tableName+this.getPrimaryKeyAsApiString(pk);
		var that = this;
		jinxPage.ajaxCall(url, 'DELETE', {}, function(resp){
			//jinxPage.display('DEL RESP: '+jinxPage.json2str(resp));
        	if(resp.OKERR == true && resp.affectedRows > 0){
				var vals = that.getInputFieldsValue(htmlViewId);
        		that.deleteHtmlParent(htmlParent);
        		if(that.myStructure.callbackFns && that.myStructure.callbackFns.afterDelete
        		&& that.myStructure.callbackFns.afterDelete !== ''
        		&& typeof jinxFn[that.myStructure.callbackFns.afterDelete] === 'function'){
        			jinxFn[that.myStructure.callbackFns.afterDelete](pk, vals);      
        		}
        	}
        	else
				jinxPage.displayAdmin(true, resp.msg, 'red', 0);
        });
	};
	jinxPage.jinxView.prototype.editClick = function(event){
		var divInd = this.findJinxParent($(event.target), 'data-jinx-divs-id').attr('data-jinx-divs-id');
	    var htmlViewId = parseInt($(event.target).attr('data-jinx-htmlview-id'));
		var htmlParent = this.htmlView[htmlViewId].mainDiv;
		var pk = this.getPrimaryKey(htmlViewId); 
		var tableName = this.htmlView[htmlViewId].tableName;
		jinxPage.display('tableName: '+tableName+' - '+this.myStructure.tableSettings.tableWithInput);
		if(this.myStructure.tableSettings.tableWithInput == true){
			jinxPage.refreshView(tableName, 'input', pk, undefined, divInd);
			$('#admin_view').animate({
				scrollTop: 0,
				scrollLeft: 0
			}, 500);
		}else{
			jinxPage.addHistoryLink(tableName, 'input', {});
        	jinxPage.openView(tableName, 'input', pk, undefined, divInd);
        }
	};

	jinxPage.jinxView.prototype.newlineClick = function(event){
		var divInd = this.findJinxParent($(event.target), 'data-jinx-divs-id').attr('data-jinx-divs-id');
	    var tableName = $(event.target).attr('data-jinx-table');
		if(this.myStructure.tableSettings.tableWithInput == true)
        	jinxPage.refreshView(tableName, 'input', undefined, undefined, divInd);
        else{
			jinxPage.addHistoryLink(tableName, 'input', {});
        	jinxPage.openView(tableName, 'input', undefined, undefined, divInd);
        }
	};

	jinxPage.jinxView.prototype.detailsClick = function(event){
		var divInd = this.findJinxParent($(event.target), 'data-jinx-divs-id').attr('data-jinx-divs-id');
	    var htmlViewId = parseInt($(event.target).attr('data-jinx-htmlview-id'));
		var htmlParent = this.htmlView[htmlViewId].mainDiv;
		var pk = this.getPrimaryKey(htmlViewId); 
		var tableName = this.htmlView[htmlViewId].tableName;
        var search = this.getSearchObj(htmlViewId);
		var sendData = { 
			'whereCols' : search.whereCols,  
			'whereCompGroup': search.whereCompGroup, 
			'pageNumber' : 1, 
			'orderBy': this.tableState.sortOrder 
		};
		jinxPage.addHistoryLink(tableName, 'table', sendData);
        jinxPage.openView(tableName, 'details', pk, undefined, divInd);
	};
/////////////////////////////////////////////////////////////////////////////////////////////////////////

	jinxPage.jinxView.prototype.searchClick = function(event){
		var divInd = this.findJinxParent($(event.target), 'data-jinx-divs-id').attr('data-jinx-divs-id');
		var htmlViewId = parseInt($(event.target).attr('data-jinx-htmlview-id'));
		var tableName = this.htmlView[htmlViewId].tableName;
		//new search
		var htmlSearchParent = this.htmlView[htmlViewId].mainDiv;
        var search = this.getSearchObj(htmlViewId);
		var sendData = { 
			'whereCols' : search.whereCols,  
			'whereCompGroup': search.whereCompGroup, 
			'pageNumber' : 1, 
			'orderBy': this.tableState.sortOrder 
		};
		jinxPage.addHistoryLink(tableName, 'table', sendData);
		jinxPage.refreshView(tableName, 'table', undefined, sendData, divInd);
	};
	jinxPage.jinxView.prototype.pageNumberClick = function(event, htmlViewId, pn){
		var divInd = this.findJinxParent($(event.target), 'data-jinx-divs-id').attr('data-jinx-divs-id');
		var htmlViewId = this.findJinxParent($(event.target), 'data-jinx-htmlview-id').attr('data-jinx-htmlview-id');
		var tableName = this.htmlView[htmlViewId].tableName;
		//new page number
		var pn = parseInt($(event.target).attr('data-jinx-pageNo'));
		var sendData = { 
			'whereCols' : this.tableState.search.whereCols,  
			'whereCompGroup': this.tableState.search.whereCompGroup, 
			'pageNumber' : pn, 
			'orderBy': this.tableState.sortOrder 
		};
		jinxPage.addHistoryLink(tableName, 'table', sendData);
        jinxPage.refreshView(tableName, 'table', undefined, sendData, divInd);
	};
	jinxPage.jinxView.prototype.sortTableClick = function(event){
		var divInd = this.findJinxParent($(event.target), 'data-jinx-divs-id').attr('data-jinx-divs-id');
		var htmlViewId = this.findJinxParent($(event.target), 'data-jinx-htmlview-id').attr('data-jinx-htmlview-id');
		var tableName = this.htmlView[htmlViewId].tableName;
		//new clicked krit
		var htmlParentFname = this.findJinxParent($(event.target), "data-jinx-sort-fname");
		if(htmlParentFname == false){ jinxPage.display('Could not find htmlParent with data-jinx-sort-fname!'); return; }
		var thisFName = htmlParentFname.attr("data-jinx-sort-fname");
		var val = $(event.target).attr('data-jinx-sort-dir');
		var orderBy = { };
		//add it as the first sortOrder krit
		orderBy[thisFName] = val;
		for(var prop in this.tableState.sortOrder)
			if(prop !== thisFName)
				orderBy[prop] = this.tableState.sortOrder[prop];
		var sendData = { 
			'whereCols' : this.tableState.search.whereCols,  
			'whereCompGroup': this.tableState.search.whereCompGroup, 
			'pageNumber' : 1, 
			'orderBy': orderBy 
		};
        jinxPage.refreshView(tableName, 'table', undefined, sendData, divInd);
	};
	jinxPage.jinxView.prototype.resetsortClick = function(event){
		var divInd = this.findJinxParent($(event.target), 'data-jinx-divs-id').attr('data-jinx-divs-id');
		var htmlViewId = this.findJinxParent($(event.target), 'data-jinx-htmlview-id').attr('data-jinx-htmlview-id');
		var tableName = this.htmlView[htmlViewId].tableName;
		var sendData = {
			'whereCols' : this.tableState.search.whereCols, 
			'whereCompGroup': this.tableState.search.whereCompGroup, 
			pageNumber : 1 
		};
        jinxPage.refreshView(tableName, 'table', undefined, sendData, divInd);
	};
	

/////////////////////////////////////////////////////////////////////////////////////////////////////////

	jinxPage.jinxView.prototype.findJinxParent= function(htmlEl, findAttr){
		if(findAttr == undefined) findAttr = 'data-jinx-table';
		if(htmlEl.parent().length == 0) return false;
		if(htmlEl.parent().attr(findAttr) !== undefined && htmlEl.parent().attr(findAttr) !== false)
			return htmlEl.parent();
		else 
			return this.findJinxParent(htmlEl.parent(), findAttr);
	};

	jinxPage.jinxView.prototype.getValsFromSearchObj= function(searchBy){
		jinxPage.display('SEARCH_BY: '+jinxPage.json2str(searchBy));
		var len = searchBy.length;
		var vals = {};
		for(var i=0; i<len; i++){
			var sqlFN = this.getSqlFieldName(searchBy[i].colName);
			vals[sqlFN] = searchBy[i].colVal;
		};
		return vals;
	};
	jinxPage.jinxView.prototype.getSearchObj= function(htmlViewId){
		if(this.myStructure.tableSettings.tableWithSearch == false)
			return { 'whereCols':[], 'whereCompGroup': [] };
		if(htmlViewId < 0) 
			return { 'whereCols':[], 'whereCompGroup': [] };
		var vals = this.getInputFieldsValue(htmlViewId);
		//vals are pairs  need to create whereCols
        var whereCols = [];
        var whereCompGroup = [];
        var i = 0;
        for(var colName in vals){
        	if(vals[colName] !== undefined){
        		if(typeof (vals[colName]) !== 'object' && $.trim(vals[colName]) !== ''){
        			i++;
		        	var oneObj = {};
		        	oneObj.colName = colName;
		        	oneObj.colVal = vals[colName];
		        	oneObj.oper = (this.myStructure.fields[colName].type.substr(0,4) !== 'text')? '=' : 'LIKE'; 
		        	oneObj.logicOper = 'AND';
	        		whereCols.push(oneObj);
	        	}
	        	if(typeof (vals[colName]) == 'object' && vals[colName] !== null){
	        		var startCond = 0;
	        		for(var j=0; j<vals[colName].length; j++){
	        			if($.trim(vals[colName][j].val) !== ''){
	        				i++;
	        				if(startCond == 0) startCond = i;
	        				var oneObj = {};
	        				oneObj.colName = (vals[colName][j].colName == undefined || vals[colName][j].colName == '')? 
	        								colName : vals[colName][j].colName;
				        	oneObj.colVal = vals[colName][j].val;
				        	oneObj.oper = vals[colName][j].oper; 
				        	oneObj.logicOper = vals[colName][j].logicOper;
				        	whereCols.push(oneObj);
	        			}
	        		}
	        		var endCond = i;
	        		if(startCond != endCond && startCond > 0)
	        			whereCompGroup.push(startCond+'-'+endCond);
	        	}
        	};
        };
        if(whereCompGroup.length > 0) jinxPage.display('group WHERE: '+whereCompGroup);
        return { 'whereCols':whereCols, 'whereCompGroup': whereCompGroup};
	};

	jinxPage.jinxView.prototype.checkRestrictions = function(htmlViewId, vals, tableName){
		var check = true;
		var wrapperType = this.htmlView[htmlViewId].type;
		var fields = this.myStructure.orderBy[wrapperType+'Order'];
		var len = fields.length;
		for(var i=0; i<len; i++){
			if(tableName){
				if(!this.isFieldInTable(tableName, fields[i])) continue;
			}
			var newCheck = this.jinxField.checkRestrictions(
				this.htmlView[htmlViewId].mainDiv, this.htmlView[htmlViewId].htmlElements[fields[i]], 
				wrapperType, 
				fields[i], this.myStructure.fields[fields[i]], vals
			)
			check = newCheck[0] && check;
			if(newCheck[0] == false)
				jinxPage.displayAdmin(false, newCheck[1], 'red', 0);
		}
		return check;
	};



	jinxPage.jinxView.prototype.isFieldInTable = function(table, field){
		var sqlN = this.myStructure.fields[field].sqlFieldName;
		if(jinxPage.jinxSqlFields.sqlFields[sqlN] === undefined){
			jinxPage.display('INFO: field: '+sqlN+' undefined.', 'purple');
			return false;
		}
		var tn = jinxPage.jinxSqlFields.sqlFields[sqlN].table;
		if(tn !== table){
			jinxPage.display('INFO: field: '+field+' Not IN TABLE: '+tn+' !== '+table, 'purple');
			return false;
		}
		return true;
	}

	jinxPage.jinxView.prototype.unmarkAllBadFields = function(htmlViewId){
		var htmlParent = this.htmlView[htmlViewId].mainDiv;
		var wrapperType = this.htmlView[htmlViewId].type;
		var fields = this.myStructure.orderBy[wrapperType+'Order'];
		var len = fields.length;
		for(var i=0; i<len; i++){
			this.jinxField.unmarkBadField(
				htmlParent, this.htmlView[htmlViewId].htmlElements[fields[i]], 
				fields[i], this.myStructure.fields[fields[i]][wrapperType+'View'], 
				this.myStructure.fields[fields[i]][wrapperType+'ViewType']
			);	
		}
	}
/***********************************************************************************
not in use
***********************************************************************************/


	jinxPage.jinxView.prototype.showhide_form = function(args, show_hide){
		//alert(JSON.stringify(args)+', '+show_hide);
		var $form = (args[1] == 'form') ? Page.htmlForm : 
					(args[1] == 'search') ? Page.searchForm : '';
		if(args[0].substr(-9) == 'with_link'){
			//URADI
			//otvori link za novi proizvod ako je show
			//alert('otvori link za novi proizvod!');
			if(show_hide == 'show')
				window.location = Page.htmlBaseLink+'/admin-'+Page.linkTable+'-new';
			return;
		}
		if($form == '') return;
		if(args[0].substr(-9) == 'show_hide'){
			if(show_hide === undefined)
				$form.toggle(800);
			else
				if(show_hide == 'show')  $form.show(800);
				else $form.hide(800);
		}
		if(args[0].substr(-7) == 'up_down'){
			if(show_hide === undefined)
				$form.slideToggle(800);
			else
				if(show_hide == 'show')  $form.slideDown(800);
				else $form.slideUp(800);
		}
		if(args[0].substr(-10) == 'left_right'){
			if(show_hide === undefined)
				$form.animate({width:'toggle'},800);
			else
				if(show_hide == 'show')  $form.animate({width: '100%' },800);
				else $form.animate({ width: '0' },800);
		}
	};

	jinxPage.jinxView.prototype.createShowHideFormButton = function(form_type, showhide_type, title){
		//show_hide button
		var newButton = new pageButton();
		newButton.htmlEl = $(document.createElement('button'));
		newButton.htmlEl.text(title);
		newButton.htmlEl.on('click', newButton.on_click);
		newButton.htmlEl.addClass(showhide_type);  
		newButton.page = Page; 
		newButton.showhide_type = showhide_type; 
		newButton.form_type = form_type;
		newButton.click_fn_name = 'showhide_form'; 
		Page.pageButtons['btnShowHide_'+form_type] = newButton;
		return newButton;
	};
