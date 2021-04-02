var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


// 제품 검색
router.get('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let tab = req.query.tab; // SIMILAR, OTHER
        let category = req.query.category; // ALL FEED SUPPLEMENT SNACK
        let filter = req.query.filter; // PALA BENE COST SIDE RCNT BEST

        let peId = req.query.peId;
        let pcId = req.query.pcId;
        let keyword = req.query.keyword;

        if (isNone(pcId)) {
            pcId = 'ALL';
        }
        if (isNone(category)) {
            category = 'ALL';
        }

        let query = "";
        let params = [];
        let [result, fields] = [null, null];

        // 유사견종 산출해둠 > similarPetList
        let similarPetList = [];
        if (tab == 'SIMILAR') {
            query = "SELECT peTab.*,";

            // 대상 펫의 나이대별 그룹 (유사견 산출 위함)
            query += " IFNULL(";
            query += " (SELECT GROUP_CONCAT(CONCAT_WS('~', bagTab.bag_min_age, bagTab.bag_max_age) SEPARATOR '|')";
            query += " FROM t_breed_age_groups AS bagTab";
            query += " WHERE bagTab.bag_b_id = peTab.pe_b_id)";
            query += " , '') AS bags";

            query += " FROM t_pets AS peTab WHERE peTab.pe_id = ?";
            params = [peId];
            [result, fields] = await pool.query(query, params);

            if (result.length == 0) {
                res.json({ status: 'ERR_NO_PET' });
                return;
            }

            let pet = result[0];

            let bagList = (pet.bags == '') ? [] : pet.bags.split('|'); // 나이대 그룹

            let birth = pet.pe_birth.toString();
            let birthYear = birth.substring(0, 4);
            let birthMonth = birth.substring(4, 6);
            let birthDay = birth.substring(6, 8);

            let todayDate = new Date();
            let birthDate = new Date(parseInt(birthYear), parseInt(birthMonth), parseInt(birthDay));

            let diff = todayDate - birthDate;
            let _month = 24 * 60 * 60 * 1000 * 30;

            let monthAge = parseInt(diff / _month) + 1;
            let yearAge = monthAge / 12;
            let rangeMinAge = 0;
            let rangeMaxAge = 99;

            for (let i = 0; i < bagList.length; i++) {
                let ages = bagList[i].split('~');
                let minAge = ages[0];
                let maxAge = ages[1];
                if (minAge <= yearAge && yearAge <= maxAge) {
                    rangeMinAge = parseInt(minAge);
                    rangeMaxAge = parseInt(maxAge);
                    break;
                }
            }

            let todayYear = todayDate.getFullYear();
            let bagMinYear = todayYear + rangeMinAge;
            let bagMaxYear = todayYear - rangeMaxAge;

            // 유사견 > 견종, 출생일 +- 1년, 신체지수, 성별
            query = "SELECT * FROM t_pets AS peTab";
            query += " WHERE peTab.pe_b_id = ? AND peTab.pe_birth >= ? AND peTab.pe_birth <= ?";
            query += " AND peTab.pe_bcs = ? AND peTab.pe_gender = ?";
            params = [pet.pe_b_id, bagMaxYear * 10000, bagMinYear * 10000, pet.pe_bcs, pet.pe_gender];
            [result, fields] = await pool.query(query, params);

            similarPetList = result;
        }

        query = "SET SESSION group_concat_max_len = 65535";
        await pool.query(query);

        params = [];

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

        if (tab == 'SIMILAR') {
            // 유사견 스코어
            if (similarPetList.length > 0) {
                // 리뷰 개수
                query += " , (SELECT COUNT(*) FROM t_product_reviews WHERE pr_p_id = pTab.p_id AND pr_pe_id IN (";
                for (let i = 0; i < similarPetList.length; i++) {
                    if (i > 0) query += " ,";
                    query += " ?";
                    params.push(similarPetList[i].pe_id);
                }
                query += " )) AS reviewCnt,";

                // 기호성 평균
                query += " IFNULL((SELECT AVG(pr_pala_score) FROM t_product_reviews WHERE pr_p_id = pTab.p_id AND pr_pe_id IN (";
                for (let i = 0; i < similarPetList.length; i++) {
                    if (i > 0) query += " ,";
                    query += " ?";
                    params.push(similarPetList[i].pe_id);
                }
                query += " )), 0) AS palaScore,";

                // 기대효과 평균
                query += " IFNULL((SELECT AVG(pr_bene_score) FROM t_product_reviews WHERE pr_p_id = pTab.p_id AND pr_pe_id IN (";
                for (let i = 0; i < similarPetList.length; i++) {
                    if (i > 0) query += " ,";
                    query += " ?";
                    params.push(similarPetList[i].pe_id);
                }
                query += " )), 0) AS beneScore,";

                // 가성비 평균
                query += " IFNULL((SELECT AVG(pr_cost_score) FROM t_product_reviews WHERE pr_p_id = pTab.p_id AND pr_pe_id IN (";
                for (let i = 0; i < similarPetList.length; i++) {
                    if (i > 0) query += " ,";
                    query += " ?";
                    params.push(similarPetList[i].pe_id);
                }
                query += " )), 0) AS costScore,";

                // 부작용 개수
                query += " IFNULL((SELECT COUNT(*) FROM t_product_reviews WHERE pr_p_id = pTab.p_id AND pr_side LIKE 'Y' AND pr_pe_id IN (";
                for (let i = 0; i < similarPetList.length; i++) {
                    if (i > 0) query += " ,";
                    query += " ?";
                    params.push(similarPetList[i].pe_id);
                }
                query += " )), 0) AS sideCnt";

            } else {
                // 유사견이 없음 (친구가 없음) > reviewCnt: 0
            }

        } else {
            // 전체 스코어
            query += " , (SELECT COUNT(*) FROM t_product_reviews WHERE pr_p_id = pTab.p_id) AS reviewCnt,";
            query += " IFNULL((SELECT AVG(pr_pala_score) FROM t_product_reviews WHERE pr_p_id = pTab.p_id), 0) AS palaScore,";
            query += " IFNULL((SELECT AVG(pr_bene_score) FROM t_product_reviews WHERE pr_p_id = pTab.p_id), 0) AS beneScore,";
            query += " IFNULL((SELECT AVG(pr_cost_score) FROM t_product_reviews WHERE pr_p_id = pTab.p_id), 0) AS costScore,";
            query += " (SELECT COUNT(*) FROM t_product_reviews WHERE pr_p_id = pTab.p_id AND pr_side LIKE 'Y') AS sideCnt";
        }

        query += " FROM t_products AS pTab";

        query += " JOIN t_product_brands AS pbTab ON pbTab.pb_id = pTab.p_pb_id";

        query += " LEFT JOIN t_feed_nutrients AS fnTab ON fnTab.fn_p_id = pTab.p_id";

        query += " WHERE 1 = 1";

        if (pcId != 'ALL') {
            query += " AND pTab.p_pc_id = ?";
            params.push(pcId);
        }

        if (!isNone(keyword)) {
            query += " AND pTab.p_keyword LIKE ?";
            params.push(`%${keyword}%`);
        }

        if (category != 'ALL') {
            if (category == 'FEED') {
                query += " AND pTab.p_pc_id = 1";
            } else if (category == 'SNACK') {
                query += " AND pTab.p_pc_id = 2";
            } else {
                query += " AND pTab.p_pc_id = 3";
            }
        }

        if (filter == 'PALA') {
            query += " ORDER BY palaScore DESC";
        } else if (filter == 'BENE') {
            query += " ORDER BY beneScore DESC";
        } else if (filter == 'COST') {
            query += " ORDER BY costScore DESC";
        } else if (filter == 'SIDE') {
            query += " ORDER BY sideCnt ASC";
        } else if (filter == 'RCNT') {
            query += " ORDER BY pTab.p_created_date DESC";
        } else { // BEST
            query += " ORDER BY (reviewCnt + palaScore + beneScore + costScore - sideCnt) DESC";
        }

        // 이 시점에서 카테고리로 제품 목록은 가져왔음
        [result, fields] = await pool.query(query, params);

        let productList = result;

        res.json({ status: 'OK', result: productList });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;
