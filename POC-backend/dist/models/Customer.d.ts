import mongoose, { Document } from "mongoose";
import { BaseCustomerProfile, EnrichedProfile } from "../services/ProfileEnrichmentService";
export interface ICustomer extends Document, BaseCustomerProfile {
    customerId: string;
    enrichedProfile?: EnrichedProfile;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Customer: mongoose.Model<ICustomer, {}, {}, {}, mongoose.Document<unknown, {}, ICustomer, {}> & ICustomer & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export declare const sampleCustomers: ({
    customerId: string;
    name: string;
    email: string;
    dateOfBirth: string;
    maritalStatus: string;
    familyDetails: {
        spouse: string;
        children: number;
    };
    companyOwnership: {
        companyName: string;
        role: string;
        ownershipPercentage: number;
    }[];
} | {
    customerId: string;
    name: string;
    email: string;
    dateOfBirth: string;
    maritalStatus: string;
    companyOwnership: {
        companyName: string;
        role: string;
        ownershipPercentage: number;
    }[];
    familyDetails?: undefined;
})[];
