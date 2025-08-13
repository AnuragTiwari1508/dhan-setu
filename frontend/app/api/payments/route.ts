// Payment creation API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment';
import { createBackendPayment, listBackendPayments, getBackendConfig } from '@/lib/api/backend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { amount, currency, network } = body;
    
    if (!amount || !currency || !network) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, network' },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // If backend configured, proxy to it
    const { baseUrl } = getBackendConfig();
    if (baseUrl) {
      const backendRes = await createBackendPayment({
        amount,
        currency,
        network,
        description: body.description,
        metadata: body.metadata
      });
      return NextResponse.json({
        source: 'backend',
        ...backendRes
      });
    }

    // Fallback: local in-memory implementation
    const payment = await paymentService.createPayment({
      amount,
      currency,
      network,
      description: body.description,
      customerEmail: body.customerEmail,
      redirectUrl: body.redirectUrl,
      webhookUrl: body.webhookUrl,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      metadata: body.metadata
    });

    return NextResponse.json({ source: 'local', ...payment });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    const { baseUrl } = getBackendConfig();
    if (baseUrl) {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());
      if (search) params.set('search', search);
      try {
        const backendList = await listBackendPayments(params);
        return NextResponse.json({ source: 'backend', ...backendList });
      } catch (e) {
        console.error('Backend list fallback to local due to error:', e);
      }
    }

    const payments = search
      ? paymentService.searchPayments(search)
      : paymentService.getPayments(limit, offset);

    return NextResponse.json({
      source: 'local',
      payments,
      pagination: { limit, offset, total: payments.length }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
