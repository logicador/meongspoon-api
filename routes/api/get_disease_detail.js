var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
const pool = require('../../lib/database');


// 질병 가져오기
router.get('', async (req, res) => {
    try {
        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }

        let dId = req.query.dId;

        if (isNone(dId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }


        let query = "SELECT dTab.*,";
        query += " IFNULL((SELECT GROUP_CONCAT(mdnf_target_id SEPARATOR '|') FROM t_maps_disease_nutrient_food WHERE mdnf_type LIKE 'FOOD' AND mdnf_d_id = dTab.d_id), '') AS mdnfs,";
        query += " IFNULL((SELECT GROUP_CONCAT(msd_s_id SEPARATOR '|') FROM t_maps_symptom_disease WHERE msd_d_id = dTab.d_id), '') AS msds";
        query += " FROM t_diseases AS dTab WHERE dTab.d_id = ?";
        let params = [dId];

        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_DISEASE' });
            return;
        }

        let disease = result[0];

        let foodIdList = (disease.mdnfs == '') ? [] : disease.mdnfs.split('|');
        let symptomIdList = (disease.msds == '') ? [] : disease.msds.split('|');

        let foodList = [];
        let symptomList = [];

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
            disease: disease,
            foodList: foodList,
            symptomList: symptomList
        }});

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;
