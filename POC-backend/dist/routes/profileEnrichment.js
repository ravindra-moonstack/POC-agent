"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProfileEnrichmentService_1 = require("../services/ProfileEnrichmentService");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const profileEnrichmentService = new ProfileEnrichmentService_1.ProfileEnrichmentService();
// Validation schema for the request body
const customerProfileSchema = zod_1.z.object({
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
router.post("/enrich", async (req, res) => {
    try {
        // Validate request body
        const validatedData = customerProfileSchema.parse(req.body);
        // Enrich the profile with public information
        const enrichedProfile = await profileEnrichmentService.enrichProfile(validatedData);
        res.json({
            success: true,
            data: enrichedProfile,
        });
    }
    catch (error) {
        console.error("Profile enrichment error:", error);
        if (error instanceof zod_1.z.ZodError) {
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
exports.default = router;
//# sourceMappingURL=profileEnrichment.js.map