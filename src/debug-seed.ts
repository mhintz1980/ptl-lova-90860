// Quick debug module to verify seed function
import { seed } from "./lib/seed";

// Extend Window interface to include our debug function
declare global {
  interface Window {
    debugSeed: typeof debugSeed;
  }
}

// Export a function to check seed data from browser console
export function debugSeed() {
  console.log('🔍 PumpTracker Seed Debug');
  console.log('==========================');

  try {
    const pumps = seed(5); // Generate 5 pumps for testing
    console.log(`✅ Generated ${pumps.length} pumps`);

    pumps.forEach((pump, index) => {
      console.log(`\n🏭 Pump ${index + 1}:`);
      console.log(`   ID: ${pump.id}`);
      console.log(`   PO: ${pump.po}`);
      console.log(`   Customer: ${pump.customer}`);
      console.log(`   Model: ${pump.model}`);
      console.log(`   Stage: ${pump.stage}`);
      console.log(`   Priority: ${pump.priority}`);
      console.log(`   Serial: ${pump.serial}`);
      console.log(`   Value: $${pump.value.toLocaleString()}`);
      console.log(`   Last Update: ${pump.last_update}`);

      // Show BOM details if available
      if ('engine_model' in pump) {
        const extendedPump = pump as typeof pumps[0] & {
          engine_model?: string | null;
          gearbox_model?: string | null;
          control_panel_model?: string | null;
          description?: string;
          total_lead_days?: number;
        };
        console.log(`   Engine: ${extendedPump.engine_model}`);
        console.log(`   Gearbox: ${extendedPump.gearbox_model}`);
        console.log(`   Control Panel: ${extendedPump.control_panel_model}`);
      }
    });

    // Summary statistics
    const stages = [...new Set(pumps.map(p => p.stage))];
    const models = [...new Set(pumps.map(p => p.model))];
    const customers = [...new Set(pumps.map(p => p.customer))];

    console.log('\n📊 Summary:');
    console.log(`   Stages: ${stages.join(', ')}`);
    console.log(`   Models: ${models.join(', ')}`);
    console.log(`   Customers: ${customers.join(', ')}`);

    return pumps;
  } catch (error) {
    console.error('❌ Error generating seed data:', error);
    return null;
  }
}

// Auto-run debug in development
if (typeof window !== 'undefined') {
  window.debugSeed = debugSeed;
  console.log('🔧 Debug function available: window.debugSeed()');
}