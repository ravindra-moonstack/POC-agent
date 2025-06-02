import mongoose, { Document, Schema } from "mongoose";
import {
  BaseCustomerProfile,
  EnrichedProfile,
} from "../services/ProfileEnrichmentService";

export interface ICustomer extends Document, BaseCustomerProfile {
  customerId: string;
  enrichedProfile?: EnrichedProfile;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    dateOfBirth: {
      type: String,
      required: false,
    },
    maritalStatus: {
      type: String,
      required: false,
    },
    familyDetails: {
      spouse: String,
      children: Number,
      dependents: Number,
    },
    companyOwnership: [
      {
        companyName: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          required: true,
        },
        ownershipPercentage: Number,
      },
    ],
    enrichedProfile: {
      basicInfo: {
        name: String,
        currentLocation: String,
        profilePictureUrl: String,
        shortBio: String,
      },
      professional: {
        currentRole: {
          title: String,
          company: String,
          startDate: String,
        },
        jobHistory: [
          {
            title: String,
            company: String,
            duration: String,
            location: String,
            description: String,
          },
        ],
        education: [
          {
            institution: String,
            degree: String,
            field: String,
            year: String,
          },
        ],
        skills: [String],
        achievements: [
          {
            title: String,
            date: String,
            description: String,
          },
        ],
      },
      social: {
        linkedIn: {
          url: String,
          followers: Number,
          engagement: String,
        },
        twitter: {
          handle: String,
          url: String,
          followers: Number,
          bio: String,
        },
        github: {
          username: String,
          url: String,
          repositories: Number,
          mainLanguages: [String],
        },
        other: [
          {
            platform: String,
            url: String,
            username: String,
          },
        ],
      },
      mediaPresence: {
        newsArticles: [
          {
            title: String,
            source: String,
            date: String,
            url: String,
            snippet: String,
          },
        ],
        interviews: [
          {
            title: String,
            platform: String,
            date: String,
            url: String,
          },
        ],
        publications: [
          {
            title: String,
            platform: String,
            date: String,
            url: String,
            type: String,
          },
        ],
      },
      interests: {
        topics: [String],
        hobbies: [String],
        publicActivities: [
          {
            type: String,
            description: String,
            source: String,
          },
        ],
      },
      companies: [
        {
          name: String,
          role: String,
          foundingDate: String,
          industry: String,
          size: String,
          location: String,
          description: String,
          publicInfo: {
            website: String,
            linkedIn: String,
            funding: [
              {
                round: String,
                amount: String,
                date: String,
                investors: [String],
              },
            ],
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.model<ICustomer>("Customer", CustomerSchema);

// // Sample customers data for seeding
// export const sampleCustomers = [
//   {
//     customerId: "CUST006",
//     name: "Elon Musk",
//     email: "elon.musk@x.com",
//     dateOfBirth: "1971-06-28",
//     maritalStatus: "Divorced",
//     familyDetails: {
//       spouse: "Justine Musk  ",
//       children: 10,
//     },
//     companyOwnership: [
//       {
//         companyName: "SpaceX",
//         role: "Founder & CEO",
//         ownershipPercentage: 42,
//       },
//       {
//         companyName: "Tesla, Inc.",
//         role: "CEO",
//         ownershipPercentage: 13,
//       },
//     ],
//   },
//   {
//     customerId: "CUST007",
//     name: "Whitney Wolfe Herd",
//     email: "whitney.wolfe@bumble.com",
//     dateOfBirth: "1989-07-01",
//     maritalStatus: "Married",
//     familyDetails: {
//       spouse: "Michael Herd",
//       children: 1,
//     },
//     companyOwnership: [
//       {
//         companyName: "Bumble Inc.",
//         role: "Founder & CEO",
//         ownershipPercentage: 11.6,
//       },
//     ],
//   },
//   {
//     customerId: "CUST008",
//     name: "Brian Chesky",
//     email: "brian.chesky@airbnb.com",
//     dateOfBirth: "1981-08-29",
//     maritalStatus: "Single",
//     companyOwnership: [
//       {
//         companyName: "Airbnb, Inc.",
//         role: "Co-Founder & CEO",
//         ownershipPercentage: 14.6,
//       },
//     ],
//   },
//   {
//     customerId: "CUST009",
//     name: "Ritesh Agarwal",
//     email: "ritesh.agarwal@oyorooms.com",
//     dateOfBirth: "1993-11-16",
//     maritalStatus: "Married",
//     familyDetails: {
//       spouse: "Geetansha Sood",
//       children: 0,
//     },
//     companyOwnership: [
//       {
//         companyName: "OYO Rooms",
//         role: "Founder & CEO",
//         ownershipPercentage: 33,
//       },
//     ],
//   },
//   {
//     customerId: "CUST010",
//     name: "Anne Wojcicki",
//     email: "anne.w@23andme.com",
//     dateOfBirth: "1973-07-28",
//     maritalStatus: "Divorced",
//     familyDetails: {
//       spouse: "Sergey Brin ",
//       children: 2,
//     },
//     companyOwnership: [
//       {
//         companyName: "23andMe, Inc.",
//         role: "Co-Founder & CEO",
//         ownershipPercentage: 19,
//       },
//     ],
//   },
// ];
