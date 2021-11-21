<?php 

class Restriction_Class{

	public function __construct() {}
	
	public function checkRestrictionField ($calcVals, $fieldName, $structure, $sqlType){
		//structure is one field in fields
		$checkVal = $calcVals[$fieldName];
		if(!isset($checkVal) || is_null($checkVal))
			return array(false, 'Field '.$structure['label'].': Value is undefined.');
		if($structure['restrictions'] && array_key_exists('dontCheck', $structure['restrictions'])
			&&  $structure['restrictions']['dontCheck'] === true)
			return array(true);
		$check = array(true);
		if($structure['restrictions'])
			$check = $this->checkRestrictionObj($structure['restrictions'], $checkVal);
		if(array_key_exists('restrictionString', $structure) && $structure['restrictionString'] !== '')		
			$check = $this->checkRestrictionString($structure['restrictionString'], $checkVal);
		if(!array_key_exists('restrictions', $structure) && 
			(!array_key_exists('restrictionFn', $structure) || $structure['restrictionFn'] == '') &&
			(!array_key_exists('restrictionString', $structure) || $structure['restrictionString'] == '')
			&& $sqlType !== ''){
				//just check sql type
				$check = $this->checkRestrictionType($checkVal, $sqlType);
		}
		if($check[0] == false){
			$check[1] = 'Field '.$structure['label'].': '.$check[1];
			return $check;
		}
		return array(true);
	}
	public function checkRestrictionString($str, $checkVal){
		if($str == '') return true;
		$restStructure = $this->createRestrictionObjFromString($str);
		return $this->checkRestrictionObj($restStructure, $checkVal);
	}
	public function checkRestrictionObj ($restStructure, $checkVal){
		if(!isset($restStructure) || is_null($restStructure))
			return array(true);
		foreach($restStructure as $prop => $val){
			if($prop === 'table' || $prop == 'input') continue;
			if($prop == 'notEmpty' && $val === true){
				if(!isset($checkVal) || is_null($checkVal))	
					return array(false, 'Value is undefined');
				if(trim($checkVal) == '')	
					return array(false, 'Value is empty');
			}
			if($prop == 'type'){  
				$check = $this->checkRestrictionType($checkVal, $restStructure[$prop]);
				if($check[0] == false)	
					return $check;
			}
			if($checkVal == '' && $prop == 'val')
				continue;
			
			if($prop == 'len' || $prop == 'val'){
				$value = $restStructure[$prop];
				$values = explode(';', $value);
				for($j=0; $j<count($values); $j++) {
					$znak = substr($values[$j], 0, 1);
					$deo = substr($values[$j], 1);
					$newCheck = $checkVal;
					if($prop == 'len') 
						if(gettype($checkVal) === 'string')
							$newCheck = strlen($checkVal);
						else
							return array(false, "Len restriction can not be set to check '".$checkVal.
								"', with type ".gettype($checkVal));					
					if($prop == 'val'){
						if(!is_numeric($checkVal))
						 	return array(false, "Val restriction can not be set to check '".$checkVal.
								"'. Can only check numeric values.");		
					}

					if(substr($deo,0,1) == '='){
						$znak .= '=';
						try{ $deo = floatval(substr($deo, 1)); }catch(Exception $e){ 
							return array(false, 
								'Value '.substr($deo, 1).' is not a number in "restrictions"'); 
						}						
					}else{
						try{ $deo = floatval($deo); }catch(Exception $e){ 
							return array(false, 
								'Value '.floatval($deo).' is not a number in "restrictions"');
						}
					}	
					$restWord = ($prop == 'len') ? 'Length' : 'Value';
					$check = $this->check_1_RestrictionLenVal($newCheck, $deo, $znak, $restWord);
					if($check[0] == false)	
						return $check;
				}
			}
		}
		return array(true);
	}

	public function checkRestrictionType ($value, $type){
		if(!isset($value)) return array(true); 
		if($value == '')	return array(true);
		if(gettype($value) == 'string' && trim($value) == '') 	return array(true);
		if($type == 'int'){
			$no; 
			try{ $no = intval($value); }catch(Exception $e){ 
				return array(false, 'Value is not an INT number'); 
			}
		}
		if($type == 'float'){
			$no; 	
			try{ $no = floatval($value); }catch(Exception $e){ 
				return array(false, 'Value is not a FLOAT number'); 
			}
		}
		if($type == 'datetime'){
            return array(true);
			$arr = explode(' ', trim($value));
			if(count($arr) < 2) return array(false, 'Date & time must have space between');
			if(count($arr) > 2) return array(false, $arr.'. You have more then one space. Format must be date[space]time'); 
			//date part
			$d = strtotime($arr[0]);
			if($d == false) return array(false, 'That date does not exists!'); 
			//time part
			$compare1 = '/^([01]\d|2[0-3]):?([0-5][0-9]):?([0-5][0-9])$/';
            $compare2 = '/^([01]\d|2[0-3]):?([0-5][0-9])$/';
            if(preg_match($compare1, $arr[1]) === false && preg_match($compare2, $arr[1]) === false)            	
				return array(false, 'Time is not in the right format (HH:MM or HH:MM:SS)'); 
		}
		if($type == 'date'){
			$d = strtotime($value);
			if($d == false) return array(false, 'That date does not exists!'); 
		}
		if($type == 'time'){
			$compare1 = '/^([01]\d|2[0-3]):?([0-5][0-9]):?([0-5][0-9])$/';
            $compare2 = '/^([01]\d|2[0-3]):?([0-5][0-9])$/';
            if(preg_match($compare1, $value) === false && preg_match($compare2, $value) === false)            	
				return array(false, 'Time is not in the right format (HH:MM or HH:MM:SS)'); 
		}	
		if($type === 'year'){
			$no;
			try{ $no = intval($value); }catch(Exception $e){ 
				return array(false, 'Year must be an INT number'); 
			}
			if($no == false) return array(false, 'Year must be an INT number'); 
		}
		return array(true);
	}
	public function check_1_RestrictionLenVal ($value, $restVal, $znak, $restWord){
		if($znak == '>') if($value <= $restVal)	return array(false, $restWord.' must be > '.$restVal); 
		if($znak == '>=') if($value < $restVal)	return array(false, $restWord.' must be >= '.$restVal);
		if($znak == '<') if($value >= $restVal)	return array(false, $restWord.' must be < '.$restVal);
		if($znak == '<=') if($value > $restVal)	return array(false, $restWord.' must be <= '.$restVal);
		if($znak == '=') if($value = $restVal)	return array(false, $restWord.' must be = '.$restVal);
		return array(true);
	}

	public function createRestrictionObjFromString ($str){
	    if(!isset($str)) return null;
	    if(trim($str) === '') return null;

	    $restObj = array();
		$rest = explode(";", $str);
		for($j=0; $j<count($rest); $j++) {
			$rest[$j] = trim($rest[$j]);
			if(substr($rest[$j],0,5) == 'type='){
				$restObj['type'] = substr($rest[$j], 5);
			}
			if(substr($rest[$j],0,9) == 'notEmpty='){
				$restObj['notEmpty'] = (substr($rest[$j], 9) == 'true'); 
			}
			if((substr($rest[$j], 0, 3) == 'len') || (substr($rest[$j], 0, 3) == 'val')) {
				$prop = substr($rest[$j], 0, 3);
				$value = substr($rest[$j], 3);
				if($restObj[$prop])
					$restObj[$prop] .= ';'.$value;
				else
					$restObj[$prop] = $value;
			}
		}
		return $restObj;
	}

	
}

?>