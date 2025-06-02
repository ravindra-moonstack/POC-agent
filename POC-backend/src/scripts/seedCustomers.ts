// import mongoose from "mongoose";
// import { config } from "../config/env";
// import { Customer, sampleCustomers } from "../models/Customer";
// import { ProfileEnrichmentService } from "../services/ProfileEnrichmentService";

// async function seedCustomers() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(config.DATABASE_URL);
//     console.log("Connected to MongoDB");

//     // Clear existing customers
//     // await Customer.deleteMany({});
//     console.log("Cleared existing customers");

//     // Create ProfileEnrichmentService instance
//     const enrichmentService = new ProfileEnrichmentService();

//     // Insert customers with enriched profiles
//     for (const customer of sampleCustomers) {
//       try {
//         // Try to enrich the profile
//         const enrichedProfile = await enrichmentService.enrichProfile(customer);

//         // Create new customer with enriched profile
//         const newCustomer = new Customer({
//           ...customer,
//           enrichedProfile,
//         });

//         await newCustomer.save();
//         console.log(`Added customer: ${customer.name}`);
//       } catch (error) {
//         // If enrichment fails, add customer without enriched profile
//         const newCustomer = new Customer(customer);
//         await newCustomer.save();
//         console.log(`Added customer without enrichment: ${customer.name}`);
//       }
//     }
//     console.log("Successfully seeded customers");
//     process.exit(0);
//   } catch (error) {
//     console.error("Error seeding customers:", error);
//     process.exit(1);
//   }
// }

// // Run the seeding
// seedCustomers();
