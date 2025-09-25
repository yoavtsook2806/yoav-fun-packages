import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare const createPlan: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const listPlans: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const assignPlan: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getTrainerPlans: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=plans.d.ts.map