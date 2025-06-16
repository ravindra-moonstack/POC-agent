import express from "express";
import { LinkedInDataSource } from "../data_sources/linkedin";
import { Customer } from "../models/Customer";
const router = express.Router();
const linkedIn = new LinkedInDataSource();

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
  } catch (error) {
    console.error("LinkedIn authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;
