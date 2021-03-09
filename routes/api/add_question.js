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
        let title = req.body.title;
        let contents = req.body.contents;

        let query = "INSERT INTO t_questions (q_u_id, q_title, q_contents) VALUES (?, ?, ?)";
        let params = [uId, title, contents];
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;