// This file provides mock implementations for database functionality
// to avoid issues with the pg module in the browser environment

export interface PoolClient {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
  release: () => void;
}

export class Pool {
  private static storage: Record<string, any[]> = {
    users: [],
    patients: [],
    appointments: [],
    license: [],
    configurations: [],
  };

  async connect(): Promise<void> {
    console.log("Mock database connected");
    return Promise.resolve();
  }

  async end(): Promise<void> {
    console.log("Mock database connection closed");
    return Promise.resolve();
  }

  async query(text: string, params: any[] = []): Promise<{ rows: any[] }> {
    console.log("Mock query:", text, params);

    // Simple query parsing to simulate database operations
    if (text.toLowerCase().includes("select")) {
      const table = this.extractTableName(text);
      return { rows: Pool.storage[table] || [] };
    } else if (text.toLowerCase().includes("insert")) {
      const table = this.extractTableName(text);
      const newItem = { id: Date.now(), ...this.createMockItem(params) };
      Pool.storage[table] = [...(Pool.storage[table] || []), newItem];
      return { rows: [newItem] };
    } else if (text.toLowerCase().includes("update")) {
      const table = this.extractTableName(text);
      // Simplified update logic
      return { rows: Pool.storage[table] || [] };
    } else if (text.toLowerCase().includes("delete")) {
      const table = this.extractTableName(text);
      // Simplified delete logic
      return { rows: [] };
    }

    return { rows: [] };
  }

  async getClient(): Promise<PoolClient> {
    return {
      query: async (text, params) => this.query(text, params),
      release: () => {},
    };
  }

  private extractTableName(query: string): string {
    // Very simplified table name extraction
    const tables = [
      "users",
      "patients",
      "appointments",
      "license",
      "configurations",
    ];
    for (const table of tables) {
      if (query.toLowerCase().includes(table)) {
        return table;
      }
    }
    return "unknown";
  }

  private createMockItem(params: any[]): any {
    // Create a mock item with the parameters
    const mockItem: Record<string, any> = {};
    params.forEach((param, index) => {
      mockItem[`field${index}`] = param;
    });
    return mockItem;
  }
}
