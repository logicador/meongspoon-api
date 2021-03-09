var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt, nanTo } = require('../../lib/common');
const pool = require('../../lib/database');


// 제품 음식, 영양소 정보 가져오기
router.get('', async (req, res) => {
    try {
        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }
        
        let pId = req.query.pId;
        let peId = req.query.peId;

        let query = "SELECT * FROM t_pets WHERE pe_id = ?";
        let params = [peId];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PET' });
            return;
        }

        let pet = result[0];

        let similarCnt = 0;
        let similarTotalScore = 0;
        let similarPalaScore = 0;
        let similarBeneScore = 0;
        let similarCostScore = 0;
        let similarSideCnt = 0;

        let cnt = 0;
        let totalScore = 0;
        let palaScore = 0;
        let beneScore = 0;
        let costScore = 0;
        let sideCnt = 0;

        // 유사견 리스트 뽑기
        query = "SELECT peTab.pe_id";

        query += " FROM t_pets AS peTab";

        // 유사견 > 견종, 출생일 +- 1년, 신체지수, 성별
        query += " WHERE peTab.pe_b_id = ? AND peTab.pe_birth >= ? AND peTab.pe_birth <= ?";
        query += " AND peTab.pe_bcs = ? AND peTab.pe_gender = ?";
        params = [pet.pe_b_id, pet.pe_birth - 10000, pet.pe_birth + 10000, pet.pe_bcs, pet.pe_gender];
        [result, fields] = await pool.query(query, params);

        // 유사견들이 해당 제품에 남긴 리뷰 가져오기
        if (result.length > 0) {
            query = "SELECT * FROM t_product_reviews WHERE pr_p_id = ? AND pr_pe_id IN (";
            params = [pId];
            for (let i = 0; i < result.length; i++) {
                if (i > 0) query += " ,";
                query += " ?";
                params.push(result[i].pe_id);
            }
            query += " )";
            [result, fields] = await pool.query(query, params);

            similarCnt = result.length;

            // 가져온 리뷰들 계산해서 평균점수 내기
            for (let i = 0; i < result.length; i++) {
                similarTotalScore += result[i].pr_avg_score;
                similarPalaScore += result[i].pr_pala_score;
                similarBeneScore += result[i].pr_bene_score;
                similarCostScore += result[i].pr_cost_score;
                similarSideCnt += (result[i].pr_side == 'Y') ? 1 : 0;
            }
        }

        query = "SET SESSION group_concat_max_len = 65535";
        await pool.query(query);

        // 전체 리뷰들 가져오기
        query = "SELECT *,";
        query += " IFNULL((SELECT GROUP_CONCAT(i_path SEPARATOR '|') FROM t_images WHERE i_data_type LIKE 'review' AND i_target_id = prTab.pr_id), '') AS images";
        query += " FROM t_product_reviews AS prTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = prTab.pr_u_id";
        query += " JOIN t_pets AS peTab ON peTab.pe_id = prTab.pr_pe_id";
        query += " JOIN t_breeds AS bTab ON bTab.b_id = peTab.pe_b_id";
        query += " WHERE prTab.pr_p_id = ?";
        params = [pId];
        [result, fields] = await pool.query(query, params);

        let productReviewList = result;

        cnt = productReviewList.length;

        // 전체 리뷰들 계산해서 평균점수 내기
        for (let i = 0; i < productReviewList.length; i++) {
            totalScore += productReviewList[i].pr_avg_score;
            palaScore += productReviewList[i].pr_pala_score;
            beneScore += productReviewList[i].pr_bene_score;
            costScore += productReviewList[i].pr_cost_score;
            sideCnt += (productReviewList[i].pr_side == 'Y') ? 1 : 0;
        }

        res.json({ status: 'OK', result: {
            productReviewList: productReviewList,

            // similarTotalScore: nanTo(parseFloat((similarTotalScore / similarCnt).toFixed(1)), 0),
            // similarPalaScore: nanTo(parseFloat((similarPalaScore / similarCnt).toFixed(1)), 0),
            // similarBeneScore: nanTo(parseFloat((similarBeneScore / similarCnt).toFixed(1)), 0),
            // similarCostScore: nanTo(parseFloat((similarCostScore / similarCnt).toFixed(1)), 0),
            // similarSidePer: nanTo(parseInt((similarSideCnt / similarCnt) * 100), 0),

            // totalScore: nanTo(parseFloat((totalScore / cnt).toFixed(1)), 0),
            // palaScore: nanTo(parseFloat((palaScore / cnt).toFixed(1)), 0),
            // beneScore: nanTo(parseFloat((beneScore / cnt).toFixed(1)), 0),
            // costScore: nanTo(parseFloat((costScore / cnt).toFixed(1)), 0),
            // sidePer: nanTo(parseInt((sideCnt / cnt) * 100), 0)

            similarTotalScore: nanTo(similarTotalScore / similarCnt, 0),
            similarPalaScore: nanTo(similarPalaScore / similarCnt, 0),
            similarBeneScore: nanTo(similarBeneScore / similarCnt, 0),
            similarCostScore: nanTo(similarCostScore / similarCnt, 0),
            similarSidePer: nanTo(parseInt((similarSideCnt / similarCnt) * 100), 0),

            totalScore: nanTo(totalScore / cnt, 0),
            palaScore: nanTo(palaScore / cnt, 0),
            beneScore: nanTo(beneScore / cnt, 0),
            costScore: nanTo(costScore / cnt, 0),
            sidePer: nanTo(parseInt((sideCnt / cnt) * 100), 0)
        }});

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;