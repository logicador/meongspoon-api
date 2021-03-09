var express = require('express');
var router = express.Router();
const { isNone, generateRandomId } = require('../../lib/common');
var fs = require('fs');
const pool = require('../../lib/database');


// 로그인
router.post('', async (req, res) => {
    try {
        let type = req.body.type;
        let socialId = req.body.socialId;
        let email = req.body.email;
        let password = req.body.password;

        if (isNone(type)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (type != 'EMAIL' && type != 'KAKAO' && type != 'NAVER' && type != 'APPLE') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT uTab.*,";
        query += " (IFNULL(peCntTab.cnt, 0)) AS petCnt";
        query += " FROM t_users AS uTab";
        query += " LEFT JOIN (SELECT pe_u_id, COUNT(*) AS cnt FROM t_pets GROUP BY pe_u_id) AS peCntTab ON peCntTab.pe_u_id = uTab.u_id";
        query += " WHERE uTab.u_type LIKE ?";
        let params = [type];

        if (type == 'KAKAO' || type == 'NAVER' || type == 'APPLE') {
            if (isNone(socialId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query += " AND uTab.u_social_id LIKE ?";
            params.push(socialId);

        } else {
            if (isNone(email) || isNone(password)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query += " AND uTab.u_email LIKE ? AND uTab.u_password LIKE ?";
            params.push(email);
            params.push(password);
        }

        let [result, fields] = await pool.query(query, params);
        let user = null;

        if (result.length == 0) {
            // 신규유저
            let uId = generateRandomId();

            if (type == 'EMAIL') {
                // TODO: 이메일 회원가입

            } else {
                query = "INSERT INTO t_users (u_id, u_type, u_social_id, u_email) VALUES (?, ?, ?, ?)";
                params = [uId, type, socialId, email];
                await pool.query(query, params);

                query = "SELECT uTab.*,";
                query += " (IFNULL(peCntTab.cnt, 0)) AS petCnt";
                query += " FROM t_users AS uTab";
                query += " LEFT JOIN (SELECT pe_u_id, COUNT(*) AS cnt FROM t_pets GROUP BY pe_u_id) AS peCntTab ON peCntTab.pe_u_id = uTab.u_id";
                query += " WHERE u_id = ?";
                params = [uId];
                [result, fields] = await pool.query(query, params);

                user = result[0];
            }

        } else {
            // 기존회원
            user = result[0];
            query = "UPDATE t_users SET u_is_logined = 'Y', u_connected_date = NOW() WHERE u_id = ?";
            params = [user.u_id];
            await pool.query(query, params);
        }

        // 사용자 폴더 생성
        if (!fs.existsSync(`public/images/users/${user.u_id}`)) {
            fs.mkdirSync(`public/images/users/${user.u_id}`);
        }
        if (!fs.existsSync(`public/images/users/${user.u_id}/original`)) {
            fs.mkdirSync(`public/images/users/${user.u_id}/original`);
        }

        // 세션 생성
        req.session.uIsLogined = true;
        req.session.uId = user.u_id;
        req.session.uType = user.u_type;
        req.session.save(() => {
            res.json({ status: 'OK', result: user });
        });
    
        // let query = "";
        // let params = [];
        // let [result, fields] = [null, null];
    
        // let user = null;
    
        // // 이메일 로그인이라면
        // if (registType == 'EMAIL') {
        //     if (isNone(email) || isNone(password)) {
        //         res.json({ status: 'ERR_WRONG_PARAMS' });
        //         return;
        //     }
    
        //     query = "SELECT *, IFNULL(peTab.cnt, 0) AS petCnt FROM t_users AS uTab LEFT JOIN";
        //     query += " (SELECT pe_u_id, COUNT(*) AS cnt FROM t_pets GROUP BY pe_u_id) AS peTab";
        //     query += " ON uTab.u_id = peTab.pe_u_id WHERE uTab.u_email = ? AND uTab.u_password = ?";
        //     params = [email, password];
        //     [result, fields] = await pool.query(query, params);
    
        //     if (result.length == 0) {
        //         res.json({ status: 'LOGIN_FAILED' });
        //         return;
        //     }
    
        //     user = result[0];
        // }

        // // 상태 업데이트
        // query = "UPDATE t_users SET u_is_logined = 'Y', u_connected_date = NOW() WHERE u_id = ?";
        // params = [user.u_id];
        // [result, fields] = await pool.query(query, params);
    
        // if (!fs.existsSync(`public/images/users/${user.u_id}`)) {
        //     fs.mkdirSync(`public/images/users/${user.u_id}`);
        // }
        // if (!fs.existsSync(`public/images/users/${user.u_id}/original`)) {
        //     fs.mkdirSync(`public/images/users/${user.u_id}/original`);
        // }
    
        // req.session.isLogined = true;
        // req.session.uId = user.u_id;
        // // req.session.uEmail = user.u_email;
        // req.session.uRegistType = user.u_regist_type;
        // // req.session.uSocialId = user.u_social_id;
        // req.session.save(() => {
        //     res.json({ status: 'OK', result: user });
        // });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;