# Pedidos, alertas e entrega — Doceria Brigadeiro & Beijinho

Esta integração recebe as solicitações do site e organiza os dados no Google Sheets, Google Agenda e em comandas PDF no Google Drive. O site não envia confirmações automáticas pela API do WhatsApp; o WhatsApp fica como contato opcional e como atalho manual para compartilhar dados da entrega.

## Atualizar a integração no Google

1. Abra a planilha de clientes e pedidos e escolha **Extensões → Apps Script**.
2. Substitua o conteúdo do arquivo `Code.gs` pelo arquivo deste diretório.
3. Em **Configurações do projeto → Propriedades do script**, mantenha a propriedade `SITE_SECRET` já usada pelo site.
4. Adicione a propriedade `ORDER_NOTIFICATION_EMAIL` com o endereço de e-mail em que você quer receber cada nova solicitação. O código tenta usar o e-mail da conta que executa o script caso essa propriedade fique vazia, mas é mais seguro informar o endereço explicitamente.
5. Em **Implantar → Gerenciar implantações**, edite a implantação do tipo **Aplicativo da Web** e publique uma **nova versão**. Mantenha a execução como proprietária e o acesso que já está configurado para o site.
6. Se o Google pedir autorização novamente, autorize o acesso à planilha, agenda, Drive, Docs e envio de e-mail.
7. Confira no Vercel se `GOOGLE_APPS_SCRIPT_URL` aponta para a URL publicada terminada em `/exec` e se `GOOGLE_APPS_SCRIPT_SECRET` corresponde à propriedade `SITE_SECRET`.

**Importante:** atualizar este arquivo no GitHub não atualiza, por si só, o código já implantado no Google Apps Script. É necessário substituir o código no editor do Apps Script e publicar uma nova versão para ativar os avisos e campos novos.

## Fluxo de controle

Cada envio feito pelo site entra na aba **Pedidos** com:

- **Status do pedido:** `Orçamento recebido`.
- **Status do pagamento:** `Entrada pendente (60%)`.
- Valores calculados para total, entrada prevista de 60% e restante de 40%.
- Um link para abrir a comanda PDF.
- A coluna **Enviar ao entregador**, com um link do WhatsApp contendo nome do cliente, telefone, endereço, data, horário, itens e observações de entrega.

O link do entregador abre o WhatsApp com a mensagem pronta; você escolhe a conversa do entregador e toca em enviar. Não é uma automação da API nem envia a mensagem sem sua ação.

Depois de verificar a disponibilidade da data, atualize o status da solicitação na planilha. Quando a entrada estiver identificada, marque **Status do pagamento** como `Entrada paga (60%)` e **Status do pedido** como `Pedido confirmado (entrada paga)`. Use os demais status para acompanhar produção, entrega/retirada, conclusão ou cancelamento.

A agenda recebe o evento com o título **[ORÇAMENTO - AGUARDANDO SINAL]** para deixar claro que a solicitação ainda não é uma reserva confirmada. Depois de conferir a disponibilidade e confirmar o pagamento, atualize também a situação na planilha e, se desejar, renomeie o evento da agenda.

## Alerta por e-mail

A cada solicitação salva, o Apps Script envia um e-mail com o código do pedido, cliente, telefone, data/horário, serviço, endereço, total, entrada prevista e links diretos para a planilha e a comanda PDF. Se o e-mail falhar, o pedido continua salvo na planilha/agenda; confira o registro de execução do Apps Script e a propriedade `ORDER_NOTIFICATION_EMAIL`.

O mesmo aplicativo atualiza as abas `Pedidos` e `Clientes`, cria o compromisso no Google Agenda e gera a comanda PDF na pasta **Comandas - Doceria Brigadeiro & Beijinho**.
