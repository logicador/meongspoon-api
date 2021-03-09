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

        // let bpId = req.query.bpId;
        let keyword = req.query.keyword;

        // if (isNone(bpId)) {
        //     bpId = 'ALL';
        // }

        let query = "SELECT fTab.*";
        query += " FROM t_foods AS fTab WHERE 1 = 1";
        let params = [];

        // if (bpId != 'ALL') {
        //     query += " AND d_bp_id = ?";
        //     params.push(bpId);
        // }

        if (!isNone(keyword)) {
            query += " AND fTab.f_keyword LIKE ?";
            params.push(`%${keyword}%`);
        }

        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;
