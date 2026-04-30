const express = require('express');
const router  = express.Router();
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const { createOrder, confirmPayment, getOrder, listOrders } = require('../controllers/OrderController');

router.use(jwtMiddleware);

router.get('/',                    listOrders);
router.post('/',                   createOrder);
router.get('/:id',                 getOrder);
router.post('/:id/confirm-payment', confirmPayment);

module.exports = router;