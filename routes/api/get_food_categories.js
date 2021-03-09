var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
const pool = require('../../lib/database');


// 알러지 가져오기 allergy
router.get('', async (req, res) => {
    try {
        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }
    
        let fc1Id = req.query.fc1Id;
    
        if (isNone(fc1Id)) {
            fc1Id = 'ALL';
        }

        let query = "SET SESSION group_concat_max_len = 65535";
        let [result, fields] = await pool.query(query);

        query = "SELECT fc1Tab.*,";
        query += " IFNULL(fc2, '') AS fc2s";
        query += " FROM t_food_categories1 AS fc1Tab";

        query += " LEFT JOIN (SELECT fc2_fc1_id,";
        query += " GROUP_CONCAT(CONCAT_WS(':', fc2_id, fc2_name) SEPARATOR '|') AS fc2";
        query += " FROM t_food_categories2 GROUP BY fc2_fc1_id) AS fc2Tab";
        query += " ON fc2Tab.fc2_fc1_id = fc1Tab.fc1_id";
        
        let params = [];
    
        if (fc1Id != 'ALL') {
            query += " WHERE fc1Tab.fc1_id = ?";
            params.push(fc1Id);
        }
    
        [result, fields] = await pool.query(query, params);
    
        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;