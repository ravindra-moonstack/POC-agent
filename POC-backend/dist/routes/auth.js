"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const linkedin_1 = require("../data_sources/linkedin");
const router = express_1.default.Router();
const linkedIn = new linkedin_1.LinkedInDataSource();
// Initiate LinkedIn OAuth flow
router.get("/linkedin", (_, res) => {
    const authUrl = linkedIn.getAuthorizationUrl();
    res.redirect(authUrl);
});
// LinkedIn OAuth callback
router.get("/linkedin/callback", async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== "string") {
            throw new Error("Authorization code is required");
        }
        // Get access token
        const accessToken = await linkedIn.getAccessToken(code);
        // Fetch profile data
        const profile = await linkedIn.fetchProfile(accessToken);
        // Store the profile data in the database
        // const customer = new Customer({
        //   name: profile.name,
        //   email: profile.email,
        //   customerId: profile.id,
        //   companyOwnership: [],
        //   enrichedProfile: {
        //     basicInfo: {
        //       name: profile.name,
        //       shortBio: profile.summary,
        //     },
        //     professional: {
        //       jobHistory: [],
        //       education: [],
        //     },
        //     social: {
        //       linkedIn: {
        //         url: profile.profileUrl,
        //       },
        //     },
        //     mediaPresence: {},
        //     interests: {},
        //   },
        // });
        // await customer.save();
        res.json(profile);
    }
    catch (error) {
        console.error("LinkedIn authentication error:", error);
        res.status(500).json({ error: "Authentication failed" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map