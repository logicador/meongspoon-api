var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


// 제품 음식, 영양소 정보 가져오기
router.get('', async (req, res) => {
    try {
        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }
        
        let pId = req.query.pId;

        if (isNone(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_products WHERE p_id = ?";
        let params = [pId];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PRODUCT' });
            return;
        }

        // 연관 음식
        query = "SELECT fTab.*, IFNULL(mfn, '') AS mfns";
        query += " FROM t_maps_product_nutrient_food AS mpnfTab";

        // 음식 JOIN
        query += " LEFT JOIN t_foods AS fTab ON fTab.f_id = mpnfTab.mpnf_target_id";

        // JOIN한 음식이 들고있는 영양소 ID
        query += " LEFT JOIN (SELECT mfn_f_id, GROUP_CONCAT(mfn_n_id SEPARATOR '|') AS mfn FROM t_maps_food_nutrient GROUP BY mfn_f_id) AS mfnTab ON mfnTab.mfn_f_id = mpnfTab.mpnf_target_id";

        query += " WHERE mpnfTab.mpnf_p_id = ? AND mpnfTab.mpnf_type = 'FOOD'";
        [result, fields] = await pool.query(query, params);

        let foodList = result;

        let nutrientIdList = [];
        for (let i = 0; i < result.length; i++) { nutrientIdList = nutrientIdList.concat(result[i].mfns.split('|')); }

        // 연관 영양소 ID만
        query = "SELECT mpnf_target_id FROM t_maps_product_nutrient_food WHERE mpnf_p_id = ? AND mpnf_type = 'NUTRIENT'";
        [result, fields] = await pool.query(query, params);

        // 중복제거를 위해 toString 해서 저장함
        for (let i = 0; i < result.length; i++) { nutrientIdList.push(result[i].mpnf_target_id.toString()); }

        // 중복제거
        nutrientIdList = Array.from(new Set(nutrientIdList));

        let nutrientList = [];

        // 연관 영양소 가져오기
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

        res.json({ status: 'OK', result: {
            foodList: foodList,
            nutrientList: nutrientList
        }});

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;