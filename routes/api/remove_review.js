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
        let prId = req.body.prId;

        let query = "SELECT * FROM t_product_reviews WHERE pr_id = ? AND pr_u_id = ?";
        let params = [prId, uId];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        query = "DELETE FROM t_product_reviews WHERE pr_id = ? AND pr_u_id = ?";
        await pool.query(query, params);

        // TODO: 이미지 테이블 삭제, 이미지 파일 삭제

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
