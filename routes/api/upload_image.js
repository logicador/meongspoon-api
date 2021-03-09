var express = require('express');
var router = express.Router();
const { isLogined, generateRandomId } = require('../../lib/common');
var formidable = require('formidable');
var sharp = require('sharp');
var fs = require('fs');
var imageSize = require('image-size');


// 이미지 업로드
router.post('', (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }
    
        let form = new formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.uploadDir = 'upload/tmp';
        form.multiples = true;
        form.keepExtensions = true;
    
        let uId = req.session.uId;
    
        form.parse(req, (error, body, files) => {
            if (error) {
                if (fs.existsSync(files.image.path)) {
                    fs.unlinkSync(files.image.path);
                }
                res.json({ status: 'ERR_UPLOAD' });
                return;
            }
    
            let imageName = generateRandomId();
    
            // 이미지 프로세싱
            let imagePath = `public/images/users/${uId}/${imageName}.jpg`;
            let originalImagePath = `public/images/users/${uId}/original/${imageName}.jpg`;
            fs.rename(files.image.path, imagePath, () => {
                fs.copyFile(imagePath, originalImagePath, async () => {
    
                    let originalWidth = imageSize(originalImagePath).width;
                    let rw = 0;
                    while (true) {
                        if (fs.statSync(imagePath).size > 100000) {
                            rw += 2;
                            await sharp(originalImagePath)
                                .resize({ width: parseInt(originalWidth * ((100 - rw) / 100)) })
                                .toFile(imagePath);
                        } else { break; }
                    }
    
                    res.json({ status: 'OK', result: parseInt(imageName) });
                });
            });
        });
        
    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;