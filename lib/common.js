const moment = require('moment');

const common = {};


// random id
common.generateRandomId = () => {
    var rand = Math.floor(Math.random() * 9999) + '';
    var pad = rand.length >= 4 ? rand : new Array(4 - rand.length + 1).join('0') + rand;
    var random_id = moment().format("YYMMDDHHmmss") + pad;
    return parseInt(random_id);
};

// none check
common.isNone = (value) => {
    if (typeof value === 'undefined' || value === null || value === '') {
        return true;
    } else {
        if (value.toString().trim() === '') return true;
        else return false;
    }
};

// none to blank
common.ntb = (value) => {
    if (common.isNone(value)) return '';
    else return value;
};

// 로그인 체크
common.isLogined = (session) => {
    if (!session.uIsLogined || common.isNone(session.uId) || common.isNone(session.uType)) {
        return false;
    }
    return true;
};

// utf8 byte 길이 체크
common.getByteLength = (s) => {
    if(s != undefined && s != "") {
		for(b=i=0;c=s.charCodeAt(i++);b+=c>>11?3:c>>7?2:1);
		return b;
	} else {
		return 0;
	}
};

// JSON parse 체크
common.getJSONList = (list) => {
    try {
        list = JSON.parse(list);
        return list;
    } catch(error) {
        return [];
    }
};

// 숫자 체크
common.isInt = (value) => {
    let v = parseInt(value);
    if (isNaN(v)) return false;
    return true;
};

// 문자 길이 체크
common.isValidStrLength = (max, kMin, kMax, value) => {
    let cnt = value.length;
    let utf8Cnt = common.getByteLength(value);
    if (utf8Cnt >= (kMin * 3) && utf8Cnt <= (kMax * 3)) {
        if (cnt <= max) {
            return true;
        } else { return false; }
    } else { return false; }
};

// nulltovalue
common.nanTo = (value, to) => {
    if (isNaN(value)) return to;
    else return value;
};

module.exports = common;