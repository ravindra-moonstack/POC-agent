import { Router } from "express";
import { Customer } from "../models/Customer";
import { ProfileEnrichmentService } from "../services/profileEnrichment";
import { z } from "zod";
import { Types } from "mongoose";

const router = Router();
const profileEnrichmentService = new ProfileEnrichmentService();

// Validation schema for customer creation/update
const customerSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.string().optional(),
  familyDetails: z
    .object({
      spouse: z.string().optional(),
      children: z.number().optional(),
      dependents: z.number().optional(),
    })
    .optional(),
  companyOwnership: z
    .array(
      z.object({
        companyName: z.string(),
        role: z.string(),
        ownershipPercentage: z.number().optional(),
      })
    )
    .optional(),
});

// Get all customers
router.get("/customers", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
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

    const customers = await Customer.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { "companyOwnership.companyName": { $regex: q, $options: "i" } },
      ],
    });

    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ error: "Failed to search customers" });
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

    const newCustomer = new Customer({
      ...validatedData,
      customerId,
    });

    // Save first to get the _id
    await newCustomer.save();

    // Try to enrich the profile
    try {
      const enrichedProfile = await profileEnrichmentService.enrichProfile({
        _id: newCustomer._id as Types.ObjectId,
        name: newCustomer.name,
        email: newCustomer.email,
        companyOwnership: newCustomer.companyOwnership,
      });

      newCustomer.enrichedProfile = enrichedProfile;
      await newCustomer.save();
    } catch (error) {
      console.error("Profile enrichment failed:", error);
      // Continue without enriched profile
    }

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error("Error creating customer:", error);
    if (error instanceof z.ZodError) {
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
    const customer = await Customer.findOne({
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
        const enrichedProfile = await profileEnrichmentService.enrichProfile({
          _id: customer._id as Types.ObjectId,
          name: customer.name,
          email: customer.email,
          companyOwnership: customer.companyOwnership,
        });
        customer.enrichedProfile = enrichedProfile;
      } catch (error) {
        console.error("Profile re-enrichment failed:", error);
        // Continue with existing enriched profile
      }
    }

    await customer.save();
    res.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid customer data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// Get customer by ID
router.get("/customer/:customerId", async (req, res) => {
  try {
    const customer = await Customer.findOne({
      customerId: req.params.customerId,
    });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    try {
      const enrichedProfile = await profileEnrichmentService.enrichProfile({
        _id: customer._id as Types.ObjectId,
        name: customer.name,
        email: customer.email,
        companyOwnership: customer.companyOwnership,
      });
      customer.enrichedProfile = enrichedProfile;
      await customer.save();
    } catch (error) {
      console.error("Profile enrichment failed during fetch by ID:", error);
      // Proceed without failing the request
    }
    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// Delete customer
router.delete("/customer/:customerId", async (req, res) => {
  try {
    const result = await Customer.deleteOne({
      customerId: req.params.customerId,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// Enrich customer profile
router.post("/profiles/enrich/:customerId", async (req, res) => {
  try {
    const customer = await Customer.findOne({
      customerId: req.params.customerId,
    });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const enrichedProfile = await profileEnrichmentService.enrichProfile({
      _id: customer._id as Types.ObjectId,
      name: customer.name,
      email: customer.email,
      companyOwnership: customer.companyOwnership,
    });
    customer.enrichedProfile = enrichedProfile;
    await customer.save();

    res.json(customer);
  } catch (error) {
    console.error("Error enriching customer profile:", error);
    res.status(500).json({ error: "Failed to enrich customer profile" });
  }
});

export default router;
