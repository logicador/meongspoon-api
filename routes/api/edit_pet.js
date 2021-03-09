var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
var fs = require('fs');
const pool = require('../../lib/database');


router.post('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;
        let peId = req.body.peId;
        let imageName = req.body.imageName;
        console.log("uId:", uId);
        console.log("peId:", peId);

        let thumbnail = `/images/users/${uId}/${imageName}.jpg`;

        let query = "SELECT * FROM t_pets WHERE pe_u_id = ? AND pe_id = ?";
        let params = [uId, peId];
        let [result, fields] = await pool.query(query, params);
        if (result.length == 0) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        query = "UPDATE t_pets SET pe_thumbnail = ?, pe_updated_date = NOW() WHERE pe_u_id = ? AND pe_id = ?";
        params = [thumbnail, uId, peId];
        await pool.query(query, params);

        // 썸네일 수정함 (기존 파일 삭제)
        let originalThumbnail = result[0].pe_thumbnail;
        if (!isNone(originalThumbnail) && thumbnail != originalThumbnail) {
            if (fs.existsSync('public' + originalThumbnail)) {
                fs.unlinkSync('public' + originalThumbnail);
                let imageName = originalThumbnail.replace('/images/users/' + uId + '/', '');
                if (fs.existsSync('public/images/users/' + uId + '/original/' + imageName)) {
                    fs.unlinkSync('public/images/users/' + uId + '/original/' + imageName);
                }
            }
        }

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
