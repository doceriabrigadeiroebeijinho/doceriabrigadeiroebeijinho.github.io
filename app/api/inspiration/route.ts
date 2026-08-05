import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderCode,
      name,
      phone,
      birthDate,
      eventDate,
      eventTime,
      service,
      address,
      items,
      totalCents,
      paymentMethod,
      planPaymentMode,
      planTermsAccepted,
    } = body;

    // 1. Apenas Nome e WhatsApp são obrigatórios
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nome e WhatsApp são obrigatórios.' },
        { status: 400 }
      );
    }

    const generatedOrderCode = orderCode || `BB-${Date.now().toString().slice(-6)}`;

    let scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();

    if (scriptUrl) {
      if (scriptUrl.includes('/edit')) {
        scriptUrl = scriptUrl.split('/edit')[0] + '/exec';
      } else if (!scriptUrl.endsWith('/exec')) {
        scriptUrl = scriptUrl.replace(/\/$/, '') + '/exec';
      }

      // 2. Envia para a planilha em segundo plano (sem fazer o cliente esperar)
      fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          secret: process.env.GOOGLE_APPS_SCRIPT_SECRET,
          orderCode: generatedOrderCode,
          name,
          phone,
          birthDate,
          eventDate,
          eventTime,
          service,
          address,
          items,
          totalCents,
          paymentMethod,
          planPaymentMode,
          planTermsAccepted,
        }),
        redirect: 'follow',
      }).catch((err) => {
        console.error('Erro em segundo plano no Google Script:', err);
      });
    }

    // Retorna o sucesso IMEDIATAMENTE para o site avançar rápido
    return NextResponse.json({ success: true, orderCode: generatedOrderCode });
  } catch (error: any) {
    console.error('Erro na rota de cadastro:', error);
    return NextResponse.json(
      { error: 'Não foi possível processar o cadastro.' },
      { status: 500 }
    );
  }
}
