
import { RetailTransaction, InventoryItem } from '../lib/types';

export interface FinancialDataExport {
  timestamp: string;
  establishmentId: string;
  transactions: RetailTransaction[];
  inventory: InventoryItem[];
  summary: {
    totalRevenue: number;
    totalCogs: number;
    netProfit: number;
    transactionCount: number;
  };
}

class FinancialIntegrationService {
  /**
   * Generates a standardized financial data payload for third-party systems.
   */
  generateExportPayload(transactions: RetailTransaction[], inventory: InventoryItem[]): FinancialDataExport {
    const totalRevenue = transactions.reduce((acc, curr) => acc + curr.total, 0);
    const totalCogs = transactions.reduce((acc, curr) => {
      return acc + curr.items.reduce((iSum, i) => {
        const inv = inventory.find(inv => inv.name === i.name);
        return iSum + (inv ? inv.originalPrice * i.quantity : (i.priceAtOrder * 0.3 * i.quantity));
      }, 0);
    }, 0);

    const profile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');

    return {
      timestamp: new Date().toISOString(),
      establishmentId: profile.id || 'demo-establishment',
      transactions,
      inventory,
      summary: {
        totalRevenue,
        totalCogs,
        netProfit: totalRevenue - totalCogs,
        transactionCount: transactions.length
      }
    };
  }

  /**
   * Simulates sending data to a third-party financial system (e.g., SAP, Oracle, QuickBooks).
   */
  async pushToThirdParty(_endpoint: string, _apiKey: string, _payload: FinancialDataExport): Promise<{ success: boolean; message: string; referenceId?: string }> {
    console.log(`Vinetelligence: Initiating financial data transfer to ${_endpoint}... (Key: ${_apiKey.slice(0, 5)}..., Payload: ${_payload.summary.totalRevenue})`);
    
    // In a real scenario, this would be a fetch call:
    /*
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    return await response.json();
    */

    // Simulation for demo purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Data successfully synchronized with external financial ledger.",
          referenceId: `EXT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        });
      }, 2000);
    });
  }

  /**
   * Downloads the financial data as a JSON file.
   */
  downloadJsonExport(payload: FinancialDataExport) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `vinetelligence_financial_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}

export const financialIntegrationService = new FinancialIntegrationService();
