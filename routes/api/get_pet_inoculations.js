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

        let peId = req.query.peId;

        if (isNone(peId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_maps_pet_inoculation AS mpeinTab";
        query += " JOIN t_inoculations AS inTab ON inTab.in_id = mpeinTab.mpein_in_id";
        query += " WHERE mpeinTab.mpein_pe_id = ?";
        let params = [peId];
        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
