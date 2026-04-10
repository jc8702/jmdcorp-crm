export const salesforceService = {
  openCase: async (data: any) => {
     return { success: true, message: 'Simulated case opened' };
  },
  getCircuitStatus: () => {
     return { state: 'CLOSED' };
  }
};
