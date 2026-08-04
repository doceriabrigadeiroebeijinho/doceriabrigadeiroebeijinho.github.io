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

    // Validação de campos obrigatórios
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
        { error: 'Servidor não configurado para envio (URL ausente).' },
        { status: 500 }
      );
    }

    // Envia o pedido diretamente para o Google Apps Script (Planilha)
    const googleResponse = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      }),
    });

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error('Erro na resposta do Google Apps Script:', errorText);
      return NextResponse.json(
        { error: 'Falha ao gravar pedido na planilha.' },
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
