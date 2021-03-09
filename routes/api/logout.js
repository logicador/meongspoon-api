var express = require('express');
var router = express.Router();
const { isLogined } = require('../../lib/common');
const pool = require('../../lib/database');


// 로그아웃
router.post('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;
        let query = "UPDATE t_users SET u_is_logined = 'N', u_connected_date = NOW() WHERE u_id = ?";
        let params = [uId];
        await pool.query(query, params);

        req.session.destroy(() => {
            res.json({ status: 'OK' });
        });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;