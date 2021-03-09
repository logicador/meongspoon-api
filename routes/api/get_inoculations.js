var express = require('express');
var router = express.Router();
const { isLogined } = require('../../lib/common');
const pool = require('../../lib/database');


// 기초접종 가져오기
router.get('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let query = "SELECT * FROM t_inoculations";
        let [result, fields] = await pool.query(query);
        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;