import { ObjectId } from "mongodb";
export interface Investment {
    _id: ObjectId;
    date: Date;
    type: string;
    amount: number;
    details: {
        returns?: number;
        sector?: string;
    };
}
