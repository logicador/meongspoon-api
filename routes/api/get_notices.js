var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
const pool = require('../../lib/database');


router.get('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let noId = req.query.noId;

        if (isNone(noId)) noId = 'ALL';

        let query = "SELECT * FROM t_notices";
        let params = [];
        if (noId != 'ALL') {
            query += " WHERE no_id = ?";
            params.push(noId);
        }
        query += " ORDER BY no_created_date DESC";
        let [result, fields] = await pool.query(query, params);
        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;