import { Response } from 'express';
import { ProtectedRequest } from '../middleware/authMiddleware'; // To access req.user
import Customer, { ICustomer } from '../models/Customer';
import { validationResult, matchedData } from 'express-validator';

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private (e.g., Sales, Manager, Admin)
export const createCustomer = async (req: ProtectedRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { 
    name, email, phone, company, address, status, source, tags, notes, assignedTo,
    // Enhanced fields
    industry, companySize, budget, priority, leadScore, region, timezone, 
    preferredContactMethod, decisionMaker, painPoints, interests, competitors, 
    referredBy, socialProfiles, customFields
  } = matchedData(req);
  const createdBy = req.user?.id; // Get from logged-in user

  if (!createdBy) {
    res.status(400).json({ message: 'User ID not found, cannot create customer.'});
    return;
  }

  try {
    const newCustomer = await Customer.create({
      name,
      email,
      phone,
      company,
      address,
      status: status || 'lead',
      source,
      tags,
      notes,
      assignedTo, // Can be null
      createdBy,
      // Enhanced fields
      industry,
      companySize,
      budget,
      priority,
      leadScore,
      region,
      timezone,
      preferredContactMethod,
      decisionMaker,
      painPoints,
      interests,
      competitors,
      referredBy,
      socialProfiles,
      customFields,
    });
    res.status(201).json({ success: true, data: newCustomer });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    if (error.code === 11000) { // Duplicate key error (e.g. if email is unique and already exists)
        res.status(409).json({ message: 'Customer with this email or other unique field already exists.', details: error.keyValue });
    } else {
        res.status(500).json({ message: 'Server error while creating customer.', details: error.message });
    }
  }
};

// @desc    Get all customers (with pagination, filtering, sorting)
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req: ProtectedRequest, res: Response): Promise<void> => {
  try {
    // Get all customers with pagination and filtering support
    const { page = 1, limit = 50, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const customers = await Customer.find(filter)
        .populate('assignedTo', 'username firstName lastName email')
        .populate('createdBy', 'username firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit));
        
    const total = await Customer.countDocuments(filter);
    
    res.status(200).json({ 
        success: true, 
        count: customers.length,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: customers 
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error while fetching customers.' });
  }
};

// @desc    Get a single customer by ID
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req: ProtectedRequest, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id)
        .populate('assignedTo', 'username firstName lastName email')
        .populate('createdBy', 'username firstName lastName');

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error: any) {
    console.error('Error fetching customer by ID:', error);
    if (error.kind === 'ObjectId') {
        res.status(404).json({ message: 'Customer not found (invalid ID format)' });
        return;
    }
    res.status(500).json({ message: 'Server error while fetching customer.' });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req: ProtectedRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    // TODO: Add authorization: check if user is admin, manager or assignedTo this customer
    // if (req.user?.role !== 'admin' && req.user?.role !== 'manager' && customer.assignedTo?.toString() !== req.user?.id && customer.createdBy.toString() !== req.user?.id) {
    //   res.status(403).json({ message: 'User not authorized to update this customer' });
    //   return;
    // }

    const updatedData = matchedData(req, { includeOptionals: false });

    // Prevent createdBy from being updated
    delete updatedData.createdBy;
    
    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true })
        .populate('assignedTo', 'username firstName lastName email')
        .populate('createdBy', 'username firstName lastName');

    res.status(200).json({ success: true, data: updatedCustomer });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    if (error.kind === 'ObjectId') {
        res.status(404).json({ message: 'Customer not found (invalid ID format)' });
    } else if (error.code === 11000) {
        res.status(409).json({ message: 'Update failed due to duplicate key.', details: error.keyValue });
    } else {
        res.status(500).json({ message: 'Server error while updating customer.', details: error.message });
    }
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private (e.g., Admin, Manager)
export const deleteCustomer = async (req: ProtectedRequest, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    // TODO: Add authorization: check if user is admin or manager
    // if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
    //   res.status(403).json({ message: 'User not authorized to delete this customer' });
    //   return;
    // }

    await customer.deleteOne(); // Uses Mongoose v6+ deleteOne() instance method
    res.status(200).json({ success: true, message: 'Customer removed successfully' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    if (error.kind === 'ObjectId') {
        res.status(404).json({ message: 'Customer not found (invalid ID format)' });
        return;
    }
    res.status(500).json({ message: 'Server error while deleting customer.' });
  }
}; 