import express from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController';
import { protect, authorize } from '../middleware/authMiddleware';
import { 
    createCustomerRules, 
    updateCustomerRules, 
    customerIdParamRules 
} from '../utils/validationRules';

const router = express.Router();

// All routes below are protected
router.use(protect);

router.route('/')
  .post(createCustomerRules, createCustomer)
  .get(getCustomers);

router.route('/:id')
  .get(customerIdParamRules, getCustomerById)
  .put(authorize('admin', 'manager', 'sales'), customerIdParamRules, updateCustomerRules, updateCustomer)
  .delete(authorize('admin', 'manager', 'sales'), customerIdParamRules, deleteCustomer);

export default router; 