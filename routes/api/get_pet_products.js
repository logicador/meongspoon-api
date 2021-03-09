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

        let query = "SELECT * FROM t_maps_pet_product AS mpepTab";
        query += " JOIN t_products AS pTab ON pTab.p_id = mpepTab.mpep_p_id";
        query += " JOIN t_product_brands AS pbTab ON pbTab.pb_id = pTab.p_pb_id";
        query += " WHERE mpepTab.mpep_pe_id = ?";
        let params = [peId];
        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
