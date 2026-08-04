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
    const db = getDb();

    await db.insert(customerOrders).values({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      orderCode: orderCode || `BB-${Date.now().toString().slice(-6)}`,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar cliente/pedido:', error);
    return NextResponse.json(
      { error: 'Não foi possível salvar o cadastro agora.' },
      { status: 500 }
    );
  }
}