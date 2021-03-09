var express = require('express');
var router = express.Router();
const { isNone, isLogined, isInt, getJSONList } = require('../../lib/common');
var fs = require('fs');
const pool = require('../../lib/database');


// 펫 저장 (추가/수정)
router.post('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;

        let peId = req.body.peId; // NULL
        let thumbnail = req.body.thumbnail; // NULL
        let name = req.body.name;
        let birth = req.body.birth;
        let bId = req.body.bId;
        let gender = req.body.gender;
        let weight = req.body.weight; // NULL
        let bcs = req.body.bcs;
        let neuter = req.body.neuter;
        let inoculation = req.body.inoculation;
        let inoculationText = req.body.inoculationText; // NULL
        let serial = req.body.serial;
        let serialNo = req.body.serialNo; // NULL
        let feedPId = req.body.feedPId; // NULL
        let snackPId = req.body.snackPId; // NULL
        let inoculationIdList = req.body.inoculationIdList; // NULL
        let diseaseIdList = req.body.diseaseIdList; // NULL
        let allergyIdList = req.body.allergyIdList; // NULL

        // 필수값 체크
        if (isNone(name) || isNone(birth) || isNone(bId) || isNone(gender) ||
            isNone(bcs) || isNone(neuter) || isNone(inoculation) || isNone(serial)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        // 숫자 체크
        if (!isInt(birth)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        if (!isInt(bId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        if (!isInt(bcs)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        if (!isNone(feedPId) && !isInt(feedPId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        if (!isNone(snackPId) && !isInt(snackPId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        if (!isNone(peId) && !isInt(peId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        // 성별 체크
        if (gender != 'M' && gender != 'F') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        // Y N D 체크
        if (neuter != 'Y' && neuter != 'N' && neuter != 'D') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        if (inoculation != 'Y' && inoculation != 'N' && inoculation != 'D') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        if (serial != 'Y' && serial != 'N' && serial != 'D') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        // // bcs 유효성 체크 (1~3)
        // if (parseInt(bcs) < 1 || parseInt(bcs) > 3) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }

        // // 이름 길이 1 - 8자 (12자)
        // if (!isValidStrLength(10, 1, 8, name)) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }

        // // 생일 유효성 체크
        // let birthRegExp = /^[0-9]{8}$/;
        // if (!birthRegExp.test(birth)) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }

        // // 연월일 자르기
        // let splitBirthYear = birth.substring(0, 4);
        // let splitBirthMonth = birth.substring(4, 6);
        // let splitBirthDay = birth.substring(6, 8);
        // // Date로 Convert
        // let convertDate = new Date(splitBirthYear, (parseInt(splitBirthMonth) - 1), splitBirthDay);
        // let convertYear = convertDate.getFullYear();
        // let convertMonth = convertDate.getMonth() + 1;
        // let convertDay = convertDate.getDate();
        // // 계산 위한 Int 형변환
        // let birthYear = parseInt(splitBirthYear);
        // let birthMonth = parseInt(splitBirthMonth);
        // let birthDay = parseInt(splitBirthDay);

        // // 입력된 날짜가 유효한지 (Date로 변경해서 입력한 날짜랑 같은지)
        // if (birthYear != convertYear || birthMonth != convertMonth || birthDay != convertDay) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }

        // // 오늘 날짜 이후인지 체크
        // let today = new Date();
        // let year = today.getFullYear();
        // let month = today.getMonth() + 1;
        // let day = today.getDate();
        // if (year < birthYear) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }
        // if (year == birthYear && month < birthMonth) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }
        // if (year == birthYear && month == birthMonth && day < birthDay) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }

        // // 몸무게 유효성 체크
        // if (!isNone(weight)) {
        //     weight = parseFloat(weight);
        //     if (isNaN(weight)) {
        //         res.json({ status: 'ERR_WRONG_PARAMS' });
        //         return;
        //     }
        //     if (weight > 999) {
        //         res.json({ status: 'ERR_WRONG_PARAMS' });
        //         return;
        //     }
        //     weight = weight.toFixed(2);
        // }

        // // 시리얼넘버 길이 체크 최대 20(30)
        // if (!isNone(serialNo) && (getByteLength(serialNo) > 60 || serialNo.length > 30)) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }

        // // 기초접종 직접입력 길이 체크 최대 30(50)
        // if (!isNone(inoculationText) && (getByteLength(inoculationText) > 90 || inoculationText.length > 50)) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }

        // // thumbnail에 내 uId가 정상적으로 포함되어있는지
        // let uId = req.session.uId;
        // if (thumbnail != '' && !thumbnail.includes(uId)) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }

        // breed 존재하는지 체크 (SKIP For DEV_DEBUG)
        // query = "SELECT * FROM t_breeds WHERE b_id = ?";
        // params = [bId];
        // [result, fields] = await pool.query(query, params);
        // if (result.length == 0) {
        //     res.json({ status: 'ERR_NO_BREED' });
        //     return;
        // }

        // product 존재하는지 체크 (SKIP For DEV_DEBUG)
        // params = [];
        // if (!isNone(feedPId)) params.push(feedPId);
        // if (!isNone(snackPId)) params.push(snackPId);
        // if (params.length > 0) {
        //     query = "SELECT * FROM t_products WHERE p_id = ?";
        //     if (params.length > 1) query += " OR p_id = ?";
        //     [result, fields] = await pool.query(query, params);
        //     if (result.length != params.length) {
        //         res.json({ status: 'ERR_NO_PRODUCT' });
        //         return;
        //     }
        // }

        inoculationIdList = getJSONList(inoculationIdList);
        diseaseIdList = getJSONList(diseaseIdList);
        allergyIdList = getJSONList(allergyIdList);

        let query = "";
        let params = [];
        let [result, fields] = [null, null];

        if (isNone(peId)) {
            // 펫 추가
            query = "INSERT INTO t_pets (pe_u_id, pe_b_id, pe_name, pe_thumbnail, pe_birth, pe_bcs, pe_gender,";
            query += " pe_neuter, pe_inoculation, pe_inoculation_text, pe_serial, pe_serial_no, pe_weight)";
            query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            params = [uId, bId, name, thumbnail, birth, bcs, gender, neuter, inoculation, inoculationText, serial, serialNo, weight];
            [result, fields] = await pool.query(query, params);

            peId = result.insertId;

            // 첫번째 펫이라면 꽂아주기
            query = "SELECT ";
            query += " (IFNULL(peCntTab.cnt, 0)) AS petCnt";
            query += " FROM t_users AS uTab";
            query += " LEFT JOIN (SELECT pe_u_id, COUNT(*) AS cnt FROM t_pets GROUP BY pe_u_id) AS peCntTab ON peCntTab.pe_u_id = uTab.u_id";
            query += " WHERE u_id = ?";
            params = [uId];
            [result, fields] = await pool.query(query, params);

            if (result[0].petCnt == 1) {
                query = "UPDATE t_users SET u_pe_id = ? WHERE u_id = ?";
                params = [peId, uId];
                await pool.query(query, params);
            }

        } else {
            // 펫 수정

            // 펫 수정 권한 체크
            query = "SELECT * FROM t_pets WHERE pe_id = ? AND pe_u_id = ?";
            params = [peId, uId];
            [result, fields] = await pool.query(query, params);
            if (result.length == 0) {
                res.json({ status: 'ERR_NO_PERMISSION' });
                return;
            }

            // 썸네일 수정함 (기존 파일 삭제)
            let originalThumbnail = result[0].pe_thumbnail;
            if (!isNone(originalThumbnail) && thumbnail != originalThumbnail) {
                if (fs.existsSync('public' + originalThumbnail)) {
                    fs.unlinkSync('public' + originalThumbnail);
                    let imageName = originalThumbnail.replace('/images/users/' + uId + '/', '');
                    if (fs.existsSync('public/images/users/' + uId + '/original/' + imageName)) {
                        fs.unlinkSync('public/images/users/' + uId + '/original/' + imageName);
                    }
                }
            }

            // UPDATE
            query = "UPDATE t_pets SET pe_b_id = ?, pe_name = ?, pe_thumbnail = ?, pe_birth = ?, pe_bcs = ?, pe_gender = ?,";
            query += " pe_neuter = ?, pe_inoculation = ?, pe_inoculation_text = ?, pe_serial = ?, pe_serial_no = ?, pe_weight = ?,";
            query += " pe_updated_date = NOW()";
            query += " WHERE pe_id = ? AND pe_u_id = ?";
            params = [bId, name, thumbnail, birth, bcs, gender, neuter, inoculation, inoculationText, serial, serialNo, weight, peId, uId];
            await pool.query(query, params);

            params = [peId];

            query = "DELETE FROM t_maps_pet_product WHERE mpep_pe_id = ?";
            await pool.query(query, params);

            query = "DELETE FROM t_maps_pet_inoculation WHERE mpein_pe_id = ?";
            await pool.query(query, params);

            query = "DELETE FROM t_maps_pet_disease WHERE mped_pe_id = ?";
            await pool.query(query, params);

            query = "DELETE FROM t_maps_pet_food_category2 WHERE mpefc2_pe_id = ?";
            await pool.query(query, params);
        }

        if (!isNone(feedPId)) {
            query = "INSERT INTO t_maps_pet_product (mpep_pe_id, mpep_p_id) VALUES (?, ?)";
            params = [peId, feedPId];
            await pool.query(query, params);
        }

        if (!isNone(snackPId)) {
            query = "INSERT INTO t_maps_pet_product (mpep_pe_id, mpep_p_id) VALUES (?, ?)";
            params = [peId, snackPId];
            await pool.query(query, params);
        }

        if (inoculationIdList.length > 0) {
            query = "INSERT INTO t_maps_pet_inoculation (mpein_pe_id, mpein_in_id) VALUES";
            params = [];
            for (let i = 0; i < inoculationIdList.length; i++) {
                if (i > 0) query += " ,";
                query += " (?, ?)";
                params.push(peId);
                params.push(inoculationIdList[i]);
            }
            await pool.query(query, params);
        }

        if (diseaseIdList.length > 0) {
            query = "INSERT INTO t_maps_pet_disease (mped_pe_id, mped_d_id) VALUES";
            params = [];
            for (let i = 0; i < diseaseIdList.length; i++) {
                if (i > 0) query += " ,";
                query += " (?, ?)";
                params.push(peId);
                params.push(diseaseIdList[i]);
            }
            await pool.query(query, params);
        }

        if (allergyIdList.length > 0) {
            query = "INSERT INTO t_maps_pet_food_category2 (mpefc2_pe_id, mpefc2_fc2_id) VALUES";
            params = [];
            for (let i = 0; i < allergyIdList.length; i++) {
                if (i > 0) query += " ,";
                query += " (?, ?)";
                params.push(peId);
                params.push(allergyIdList[i]);
            }
            console.log(query);
            console.log(params);
            await pool.query(query, params);
        }

        query = "SELECT * FROM t_pets AS peTab";
        query += " JOIN t_breeds AS bTab ON bTab.b_id = peTab.pe_b_id";
        query += " WHERE peTab.pe_id = ?";
        params = [peId];
        [result, fields] = await pool.query(query, params);

        let pet = result[0];
        pet.age = 1.2;

        res.json({ status: 'OK', result: pet });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
