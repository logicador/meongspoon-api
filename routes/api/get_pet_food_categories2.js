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

        let query = "SELECT * FROM t_maps_pet_food_category2 AS mpefc2Tab";
        query += " JOIN t_food_categories2 AS fc2Tab ON fc2Tab.fc2_id = mpefc2Tab.mpefc2_fc2_id";
        query += " WHERE mpefc2_pe_id = ?";
        let params = [peId];
        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
