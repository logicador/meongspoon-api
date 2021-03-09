var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


// 펫과 관련된 음식, 영양소 정보 가져오기
router.get('', async (req, res) => {
    try {
        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }

        let peId = req.query.peId;

        if (isNone(peId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(peId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SET SESSION group_concat_max_len = 65535";
        let [result, fields] = await pool.query(query);

        query = "SELECT peTab.*,";

        // 대상 펫의 알러지 - 주의성분 산출할거임
        query += " IFNULL(";
        query += " (SELECT GROUP_CONCAT(mpefc2Tab.mpefc2_fc2_id SEPARATOR '|')";
        query += " FROM t_maps_pet_food_category2 AS mpefc2Tab";
        query += " WHERE mpefc2Tab.mpefc2_pe_id = peTab.pe_id)";
        query += " , '') AS mpefc2s,";

        // 대상 펫의 병력 (질병) - 긍정성분 산출 (대상견 기준)
        query += " IFNULL(";
        query += " (SELECT GROUP_CONCAT(mpedTab.mped_d_id SEPARATOR '|')";
        query += " FROM t_maps_pet_disease AS mpedTab";
        query += " WHERE mpedTab.mped_pe_id = peTab.pe_id)";
        query += " , '') AS mpeds";

        query += " FROM t_pets AS peTab WHERE peTab.pe_id = ?";
        let params = [peId];
        [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PET' });
            return;
        }

        let pet = result[0];
        let petFoodCategory2IdList = (pet.mpefc2s == '') ? [] : pet.mpefc2s.split('|'); // 알러지
        let petDiseaseIdList = (pet.mpeds == '') ? [] : pet.mpeds.split('|'); // 병력

        // 유사견 리스트 뽑기 > 취약질병 10순위 뽑기 - 긍정성분 산출 (유사견 기준)
        query = "SELECT *,";

        query += " IFNULL(";
        query += " (SELECT GROUP_CONCAT(mpedTab.mped_d_id SEPARATOR '|')";
        query += " FROM t_maps_pet_disease AS mpedTab";
        query += " WHERE mpedTab.mped_pe_id = peTab.pe_id)";
        query += " , '') AS mpeds";

        query += " FROM t_pets AS peTab";

        // 유사견 > 견종, 출생일 +- 1년, 신체지수, 성별
        query += " WHERE peTab.pe_b_id = ? AND peTab.pe_birth >= ? AND peTab.pe_birth <= ?";
        query += " AND peTab.pe_bcs = ? AND peTab.pe_gender = ?";
        params = [pet.pe_b_id, pet.pe_birth - 10000, pet.pe_birth + 10000, pet.pe_bcs, pet.pe_gender];
        [result, fields] = await pool.query(query, params);

        // 총 유사견 수
        let similarCnt = result.length;

        let diseaseIdList = [];
        for (let i = 0; i < result.length; i++) { diseaseIdList = diseaseIdList.concat((result[i].mpeds == '') ? [] : result[i].mpeds.split('|')); }

        // cnt 뽑아오기 { id: cnt, id: cnt }
        let cntDiseaseIdDict = {};
        diseaseIdList.forEach((x) => { cntDiseaseIdDict[x] = (cntDiseaseIdDict[x] || 0) + 1; });
        // dict to array [ {id: cnt}, {id: cnt} ]
        let cntDiseaseIdList = [];
        for (let key in cntDiseaseIdDict) {
            cntDiseaseIdList.push({
                dId: parseInt(key),
                cnt: cntDiseaseIdDict[key]
            });
        }
        // cnt로 정렬 [ {id: cnt}, {id: cnt} ]
        cntDiseaseIdList.sort((a, b) => { return a.cnt - b.cnt; });
        // 오름차순 뒤집기 [ {id: cnt}, {id: cnt} ]
        cntDiseaseIdList = cntDiseaseIdList.reverse();
        // id만 담기, 5개까지 자르기, 완성된 취약질병 TOP 5 목록
        let orderedDiseaseIdList = [];
        for (let i = 0; i < cntDiseaseIdList.length; i++) {
            if (orderedDiseaseIdList.length == 5) break;
            orderedDiseaseIdList.push(cntDiseaseIdList[i].dId);
        }

        // TODO: 현재 질병쪽에 연관 데이터가 없어서 못함
        // petDiseaseIdList 갖고 t_maps_disease_nutrient_food 조회해서 긍정적 음식 및 영양소
        if (petDiseaseIdList.length > 0) {

        }

        // TODO: 현재 질병쪽에 연관 데이터가 없어서 못함
        // orderedDiseaseIdList 갖고 t_maps_disease_nutrient_food 조회해서 긍정적 음식 및 영양소

        // 취약질병 5개 가져오기
        let weakDiseaseList = [];
        if (orderedDiseaseIdList.length > 0) {
            query = "SELECT dTab.*,";
            query += " IFNULL((SELECT GROUP_CONCAT(sTab.s_name SEPARATOR '|') FROM t_maps_symptom_disease AS msdTab";
            query += " JOIN t_symptoms AS sTab ON sTab.s_id = msdTab.msd_s_id";
            query += " WHERE msdTab.msd_d_id = dTab.d_id";
            query += " ), '') AS symptomNames";
            query += " FROM t_diseases AS dTab WHERE dTab.d_id IN (";
            params = [];
            for (let i = 0; i < orderedDiseaseIdList.length; i++) {
                if (i > 0) query += " ,";
                query += " ?";
                params.push(orderedDiseaseIdList[i]);
            }
            query += " )";
            [result, fields] = await pool.query(query, params);
            weakDiseaseList = result;
        }

        for (let i = 0; i < weakDiseaseList.length; i++) {
            for (let j = 0; j < cntDiseaseIdList.length; j++) {
                if (weakDiseaseList[i].d_id == cntDiseaseIdList[j].dId) {
                    weakDiseaseList[i].cnt = cntDiseaseIdList[j].cnt;
                    break;
                }
            }
        }

        let warningFoodList = []; // 주의 음식
        let warningNutrientList = []; // 주의 영양소
        let goodFoodList = []; // 좋은 음식 (병력 질병 기반)
        let goodNutrientList = []; // 좋은 영양소 (병력 질병 기반)
        let similarGoodFoodList = []; // 유사견 좋은 음식 (취약질병 기반)
        let similarGoodNutrientList = []; // 유사견 좋은 영양소 (취약질병 기반)

        // petFoodCategory2IdList 로부터 주의성분(음식, 영양소) 가져오기
        if (petFoodCategory2IdList.length > 0) {
            query = "SELECT fTab.*,";

            query += " IFNULL(";
            query += " (SELECT GROUP_CONCAT(mfnTab.mfn_n_id SEPARATOR '|')";
            query += " FROM t_maps_food_nutrient AS mfnTab";
            query += " WHERE mfnTab.mfn_f_id = fTab.f_id)";
            query += " , '') AS mfns";

            query += " FROM t_foods AS fTab WHERE fTab.f_fc2_id IN (";
            params = [];
            for (let i = 0; i < petFoodCategory2IdList.length; i++) {
                if (i > 0) query += " ,";
                query += " ?";
                params.push(petFoodCategory2IdList[i]);
            }
            query += " )";
            [result, fields] = await pool.query(query, params);

            // 주의 음식
            warningFoodList = result;

            // 주의 영양소 가져오기
            petNutrientIdList = [];
            query = "SELECT * FROM t_nutrients WHERE n_id IN (";
            params = [];
            for (let i = 0; i < warningFoodList.length; i++) {
                let petNutrientIdList = warningFoodList[i].mfns.split('|');
                for (let j = 0; j < petNutrientIdList.length; j++) {
                    if (params.includes(petNutrientIdList[j])) continue;

                    if (i == 0 && j == 0) query += " ?";
                    else query += " , ?";
                    params.push(petNutrientIdList[j]);
                }
            }
            query += " )";
            if (params.length > 0) {
            [result, fields] = await pool.query(query, params);
            // 주의 영양소
            warningNutrientList = result;
            }
        }

        goodFoodList = warningFoodList;
        goodNutrientList = warningNutrientList;
        similarGoodFoodList = warningFoodList;
        similarGoodNutrientList = warningNutrientList;

        res.json({ status: 'OK', result: {
            warningFoodList: warningFoodList,
            warningNutrientList: warningNutrientList,
            goodFoodList: goodFoodList,
            goodNutrientList: goodNutrientList,
            similarGoodFoodList: similarGoodFoodList,
            similarGoodNutrientList: similarGoodNutrientList,

            similarCnt: similarCnt,
            weakDiseaseList: weakDiseaseList.sort((a, b) => { return a.cnt - b.cnt; }).reverse()
        }});

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;
