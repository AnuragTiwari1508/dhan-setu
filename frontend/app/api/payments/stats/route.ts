// Payment statistics API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment';
import { backendPaymentStats, getBackendConfig } from '@/lib/api/backend';

export async function GET(request: NextRequest) {
  try {
    const { baseUrl } = getBackendConfig();
    if (baseUrl) {
      try {
        const backendStats = await backendPaymentStats();
        return NextResponse.json({ source: 'backend', ...backendStats });
      } catch (e) {
        console.error('Backend stats error, falling back to local:', e);
      }
    }
    const stats = paymentService.getPaymentStats();
    return NextResponse.json({ source: 'local', ...stats });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
