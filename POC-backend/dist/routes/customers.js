"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Customer_1 = require("../models/Customer");
const profileEnrichment_1 = require("../services/profileEnrichment");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Validation schema for customer creation/update
const customerSchema = zod_1.z.object({
    name: zod_1.z.string(),
    email: zod_1.z.string().email().optional(),
    dateOfBirth: zod_1.z.string().optional(),
    maritalStatus: zod_1.z.string().optional(),
    familyDetails: zod_1.z
        .object({
        spouse: zod_1.z.string().optional(),
        children: zod_1.z.number().optional(),
        dependents: zod_1.z.number().optional(),
    })
        .optional(),
    companyOwnership: zod_1.z
        .array(zod_1.z.object({
        companyName: zod_1.z.string(),
        role: zod_1.z.string(),
        ownershipPercentage: zod_1.z.number().optional(),
    }))
        .optional(),
});
// Get all customers
router.get("/customers", async (req, res) => {
    try {
        const customers = await Customer_1.Customer.find();
        res.json(customers);
    }
    catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: "Failed to fetch customers" });
    }
});
// Search customers
router.get("/customers/search", async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== "string") {
            return res.status(400).json({ error: "Search query is required" });
        }
        const customers = await Customer_1.Customer.find({
            $or: [
                { name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
                { "companyOwnership.companyName": { $regex: q, $options: "i" } },
            ],
        });
        res.json(customers);
    }
    catch (error) {
        console.error("Error searching customers:", error);
        res.status(500).json({ error: "Failed to search customers" });
    }
});
// Get customer by ID
router.get("/customer/:customerId", async (req, res) => {
    try {
        const customer = await Customer_1.Customer.findOne({
            customerId: req.params.customerId,
        });
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.json(customer);
    }
    catch (error) {
        console.error("Error fetching customer:", error);
        res.status(500).json({ error: "Failed to fetch customer" });
    }
});
// Create new customer
router.post("/customer", async (req, res) => {
    try {
        const validatedData = customerSchema.parse(req.body);
        // Generate a unique customer ID
        const customerId = `CUST${Math.floor(Math.random() * 1000000)
            .toString()
            .padStart(6, "0")}`;
        const newCustomer = new Customer_1.Customer({
            ...validatedData,
            customerId,
        });
        // Save first to get the _id
        await newCustomer.save();
        // Try to enrich the profile
        try {
            const { enrichedProfile } = await profileEnrichment_1.profileEnrichmentService.enrichCustomerProfile({
                _id: newCustomer._id,
                name: newCustomer.name,
                email: newCustomer.email,
                companyOwnership: newCustomer.companyOwnership,
            });
            newCustomer.enrichedProfile = enrichedProfile;
            await newCustomer.save();
        }
        catch (error) {
            console.error("Profile enrichment failed:", error);
            // Continue without enriched profile
        }
        res.status(201).json(newCustomer);
    }
    catch (error) {
        console.error("Error creating customer:", error);
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Invalid customer data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to create customer" });
    }
});
// Update customer
router.put("/customer/:customerId", async (req, res) => {
    try {
        const validatedData = customerSchema.partial().parse(req.body);
        const customer = await Customer_1.Customer.findOne({
            customerId: req.params.customerId,
        });
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        // Update customer data
        Object.assign(customer, validatedData);
        // Try to re-enrich the profile if significant fields changed
        if (validatedData.name || validatedData.companyOwnership) {
            try {
                const { enrichedProfile } = await profileEnrichment_1.profileEnrichmentService.enrichCustomerProfile({
                    _id: customer._id,
                    name: customer.name,
                    email: customer.email,
                    companyOwnership: customer.companyOwnership,
                });
                customer.enrichedProfile = enrichedProfile;
            }
            catch (error) {
                console.error("Profile re-enrichment failed:", error);
                // Continue with existing enriched profile
            }
        }
        await customer.save();
        res.json(customer);
    }
    catch (error) {
        console.error("Error updating customer:", error);
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Invalid customer data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to update customer" });
    }
});
// Delete customer
router.delete("/customer/:customerId", async (req, res) => {
    try {
        const result = await Customer_1.Customer.deleteOne({
            customerId: req.params.customerId,
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting customer:", error);
        res.status(500).json({ error: "Failed to delete customer" });
    }
});
// Enrich customer profile
router.post("/profiles/enrich/:customerId", async (req, res) => {
    try {
        const customer = await Customer_1.Customer.findOne({
            customerId: req.params.customerId,
        });
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        const { enrichedProfile } = await profileEnrichment_1.profileEnrichmentService.enrichCustomerProfile({
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            companyOwnership: customer.companyOwnership,
        });
        customer.enrichedProfile = enrichedProfile;
        await customer.save();
        res.json(customer);
    }
    catch (error) {
        console.error("Error enriching customer profile:", error);
        res.status(500).json({ error: "Failed to enrich customer profile" });
    }
});
exports.default = router;
//# sourceMappingURL=customers.js.map