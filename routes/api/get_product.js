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

        let pId = req.query.pId;

        let query = "SET SESSION group_concat_max_len = 65535";
        await pool.query(query);

        query = "SELECT pTab.*, pbTab.*, fnTab.*,";

        query += " IFNULL(";
        query += " (SELECT GROUP_CONCAT(iTab.i_path SEPARATOR '|')";
        query += " FROM t_images AS iTab";
        query += " WHERE iTab.i_type = 'IMAGE' AND iTab.i_data_type = 'product' AND iTab.i_target_id = pTab.p_id)";
        query += " , '') AS pImages,";

        query += " IFNULL(";
        query += " (SELECT GROUP_CONCAT(iTab.i_path SEPARATOR '|')";
        query += " FROM t_images AS iTab";
        query += " WHERE iTab.i_type = 'IMAGE_DETAIL' AND iTab.i_data_type = 'product' AND iTab.i_target_id = pTab.p_id)";
        query += " , '') AS pDetailImages";

        query += " , (SELECT COUNT(*) FROM t_product_reviews WHERE pr_p_id = pTab.p_id) AS reviewCnt,";
        query += " IFNULL((SELECT AVG(pr_pala_score) FROM t_product_reviews WHERE pr_p_id = pTab.p_id), 0) AS palaScore,";
        query += " IFNULL((SELECT AVG(pr_bene_score) FROM t_product_reviews WHERE pr_p_id = pTab.p_id), 0) AS beneScore,";
        query += " IFNULL((SELECT AVG(pr_cost_score) FROM t_product_reviews WHERE pr_p_id = pTab.p_id), 0) AS costScore,";
        query += " (SELECT COUNT(*) FROM t_product_reviews WHERE pr_p_id = pTab.p_id AND pr_side LIKE 'Y') AS sideCnt";

        query += " FROM t_products AS pTab";

        query += " JOIN t_product_brands AS pbTab ON pbTab.pb_id = pTab.p_pb_id";

        query += " LEFT JOIN t_feed_nutrients AS fnTab ON fnTab.fn_p_id = pTab.p_id";

        query += " WHERE pTab.p_id = ?";
        let params = [pId];

        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PRODUCT' });
            return;
        }

        let product = result[0];
        res.json({ status: 'OK', result: product });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
