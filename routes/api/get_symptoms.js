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

        let bpId = req.query.bpId;

        if (isNone(bpId)) {
            bpId = 'ALL';
        }

        let query = "SELECT * FROM t_symptoms";
        let params = [];

        if (bpId != 'ALL') {
            query += " WHERE s_bp_id = ?";
            params.push(bpId);
        }

        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;
