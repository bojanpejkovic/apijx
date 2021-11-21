function json2url(data){
	return data2url(data, '').substr(1);
}
function data2url(data, parent){
	var str = '';
	for(var key in data){
		if(typeof data[key] === 'object'){
			var p = (parent =='')? key : parent+'['+key+']';
			str += data2url(data[key], p);
		}else{
			var k = encodeURIComponent(key);
			var val = encodeURIComponent(data[key]);
			str += (parent == '')? '&'+k+'='+val : '&'+parent+'['+k+']='+val;
		}
	}
	return str;
}

let brojacg = 0;

function transformRequest(url, method, data){
	brojacg++;
    url = 'admin/'+url;

	//     
	if(method !== 'GET' && method !== 'POST' && data.apijxMethod === undefined)
		data.apijxMethod = method;
	let nMethod = (method == 'GET')? method : 'POST'; 
	let bData = {method: nMethod};

	let sData = JSON.stringify(data);
	if(method == 'POST')
		bData = {
			method: nMethod,
			cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
			//credentials: 'same-origin', // include, *same-origin, omit
			headers: {
			'Content-Type': 'application/json'
			// 'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: sData // body data type must match "Content-Type" header
		};
	if(method == 'GET')
		url = url + ((sData == '{}')? '' : '?'+json2url(data));
	return [url, bData];
}

async function promiseAjaxCall(url, method, data){	
	let nUrl, bData;
	[nUrl, bData] = transformRequest(url, method, data);
	let brojac = brojacg;
	console.log('request: '+url, brojac, bData);

	let response = await fetch(nUrl, bData);
	let tData = await response.text();

	var rData = 'Nema odgovora';
	if(tData && tData.trim() !== ''){
		try{
			rData = JSON.parse(tData);
			errorReport(rData, brojac, 'green');
		}catch(e){
			rData = 'Greska. Vidi log.';
			errorReport('Cant parse to JSON: '+tData,  brojac);
		}
	}
	return rData;
}



function ajaxCall(url, method, data, callback){	
	let bData;
	[url, bData] = transformRequest(url, method, data);
	let brojac = brojacg;
	console.log('request: '+url, brojac, bData);

	fetch(url, bData)
		.then(resp => resp.text())
		.then(tData => {
			var rData;
			if(tData && tData.trim() !== '')
				try{
					rData = JSON.parse(tData);
					errorReport(rData,  brojac, 'green');
				}catch(e){
					errorReport('Cant parse to JSON: '+tData,  brojac);
					//return;
				}
			if(callback && typeof callback == 'function') 
				callback(rData);
		});
}

function errorReport(data, brojac, err){
	if(err)
		console.log('ajaxCallReport: ',  brojac, data);
	else
		console.log('ERROR:', data);
}