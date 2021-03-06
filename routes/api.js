var express = require('express');
var router = express.Router();


// GET
router.use('/get/breeds', require('./api/get_breeds.js'));
router.use('/get/inoculations', require('./api/get_inoculations.js'));
router.use('/get/feeds', require('./api/get_feeds.js'));
router.use('/get/products', require('./api/get_products.js'));
router.use('/get/diseases', require('./api/get_diseases.js'));
router.use('/get/food/categories', require('./api/get_food_categories.js'));
router.use('/get/pet', require('./api/get_pet.js'));
router.use('/get/pet/ingredient', require('./api/get_pet_ingredient.js'));
router.use('/get/product/ingredient', require('./api/get_product_ingredient.js'));
router.use('/get/product/review', require('./api/get_product_review.js'));
router.use('/get/notices', require('./api/get_notices.js'));
router.use('/get/symptoms', require('./api/get_symptoms.js'));
router.use('/get/foods', require('./api/get_foods.js'));
router.use('/get/food/detail', require('./api/get_food_detail.js'));
router.use('/get/disease/detail', require('./api/get_disease_detail.js'));
router.use('/get/symptom/detail', require('./api/get_symptom_detail.js'));
router.use('/get/pet/inoculations', require('./api/get_pet_inoculations.js'));
router.use('/get/pet/products', require('./api/get_pet_products.js'));
router.use('/get/pet/diseases', require('./api/get_pet_diseases.js'));
router.use('/get/pet/food/categories2', require('./api/get_pet_food_categories2.js'));
router.use('/get/questions', require('./api/get_questions.js'));
router.use('/get/user/reviews', require('./api/get_user_reviews.js'));
router.use('/get/product', require('./api/get_product.js'));
router.use('/get/breed/characters', require('./api/get_breed_characters.js'));


// POST
router.use('/join', require('./api/join.js'));
router.use('/login', require('./api/login.js'));
router.use('/logout', require('./api/logout.js'));
router.use('/save/pet', require('./api/save_pet.js'));
router.use('/add/review', require('./api/add_review.js'));
router.use('/leave', require('./api/leave.js'));
router.use('/add/question', require('./api/add_question.js'));
router.use('/edit/pet', require('./api/edit_pet.js'));
router.use('/remove/question', require('./api/remove_question.js'));
router.use('/remove/review', require('./api/remove_review.js'));


// POST - FILE
router.use('/upload/image', require('./api/upload_image.js'));


module.exports = router;
