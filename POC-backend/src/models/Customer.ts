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
export const sampleCustomers = [
  {
    customerId: "CUST011",
    name: "Satya Nadella",
    email: "satya.nadella@microsoft.com",
    dateOfBirth: "1967-08-19",
    maritalStatus: "Married",
    familyDetails: {
      spouse: "Anupama Nadella",
      children: 3,
    },
    companyOwnership: [
      {
        companyName: "Microsoft Corporation",
        role: "Chairman & CEO",
        ownershipPercentage: 0.02,
      },
    ],
  },
  {
    customerId: "CUST012",
    name: "Shantanu Narayen",
    email: "shantanu@adobe.com",
    dateOfBirth: "1963-05-27",
    maritalStatus: "Married",
    familyDetails: {
      spouse: "Reni Narayen",
      children: 2,
    },
    companyOwnership: [
      {
        companyName: "Adobe Inc.",
        role: "Chairman & CEO",
        ownershipPercentage: 0.06,
      },
    ],
  },
  {
    customerId: "CUST013",
    name: "Susan Wojcicki",
    email: "susan.w@youtube.com",
    dateOfBirth: "1968-07-05",
    maritalStatus: "Married",
    familyDetails: {
      spouse: "Dennis Troper",
      children: 5,
    },
    companyOwnership: [
      {
        companyName: "YouTube (Google)",
        role: "Former CEO",
        ownershipPercentage: 0,
      },
    ],
  },
  {
    customerId: "CUST014",
    name: "Reed Hastings",
    email: "reed.h@netflix.com",
    dateOfBirth: "1960-10-08",
    maritalStatus: "Married",
    familyDetails: {
      spouse: "Patty Quillin",
      children: 2,
    },
    companyOwnership: [
      {
        companyName: "Netflix, Inc.",
        role: "Co-Founder & Executive Chairman",
        ownershipPercentage: 1.9,
      },
    ],
  },
  {
    customerId: "CUST015",
    name: "Lisa Su",
    email: "lisa.su@amd.com",
    dateOfBirth: "1969-11-07",
    maritalStatus: "Married",
    familyDetails: {
      spouse: "Dan",
      children: 0,
    },
    companyOwnership: [
      {
        companyName: "Advanced Micro Devices (AMD)",
        role: "Chair & CEO",
        ownershipPercentage: 0.9,
      },
    ],
  },
];
