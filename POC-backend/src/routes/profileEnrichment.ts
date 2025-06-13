import { Router } from "express";
import {
  ProfileEnrichmentService,
  BaseCustomerProfile,
} from "../services/ProfileEnrichmentService";
import { z } from "zod";

const router = Router();
const profileEnrichmentService = new ProfileEnrichmentService();

// Validation schema for the request body
const customerProfileSchema = z.object({
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

router.post("/enrich", async (req, res) => {
  console.log("req.body", req.body);
  try {
    // Validate request body
    const validatedData = customerProfileSchema.parse(req.body);

    let linfa = validatedData + " site:linkedin.com";
    const enrichedProfile = await profileEnrichmentService.enrichProfile(
      validatedData
    );

    res.json({
      success: true,
      data: enrichedProfile,
    });
    console.log("first", JSON.stringify(enrichedProfile));
  } catch (error) {
    console.error("Profile enrichment error:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to enrich profile",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
