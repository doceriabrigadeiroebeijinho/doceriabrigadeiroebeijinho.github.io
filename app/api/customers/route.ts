import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderCode,
      name,
      phone,
      email,
      cpf,
      birthDate,
      eventDate,
      eventTime,
      service,
      address,
      items,
      totalCents,
      paymentMethod,
      inspirationKey,
      planPaymentMode,
      planTermsAccepted,
    } = body;

    // Valida apenas os campos obrigatórios
    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: 'Nome, WhatsApp e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    const formattedCpf = cpf && cpf.trim() !== '' ? cpf.trim() : null;
    const generatedOrderCode = orderCode || `BB-${Date.now().toString().slice(-6)}`;

    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

    if (!scriptUrl) {
      console.error('GOOGLE_APPS_SCRIPT_URL não configurada.');
      return NextResponse.json(
        { error: 'URL da planilha não encontrada nas variáveis da Vercel.' },
        { status: 500 }
      );
    }

    const payload = {
      secret: process.env.GOOGLE_APPS_SCRIPT_SECRET,
      orderCode: generatedOrderCode,
      name,
      phone,
      email,
      cpf: formattedCpf,
      birthDate,
      eventDate,
      eventTime,
      service,
      address,
      items,
      totalCents,
      paymentMethod,
      inspirationKey,
      planPaymentMode,
      planTermsAccepted,
    };

    const bodyString = JSON.stringify(payload);

    // Envia com redirecionamento manual para não perder o método POST no Google Apps Script
    let googleResponse = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyString,
      redirect: 'manual',
    });

    if ([301, 302, 307, 308].includes(googleResponse.status)) {
      const location = googleResponse.headers.get('location');
      if (location) {
        googleResponse = await fetch(location, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: bodyString,
        });
      }
    }

    if (!googleResponse.ok && googleResponse.status !== 302) {
      const errorText = await googleResponse.text();
      console.error('Erro na resposta do Google Apps Script:', errorText);
      return NextResponse.json(
        { error: `Falha na planilha (Status ${googleResponse.status}).` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orderCode: generatedOrderCode });
  } catch (error: any) {
    console.error('Erro ao salvar cliente/pedido:', error);
    return NextResponse.json(
      { error: `Erro no servidor: ${error?.message || String(error)}` },
      { status: 500 }
    );
  }
}
