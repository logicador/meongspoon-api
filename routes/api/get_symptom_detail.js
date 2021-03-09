var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
const pool = require('../../lib/database');


// 증상 가져오기
router.get('', async (req, res) => {
    try {
        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }

        let uId = req.session.uId;
        let sId = req.query.sId;
        let peId = req.query.peId;

        if (isNone(sId) || isNone(peId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }


        let query = "SELECT sTab.*,";
        query += " IFNULL((SELECT GROUP_CONCAT(msnf_target_id SEPARATOR '|') FROM t_maps_symptom_nutrient_food WHERE msnf_type LIKE 'FOOD' AND msnf_s_id = sTab.s_id), '') AS msnfs,";
        query += " IFNULL((SELECT GROUP_CONCAT(msd_d_id SEPARATOR '|') FROM t_maps_symptom_disease WHERE msd_s_id = sTab.s_id), '') AS msds";
        query += " FROM t_symptoms AS sTab WHERE sTab.s_id = ?";
        let params = [sId];

        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_SYMPTOM' });
            return;
        }

        let symptom = result[0];

        let foodIdList = (symptom.msnfs == '') ? [] : symptom.msnfs.split('|');
        let diseaseIdList = (symptom.msds == '') ? [] : symptom.msds.split('|');

        let foodList = [];
        let diseaseList = [];

        if (foodIdList.length > 0) {
            query = "SELECT * FROM t_foods WHERE f_id IN (";
            params = [];
            for (let i = 0; i < foodIdList.length; i++) {
                if (i > 0) query += " ,";
                query += " ?";
                params.push(foodIdList[i]);
            }
            query += " )";
            [result, fields] = await pool.query(query, params);
            foodList = result;
        }

        if (diseaseIdList.length > 0) {
            query = "SELECT * FROM t_diseases WHERE d_id IN (";
            params = [];
            for (let i = 0; i < diseaseIdList.length; i++) {
                if (i > 0) query += " ,";
                query += " ?";
                params.push(diseaseIdList[i]);
            }
            query += " )";
            [result, fields] = await pool.query(query, params);
            diseaseList = result;
        }

        query = "SELECT * FROM t_pets WHERE pe_id = ?";
        params = [peId];
        [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PET' });
            return;
        }

        let pet = result[0];

        // 유사견 리스트 뽑기 > 견종, 출생일 +- 1년, 신체지수, 성별
        query = "SELECT * FROM t_pets AS peTab";
        query += " WHERE peTab.pe_b_id = ? AND peTab.pe_birth >= ? AND peTab.pe_birth <= ?";
        query += " AND peTab.pe_bcs = ? AND peTab.pe_gender = ?";
        params = [pet.pe_b_id, pet.pe_birth - 10000, pet.pe_birth + 10000, pet.pe_bcs, pet.pe_gender];
        [result, fields] = await pool.query(query, params);

        // 총 유사견 수
        let similarCnt = result.length;
        // 유사견 id 리스트
        let similarIdList = [];
        for (let i = 0; i < result.length; i++) {
            similarIdList.push(result[i].pe_id);
        }

        for (let i = 0; i < diseaseList.length; i++) {
            let cnt = 0;
            if (similarIdList.length > 0) {
                query = "SELECT * FROM t_maps_pet_disease WHERE mped_d_id = ? AND mped_pe_id IN (";
                params = [diseaseList[i].d_id];
                for (let j = 0; j < similarIdList.length; j++) {
                    if (j > 0) query += " ,";
                    query += " ?";
                    params.push(similarIdList[j]);
                }
                query += " )";
                [result, fields] = await pool.query(query, params);
                cnt = result.length;
            }

            diseaseList[i].cnt = cnt;
        }

        res.json({ status: 'OK', result: {
            similarCnt: similarCnt,
            symptom: symptom,
            foodList: foodList,
            diseaseList: diseaseList
        }});

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;
