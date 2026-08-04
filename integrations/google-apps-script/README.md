# Integração gratuita com Google Sheets e Agenda

1. Abra a planilha de clientes e pedidos e escolha **Extensões → Apps Script**.
2. Substitua o conteúdo de `Code.gs` pelo arquivo desta pasta.
3. Em **Configurações do projeto → Propriedades do script**, crie `SITE_SECRET` com uma senha longa e exclusiva.
4. Em **Implantar → Nova implantação → Aplicativo da Web**, execute como a proprietária e permita acesso a qualquer pessoa com o link.
5. Guarde a URL da implantação e a senha. Configure-as no site como `GOOGLE_CALENDAR_BUSY_URL` e `GOOGLE_CALENDAR_BUSY_SECRET`.

O mesmo aplicativo recebe os pedidos, atualiza as abas `Pedidos` e `Clientes`, cria o compromisso no Google Agenda e devolve ao site os horários já ocupados.
