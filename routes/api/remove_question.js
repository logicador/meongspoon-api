var express = require('express');
var router = express.Router();
const { isLogined } = require('../../lib/common');
const pool = require('../../lib/database');


router.post('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;
        let qId = req.body.qId;

        console.log("uId:", uId);
        console.log("qId:", qId);

        let query = "SELECT * FROM t_questions WHERE q_id = ? AND q_u_id = ?";
        let params = [qId, uId];

        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        query = "DELETE FROM t_questions WHERE q_id = ? AND q_u_id = ?";
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
