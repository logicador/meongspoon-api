var express = require('express');
var router = express.Router();
const { isLogined, getJSONList } = require('../../lib/common');
const pool = require('../../lib/database');


router.post('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;
        let peId = req.body.peId;
        let pId = req.body.pId;
        let pala = req.body.pala;
        let bene = req.body.bene;
        let cost = req.body.cost;
        let side = req.body.side;
        let title = req.body.title;
        let descAdv = req.body.descAdv;
        let descDisAdv = req.body.descDisAdv;
        let imageNameList = req.body.imageNameList;
        let imageList = getJSONList(imageNameList);

        pala = parseFloat(pala);
        bene = parseFloat(bene);
        cost = parseFloat(cost);
        let avg = (pala + bene + cost) / 3;

        let query = "INSERT INTO t_product_reviews";
        query += " (pr_u_id, pr_pe_id, pr_p_id, pr_title, pr_desc_adv, pr_desc_disadv,";
        query += " pr_avg_score, pr_pala_score, pr_bene_score, pr_cost_score, pr_side)";
        query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        let params = [uId, peId, pId, title, descAdv, descDisAdv, avg, pala, bene, cost, side];
        let [result, fields] = await pool.query(query, params);

        let prId = result.insertId;

        if (imageList.length > 0) {
            query = "INSERT INTO t_images (i_type, i_data_type, i_path, i_target_id) VALUES";
            params = [];
            for (let i = 0; i < imageList.length; i++) {
                if (i > 0) query += " ,";
                query += " (?, ?, ?, ?)";
                params.push('IMAGE');
                params.push('review');
                params.push(`/images/users/${uId}/${imageList[i]}.jpg`);
                params.push(prId);
            }
            console.log(query);
            console.log(params);
            await pool.query(query, params);
        }

        query = "SET SESSION group_concat_max_len = 65535";
        await pool.query(query);

        query = "SELECT *,";
        query += " IFNULL((SELECT GROUP_CONCAT(i_path SEPARATOR '|') FROM t_images WHERE i_data_type LIKE 'review' AND i_target_id = prTab.pr_id), '') AS images";
        query += " FROM t_product_reviews AS prTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = prTab.pr_u_id";
        query += " JOIN t_pets AS peTab ON peTab.pe_id = prTab.pr_pe_id";
        query += " JOIN t_breeds AS bTab ON bTab.b_id = peTab.pe_b_id";
        query += " WHERE prTab.pr_id = ?";
        params = [prId];
        [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result[0] });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;