var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
const pool = require('../../lib/database');


// 사료 검색 (사료만 따로 / t_feed_nutrients 때문)
router.get('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let keyword = req.query.keyword;

        if (isNone(keyword)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        
        let query = "SELECT * FROM t_products AS pTab";
        query += " JOIN t_feed_nutrients AS fnTab ON fnTab.fn_p_id = pTab.p_id";
        query += " WHERE pTab.p_pc_id = 1 AND pTab.p_keyword LIKE ?";
        let params = [`%${keyword}%`];
        let [result, fields] = await pool.query(query, params);
        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;