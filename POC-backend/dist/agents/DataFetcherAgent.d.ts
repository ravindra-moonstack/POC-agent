import { CustomerProfile } from "../types/customer";
export declare class DataFetcherAgent {
    private linkedInSource;
    private panSource;
    private socialMediaSource;
    constructor();
    fetchCustomerData(customerId: string): Promise<CustomerProfile>;
}
