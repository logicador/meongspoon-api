var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
const pool = require('../../lib/database');


// 음식 가져오기
router.get('', async (req, res) => {
    try {
        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }

        let fId = req.query.fId;

        if (isNone(fId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }


        let query = "SELECT fTab.*,";
        query += " IFNULL((SELECT GROUP_CONCAT(mfn_n_id SEPARATOR '|') FROM t_maps_food_nutrient WHERE mfn_f_id = fTab.f_id), '') AS mfns,";
        query += " IFNULL((SELECT GROUP_CONCAT(mdnf_d_id SEPARATOR '|') FROM t_maps_disease_nutrient_food WHERE mdnf_type LIKE 'FOOD' AND mdnf_target_id = fTab.f_id), '') AS mdnfs,";
        query += " IFNULL((SELECT GROUP_CONCAT(msnf_s_id SEPARATOR '|') FROM t_maps_symptom_nutrient_food WHERE msnf_type LIKE 'FOOD' AND msnf_target_id = fTab.f_id), '') AS msnfs";
        query += " FROM t_foods AS fTab WHERE fTab.f_id = ?";
        let params = [fId];

        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_FOOD' });
            return;
        }

        let food = result[0];

        let nutrientIdList = (food.mfns == '') ? [] : food.mfns.split('|');
        let diseaseIdList = (food.mdnfs == '') ? [] : food.mdnfs.split('|');
        let symptomIdList = (food.msnfs == '') ? [] : food.msnfs.split('|');

        let nutrientList = [];
        let diseaseList = [];
        let symptomList = [];

        if (nutrientIdList.length > 0) {
            query = "SELECT * FROM t_nutrients WHERE n_id IN (";
            params = [];
            for (let i = 0; i < nutrientIdList.length; i++) {
                if (i > 0) query += " ,";
                query += " ?";
                params.push(nutrientIdList[i]);
            }
            query += " )";
            [result, fields] = await pool.query(query, params);
            nutrientList = result;
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

        if (symptomIdList.length > 0) {
            query = "SELECT * FROM t_symptoms WHERE s_id IN (";
            params = [];
            for (let i = 0; i < symptomIdList.length; i++) {
                if (i > 0) query += " ,";
                query += " ?";
                params.push(symptomIdList[i]);
            }
            query += " )";
            [result, fields] = await pool.query(query, params);
            symptomList = result;
        }

        res.json({ status: 'OK', result: {
            food: food,
            nutrientList: nutrientList,
            diseaseList: diseaseList,
            symptomList: symptomList
        }});

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;
