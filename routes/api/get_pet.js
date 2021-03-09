var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


router.get('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let peId = req.query.peId;

        if (isNone(peId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(peId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_pets AS peTab";
        query += " JOIN t_breeds AS bTab ON bTab.b_id = peTab.pe_b_id";
        query += " WHERE peTab.pe_id = ?";
        let params = [peId];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PET' });
            return;
        }

        res.json({ status: 'OK', result: result[0] });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;