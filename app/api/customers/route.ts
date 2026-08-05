import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderCode,
      name,
      phone,
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

    // Validação dos campos obrigatórios do formulário
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nome e WhatsApp são obrigatórios.' },
        { status: 400 }
      );
    }

const generatedOrderCode = orderCode || `BB-${Date.now().toString().slice(-6)}`;

    let scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();

    // Corrige a URL caso ela não termine com /exec
    if (scriptUrl) {
      if (scriptUrl.includes('/edit')) {
        scriptUrl = scriptUrl.split('/edit')[0] + '/exec';
      } else if (!scriptUrl.endsWith('/exec')) {
        scriptUrl = scriptUrl.replace(/\/$/, '') + '/exec';
      }

      // Envia os dados para a planilha em segundo plano
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            secret: process.env.GOOGLE_APPS_SCRIPT_SECRET,
            orderCode: generatedOrderCode,
            name,
            phone,
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
          redirect: 'follow',
        });
      } catch (scriptError) {
        console.error('Aviso de conexão com o Google Apps Script:', scriptError);
      }
    }

    // Retorna sucesso para o navegador avançar a tela do pedido
    return NextResponse.json({ success: true, orderCode: generatedOrderCode });
  } catch (error: any) {
    console.error('Erro na rota de cadastro:', error);
    return NextResponse.json(
      { error: 'Não foi possível processar o cadastro.' },
      { status: 500 }
    );
  }
}
