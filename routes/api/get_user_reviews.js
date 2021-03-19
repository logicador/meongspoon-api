var express = require('express');
var router = express.Router();
const { isLogined } = require('../../lib/common');
const pool = require('../../lib/database');


router.get('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;

        let query = "SELECT * FROM t_product_reviews AS prTab";
        query += " JOIN t_products AS pTab ON pTab.p_id = prTab.pr_p_id";
        query += " WHERE prTab.pr_u_id = ?";
        let params = [uId];
        let [result, fields] = await pool.query(query, params);
        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
