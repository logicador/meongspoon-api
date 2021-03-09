// var express = require('express');
// var router = express.Router();
// const { isLogined } = require('../../lib/common');
// const pool = require('../../lib/database');


// router.get/post('', (req, res) => {
//     try {
//         if (!isLogined(req.session)) {
//             res.json({ status: 'ERR_NO_PERMISSION' });
//             return;
//         }

//     } catch(error) {
//         console.log(error);
//         res.json({ status: 'ERR_INTERNAL_SERVER' });
//     }
// });


// module.exports = router;