import { NextRequest, NextResponse } from 'next/server';

const DOMA_SUBGRAPH_URL = process.env.NEXT_PUBLIC_DOMA_SUBGRAPH_URL || 'https://api-testnet.doma.xyz/graphql';
const DOMA_API_KEY = process.env.NEXT_PUBLIC_DOMA_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { query, variables } = await request.json();

    if (!DOMA_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(DOMA_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': DOMA_API_KEY,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch from Doma API', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Doma API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
