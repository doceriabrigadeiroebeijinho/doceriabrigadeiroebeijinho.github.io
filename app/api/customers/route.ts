import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { customerOrders } from '@/db/schema';

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

    // CPF opcional: se vier vazio ou com espaços, salva como null
    const formattedCpf = cpf && cpf.trim() !== '' ? cpf.trim() : null;
    const generatedOrderCode = orderCode || `BB-${Date.now().toString().slice(-6)}`;

    // 1. Tenta salvar no Banco Cloudflare D1 (sem derrubar a Vercel caso falhar)
    try {
      const db = getDb();
      await db.insert(customerOrders).values({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        orderCode: generatedOrderCode,
        name,
        phone,
        email: email || null,
        cpf: formattedCpf,
        birthDate: birthDate || null,
        eventDate: eventDate || '',
        eventTime: eventTime || '',
        service: service || 'Retirada',
        address: address || null,
        itemsJson: JSON.stringify(items || []),
        totalCents: totalCents || 0,
        paymentMethod: paymentMethod || 'Pix',
        inspirationKey: inspirationKey || null,
        planPaymentMode: planPaymentMode || null,
        planTermsAccepted: Boolean(planTermsAccepted),
        source: 'site',
      });
    } catch (dbError) {
      console.warn('Banco D1 não disponível neste ambiente (Vercel):', dbError);
    }

    // 2. Envia para a Planilha do Google Apps Script
    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (scriptUrl) {
      try {
        await fetch(scriptUrl, {
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
      } catch (scriptError) {
        console.error('Erro ao enviar dados para o Google Apps Script:', scriptError);
      }
    }

    return NextResponse.json({ success: true, orderCode: generatedOrderCode });
  } catch (error) {
    console.error('Erro ao salvar cliente/pedido:', error);
    return NextResponse.json(
      { error: 'Não foi possível salvar o cadastro agora.' },
      { status: 500 }
    );
  }
}
